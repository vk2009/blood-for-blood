// Street fistfights. Thugs wait in dangerous alleys; walking in starts a
// brawl. Click/F punches (alternating jab and cross), hold right-click/C
// to block, Space dodges. Win and the alley is clear; lose and it's game over;
// run far enough and they give up the chase.
import * as THREE from 'three';
import { lerpAngle } from './npc.js';
import { sfx } from './sfx.js';
import { createKnife } from './props.js';

const PLAYER_HP = 100;
const ENEMY_HP = 42;
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// Pick a yaw so that falling backwards lands the body on open floor, not in a wall.
export function fallYaw(L, pos, yaw, len = 1.75) {
  for (const off of [0, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI / 4, -Math.PI / 4]) {
    const y = yaw + off;
    let ok = true;
    for (const k of [0.45, 0.9, 1.35, len]) if (!L.isFree(pos.x - Math.sin(y) * k, pos.z - Math.cos(y) * k, 0.22)) { ok = false; break; }
    if (ok) return y;
  }
  return yaw;
}

class Enemy {
  constructor(actor, home) {
    this.a = actor;
    this.home = home;
    this.hp = ENEMY_HP;
    this.state = 'approach';
    this.t = 0;
    this.cool = 0.6 + Math.random() * 1.2;
    this.down = false;
    this.fall = 0;
    this.knock = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.strafe = Math.random() < 0.5 ? -1 : 1;
    this.strafeT = 1.5 + Math.random() * 2;
    this.ring = 1.3;
  }
  get pos() { return this.a.pos; }
}

export class Brawl {
  constructor(G, danger, actors) {
    this.G = G;
    this.danger = danger;
    this.enemies = actors.map((a, i) => new Enemy(a, danger.thugs[i]));
    // Armed thugs carry a knife in the right hand: they hit harder and cut through a block.
    for (const e of this.enemies) if (e.home.weapon === 'knife') {
      e.knife = createKnife();
      e.knife.position.set(-0.24, 0.95, 0.12);
      e.a.root.add(e.knife);
    }
    this.attacker = null;
    this.over = null;
    this.endT = 0;
    this.escapeT = 0;
    const p = G.player;
    p.hp = p.hp ?? PLAYER_HP;
    p.atk = 0; p.atkKind = 0; p.atkHit = false; p.atkCool = 0; p.combo = 0;
    p.dodge = 0; p.dodgeDir = new THREE.Vector3(); p.blocking = false; p.stun = 0; p.dead = 0;
    p.knockV = new THREE.Vector3();
    for (const e of this.enemies) { e.a.tweenPose('guard', 1, 0.3); }
    G.ui.setHealth(p.hp / PLAYER_HP);
    this.plates = this.enemies.map(() => {
      const el = document.createElement('div');
      el.className = 'plate enemy';
      el.innerHTML = '<i><b></b></i>';
      G.ui.el.plates.appendChild(el);
      return el;
    });
  }

  dispose() {
    for (const el of this.plates) el.remove();
    for (const e of this.enemies) if (e.knife) e.a.root.remove(e.knife);
  }

