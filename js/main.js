// Blood For Blood — an objective-driven story game about Emilio Gonzalez,
// the man who becomes Gustavo Fring.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { getLocation } from './world.js';
import { createCharacter } from './character.js';
import { NPC, lerpAngle } from './npc.js';
import { Input } from './input.js';
import { LOOKS, PED_LINES, randomLook } from './looks.js';
import { Director, Actor } from './director.js';
import { Brawl, PLAYER_HP } from './combat.js';
import { BEATS, BEAT_INDEX, CONVOS, USE_CONVOS, ITEMS, FOODS } from './story.js';
import { UI, Talk, InventoryPanel, Saves, describeSave, fmtPesos, fmtMoney, translateName } from './ui.js';
import { waveFlags, flickerFires } from './props.js';
import { sfx } from './sfx.js';
import { OpenWorld } from './openworld.js';
import { Gunfight } from './gunplay.js';
import { Empire } from './empire.js';

// ---------------------------------------------------------------- renderer
let MAX_DPR = Math.min(devicePixelRatio, 1.0);
const MIN_DPR = Math.min(devicePixelRatio, 0.6);
let dpr = Math.min(devicePixelRatio, 1.0);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(dpr);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1500);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  resizeAll();
});

// ---------------------------------------------------------------- post-processing
// High: bloom + colour grade. Medium / Low: plain render (Low also uses smaller shadows and resolution).
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVignette: { value: 0.38 }, uSat: { value: 1.08 },
    uContrast: { value: 0.22 }, uTint: { value: new THREE.Vector3(1.03, 1.0, 0.95) }, uGrain: { value: 0.028 },
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uSat, uContrast, uGrain; uniform vec3 uTint; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(l), c, uSat) * uTint;
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);
      vec2 d = (vUv - 0.5) * vec2(1.15, 1.0);
      c *= mix(1.0 - uVignette, 1.0, smoothstep(0.78, 0.22, length(d)));
      float n = fract(sin(dot(vUv * 913.7 + uTime, vec2(12.9898, 78.233))) * 43758.5453);
      c += (n - 0.5) * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }`,
};
const QUALITIES = ['high', 'medium', 'low'];
let quality = 'medium';
try { quality = QUALITIES.includes(localStorage.getItem('bfb.gfx2')) ? localStorage.getItem('bfb.gfx2') : 'medium'; } catch { /* default */ }
const fx = { composer: null, gtao: null, bloom: null, grade: null };
function buildPipeline() {
  fx.composer?.dispose?.();
  fx.composer = null; fx.gtao = null;
  MAX_DPR = Math.min(devicePixelRatio, quality === 'high' ? 1.25 : quality === 'medium' ? 1.0 : 0.85);
  dpr = Math.min(dpr, MAX_DPR);
  renderer.setPixelRatio(dpr);
  if (quality === 'high') {
    const rt = new THREE.WebGLRenderTarget(innerWidth * dpr, innerHeight * dpr, { type: THREE.HalfFloatType, samples: 2 });
    const c = new EffectComposer(renderer, rt);
    c.setPixelRatio(dpr);
    c.setSize(innerWidth, innerHeight);
    c.addPass(new RenderPass(scene, camera));
    fx.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 0.35, 0.5, 0.88);
    c.addPass(fx.bloom);
    c.addPass(new OutputPass());
    fx.grade = new ShaderPass(GradeShader);
    c.addPass(fx.grade);
    fx.composer = c;
  }
  const sm = quality === 'low' ? 1024 : quality === 'medium' ? 1536 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  fx.bloom = fx.composer ? fx.bloom : null;
  fx.grade = fx.composer ? fx.grade : null;
  sun.shadow.map?.dispose(); sun.shadow.map = null;
  if (loc) applyInteriorShadows();
}
// One ceiling light per room casts real shadows on High.
function applyInteriorShadows() {
  loc.root.traverse((o) => {
    if (o.isPointLight && o.userData.shadowCandidate) {
      o.castShadow = quality === 'high';
      o.shadow.mapSize.set(256, 256); o.shadow.bias = -0.004; o.shadow.radius = 3;
      o.shadow.camera.near = 0.1; o.shadow.camera.far = 16;
    }
  });
}
const GRADES = {
  day: [1.03, 1.0, 0.95, 1.08], golden: [1.07, 0.99, 0.87, 1.1], dusk: [1.02, 0.95, 1.0, 1.0], night: [0.88, 0.97, 1.12, 0.92],
  warm: [1.05, 1.0, 0.92, 1.05], dim: [1.06, 0.98, 0.88, 0.95], cold: [0.97, 1.0, 1.04, 0.95],
};
function setGrade(key) {
  if (!fx.grade) return;
  const [r, g, b, sat] = GRADES[key] || GRADES.day;
  fx.grade.uniforms.uTint.value.set(r, g, b);
  fx.grade.uniforms.uSat.value = sat;
  fx.bloom.strength = key === 'night' ? 0.75 : key === 'dim' ? 0.5 : 0.3;
}
function render() {
  if (fx.composer) { fx.grade.uniforms.uTime.value = (performance.now() / 1000) % 100; fx.composer.render(); }
  else renderer.render(scene, camera);
}
const perf = { frames: 0, time: 0 };
function adaptResolution(rawDt) {
  perf.frames++; perf.time += rawDt;
  if (perf.time < 1) return;
  const avg = perf.time / perf.frames;
  perf.frames = 0; perf.time = 0;
  let next = dpr;
  if (avg > 1 / 50) next = Math.max(MIN_DPR, dpr - 0.25);
  else if (avg < 1 / 58 && dpr < MAX_DPR) next = Math.min(MAX_DPR, dpr + 0.125);
  if (next !== dpr) { dpr = next; resizeAll(); }
}
function resizeAll() {
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  if (fx.composer) { fx.composer.setPixelRatio(dpr); fx.composer.setSize(innerWidth, innerHeight); }
}

// ---------------------------------------------------------------- sky, light, moods
const skyGeo = new THREE.SphereGeometry(600, 32, 16);
skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
scene.add(sky);
function setSky(topC, horC) {
  const top = new THREE.Color(topC), hor = new THREE.Color(horC), c = new THREE.Color();
  const p = skyGeo.attributes.position, col = skyGeo.attributes.color;
  for (let i = 0; i < p.count; i++) {
    c.copy(hor).lerp(top, Math.pow(Math.max(0, p.getY(i) / 600), 0.45));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}
const fog = new THREE.Fog('#e9dcc4', 140, 560);
const hemi = new THREE.HemisphereLight('#d6e6ff', '#b08c5e', 0.75);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3e0', 3.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 20, far: 260 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(sun, sun.target);
const SUN_OFFSET = new THREE.Vector3(55, 95, 38);

// Clouds: clusters of soft puffs far away, lit by the sun.
const clouds = new THREE.Group();
{
  const cm = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, fog: false, emissive: '#8a8a8a', emissiveIntensity: 0.35, flatShading: true });
  const puff = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const n = 5 + Math.floor(Math.random() * 5);
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(puff, cm);
      const r = 10 + Math.random() * 14;
      m.scale.set(r * 1.4, r * 0.75, r);
      m.position.set((k - n / 2) * 14 + Math.random() * 6, Math.random() * 6, Math.random() * 10);
      g.add(m);
    }
    const a = Math.random() * Math.PI * 2, d = 300 + Math.random() * 180;
    g.position.set(Math.cos(a) * d, 120 + Math.random() * 70, Math.sin(a) * d);
    g.lookAt(0, g.position.y, 0);
    clouds.add(g);
  }
  scene.add(clouds);
}
const sunDisk = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,250,235,1)');
    grd.addColorStop(0.3, 'rgba(255,230,180,0.35)'); grd.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })(), fog: false, depthWrite: false, transparent: true,
}));
sunDisk.scale.setScalar(110);
scene.add(sunDisk);

const MOODS = {
  day: { top: '#4f8fd0', hor: '#ece0c8', fog: '#e6dac4', near: 140, far: 560, sun: '#fff3e0', sunI: 3.0, hemiSky: '#d6e6ff', hemiGround: '#a8885e', hemiI: 0.75, off: [55, 95, 38], exp: 1.05 },
  golden: { top: '#5a78b0', hor: '#f4c088', fog: '#e8c49a', near: 120, far: 520, sun: '#ffc98a', sunI: 2.7, hemiSky: '#ffd8b0', hemiGround: '#8a6a4a', hemiI: 0.6, off: [80, 42, 50], exp: 1.05 },
  dusk: { top: '#1e2a52', hor: '#c97a5a', fog: '#6a5a62', near: 60, far: 380, sun: '#ff9a6a', sunI: 1.1, hemiSky: '#7a7ab0', hemiGround: '#3a2a22', hemiI: 0.45, off: [90, 25, 30], exp: 1.0 },
  night: { top: '#03050c', hor: '#151b2a', fog: '#0c1018', near: 25, far: 240, sun: '#8aa0d8', sunI: 0.35, hemiSky: '#34446a', hemiGround: '#1a140f', hemiI: 0.28, off: [40, 90, -30], exp: 1.15 },
  warm: { interior: true, hemiSky: '#fff4e2', hemiGround: '#7a5a40', hemiI: 0.75, env: 0.55 },
  dim: { interior: true, hemiSky: '#e8d2b0', hemiGround: '#4a3a2a', hemiI: 0.38, env: 0.3 },
  cold: { interior: true, hemiSky: '#eef4ff', hemiGround: '#6a6a6a', hemiI: 0.85, env: 0.6 },
};
let moodOverride = null;
function applyEnv() {
  const interior = loc.interior;
  let key = moodOverride || loc.env.mood || (interior ? 'warm' : 'day');
  if (interior && MOODS[key] && !MOODS[key].interior) key = key === 'night' ? 'dim' : 'warm';
  if (!interior && MOODS[key]?.interior) key = 'day';
  const M = MOODS[key];
  sky.visible = !interior;
  sun.visible = !interior;
  clouds.visible = !interior && key !== 'night';
  sunDisk.visible = !interior;
  if (!interior) {
    sunDisk.material.color.set(key === 'night' ? '#9fb2d8' : key === 'golden' || key === 'dusk' ? '#ffc89a' : '#fff6e0');
    sunDisk.scale.setScalar(key === 'night' ? 40 : 110);
    clouds.children.forEach((g) => g.children.forEach((m) => {
      m.material.color.set(key === 'golden' ? '#ffe2c4' : key === 'dusk' ? '#d8a8a0' : '#ffffff');
    }));
  }
  setGrade(key);
  hemi.color.set(M.hemiSky); hemi.groundColor.set(M.hemiGround); hemi.intensity = M.hemiI;
  if (interior) {
    scene.fog = null;
    scene.background = new THREE.Color('#15110d');
    scene.environmentIntensity = M.env;
    renderer.toneMappingExposure = 1.05;
  } else {
    setSky(M.top, M.hor);
    fog.color.set(M.fog); fog.near = M.near; fog.far = M.far;
    scene.fog = fog; scene.background = null;
    sun.color.set(M.sun); sun.intensity = M.sunI;
    SUN_OFFSET.set(...M.off);
    scene.environmentIntensity = key === 'night' ? 0.12 : 0.45;
    renderer.toneMappingExposure = M.exp;
  }
}
function updateSun(focus) {
  sunDisk.position.copy(camera.position).addScaledVector(SUN_OFFSET.clone().normalize(), 480);
  clouds.position.set(camera.position.x, 0, camera.position.z);
  clouds.rotation.y += 0.00004;
  const texel = (sun.shadow.camera.right - sun.shadow.camera.left) / sun.shadow.mapSize.x;
  const x = Math.round(focus.x / texel) * texel, z = Math.round(focus.z / texel) * texel;
  sun.target.position.set(x, 0, z);
  sun.position.set(x + SUN_OFFSET.x, SUN_OFFSET.y, z + SUN_OFFSET.z);
  sun.target.updateMatrixWorld();
}

// ---------------------------------------------------------------- core objects
const input = new Input(renderer.domElement);
const ui = new UI();
const talk = new Talk(input);
const invPanel = new InventoryPanel(ITEMS, FOODS);
const flashEl = Object.assign(document.createElement('div'), { style: 'position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9;transition:opacity .5s' });
document.body.appendChild(flashEl);

const player = { pos: new THREE.Vector3(), vy: 0, grounded: true, yaw: 0, pitch: 0.22, modelYaw: 0, radius: 0.38, hp: PLAYER_HP };
let hero = null, heroLook = null, heroHidden = false;
const heroExtraRot = new THREE.Euler();
function setHeroLook(look) {
  if (look === heroLook && hero) return;
  if (hero) scene.remove(hero.root);
  hero = createCharacter(LOOKS[look]);
  heroLook = look;
  scene.add(hero.root);
  G.hero = hero;
}

const state = { beat: 0, inv: [], pesos: 0, flags: {}, food: {}, stats: {}, side: null, empire: null };
let loc = null;
let peds = [];
let mode = 'title';      // title | play | talk | scene | fight | gameover | ending
let overlay = null;      // pause | inventory | load | controls
let overlayBack = null;
let brawl = null;
let activeDanger = null;
const pendingEvents = [];

const S = {
  at: (id) => BEATS[state.beat]?.id === id,
  past: (id) => state.beat > (BEAT_INDEX[id] ?? 1e9),
  has: (item) => state.inv.includes(item),
  flag: (f) => !!state.flags[f],
  playerPos: () => player.pos,
  stat: (k) => state.stats[k] || 0,
  empire: () => state.empire,
};
const beatText = (b) => (typeof b?.text === 'function' ? b.text(S) : b?.text || '');

// ---------------------------------------------------------------- G: the API scenes & systems use
const G = {
  scene, camera, input, ui, talk, looks: LOOKS, player, heroExtraRot, shake: 0, hitstop: 0, S,
  get loc() { return loc; },
  get pesos() { return state.pesos; },
  get paused() { return overlay !== null; },
  get mode() { return mode; },
  get heroLook() { return heroLook; },
  refresh: () => refreshWorld(),
  runConvo: (fn) => runConvo(fn),
  stat(k, n = 1) { state.stats[k] = (state.stats[k] || 0) + n; },
  hero: null,
  randomLook,
  showLoc: (id) => showLoc(id),
  setMood(m) { moodOverride = m; if (loc) applyEnv(); },
  setPesos(n, why) { state.pesos = n; ui.setMoney(n, true); if (why) ui.toast(fmtMoney(n), why); sfx.coin(); },
  addPesos(n, why) {
    state.pesos = Math.max(0, state.pesos + n); ui.setMoney(state.pesos, true);
    ui.toast(`${n < 0 ? '−' : '+'} ${fmtMoney(Math.abs(n))}`, why || (n < 0 ? 'Spent' : 'Received'), n < 0);
    sfx.coin();
  },
  give(id, toast = true) {
    if (!state.inv.includes(id)) state.inv.push(id);
    if (toast) { ui.toast(ITEMS[id].name, 'Item acquired'); sfx.item(); }
    refreshWorld();
  },
  take(id) {
    const i = state.inv.indexOf(id);
    if (i >= 0) { state.inv.splice(i, 1); ui.toast(ITEMS[id].name, 'Item removed', true); }
  },
  has: (id) => state.inv.includes(id),
  emit: (e) => pendingEvents.push(e),
  // ---- health & food
  foodCount: () => Object.values(state.food).reduce((a, b) => a + b, 0),
  addFood(id) { state.food[id] = (state.food[id] || 0) + 1; ui.toast(`${FOODS[id].name} — eat it from the inventory (I)`, 'Food'); sfx.item(); },
  eat(id) {
    if (!state.food[id]) return;
    if (player.hp >= PLAYER_HP) { ui.toast(`${G.heroName()} isn\u2019t hungry. He won\u2019t waste it.`, 'Health'); return; }
    state.food[id]--;
    if (!state.food[id]) delete state.food[id];
    const before = player.hp;
    player.hp = Math.min(PLAYER_HP, player.hp + FOODS[id].heal);
    ui.setHealth(player.hp / PLAYER_HP);
    ui.toast(`+${Math.round(player.hp - before)} health`, FOODS[id].name);
    sfx.item();
  },
  heroGesture() { gesture.t = 0; gesture.on = true; },
  setFlag(f) { state.flags[f] = true; },
  clearFlag(f) { delete state.flags[f]; },
  clearFallen() { for (const a of loc?.fallen || []) a.remove(); if (loc) loc.fallen = []; },
  hideHero(b) { heroHidden = b; if (hero) hero.root.visible = !b; },
  placePlayer(x, z, yaw) { player.pos.set(x, 0, z); player.yaw = player.modelYaw = yaw; },
  flash() { flashEl.style.transition = 'none'; flashEl.style.opacity = '0.9'; requestAnimationFrame(() => { flashEl.style.transition = 'opacity .6s'; flashEl.style.opacity = '0'; }); },
  endGame() { showEnding(); },
  gameOver: (why) => gameOver(why),
  // After the passports, Emilio is Gustavo — everywhere.
  heroName: () => (S.past('newNames') ? 'Gustavo' : 'Emilio'),
  aimCam: false,
  tickers: new Set(),          // per-frame hooks for special objectives (bomb hunt…)
  placePlate,
};
let director = new Director(G);
G.director = director;
const ow = new OpenWorld(G, state);
G.ow = ow;
const empire = new Empire(G, state);
G.empire = empire;
setHeroLook('emilio');

// ---------------------------------------------------------------- locations
function showLoc(id) {
  if (loc) scene.remove(loc.root);
  loc = getLocation(id);
  ow.decorate(loc);
  scene.add(loc.root);
  applyEnv();
  applyInteriorShadows();
  peds = loc.npcs;
  refreshWorld();
  setStoryNpcsVisible(false);
  if (hero) hero.root.visible = false;
  clearPlates();
}

function populatePeds(L) {
  if (L.populated) return;
  L.populated = true;
  const lines = PED_LINES[L.pedLines] || PED_LINES.santiago;
  const B = L.bounds;
  for (let i = 0; i < L.pedCount; i++) {
    let x, z, tries = 0;
    do {
      x = B.minX + Math.random() * (B.maxX - B.minX);
      z = B.minZ + Math.random() * (B.maxZ - B.minZ);
    } while ((!L.isFree(x, z, 1) || inAnyDanger(L, x, z, 3) || Object.values(L.spawns).some((s) => Math.hypot(s.x - x, s.z - z) < 4)) && ++tries < 200);
    if (tries >= 200) continue;
    const n = new NPC(L.root, { look: randomLook(), x, z, lines: [lines[Math.floor(Math.random() * lines.length)]], wander: L.interior ? 3 : 40 });
    n.isPed = true;
    L.npcs.push(n);
  }
}
function inAnyDanger(L, x, z, pad = 0) {
  return L.dangers.some((d) => x > d.minX - pad && x < d.maxX + pad && z > d.minZ - pad && z < d.maxZ + pad);
}

function enterLocation(id, spawn = 'default') {
  closeTalk();
  showLoc(id);
  populatePeds(loc);
  peds = loc.npcs;
  const sp = typeof spawn === 'object' ? spawn : (loc.spawns[spawn] || loc.spawns.default);
  player.pos.set(sp.x, 0, sp.z);
  player.vy = 0;
  player.yaw = player.modelYaw = sp.yaw ?? 0;
  player.pitch = loc.interior ? 0.12 : 0.22;
  cam.dist = cam.cur = Math.min(cam.dist, loc.camMax);
  heroExtraRot.set(0, 0, 0);
  G.hideHero(false);
  setStoryNpcsVisible(true);
  for (const n of loc.storyNpcObjs?.values() || []) if (n.follower) { n.pos.set(sp.x + 1.2, 0, sp.z + 1.2); }
  loc.triggerInside = {};
  for (const a of loc.fallen || []) a.remove();
  loc.fallen = [];
  for (const d of loc.dangers) { resetThugs(d); d.armed = !inAnyDanger({ dangers: [d] }, player.pos.x, player.pos.z); }
  buildMinimapBase();
  currentZone = '';
  ui.banner(loc.name, loc.region);
  ow.onEnter(loc);
}

// Story NPCs, pickups and thugs reflect the story state.
function refreshWorld() {
  if (!loc) return;
  loc.storyNpcObjs ||= new Map();
  for (const def of loc.storyNpcs) {
    const want = !def.when || def.when(S);
    const have = loc.storyNpcObjs.get(def.id);
    if (want && !have) {
      const n = new NPC(loc.root, { look: LOOKS[def.look], x: def.x, z: def.z, name: def.name, lines: def.lines || [], wander: def.wander ?? 1, speed: 1.0 });
      n.yaw = def.yaw ?? 0; n.def = def; n.follower = !!def.follower;
      if (def.sit) { n.char.pose.sit = 1; n.pos.y = 0.56 - 0.48 * (LOOKS[def.look].height ?? 1); }
      if (def.pose) n.char.pose[def.pose] = 1;
      loc.storyNpcObjs.set(def.id, n);
    } else if (!want && have) {
      loc.root.remove(have.char.root);
      loc.storyNpcObjs.delete(def.id);
    }
  }
  for (const it of loc.interactables) if (it.mesh) it.mesh.visible = !(it.item && state.inv.includes(it.item)) && (!it.when || it.when(S));
  // thugs
  loc.thugActors ||= {};
  for (const d of loc.dangers) {
    const cleared = state.flags['cleared:' + d.id] || (d.when && !d.when(S));
    const have = loc.thugActors[d.id];
    if (cleared && have) { have.forEach((a) => a.remove()); delete loc.thugActors[d.id]; }
    if (!cleared && !have) {
      loc.thugActors[d.id] = d.thugs.map((t) => new Actor(loc.root, LOOKS[t.look], t.x, t.z, t.yaw));
      d.armed = true;
    }
  }
}
function setStoryNpcsVisible(v) {
  for (const n of loc?.storyNpcObjs?.values() || []) n.char.root.visible = v;
  for (const list of Object.values(loc?.thugActors || {})) for (const a of list) a.root.visible = v;
}
function storyNpcList() { return [...(loc?.storyNpcObjs?.values() || [])]; }

// ---------------------------------------------------------------- story runner
function currentBeat() { return BEATS[state.beat]; }

function startBeat(i, from = null) {
  const prev = BEATS[i - 1];
  const continuing = !from && prev?.type === 'goal' && state.beat === i - 1 && loc;
  state.beat = i;
  pendingEvents.length = 0;
  const b = BEATS[i];
  if (!b) return;
  ui.prompt(null);
  ui.setCurrency(S.past('burial') ? 'dollars' : 'pesos'); ui.setMoney(state.pesos);
  invPanel.emptyText = S.past('newNames') ? 'Gustavo keeps nothing he does not need.' : null;
  G.tickers.clear();
  b.onStart?.(G, S);
  if (b.type === 'scene') {
    ow.cancelTransient('scene');
    ow.endCrime();
    ow.endPolice();
    mode = 'scene';
    ui.setObjective(b.chapter, '', false);
    setStoryNpcsVisible(false);
    if (!b.inPlace) G.hideHero(true);
    document.exitPointerLock?.();
    director.abort();
    director = G.director = new Director(G);
    const me = director;
    me.run(b.play).then(() => {
      if (me.dead || mode === 'ending' || mode === 'title' || state.beat !== i) return;
      G.hideHero(false);
      startBeat(i + 1);
      autosave();
    });
    return;
  }
  // goal
  setHeroLook(b.look || heroLook);
  moodOverride = b.mood ?? null;
  if (from) enterLocation(from.loc, { x: from.x, z: from.z, yaw: from.yaw });
  else if (continuing || (b.spawn === 'keep' && loc?.id === b.loc)) {
    applyEnv(); G.hideHero(false); setStoryNpcsVisible(true); buildMinimapBase();
  } else enterLocation(b.loc, b.spawn);
  refreshWorld();
  setStoryNpcsVisible(true);
  G.hideHero(false);
  ui.fade(false);
  mode = 'play';
  ui.setObjective(b.chapter, beatText(b));
  if (b.banner && !from) setTimeout(() => ui.banner(b.chapter.split('·')[1]?.trim() || b.chapter, loc.region), 300);
  sfx.objective();
  input.lock();
}

function processEvents() {
  while (pendingEvents.length) {
    const e = pendingEvents.shift();
    ow.onEvent(e);
    empire.onEvent?.(e);
    const b = currentBeat();
    if (b?.type === 'goal' && b.done(e, S)) {
      ui.toast(beatText(b), 'Objective complete');
      startBeat(state.beat + 1);
      return;
    }
    if (b?.type === 'goal' && typeof b.text === 'function') ui.setObjective(b.chapter, beatText(b));
  }
}

// ---------------------------------------------------------------- saving & loading
function snapshot() {
  const b = currentBeat();
  return {
    v: 2, time: Date.now(), beat: state.beat, beatId: b?.id, chapter: b?.chapter, objective: beatText(b),
    loc: b?.type === 'goal' ? loc.id : null, x: player.pos.x, z: player.pos.z, yaw: player.modelYaw,
    inv: [...state.inv], pesos: state.pesos, food: { ...state.food }, hp: player.hp,
    // street fights that only exist for a moment are never saved as "cleared"
    flags: Object.fromEntries(Object.entries(state.flags).filter(([k]) => !/^cleared:(ev|cops)\d|^cleared:(ortuzar|choros2)$/.test(k))),
    stats: { ...state.stats }, side: state.side ? JSON.parse(JSON.stringify(state.side)) : null,
    empire: state.empire ? JSON.parse(JSON.stringify(state.empire)) : null,
  };
}
function autosave() {
  if (Saves.write('auto', snapshot())) ui.saving('Autosaving…');
}
function canSave() {
  if (mode === 'fight') return 'You can’t save during a fight.';
  if (mode === 'scene') return 'You can’t save during a cutscene.';
  if (mode !== 'play') return 'You can’t save right now.';
  return null;
}
function manualSave() {
  const why = canSave();
  if (why) { ui.toast(why, 'Save', true); return; }
  if (Saves.write('manual', snapshot())) { ui.saving('Game saved'); ui.toast(beatText(currentBeat()), 'Game saved'); }
}
function resetForLoad() {
  director.abort();
  if (activeDanger) { activeDanger.armed = false; activeDanger = null; }
  endFightCleanup();
  ow.cancelTransient();
  ow.endCrime();
  ow.endPolice();
  G.tickers.clear();
  G.bomb = null;
  document.getElementById('ow-timer').classList.remove('show');
  G.aimCam = false; G.noFists = false;
  ui.boss(null);
  closeTalk();
  ui.hideCard(true); ui.fade(false); ui.qte(null);
  moodOverride = null;
  heroExtraRot.set(0, 0, 0);
  player.hp = PLAYER_HP;
  hideScreens();
  closeOverlay();
  document.body.classList.remove('on-title');
}
function loadGame(save) {
  if (!save) { newGame(); return; }
  resetForLoad();
  state.inv = [...save.inv]; state.pesos = save.pesos; state.flags = { ...save.flags }; state.food = { ...(save.food || {}) };
  state.stats = { ...(save.stats || {}) };
  state.side = save.side ? JSON.parse(JSON.stringify(save.side)) : null;
  state.empire = save.empire ? JSON.parse(JSON.stringify(save.empire)) : null;
  player.hp = save.hp > 0 ? save.hp : PLAYER_HP;
  ui.setHealth(player.hp / PLAYER_HP);
  ui.setMoney(state.pesos);
  // reset danger zones so loaded state rebuilds thugs
  const bi = BEAT_INDEX[save.beatId] ?? save.beat;
  const b = BEATS[bi];
  startBeat(bi, b.type === 'goal' && save.loc ? { loc: save.loc, x: save.x, z: save.z, yaw: save.yaw } : null);
  ow.afterLoad();
  ui.toast(save.objective || save.chapter || '', 'Loaded');
}
function newGame() {
  resetForLoad();
  state.inv = []; state.pesos = 0; state.flags = {}; state.food = {}; state.stats = {}; state.side = null; state.empire = null;
  ow.afterLoad();
  player.hp = PLAYER_HP; ui.setHealth(1);
  ui.setMoney(0);
  setHeroLook('emilio');
  startBeat(0);
}

// ---------------------------------------------------------------- conversations
async function runConvo(fn, npc = null) {
  mode = 'talk';
  ui.prompt(null);
  if (npc) npc.talking = true;
  try { await fn(talk, G, S); } finally {
    if (npc) npc.talking = false;
    talk.close();
    if (mode === 'talk') mode = 'play';
    interactCooldown = 0.35;
  }
}
async function linesConvo(T, name, lines) { for (const l of lines) await T.say(name, l); }
function closeTalk() { talk.close(); }

// ---------------------------------------------------------------- player
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3();
const WALK = 2.9, RUN = 6.2;
function updatePlayer(dt, canMove) {
  const { dx, dy } = input.consumeMouse();
  player.yaw -= dx * 0.0026;
  player.pitch = THREE.MathUtils.clamp(player.pitch + dy * 0.002, -0.35, 1.2);
  const f = canMove ? (input.down('KeyW', 'ArrowUp') ? 1 : 0) - (input.down('KeyS', 'ArrowDown') ? 1 : 0) : 0;
  const s = canMove ? (input.down('KeyD', 'ArrowRight') ? 1 : 0) - (input.down('KeyA', 'ArrowLeft') ? 1 : 0) : 0;
  fwd.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  right.set(-Math.cos(player.yaw), 0, Math.sin(player.yaw));
  move.set(0, 0, 0).addScaledVector(fwd, f).addScaledVector(right, s);

  let mult = 1;
  if (brawl) mult = brawl.updatePlayer(dt, move, input);
  let speed = 0, targetYaw = player.modelYaw;
  const moving = move.lengthSq() > 0 && mult > 0;
  if (moving) {
    move.normalize();
    speed = (input.down('ShiftLeft', 'ShiftRight') ? RUN : WALK) * mult;
    targetYaw = Math.atan2(move.x, move.z);
    const facing = Math.cos(targetYaw - player.modelYaw);
    const turnSlow = brawl && player.blocking ? 1 : THREE.MathUtils.clamp(0.35 + facing, 0.35, 1);
    player.pos.addScaledVector(move, speed * dt * turnSlow);
  }
  if (brawl?.faceYaw) {
    const y = brawl.faceYaw();
    if (y != null) targetYaw = y;
  } else if (brawl) {
    // Face where you walk; square up to the nearest thug when standing, blocking or swinging.
    const t = brawl.nearest(4);
    if (player.atk > 0) targetYaw = player.modelYaw;
    else if (t && (!moving || player.blocking)) targetYaw = Math.atan2(t.pos.x - player.pos.x, t.pos.z - player.pos.z);
  } else if (canMove && player.grounded && input.pressed('Space')) { player.vy = 5.2; player.grounded = false; }
  player.vy -= 16 * dt;
  player.pos.y += player.vy * dt;
  if (player.pos.y <= 0) { player.pos.y = 0; player.vy = 0; player.grounded = true; }

  loc.collide(player.pos, player.radius);
  loc.pushFromTraffic(player.pos, player.radius);
  for (const n of [...peds, ...storyNpcList()]) {
    const ddx = player.pos.x - n.pos.x, ddz = player.pos.z - n.pos.z;
    const d = Math.hypot(ddx, ddz), min = player.radius + n.radius;
    if (d < min && d > 1e-5) {
      player.pos.x += (ddx / d) * (min - d) * 0.6; player.pos.z += (ddz / d) * (min - d) * 0.6;
      if (n.def?.wander !== 0) { n.pos.x -= (ddx / d) * (min - d) * 0.4; n.pos.z -= (ddz / d) * (min - d) * 0.4; }
    }
  }
  if (!(brawl && player.dead)) player.modelYaw = lerpAngle(player.modelYaw, targetYaw, 1 - Math.exp(-12 * dt));
  hero.root.position.copy(player.pos);
  const lying = Math.min(1, Math.abs(heroExtraRot.x) / (Math.PI / 2));
  hero.root.position.y += 0.16 * lying;
  hero.blob.visible = lying < 0.2 && player.pos.y < 0.05;
  hero.root.rotation.set(heroExtraRot.x, player.modelYaw, 0, 'YXZ');
  hero.update(dt, brawl && player.dead ? 0 : speed, !player.grounded);
}

// Emilio reaching for his wallet, then pulling his hand back.
const gesture = { on: false, t: 0 };
function updateGesture(dt) {
  if (!gesture.on || !hero) return;
  gesture.t += dt;
  const k = gesture.t / 1.3;
  hero.pose.point = k < 0.35 ? k / 0.35 * 0.7 : k < 0.55 ? 0.7 : Math.max(0, 0.7 * (1 - (k - 0.55) / 0.45));
  if (k >= 1) { gesture.on = false; hero.pose.point = 0; }
}

function updateFollowers(dt) {
  for (const n of storyNpcList()) {
    if (!n.follower) continue;
    const dx = player.pos.x - n.pos.x, dz = player.pos.z - n.pos.z, d = Math.hypot(dx, dz);
    let sp = 0;
    if (d > 2.4) {
      sp = d > 6 ? 6 : d > 3.5 ? 3.2 : 1.6;
      n.pos.x += (dx / d) * sp * dt; n.pos.z += (dz / d) * sp * dt;
      n.yaw = lerpAngle(n.yaw, Math.atan2(dx, dz), Math.min(1, dt * 8));
      loc.collide(n.pos, n.radius);
    } else n.yaw = lerpAngle(n.yaw, Math.atan2(dx, dz), Math.min(1, dt * 3));
    if (d > 25) { n.pos.set(player.pos.x - Math.sin(player.modelYaw) * 2, 0, player.pos.z - Math.cos(player.modelYaw) * 2); }
    n.char.root.position.copy(n.pos);
    n.char.root.rotation.y = n.yaw;
    n.char.update(dt, sp, false);
  }
}

function separateNPCs(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z;
    const d = Math.hypot(dx, dz), min = a.radius + b.radius + 0.1;
    if (d < min && d > 1e-5) {
      const push = (min - d) / 2;
      const wa = a.def?.wander === 0 ? 0 : 1, wb = b.def?.wander === 0 ? 0 : 1;
      a.pos.x += (dx / d) * push * wa; a.pos.z += (dz / d) * push * wa;
      b.pos.x -= (dx / d) * push * wb; b.pos.z -= (dz / d) * push * wb;
    }
  }
}

// ---------------------------------------------------------------- camera
const ray = new THREE.Raycaster();
const cam = { dist: 4.6, cur: 4.6 };
const pivot = new THREE.Vector3(), back = new THREE.Vector3();
function updateCamera(dt) {
  cam.dist = THREE.MathUtils.clamp(cam.dist + input.consumeWheel() * 0.004, 1.6, loc.camMax);
  const cp = Math.cos(player.pitch), sp = Math.sin(player.pitch);
  back.set(-Math.sin(player.yaw) * cp, sp, -Math.cos(player.yaw) * cp);
  right.set(-Math.cos(player.yaw), 0, Math.sin(player.yaw));
  const aim = brawl?.aiming || G.aimCam;
  pivot.set(player.pos.x, player.pos.y + 1.55, player.pos.z).addScaledVector(right, aim ? 0.75 : loc.interior ? 0.3 : 0.45);
  let want = aim ? Math.min(cam.dist, 2.1) : cam.dist;
  ray.set(pivot, back); ray.far = want;
  const hit = ray.intersectObjects(loc.occluders, false)[0];
  if (hit) want = Math.max(0.5, hit.distance - 0.25);
  cam.cur = want < cam.cur ? want : cam.cur + (want - cam.cur) * Math.min(1, dt * 4);
  camera.position.copy(pivot).addScaledVector(back, cam.cur);
  camera.position.y = Math.max(camera.position.y, 0.35);
  if (loc.interior) {
    const B = loc.bounds, m = 0.2;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, B.minX + m, B.maxX - m);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, B.minZ + m, B.maxZ - m);
    camera.position.y = Math.min(camera.position.y, loc.ceiling - 0.25);
  }
  camera.lookAt(pivot);
  applyShake(dt);
}
function applyShake(dt) {
  if (G.shake > 0) {
    const k = G.shake * 0.15;
    camera.position.x += (Math.random() - 0.5) * k; camera.position.y += (Math.random() - 0.5) * k;
    G.shake = Math.max(0, G.shake - dt);
  }
}

// ---------------------------------------------------------------- interaction
let interactCooldown = 0;
function nearestTarget() {
  let best = null, bestScore = 1;
  for (const n of storyNpcList()) {
    if (n.follower && !n.lines.length) continue;
    const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) / 2.4;
    if (d < bestScore) { best = { kind: 'npc', npc: n }; bestScore = d; }
  }
  for (const n of peds) {
    const d = Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) / 2.0;
    if (d < bestScore) { best = { kind: 'npc', npc: n }; bestScore = d; }
  }
  // Standing inside a fight zone that didn't start (you loaded a save in it): offer to start it.
  for (const d of loc.dangers) {
    if (d.armed || state.flags['cleared:' + d.id] || (d.when && !d.when(S))) continue;
    if (!(player.pos.x > d.minX && player.pos.x < d.maxX && player.pos.z > d.minZ && player.pos.z < d.maxZ)) continue;
    for (const a of loc.thugActors?.[d.id] || []) {
      const dd = Math.hypot(a.pos.x - player.pos.x, a.pos.z - player.pos.z) / 4;
      if (dd < bestScore) { best = { kind: 'fight', d }; bestScore = dd; }
    }
  }
  for (const it of loc.interactables) {
    if (it.when && !it.when(S)) continue;
    if (it.type === 'pickup' && state.inv.includes(it.item)) continue;
    const d = Math.hypot(it.x - player.pos.x, it.z - player.pos.z) / it.r;
    if (d < bestScore * 1.05) { best = { kind: it.type, it }; bestScore = d; }
  }
  return best;
}
function updateInteraction(dt) {
  interactCooldown = Math.max(0, interactCooldown - dt);
  const t = nearestTarget();
  if (!t) { ui.prompt(null); return; }
  let label, locked = false;
  if (t.kind === 'fight') label = `Fight <b>${t.d.speaker || t.d.name}</b>`;
  else if (t.kind === 'npc') label = `Talk${t.npc.name ? ` to <b>${t.npc.name}</b>` : ''}`;
  else {
    label = `<b>${t.it.label}</b>`;
    if (t.it.requires && !state.inv.includes(t.it.requires)) locked = true;
  }
  ui.prompt(`<kbd>E</kbd> ${label}`, locked);
  if (!input.pressed('KeyE') || interactCooldown > 0) return;
  if (t.kind === 'fight') { startFight(t.d); return; }
  if (t.kind === 'npc') {
    const n = t.npc, def = n.def;
    if (def?.talkFn) runConvo(def.talkFn, n);
    else if (def?.talk && CONVOS[def.talk]) runConvo(CONVOS[def.talk], n);
    else runConvo((T) => linesConvo(T, n.name || 'Stranger', n.lines), n);
    return;
  }
  const it = t.it;
  if (locked) { runConvo((T) => T.say(G.heroName(), it.lockedMsg || 'Not yet.')); return; }
  if (it.fn) { runConvo(it.fn); interactCooldown = 0.4; return; }
  if (it.type === 'pickup') {
    if (it.pesos) G.addPesos(it.pesos, ITEMS[it.item].name);
    G.give(it.item);
    G.emit('pickup:' + it.item);
    interactCooldown = 0.3;
  } else if (it.type === 'door') {
    ui.prompt(null);
    mode = 'fade';
    ui.fade(true);
    setTimeout(() => {
      enterLocation(it.to, it.spawn);
      G.emit('enter:' + it.to);
      mode = 'play';
      ui.fade(false);
    }, 450);
  } else if (it.type === 'use') {
    const convo = USE_CONVOS[it.event];
    if (convo) runConvo(CONVOS[convo]);
    else G.emit(it.event);
    interactCooldown = 0.4;
  }
}

function updateTriggers() {
  for (const tr of loc.triggers) {
    const inside = player.pos.x > tr.minX && player.pos.x < tr.maxX && player.pos.z > tr.minZ && player.pos.z < tr.maxZ;
    const was = loc.triggerInside[tr.id];
    loc.triggerInside[tr.id] = inside;
    if (inside && !was && (!tr.when || tr.when(S))) G.emit(tr.event);
  }
}

// ---------------------------------------------------------------- fights
function checkDangers() {
  for (const d of loc.dangers) {
    if (state.flags['cleared:' + d.id] || (d.when && !d.when(S))) continue;
    const inside = player.pos.x > d.minX && player.pos.x < d.maxX && player.pos.z > d.minZ && player.pos.z < d.maxZ;
    if (!inside) { d.armed = true; continue; }
    if (d.armed) { startFight(d); return; }
  }
}
async function startFight(d) {
  d.armed = false;
  activeDanger = d;
  const actors = loc.thugActors[d.id];
  mode = 'talk';
  ui.prompt(null);
  actors.forEach((a) => { a.faceTo = player.pos; });
  await talk.say(d.speaker || 'Thug', d.barks[Math.floor(Math.random() * d.barks.length)]);
  if (activeDanger !== d) return;   // a save was loaded during the bark
  talk.close();
  mode = 'fight';
  document.body.classList.add('fighting');
  if (d.guns) {
    brawl = new Gunfight(G, empire.shapeFight(d), actors);
    ui.toast('Hold Right-click / Q to aim · Click / F to fire · R to reload. Buildings stop bullets — use cover. Out of sight, you catch your breath.', 'Gunfight!', true);
    return;
  }
  brawl = new Brawl(G, empire.shapeFight(d), actors);
  ui.toast(`Click / F punch · R kick · hold Right-click / C block · Space dodge · E takedown when they're stunned${d.thugs.some((t) => t.weapon) ? ' — careful: a knife cuts through your block' : ''}`, 'Fight!', true);
}
function endFightCleanup() {
  if (brawl) brawl.dispose();
  brawl = null;
  document.body.classList.remove('fighting');
  const p = G.player;
  p.atk = 0; p.blocking = false; p.dodge = 0; p.dead = 0;
  if (hero) { hero.pose.guard = 0; hero.pose.punch = 0; hero.pose.jab = 0; hero.pose.hurt = 0; hero.pose.kick = 0; hero.pose.point = 0; }
}
function endFight(result) {
  const d = activeDanger;
  activeDanger = null;
  if (result === 'win') {
    endFightCleanup();
    state.flags['cleared:' + d.id] = true;
    G.emit('won:' + d.id);
    ui.toast(`${d.name} is clear.`, 'You won the fight');
    if (d.reward) G.addPesos(d.reward, "Thugs' pockets");
    if (player.hp < 50) ui.toast('Hurt. Buy something to eat and eat it from the inventory (I).', 'Health', true);
    mode = 'play';
    // leave the beaten thugs lying where they fell (until the area reloads)
    loc.fallen ||= [];
    loc.fallen.push(...loc.thugActors[d.id]);
    delete loc.thugActors[d.id];
  } else if (result === 'escape') {
    endFightCleanup();
    ui.toast('They gave up the chase.', 'You got away');
    resetThugs(d);
    mode = 'play';
    G.emit('escaped:' + d.id);
  } else {
    gameOver(d.loseMsg || `You were beaten unconscious in the ${d.name}.`);
  }
}

