// Playable rifle range during boot camp: pop-up targets downrange, aim with
// the mouse, click (or F) to fire. Runs inside a cutscene via the director.
import * as THREE from 'three';
import { sfx } from './sfx.js';
import { createRifle, muzzleFlash } from './props.js';

const TARGET_TEX = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, 128, 128);
  for (const [r, col] of [[56, '#1a1a1a'], [44, '#efe6d2'], [32, '#1a1a1a'], [20, '#efe6d2'], [9, '#c0392b']]) {
    g.fillStyle = col; g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();

function makeTarget() {
  const g = new THREE.Group();          // pivot at the base: rotates up / down
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), new THREE.MeshStandardMaterial({ color: '#5a4430', roughness: 0.9 }));
  post.position.y = 0.6; g.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), [
    ...Array(5).fill(new THREE.MeshStandardMaterial({ color: '#8a7a5a' })),
    new THREE.MeshStandardMaterial({ map: TARGET_TEX, roughness: 0.9 }),   // -z face looks back at the shooter
  ]);
  board.position.y = 1.55; board.castShadow = true; g.add(board);
  g.rotation.x = -Math.PI / 2;
  g.userData = { board, up: 0, want: 0, state: 'down', t: 0 };
  return g;
}

// Returns { hits, total }.
export function shootingRange(d, G, shooter, { total = 8, time = 32 } = {}) {
  const hud = document.getElementById('range-hud');
  const cross = document.getElementById('crosshair');
  const rifle = createRifle();
  rifle.position.set(-0.19, 1.34, 0.42);
  shooter.root.add(rifle);
  const flash = muzzleFlash();
  flash.position.set(0, 0.04, 0.62);
  rifle.add(flash);
  d.pose(shooter, 'point', 1, 0.3);
  // Downrange: berm and pop-up targets
  const berm = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 2.5), new THREE.MeshStandardMaterial({ color: '#a8875e', roughness: 1 }));
  d.prop(berm, 0, 1.2, 39);
  const spots = [[-7, 26], [-3, 30], [2, 25], [6, 33], [-5, 35], [8, 27], [0, 36], [-9, 31], [4, 29], [-1, 32]];
  const targets = spots.map(([x, z]) => d.prop(makeTarget(), x, 0, z));
  const done = () => {
    hud.classList.remove('show'); cross.classList.remove('show');
    shooter.root.remove(rifle);
    d.pose(shooter, 'point', 0, 0.3);
    G.wantLock = false;
    document.exitPointerLock?.();
  };
  if (d.skip) { done(); return Promise.resolve({ hits: 6, total }); }

  G.wantLock = true;
  G.input.lock();
  hud.classList.add('show'); cross.classList.add('show');
  const ray = new THREE.Raycaster();
  const aim = { yaw: 0, pitch: 0.02 };
  G.range = { aim, targets };   // exposed for debugging
  let hits = 0, popped = 0, t = 0, nextPop = 0.6, cool = 0.35, kick = 0, flashT = 0;
  const base = shooter.pos.clone();

  return new Promise((resolve) => {
    const stop = d.every((dt) => {
      if (d.skip) { stop(); done(); resolve({ hits: Math.max(hits, 6), total }); return; }
      t += dt; cool -= dt; flashT -= dt;
      // aim
      const m = G.sceneMouse || { dx: 0, dy: 0 };
      G.sceneMouse = { dx: 0, dy: 0 };
      aim.yaw = THREE.MathUtils.clamp(aim.yaw - m.dx * 0.0022, -0.75, 0.75);
      aim.pitch = THREE.MathUtils.clamp(aim.pitch - m.dy * 0.0018, -0.25, 0.3);
      kick = Math.max(0, kick - dt * 6);
      shooter.yaw = aim.yaw; shooter.faceTo = null; shooter.sync();
      const cam = G.camera;
      const fx = Math.sin(aim.yaw), fz = Math.cos(aim.yaw);
      cam.position.set(base.x - fx * 1.5 - fz * 0.55, 1.75, base.z - fz * 1.5 + fx * 0.55);
      const p = aim.pitch + kick * 0.05;
      cam.lookAt(cam.position.x + fx * 10, 1.75 + Math.tan(p) * 10, cam.position.z + fz * 10);
      d.camAnim = null; d.camFn = null;
      flash.visible = flashT > 0;
      // pop targets: two up at a time, each for 3.2 s
      const up = targets.filter((g) => g.userData.state === 'up');
      if (popped < total && up.length < 2 && t > nextPop) {
        const free = targets.filter((g) => g.userData.state === 'down');
        const g = free[Math.floor(Math.random() * free.length)];
        g.userData.state = 'up'; g.userData.want = 1; g.userData.t = 3.2; popped++;
        nextPop = t + 0.7 + Math.random() * 0.8;
      }
      for (const g of targets) {
        const u = g.userData;
        if (u.state === 'up') { u.t -= dt; if (u.t <= 0) { u.state = 'missed'; u.want = 0; } }
        u.up += (u.want - u.up) * Math.min(1, dt * 9);
        g.rotation.x = -Math.PI / 2 * (1 - u.up);
      }
      // fire
      if ((G.input.pressed('Mouse0') || G.input.pressed('KeyF')) && cool <= 0) {
        cool = 0.32; kick = 1; flashT = 0.06;
        sfx.rifle(); G.shake = 0.12;
        ray.setFromCamera({ x: 0, y: 0 }, cam);
        const boards = targets.filter((g) => g.userData.state === 'up').map((g) => g.userData.board);
        const hit = ray.intersectObjects(boards, false)[0];
        if (hit) {
          const g = hit.object.parent;
          g.userData.state = 'hit'; g.userData.want = 0; hits++;
          sfx.ding();
          cross.classList.add('hit'); setTimeout(() => cross.classList.remove('hit'), 120);
        }
      }
      const left = Math.max(0, time - t);
      hud.innerHTML = `Targets hit: ${hits} / ${total} · ${left.toFixed(0)} s<small>Mouse to aim · Click or F to fire</small>`;
      const finished = popped >= total && targets.every((g) => g.userData.state !== 'up');
      if (finished || left <= 0) { stop(); done(); resolve({ hits, total }); }
    });
  });
}
