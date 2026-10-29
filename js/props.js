// Props and building helpers specific to Blood For Blood: shacks, rooms,
// furniture, the coati, trains, planes, palms, pools, fires and flags.
import * as THREE from 'three';
import { mat } from './character.js';
import {
  TEX, rand, rr, pick, mesh, flat, box, std, withRepeat, canvasTexture, windowTile, signTexture, signMaterials, contactShadow,
} from './kit.js';

// ---------------------------------------------------------------- textures
function stains(g, w, h, n, color, rMax = 60) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * rMax;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
export const TEX2 = {
  plaster: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#b3a283'; g.fillRect(0, 0, w, h);
    stains(g, w, h, 30, 'rgba(70,55,35,0.25)');
    stains(g, w, h, 10, 'rgba(40,60,30,0.18)', 40);
    g.strokeStyle = 'rgba(40,30,20,0.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      let x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += rr(-14, 14); y += rr(4, 16); g.lineTo(x, y); }
      g.stroke();
    }
  }, true),
  cleanWall: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#d9d2c0'; g.fillRect(0, 0, w, h);
    stains(g, w, h, 8, 'rgba(120,110,90,0.12)');
  }, true),
  institution: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#c9cfc6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7d8a78'; g.fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle = '#5b6857'; g.fillRect(0, h * 0.6, w, 6);
  }, true),
  planks: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#5a4430'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,20,10' : '120,90,60'},0.25)`; g.fillRect(x, 0, 30, h);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 30, 0, 2, h);
    }
    stains(g, w, h, 12, 'rgba(20,15,10,0.35)', 40);
  }, true),
  dirtFloor: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#6e5a44'; g.fillRect(0, 0, w, h);
    stains(g, w, h, 30, 'rgba(40,30,20,0.35)', 50);
    for (let i = 0; i < 1500; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(30,20,10,0.2)' : 'rgba(160,130,100,0.15)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, true),
  clinicTile: canvasTexture(256, 256, (g, w, h) => {
    const s = w / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? '#dfe6dc' : '#c5d1c4'; g.fillRect(i * s, j * s, s, s);
    }
  }, true),
  lino: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#8a8a7a'; g.fillRect(0, 0, w, h);
    const s = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#9a9a88' : '#7a7a6c'; g.fillRect(i * s, j * s, s, s); }
    stains(g, w, h, 6, 'rgba(40,40,30,0.15)');
  }, true),
  water: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#3fb3d6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 10, y - 8, x + 20, y + 8, x + 34, y); g.stroke();
    }
  }, true),
  graffiti: canvasTexture(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const words = [['EL CALLEJÓN', 'THE ALLEY'], ['NO PASAR', 'KEEP OUT'], ['LOS DEL CERRO', 'THE HILL BOYS'], ['¡FUERA!', 'GET OUT!'], ['VALPO', 'VALPARAÍSO']];
    for (let i = 0; i < 4; i++) {
      g.save();
      g.translate(rr(40, w - 140), rr(50, h - 30)); g.rotate(rr(-0.2, 0.2));
      g.font = `900 ${Math.round(rr(34, 60))}px "Arial Black", Impact, sans-serif`;
      g.fillStyle = pick(['#d23a2a', '#2a9ad2', '#e8d23a', '#f2f2f2', '#3ad26a']);
      g.strokeStyle = '#111'; g.lineWidth = 5;
      const [t, en] = pick(words); g.strokeText(t, 0, 0); g.fillText(t, 0, 0);
      g.font = '700 18px Arial, sans-serif'; g.lineWidth = 3; g.fillStyle = '#f2d36b';
      g.strokeText(`(${en})`, 4, 24); g.fillText(`(${en})`, 4, 24);
      g.restore();
    }
  }),
};

export function chileFlagTexture() {
  return canvasTexture(300, 200, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = '#d52b1e'; g.fillRect(0, h / 2, w, h / 2);
    g.fillStyle = '#0039a6'; g.fillRect(0, 0, w / 3, h / 2);
    g.fillStyle = '#ffffff';
    const cx = w / 6, cy = h / 4, R = 26, r = 10;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r : R;
      g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    g.fill();
  });
}
export function mexicoFlagTexture() {
  return canvasTexture(300, 180, (g, w, h) => {
    g.fillStyle = '#006847'; g.fillRect(0, 0, w / 3, h);
    g.fillStyle = '#ffffff'; g.fillRect(w / 3, 0, w / 3, h);
    g.fillStyle = '#ce1126'; g.fillRect((2 * w) / 3, 0, w / 3, h);
    g.fillStyle = '#8a5a2a'; g.beginPath(); g.arc(w / 2, h / 2, 18, 0, Math.PI * 2); g.fill();
  });
}

export function flagPole(L, x, z, tex, h = 9) {
  mesh(new THREE.CylinderGeometry(0.07, 0.1, h, 8), mat('#c8c8c8', 0.4, 0.7), L.root, x, h / 2, z);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6, 12, 1), std({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
  flag.geometry.translate(1.2, 0, 0);
  flag.position.set(x + 0.08, h - 1, z);
  flag.userData.dynamic = true;
  flag.userData.flag = true;
  L.root.add(flag);
  L.flags ||= [];
  L.flags.push(flag);
  L.addBox(x, z, 0.3, 0.3);
  return flag;
}
// Ripple flags each frame.
export function waveFlags(L, t) {
  for (const f of L.flags || []) {
    const p = f.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setZ(i, Math.sin(x * 2.2 - t * 4) * 0.12 * (x / 2.4));
    }
    p.needsUpdate = true;
  }
}

