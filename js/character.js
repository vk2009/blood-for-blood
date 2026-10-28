// Procedural stylized 3D humanoid: shaped (lathed) torso, tapered limbs,
// rounded hands/shoes, a proper face, and a jointed skeleton (hips, knees,
// shoulders, elbows, head) driven by a code walk / run / idle / jump cycle.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bakeHierarchy } from './bake.js';

const matCache = new Map();
export function mat(color, rough = 0.85, metal = 0) {
  const key = `${color}|${rough}|${metal}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
    matCache.set(key, m);
  }
  return m;
}

const geoCache = new Map();
function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}

// Tapered limb segment hanging down from its pivot (y = 0 to -len).
const limb = (rTop, rBot, len) => cached(`limb${rTop}|${rBot}|${len}`, () =>
  new THREE.CylinderGeometry(rTop, rBot, len, 18, 1).translate(0, -len / 2, 0));
const sphere = (r) => cached(`sph${r}`, () => new THREE.SphereGeometry(r, 20, 14));
const rbox = (w, h, d, rad) => cached(`rb${w}|${h}|${d}|${rad}`, () => new RoundedBoxGeometry(w, h, d, 3, rad));
const lathe = (key, pts) => cached(key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 36));

// Torso profiles (radius, height) around the pelvis pivot.
const SHIRT_PROFILE = [[0.166, 0.08], [0.17, 0.16], [0.18, 0.26], [0.198, 0.36], [0.206, 0.43], [0.198, 0.49], [0.165, 0.54], [0.1, 0.575], [0.05, 0.59]];
const HIPS_PROFILE = [[0.0, -0.07], [0.1, -0.065], [0.165, -0.02], [0.18, 0.04], [0.17, 0.11]];

function part(geo, material, parent, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const BLOB_TEX = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(0.55, 'rgba(0,0,0,0.3)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const BLOB_GEO = new THREE.PlaneGeometry(0.95, 0.95);
const BLOB_MAT = new THREE.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

export function createCharacter(opts = {}) {
  const o = {
    skin: '#e0b08f', shirt: '#6a7f99', pants: '#3d4655', shoes: '#2b211b',
    hair: '#3a2a1c', hairStyle: 'short', hatColor: '#333333',
    glasses: false, beard: null, beardColor: null, tie: null,
    sleeves: 'long', build: 1, height: 1,
    ...opts,
  };
  const b = o.build;
  const skin = mat(o.skin, 0.55);
  const shirt = mat(o.shirt, 0.88);
  const pants = mat(o.pants, 0.9);
  const shoes = mat(o.shoes, 0.4);
  const hair = mat(o.hair, 0.9);
  const beardMat = mat(o.beardColor || o.hair, 0.9);
  const eyeWhite = mat('#f2eee6', 0.25);
  const iris = mat(o.eyes || '#4a2f1c', 0.2);
  const pupil = mat('#0c0806', 0.1);
  const lip = mat(new THREE.Color(o.skin).multiplyScalar(0.72).lerp(new THREE.Color('#9a4a40'), 0.25).getStyle(), 0.5);
  const skinShade = mat(new THREE.Color(o.skin).multiplyScalar(0.9).getStyle(), 0.6);
  const brow = mat(new THREE.Color(o.beardColor || o.hair).multiplyScalar(0.8).getStyle(), 0.9);
  const shirtDark = mat(new THREE.Color(o.shirt).multiplyScalar(0.78).getStyle(), 0.88);

  const root = new THREE.Group();
  const body = new THREE.Group();          // bobs while walking
  root.add(body);
  const upper = new THREE.Group();         // pelvis pivot: leans and twists
  upper.position.y = 0.92;
  body.add(upper);

  // ---- Torso ----
  const torso = new THREE.Group();
  torso.scale.set(b, 1, 0.66 * b);
  upper.add(torso);
  part(lathe('hips', HIPS_PROFILE), pants, torso);
  part(lathe('shirt', SHIRT_PROFILE), shirt, torso);
  part(cached('belt', () => new THREE.CylinderGeometry(0.176, 0.176, 0.045, 36)), mat('#2a2018', 0.45), torso, 0, 0.095, 0);
  part(rbox(0.05, 0.035, 0.03, 0.008), mat('#b8a57a', 0.3, 0.8), upper, 0, 0.095, 0.118 * b, false); // buckle
  const collar = part(cached('collar', () => new THREE.TorusGeometry(0.062, 0.018, 8, 24)), shirt, upper, 0, 0.575, 0.004);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 0.85, 1);
  if (o.tie) {
    part(rbox(0.055, 0.3, 0.018, 0.008), mat(o.tie, 0.5), upper, 0, 0.4, 0.137 * b, false);
    part(rbox(0.05, 0.04, 0.02, 0.008), mat(o.tie, 0.5), upper, 0, 0.55, 0.07 * b + 0.035, false);
  }
  part(limb(0.05, 0.056, 0.14), skin, upper, 0, 0.68, 0);
  // Shoulder line: a rounded yoke so the chest reads broad instead of a bowling pin
  part(rbox(0.39, 0.1, 0.26, 0.048), shirt, torso, 0, 0.485, -0.005);
  // Shirt collar points
  for (const s of [-1, 1]) {
    const c = part(rbox(0.05, 0.012, 0.045, 0.004), shirtDark, upper, s * 0.038, 0.565, 0.06 * b + 0.02, false);
    c.rotation.set(0.9, s * 0.5, 0);
  }
  if (o.pockets) for (const s of [-1, 1]) {
    part(rbox(0.085, 0.07, 0.012, 0.006), shirtDark, upper, s * 0.085 * b, 0.4, 0.136 * b, false);
    part(rbox(0.09, 0.022, 0.016, 0.005), shirtDark, upper, s * 0.085 * b, 0.44, 0.139 * b, false);
  }
  if (!o.tie) for (let i = 0; i < 4; i++) part(sphere(0.008), shirtDark, upper, 0, 0.18 + i * 0.1, (i > 2 ? 0.125 : 0.14) * b, false);

  // ---- Head ----
  const head = new THREE.Group();
  head.position.y = 0.765;
  head.scale.setScalar(1.07);
  upper.add(head);
  const scalp = new THREE.Group();         // skull-shaped space for hair
  scalp.scale.set(0.9, 1.1, 1.0);
  head.add(scalp);
  part(cached('skull', () => new THREE.SphereGeometry(0.115, 36, 28)), skin, scalp);
  const jaw = part(sphere(0.085), skin, head, 0, -0.045, 0.018);
  jaw.scale.set(0.95, 0.85, 1);
  part(sphere(0.032), skin, head, 0, -0.098, 0.062).scale.set(1.1, 0.8, 0.9);            // chin
  for (const s of [-1, 1]) {
    // eye: white, iris, pupil, and an upper lid that gives the gaze some weight
    const w = part(sphere(0.021), eyeWhite, head, s * 0.041, 0.012, 0.096, false);
    w.scale.set(1.05, 0.78, 0.55);
    part(sphere(0.0105), iris, head, s * 0.041, 0.011, 0.1065, false).scale.set(1, 1, 0.5);
    part(sphere(0.005), pupil, head, s * 0.041, 0.011, 0.1112, false);
    const lid = part(sphere(0.0225), skinShade, head, s * 0.041, 0.019, 0.095, false);
    lid.scale.set(1.08, 0.5, 0.62);
    // brows: thicker, slightly angled
    const bw = part(rbox(0.05, 0.013, 0.016, 0.006), brow, head, s * 0.042, 0.043, 0.102, false);
    bw.rotation.z = s * -0.1;
    // cheekbones
    part(sphere(0.03), skin, head, s * 0.052, -0.022, 0.07).scale.set(1, 0.75, 0.8);
    const ear = part(sphere(0.03), skin, head, s * 0.101, 0, -0.005, false);
    ear.scale.set(0.4, 1, 0.7);
  }
  // nose: bridge + tip + nostrils
  part(rbox(0.02, 0.05, 0.026, 0.009), skin, head, 0, -0.002, 0.11, false).rotation.x = -0.15;
  part(sphere(0.017), skin, head, 0, -0.026, 0.118, false);
  for (const s of [-1, 1]) part(sphere(0.011), skinShade, head, s * 0.014, -0.031, 0.111, false);
  // lips
  part(rbox(0.044, 0.009, 0.012, 0.004), lip, head, 0, -0.054, 0.103, false);
  part(rbox(0.04, 0.011, 0.012, 0.005), lip, head, 0, -0.065, 0.1, false);

  if (o.glasses) {
    const frame = mat('#1d1d1d', 0.25, 0.4);
    const ring = cached('lens', () => new THREE.TorusGeometry(0.027, 0.0045, 6, 4).rotateZ(Math.PI / 4));
    for (const s of [-1, 1]) {
      part(ring, frame, head, s * 0.043, 0.013, 0.12, false).scale.set(1.25, 0.8, 1);
      part(rbox(0.005, 0.005, 0.12, 0.002), frame, head, s * 0.098, 0.016, 0.06, false);
    }
    part(rbox(0.024, 0.005, 0.006, 0.002), frame, head, 0, 0.018, 0.122, false);
  }
  if (o.beard === 'goatee' || o.beard === 'mustache') {
    part(rbox(0.075, 0.016, 0.022, 0.007), beardMat, head, 0, -0.04, 0.106, false);
    if (o.beard === 'goatee') part(rbox(0.058, 0.055, 0.032, 0.013), beardMat, head, 0, -0.09, 0.086, false);
  }

  // Hair lives in scalp space so it hugs the skull shape.
  const cap = (r, thetaLen, tilt, material) => {
    const m = part(cached(`cap${r}|${thetaLen}`, () => new THREE.SphereGeometry(r, 36, 16, 0, Math.PI * 2, 0, Math.PI * thetaLen)), material, scalp, 0, 0, 0, false);
    m.rotation.x = tilt;
    return m;
  };
  switch (o.hairStyle) {
    case 'short':
      cap(0.124, 0.44, -0.62, hair);
      part(rbox(0.17, 0.04, 0.07, 0.018), hair, head, 0, 0.112, 0.045, false).rotation.x = -0.35;   // front volume
      for (const s of [-1, 1]) part(rbox(0.014, 0.05, 0.028, 0.006), hair, head, s * 0.104, 0.02, 0.028, false);
      break;
    case 'long':
      cap(0.121, 0.44, -0.62, hair);
      part(rbox(0.19, 0.26, 0.05, 0.02), hair, head, 0, -0.08, -0.09, false);
      for (const s of [-1, 1]) part(rbox(0.03, 0.2, 0.08, 0.012), hair, head, s * 0.1, -0.05, -0.035, false);
      break;
    case 'bald': {
      // Short horseshoe of hair around the back of the head at ear level.
      const fringe = part(cached('fringe', () => new THREE.SphereGeometry(0.1175, 32, 10, Math.PI * 1.12, Math.PI * 0.76, Math.PI * 0.44, Math.PI * 0.3)), hair, scalp, 0, 0, 0, false);
      fringe.material = fringe.material.clone();
      fringe.material.side = THREE.DoubleSide;
      break;
    }
    case 'beanie': {
      const hat = mat(o.hatColor, 0.95);
      cap(0.126, 0.56, -0.2, hat);
      const cuff = part(cached('cuff', () => new THREE.TorusGeometry(0.118, 0.016, 8, 32)), hat, scalp, 0, -0.012, 0.005, false);
      cuff.rotation.x = Math.PI / 2 - 0.2;
      break;
    }
    case 'hat': {
      const hat = mat(o.hatColor, 0.8);
      cap(0.119, 0.42, -0.62, hair);
      part(new THREE.CylinderGeometry(0.108, 0.118, 0.1, 28), hat, head, 0, 0.125, -0.005);
      part(new THREE.CylinderGeometry(0.119, 0.121, 0.024, 28), mat('#1a1a1a', 0.7), head, 0, 0.088, -0.005, false);
      part(new THREE.CylinderGeometry(0.19, 0.19, 0.012, 32), hat, head, 0, 0.078, -0.005);
      break;
    }
    case 'officer': { // peaked military cap
      const hat = mat(o.hatColor, 0.7);
      cap(0.119, 0.4, -0.65, hair);
      part(new THREE.CylinderGeometry(0.14, 0.112, 0.085, 28), hat, head, 0, 0.13, -0.005);
      part(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 28), mat('#1a1a1a', 0.5), head, 0, 0.1, -0.005, false);
      part(new THREE.CylinderGeometry(0.114, 0.114, 0.012, 28), mat('#c9a44a', 0.3, 0.8), head, 0, 0.12, -0.005, false);
      const visor = part(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 20, 1, false, -Math.PI / 2, Math.PI), mat('#111', 0.3), head, 0, 0.09, 0.05, false);
      visor.rotation.x = 0.25;
      part(rbox(0.04, 0.03, 0.01, 0.004), mat('#c9a44a', 0.3, 0.8), head, 0, 0.14, 0.125, false);   // cap badge
      for (const s of [-1, 1]) part(rbox(0.014, 0.05, 0.028, 0.006), hair, head, s * 0.104, 0.02, 0.028, false);
      break;
    }
    case 'helmet': {
      const hat = mat(o.hatColor, 0.75);
      const h = part(cached('helm', () => new THREE.SphereGeometry(0.15, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)), hat, head, 0, 0.03, -0.005);
      h.scale.set(1, 0.95, 1.08);
      part(new THREE.CylinderGeometry(0.162, 0.162, 0.018, 28), hat, head, 0, 0.035, -0.005, false);
      break;
    }
    default: break; // shaved
  }

  // ---- Arms ----
  const arms = [-1, 1].map((s) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(s * 0.235 * b, 0.465, 0);
    upper.add(shoulder);
    part(sphere(0.067), shirt, shoulder, 0, -0.01, 0).scale.set(1, 1.1, 1.05);
    if (o.epaulettes) {
      part(rbox(0.085, 0.016, 0.11, 0.006), shirtDark, shoulder, -s * 0.01, 0.06, 0, false);
      part(sphere(0.009), mat('#c9a44a', 0.3, 0.8), shoulder, -s * 0.02, 0.07, 0.035, false);
    }
    if (o.sleeves === 'short') {
      part(limb(0.068, 0.062, 0.14), shirt, shoulder);
      part(limb(0.05, 0.048, 0.27), skin, shoulder);
    } else {
      part(limb(0.062, 0.051, 0.27), shirt, shoulder);
    }
    const elbow = new THREE.Group();
    elbow.position.y = -0.27;
    shoulder.add(elbow);
    const sleeveMat = o.sleeves === 'short' ? skin : shirt;
    part(sphere(0.049), sleeveMat, elbow);
    part(limb(0.048, 0.04, 0.23), sleeveMat, elbow);
    if (o.sleeves !== 'short') part(limb(0.043, 0.043, 0.03), shirt, elbow, 0, -0.2, 0); // cuff
    part(rbox(0.036, 0.1, 0.075, 0.016), skin, elbow, 0, -0.285, 0.004);
    part(rbox(0.022, 0.05, 0.022, 0.009), skin, elbow, -s * 0.004, -0.255, 0.042, false).rotation.x = -0.4;
    return { shoulder, elbow, side: s };
  });

  // ---- Legs ----
  const legs = [-1, 1].map((s) => {
    const hip = new THREE.Group();
    hip.position.set(s * 0.09 * b, 0.9, 0);
    body.add(hip);
    part(sphere(0.088), pants, hip);
    part(limb(0.088, 0.066, 0.42), pants, hip);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    hip.add(knee);
    part(sphere(0.066), pants, knee);
    part(limb(0.066, 0.056, 0.38), pants, knee);
    part(rbox(0.105, 0.085, 0.25, 0.035), shoes, knee, 0, -0.4375, 0.045);
    return { hip, knee };
  });

  root.scale.setScalar(o.height);
  // ~44 parts -> one mesh per moving bone (about 12 draw calls).
  bakeHierarchy(root);
  // Soft blob shadow so characters stay grounded indoors, where no light casts shadows.
  const blob = new THREE.Mesh(BLOB_GEO, BLOB_MAT);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.015;
  blob.renderOrder = 1;
  root.add(blob);

  // ---- Animation ----
  let phase = Math.random() * Math.PI * 2;
  let amp = 0;
  let air = 0;
  let t = Math.random() * 10;
  // Pose overrides (0..1 weights) layered on top of the locomotion cycle.
  const pose = { guard: 0, punch: 0, jab: 0, throw: 0, salute: 0, handsUp: 0, point: 0, hurt: 0, sit: 0, hands: 0, kick: 0 };
  const mix = (a, b, w) => a + (b - a) * w;

  function update(dt, speed = 0, airborne = false) {
    t += dt;
    const mv = Math.abs(speed);
    amp += (Math.min(mv / 3, 1.3) - amp) * Math.min(1, dt * 8);
    air += ((airborne ? 1 : 0) - air) * Math.min(1, dt * 12);
    phase += dt * speed * 2.4;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    const A = amp;
    const still = Math.max(0, 1 - A);

    const [L, R] = legs;
    L.hip.rotation.x = -s * 0.55 * A - air * 0.75;
    R.hip.rotation.x = s * 0.55 * A + air * 0.25;
    L.knee.rotation.x = Math.max(0, c) * 0.95 * A + 0.04 + air * 1.1;
    R.knee.rotation.x = Math.max(0, -c) * 0.95 * A + 0.04 + air * 0.45;

    for (const arm of arms) {
      const dir = arm.side < 0 ? 1 : -1;
      arm.shoulder.rotation.x = dir * s * 0.5 * A + Math.sin(t * 1.3 + arm.side) * 0.03 * still - air * 0.5;
      arm.shoulder.rotation.z = arm.side * (0.06 + air * 0.55);
      arm.elbow.rotation.x = -(0.12 + 0.4 * A + air * 0.4);
    }

    body.position.y = Math.abs(c) * 0.045 * A;
    upper.rotation.x = 0.07 * A;
    upper.rotation.y = s * 0.08 * A;
    torso.scale.y = 1 + Math.sin(t * 1.8) * 0.01 * still;
    head.rotation.y = Math.sin(t * 0.37) * 0.18 * still;
    head.rotation.x = -0.05 * A;

    // ---- Pose layer. arms[0] is the right arm (character faces +z).
    const [R_, L_] = arms;
    const P = pose;
    if (P.sit) {
      for (const leg of legs) { leg.hip.rotation.x = mix(leg.hip.rotation.x, -1.5, P.sit); leg.knee.rotation.x = mix(leg.knee.rotation.x, 1.5, P.sit); }
      body.position.y -= 0.42 * P.sit;
    }
    if (P.guard) for (const a of arms) {
      a.shoulder.rotation.x = mix(a.shoulder.rotation.x, -0.95, P.guard);
      a.shoulder.rotation.z = mix(a.shoulder.rotation.z, a.side * 0.25, P.guard);
      a.elbow.rotation.x = mix(a.elbow.rotation.x, -2.1, P.guard);
    }
    if (P.punch) {
      R_.shoulder.rotation.x = mix(R_.shoulder.rotation.x, -1.55, P.punch);
      R_.shoulder.rotation.z = mix(R_.shoulder.rotation.z, 0.05, P.punch);
      R_.elbow.rotation.x = mix(R_.elbow.rotation.x, -0.08, P.punch);
      upper.rotation.y += 0.35 * P.punch;
    }
    if (P.jab) {
      L_.shoulder.rotation.x = mix(L_.shoulder.rotation.x, -1.55, P.jab);
      L_.shoulder.rotation.z = mix(L_.shoulder.rotation.z, -0.05, P.jab);
      L_.elbow.rotation.x = mix(L_.elbow.rotation.x, -0.08, P.jab);
      upper.rotation.y -= 0.3 * P.jab;
    }
    if (P.throw) {
      // 0..0.5 wind up overhead, 0.5..1 release forward.
      const k = P.throw;
      const sx = k < 0.5 ? mix(0, -2.9, k * 2) : mix(-2.9, -1.3, (k - 0.5) * 2);
      const ex = k < 0.5 ? mix(-0.2, -1.4, k * 2) : mix(-1.4, -0.1, (k - 0.5) * 2);
      R_.shoulder.rotation.x = sx; R_.elbow.rotation.x = ex; R_.shoulder.rotation.z = -0.1;
    }
    if (P.salute) {
      R_.shoulder.rotation.x = mix(R_.shoulder.rotation.x, -1.25, P.salute);
      R_.shoulder.rotation.z = mix(R_.shoulder.rotation.z, -0.95, P.salute);
      R_.elbow.rotation.x = mix(R_.elbow.rotation.x, -2.35, P.salute);
    }
    if (P.point) {
      R_.shoulder.rotation.x = mix(R_.shoulder.rotation.x, -1.5, P.point);
      R_.elbow.rotation.x = mix(R_.elbow.rotation.x, -0.05, P.point);
    }
    if (P.hands) for (const a of arms) { // open-palm gesture while talking
      a.shoulder.rotation.x = mix(a.shoulder.rotation.x, -0.55, P.hands);
      a.shoulder.rotation.z = mix(a.shoulder.rotation.z, a.side * 0.2, P.hands);
      a.elbow.rotation.x = mix(a.elbow.rotation.x, -1.1, P.hands);
    }
    if (P.handsUp) for (const a of arms) {
      a.shoulder.rotation.x = mix(a.shoulder.rotation.x, -2.85, P.handsUp);
      a.shoulder.rotation.z = mix(a.shoulder.rotation.z, a.side * 0.35, P.handsUp);
      a.elbow.rotation.x = mix(a.elbow.rotation.x, -0.7, P.handsUp);
    }
    if (P.kick) {
      const leg = legs[0];
      leg.hip.rotation.x = mix(leg.hip.rotation.x, -1.45, P.kick);
      leg.knee.rotation.x = mix(leg.knee.rotation.x, 0.1, P.kick);
      upper.rotation.x -= 0.25 * P.kick;
      for (const a of arms) a.shoulder.rotation.z = mix(a.shoulder.rotation.z, a.side * 0.6, P.kick);
    }
    if (P.hurt) { upper.rotation.x -= 0.35 * P.hurt; head.rotation.x -= 0.3 * P.hurt; }
  }

  return { root, head, update, pose, blob, height: o.height };
}