function resetThugs(d) {
  for (const [i, a] of (loc.thugActors[d.id] || []).entries()) {
    const t = d.thugs[i];
    a.pos.set(t.x, 0, t.z); a.yaw = t.yaw; a.extraRot.set(0, 0, 0); a.faceTo = null; a.target = null;
    for (const k of Object.keys(a.pose)) a.pose[k] = 0;
    a.animSpeed = undefined; a.tweens = []; a.sync();
  }
}

// ---------------------------------------------------------------- HUD: plates, minimap, waypoint
const proj = new THREE.Vector3();
const plateEls = new Map();
function clearPlates() { for (const el of plateEls.values()) el.remove(); plateEls.clear(); }
function placePlate(el, pos, h = 2.1) {
  proj.set(pos.x, pos.y + h, pos.z).project(camera);
  const d = camera.position.distanceTo(pos);
  if (d > 24 || proj.z > 1) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.transform = `translate(-50%, -100%) translate(${(proj.x * 0.5 + 0.5) * innerWidth}px, ${(-proj.y * 0.5 + 0.5) * innerHeight}px)`;
  el.style.opacity = String(Math.min(1, (24 - d) / 6));
}
function updatePlates() {
  const live = new Set();
  for (const n of storyNpcList()) {
    if (!n.name || !n.char.root.visible) continue;
    live.add(n);
    let el = plateEls.get(n);
    if (!el) { el = document.createElement('div'); el.className = 'plate'; el.textContent = n.name + (translateName(n.name) ? ` (${translateName(n.name)})` : ''); ui.el.plates.appendChild(el); plateEls.set(n, el); }
    placePlate(el, n.pos, n.def?.sit ? 1.7 : 2.15);
  }
  for (const [n, el] of plateEls) if (!live.has(n)) { el.remove(); plateEls.delete(n); }
}