// ---------------------------------------------------------------- shacks
const SHACK_COLORS = ['#c95f4a', '#4f8fb8', '#d9b04a', '#6aa37a', '#b07aa8', '#d98a3a', '#9aa3a8', '#e6dccb', '#3f9a96'];
const shackWallMats = SHACK_COLORS.map((c) => {
  const tile = windowTile(new THREE.Color(c).lerp(new THREE.Color('#8a7a62'), 0.25).getStyle());
  return std({ map: withRepeat(tile, 1, 1), roughness: 0.95 });
});
const ROOF = std({ map: withRepeat(TEX.corrugated, 2, 2), roughness: 0.7, metalness: 0.3, color: '#b9a28a' });
const DOOR_MATS = ['#5a3a22', '#2a4a6a', '#6a2a2a', '#3a5a3a'].map((c) => mat(c, 0.7));

export function shack(L, x, z, w, d, { face = null, h = rr(2.6, 3.6), colorIndex = Math.floor(rand() * SHACK_COLORS.length), door = true } = {}) {
  const wm = shackWallMats[colorIndex];
  const m = mesh(box(w, h, d), [wm, wm, ROOF, ROOF, wm, wm], L.root, x, h / 2, z);
  L.occluders.push(m);
  const roof = mesh(box(w + 0.5, 0.08, d + 0.5), ROOF, L.root, x, h + 0.12, z);
  roof.rotation.x = rr(-0.08, 0.08);
  roof.rotation.z = rr(-0.06, 0.06);
  if (door && face) {
    const dm = new THREE.Mesh(box(1.0, 2.0, 0.1), pick(DOOR_MATS));
    const off = { '+z': [0, d / 2 + 0.05, 0], '-z': [0, -d / 2 - 0.05, Math.PI], '+x': [w / 2 + 0.05, 0, Math.PI / 2], '-x': [-w / 2 - 0.05, 0, -Math.PI / 2] }[face];
    if (face === '+z' || face === '-z') dm.position.set(x + rr(-w / 4, w / 4), 1.0, z + off[1]);
    else dm.position.set(x + off[0], 1.0, z + rr(-d / 4, d / 4));
    dm.rotation.y = off[2];
    dm.castShadow = true;
    L.root.add(dm);
  }
  L.addBox(x, z, w, d);
  contactShadow(L.root, x, z, w, d, 0, 1.2);
  L.mapRects.push({ x, z, w, d, color: SHACK_COLORS[colorIndex] });
  return m;
}

// Fill a rectangle with a grid of shacks (no gaps the player can squeeze through).
export function shackBlock(L, x0, x1, z0, z1, cell = 6.5, skip = null) {
  const nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell));
  const cw = (x1 - x0) / nx, cd = (z1 - z0) / nz;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const cx = x0 + cw * (i + 0.5), cz = z0 + cd * (j + 0.5);
    if (skip && skip(cx, cz)) continue;
    const edges = [[z1 - cz, '+z'], [cz - z0, '-z'], [x1 - cx, '+x'], [cx - x0, '-x']].sort((a, b) => a[0] - b[0]);
    const outer = edges[0][0] < Math.max(cw, cd);
    shack(L, cx, cz, cw - 0.3, cd - 0.3, { face: outer ? edges[0][1] : null });
  }
}

