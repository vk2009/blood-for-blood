// Gunfights. Non-graphic: anyone who is hit simply goes down — no blood, no gore.
// Hold right-click / Q to aim over the shoulder, click / F to fire, R to reload.
// Enemies move between spots, fire when they can see you, and buildings block
// bullets both ways, so cover matters. Stay out of sight to catch your breath.
// Same interface as Brawl (combat.js) so main.js can run either one.
import * as THREE from 'three';
import { lerpAngle } from './npc.js';
import { fallYaw } from './combat.js';
import { sfx } from './sfx.js';
import { mat } from './character.js';

const ENEMY_HP = 60;
const SHOT_DMG = 34;
const MAG = 8;
const PLAYER_HP = 100;

export function createPistol() {
  const g = new THREE.Group();
  const steel = mat('#232326', 0.35, 0.8);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.05), mat('#3a2a1c', 0.7));
  grip.position.set(0, -0.05, -0.02); grip.rotation.x = 0.25; g.add(grip);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.19), steel);
  slide.position.set(0, 0.01, 0.06); g.add(slide);
  return g;
}
function flashMesh() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  m.scale.set(1, 1, 2); m.visible = false;
  m.add(new THREE.PointLight('#ffb050', 6, 5, 2));
  return m;
}

class Shooter {
  constructor(actor, home) {
    this.a = actor; this.home = home;
    this.hp = ENEMY_HP; this.down = false; this.fall = 0;
    this.state = 'move'; this.t = 0.4 + Math.random(); this.fireT = 0.8 + Math.random() * 1.2;
    this.goal = null; this.vel = new THREE.Vector3();
    this.flinch = 0;
  }
  get pos() { return this.a.pos; }
}

