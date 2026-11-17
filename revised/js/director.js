// Cutscene director. Scenes are async scripts:
//   await d.say('Mateo', 'Please...');  d.cam([x,y,z], [lx,ly,lz]);  await d.walk(a, x, z);
// Every wait resolves instantly once the player skips (Tab), so a skipped
// scene still runs all its state changes and ends in the same place.
import * as THREE from 'three';
import { createCharacter } from './character.js';
import { lerpAngle } from './npc.js';

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const ABORT = new Error('cutscene aborted');
const smooth = (k) => k * k * (3 - 2 * k);

export class Actor {
  constructor(parent, look, x, z, yaw = 0) {
    this.char = createCharacter(look);
    this.root = this.char.root;
    parent.add(this.root);
    this.pos = new THREE.Vector3(x, 0, z);
    this.yaw = yaw;
    this.target = null;
    this.speed = 1.4;
    this.moving = 0;
    this.onArrive = null;
    this.tweens = [];
    this.faceTo = null;
    this.extraRot = new THREE.Euler();
    this.radius = 0.35;
    this.h = look.height ?? 1;
    this.noCollide = false;   // sitting / lying / scripted falls
    this.stuckT = 0; this.lastD = Infinity;
    this.sync();
  }
  get pose() { return this.char.pose; }
  sync() {
    this.root.position.copy(this.pos);
    this.root.rotation.set(this.extraRot.x, this.yaw, this.extraRot.z, 'YXZ');
    this.char.blob.visible = Math.abs(this.extraRot.x) < 0.2 && this.pos.y < 0.05 && this.pos.y > -0.1;
  }
  arrive() {
    this.target = null; this.stuckT = 0; this.lastD = Infinity;
    const cb = this.onArrive; this.onArrive = null; cb?.();
  }
  update(dt, world = null) {
    this.moving = 0;
    if (this.target) {
      const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      const step = this.speed * dt;
      if (d <= step || d < 0.05) {
        this.pos.x = this.target.x; this.pos.z = this.target.z;
        this.arrive();
      } else {
        this.pos.x += (dx / d) * step; this.pos.z += (dz / d) * step;
        this.yaw = lerpAngle(this.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
        this.moving = this.speed;
        // Never walk through walls or furniture; give up if blocked for a moment.
        if (world && !this.noCollide) {
          world.collide(this.pos, this.radius);
          const nd = Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z);
          this.stuckT = nd > this.lastD - step * 0.25 ? this.stuckT + dt : 0;
          this.lastD = nd;
          if (this.stuckT > 0.6) this.arrive();
        }
      }
    } else if (this.faceTo) {
      const f = this.faceTo;
      this.yaw = lerpAngle(this.yaw, Math.atan2(f.x - this.pos.x, f.z - this.pos.z), Math.min(1, dt * 6));
    }
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      this.char.pose[tw.key] = tw.from + (tw.to - tw.from) * smooth(k);
      if (k >= 1) this.tweens.splice(i, 1);
    }
    this.sync();
    this.char.update(dt, this.animSpeed ?? this.moving, false);
  }
  tweenPose(key, to, dur = 0.35) {
    this.tweens = this.tweens.filter((t) => t.key !== key);
    if (dur <= 0) { this.char.pose[key] = to; return; }
    this.tweens.push({ key, from: this.char.pose[key], to, dur, t: 0 });
  }
  remove() { this.root.parent?.remove(this.root); }
}

export class Director {
  constructor(G) {
    this.G = G;
    this.active = false;
    this.skip = false;
    this.actors = new Map();
    this.waits = [];
    this.updaters = [];
    this.props = [];
    this.camAnim = null;
    this.camFn = null;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.focus = new THREE.Vector3();
    this.t = 0;
  }

  async run(script) {
    const G = this.G;
    this.active = true;
    this.skip = false;
    this.t = 0;
    G.ui.cinema(true);
    try {
      await script(this, G);
    } catch (e) {
      if (e !== ABORT) console.error('Cutscene error', e);
    } finally {
      if (this.dead) return;
      this.cleanup();
      this.active = false;
      G.ui.cinema(false);
      G.ui.hideCard(true);
      G.talk.close();
    }
  }

  // Stop this scene for good (e.g. a save was loaded mid-scene). The script
  // throws at its next director call, so it can never touch the world again.
  abort() {
    if (this.dead) return;
    this.dead = true;
    this.skip = true;
    this.cleanup();
    this.active = false;
    this.G.ui.cinema(false);
    this.G.ui.qte(null);
    this.G.talk.close();
  }
  guard() { if (this.dead) throw ABORT; }

  cleanup() {
    for (const a of this.actors.values()) a.remove();
    this.actors.clear();
    for (const p of this.props) p.parent?.remove(p);
    this.props = [];
    this.updaters = [];
    this.waits.forEach((w) => w.resolve());
    this.waits = [];
    this.camAnim = null; this.camFn = null;
  }

  // ---- scene setup
  // Switching set lifts any fade (cards sit above the fade, so nothing flashes).
  set(locId) { this.guard(); this.G.showLoc(locId); this.root = this.G.loc.root; this.G.ui.fade(false); return this.G.loc; }
  actor(key, look, x, z, yaw = 0) { this.guard();
    this.actors.get(key)?.remove();
    const a = new Actor(this.G.loc.root, this.G.looks[look] || look, x, z, yaw);
    this.actors.set(key, a);
    return a;
  }
  get(key) { return this.actors.get(key); }
  drop(key) { this.actors.get(key)?.remove(); this.actors.delete(key); }
  prop(obj, x = 0, y = 0, z = 0) { this.guard(); obj.position.set(x, y, z); this.G.loc.root.add(obj); this.props.push(obj); return obj; }
  every(fn) { this.guard(); this.updaters.push(fn); return () => { this.updaters = this.updaters.filter((f) => f !== fn); }; }