// ---------------------------------------------------------------- rooms
export function room(L, { w, d, h, floor, wall, ceiling = '#d9d2c0', doorW = 1.4, lights = [], lightColor = '#ffe2b0', lightPower = 14, windowAt = null, dayDoor = true }) {
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, t = 0.2;
  L.ceiling = h;
  flat(w, d, floor, L.root, 0, 0.01, 0);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(ceiling, 0.95));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = h; L.root.add(ceil); L.occluders.push(ceil);
  const wallMesh = (x, z, ww, dd, hh = h, y = hh / 2) => {
    const m = mesh(box(ww, hh, dd), wall, L.root, x, y, z, false);
    L.occluders.push(m);
    return m;
  };
  wallMesh(0, z0 - t / 2, w + 2 * t, t);
  wallMesh(x0 - t / 2, 0, t, d);
  wallMesh(x1 + t / 2, 0, t, d);
  const seg = (w - doorW) / 2;
  wallMesh(x0 + seg / 2, z1 + t / 2, seg, t);
  wallMesh(x1 - seg / 2, z1 + t / 2, seg, t);
  wallMesh(0, z1 + t / 2, doorW, t, h - 2.2, 2.2 + (h - 2.2) / 2);
  L.addBox(0, z0 - t / 2, w, t); L.addBox(x0 - t / 2, 0, t, d); L.addBox(x1 + t / 2, 0, t, d);
  L.addBox(x0 + seg / 2, z1 + t / 2, seg, t); L.addBox(x1 - seg / 2, z1 + t / 2, seg, t);
  // Door glowing with daylight from outside
  const day = std({ color: '#e8f4ff', emissive: '#dff0ff', emissiveIntensity: dayDoor ? 0.8 : 0.15, roughness: 0.3 });
  mesh(box(doorW - 0.1, 2.15, 0.06), day, L.root, 0, 1.08, z1 + 0.06, false);
  if (windowAt) {
    const [wx, wy, ww, wh, side] = windowAt;
    const glass = std({ color: '#d8ecff', emissive: '#cfe6ff', emissiveIntensity: dayDoor ? 0.9 : 0.2 });
    if (side === 'back') mesh(box(ww, wh, 0.05), glass, L.root, wx, wy, z0 + 0.03, false);
    else mesh(box(0.05, wh, ww), glass, L.root, side === 'left' ? x0 + 0.03 : x1 - 0.03, wy, wx, false);
  }
  const bulb = std({ color: '#ffffff', emissive: lightColor, emissiveIntensity: 1.6 });
  for (const [i, [lx, lz]] of lights.entries()) {
    mesh(new THREE.SphereGeometry(0.08, 10, 8), bulb, L.root, lx, h - 0.35, lz, false);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), mat('#222'), L.root, lx, h - 0.15, lz, false);
    const p = new THREE.PointLight(lightColor, lightPower, 14, 1.6);
    p.position.set(lx, h - 0.45, lz);
    p.userData.shadowCandidate = i === 0;
    L.root.add(p);
  }
  L.mapRects.push({ x: 0, z: 0, w, d, color: '#6b5a48' });
}

// Interior partition wall along x or z, with an optional doorway gap.
export function partition(L, x1, z1, x2, z2, h, material, gapAt = null, gapW = 1.3) {
  const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
  const a0 = alongX ? Math.min(x1, x2) : Math.min(z1, z2), a1 = alongX ? Math.max(x1, x2) : Math.max(z1, z2);
  const c = alongX ? z1 : x1;
  const segs = gapAt === null ? [[a0, a1]] : [[a0, gapAt - gapW / 2], [gapAt + gapW / 2, a1]];
  for (const [s0, s1] of segs) {
    if (s1 - s0 < 0.05) continue;
    const mid = (s0 + s1) / 2, len = s1 - s0;
    const m = alongX ? mesh(box(len, h, 0.16), material, L.root, mid, h / 2, c, false) : mesh(box(0.16, h, len), material, L.root, c, h / 2, mid, false);
    L.occluders.push(m);
    if (alongX) L.addBox(mid, c, len, 0.16); else L.addBox(c, mid, 0.16, len);
  }
  if (gapAt !== null) {
    const lintel = alongX ? mesh(box(gapW, h - 2.2, 0.16), material, L.root, gapAt, 2.2 + (h - 2.2) / 2, c, false)
      : mesh(box(0.16, h - 2.2, gapW), material, L.root, c, 2.2 + (h - 2.2) / 2, gapAt, false);
    L.occluders.push(lintel);
  }
}