  // ------------------------------------------------ player side
  // Returns the movement speed multiplier for this frame.
  updatePlayer(dt, move, input) {
    const G = this.G, p = G.player, hero = G.hero;
    if (p.dead) {
      p.dead += dt;
      G.heroExtraRot.x = THREE.MathUtils.lerp(G.heroExtraRot.x, -Math.PI / 2, Math.min(1, dt * 6));
      hero.pose.guard = 0;
      return 0;
    }
    p.atkCool -= dt; p.stun -= dt;
    if (p.knockV.lengthSq() > 0.001) { p.pos.addScaledVector(p.knockV, dt); p.knockV.multiplyScalar(Math.max(0, 1 - dt * 9)); }
    // Block
    p.blocking = p.stun <= 0 && p.atk <= 0 && p.dodge <= 0 && input.down('Mouse2', 'KeyC', 'KeyQ');
    // Dodge
    if (p.dodge > 0) {
      p.dodge -= dt;
      p.pos.addScaledVector(p.dodgeDir, 9 * dt);
    } else if (input.pressed('Space') && p.stun <= 0) {
      p.dodge = 0.26;
      if (move.lengthSq() > 0) p.dodgeDir.copy(move).normalize();
      else p.dodgeDir.set(-Math.sin(p.modelYaw), 0, -Math.cos(p.modelYaw));
      sfx.whoosh();
    }
    // Attack
    if ((input.pressed('Mouse0') || input.pressed('KeyF')) && p.atkCool <= 0 && p.stun <= 0 && p.dodge <= 0) {
      p.combo = p.combo % 2 + 1;
      p.atkKind = p.combo;           // 1 jab, 2 cross
      p.atk = p.atkKind === 1 ? 0.3 : 0.42;
      p.atkCool = p.atk - 0.05;
      p.atkHit = false;
      const t = this.nearest(3.2);
      if (t) p.modelYaw = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
      sfx.whoosh();
    }
    // Kick: slower, hits harder and sends them flying
    if (input.pressed('KeyR') && p.atkCool <= 0 && p.stun <= 0 && p.dodge <= 0) {
      p.atkKind = 3; p.atk = 0.55; p.atkCool = 0.6; p.atkHit = false;
      const t = this.nearest(3.2);
      if (t) p.modelYaw = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
      sfx.whoosh();
    }
    // Takedown: finish a stunned thug in one move
    const fin = this.finishable();
    if (fin && input.pressed('KeyE') && p.stun <= 0) {
      p.modelYaw = Math.atan2(fin.pos.x - p.pos.x, fin.pos.z - p.pos.z);
      p.atkKind = 2; p.atk = 0.42; p.atkCool = 0.5; p.atkHit = true;
      fin.hp = 0; this.knockDown(fin);
      fin.knock.set(Math.sin(p.modelYaw), 0, Math.cos(p.modelYaw)).multiplyScalar(4);
      sfx.kick(); this.G.shake = 0.35; this.G.hitstop = 0.18;
    }
    if (p.atk > 0 && p.atkKind === 3) {
      const k = 1 - p.atk / 0.55;
      hero.pose.kick = k < 0.4 ? k / 0.4 : Math.max(0, 1 - (k - 0.4) / 0.6);
      if (!p.atkHit && k >= 0.4) { p.atkHit = true; this.playerHits(22, 2.0, 5.5); }
      p.atk -= dt;
      if (p.atk <= 0) hero.pose.kick = 0;
    } else if (p.atk > 0) {
      const total = p.atkKind === 1 ? 0.3 : 0.42;
      const k = 1 - p.atk / total;
      const ext = k < 0.35 ? k / 0.35 : Math.max(0, 1 - (k - 0.35) / 0.65);
      hero.pose.jab = p.atkKind === 1 ? ext : 0;
      hero.pose.punch = p.atkKind === 2 ? ext : 0;
      if (!p.atkHit && k >= 0.3) { p.atkHit = true; this.playerHits(p.atkKind === 1 ? 9 : 15); }
      p.atk -= dt;
      if (p.atk <= 0) { hero.pose.jab = 0; hero.pose.punch = 0; }
    }
    hero.pose.guard = THREE.MathUtils.lerp(hero.pose.guard, p.blocking ? 1 : (p.atk > 0 ? 0.3 : 0.65), Math.min(1, dt * 14));
    hero.pose.hurt = Math.max(0, hero.pose.hurt - dt * 3);
    if (p.stun > 0) return 0.2;
    if (p.blocking) return 0.35;
    if (p.atk > 0) return 0.25;
    return 0.9;
  }

  nearest(range) {
    let best = null, bd = range;
    for (const e of this.enemies) {
      if (e.down) continue;
      const d = Math.hypot(e.pos.x - this.G.player.pos.x, e.pos.z - this.G.player.pos.z);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  finishable() {
    const p = this.G.player;
    for (const e of this.enemies) {
      if (e.down || e.state !== 'stagger' || e.hp > ENEMY_HP * 0.55) continue;
      if (Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z) < 1.9) return e;
    }
    return null;
  }

  playerHits(dmg, reach = 1.75, push = 3.2) {
    const p = this.G.player;
    let any = false;
    for (const e of this.enemies) {
      if (e.down) continue;
      const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > reach) continue;
      if (Math.abs(angDiff(p.modelYaw, Math.atan2(dx, dz))) > 1.15) continue;
      any = true;
      const blocked = e.state === 'guard';
      e.hp -= blocked ? dmg * 0.25 : dmg;
      e.knock.set(dx / d, 0, dz / d).multiplyScalar(blocked ? 1.2 : push);
      if (e === this.attacker && e.state === 'windup' && !blocked) this.attacker = null; // interrupted
      if (!blocked) { e.a.tweenPose('throw', 0, 0.08); e.state = 'stagger'; e.t = push > 4 ? 0.9 : 0.6; e.a.tweenPose('hurt', 1, 0.05); e.a.tweenPose('punch', 0, 0.05); }
      if (e.hp <= 0) this.knockDown(e);
    }
    if (any) { (push > 4 ? sfx.kick : sfx.punch)(); this.G.shake = Math.max(this.G.shake, push > 4 ? 0.3 : 0.18); this.G.hitstop = 0.05; }
  }