let currentZone = '';
function updateZone() {
  const z = loc.zoneAt(player.pos.x, player.pos.z);
  if (z !== currentZone) { currentZone = z; ui.setZone(z, loc.region); }
}

// Minimap: a player-centred, camera-rotated view of a pre-rendered map.
const mm = document.getElementById('minimap');
const mmc = mm.getContext('2d');
const MMS = mm.width;
const mmBase = document.createElement('canvas');
const mapInfo = { s: 3, minX: 0, minZ: 0 };
function buildMinimapBase() {
  const B = loc.bounds;
  const pad = loc.interior ? 2 : 30;
  const s = loc.interior ? 16 : 3.2;
  Object.assign(mapInfo, { s, minX: B.minX - pad, minZ: B.minZ - pad });
  const W = Math.ceil((B.maxX - B.minX + pad * 2) * s), H = Math.ceil((B.maxZ - B.minZ + pad * 2) * s);
  mmBase.width = W; mmBase.height = H;
  const g = mmBase.getContext('2d');
  const X = (x) => (x - mapInfo.minX) * s, Z = (z) => (z - mapInfo.minZ) * s;
  const night = loc.env.mood === 'night';
  g.fillStyle = loc.interior ? '#1a1612' : night ? '#1c1e24' : '#8a7a5e';
  g.fillRect(0, 0, W, H);
  g.fillStyle = loc.interior ? '#7a6a58' : night ? '#2a2c34' : '#a8987a';
  g.fillRect(X(B.minX), Z(B.minZ), (B.maxX - B.minX) * s, (B.maxZ - B.minZ) * s);
  g.fillStyle = night ? '#4a4c54' : '#55565c';
  for (const r of loc.mapRoads) g.fillRect(X(r.x - r.w / 2), Z(r.z - r.d / 2), r.w * s, r.d * s);
  for (const r of loc.mapRects) {
    if (loc.interior) continue;
    g.fillStyle = night ? '#3a3a40' : shade(r.color);
    g.fillRect(X(r.x - r.w / 2), Z(r.z - r.d / 2), r.w * s, r.d * s);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
    g.strokeRect(X(r.x - r.w / 2), Z(r.z - r.d / 2), r.w * s, r.d * s);
  }
  if (loc.interior) {
    g.fillStyle = '#2a241e';
    for (const c of loc.colliders) {
      const w = c.maxX - c.minX, d = c.maxZ - c.minZ;
      if (Math.min(w, d) < 0.3) g.fillRect(X(c.minX), Z(c.minZ), w * s, d * s);
    }
  }
  for (const it of loc.interactables) if (it.type === 'door') {
    g.fillStyle = '#6fd3ff'; g.beginPath(); g.arc(X(it.x), Z(it.z), loc.interior ? 5 : 4, 0, Math.PI * 2); g.fill();
  }
}
function shade(c) { return '#' + new THREE.Color(c).lerp(new THREE.Color('#5a5048'), 0.45).getHexString(); }