export function table(L, x, z, w = 1.2, d = 0.8, color = '#6b4a2e', h = 0.76) {
  mesh(box(w, 0.05, d), mat(color, 0.6), L.root, x, h, z);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mesh(box(0.05, h, 0.05), mat(color, 0.6), L.root, x + a * (w / 2 - 0.06), h / 2, z + b * (d / 2 - 0.06));
  L.addBox(x, z, w, d);
}
export function chair(L, x, z, rot, color = '#6b4a2e') {
  const g = new THREE.Group();
  mesh(box(0.45, 0.05, 0.45), mat(color, 0.6), g, 0, 0.46, 0);
  mesh(box(0.45, 0.5, 0.05), mat(color, 0.6), g, 0, 0.72, -0.2);
  for (const [a, b] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) mesh(box(0.04, 0.46, 0.04), mat(color, 0.6), g, a, 0.23, b);
  g.position.set(x, 0, z); g.rotation.y = rot; L.root.add(g);
  L.addBox(x, z, 0.42, 0.42);
}
export function bed(L, x, z, { w = 0.95, d = 2.0, blanket = '#6a5a4a', frame = '#4a3a2a', neat = false } = {}) {
  mesh(box(w, 0.35, d), mat(frame, 0.8), L.root, x, 0.18, z);
  mesh(box(w - 0.06, 0.16, d - 0.06), mat('#d8d0bc', 0.9), L.root, x, 0.42, z);
  const bl = mesh(box(w - 0.02, 0.06, d * 0.62), mat(blanket, 0.95), L.root, x, 0.52, z + d * 0.18);
  if (!neat) bl.rotation.z = 0.04;
  mesh(box(w * 0.7, 0.1, 0.35), mat('#ece6d6', 0.9), L.root, x, 0.55, z - d / 2 + 0.25);
  L.addBox(x, z, w, d);
}
export function shelf(L, x, z, w, rot = 0, color = '#5a4430', items = true) {
  const g = new THREE.Group();
  mesh(box(w, 1.9, 0.4), mat(color, 0.8), g, 0, 0.95, 0);
  if (items) for (let s = 0; s < 4; s++) for (let i = 0; i < Math.floor(w / 0.3); i++) {
    if (rand() < 0.3) continue;
    mesh(box(0.22, rr(0.18, 0.34), 0.25), mat(pick(['#7a2a2a', '#2a4a6a', '#c9b48a', '#4a5a3a', '#8a8a7a', '#e8e0cf']), 0.7), g, -w / 2 + 0.2 + i * 0.3, 0.25 + s * 0.45, 0.12);
  }
  g.position.set(x, 0, z); g.rotation.y = rot; L.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  L.addBox(x, z, sw ? 0.45 : w, sw ? w : 0.45);
}
export function crate(L, x, z, s = 0.8, color = '#8a6a42') {
  const m = mesh(box(s, s, s), std({ map: withRepeat(TEX2.planks, 1, 1), color, roughness: 0.9 }), L.root, x, s / 2, z);
  m.rotation.y = rr(-0.3, 0.3);
  L.addBox(x, z, s, s);
  return m;
}
export function trash(L, x, z, n = 6, spread = 1.2) {
  for (let i = 0; i < n; i++) {
    const m = mesh(new THREE.DodecahedronGeometry(rr(0.12, 0.3), 0), mat(pick(['#3a3a32', '#5a4a3a', '#2a2a2a', '#6a6a5a', '#7a5a3a']), 1), L.root,
      x + rr(-spread, spread), 0.1, z + rr(-spread, spread));
    m.scale.y = 0.6;
  }
}
export function barrelFire(L, x, z, light = true) {
  mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.9, 12), mat('#5a3a2a', 0.6, 0.5), L.root, x, 0.45, z);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 8), std({ color: '#ffb040', emissive: '#ff7a1a', emissiveIntensity: 2.2 }));
  flame.position.set(x, 1.15, z);
  flame.userData.dynamic = true;
  L.root.add(flame);
  L.fires ||= [];
  L.fires.push(flame);
  if (light) {
    const p = new THREE.PointLight('#ff8a3a', 14, 12, 1.6);
    p.position.set(x, 1.6, z);
    L.root.add(p);
    flame.userData.light = p;
  }
  L.addBox(x, z, 0.7, 0.7);
}
export function flickerFires(L, t) {
  for (const [i, f] of (L.fires || []).entries()) {
    const k = 1 + Math.sin(t * 13 + i * 2.1) * 0.12 + Math.sin(t * 29 + i) * 0.08;
    f.scale.set(1, k, 1);
    if (f.userData.light) f.userData.light.intensity = 12 * k;
  }
}
export function clothesLine(L, x1, z1, x2, z2, h = 2.6) {
  const len = Math.hypot(x2 - x1, z2 - z1), ang = Math.atan2(z2 - z1, x2 - x1);
  const line = mesh(new THREE.CylinderGeometry(0.01, 0.01, len, 4), mat('#222'), L.root, (x1 + x2) / 2, h, (z1 + z2) / 2, false);
  line.rotation.set(0, -ang, Math.PI / 2);
  const n = Math.floor(len / 0.9);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const c = mesh(box(rr(0.4, 0.7), rr(0.5, 0.9), 0.02), mat(pick(['#c0392b', '#2e86c1', '#f2f2ee', '#d4ac0d', '#8e44ad', '#e67e22']), 0.9),
      L.root, x1 + (x2 - x1) * t, h - 0.4, z1 + (z2 - z1) * t, false);
    c.rotation.y = -ang;
  }
}
export function lampPost(L, x, z, on = false) {
  mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.5, 8), mat('#2a2a2a', 0.5, 0.5), L.root, x, 2.25, z);
  mesh(new THREE.SphereGeometry(0.22, 12, 8), std({ color: '#fff4d0', emissive: '#ffd890', emissiveIntensity: on ? 2 : 0.3 }), L.root, x, 4.6, z, false);
  if (on) { const p = new THREE.PointLight('#ffd08a', 16, 16, 1.5); p.position.set(x, 4.3, z); L.root.add(p); }
  L.addBox(x, z, 0.3, 0.3);
}
export function corkBoard(L, x, y, z, rot) {
  const tex = canvasTexture(512, 320, (g, w, h) => {
    g.fillStyle = '#b8864f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(80,50,20,0.3)' : 'rgba(230,190,140,0.3)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    const notes = [['LAVANDERÍA?', 'laundromat'], ['LAVADO DE AUTOS?', 'car wash'], ['TAXIS?', 'taxi company'], ['RESTAURANTE?', 'restaurant']];
    notes.forEach((t, i) => {
      const x0 = 30 + (i % 2) * 240, y0 = 30 + Math.floor(i / 2) * 140;
      g.save(); g.translate(x0 + 100, y0 + 55); g.rotate(rr(-0.08, 0.08));
      g.fillStyle = i === 3 ? '#f4d23a' : '#f4f0dc'; g.fillRect(-100, -55, 200, 110);
      g.fillStyle = '#222'; g.font = '700 24px Georgia, serif'; g.textAlign = 'center'; g.fillText(t[0], 0, 0);
      g.fillStyle = '#7a5a10'; g.font = 'italic 18px Georgia, serif'; g.fillText(`(${t[1]})`, 0, 28);
      g.fillStyle = '#c0392b'; g.beginPath(); g.arc(0, -45, 7, 0, Math.PI * 2); g.fill();
      g.restore();
    });
  });
  const m = mesh(box(1.6, 1.0, 0.05), std({ map: tex, roughness: 0.9 }), L.root, x, y, z, false);
  m.rotation.y = rot;
  return m;
}
export function framedPicture(L, x, y, z, rot, tex, w = 0.6, h = 0.8) {
  const g = new THREE.Group();
  mesh(box(w + 0.08, h + 0.08, 0.04), mat('#3a2614', 0.5), g, 0, 0, 0, false);
  mesh(box(w, h, 0.02), tex ? std({ map: tex, roughness: 0.8 }) : mat('#556', 0.5), g, 0, 0, 0.02, false);
  g.position.set(x, y, z); g.rotation.y = rot; L.root.add(g);
}
export function portraitTexture(bg = '#3a4a5a', coat = '#5d6447', skin = '#d9a57f') {
  return canvasTexture(128, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = coat; g.beginPath(); g.ellipse(w / 2, h, 52, 60, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = skin; g.beginPath(); g.ellipse(w / 2, h * 0.42, 22, 28, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(w / 2 - 14, h * 0.4, 28, 5);
  });
}

// ---------------------------------------------------------------- creatures & vehicles
export function createCoati() {
  const g = new THREE.Group();
  const fur = mat('#8a6440', 0.95), dark = mat('#3a2a1c', 0.95), light = mat('#d8c0a0', 0.95);
  const body = new THREE.Group(); g.add(body);
  const torso = mesh(new THREE.CapsuleGeometry(0.13, 0.32, 4, 10), fur, body, 0, 0.3, 0);
  torso.rotation.x = Math.PI / 2;
  const head = new THREE.Group(); head.position.set(0, 0.36, 0.27); body.add(head);
  mesh(new THREE.SphereGeometry(0.1, 12, 10), fur, head);
  const snout = mesh(new THREE.ConeGeometry(0.05, 0.2, 10), light, head, 0, -0.02, 0.14);
  snout.rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.022, 8, 6), dark, head, 0, -0.02, 0.24);
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.035, 8, 6), fur, head, s * 0.07, 0.08, -0.02);
    mesh(new THREE.SphereGeometry(0.014, 6, 4), dark, head, s * 0.045, 0.03, 0.08);
  }
  const legs = [];
  for (const [lx, lz] of [[-0.08, 0.15], [0.08, 0.15], [-0.08, -0.15], [0.08, -0.15]]) {
    const leg = new THREE.Group(); leg.position.set(lx, 0.26, lz); body.add(leg);
    mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.26, 6).translate(0, -0.13, 0), dark, leg);
    legs.push(leg);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.34, -0.26); body.add(tail);
  let parent = tail;
  const segs = [];
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Group(); s.position.y = i ? 0.07 : 0; parent.add(s);
    mesh(new THREE.CylinderGeometry(0.035 - i * 0.002, 0.04 - i * 0.002, 0.075, 8).translate(0, 0.035, 0), i % 2 ? dark : light, s);
    s.rotation.x = i ? -0.12 : -0.9;
    segs.push(s); parent = s;
  }
  g.userData = { legs, tail: segs, head, phase: 0, dynamic: true };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}