export class Gunfight {
  constructor(G, danger, actors) {
    this.G = G;
    this.danger = danger;
    this.enemies = actors.map((a, i) => new Shooter(a, danger.thugs[i]));
    this.over = null; this.endT = 0; this.escapeT = 0;
    this.ray = new THREE.Raycaster();
    this.ammo = MAG; this.reload = 0; this.cool = 0; this.flashT = 0; this.kick = 0;
    this.safeT = 0;
    this.tracers = [];
    const p = G.player;
    p.atk = 0; p.blocking = false; p.dodge = 0; p.dead = 0; p.stun = 0;
    // every shooter carries a pistol and an invisible hitbox
    for (const e of this.enemies) {
      e.gun = createPistol(); e.gun.position.set(-0.2, 1.3, 0.4); e.a.root.add(e.gun);
      e.flash = flashMesh(); e.flash.position.set(0, 0.01, 0.2); e.gun.add(e.flash);
      e.hit = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.8 * e.a.h, 8), new THREE.MeshBasicMaterial({ visible: false }));
      e.hit.position.y = 0.9 * e.a.h; e.hit.userData.shooter = e;
      e.a.root.add(e.hit);
      e.a.tweenPose('point', 0.85, 0.3);
    }
    this.pistol = createPistol(); this.pistol.position.set(-0.2, 1.32, 0.42);
    this.pflash = flashMesh(); this.pflash.position.set(0, 0.01, 0.2); this.pistol.add(this.pflash);
    G.hero.root.add(this.pistol);
    G.ui.setHealth(p.hp / PLAYER_HP);
    this.cross = document.getElementById('crosshair');
    this.cross.classList.add('show');
    this.hud = document.getElementById('ammo');
    document.body.classList.add('gunfight');
    this.plates = this.enemies.map(() => {
      const el = document.createElement('div');
      el.className = 'plate enemy';
      el.innerHTML = '<i><b></b></i>';
      G.ui.el.plates.appendChild(el);
      return el;
    });
    this.renderAmmo();
  }

  dispose() {
    for (const el of this.plates) el.remove();
    for (const e of this.enemies) { e.a.root.remove(e.gun); e.a.root.remove(e.hit); e.a.tweenPose('point', 0, 0.2); }
    this.G.hero.root.remove(this.pistol);
    this.G.hero.pose.point = 0;
    for (const t of this.tracers) t.line.parent?.remove(t.line);
    this.cross.classList.remove('show', 'hip', 'hit');
    document.body.classList.remove('gunfight');
    this.hud.classList.remove('show');
  }
  get aiming() { return this.G.input.down('Mouse2', 'KeyQ') && !this.G.player.dead; }
  // The player faces where they aim while aiming.
  faceYaw() { return this.aiming ? this.G.player.yaw : null; }
  nearest() { return null; }
  renderAmmo() {
    this.hud.classList.add('show');
    this.hud.innerHTML = this.reload > 0 ? '<b>Reloading…</b>' : `<b>${this.ammo}</b> / ${MAG}<small>R reload</small>`;
  }

  // ------------------------------------------------ player
  updatePlayer(dt, move, input) {
    const G = this.G, p = G.player, hero = G.hero;
    if (p.dead) {
      p.dead += dt;
      G.heroExtraRot.x = THREE.MathUtils.lerp(G.heroExtraRot.x, -Math.PI / 2, Math.min(1, dt * 6));
      hero.pose.point = 0;
      return 0;
    }
    const aiming = this.aiming;
    this.cool -= dt; this.flashT -= dt; this.kick = Math.max(0, this.kick - dt * 6);
    this.pflash.visible = this.flashT > 0;
    hero.pose.point = THREE.MathUtils.lerp(hero.pose.point || 0, aiming || this.cool > 0 ? 1 : 0.15, Math.min(1, dt * 12));
    hero.pose.hurt = Math.max(0, hero.pose.hurt - dt * 3);
    this.cross.classList.toggle('hip', !aiming);
    if (this.reload > 0) {
      this.reload -= dt;
      if (this.reload <= 0) { this.ammo = MAG; this.renderAmmo(); sfx.click(); }
    } else if (input.pressed('KeyR') && this.ammo < MAG) {
      this.reload = 1.5; this.renderAmmo(); sfx.click();
    } else if ((input.pressed('Mouse0') || input.pressed('KeyF')) && this.cool <= 0) {
      if (this.ammo <= 0) { sfx.click(); this.reload = 1.5; this.renderAmmo(); }
      else this.fire(aiming);
    }
    // catch your breath out of sight
    this.safeT += dt;
    if (this.safeT > 4 && p.hp < 70) { p.hp = Math.min(70, p.hp + dt * 7); G.ui.setHealth(p.hp / PLAYER_HP); }
    return aiming ? 0.5 : 1.0;
  }
  fire(aiming) {
    const G = this.G, cam = G.camera;
    this.ammo--; this.cool = 0.26; this.flashT = 0.05; this.kick = 1;
    sfx.gunshot(); G.shake = Math.max(G.shake, 0.12);
    if (!aiming) G.player.modelYaw = G.player.yaw;
    const spread = aiming ? 0.006 : 0.05;
    this.ray.setFromCamera({ x: (Math.random() - 0.5) * spread * 2, y: (Math.random() - 0.5) * spread * 2 }, cam);
    const live = this.enemies.filter((e) => !e.down).map((e) => e.hit);
    const hits = this.ray.intersectObjects([...live, ...G.loc.occluders], false);
    const h = hits.find((x) => x.distance > 1.2);   // skip the wall right behind the camera
    if (h?.object.userData.shooter) {
      const e = h.object.userData.shooter;
      e.hp -= SHOT_DMG;
      e.flinch = 0.3; e.a.tweenPose('hurt', 1, 0.05);
      this.cross.classList.add('hit'); setTimeout(() => this.cross.classList.remove('hit'), 120);
      sfx.thud();
      if (e.hp <= 0) this.knockDown(e);
      else if (e.state !== 'move') { e.state = 'move'; e.goal = null; e.t = 0; }   // hit enemies look for new cover
    }
    this.renderAmmo();
  }
  knockDown(e) {
    e.down = true;
    e.a.yaw = fallYaw(this.G.loc, e.a.pos, e.a.yaw);
    e.a.tweenPose('point', 0, 0.1); e.a.tweenPose('hurt', 1, 0.1);
    e.gun.visible = false;
    sfx.thud();
  }

  // ------------------------------------------------ enemies
  canSee(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const d = dir.length(); dir.normalize();
    this.ray.set(from, dir); this.ray.far = d - 0.4;
    return this.ray.intersectObjects(this.G.loc.occluders, false).length === 0;
  }
  pickSpot(e) {
    const L = this.G.loc, p = this.G.player.pos;
    const eye = new THREE.Vector3();
    for (let k = 0; k < 24; k++) {
      const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 9;
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      if (!L.isFree(x, z, 0.6)) continue;
      if (Math.hypot(x - e.pos.x, z - e.pos.z) > 14) continue;
      eye.set(x, 1.5, z);
      if (k < 16 && !this.canSee(eye, new THREE.Vector3(p.x, 1.4, p.z))) continue;
      return new THREE.Vector3(x, 0, z);
    }
    return null;
  }
  update(dt) {
    const G = this.G, p = G.player;
    const target = new THREE.Vector3(p.pos.x, 1.35, p.pos.z);
    const muzzle = new THREE.Vector3();
    for (const [i, e] of this.enemies.entries()) {
      const a = e.a;
      e.flash.visible = false;
      if (e.down) {
        e.fall = Math.min(1, e.fall + dt * 3);
        a.extraRot.x = -Math.PI / 2 * e.fall * e.fall;
        a.pos.y = 0.16 * a.h * e.fall * e.fall;
        a.update(dt);
        this.plates[i].style.display = 'none';
        continue;
      }
      e.t -= dt; e.flinch -= dt;
      if (e.flinch <= 0) a.tweenPose('hurt', 0, 0.2);
      const dx = p.pos.x - a.pos.x, dz = p.pos.z - a.pos.z, d = Math.hypot(dx, dz);
      let speed = 0;
      if (e.state === 'move') {
        if (!e.goal) e.goal = this.pickSpot(e) || a.pos.clone();
        const gx = e.goal.x - a.pos.x, gz = e.goal.z - a.pos.z, gd = Math.hypot(gx, gz);
        if (gd < 0.4 || e.t < -3) { e.state = 'shoot'; e.t = 1.6 + Math.random() * 1.8; e.goal = null; }
        else { speed = 3.4; a.pos.x += (gx / gd) * speed * dt; a.pos.z += (gz / gd) * speed * dt; a.yaw = lerpAngle(a.yaw, Math.atan2(gx, gz), Math.min(1, dt * 10)); }
      } else {
        a.yaw = lerpAngle(a.yaw, Math.atan2(dx, dz), Math.min(1, dt * 8));
        e.fireT -= dt;
        muzzle.set(a.pos.x + Math.sin(a.yaw) * 0.5, 1.4, a.pos.z + Math.cos(a.yaw) * 0.5);
        const sees = this.canSee(muzzle, target);
        if (e.fireT <= 0 && !p.dead && e.flinch <= 0) {
          e.fireT = 0.9 + Math.random() * 0.6;
          if (sees && d < 30) this.enemyShot(e, muzzle, target, d);
        }
        if (e.t <= 0 || (!sees && e.t < 1)) { e.state = 'move'; e.t = 0; }
      }
      G.loc.collide(a.pos, a.radius);
      a.animSpeed = speed; a.faceTo = null; a.target = null;
      a.update(dt);
      const pl = this.plates[i];
      pl.firstChild.firstChild.style.width = `${Math.max(0, e.hp / ENEMY_HP) * 100}%`;
      G.placePlate(pl, a.pos, 2.15);
    }
    // tracers fade quickly
    for (let k = this.tracers.length - 1; k >= 0; k--) {
      const t = this.tracers[k]; t.t -= dt;
      if (t.t <= 0) { t.line.parent?.remove(t.line); this.tracers.splice(k, 1); }
    }
    if (!this.over) {
      if (this.enemies.every((e) => e.down)) { this.over = 'win'; this.endT = 1.2; }
      else if (p.hp <= 0) { this.over = 'lose'; this.endT = 2.0; }
      else if (!this.danger.noEscape) {
        const nearest = Math.min(...this.enemies.filter((e) => !e.down).map((e) => Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z)));
        this.escapeT = nearest > 38 ? this.escapeT + dt : 0;
        if (this.escapeT > 1.5) { this.over = 'escape'; this.endT = 0.01; }
      }
    } else {
      this.endT -= dt;
      if (this.endT <= 0) return this.over;
    }
    return null;
  }
  enemyShot(e, from, to, d) {
    const G = this.G, p = G.player;
    e.flash.visible = true;
    sfx.gunshot();
    const moving = G.input.down('ShiftLeft', 'ShiftRight') && G.input.down('KeyW', 'KeyA', 'KeyS', 'KeyD');
    let chance = d < 8 ? 0.5 : d < 15 ? 0.36 : 0.2;
    if (moving) chance *= 0.55;
    const hit = Math.random() < chance;
    const end = to.clone();
    if (!hit) end.add(new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 2.4));
    const geo = new THREE.BufferGeometry().setFromPoints([from, end]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0.7 }));
    G.loc.root.add(line);
    this.tracers.push({ line, t: 0.06 });
    if (!hit) return;
    this.safeT = 0;
    p.hp -= 7 + Math.random() * 4;
    G.hero.pose.hurt = 1; G.ui.hit(); G.ui.setHealth(p.hp / PLAYER_HP);
    G.shake = Math.max(G.shake, 0.25);
    sfx.hit();
    if (p.hp <= 0) { p.dead = 0.001; p.modelYaw = fallYaw(G.loc, p.pos, p.modelYaw); sfx.thud(); }
  }
}
