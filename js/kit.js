// Shared building kit: textures, props, vehicles, and the Loc container that
// every location (outdoor area, interior room, cutscene set) is built into.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat } from './character.js';
import { bakeChildren } from './bake.js';

// ---------------------------------------------------------------- random
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _r = rng(1337);
export const seedRandom = (s) => { _r = rng(s); };
export const rand = () => _r();
export const rr = (a, b) => a + _r() * (b - a);
export const pick = (a) => a[Math.floor(_r() * a.length)];

// ---------------------------------------------------------------- textures
export function canvasTexture(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function speckle(g, w, h, n, colors, size = 2, a0 = 0.02, a1 = 0.07) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a0 + Math.random() * (a1 - a0);
    g.fillStyle = colors[i % colors.length];
    g.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
  g.globalAlpha = 1;
}
function blotches(g, w, h, n, rgbs, alpha = 0.35, rMin = 40, rMax = 150) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = rMin + Math.random() * (rMax - rMin);
    const c = rgbs[i % rgbs.length];
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grd.addColorStop(0, `rgba(${c},${alpha})`); grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
}
export function withRepeat(tex, x, y) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(x, y);
  return t;
}

export const TEX = {
  sand: canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#dcc49c'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 40, ['200,170,125', '235,215,180']);
    speckle(g, w, h, 1000, ['#b8976a', '#f0dcb4']);
  }, true),
  dirt: canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#a88b67'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 50, ['120,95,70', '190,165,130', '90,80,70'], 0.3);
    speckle(g, w, h, 3000, ['#6f5a44', '#cbb08a'], 2, 0.05, 0.15);
  }, true),
  asphalt: canvasTexture(512, 1024, (g, w, h) => {
    g.fillStyle = '#44464b'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2800, ['#2f3034', '#5a5c61']);
    g.fillStyle = 'rgba(0,0,0,0.07)';
    for (const x of [0.17, 0.33, 0.67, 0.83]) g.fillRect(w * x - 18, 0, 36, h);
    g.fillStyle = '#eeeae0';
    g.fillRect(22, 0, 10, h); g.fillRect(w - 32, 0, 10, h);
    g.fillStyle = '#e8b93c';
    g.fillRect(w / 2 - 13, 0, 8, h); g.fillRect(w / 2 + 5, 0, 8, h);
  }, true),
  asphaltPlain: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#44464b'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 900, ['#2f3034', '#5a5c61']);
  }, true),
  lot: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#505257'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1000, ['#38383c', '#5d5d62']);
  }, true),
  concrete: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#cdc8bf'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 900, ['#a9a397', '#e0dcd4']);
    g.strokeStyle = 'rgba(90,85,78,0.3)'; g.lineWidth = 3;
    g.strokeRect(0, 0, w, h);
  }, true),
  grass: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#7fa04c'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2000, ['#6b8a3c', '#9cb865'], 3);
  }, true),
  chainlink: canvasTexture(64, 64, (g, w, h) => {
    g.strokeStyle = 'rgba(190,195,200,0.95)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  }, true),
  corrugated: canvasTexture(256, 256, (g, w, h) => {
    for (let x = 0; x < w; x += 16) {
      const grd = g.createLinearGradient(x, 0, x + 16, 0);
      grd.addColorStop(0, '#8a8d90'); grd.addColorStop(0.5, '#b9bcbf'); grd.addColorStop(1, '#7a7d80');
      g.fillStyle = grd; g.fillRect(x, 0, 16, h);
    }
    blotches(g, w, h, 14, ['140,80,40', '120,70,35'], 0.45, 10, 50);
  }, true),
  tiles: canvasTexture(256, 256, (g, w, h) => {
    const s = w / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#b8452f' : '#efe3c8';
      g.fillRect(i * s, j * s, s, s);
    }
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2;
    for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, true),
  carpet: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#6a2430'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#4f1a24', '#83323f'], 2, 0.1, 0.25);
  }, true),
  wallpaper: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#dcc59a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#cfb584';
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
    g.fillStyle = 'rgba(160,120,60,0.25)';
    for (let y = 16; y < h; y += 64) for (let x = 22; x < w; x += 64) {
      g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
    }
  }, true),
  wood: canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#6b4226'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,20,10' : '140,90,50'},${0.08 + Math.random() * 0.12})`;
      g.fillRect(0, y, w, 2 + Math.random() * 2);
    }
  }, true),
};