function objectiveTarget() {
  const b = currentBeat();
  if (!b || b.type !== 'goal' || !b.target || !loc) return null;
  const t = typeof b.target === 'function' ? b.target(S) : b.target;
  if (!t) return null;
  if (t.loc === loc.id) return t;
  const door = loc.interactables.find((it) => it.type === 'door' && it.to === t.loc)
    || loc.interactables.find((it) => it.type === 'door' && (!it.when || it.when(S)));
  return door ? { x: door.x, z: door.z } : null;
}

function drawMinimap() {
  const c = mmc, R = MMS / 2, s = mapInfo.s;
  const zoom = loc.interior ? 0.55 : 1;
  c.clearRect(0, 0, MMS, MMS);
  c.save();
  c.beginPath(); c.arc(R, R, R, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#111'; c.fillRect(0, 0, MMS, MMS);
  const theta = -Math.PI / 2 - Math.atan2(Math.cos(player.yaw), Math.sin(player.yaw));
  const px = (player.pos.x - mapInfo.minX) * s, pz = (player.pos.z - mapInfo.minZ) * s;
  c.translate(R, R); c.rotate(theta); c.scale(zoom, zoom); c.translate(-px, -pz);
  c.drawImage(mmBase, 0, 0);
  const X = (x) => (x - mapInfo.minX) * s, Z = (z) => (z - mapInfo.minZ) * s;
  // danger alleys
  for (const d of loc.dangers) {
    if (state.flags['cleared:' + d.id] || (d.when && !d.when(S))) continue;
    c.fillStyle = 'rgba(220,40,30,0.45)';
    c.fillRect(X(d.minX), Z(d.minZ), (d.maxX - d.minX) * s, (d.maxZ - d.minZ) * s);
  }
  for (const n of storyNpcList()) {
    c.fillStyle = n.follower ? '#9ee08a' : '#ffd23f';
    c.beginPath(); c.arc(X(n.pos.x), Z(n.pos.z), 4 / zoom, 0, Math.PI * 2); c.fill();
  }
  for (const list of Object.values(loc.thugActors || {})) for (const a of list) {
    c.fillStyle = '#ff4a3a';
    c.beginPath(); c.arc(X(a.pos.x), Z(a.pos.z), 3.5 / zoom, 0, Math.PI * 2); c.fill();
  }
  for (const n of peds) {
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.arc(X(n.pos.x), Z(n.pos.z), 2 / zoom, 0, Math.PI * 2); c.fill();
  }
  ow.drawMap(c, X, Z, zoom);
  c.restore();
  // objective markers (clamped to the rim): gold for the story, blue for the side job
  const rim = (t, color) => {
    let mx = (t.x - player.pos.x) * s * zoom, mz = (t.z - player.pos.z) * s * zoom;
    const cs = Math.cos(theta), sn = Math.sin(theta);
    let rx = mx * cs - mz * sn, ry = mx * sn + mz * cs;
    const dist = Math.hypot(rx, ry);
    if (dist > R - 12) { rx *= (R - 12) / dist; ry *= (R - 12) / dist; }
    c.save(); c.translate(R + rx, R + ry); c.rotate(Math.PI / 4);
    c.fillStyle = color; c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.fillRect(-6, -6, 12, 12); c.strokeRect(-6, -6, 12, 12);
    c.restore();
  };
  const st = ow.sideTarget();
  if (st) rim(st, '#3aa0ff');
  const t = objectiveTarget();
  if (t) rim(t, '#e8c46a');
  // player arrow
  c.save(); c.translate(R, R);
  c.rotate(Math.atan2(Math.cos(player.modelYaw), Math.sin(player.modelYaw)) - Math.atan2(Math.cos(player.yaw), Math.sin(player.yaw)));
  c.fillStyle = '#ff5a36'; c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, -8); c.lineTo(6, 6); c.lineTo(0, 2.5); c.lineTo(-6, 6); c.closePath(); c.fill(); c.stroke();
  c.restore();
  // north tick
  const nAng = theta - Math.PI / 2;
  c.fillStyle = '#e8c46a'; c.font = '700 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('N', R + Math.cos(nAng) * (R - 9), R + Math.sin(nAng) * (R - 9));
}