  knockDown(e) {
    e.down = true;
    e.knock.multiplyScalar(0.3);
    e.a.yaw = fallYaw(this.G.loc, e.a.pos, e.a.yaw);
    e.state = 'down';
    e.a.tweenPose('guard', 0, 0.1); e.a.tweenPose('punch', 0, 0.1); e.a.tweenPose('hurt', 1, 0.1);
    if (this.attacker === e) this.attacker = null;
    sfx.thud();
  }

  // ------------------------------------------------ enemies
  update(dt) {
    const G = this.G, p = G.player;
    for (const [i, e] of this.enemies.entries()) {
      const a = e.a;
      // knockback slide
      if (e.knock.lengthSq() > 0.001) {
        a.pos.addScaledVector(e.knock, dt);
        e.knock.multiplyScalar(Math.max(0, 1 - dt * 7));
      }
      G.loc.collide(a.pos, a.radius);
      if (e.down) {
        e.fall = Math.min(1, e.fall + dt * 3);
        a.extraRot.x = -Math.PI / 2 * (e.fall * e.fall);
        a.pos.y = 0.16 * a.h * e.fall * e.fall;   // lie on the ground, not half inside it
        a.update(dt);
        this.plates[i].style.display = 'none';
        this.plates[i].classList.remove('finish', 'wind');
        continue;
      }
      const dx = p.pos.x - a.pos.x, dz = p.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      const face = Math.atan2(dx, dz);
      a.yaw = lerpAngle(a.yaw, face, Math.min(1, dt * 8));
      a.target = null;
      e.t -= dt; e.cool -= dt;
      let speed = 0;
      switch (e.state) {
        case 'approach':
        case 'guard': {
          // Keep a ring around the player (the current attacker closes in, others hang back),
          // with smoothed velocity and hysteresis so nobody jitters on the boundary.
          const ring = this.attacker && this.attacker !== e ? 2.5 : 1.3;
          e.ring += (ring - e.ring) * Math.min(1, dt * 2);
          e.strafeT -= dt;
          if (e.strafeT <= 0) { e.strafe *= -1; e.strafeT = 1.8 + Math.random() * 2.5; }
          const ux = dx / d, uz = dz / d;
          let wx = 0, wz = 0;
          if (d > e.ring + 0.35) { const sp = d > 6 ? 3.4 : 2.1; wx = ux * sp; wz = uz * sp; }
          else if (d < e.ring - 0.35) { wx = -ux * 1.3; wz = -uz * 1.3; }
          else { wx = -uz * e.strafe * 0.55; wz = ux * e.strafe * 0.55; }
          const k = 1 - Math.exp(-7 * dt);
          e.vel.x += (wx - e.vel.x) * k; e.vel.z += (wz - e.vel.z) * k;
          if (!p.dead && !this.attacker && e.cool <= 0 && d < 1.8) {
            this.attacker = e; e.state = 'windup'; e.t = 0.6;
            a.tweenPose('guard', 0.25, 0.15);
            a.tweenPose('throw', 0.32, 0.35);     // fist cocked back: the tell
          }
          break;
        }
        case 'windup':
          e.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
          // step in if the player backed off a little
          if (d > 1.25) { e.vel.x += (dx / d) * dt * 6; e.vel.z += (dz / d) * dt * 6; }
          if (e.t <= 0) {
            e.state = 'strike'; e.t = 0.24;
            a.tweenPose('throw', 0, 0.06);
            a.tweenPose('punch', 1, 0.08);
            e.hitPending = 0.07;
          }
          break;
        case 'strike':
          e.vel.multiplyScalar(Math.max(0, 1 - dt * 10));
          if (e.hitPending > 0 && (e.hitPending -= dt) <= 0) this.enemyHits(e, d, face);
          if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; a.tweenPose('punch', 0, 0.2); a.tweenPose('guard', 1, 0.3); }
          break;
        case 'recover':
          if (e.t <= 0) { e.state = 'approach'; e.cool = 0.9 + Math.random() * 1.6; if (this.attacker === e) this.attacker = null; }
          break;
        case 'stagger':
          e.vel.multiplyScalar(Math.max(0, 1 - dt * 10));
          if (e.t <= 0) { e.state = 'approach'; a.tweenPose('hurt', 0, 0.2); a.tweenPose('guard', 1, 0.2); e.cool = Math.max(e.cool, 0.5); }
          break;
      }
      a.pos.x += e.vel.x * dt; a.pos.z += e.vel.z * dt;
      G.loc.collide(a.pos, a.radius);
      speed = Math.hypot(e.vel.x, e.vel.z);
      a.faceTo = null;
      a.animSpeed = speed;
      a.update(dt);
      // separation between thugs
      for (const o of this.enemies) {
        if (o === e || o.down) continue;
        const sx = a.pos.x - o.pos.x, sz = a.pos.z - o.pos.z, sd = Math.hypot(sx, sz);
        if (sd < 0.95 && sd > 1e-4) { const push = (0.95 - sd) * Math.min(1, dt * 10); a.pos.x += (sx / sd) * push; a.pos.z += (sz / sd) * push; }
      }
      // health plate
      const pl = this.plates[i];
      pl.classList.toggle('wind', e.state === 'windup');
      pl.classList.toggle('finish', e.state === 'stagger' && e.hp <= ENEMY_HP * 0.55);
      pl.firstChild.firstChild.style.width = `${Math.max(0, e.hp / ENEMY_HP) * 100}%`;
      this.G.placePlate(pl, a.pos, 2.15);
    }