export function windowTile(wall, variant = 'window') {
  return canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = wall; g.fillRect(0, 0, w, h);
    const rect = { window: [26, 28, 102, 92], shop: [10, 20, 118, 112], slit: [56, 18, 72, 104] }[variant];
    const [x0, y0, x1, y1] = rect;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8);
    const grd = g.createLinearGradient(x0, y0, x1, y1);
    grd.addColorStop(0, '#9ec1d6'); grd.addColorStop(0.5, '#4d6f86'); grd.addColorStop(1, '#223746');
    g.fillStyle = grd; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (variant !== 'slit') {
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 + 30, y0); g.lineTo(x0 + 45, y0); g.lineTo(x0 + 15, y1); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x0 - 4, y1 + 2, x1 - x0 + 8, 5);
    }
  }, true);
}

export function signTexture(text, bg, fg, sub, w = 1024, h = 256) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 12; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = Math.round(h * (sub ? 0.43 : 0.5));
    const font = (s) => `900 ${s}px "Arial Black", Impact, sans-serif`;
    g.font = font(size);
    while (g.measureText(text).width > w - 90 && size > 20) { size -= 4; g.font = font(size); }
    g.fillText(text, w / 2, sub ? h / 2 - h * 0.11 : h / 2 + 4);
    if (sub) {
      let s2 = Math.round(h * 0.2);
      g.font = `700 ${s2}px Arial, sans-serif`;
      while (g.measureText(sub).width > w - 90 && s2 > 12) { s2 -= 2; g.font = `700 ${s2}px Arial, sans-serif`; }
      g.fillText(sub, w / 2, h / 2 + h * 0.27);
    }
  });
}

export function signMaterials(tex, bg, glow = 0.15) {
  const edge = mat(bg, 0.6);
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow });
  return [edge, edge, edge, edge, face, face];
}

// ---------------------------------------------------------------- meshes
export function mesh(geo, material, parent, x = 0, y = 0, z = 0, shadows = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadows;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export function flat(w, d, material, parent, x, y, z) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const std = (opts) => new THREE.MeshStandardMaterial(opts);

// Soft dark falloff used for cheap contact shadows (fake ambient occlusion).
const CONTACT = (() => {
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 22;
    g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(30, 30, w - 60, h - 60);
  });
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.5, color: '#000000',
    polygonOffset: true, polygonOffsetFactor: -2 });
})();
export function contactShadow(parent, x, z, w, d, rot = 0, pad = 2.2, y = 0.06) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w + pad * 2, d + pad * 2), CONTACT);
  m.rotation.set(-Math.PI / 2, 0, rot);
  m.position.set(x, y, z);
  m.renderOrder = 1;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- vehicles
const HEADLIGHT = std({ color: '#fff6d8', emissive: '#fff1c0', emissiveIntensity: 0.6 });
const TAILLIGHT = std({ color: '#b01818', emissive: '#7a0000', emissiveIntensity: 0.6 });
const GLASS = mat('#1c2a35', 0.15, 0.6);
const TIRE = mat('#1a1a1a', 0.9);
const HUB = mat('#9a9a9a', 0.4, 0.6);

export function createCar(color, style = 'sedan') {
  const g = new THREE.Group();
  const paint = mat(color, 0.35, 0.35);
  const trim = mat('#2a2a2a', 0.6);
  const suv = style === 'suv';
  const len = suv ? 4.5 : 4.3;
  if (suv) {
    mesh(box(1.96, 0.78, len), paint, g, 0, 0.8, 0);
    mesh(box(2.0, 0.34, len + 0.04), mat('#3b3b3b', 0.8), g, 0, 0.47, 0);
    mesh(box(1.82, 0.64, 2.9), GLASS, g, 0, 1.5, -0.35);
    mesh(box(1.78, 0.08, 2.7), paint, g, 0, 1.85, -0.4);
    mesh(box(1.9, 0.5, 0.1), GLASS, g, 0, 1.3, len / 2 - 0.9).rotation.x = -0.5;
  } else {
    mesh(box(1.9, 0.62, len), paint, g, 0, 0.66, 0);
    mesh(box(1.72, 0.55, 2.2), GLASS, g, 0, 1.24, -0.25);
    mesh(box(1.68, 0.07, 2.0), paint, g, 0, 1.53, -0.25);
  }
  if (style === 'police') {
    mesh(box(1.93, 0.14, len + 0.02), mat('#1d4f9c', 0.5), g, 0, 0.72, 0);
    mesh(box(1.1, 0.12, 0.3), mat('#222'), g, 0, 1.62, -0.25);
    mesh(box(0.5, 0.12, 0.28), std({ color: '#ff3030', emissive: '#ff1010', emissiveIntensity: 1 }), g, -0.28, 1.7, -0.25);
    mesh(box(0.5, 0.12, 0.28), std({ color: '#3050ff', emissive: '#1030ff', emissiveIntensity: 1 }), g, 0.28, 1.7, -0.25);
  }
  for (const z of [-len / 2 - 0.02, len / 2 + 0.02]) mesh(box(1.96, 0.22, 0.18), trim, g, 0, 0.42, z);
  for (const x of [-0.62, 0.62]) {
    mesh(box(0.42, 0.16, 0.05), HEADLIGHT, g, x, suv ? 0.95 : 0.76, len / 2 + 0.01, false);
    mesh(box(0.4, 0.14, 0.05), TAILLIGHT, g, x, suv ? 0.98 : 0.78, -len / 2 - 0.01, false);
  }
  const r = suv ? 0.42 : 0.38;
  const wheelGeo = new THREE.CylinderGeometry(r, r, 0.28, 18).rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(r * 0.52, r * 0.52, 0.3, 10).rotateZ(Math.PI / 2);
  g.userData.wheels = [];
  for (const x of [-0.9, 0.9]) for (const z of [-1.38, 1.38]) {
    const w = new THREE.Group();
    w.position.set(x, r, z);
    mesh(wheelGeo, TIRE, w);
    mesh(hubGeo, HUB, w, 0, 0, 0, false);
    g.add(w);
    g.userData.wheels.push(w);
  }
  return g;
}

