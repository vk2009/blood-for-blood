// Wandering pedestrians and named characters.
import * as THREE from 'three';
import { createCharacter } from './character.js';

export function lerpAngle(a, b, t) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

export class NPC {
  constructor(scene, { look, x, z, name = null, lines = [], wander = 60, speed }) {
    this.char = createCharacter(look);
    scene.add(this.char.root);
    this.pos = new THREE.Vector3(x, 0, z);
    this.home = this.pos.clone();
    this.name = name;
    this.lines = lines;
    this.wander = wander;
    this.speed = speed ?? 1.1 + Math.random() * 0.45;
    this.yaw = Math.random() * Math.PI * 2;
    this.state = 'idle';
    this.timer = Math.random() * 4;
    this.target = new THREE.Vector3();
    this.talking = false;
    this.radius = 0.35;
    this.stuck = 0;
  }

  pickTarget(world) {
    for (let i = 0; i < 25; i++) {
      const x = this.home.x + (Math.random() * 2 - 1) * this.wander;
      const z = this.home.z + (Math.random() * 2 - 1) * this.wander;
      if (world.isFree(x, z, 0.6)) { this.target.set(x, 0, z); return true; }
    }
    return false;
  }

  update(dt, world, player) {
    let moving = 0;
    const dxp = player.pos.x - this.pos.x, dzp = player.pos.z - this.pos.z;
    const distP = Math.hypot(dxp, dzp);
    const faceP = Math.atan2(dxp, dzp);

    if (this.talking) {
      this.state = 'idle';
      this.timer = 2;
      this.yaw = lerpAngle(this.yaw, faceP, Math.min(1, dt * 6));
    } else if (this.state === 'idle') {
      this.timer -= dt;
      if (distP < 3.2) this.yaw = lerpAngle(this.yaw, faceP, Math.min(1, dt * 3));
      if (this.timer <= 0 && this.wander > 0 && this.pickTarget(world)) { this.state = 'walk'; this.stuck = 0; }
      else if (this.timer <= 0) this.timer = 1;
    } else {
      const dx = this.target.x - this.pos.x, dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.5) {
        this.state = 'idle';
        this.timer = 2 + Math.random() * 5;
      } else {
        const want = Math.atan2(dx, dz);
        this.yaw = lerpAngle(this.yaw, want, Math.min(1, dt * 5));
        const step = this.speed * dt;
        const px = this.pos.x, pz = this.pos.z;
        this.pos.x += Math.sin(this.yaw) * step;
        this.pos.z += Math.cos(this.yaw) * step;
        world.collide(this.pos, this.radius);
        const moved = Math.hypot(this.pos.x - px, this.pos.z - pz);
        moving = moved / Math.max(dt, 1e-4);
        this.stuck = moved < step * 0.35 ? this.stuck + dt : 0;
        if (this.stuck > 0.6) { this.state = 'idle'; this.timer = 0.5 + Math.random(); }
      }
    }

    world.pushFromTraffic(this.pos, this.radius);
    this.char.root.position.copy(this.pos);
    this.char.root.rotation.y = this.yaw;
    this.char.update(dt, moving, false);
  }
}