  // ---- camera: cam(from, look, { to, lookTo, dur })
  cam(from, look, opts = {}) { this.guard();
    this.camFn = null;
    this.camAnim = {
      from: V(from), to: V(opts.to || from), look: V(look), lookTo: V(opts.lookTo || look),
      dur: opts.dur || 0.0001, t: 0, ease: opts.linear ? (k) => k : smooth,
    };
    this.applyCam(0);
  }
  // Camera driven by a function (t, camera) for tracking shots.
  camWith(fn) { this.guard(); this.camAnim = null; this.camFn = fn; fn(0, this.G.camera); }
  applyCam(dt) {
    const c = this.G.camera;
    if (this.camFn) { this.camFn(this.t, c); this.keepInside(c); return; }
    const A = this.camAnim;
    if (!A) return;
    A.t += dt;
    const k = A.ease(Math.min(1, A.t / A.dur));
    this.camPos.lerpVectors(A.from, A.to, k);
    this.camLook.lerpVectors(A.look, A.lookTo, k);
    c.position.copy(this.camPos);
    this.keepInside(c);
    c.lookAt(this.camLook);
    this.focus.copy(this.camLook);
  }

  // Never let a cutscene camera leave an interior room.
  keepInside(c) {
    const L = this.G.loc;
    if (!L?.interior) return;
    const B = L.bounds, m = 0.25;
    c.position.x = Math.max(B.minX + m, Math.min(B.maxX - m, c.position.x));
    c.position.z = Math.max(B.minZ + m, Math.min(B.maxZ - m, c.position.z));
    c.position.y = Math.min(c.position.y, (L.ceiling || 3) - 0.2);
  }

  // ---- timing
  wait(sec) { this.guard();
    if (this.skip || sec <= 0) return Promise.resolve();
    return new Promise((resolve) => this.waits.push({ t: sec, resolve }));
  }
  walk(actor, x, z, speed = 1.4) { this.guard();
    if (this.skip) { actor.pos.set(x, 0, z); actor.target = null; actor.sync(); return Promise.resolve(); }
    actor.speed = speed;
    actor.target = new THREE.Vector3(x, 0, z);
    return new Promise((resolve) => {
      actor.onArrive = resolve;
      this.waits.push({ t: 1e9, resolve, actor });
    });
  }
  // Walk through a list of [x, z] waypoints (to route around furniture).
  async walkPath(actor, pts, speed = 1.4) {
    for (const [x, z] of pts) await this.walk(actor, x, z, speed);
  }
  pose(actor, key, to, dur = 0.35) { actor.tweenPose(key, to, this.skip ? 0 : dur); }
  face(actor, target) { actor.faceTo = target.pos || target; }

  // ---- text
  say(name, text, opts = {}) { this.guard();
    if (this.skip) return Promise.resolve();
    return this.G.talk.say(name, text, { cinematic: true, ...opts });
  }
  async choose(options, def = 0, title = '') { this.guard();
    if (this.skip) return def;
    const i = await this.G.talk.choice(options, title);
    return this.skip ? def : i;
  }
  async card(title, sub = '', dur = 3.2) { this.guard();
    this.G.ui.showCard(title, sub);
    if (!this.skip) await Promise.race([this.wait(dur), this.G.talk.waitAdvance(0.6)]);
    this.G.ui.hideCard();
    await this.wait(0.7);
  }
  async fadeOut(t = 0.6) { this.guard(); this.G.ui.fade(true); await this.wait(t); }
  async fadeIn(t = 0.6) { this.guard(); this.G.ui.fade(false); await this.wait(t); }
  // Quick-time prompt: resolves when the key is pressed (or skipped).
  prompt(label, keys = ['KeyE', 'Mouse0']) { this.guard();
    if (this.skip) return Promise.resolve(true);
    this.G.ui.qte(label);
    return new Promise((resolve) => {
      const w = { t: 1e9, resolve: () => { this.G.ui.qte(null); resolve(true); }, keys };
      this.waits.push(w);
    });
  }

  doSkip() {
    if (this.skip) return;
    this.skip = true;
    this.G.talk.close(true);
    this.G.ui.qte(null);
    for (const a of this.actors.values()) {
      if (a.target) { a.pos.copy(a.target); a.target = null; a.sync(); }
      for (const tw of a.tweens) a.char.pose[tw.key] = tw.to;
      a.tweens = [];
    }
    const ws = this.waits; this.waits = [];
    ws.forEach((w) => w.resolve());
  }

  update(dt) {
    const G = this.G;
    this.t += dt;
    if (G.input.pressed('Tab') && !G.paused) this.doSkip();
    for (let i = this.waits.length - 1; i >= 0; i--) {
      const w = this.waits[i];
      if (w.actor) { if (!w.actor.target) { this.waits.splice(i, 1); w.resolve(); } continue; }
      if (w.keys) { if (w.keys.some((k) => G.input.pressed(k))) { this.waits.splice(i, 1); w.resolve(); } continue; }
      w.t -= dt;
      if (w.t <= 0) { this.waits.splice(i, 1); w.resolve(); }
    }
    for (const a of this.actors.values()) a.update(dt, this.G.loc);
    for (const f of this.updaters) f(dt, this.t);
    this.applyCam(dt);
  }
}