export function createRV() {
  const g = new THREE.Group();
  const cream = mat('#ece2c6', 0.8);
  const brown = mat('#7a4e27', 0.7);
  mesh(box(2.5, 2.5, 6.4), cream, g, 0, 1.85, -0.5);
  mesh(box(2.52, 0.3, 6.42), brown, g, 0, 1.45, -0.5);
  mesh(box(2.52, 0.12, 6.42), mat('#c79a5b', 0.7), g, 0, 1.72, -0.5);
  mesh(box(2.4, 1.3, 1.5), cream, g, 0, 1.15, 3.35);
  mesh(box(2.3, 0.7, 0.9), GLASS, g, 0, 2.0, 2.95);
  mesh(box(2.5, 0.9, 0.9), cream, g, 0, 2.66, 2.95);
  for (const s of [-1, 1]) {
    mesh(box(0.04, 0.6, 1.4), GLASS, g, s * 1.26, 2.3, -1.6);
    mesh(box(0.04, 0.6, 0.9), GLASS, g, s * 1.26, 2.3, 1.0);
  }
  mesh(box(0.05, 1.9, 0.8), brown, g, 1.27, 1.55, 0.2);
  mesh(box(0.7, 0.3, 0.7), mat('#cfcfcf', 0.5), g, 0, 3.25, -1.5);
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.34, 16).rotateZ(Math.PI / 2);
  for (const x of [-1.1, 1.1]) for (const z of [-2.6, -1.5, 3.1]) mesh(wheelGeo, TIRE, g, x, 0.48, z);
  return g;
}

// ---------------------------------------------------------------- location
export class Loc {
  constructor(id, name, { bounds, interior = false, env = {}, pedCount = 0, camMax = 10 } = {}) {
    this.id = id;
    this.name = name;
    this.root = new THREE.Group();
    this.bounds = bounds;             // {minX,maxX,minZ,maxZ}
    this.interior = interior;
    this.env = env;
    this.pedCount = pedCount;
    this.camMax = camMax;
    this.colliders = [];
    this.occluders = [];
    this.zones = [];
    this.mapRects = [];
    this.mapRoads = [];
    this.traffic = [];
    this.interactables = [];
    this.spawns = {};
    this.npcDefs = [];
    this.npcs = [];
  }

  addBox(x, z, w, d) {
    this.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
  }