const wpTmp = new THREE.Vector3();
function updateWaypoint() {
  const el = ui.el.waypoint;
  const t = mode === 'play' || mode === 'fight' ? objectiveTarget() : null;
  if (!t) { el.style.display = 'none'; ui.setDistance(null); return; }
  const dist = Math.hypot(t.x - player.pos.x, t.z - player.pos.z);
  ui.setDistance(dist);
  ui.el.wpDist.textContent = `${Math.round(dist)} m`;
  el.style.display = dist < 1.4 ? 'none' : 'block';
  wpTmp.set(t.x, 1.7, t.z);
  const csp = wpTmp.clone().applyMatrix4(camera.matrixWorldInverse);
  wpTmp.project(camera);
  const W = innerWidth, H = innerHeight, m = 48;
  let sx = (wpTmp.x * 0.5 + 0.5) * W, sy = (-wpTmp.y * 0.5 + 0.5) * H;
  const behind = csp.z > 0;
  let edge = false;
  if (behind || sx < m || sx > W - m || sy < m || sy > H - m) {
    let dx = csp.x, dy = behind ? Math.abs(csp.y) + 1 : -csp.y;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) dy = 1;
    const k = Math.min((W / 2 - m) / Math.max(Math.abs(dx), 1e-4), (H / 2 - m) / Math.max(Math.abs(dy), 1e-4));
    sx = W / 2 + dx * k; sy = H / 2 + dy * k;
    edge = true;
  }
  el.classList.toggle('edge', edge);
  el.style.left = `${sx}px`; el.style.top = `${sy}px`;
}