export function animateCoati(c, dt, speed) {
  const u = c.userData;
  u.phase += dt * (speed > 0.1 ? speed * 9 : 2);
  const run = Math.min(1, speed / 2);
  u.legs.forEach((l, i) => { l.rotation.x = Math.sin(u.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.7 * run; });
  u.tail.forEach((s, i) => { s.rotation.z = Math.sin(u.phase * 0.4 + i * 0.4) * 0.08 * (1 + run); });
  u.head.rotation.y = Math.sin(u.phase * 0.23) * 0.4 * (1 - run);
}

export function createFruit(color = '#f08a1a') {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(color, 0.5));
  m.castShadow = true;
  return m;
}

const TRAIN_RED = mat('#8a2a22', 0.6, 0.2), TRAIN_CREAM = mat('#e2d6b8', 0.7);
export function createTrain(cars = 4) {
  const g = new THREE.Group();
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.14, 14).rotateZ(Math.PI / 2);
  const wheels = mat('#1a1a1a', 0.7, 0.4);
  // Locomotive
  mesh(box(2.9, 2.8, 13), TRAIN_RED, g, 0, 2.1, 0);
  mesh(box(2.95, 0.5, 13.05), TRAIN_CREAM, g, 0, 2.3, 0);
  mesh(box(2.7, 0.6, 1.2), mat('#2a2a2a', 0.5), g, 0, 3.75, 4.5);
  mesh(box(2.5, 0.8, 0.06), mat('#1c2a35', 0.15, 0.6), g, 0, 3.0, 6.52);
  mesh(box(0.5, 0.3, 0.1), std({ color: '#fff6d8', emissive: '#fff1c0', emissiveIntensity: 1 }), g, 0, 1.4, 6.55);
  for (const z of [-4.5, -3, 3, 4.5]) for (const x of [-0.75, 0.75]) mesh(wheelGeo, wheels, g, x, 0.45, z);
  mesh(box(2.2, 0.5, 10), mat('#2a2a2a', 0.8), g, 0, 0.75, 0);
  // Carriages
  const tile = windowTile('#2f5a46', 'window');
  const side = std({ map: withRepeat(tile, 6, 1), roughness: 0.7 });
  for (let i = 0; i < cars; i++) {
    const z = -8.3 - i * 15.5;
    mesh(box(2.9, 2.9, 15), [side, side, mat('#4a4a44', 0.8), mat('#4a4a44', 0.8), mat('#2f5a46', 0.7), mat('#2f5a46', 0.7)], g, 0, 2.15, z);
    mesh(box(2.7, 0.3, 14.8), mat('#4a4a44', 0.8), g, 0, 3.75, z);
    for (const dz of [-5.5, -4, 4, 5.5]) for (const x of [-0.75, 0.75]) mesh(wheelGeo, wheels, g, x, 0.45, z + dz);
    for (const dz of [-4.75, 4.75]) mesh(box(2.0, 0.5, 2.4), mat('#2a2a2a', 0.8), g, 0, 0.75, z + dz);
  }
  g.userData.length = 13 + cars * 15.5;
  // Lift so the wheels ride on the rail heads.
  const lift = new THREE.Group();
  g.position.y = 0.3;
  lift.add(g);
  lift.userData.length = g.userData.length;
  return lift;
}
export function track(parent, x, z0, z1) {
  const len = Math.abs(z1 - z0), cz = (z0 + z1) / 2;
  flat(4, len, std({ map: withRepeat(TEX.dirt, 1, len / 6), color: '#8a7a6a', roughness: 1 }), parent, x, 0.03, cz);
  for (const s of [-0.75, 0.75]) mesh(box(0.1, 0.15, len), mat('#7a7a7a', 0.4, 0.8), parent, x + s, 0.22, cz, false);
  const sleeper = mat('#4a3a2a', 0.9);
  for (let zz = Math.min(z0, z1); zz < Math.max(z0, z1); zz += 1.2) mesh(box(2.6, 0.12, 0.25), sleeper, parent, x, 0.1, zz, false);
}