  collide(pos, r) {
    for (const b of this.colliders) {
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      const dx = pos.x - cx, dz = pos.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x += (dx / d) * (r - d);
        pos.z += (dz / d) * (r - d);
      } else {
        const pen = [pos.x - b.minX, b.maxX - pos.x, pos.z - b.minZ, b.maxZ - pos.z];
        const i = pen.indexOf(Math.min(...pen));
        if (i === 0) pos.x = b.minX - r; else if (i === 1) pos.x = b.maxX + r;
        else if (i === 2) pos.z = b.minZ - r; else pos.z = b.maxZ + r;
      }
    }
    const B = this.bounds;
    pos.x = Math.max(B.minX + r, Math.min(B.maxX - r, pos.x));
    pos.z = Math.max(B.minZ + r, Math.min(B.maxZ - r, pos.z));
  }

  isFree(x, z, r) {
    const B = this.bounds;
    if (x < B.minX + r + 0.5 || x > B.maxX - r - 0.5 || z < B.minZ + r + 0.5 || z > B.maxZ - r - 0.5) return false;
    for (const b of this.colliders) {
      if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return false;
    }
    return true;
  }

  zoneAt(x, z) {
    for (const zn of this.zones) if (x >= zn.minX && x <= zn.maxX && z >= zn.minZ && z <= zn.maxZ) return zn.name;
    return this.name;
  }

  // path(p) -> [x, z, headingX, headingZ]; p runs 0..length and wraps.
  addTraffic(color, path, length, start, style = 'sedan') {
    const car = createCar(color, style);
    bakeChildren(car);
    contactShadow(car, 0, 0, 1.6, 4.0, 0, 0.9);
    car.userData.dynamic = true;
    this.root.add(car);
    this.traffic.push({ mesh: car, path, length, p: start, speed: 0, heading: new THREE.Vector3(1, 0, 0), pos: car.position });
  }

  updateTraffic(dt, agents) {
    const tmp = new THREE.Vector3();
    for (const car of this.traffic) {
      const [x, z, hx, hz] = car.path(((car.p % car.length) + car.length) % car.length);
      car.heading.set(hx, 0, hz);
      car.pos.set(x, 0, z);
      let blocked = false;
      const check = (ax, az, range) => {
        tmp.set(ax - x, 0, az - z);
        const along = tmp.dot(car.heading);
        const lat = Math.abs(tmp.x * car.heading.z - tmp.z * car.heading.x);
        if (along > 0.5 && along < range && lat < 1.9) blocked = true;
      };
      for (const a of agents) check(a.x, a.z, 8);
      for (const o of this.traffic) if (o !== car) check(o.pos.x, o.pos.z, 10);
      const target = blocked ? 0 : 11;
      car.speed += (target - car.speed) * Math.min(1, dt * (blocked ? 6 : 1.2));
      car.p += car.speed * dt;
      const yaw = Math.atan2(car.heading.x, car.heading.z);
      const d = Math.atan2(Math.sin(yaw - car.mesh.rotation.y), Math.cos(yaw - car.mesh.rotation.y));
      car.mesh.rotation.y += d * Math.min(1, dt * 8);
    }
  }

  pushFromTraffic(pos, r) {
    for (const car of this.traffic) {
      for (const off of [-1.2, 1.2]) {
        const cx = car.pos.x + car.heading.x * off, cz = car.pos.z + car.heading.z * off;
        const dx = pos.x - cx, dz = pos.z - cz;
        const d = Math.hypot(dx, dz), min = r + 1.15;
        if (d < min && d > 1e-5) { pos.x += (dx / d) * (min - d); pos.z += (dz / d) * (min - d); }
      }
    }
  }

  finalize() {
    const flatOcc = [];
    for (const o of this.occluders) o.traverse((m) => { if (m.isMesh) flatOcc.push(m); });
    this.occluders = flatOcc;
    mergeStatic(this.root);
  }
}

// Paths for ambient traffic.
export const loopPath = (L, reverse = false) => (p) => {
  if (reverse) p = 8 * L - p;
  const side = Math.floor(p / (2 * L)) % 4;
  const t = p - side * 2 * L - L;
  const s = reverse ? -1 : 1;
  switch (side) {
    case 0: return [t, -L, s, 0];
    case 1: return [L, t, 0, s];
    case 2: return [-t, L, -s, 0];
    default: return [-L, -t, 0, -s];
  }
};
export const linePath = (z, L, dir) => (p) => [dir * (p - L), z, dir, 0];

// Collapse static single-material meshes into one mesh per material.
function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || o.material.vertexColors) return;
    for (let p = o; p; p = p.parent) if (p.userData.dynamic) return;
    let geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (geo.index) geo = geo.toNonIndexed();
    if (!geo.attributes.uv || !geo.attributes.normal) return;
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    geo.clearGroups();
    const key = o.material.uuid + (o.castShadow ? '|s' : '') + '|' + o.renderOrder;
    if (!buckets.has(key)) buckets.set(key, { material: o.material, cast: o.castShadow, order: o.renderOrder, geos: [] });
    buckets.get(key).geos.push(geo);
    victims.push(o);
  });
  for (const o of victims) o.parent.remove(o);
  for (const b of buckets.values()) {
    const m = new THREE.Mesh(mergeGeometries(b.geos, false), b.material);
    m.castShadow = b.cast;
    m.receiveShadow = true;
    m.renderOrder = b.order;
    root.add(m);
  }
}