// ---------------------------------------------------------------- menus & screens
const $ = (id) => document.getElementById(id);
const screens = { title: $('title'), gameover: $('gameover'), ending: $('ending') };
const overlays = { pause: $('pause'), inventory: $('inventory'), load: $('loadmenu'), controls: $('controls'), journal: $('journal') };
function hideScreens() { for (const s of Object.values(screens)) s.classList.add('hidden'); }
function openOverlay(name, back = null) {
  for (const o of Object.values(overlays)) o.classList.add('hidden');
  overlay = name;
  overlayBack = back;
  if (name === 'pause') {
    const b = currentBeat();
    $('pause-obj').textContent = b ? `${b.chapter}${beatText(b) ? ' — ' + beatText(b) : ''}` : '';
    const why = canSave();
    $('btn-save').disabled = !!why;
    $('save-note').textContent = why || '';
  }
  if (name === 'inventory') invPanel.open(state.inv, state.pesos, state.food, player.hp);
  if (name === 'load') renderSlots();
  if (name === 'journal') { const b = currentBeat(); ow.renderJournal(b?.chapter, beatText(b)); }
  overlays[name].classList.remove('hidden');
  document.exitPointerLock?.();
}
function closeOverlay(relock = false) {
  for (const o of Object.values(overlays)) o.classList.add('hidden');
  overlay = null;
  if (relock && mode !== 'title' && mode !== 'gameover' && mode !== 'ending') input.lock();
}
function backFromOverlay() {
  if (overlayBack) { const b = overlayBack; openOverlay(b); }
  else closeOverlay(true);
}
function renderSlots() {
  const box = $('slots');
  box.innerHTML = '';
  for (const [slot, label] of [['auto', 'Autosave'], ['manual', 'Manual save']]) {
    const s = Saves.read(slot);
    const b = document.createElement('button');
    b.disabled = !s;
    b.innerHTML = `<b>${label}</b><span></span><small></small>`;
    b.querySelector('span').textContent = s ? (s.objective || s.chapter) : 'Empty';
    b.querySelector('small').textContent = s ? describeSave(s) : '';
    b.addEventListener('click', () => { sfx.click(); loadGame(s); });
    box.appendChild(b);
  }
}
for (const o of Object.values(overlays)) o.querySelector('[data-close]')?.addEventListener('click', () => backFromOverlay());
invPanel.onClose = () => backFromOverlay();
invPanel.onEat = (id) => { G.eat(id); invPanel.open(state.inv, state.pesos, state.food, player.hp, invPanel.sel); };