    // Outcome
    if (!this.over) {
      if (this.enemies.every((e) => e.down)) { this.over = 'win'; this.endT = 1.2; }
      else if (p.hp <= 0) { this.over = 'lose'; this.endT = 2.0; }
      else {
        const nearest = Math.min(...this.enemies.filter((e) => !e.down).map((e) => Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z)));
        this.escapeT = nearest > 17 ? this.escapeT + dt : 0;
        if (this.escapeT > 0.8) { this.over = 'escape'; this.endT = 0.01; }
      }
    } else {
      this.endT -= dt;
      if (this.endT <= 0) return this.over;
    }
    return null;
  }

  enemyHits(e, d, face) {
    const G = this.G, p = G.player;
    if (d > 1.9 || p.dead) return;
    if (p.dodge > 0) return; // i-frames
    const facing = Math.abs(angDiff(p.modelYaw, face + Math.PI)) < 1.3;
    const knife = !!e.knife;
    if (p.blocking && facing && !knife) {
      sfx.block();
      e.state = 'stagger'; e.t = 0.5; e.a.tweenPose('hurt', 0.6, 0.05);
      e.knock.set(-Math.sin(face), 0, -Math.cos(face)).multiplyScalar(2.5);
      this.attacker = null;
      return;
    }
    if (p.blocking && facing && knife) {
      p.hp -= 6; sfx.block(); G.ui.hit(); G.ui.setHealth(p.hp / PLAYER_HP);   // a blade cuts through a block
      e.state = 'stagger'; e.t = 0.4; this.attacker = null;
      if (p.hp <= 0) { p.dead = 0.001; p.modelYaw = fallYaw(G.loc, p.pos, p.modelYaw); sfx.thud(); }
      return;
    }
    p.hp -= knife ? 15 + Math.random() * 4 : 11 + Math.random() * 5;
    p.stun = 0.35;
    G.hero.pose.hurt = 1;
    G.ui.hit();
    G.ui.setHealth(p.hp / PLAYER_HP);
    G.shake = Math.max(G.shake, 0.3);
    sfx.hit();
    p.knockV.set(Math.sin(face), 0, Math.cos(face)).multiplyScalar(3.2);
    if (p.hp <= 0) { p.dead = 0.001; p.modelYaw = fallYaw(G.loc, p.pos, p.modelYaw); sfx.thud(); }
  }
}

export { PLAYER_HP };