// ---------------------------------------------------------------- builders
const FACES = {
  '+z': { nx: 0, nz: 1, rot: 0 }, '-z': { nx: 0, nz: -1, rot: Math.PI },
  '+x': { nx: 1, nz: 0, rot: Math.PI / 2 }, '-x': { nx: -1, nz: 0, rot: -Math.PI / 2 },
};
export function onFace(loc, obj, b, face, along, y, out = 0.06) {
  const f = FACES[face];
  const half = f.nx ? b.w / 2 : b.d / 2;
  const tx = Math.cos(f.rot), tz = -Math.sin(f.rot);
  obj.position.set(b.x + f.nx * (half + out) + tx * along, y, b.z + f.nz * (half + out) + tz * along);
  obj.rotation.y = f.rot;
  loc.root.add(obj);
  return obj;
}
export function facePoint(b, face, along, out) {
  const f = FACES[face];
  const half = f.nx ? b.w / 2 : b.d / 2;
  return { x: b.x + f.nx * (half + out) + Math.cos(f.rot) * along, z: b.z + f.nz * (half + out) - Math.sin(f.rot) * along, yaw: f.rot };
}

export function building(loc, b) {
  const { x, z, w, d, h, color, roof = '#8a8178', face = '+z', variant = 'window' } = b;
  const tile = windowTile(color, variant);
  const side = (a, hh) => std({ map: withRepeat(tile, Math.max(1, Math.round(a / 4)), Math.max(1, Math.round(hh / 3.4))), roughness: 0.9 });
  const roofMat = mat(roof, 0.95);
  const m = mesh(box(w, h, d), [side(d, h), side(d, h), roofMat, roofMat, side(w, h), side(w, h)], loc.root, x, h / 2, z);
  loc.occluders.push(m);
  loc.addBox(x, z, w, d);
  contactShadow(loc.root, x, z, w, d);
  const trim = new THREE.Color(color).multiplyScalar(0.7).getStyle();
  mesh(box(w + 0.3, 0.4, d + 0.3), mat(b.trim || trim, 0.9), loc.root, x, h + 0.2, z);
  for (let i = 0; i < Math.floor((w * d) / 90); i++) {
    mesh(box(1.4, 0.9, 1.1), mat('#b7b7b2', 0.6, 0.3), loc.root, x + rr(-w / 3, w / 3), h + 0.45, z + rr(-d / 3, d / 3));
  }
  if (b.door !== false) {
    const door = new THREE.Mesh(box(1.8, 2.5, 0.12), mat(b.doorColor || '#4a3322', 0.6));
    door.castShadow = true;
    onFace(loc, door, b, face, b.doorAt || 0, 1.25);
    const awning = new THREE.Mesh(box(3.2, 0.12, 1.2), mat(b.accent || '#8a3b2a', 0.8));
    awning.castShadow = true;
    onFace(loc, awning, b, face, b.doorAt || 0, 2.9, 0.6);
  }
  if (b.sign) {
    const span = FACES[face].nx ? d : w;
    const sw = b.signWidth || Math.min(span * 0.8, 16);
    const tex = signTexture(b.sign, b.signBg || '#222', b.signFg || '#fff', b.signSub);
    const sign = new THREE.Mesh(box(sw, sw / 4, 0.3), signMaterials(tex, b.signBg || '#222'));
    sign.castShadow = true;
    onFace(loc, sign, b, face, b.signAt || 0, b.signY ?? h + sw / 8 + 0.3, b.signOut ?? -0.2);
  }
  loc.mapRects.push({ x, z, w, d, color });
  return m;
}

// Pole sign (two-sided) standing by the street.
export function poleSign(loc, x, z, rot, text, bg, fg, sub, height = 7, w = 5) {
  mesh(new THREE.CylinderGeometry(0.2, 0.25, height, 10), mat('#8a8a8a', 0.4, 0.6), loc.root, x, height / 2, z);
  loc.addBox(x, z, 0.5, 0.5);
  const s = new THREE.Mesh(box(w, w * 0.44, 0.3), signMaterials(signTexture(text, bg, fg, sub), bg, 0.2));
  s.position.set(x, height + w * 0.22, z);
  s.rotation.y = rot;
  s.castShadow = true;
  loc.root.add(s);
}

