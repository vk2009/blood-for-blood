// The open-world layer that sits on top of the story:
//  - side jobs (blue markers) with their own tracked objective and waypoint
//  - random street crimes you can stop or ignore
//  - hidden collectibles
//  - timed runs / races against a rival, and foot chases
//  - punching people in the street, which brings the Carabineros ("heat")
//  - the Journal (J)
// Content (who gives which job, where things are) lives in sidejobs.js.
import * as THREE from 'three';
import { Actor } from './director.js';
import { mat } from './character.js';
import { JOBS, COLLECTIBLES, KINDS, CRIME } from './sidejobs.js';
import { sfx } from './sfx.js';
import { makeTarget } from './range.js';
import { createRifle, muzzleFlash } from './props.js';
import { fmtPesos } from './ui.js';

const $ = (id) => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pickR = (a) => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s * 10) % 10)}`;
const polyLen = (pts) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

// ---------------------------------------------------------------- small world models
function model(kind) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const glow = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.3 });
  if (kind === 'coin') {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 14), glow('#e8c46a'));
      m.position.set(i * 0.05 - 0.05, 0.02 + i * 0.016, (i % 2) * 0.03); g.add(m);
    }
  } else if (kind === 'clipping') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.22), new THREE.MeshStandardMaterial({ color: '#efe6cf', emissive: '#b8a878', emissiveIntensity: 0.35, roughness: 0.9 }));
    m.position.y = 0.02; m.rotation.y = 0.4; g.add(m);
  } else if (kind === 'tag') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.09), glow('#cfd3d8'));
    m.position.y = 0.02; g.add(m);
  } else if (kind === 'sack') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), mat('#e8dcc0', 0.95));
    m.scale.set(1, 0.7, 0.75); m.position.y = 0.22; m.castShadow = true; g.add(m);
  } else if (kind === 'purse') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), mat('#6a2a2a', 0.6));
    m.position.y = 0.1; g.add(m);
  } else if (kind === 'drum') {
    for (const [x, z] of [[0, 0], [0.62, 0.1], [0.3, 0.6]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 14), mat('#2e5a8a', 0.5, 0.4));
      m.position.set(x, 0.45, z); m.castShadow = true; g.add(m);
    }
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), mat('#b52a1c', 0.7));
    m.position.y = 0.15; g.add(m);
  }
  return g;
}
// A glowing column marking a checkpoint.
function beacon(color, r = 1.6) {
  const g = new THREE.Group();
  g.userData.dynamic = true;
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 4.5, 28, 1, true), m);
  col.position.y = 2.25; g.add(col);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.12, r, 36), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
  return g;
}

// ================================================================ OpenWorld
export class OpenWorld {
  constructor(G, state) {
    this.G = G;
    this.state = state;
    this.api = new Map(JOBS.map((j) => [j.id, this.makeAPI(j)]));
    this.jobs = new Map(JOBS.map((j) => [j.id, j]));
    this.run = null;          // active timed run / race
    this.chase = null;        // active foot chase
    this.crime = null;        // active street crime
    this.crimeT = 25;         // seconds until the next street crime may start
    this.crimeN = 0;
    this.heat = 0;            // 0..3 stars
    this.heatT = 0;
    this.police = null;
    this.punch = 0;
    this.walkers = [];        // scripted extras (customers, the thief after a chase…)
    this.temps = [];          // temporary pickups belonging to side jobs
    this.el = {
      side: $('side-obj'), sideTitle: $('side-title'), sideText: $('side-text'), sideDist: $('side-dist'),
      timer: $('ow-timer'), heat: $('heat'), wp: $('waypoint2'), wpDist: $('wp2-dist'), journal: $('journal-body'),
    };
  }

  get S() { return this.G.S; }
  stat(k) { return this.state.stats[k] || 0; }
  addStat(k, n = 1) { this.state.stats[k] = (this.state.stats[k] || 0) + n; }

  // ------------------------------------------------ job API handed to content
  makeAPI(job) {
    const ow = this, G = this.G;
    const J = {
      job, G, ow,
      get active() { return ow.state.side?.id === job.id; },
      get step() { return J.active ? ow.state.side.step : null; },
      get done() { return !!ow.state.flags['job:' + job.id]; },
      get data() { return J.active ? ow.state.side.data : {}; },
      start(step, data = {}) {
        ow.state.side = { id: job.id, step: null, data };
        G.ui.toast(job.title, 'Side job started'); sfx.objective();
        J.go(step);
      },
      go(step) {
        if (!J.active) return;
        ow.cancelTransient();
        ow.state.side.step = step;
        job.steps?.[step]?.enter?.(J);
        ow.refreshSide(true);
        G.refresh();
      },
      complete(note) {
        if (J.active) ow.cancelTransient();
        ow.clearTemps(job.id);
        if (J.active) ow.state.side = null;
        ow.state.flags['job:' + job.id] = true;
        ow.addStat('jobs');
        G.ui.toast(note ? `${job.title} — ${note}` : job.title, 'Side job complete'); sfx.objective();
        ow.refreshSide();
        G.refresh();
      },
      fail(msg) {
        if (J.active) ow.cancelTransient();
        ow.clearTemps(job.id);
        if (J.active) ow.state.side = null;
        G.ui.toast(msg || job.title, 'Side job failed', true);
        ow.refreshSide();
        G.refresh();
      },
      refresh() { ow.refreshSide(); },
      flag: (f) => !!ow.state.flags[f],
      setFlag: (f) => { ow.state.flags[f] = true; },
      stat: (k, n) => ow.addStat(k, n),
      pickup: (cfg) => ow.addTemp(job.id, cfg),
      run: (cfg) => ow.startRun(cfg),
      chase: (cfg) => ow.startChase(cfg),
      fight: (cfg) => ow.startStreetFight(cfg),
      walker: (look, x, z, yaw) => ow.addWalker(look, x, z, yaw),
    };
    return J;
  }
  jobFor(id) { return this.api.get(id); }

  // ------------------------------------------------ setup per location
  // Runs once per location: adds side-job characters, collectibles and job spots.
  decorate(L) {
    if (L.owDone) return;
    L.owDone = true;
    for (const job of JOBS) {
      if (job.loc !== L.id) continue;
      const J = this.api.get(job.id);
      const people = [{ ...job.giver, id: 'job:' + job.id, giver: true }, ...(job.npcs || []).map((n) => ({ ...n, id: `job:${job.id}:${n.id}` }))];
      for (const p of people) {
        L.storyNpcs.push({
          ...p, wander: p.wander ?? 0.6,
          when: (S) => (p.when ? p.when(S, J) : job.avail(S) && !(J.active && job.hideGiverWhileActive)),
          talkFn: (T) => this.talkTo(job, T, p),
          jobGiver: p.giver ? job.id : null,
        });
      }
      for (const u of job.uses || []) L.interactables.push({ type: 'use', r: 1.5, ...u, when: (S) => u.when(S, J), fn: (T) => u.fn(T, this.G, this.S, J) });
      for (const d of job.dangers || []) L.dangers.push({ ...d, when: (S) => d.when(S, J) });
      for (const t of job.triggers || []) L.triggers.push({ ...t, when: (S) => t.when(S, J) });
    }
    L.owCollect = [];
    for (const c of COLLECTIBLES[L.id] || []) {
      const k = KINDS[c.kind];
      const m = model(k.model);
      m.position.set(c.x, 0, c.z);
      L.root.add(m);
      L.owCollect.push({ c, m });
      L.interactables.push({ type: 'use', x: c.x, z: c.z, r: 1.3, label: `Pick up: ${k.name}`, when: (S) => !S.flag('col:' + c.id), fn: (T) => this.collect(c, T) });
    }
  }

  async talkTo(job, T, person) {
    const J = this.api.get(job.id);
    const other = this.state.side && this.state.side.id !== job.id;
    if (person.giver && other && !J.done && !J.active && !job.instant) {
      await T.say(person.name, job.busyLine || 'Come back when you are not so busy, señor.');
      await T.say('', `*You are already busy with "${this.jobs.get(this.state.side.id).title}". Finish it first, or drop it from the Journal (J).*`);
      return;
    }
    if (!person.giver && !person.talk && person.lines) { for (const l of person.lines) await T.say(person.name, l); return; }
    await (person.talk || job.talk)(T, this.G, this.S, J);
  }

  async collect(c, T) {
    const k = KINDS[c.kind];
    this.state.flags['col:' + c.id] = true;
    sfx.item();
    if (c.pesos) { this.G.addPesos(c.pesos, k.name); this.addStat('found', c.pesos); }
    const all = Object.values(COLLECTIBLES).flat().filter((x) => x.kind === c.kind);
    const got = all.filter((x) => this.state.flags['col:' + x.id]).length;
    this.G.ui.toast(`${k.name} ${got}/${all.length}`, 'Collectible');
    if (c.title) { await T.say(c.title, c.text); }
    if (got === all.length && k.reward) { await T.say('', k.reward.text); if (k.reward.pesos) this.G.addPesos(k.reward.pesos, `All ${k.plural}`); }
  }

  // ------------------------------------------------ temporary pickups (side-job props)
  addTemp(jobId, cfg) {
    if (this.temps.some((t) => t.key === cfg.id)) return;
    const t = { key: cfg.id, job: jobId, ...cfg, loc: cfg.loc || this.jobs.get(jobId).loc };
    this.temps.push(t);
    this.placeTemp(t);
  }
  placeTemp(t) {
    const L = this.G.loc;
    if (!L || L.id !== t.loc || t.it) return;
    t.mesh = model(t.model || 'bag');
    t.mesh.position.set(t.x, 0, t.z);
    L.root.add(t.mesh);
    t.L = L;
    t.it = { type: 'use', x: t.x, z: t.z, r: t.r || 1.4, label: t.label || 'Pick up', fn: async (T) => { this.removeTemp(t); sfx.item(); await t.onTake?.(T); } };
    L.interactables.push(t.it);
  }
  removeTemp(t) {
    this.temps = this.temps.filter((x) => x !== t);
    if (t.mesh) t.mesh.parent?.remove(t.mesh);
    if (t.it && t.L) { const i = t.L.interactables.indexOf(t.it); if (i >= 0) t.L.interactables.splice(i, 1); }
    t.it = null; t.mesh = null;
  }
  clearTemps(jobId) { for (const t of [...this.temps]) if (t.job === jobId) this.removeTemp(t); }

  // ------------------------------------------------ walkers (scripted extras)
  addWalker(look, x, z, yaw = 0) {
    const a = new Actor(this.G.loc.root, this.G.looks[look] || look, x, z, yaw);
    a.noCollide = true;
    a.owLoc = this.G.loc.id;
    this.walkers.push(a);
    return a;
  }
  walkTo(a, x, z, speed = 1.4) {
    a.speed = speed; a.target = new THREE.Vector3(x, 0, z);
    return new Promise((r) => { a.onArrive = r; });
  }
  dropWalker(a) { a.remove(); this.walkers = this.walkers.filter((w) => w !== a); }

  // ------------------------------------------------ location changes
  onEnter(L) {
    this.cancelTransient('left');
    this.endCrime(true);
    this.endPolice();
    for (const w of [...this.walkers]) this.dropWalker(w);
    for (const t of this.temps) { t.it = null; t.mesh = null; this.placeTemp(t); }
    this.crimeT = Math.max(this.crimeT, 20);
    this.refreshSide();
  }
  // Stop runs and chases (a cutscene started, we left the area, a fight began…).
  cancelTransient(why = null) {
    if (this.run) { const r = this.run; this.endRun(); if (why) r.onLose?.(why); }
    if (this.chase) { const c = this.chase; this.endChase(); if (why) c.onEscape?.(why); }
  }
  // Called when a save is loaded: rebuild whatever the active side job needs.
  afterLoad() {
    this.heat = 0; this.renderHeat();
    for (const t of [...this.temps]) this.removeTemp(t);
    for (const w of [...this.walkers]) this.dropWalker(w);
    const s = this.state.side;
    if (s && this.jobs.get(s.id)) {
      const job = this.jobs.get(s.id), st = job.steps?.[s.step];
      if (st?.retry) { s.step = st.retry; }
      job.steps?.[s.step]?.enter?.(this.api.get(s.id));
    } else this.state.side = null;
    this.refreshSide();
  }
  abandon() {
    const s = this.state.side;
    if (!s) return;
    this.api.get(s.id).fail(`${this.jobs.get(s.id).title} — dropped`);
  }

  // ------------------------------------------------ side objective HUD
  sideTarget() {
    if (this.run) { const p = this.run.points[this.run.i]; return p ? { x: p[0], z: p[1] } : null; }
    if (this.chase) return { x: this.chase.a.pos.x, z: this.chase.a.pos.z };
    const s = this.state.side;
    if (!s) return null;
    const job = this.jobs.get(s.id), st = job.steps?.[s.step];
    const J = this.api.get(s.id);
    let t = typeof st?.target === 'function' ? st.target(J) : st?.target;
    if (!t) return null;
    t = { loc: job.loc, ...t };
    const L = this.G.loc;
    if (!L) return null;
    if (t.loc === L.id) return t;
    const door = L.interactables.find((it) => it.type === 'door' && it.to === t.loc);
    return door ? { x: door.x, z: door.z } : null;
  }
  refreshSide(flash = false) {
    const s = this.state.side, el = this.el;
    if (!s) { el.side.classList.remove('show'); return; }
    const job = this.jobs.get(s.id), st = job.steps?.[s.step];
    const J = this.api.get(s.id);
    el.sideTitle.textContent = `Side job · ${job.title}`;
    el.sideText.textContent = typeof st?.text === 'function' ? st.text(J) : st?.text || '';
    el.side.classList.add('show');
    if (flash) { el.side.classList.remove('flash'); void el.side.offsetWidth; el.side.classList.add('flash'); }
  }

  // ------------------------------------------------ timed runs & races
  // cfg: { points: [[x,z]...], time, label, rival: { look, name, time }, onWin(result), onLose(why) }
  startRun(cfg) {
    this.cancelTransient();
    const L = this.G.loc;
    const r = { ...cfg, i: 0, t: 0, L, beacons: [], startPos: this.G.player.pos.clone() };
    r.radius ??= 1.8;
    for (const [k, p] of r.points.entries()) {
      const b = beacon(k === r.points.length - 1 ? '#ff7a4a' : '#58c8ff', r.radius);
      b.position.set(p[0], 0, p[1]);
      b.visible = k <= 1;
      L.root.add(b);
      r.beacons.push(b);
    }
    if (cfg.rival) {
      const pts = [[r.startPos.x, r.startPos.z], ...r.points];
      r.rival = { a: new Actor(L.root, this.G.looks[cfg.rival.look], pts[0][0] + 1.2, pts[0][1], 0), pts, len: polyLen(pts), d: 0 };
      r.rival.speed = r.rival.len / cfg.rival.time;
      r.rival.name = cfg.rival.name || 'Rival';
      r.rival.a.noCollide = true;
    }
    this.run = r;
    this.el.timer.classList.add('show');
    sfx.objective();
    this.G.ui.toast(cfg.label || 'Go!', 'Go!');
  }
  endRun() {
    const r = this.run;
    if (!r) return;
    this.endStation(r);
    r.beacons.forEach((b) => b.parent?.remove(b));
    r.rival?.a.remove();
    this.run = null;
    this.el.timer.classList.remove('show');
  }
  // Shooting station: at some checkpoints the run stops until every target is down.
  // cfg.shoot = { [checkpointIndex]: [[x, z], ...] } — target positions.
  startStation(r, spots) {
    const G = this.G, cp = r.points[r.i - 1];
    const st = { targets: [], left: spots.length, rifle: createRifle(), flash: muzzleFlash(), cool: 0, flashT: 0 };
    st.rifle.position.set(-0.19, 1.34, 0.42);
    st.rifle.add(st.flash); st.flash.position.set(0, 0.04, 0.62);
    G.hero.root.add(st.rifle);
    for (const [x, z] of spots) {
      const pivot = new THREE.Group();
      pivot.userData.dynamic = true;
      pivot.position.set(x, 0, z);
      pivot.rotation.y = Math.atan2(x - cp[0], z - cp[1]);
      const t = makeTarget();
      t.userData.want = 1; t.userData.state = 'up';
      pivot.add(t);
      r.L.root.add(pivot);
      st.targets.push({ pivot, t });
    }
    G.aimCam = true;
    document.getElementById('crosshair').classList.add('show');
    G.ui.toast('Shoot every target to open the next checkpoint. Aim with the mouse, Click / F to fire.', 'Shooting station');
    r.station = st;
  }
  endStation(r) {
    const st = r.station;
    if (!st) return;
    st.rifle.parent?.remove(st.rifle);
    for (const { pivot } of st.targets) pivot.parent?.remove(pivot);
    this.G.aimCam = false;
    this.G.hero.pose.point = 0;
    document.getElementById('crosshair').classList.remove('show', 'hit');
    r.station = null;
  }
  updateStation(r, dt) {
    const G = this.G, st = r.station, I = G.input;
    st.cool -= dt; st.flashT -= dt;
    st.flash.visible = st.flashT > 0;
    G.hero.pose.point = 1;
    G.player.modelYaw = G.player.yaw;
    for (const { t } of st.targets) {
      const u = t.userData;
      u.up += (u.want - u.up) * Math.min(1, dt * 9);
      t.rotation.x = -Math.PI / 2 * (1 - u.up);
    }
    if ((I.pressed('Mouse0') || I.pressed('KeyF')) && st.cool <= 0) {
      st.cool = 0.3; st.flashT = 0.06;
      sfx.rifle(); G.shake = 0.1;
      const ray = new THREE.Raycaster();
      ray.setFromCamera({ x: 0, y: 0 }, G.camera);
      const boards = st.targets.filter(({ t }) => t.userData.state === 'up').map(({ t }) => t.userData.board);
      const hit = ray.intersectObjects(boards, false)[0];
      if (hit) {
        const g = hit.object.parent;
        g.userData.state = 'hit'; g.userData.want = 0; st.left--;
        sfx.ding();
        const c = document.getElementById('crosshair');
        c.classList.add('hit'); setTimeout(() => c.classList.remove('hit'), 120);
      } else r.misses = (r.misses || 0) + 1;
    }
    if (st.left <= 0) {
      this.endStation(r);
      r.beacons[r.i] && (r.beacons[r.i].visible = true);
      if (r.beacons[r.i + 1]) r.beacons[r.i + 1].visible = true;
      G.ui.toast('Targets down — run!', 'Shooting station');
    }
  }
  updateRun(dt) {
    const r = this.run, p = this.G.player.pos;
    r.t += dt;
    const left = r.time - r.t;
    if (r.rival) {
      const R = r.rival;
      R.d = Math.min(R.len, R.d + R.speed * dt);
      // position along the polyline
      let acc = 0;
      for (let k = 1; k < R.pts.length; k++) {
        const [ax, az] = R.pts[k - 1], [bx, bz] = R.pts[k];
        const seg = Math.hypot(bx - ax, bz - az);
        if (acc + seg >= R.d || k === R.pts.length - 1) {
          const u = seg > 0 ? Math.min(1, (R.d - acc) / seg) : 1;
          R.a.pos.set(ax + (bx - ax) * u + 0.9, 0, az + (bz - az) * u);
          R.a.yaw = Math.atan2(bx - ax, bz - az);
          break;
        }
        acc += seg;
      }
      R.a.animSpeed = R.d < R.len ? R.speed : 0;
      R.a.update(dt);
    }
    const cp = r.points[r.i];
    if (r.station) this.updateStation(r, dt);
    else if (Math.hypot(p.x - cp[0], p.z - cp[1]) < r.radius) {
      r.beacons[r.i].visible = false;
      r.i++;
      sfx.ding();
      if (r.i >= r.points.length) {
        const res = { time: r.t, misses: r.misses || 0, beatRival: !r.rival || r.rival.d < r.rival.len };
        const cb = r.onWin; this.endRun(); cb?.(res); return;
      }
      const spots = r.shoot?.[r.i - 1];
      if (spots) { r.beacons[r.i].visible = false; if (r.beacons[r.i + 1]) r.beacons[r.i + 1].visible = false; this.startStation(r, spots); }
      else {
        r.beacons[r.i].visible = true;
        if (r.beacons[r.i + 1]) r.beacons[r.i + 1].visible = true;
      }
    }
    if (r.rival && r.rival.d >= r.rival.len && !r.noRivalLose) { const cb = r.onLose; this.endRun(); cb?.('rival'); return; }
    if (left <= 0) { const cb = r.onLose; this.endRun(); cb?.('time'); return; }
    for (const [k, b] of r.beacons.entries()) if (b.visible) b.children[0].material.opacity = k === r.i ? 0.3 + Math.sin(r.t * 6) * 0.08 : 0.12;
    this.el.timer.innerHTML = `<small>${r.label || 'Run'}</small><b class="${left < 8 ? 'low' : ''}">${fmtTime(Math.max(0, left))}</b><span>${r.station ? `Targets left: ${r.station.left}` : `Checkpoint ${r.i + 1}/${r.points.length}`}${r.rival ? ` · ${r.rival.a.pos.distanceTo(p) < 3 ? 'neck and neck' : (r.rival.d / r.rival.len > this.progress(r) ? `${r.rival.name} is ahead` : 'you are ahead')}` : ''}</span>`;
  }
  progress(r) {
    const pts = [[r.startPos.x, r.startPos.z], ...r.points];
    const total = polyLen(pts);
    const done = polyLen(pts.slice(0, r.i + 1));
    const p = this.G.player.pos, nx = pts[r.i + 1] || pts[r.i];
    const seg = Math.hypot(nx[0] - pts[r.i][0], nx[1] - pts[r.i][1]);
    const toGo = Math.hypot(nx[0] - p.x, nx[1] - p.z);
    return (done + Math.max(0, seg - toGo)) / total;
  }

  // ------------------------------------------------ foot chases
  // cfg: { look, name, from:[x,z], path:[[x,z]...], speed, time, onCatch(actor), onEscape(why) }
  startChase(cfg) {
    this.cancelTransient();
    const L = this.G.loc;
    const a = new Actor(L.root, this.G.looks[cfg.look], cfg.from[0], cfg.from[1], 0);
    a.noCollide = true;
    this.chase = { ...cfg, a, i: 0, t: 0 };
    this.el.timer.classList.add('show');
    this.G.ui.toast(`Catch ${cfg.name}!`, 'Chase');
    sfx.whoosh();
  }
  endChase(keepActor = false) {
    const c = this.chase;
    if (!c) return;
    if (!keepActor) c.a.remove();
    this.chase = null;
    this.el.timer.classList.remove('show');
  }
  updateChase(dt) {
    const c = this.chase, a = c.a, p = this.G.player.pos;
    c.t += dt;
    const d = Math.hypot(p.x - a.pos.x, p.z - a.pos.z);
    if (d < (c.catchR ?? 1.5)) {
      sfx.thud(); this.G.shake = 0.3;
      a.animSpeed = 0; a.update(dt);
      const cb = c.onCatch; this.endChase(true);
      this.walkers.push(a); a.owLoc = this.G.loc.id;
      cb?.(a);
      return;
    }
    const tgt = c.path[c.i];
    if (!tgt) { const cb = c.onEscape; this.endChase(); cb?.('escaped'); return; }
    // Rubber band: slow down when far ahead so the chase stays a chase.
    const sp = c.speed * (d > 22 ? 0.75 : d > 14 ? 0.9 : 1);
    const dx = tgt[0] - a.pos.x, dz = tgt[1] - a.pos.z, dd = Math.hypot(dx, dz);
    if (dd < 0.6) c.i++;
    else { a.pos.x += (dx / dd) * sp * dt; a.pos.z += (dz / dd) * sp * dt; a.yaw = Math.atan2(dx, dz); }
    if (d > 45) { const cb = c.onEscape; this.endChase(); cb?.('lost'); return; }
    a.animSpeed = sp; a.update(dt);
    this.el.timer.innerHTML = `<small>Chase</small><b>${Math.round(d)} m</b><span>Get close to grab ${c.name}</span>`;
  }

  // ------------------------------------------------ street fights started by content or crimes
  // cfg: { id, name, at:[x,z], thugs:[{look, dx, dz, weapon}], barks, reward, speaker, loseMsg, size }
  startStreetFight(cfg) {
    const L = this.G.loc, [x, z] = cfg.at, s = cfg.size ?? 5;
    const d = {
      id: cfg.id, name: cfg.name, minX: x - s, maxX: x + s, minZ: z - s, maxZ: z + s, transient: true,
      thugs: cfg.thugs.map((t) => ({ look: t.look, x: x + (t.dx || 0), z: z + (t.dz || 0), yaw: t.yaw ?? 0, weapon: t.weapon })),
      barks: cfg.barks, reward: cfg.reward || 0, speaker: cfg.speaker, loseMsg: cfg.loseMsg, guns: cfg.guns, noEscape: cfg.noEscape, L,
      waves: cfg.waves?.map((w) => w.map((t) => ({ ...t, x: x + (t.dx || 0), z: z + (t.dz || 0) }))), waveMsg: cfg.waveMsg,
    };
    for (const t of d.thugs) { const f = this.freeNear(L, t.x, t.z); t.x = f[0]; t.z = f[1]; }
    delete this.state.flags['cleared:' + d.id];
    L.dangers.push(d);
    this.G.refresh();
    return d;
  }
  removeDanger(d) {
    const L = d.L || this.G.loc;
    if (!L) return;
    const i = L.dangers.indexOf(d);
    if (i >= 0) L.dangers.splice(i, 1);
    L.thugActors?.[d.id]?.forEach((a) => a.remove());
    if (L.thugActors) delete L.thugActors[d.id];
    delete this.state.flags['cleared:' + d.id];
  }
  freeNear(L, x, z) {
    if (L.isFree(x, z, 0.5)) return [x, z];
    for (let r = 0.6; r < 4; r += 0.5) for (let a = 0; a < 6.28; a += 0.7) {
      const nx = x + Math.cos(a) * r, nz = z + Math.sin(a) * r;
      if (L.isFree(nx, nz, 0.5)) return [nx, nz];
    }
    return [x, z];
  }
  // A random open spot on the streets, not too close and not too far.
  findSpot(L, minD, maxD, clear = 2.6) {
    const p = this.G.player.pos;
    for (let k = 0; k < 160; k++) {
      const a = Math.random() * Math.PI * 2, r = rnd(minD, maxD);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (!L.isFree(x, z, clear)) continue;
      if (L.dangers.some((d) => x > d.minX - 6 && x < d.maxX + 6 && z > d.minZ - 6 && z < d.maxZ + 6)) continue;
      if (L.triggers.some((t) => x > t.minX - 4 && x < t.maxX + 4 && z > t.minZ - 4 && z < t.maxZ + 4)) continue;
      return [x, z];
    }
    return null;
  }

  // ------------------------------------------------ random street crimes
  updateCrimes(dt) {
    const L = this.G.loc, cfg = CRIME[L.id];
    if (this.crime) {
      const c = this.crime;
      c.t -= dt;
      c.victim.update(dt);
      if (c.t <= 0 && this.G.mode === 'play') {
        this.G.ui.toast(c.ignoredMsg || 'The thieves got away with it.', 'Street crime', true);
        if (c.flagIgnored) this.state.flags[c.flagIgnored] = true;
        this.endCrime();
      }
      return;
    }
    if (!cfg || L.interior || (cfg.when && !cfg.when(this.S)) || this.run || this.chase || this.police) return;
    this.crimeT -= dt;
    if (this.crimeT > 0) return;
    this.crimeT = rnd(...cfg.interval);
    const special = cfg.special?.find((s) => !this.state.flags[s.flag] && !this.state.flags[s.flagIgnored] && (!s.when || s.when(this.S)));
    const spot = special?.at && L.isFree(special.at[0], special.at[1], 1) ? special.at : this.findSpot(L, 24, 55);
    if (!spot) return;
    const def = special || pickR(cfg.kinds);
    const n = def.thugs || 2;
    const [x, z] = spot;
    const victimLook = def.victimLook ? this.G.looks[def.victimLook] : this.G.randomLook();
    const victim = new Actor(L.root, victimLook, x, z, Math.random() * 6.28);
    victim.tweenPose('handsUp', 1, 0.2);
    const thugs = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4;
      thugs.push({ look: pickR(cfg.thugLooks), dx: Math.cos(a) * 1.4, dz: Math.sin(a) * 1.4, yaw: a + Math.PI, weapon: i === 1 && Math.random() < cfg.knife ? 'knife' : null });
    }
    const id = `ev${++this.crimeN}`;
    const d = this.startStreetFight({ id, name: def.name || 'Street robbery', at: [x, z], thugs, barks: def.barks || cfg.barks, reward: 0, size: 4 });
    // face the victim
    for (const a of L.thugActors[id] || []) a.faceTo = victim.pos;
    this.crime = {
      id, d, victim, t: def.time || 60, def, reward: Math.round(rnd(...(def.reward || cfg.reward))),
      flag: def.flag, flagIgnored: def.flagIgnored, ignoredMsg: def.ignoredMsg, zone: L.zoneAt(x, z),
    };
    this.G.ui.toast(def.alert || `¡Ayuda! Someone is being robbed on ${this.crime.zone}.`, 'Street crime', true);
    sfx.whoosh();
  }
  endCrime(silent = false) {
    const c = this.crime;
    if (!c) return;
    this.removeDanger(c.d);
    c.victim.remove();
    this.crime = null;
  }

  // ------------------------------------------------ fists in the street & the Carabineros
  updateFists(dt) {
    const G = this.G, I = G.input, L = G.loc, hero = G.hero;
    if (this.punch > 0) {
      this.punch -= dt;
      const k = 1 - this.punch / 0.32;
      hero.pose.jab = k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.65);
      if (this.punch <= 0) hero.pose.jab = 0;
    }
    if (L.interior || G.mode !== 'play' || this.run?.station || G.noFists) return;
    const want = I.pressed('KeyF') || (I.pressed('Mouse0') && I.locked);
    if (!want || this.punch > 0) return;
    this.punch = 0.32;
    sfx.whoosh();
    const p = G.player;
    let hitAny = false;
    for (const n of L.npcs) {
      const dx = n.pos.x - p.pos.x, dz = n.pos.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d > 1.6 || Math.abs(angDiff(p.modelYaw, Math.atan2(dx, dz))) > 1.1) continue;
      hitAny = true;
      n.char.pose.hurt = 1;
      this.flee(n, 7);
    }
    if (!hitAny) return;
    sfx.punch(); G.shake = 0.15;
    for (const n of L.npcs) if (Math.hypot(n.pos.x - p.pos.x, n.pos.z - p.pos.z) < 14) this.flee(n, 5);
    this.addStat('assaults');
    const cfg = CRIME[L.id];
    if (G.empire?.E && G.S.past('burial')) G.empire.add('heat', 2, 'Seen hitting people in the street');
    if (G.heroLook === 'general') {
      this.addStat('fear');
      G.ui.toast('Nobody stops a General. They only remember his face.', 'Fear', true);
      return;
    }
    if (!cfg?.police) return;
    this.heat = Math.min(3, this.heat + 1);
    this.heatT = 0;
    this.renderHeat();
    if (this.heat >= 2 && !this.police) this.callPolice();
  }
  flee(n, t) {
    const p = this.G.player.pos, L = this.G.loc;
    n.fleeT = t;
    n.baseSpeed ??= n.speed;
    n.speed = 4.2;
    const a = Math.atan2(n.pos.x - p.x, n.pos.z - p.z);
    for (let k = 0; k < 8; k++) {
      const aa = a + (k % 2 ? 1 : -1) * k * 0.3, r = 14;
      const x = n.pos.x + Math.sin(aa) * r, z = n.pos.z + Math.cos(aa) * r;
      if (L.isFree(x, z, 0.6)) { n.target.set(x, 0, z); n.state = 'walk'; n.stuck = 0; return; }
    }
  }
  updatePeds(dt) {
    for (const n of this.G.loc.npcs) {
      if (n.char.pose.hurt > 0) n.char.pose.hurt = Math.max(0, n.char.pose.hurt - dt * 2);
      if (n.fleeT > 0) { n.fleeT -= dt; if (n.fleeT <= 0) n.speed = n.baseSpeed; else if (n.state === 'idle') this.flee(n, n.fleeT); }
    }
  }
  callPolice() {
    const L = this.G.loc, p = this.G.player.pos;
    const armed = this.G.has('pistol') || this.G.has('revolver');
    const thugs = [];
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, r = armed ? rnd(16, 22) : rnd(10, 14);
      let x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      [x, z] = this.freeNear(L, x, z);
      thugs.push({ look: CRIME[L.id]?.policeLook || 'carabinero', dx: x - p.x, dz: z - p.z, yaw: Math.atan2(p.x - x, p.z - z) });
    }
    this.police = this.startStreetFight({
      id: `cops${++this.crimeN}`, name: 'Carabineros', at: [p.x, p.z], thugs, size: 30, speaker: 'Carabinero', guns: armed,
      barks: CRIME[L.id]?.policeBarks || (armed ? ['¡Alto! ¡Carabineros! Drop the weapon!', 'He is armed — take cover!'] : ['¡Alto! ¡Carabineros! On the ground!', '¡Al suelo, delincuente!', 'Hands where I can see them!']),
      loseMsg: armed ? 'The Carabineros brought you down in the street.' : 'The Carabineros beat you unconscious and dragged you to a cell.',
    });
    this.G.ui.toast(armed ? 'They are armed — and so are you. Or run far enough and they lose you.' : 'Run far enough and they lose you.', CRIME[L.id]?.policeName || 'Carabineros!', true);
  }
  endPolice() { if (this.police) { this.removeDanger(this.police); this.police = null; } }
  renderHeat() {
    const h = this.heat, el = this.el.heat;
    el.classList.toggle('show', h > 0);
    el.innerHTML = `<small>Heat</small>${'★'.repeat(h)}<i>${'★'.repeat(3 - h)}</i>`;
  }
  updateHeat(dt) {
    if (this.heat <= 0 || this.police) return;
    this.heatT += dt;
    if (this.heatT > 18) { this.heat--; this.heatT = 0; this.renderHeat(); if (!this.heat) this.G.ui.toast('The Carabineros stopped looking for you.', 'Heat'); }
  }

  // ------------------------------------------------ events from the game
  onEvent(e) {
    if (e.startsWith('won:')) {
      this.addStat('fights');
      const id = e.slice(4);
      if (this.crime?.id === id) {
        const c = this.crime;
        this.addStat('crimes');
        this.addStat('mercy');
        if (c.reward > 0) this.G.addPesos(c.reward, 'Reward from the victim');
        this.G.ui.toast(c.def.thanks || '¡Gracias, señor! ¡Que Dios se lo pague!', 'Street crime stopped');
        if (c.flag) this.state.flags[c.flag] = true;
        const v = c.victim;
        this.crime = null;
        // the victim walks off; the beaten thugs stay down
        const L = this.G.loc, i = L.dangers.indexOf(c.d);
        if (i >= 0) L.dangers.splice(i, 1);
        delete this.state.flags['cleared:' + c.id];
        v.tweenPose('handsUp', 0, 0.3);
        this.walkers.push(v); v.owLoc = L.id;
        const f = this.findSpot(L, 18, 30, 1);
        if (f) this.walkTo(v, f[0], f[1], 3).then(() => this.dropWalker(v)); else setTimeout(() => this.dropWalker(v), 3000);
      } else if (this.police?.id === id) {
        const L = this.G.loc, i = L.dangers.indexOf(this.police);
        if (i >= 0) L.dangers.splice(i, 1);
        delete this.state.flags['cleared:' + id];
        this.police = null;
        this.heat = 1; this.heatT = 0; this.renderHeat();
        this.addStat('fear');
        this.G.ui.toast('You beat the Carabineros. Someone will remember that.', 'Heat', true);
      } else {
        const L = this.G.loc, d = L.dangers.find((x) => x.id === id && x.transient);
        if (d) { L.dangers.splice(L.dangers.indexOf(d), 1); delete this.state.flags['cleared:' + id]; }
      }
    }
    if (e.startsWith('escaped:')) {
      const id = e.slice(8);
      if (this.police?.id === id) { this.endPolice(); this.heatT = 0; this.G.ui.toast('You lost them — for now.', 'Heat'); }
      if (this.crime?.id === id) this.endCrime();
      const L = this.G.loc, d = L.dangers.find((x) => x.id === id && x.transient);
      if (d) this.removeDanger(d);
    }
    const s = this.state.side;
    if (s) {
      const job = this.jobs.get(s.id);
      job.steps?.[s.step]?.on?.(e, this.api.get(s.id));
      if (this.state.side === s) job.onEvent?.(e, this.api.get(s.id));
    }
  }

  // ------------------------------------------------ per frame
  update(dt) {
    const G = this.G, L = G.loc;
    if (!L) return;
    for (const w of this.walkers) if (w.owLoc === L.id) w.update(dt, L);
    if (L.owCollect) {
      for (const { c, m } of L.owCollect) {
        m.visible = !this.state.flags['col:' + c.id];
        if (m.visible) { m.rotation.y += dt * 1.5; m.position.y = 0.05 + Math.sin(performance.now() / 400 + c.x) * 0.04; }
      }
    }
    if (G.mode === 'play' || G.mode === 'fight') {
      if (this.run && G.mode === 'play') this.updateRun(dt);
      if (this.chase && G.mode === 'play') this.updateChase(dt);
      this.updateCrimes(dt);
      this.updateHeat(dt);
    }
    if (G.mode === 'fight' && (this.run || this.chase)) this.cancelTransient('fight');
    this.updateFists(dt);
    this.updatePeds(dt);
    this.updateWaypoint();
    this.updateSideDist();
  }
  updateSideDist() {
    const t = this.state.side || this.run || this.chase ? this.sideTarget() : null;
    const p = this.G.player.pos;
    this.el.sideDist.textContent = t ? `${Math.round(Math.hypot(t.x - p.x, t.z - p.z))} m` : '';
  }

  // Blue waypoint for the side job (the gold one belongs to the story).
  updateWaypoint() {
    const G = this.G, el = this.el.wp;
    const t = (G.mode === 'play' || G.mode === 'fight') ? this.sideTarget() : null;
    if (!t) { el.style.display = 'none'; return; }
    const p = G.player.pos, cam = G.camera;
    const dist = Math.hypot(t.x - p.x, t.z - p.z);
    this.el.wpDist.textContent = `${Math.round(dist)} m`;
    el.style.display = dist < 1.4 ? 'none' : 'block';
    const v = new THREE.Vector3(t.x, 1.7, t.z);
    const csp = v.clone().applyMatrix4(cam.matrixWorldInverse);
    v.project(cam);
    const W = innerWidth, H = innerHeight, m = 48;
    let sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
    const behind = csp.z > 0;
    if (behind || sx < m || sx > W - m || sy < m || sy > H - m) {
      const dx = csp.x; let dy = behind ? Math.abs(csp.y) + 1 : -csp.y;
      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) dy = 1;
      const k = Math.min((W / 2 - m) / Math.max(Math.abs(dx), 1e-4), (H / 2 - m) / Math.max(Math.abs(dy), 1e-4));
      sx = W / 2 + dx * k; sy = H / 2 + dy * k;
    }
    el.style.left = `${sx}px`; el.style.top = `${sy}px`;
  }

  // ------------------------------------------------ minimap (drawn inside the map transform)
  drawMap(c, X, Z, zoom) {
    const L = this.G.loc, S = this.S, now = performance.now() / 1000;
    const dot = (x, z, r, fill, stroke) => { c.beginPath(); c.arc(X(x), Z(z), r / zoom, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5 / zoom; c.stroke(); } };
    // job givers with work on offer
    for (const n of L.storyNpcObjs?.values() || []) {
      const id = n.def?.jobGiver;
      if (!id) continue;
      const J = this.api.get(id);
      if (J.done || J.active) continue;
      dot(n.pos.x, n.pos.z, 5.5, '#3aa0ff', '#fff');
    }
    if (this.crime) dot(this.crime.victim.pos.x, this.crime.victim.pos.z, 5 + Math.sin(now * 8) * 1.5, '#ff3a2a', '#fff');
    if (this.run) for (let k = this.run.i; k < Math.min(this.run.points.length, this.run.i + 2); k++) dot(this.run.points[k][0], this.run.points[k][1], k === this.run.i ? 5 : 3.5, k === this.run.i ? '#58c8ff' : 'rgba(88,200,255,0.5)');
    if (this.run?.rival) dot(this.run.rival.a.pos.x, this.run.rival.a.pos.z, 3.5, '#ffa040');
    if (this.chase) dot(this.chase.a.pos.x, this.chase.a.pos.z, 4.5, '#ff8a3a', '#fff');
    for (const t of this.temps) if (t.loc === L.id) dot(t.x, t.z, 3.5, '#58c8ff');
    // collectibles show up only once you are close
    const p = this.G.player.pos;
    for (const { c: col } of L.owCollect || []) if (!S.flag('col:' + col.id) && Math.hypot(col.x - p.x, col.z - p.z) < 18) dot(col.x, col.z, 2.5, 'rgba(232,196,106,0.85)');
  }

  // ------------------------------------------------ journal
  renderJournal(chapter, objective) {
    const S = this.S, st = this.state;
    const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const rows = [];
    rows.push(`<section><h3>Story</h3><p class="j-main"><span class="obj-diamond"></span>${esc(objective || '—')}</p><small>${esc(chapter || '')}</small></section>`);
    const jobs = JOBS.filter((j) => st.flags['job:' + j.id] || st.side?.id === j.id || j.avail(S));
    rows.push(`<section><h3>Side jobs</h3>${jobs.length ? '' : '<p class="j-dim">Nobody needs anything from you here. Explore — people with work for you show as blue dots on the map.</p>'}<ul class="j-jobs">${jobs.map((j) => {
      const done = st.flags['job:' + j.id], act = st.side?.id === j.id;
      return `<li class="${done ? 'done' : act ? 'act' : ''}"><b>${done ? '✓' : act ? '▶' : '•'}</b><span>${esc(j.title)}<small>${esc(done ? 'Complete' : act ? 'In progress' : j.blurb || 'Available')}</small></span></li>`;
    }).join('')}</ul>${st.side ? '<button data-act="abandon" class="j-btn">Drop current side job</button>' : ''}</section>`);
    const kinds = Object.entries(KINDS).map(([k, K]) => {
      const all = Object.values(COLLECTIBLES).flat().filter((c) => c.kind === k);
      const got = all.filter((c) => st.flags['col:' + c.id]);
      const lore = got.filter((c) => c.title).map((c) => `<details><summary>${esc(c.title)}</summary><p>${esc(c.text)}</p></details>`).join('');
      return `<li><b>${K.icon}</b><span>${esc(K.plural)}<small>${got.length} / ${all.length} found${K.where ? ' · ' + esc(K.where) : ''}</small>${lore}</span></li>`;
    });
    rows.push(`<section><h3>Collectibles</h3><ul class="j-jobs">${kinds.join('')}</ul></section>`);
    const s = st.stats;
    const fear = (s.fear || 0) - (s.mercy || 0);
    const rep = fear >= 4 ? 'Feared. People cross the street when they see you.' : fear >= 1 ? 'Cold. People are careful around you.' : fear <= -4 ? 'Respected. People in the street trust you.' : fear <= -1 ? 'Decent. Word gets around that you help.' : 'Unknown. Nobody has made up their mind about you.';
    const bond = s.bond || 0;
    const bondTxt = !S.past('mateoScene') ? '' : bond >= 4 ? 'Brothers. He would die for you.' : bond >= 2 ? 'Friends. He trusts you more than he should.' : bond >= 0 ? 'Partners. Careful, but warming.' : 'Wary. He is not sure what you are.';
    rows.push(`<section><h3>Record</h3><ul class="j-stats">
      <li><span>Street crimes stopped</span><b>${s.crimes || 0}</b></li>
      <li><span>Fights won</span><b>${s.fights || 0}</b></li>
      <li><span>Side jobs done</span><b>${s.jobs || 0}</b></li>
      <li><span>Pesos found in the street</span><b>$ ${fmtPesos(s.found || 0)}</b></li>
      <li><span>Reputation</span><b>${rep}</b></li>
      ${bondTxt && !S.past('finale') ? `<li><span>${S.past('newNames') ? 'Max' : 'Mateo'}</span><b>${bondTxt}</b></li>` : ''}
    </ul></section>`);
    const E = st.empire;
    if (E && S.past('burial')) {
      const crew = ['victor', 'tyrus', 'mike', 'gale', 'saul'].filter((k) => st.flags['crew:' + k]).length;
      const strikes = [
        ['Llantera El Tío', st.flags['job:revTires'], 'Recruit Tyrus (or reach 45 fear) — he brings you the job'],
        ['The Shipment', st.flags['job:revHighway'], 'Recruit Mike — he brings you the job'],
        ['The Man Who Held Me Down', st.flags['job:revRogelio'], 'Finish two strikes, and keep Victor — he finds the name'],
      ];
      rows.push(`<section><h3>Empire</h3><ul class="j-stats">
        <li><span>Week</span><b>${E.week}</b></li>
        <li><span>Reputation · Product · Fear · Heat</span><b>${E.rep} · ${E.product} · ${E.fear} · ${E.heat}</b></li>
        <li><span>Restaurants · routes</span><b>${E.restaurants} · ${E.routes}</b></li>
        <li><span>Crew</span><b>${crew}/5</b></li>
      </ul>${S.past('empire') && this.G.empire ? `<ul class="j-jobs">${this.G.empire.warLines().map((l) => `<li><b>${l.includes('✓') ? '✓' : l.includes('✗') ? '✗' : '•'}</b><span>${esc(l.replace(/ ?[✓✗→] ?/, ' — '))}</span></li>`).join('')}</ul>` : ''}<ul class="j-jobs">${strikes.map(([t, done, how]) => `<li class="${done ? 'done' : ''}"><b>${done ? '✓' : '•'}</b><span>${esc(t)}<small>${esc(done ? 'Done' : how)}</small></span></li>`).join('')}</ul></section>`);
    }
    this.el.journal.innerHTML = rows.join('');
  }
}