export function createPlane() {
  const g = new THREE.Group();
  const white = mat('#e8e8e4', 0.4, 0.3), stripe = mat('#2a4a7a', 0.5);
  const fus = mesh(new THREE.CapsuleGeometry(0.9, 9, 6, 14), white, g, 0, 1.6, 0);
  fus.rotation.x = Math.PI / 2;
  mesh(box(1.82, 0.25, 9), stripe, g, 0, 1.75, 0);
  mesh(box(15, 0.18, 2.2), white, g, 0, 1.3, 0.5);
  mesh(box(5, 0.12, 1.3), white, g, 0, 2.0, -4.9);
  mesh(box(0.14, 2, 1.6), stripe, g, 0, 2.9, -5);
  for (const s of [-1, 1]) {
    const eng = mesh(new THREE.CylinderGeometry(0.45, 0.5, 2.2, 12), mat('#9a9a9a', 0.4, 0.6), g, s * 3.2, 1.1, 1.1);
    eng.rotation.x = Math.PI / 2;
  }
  for (const [x, z] of [[-2, 1], [2, 1], [0, -4]]) mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.25, 10).rotateZ(Math.PI / 2), mat('#1a1a1a'), g, x, 0.3, z);
  return g;
}

export function palm(L, x, z, s = 1) {
  const trunkMat = mat('#8a6a4a', 0.95);
  let px = x, py = 0, pz = z;
  const lean = rr(0, Math.PI * 2), bend = rr(0.04, 0.1);
  for (let i = 0; i < 8; i++) {
    const seg = mesh(new THREE.CylinderGeometry(0.17 * s, 0.21 * s, 0.9 * s, 8), trunkMat, L.root, px, py + 0.45 * s, pz);
    seg.rotation.set(Math.sin(lean) * bend * i, 0, Math.cos(lean) * bend * i);
    px -= Math.cos(lean) * bend * i * 0.9 * s * 0.9; pz += Math.sin(lean) * bend * i * 0.9 * s * 0.9; py += 0.88 * s;
  }
  const leaf = std({ color: '#4f8a3a', roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const f = mesh(new THREE.ConeGeometry(0.35 * s, 3.2 * s, 4), leaf, L.root, px + Math.cos(a) * 1.2 * s, py - 0.2 * s, pz + Math.sin(a) * 1.2 * s);
    f.scale.z = 0.15;
    f.rotation.set(0, -a, 0);
    f.rotateZ(-Math.PI / 2 + 0.45);
  }
  L.addBox(x, z, 0.5 * s, 0.5 * s);
}

export function pool(L, x, z, w, d) {
  const tile = mat('#e8e2d2', 0.6);
  for (const [ox, oz, ww, dd] of [[0, -d / 2 - 0.4, w + 1.6, 0.8], [0, d / 2 + 0.4, w + 1.6, 0.8], [-w / 2 - 0.4, 0, 0.8, d], [w / 2 + 0.4, 0, 0.8, d]]) {
    mesh(box(ww, 0.12, dd), tile, L.root, x + ox, 0.06, z + oz, false);
  }
  // The ground and terrace are flat planes at y≈0, so the water has to sit on top of
  // them to be seen (it used to sit below and was hidden). A low coping frames it.
  const water = flat(w, d, std({ map: withRepeat(TEX2.water, w / 4, d / 4), color: '#5cc4e6', roughness: 0.05, metalness: 0.1, emissive: '#0a4a62', emissiveIntensity: 0.55 }), L.root, x, 0.07, z);
  water.renderOrder = 1;
  flat(w + 0.3, d + 0.3, mat('#2f8fb0', 0.4), L.root, x, 0.045, z);   // darker rim where the wall meets the water
  water.userData.dynamic = true;
  L.water = water;
  L.addBox(x, z, w, d);
  L.mapRects.push({ x, z, w, d, color: '#3fb3d6' });
}

export function sunUmbrella(L, x, z, color = '#e8d2a0') {
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), mat('#eee', 0.5), L.root, x, 1.2, z);
  mesh(new THREE.ConeGeometry(1.5, 0.5, 10), mat(color, 0.8), L.root, x, 2.45, z);
  table(L, x, z, 0.9, 0.9, '#f2efe6', 0.72);
}