// Single-storey stucco house with a pitched roof, facing +z or -z.
export function house(loc, { x, z, w = 14, d = 10, color = '#d9c7a5', roof = '#7b5b45', face = '-z', garage = true }) {
  const g = new THREE.Group();
  const hh = 3.3;
  const tile = windowTile(color);
  const wall = (a) => std({ map: withRepeat(tile, Math.max(1, Math.round(a / 4)), 1), roughness: 0.95 });
  const roofM = mat(roof, 0.9);
  const body = mesh(box(w, hh, d), [wall(d), wall(d), roofM, roofM, wall(w), wall(w)], g, 0, hh / 2, 0);
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2 - 0.8, 0); shape.lineTo(d / 2 + 0.8, 0); shape.lineTo(0, 2.3); shape.lineTo(-d / 2 - 0.8, 0);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: w + 1.2, bevelEnabled: false });
  roofGeo.translate(0, 0, -(w + 1.2) / 2).rotateY(Math.PI / 2);
  const roofMesh = mesh(roofGeo, roofM, g, 0, hh, 0);
  // Front details (built facing -z, then the group is rotated).
  mesh(box(1.2, 2.3, 0.12), mat('#5a3a22', 0.6), g, -2, 1.15, -d / 2 - 0.06);
  const concrete = std({ map: withRepeat(TEX.concrete, 2, 4), roughness: 0.95 });
  mesh(box(1.4, 0.06, 6), concrete, g, -2, 0.055, -d / 2 - 3);
  if (garage) {
    mesh(box(4.2, 2.6, 0.12), mat('#ece6da', 0.7), g, w / 2 - 3, 1.3, -d / 2 - 0.06);
    mesh(box(4, 0.08, 9), concrete, g, w / 2 - 3, 0.06, -d / 2 - 4.5, false);
  }
  g.position.set(x, 0, z);
  g.rotation.y = face === '-z' ? 0 : Math.PI;
  loc.root.add(g);
  loc.occluders.push(body, roofMesh);
  loc.addBox(x, z, w, d);
  contactShadow(loc.root, x, z, w, d);
  loc.mapRects.push({ x, z, w, d, color: '#b79a7a' });
  const s = face === '-z' ? 1 : -1;
  return { driveway: { x: x + s * (w / 2 - 3), z: z - s * (d / 2 + 5) }, door: { x: x - s * 2, z: z - s * (d / 2 + 1.2) } };
}

export function parkCar(loc, x, z, rot, color, style = 'sedan') {
  const c = createCar(color, style);
  c.position.set(x, 0, z);
  c.rotation.y = rot;
  loc.root.add(c);
  const sideways = Math.abs(Math.sin(rot)) > 0.5;
  loc.addBox(x, z, sideways ? 4.5 : 2.0, sideways ? 2.0 : 4.5);
  contactShadow(loc.root, x, z, 1.6, 4.0, rot, 0.9);
  loc.occluders.push(c);
  return c;
}

const POLE = mat('#7d7f82', 0.5, 0.6);
const LAMP = std({ color: '#fff8e0', emissive: '#ffe9a8', emissiveIntensity: 0.4 });
export function streetlight(loc, x, z, rot) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.08, 0.13, 6.5, 8), POLE, g, 0, 3.25, 0);
  mesh(box(0.1, 0.1, 1.8), POLE, g, 0, 6.4, 0.85);
  mesh(box(0.35, 0.14, 0.6), LAMP, g, 0, 6.3, 1.7, false);
  g.position.set(x, 0, z); g.rotation.y = rot;
  loc.root.add(g);
  loc.addBox(x, z, 0.3, 0.3);
}