$('pause').addEventListener('click', (e) => {
  const act = e.target.closest('button')?.dataset.act;
  if (!act) return;
  sfx.click();
  if (act === 'resume') closeOverlay(true);
  else if (act === 'save') { manualSave(); openOverlay('pause'); }
  else if (act === 'load') openOverlay('load', 'pause');
  else if (act === 'inventory') openOverlay('inventory', 'pause');
  else if (act === 'journal') openOverlay('journal', 'pause');
  else if (act === 'controls') openOverlay('controls', 'pause');
  else if (act === 'title') toTitle();
});
$('journal').addEventListener('click', (e) => {
  if (e.target.closest('[data-act=abandon]')) { sfx.click(); ow.abandon(); openOverlay('journal', overlayBack); }
});
$('title').addEventListener('click', (e) => {
  const act = e.target.closest('button')?.dataset.act;
  if (!act) return;
  sfx.unlock(); sfx.click();
  if (act === 'continue') loadGame(Saves.latest());
  else if (act === 'new') newGame();
  else if (act === 'load') openOverlay('load');
  else if (act === 'controls') openOverlay('controls');
});
$('gameover').addEventListener('click', (e) => {
  const act = e.target.closest('button')?.dataset.act;
  if (!act) return;
  sfx.click();
  if (act === 'retry') loadGame(Saves.latest());
  else toTitle();
});
$('ending').addEventListener('click', (e) => { if (e.target.closest('button')) toTitle(); });