export function militaryTruck(L, x, z, rot) {
  const g = new THREE.Group();
  const olive = mat('#4f5638', 0.8);
  mesh(box(2.3, 1.6, 2.2), olive, g, 0, 1.4, 2.4);
  mesh(box(2.1, 0.6, 0.05), mat('#1c2a35', 0.15, 0.6), g, 0, 1.75, 3.52);
  mesh(box(2.4, 0.4, 7), mat('#2a2a2a', 0.8), g, 0, 0.75, 0);
  const canvas = mat('#5a6040', 0.95);
  mesh(box(2.4, 2.0, 4.6), canvas, g, 0, 2.0, -1.2);
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14).rotateZ(Math.PI / 2);
  for (const zz of [2.4, -1, -2.6]) for (const xx of [-1.1, 1.1]) mesh(wheelGeo, mat('#1a1a1a'), g, xx, 0.5, zz);
  g.position.set(x, 0, z); g.rotation.y = rot; L.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  L.addBox(x, z, sw ? 7.2 : 2.5, sw ? 2.5 : 7.2);
  contactShadow(L.root, x, z, 2.2, 6.8, rot, 1);
  L.occluders.push(g);
  return g;
}

export function barricade(L, x, z, w, rot = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < Math.floor(w / 0.9); i++) {
    const t = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 14), mat('#1a1a1a', 0.9), g, -w / 2 + 0.45 + i * 0.9, 0.2 + (i % 2) * 0.25, rr(-0.2, 0.2));
    t.rotation.x = Math.PI / 2 + rr(-0.4, 0.4);
  }
  const plank = mat('#6a4a2e', 0.9);
  for (let i = 0; i < 3; i++) mesh(box(w * rr(0.5, 0.9), 0.12, 0.3), plank, g, rr(-0.5, 0.5), 0.6 + i * 0.2, rr(-0.3, 0.3)).rotation.z = rr(-0.3, 0.3);
  g.position.set(x, 0, z); g.rotation.y = rot; L.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  L.addBox(x, z, sw ? 1.2 : w, sw ? w : 1.2);
}

export function burntCar(L, x, z, rot) {
  const g = new THREE.Group();
  const black = mat('#222020', 0.95), rust = mat('#5a3a2a', 0.9);
  mesh(box(1.9, 0.62, 4.3), rust, g, 0, 0.5, 0);
  mesh(box(1.7, 0.5, 2.1), black, g, 0, 1.05, -0.2);
  g.position.set(x, 0, z); g.rotation.y = rot; g.rotation.z = 0.05; L.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  L.addBox(x, z, sw ? 4.4 : 2, sw ? 2 : 4.4);
  L.occluders.push(g);
}

export { signTexture, signMaterials };

// Instanced grass tufts / weeds scattered over a rectangle (cheap detail).
const TUFT = (() => {
  const g = new THREE.ConeGeometry(0.06, 0.35, 3);
  g.translate(0, 0.17, 0);
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const b = g.clone();
    b.rotateZ((Math.random() - 0.5) * 0.7); b.rotateX((Math.random() - 0.5) * 0.7);
    b.translate((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15);
    parts.push(b);
  }
  return parts;
})();
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const TUFT_GEO = mergeGeometries(TUFT.map((g) => g.toNonIndexed()));
export function grassTufts(L, x0, x1, z0, z1, n, color = '#6f8f3a', avoid = null) {
  const m = new THREE.InstancedMesh(TUFT_GEO, std({ color, roughness: 1, flatShading: true }), n);
  const o = new THREE.Object3D();
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    const x = rr(x0, x1), z = rr(z0, z1);
    if (avoid && avoid(x, z)) continue;
    o.position.set(x, 0, z); o.rotation.y = rand() * 6.28; o.scale.setScalar(rr(0.35, 0.95));
    o.updateMatrix(); m.setMatrixAt(k++, o.matrix);
  }
  m.count = k;
  m.receiveShadow = true;
  m.userData.dynamic = true;
  L.root.add(m);
  return m;
}