const inBounds = (loc, x, z) => {
  const B = loc.bounds;
  return x > B.minX - 1 && x < B.maxX + 1 && z > B.minZ - 1 && z < B.maxZ + 1;
};
export function cactus(loc, x, z, s = 1) {
  const g = new THREE.Group();
  const green = mat('#4d7a3a', 0.85);
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 10);
  mesh(cap(0.3 * s, 2.6 * s), green, g, 0, 1.6 * s, 0);
  const arm = (side, h, len) => {
    mesh(cap(0.18 * s, 0.5 * s), green, g, side * 0.45 * s, h * s, 0).rotation.z = Math.PI / 2;
    mesh(cap(0.18 * s, len * s), green, g, side * 0.7 * s, (h + len / 2 + 0.1) * s, 0);
  };
  arm(1, 1.4, 0.9);
  if (rand() > 0.4) arm(-1, 1.9, 0.7);
  g.position.set(x, 0, z); g.rotation.y = rand() * Math.PI;
  loc.root.add(g);
  if (inBounds(loc, x, z)) loc.addBox(x, z, 0.7 * s, 0.7 * s);
}
const ROCK = std({ color: '#a1826a', roughness: 1, flatShading: true });
const SHRUB = std({ color: '#7d8a4a', roughness: 1, flatShading: true });
export function rock(loc, x, z, s) {
  const m = mesh(new THREE.DodecahedronGeometry(s, 0), ROCK, loc.root, x, s * 0.4, z);
  m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  m.scale.y = 0.6;
  if (inBounds(loc, x, z)) loc.addBox(x, z, s * 1.4, s * 1.4);
}
export function shrub(loc, x, z) {
  mesh(new THREE.IcosahedronGeometry(rr(0.4, 0.8), 0), SHRUB, loc.root, x, 0.3, z).scale.y = 0.7;
}
const LEAVES = [std({ color: '#5f8a3a', roughness: 0.9, flatShading: true }), std({ color: '#6f9a45', roughness: 0.9, flatShading: true })];
export function tree(loc, x, z, s = 1) {
  mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.6 * s, 8), mat('#6b4a2e', 0.9), loc.root, x, 1.3 * s, z);
  for (let i = 0; i < 3; i++) {
    const c = mesh(new THREE.IcosahedronGeometry(rr(1.1, 1.6) * s, 1), pick(LEAVES), loc.root,
      x + rr(-0.6, 0.6) * s, (2.9 + i * 0.55) * s, z + rr(-0.6, 0.6) * s);
    c.scale.y = 0.85;
  }
  loc.addBox(x, z, 0.5 * s, 0.5 * s);
}
export function dumpster(loc, x, z, color, rot = 0) {
  const g = new THREE.Group();
  mesh(box(2.2, 1.4, 1.2), mat(color, 0.7, 0.3), g, 0, 0.7, 0);
  mesh(box(2.3, 0.1, 1.3), mat('#222', 0.8), g, 0, 1.45, 0);
  g.position.set(x, 0, z); g.rotation.y = rot; loc.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  loc.addBox(x, z, sw ? 1.2 : 2.2, sw ? 2.2 : 1.2);
}
export function bench(loc, x, z, rot) {
  const g = new THREE.Group();
  mesh(box(2, 0.1, 0.5), mat('#6d4a2c', 0.8), g, 0, 0.5, 0);
  mesh(box(2, 0.5, 0.08), mat('#6d4a2c', 0.8), g, 0, 0.8, -0.22);
  for (const s of [-0.85, 0.85]) mesh(box(0.08, 0.5, 0.5), mat('#333', 0.5, 0.5), g, s, 0.25, 0);
  g.position.set(x, 0, z); g.rotation.y = rot; loc.root.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.5;
  loc.addBox(x, z, sw ? 0.6 : 2, sw ? 2 : 0.6);
}
export function patioTable(loc, x, z, umbrella = '#d8452e') {
  mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 16), mat('#f2f2f2', 0.5), loc.root, x, 0.8, z);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), mat('#999', 0.5, 0.5), loc.root, x, 1.2, z);
  mesh(new THREE.ConeGeometry(1.4, 0.6, 8), mat(umbrella, 0.8), loc.root, x, 2.5, z);
  loc.addBox(x, z, 1.2, 1.2);
}

// Straight fence between two axis-aligned points.
export function fence(loc, x1, z1, x2, z2, { h = 2.4, barbed = false, solid = null } = {}) {
  const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
  const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const material = solid || std({ map: withRepeat(TEX.chainlink, len / 0.9, h / 0.9), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.4 });
  if (solid) {
    const panel = mesh(box(alongX ? len : 0.08, h, alongX ? 0.08 : len), solid, loc.root, cx, h / 2, cz);
    loc.occluders.push(panel);
  } else {
    const m = mesh(new THREE.PlaneGeometry(len, h), material, loc.root, cx, h / 2, cz);
    m.rotation.y = alongX ? 0 : Math.PI / 2;
    const rail = mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 6), POLE, loc.root, cx, h, cz, false);
    rail.rotation.set(0, alongX ? 0 : Math.PI / 2, Math.PI / 2);
    for (let t = 0; t <= len + 0.01; t += 4) {
      const px = alongX ? Math.min(x1, x2) + t : cx, pz = alongX ? cz : Math.min(z1, z2) + t;
      mesh(new THREE.CylinderGeometry(0.06, 0.06, h + 0.2, 6), POLE, loc.root, px, (h + 0.2) / 2, pz, false);
    }
  }
  if (barbed) {
    const coil = mesh(new THREE.TorusGeometry(0.25, 0.02, 4, 10), POLE, loc.root, 0, 0, 0, false);
    loc.root.remove(coil);
    for (let t = 0; t <= len; t += 0.45) {
      const c = coil.clone();
      c.position.set(alongX ? Math.min(x1, x2) + t : cx, h + 0.3, alongX ? cz : Math.min(z1, z2) + t);
      c.rotation.y = alongX ? Math.PI / 2 : 0;
      loc.root.add(c);
    }
  }
  loc.addBox(cx, cz, alongX ? len : 0.2, alongX ? 0.2 : len);
}