function gameOver(why) {
  director.abort();
  closeTalk();
  ow.cancelTransient();
  mode = 'gameover';
  endFightCleanup();
  document.exitPointerLock?.();
  $('gameover-why').textContent = why;
  screens.gameover.querySelector('h1').textContent = /beaten|unconscious/.test(why) ? 'KNOCKED OUT' : 'GAME OVER';
  ui.boss(null);
  const s = Saves.latest();
  $('gameover-save').textContent = s ? `Last save: ${s.objective || s.chapter} · ${describeSave(s)}` : '';
  screens.gameover.classList.remove('hidden');
}
function showEnding() {
  mode = 'ending';
  document.exitPointerLock?.();
  document.body.classList.add('on-title');
  moodOverride = 'dusk';
  showLoc('abq');
  ui.fade(false);
  ui.boss(null);
  screens.ending.classList.remove('hidden');
}
function toTitle() {
  resetForLoad();
  mode = 'title';
  document.body.classList.add('on-title');
  ui.setObjective('', '');
  showLoc('hacienda');
  refreshTitle();
  screens.title.classList.remove('hidden');
  document.exitPointerLock?.();
}
function refreshTitle() {
  const s = Saves.latest();
  $('btn-continue').disabled = !s;
  $('continue-info').textContent = s ? `${s.objective || ''} ${describeSave(s)}`.trim() : 'No saved game yet.';
}

// Pointer lock: clicking the game re-locks; losing lock opens the pause menu.
renderer.domElement.addEventListener('mousedown', () => {
  if (!overlay && (mode === 'play' || mode === 'fight' || mode === 'talk' || (mode === 'scene' && G.wantLock))) input.lock();
});
let wasLocked = false;
input.onLockChange = (locked) => {
  if (locked) { wasLocked = true; return; }
  if (wasLocked && !overlay && ['play', 'fight', 'talk'].includes(mode)) openOverlay('pause');
};

function handleMenuKeys() {
  if (mode === 'title' || mode === 'gameover' || mode === 'ending') {
    if (overlay && input.pressed('Escape')) backFromOverlay();
    return;
  }
  if (overlay === 'inventory') {
    invPanel.update(input);
    if (input.pressed('KeyI') || input.pressed('Escape')) backFromOverlay();
    return;
  }
  if (overlay) {
    if (input.pressed('Escape') || input.pressed('KeyP') || (overlay === 'journal' && input.pressed('KeyJ'))) backFromOverlay();
    return;
  }
  if (input.pressed('KeyP') || input.pressed('Escape')) { openOverlay('pause'); return; }
  if (input.pressed('KeyI') && (mode === 'play')) openOverlay('inventory');
  if (input.pressed('KeyJ') && (mode === 'play')) openOverlay('journal');
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let worldT = 0;
let titleT = 0;
function frame() {
  requestAnimationFrame(frame);
  const rawDt = clock.getDelta();
  let dt = Math.min(rawDt, 0.05);
  if (!document.hidden && rawDt < 0.5) adaptResolution(rawDt);
  if (G.hitstop > 0) { G.hitstop -= rawDt; dt *= 0.15; }
  handleMenuKeys();
  const paused = overlay !== null || mode === 'gameover';
  worldT += paused ? 0 : dt;

  if (loc) { waveFlags(loc, worldT); flickerFires(loc, worldT); }

  if (mode === 'portrait') {
    for (const c of portrait.chars) c.update(dt, 0, false);
    camera.position.copy(portrait.cam); camera.lookAt(portrait.look);
  } else if (mode === 'title' || mode === 'ending') {
    titleT += dt;
    const a = 0.6 + Math.sin(titleT * 0.04) * 0.5;
    camera.position.set(Math.sin(a) * 15, 4.5 + Math.sin(titleT * 0.2) * 0.4, -7 + Math.cos(a) * 15);
    camera.lookAt(3, 1.5, -9);
    for (const n of peds) n.update(dt, loc, { pos: camera.position });
    updateSun(new THREE.Vector3(0, 0, -6));
  } else if (mode === 'scene') {
    const md = input.consumeMouse();
    G.sceneMouse = { dx: (G.sceneMouse?.dx || 0) + md.dx, dy: (G.sceneMouse?.dy || 0) + md.dy };
    if (!paused) director.update(dt);
    for (const n of peds) n.update(paused ? 0 : dt, loc, player);
    applyShake(dt);
    updateSun(director.focus);
  } else if (loc) {
    const active = !paused;
    if (active && mode === 'play') {
      updatePlayer(dt, true);
      for (const f of G.tickers) f(dt);
      updateInteraction(dt);
      updateTriggers();
      checkDangers();
      processEvents();
    } else if (active && mode === 'fight') {
      updatePlayer(dt, true);
      const r = brawl.update(dt);
      if (r) endFight(r);
    } else if (active && mode === 'talk') {
      updatePlayer(dt, false);
      updateGesture(dt);
    } else {
      input.consumeMouse();
    }
    const sdt = paused ? 0 : dt;
    for (const n of peds) n.update(sdt, loc, player);
    for (const n of storyNpcList()) if (!n.follower) {
      if (n.def?.sit) { n.char.root.position.copy(n.pos); n.char.root.rotation.y = n.yaw; n.char.update(sdt, 0, false); }
      else n.update(sdt, loc, player);
    }
    updateFollowers(sdt);
    separateNPCs([...peds, ...storyNpcList()]);
    for (const [id, list] of Object.entries(loc.thugActors || {})) {
      if (brawl && activeDanger?.id === id) continue;
      for (const a of list) a.update(sdt);
    }
    if (!paused) ow.update(dt);
    const agents = [player.pos, ...peds.map((n) => n.pos)];
    loc.updateTraffic(sdt, agents);
    if (mode !== 'fade') updateCamera(dt);
    updatePlates();
    updateZone();
    drawMinimap();
    updateWaypoint();
    updateSun(player.pos);
  }
  if (!paused) talk.update(dt);
  empire.update();
  input.endFrame();
  render();
}

// ---------------------------------------------------------------- graphics setting
function gfxLabel() { return `Graphics: ${quality[0].toUpperCase()}${quality.slice(1)}`; }
function cycleQuality() {
  quality = QUALITIES[(QUALITIES.indexOf(quality) + 1) % QUALITIES.length];
  try { localStorage.setItem('bfb.gfx2', quality); } catch { /* ignore */ }
  buildPipeline();
  if (loc) applyEnv();
  document.querySelectorAll('[data-act=gfx]').forEach((b) => { b.textContent = gfxLabel(); });
}
document.querySelectorAll('[data-act=gfx]').forEach((b) => {
  b.textContent = gfxLabel();
  b.addEventListener('click', (e) => { e.stopPropagation(); sfx.click(); cycleQuality(); });
});

// ---------------------------------------------------------------- boot
buildPipeline();
toTitle();
frame();

// Debug: line up characters facing the camera to inspect them.
const portrait = { chars: [], cam: new THREE.Vector3(), look: new THREE.Vector3() };
window.game = {
  portrait(looks, dist = 2.2, y = 1.55) {
    portrait.chars.forEach((c) => c.root.parent?.remove(c.root));
    portrait.chars = looks.map((l, i) => {
      const c = createCharacter(LOOKS[l] || l);
      c.root.position.set(player.pos.x + (i - (looks.length - 1) / 2) * 0.8, 0, player.pos.z);
      loc.root.add(c.root);
      return c;
    });
    G.hideHero(true);
    portrait.cam.set(player.pos.x, y, player.pos.z + dist);
    portrait.look.set(player.pos.x, y - 0.05, player.pos.z);
    mode = 'portrait';
  },
  G, state, player, camera, S, BEATS,
  get loc() { return loc; }, get mode() { return mode; }, get fight() { return brawl; },
  jump(id) { const i = BEAT_INDEX[id]; if (i != null) { resetForLoad(); startBeat(i); } },
  go: (id, spawn) => enterLocation(id, spawn),
};