// Service rifle, pointing along +z from its grip.
export function createRifle() {
  const g = new THREE.Group();
  const wood = mat('#6a4428', 0.7), steel = mat('#2a2a2c', 0.4, 0.7);
  mesh(box(0.06, 0.1, 0.42), wood, g, 0, -0.02, -0.12, false);
  mesh(box(0.05, 0.06, 0.36), wood, g, 0, -0.01, 0.24, false);
  mesh(box(0.05, 0.07, 0.22), steel, g, 0, 0.03, 0.06, false);
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8).rotateX(Math.PI / 2), steel, g, 0, 0.04, 0.5, false);
  mesh(box(0.03, 0.12, 0.05), steel, g, 0, -0.08, 0.12, false);
  return g;
}
export function muzzleFlash() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  m.scale.set(1, 1, 2.2);
  m.visible = false;
  const l = new THREE.PointLight('#ffb050', 8, 6, 2);
  m.add(l);
  return m;
}
export function createKnife() {
  const g = new THREE.Group();
  mesh(box(0.025, 0.03, 0.1), mat('#2a1a10', 0.7), g, 0, 0, 0, false);
  mesh(box(0.01, 0.025, 0.18), mat('#cfd3d8', 0.25, 0.9), g, 0, 0.005, 0.14, false);
  return g;
}

// Distant scenery so towns never end in empty fog: snow-capped Andes and
// low-detail skylines / hillside houses outside the playable area.
// Distant mountains ignore fog (it would wash them out) and carry their own haze tint.
const ANDES_ROCK = std({ color: '#7d7a8c', roughness: 1, flatShading: true, fog: false });
const ANDES_SNOW = std({ color: '#f4f4f6', roughness: 0.9, flatShading: true, fog: false });
const FOOTHILL = std({ color: '#8f8a6c', roughness: 1, flatShading: true, fog: false });
export function andes(L, cx, cz, dirX, dirZ, span = 900, dist = 420) {
  // A range of peaks along a line perpendicular to (dirX, dirZ), `dist` away.
  const px = -dirZ, pz = dirX;
  for (let i = 0; i < 26; i++) {
    const t = (i / 25 - 0.5) * span + rr(-15, 15);
    const d = dist + rr(-40, 60);
    const x = cx + dirX * d + px * t, z = cz + dirZ * d + pz * t;
    const h = rr(140, 260), r = rr(70, 120);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), ANDES_ROCK);
    peak.position.set(x, h / 2 - 10, z); peak.rotation.y = rand() * 3; L.root.add(peak);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.36, h * 0.36, 7), ANDES_SNOW);
    cap.position.set(x, h - h * 0.18 - 10, z); cap.rotation.y = peak.rotation.y; L.root.add(cap);
  }
  for (let i = 0; i < 18; i++) {
    const t = (i / 17 - 0.5) * span;
    const d = dist * 0.6 + rr(-30, 30);
    const h = mesh(new THREE.SphereGeometry(rr(50, 90), 9, 6), FOOTHILL, L.root, cx + dirX * d + px * t, -rr(5, 15), cz + dirZ * d + pz * t, false);
    h.scale.y = rr(0.35, 0.55);
  }
}
const SKY_COLORS = ['#b8ac98', '#c4b69c', '#a99f8d', '#d8cdb5', '#9aa3a8', '#c9a27a'];
const skyMats = SKY_COLORS.map((c) => std({ map: withRepeat(windowTile(c), 3, 4), roughness: 0.95 }));
export function skyline(L, cx, cz, rMin, rMax, n, { hMin = 8, hMax = 30, avoid = null } = {}) {
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = rr(rMin, rMax);
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (avoid && avoid(x, z)) continue;
    const w = rr(10, 22), dd = rr(10, 22), h = rr(hMin, hMax);
    const b = new THREE.Mesh(box(w, h, dd), pick(skyMats));
    b.position.set(x, h / 2, z); b.rotation.y = rand() * 0.3;
    b.receiveShadow = true;
    L.root.add(b);
  }
}
// Colourful houses stacked up the hillsides around Valparaíso.
const HILL = std({ color: '#8a7a52', roughness: 1, flatShading: true });
export function hillsideHouses(L, cx, cz, rMin, rMax, n, skip = (a) => Math.sin(a) > 0.45) {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rr(-0.2, 0.2), d = rMax + rr(20, 60);
    if (skip(a)) continue;   // leave the bay side open
    const h = mesh(new THREE.SphereGeometry(rr(60, 100), 10, 7), HILL, L.root, cx + Math.cos(a) * d, -rr(10, 25), cz + Math.sin(a) * d, false);
    h.scale.y = rr(0.5, 0.75);
  }
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = rr(rMin, rMax);
    if (skip(a)) continue;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const y = (d - rMin) * 0.28;
    const w = rr(4, 7), dd = rr(4, 7), h = rr(3, 6);
    const b = new THREE.Mesh(box(w, h, dd), shackWallMats[Math.floor(rand() * shackWallMats.length)]);
    b.position.set(x, y + h / 2, z); b.rotation.y = rand() * 0.6;
    L.root.add(b);
    if (y > 1) mesh(box(w, y, dd), mat('#8a7a62', 1), L.root, x, y / 2, z, false);
  }
}