// Low block wall (collider, not a camera occluder).
export function lowWall(loc, x, z, w, d, h = 1.3, color = '#c6b08a') {
  mesh(box(w, h, d), mat(color, 0.95), loc.root, x, h / 2, z);
  loc.addBox(x, z, w, d);
}

export function ground(loc, tex = TEX.sand, repeat = 40) {
  flat(1200, 1200, std({ map: withRepeat(tex, repeat, repeat), roughness: 1 }), loc.root, 0, 0, 0);
}

const roadMats = {};
export function road(loc, x, z, len, alongX, width = 10) {
  const key = `${len}|${width}`;
  roadMats[key] ||= std({ map: withRepeat(TEX.asphalt, 1, len / 12), roughness: 0.95 });
  const m = flat(width, len, roadMats[key], loc.root, x, alongX ? 0.02 : 0.021, z);
  if (alongX) m.rotation.z = Math.PI / 2;
  loc.mapRoads.push(alongX ? { x, z, w: len, d: width } : { x, z, w: width, d: len });
}

const MESA = ['#b0785a', '#9c6a4f', '#c08d68', '#8e6a58'].map((color) => std({ color, roughness: 1, flatShading: true }));
export function mesas(loc, n = 40, rMin = 230, rMax = 380) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rr(-0.05, 0.05);
    const d = rr(rMin, rMax);
    const geo = rand() < 0.45 ? new THREE.CylinderGeometry(rr(20, 40), rr(28, 55), rr(18, 40), 7) : new THREE.ConeGeometry(rr(35, 80), rr(35, 95), 6);
    const m = mesh(geo, MESA[i % 4], loc.root, Math.cos(a) * d, 0, Math.sin(a) * d, false);
    m.position.y = geo.parameters.height / 2 - 2;
    m.rotation.y = rand() * 3;
  }
}
export function desertScatter(loc, n, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, d = rr(rMin, rMax);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (inBounds(loc, x, z)) continue;
    const k = rand();
    if (k < 0.3) cactus(loc, x, z, rr(0.8, 1.4)); else if (k < 0.55) rock(loc, x, z, rr(0.5, 2.2)); else shrub(loc, x, z);
  }
}

// A street running along x at z = zs, outside the playable bounds, with a
// sidewalk on the near side and two-way ambient traffic.
export function streetFront(loc, zs, { colors = ['#8c1c1c', '#1f3f73', '#d9d9d4', '#b8b32a'], across = true } = {}) {
  road(loc, 0, zs, 800, true);
  const concrete = std({ map: withRepeat(TEX.concrete, 400, 1), roughness: 0.95 });
  flat(800, 3, concrete, loc.root, 0, 0.04, zs - 6.5);
  flat(800, 3, concrete, loc.root, 0, 0.04, zs + 6.5);
  mesh(box(800, 0.14, 0.3), mat('#a39d92', 0.9), loc.root, 0, 0.07, zs - 5.1, false);
  mesh(box(800, 0.14, 0.3), mat('#a39d92', 0.9), loc.root, 0, 0.07, zs + 5.1, false);
  loc.addTraffic(colors[0], linePath(zs + 2.5, 260, 1), 520, 0);
  loc.addTraffic(colors[1], linePath(zs + 2.5, 260, 1), 520, 250);
  loc.addTraffic(colors[2], linePath(zs - 2.5, 260, -1), 520, 120);
  loc.addTraffic(colors[3], linePath(zs - 2.5, 260, -1), 520, 380);
  for (let x = -60; x <= 60; x += 30) streetlight(loc, x, zs - 6.2, 0);
  if (across) {
    // Low-detail buildings on the far side of the street for context.
    const fronts = [['#c9a27a', 'TIRES'], ['#d8cdb5', 'LIQUOR'], ['#a9b8c2', 'LAUNDROMAT'], ['#d7b98f', 'PAWN']];
    fronts.forEach(([color, name], i) => {
      const bx = -45 + i * 30;
      building(loc, { x: bx, z: zs + 16, w: 18, d: 10, h: 5, color, face: '-z', variant: 'shop', sign: name, signBg: '#2a2a2a', signFg: '#f2e2b0', signWidth: 9 });
    });
  }
}
