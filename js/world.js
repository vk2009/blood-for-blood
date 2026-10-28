// Every place in Emilio's story. Each builder returns a Loc with spawns,
// interactables (doors, pickups, "use" spots), story NPC slots, danger
// alleys (fistfights), and triggers that fire story events.
import * as THREE from 'three';
import { mat } from './character.js';
import {
  Loc, TEX, seedRandom, rand, rr, pick, mesh, flat, box, std, withRepeat, canvasTexture, signTexture, signMaterials,
  contactShadow, createCar, building, house, parkCar, streetlight, rock, shrub, tree, dumpster, bench, fence, lowWall,
  ground, road, mesas, desertScatter,
} from './kit.js';
import { createPistol } from './gunplay.js';
import {
  TEX2, chileFlagTexture, mexicoFlagTexture, flagPole, shack, shackBlock, room, partition, table, chair, bed, shelf, crate,
  trash, barrelFire, clothesLine, lampPost, corkBoard, framedPicture, portraitTexture, createTrain, track, createPlane,
  palm, pool, sunUmbrella, militaryTruck, barricade, burntCar, grassTufts, andes, skyline, hillsideHouses,
} from './props.js';

const OUT = (mood = 'day') => ({ interior: false, mood });
const IN = (mood = 'warm') => ({ interior: true, mood });

function prep(L) {
  L.dangers = []; L.triggers = []; L.storyNpcs = []; L.region = ''; L.pedLines = null; L.cutsceneOnly = false;
  return L;
}
function dirtRoad(L, x, z, len, alongX, width) {
  const m = flat(width, len, std({ map: withRepeat(TEX.dirt, width / 6, len / 6), roughness: 1, color: '#c8b49a' }), L.root, x, 0.025, z);
  if (alongX) m.rotation.z = Math.PI / 2;
  L.mapRoads.push(alongX ? { x, z, w: len, d: width } : { x, z, w: width, d: len });
}
// Dark, littered alley floor between shack rows.
function alleyFloor(L, x0, x1, z0, z1) {
  flat(x1 - x0, z1 - z0, std({ map: withRepeat(TEX2.dirtFloor, (x1 - x0) / 3, (z1 - z0) / 3), roughness: 1, color: '#7a6a5a' }), L.root, (x0 + x1) / 2, 0.03, (z0 + z1) / 2);
}
// Waist-high cover that stops bullets (crates, sandbags).
function cover(L, x, z, w, d, h = 1.25, color = '#8a6a42') {
  const m = mesh(box(w, h, d), mat(color, 0.9), L.root, x, h / 2, z);
  L.addBox(x, z, w, d);
  L.occluders.push(m);
}
function graffitiOn(L, x, y, z, rot, w = 4, h = 2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: TEX2.graffiti, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 }));
  m.position.set(x, y, z); m.rotation.y = rot;
  L.root.add(m);
}

// ================================================================ CHILDHOOD (cutscene set)
function buildChildhood() {
  seedRandom(1962);
  const L = prep(new Loc('childhood', 'Valparaíso', { bounds: { minX: -25, maxX: 25, minZ: -25, maxZ: 25 }, env: OUT('golden') }));
  L.region = 'Valparaíso · 1964';
  ground(L, TEX.dirt, 60);
  // The family shack and neighbors around a dirt yard
  shack(L, 0, -8, 7, 5, { face: '+z', colorIndex: 1, h: 3 });
  shack(L, -9, -7, 6, 6, { face: '+x', colorIndex: 0 });
  shack(L, 9, -7, 6, 6, { face: '-x', colorIndex: 2 });
  shack(L, -11, 4, 5, 7, { face: '+x', colorIndex: 6 });
  shack(L, 12, 5, 6, 8, { face: '-x', colorIndex: 4 });
  shackBlock(L, -24, 24, -24, -12);
  // Fruit tree with oranges
  tree(L, 5.5, 1.5, 1.1);
  const orange = mat('#f08a1a', 0.5);
  for (let i = 0; i < 18; i++) mesh(new THREE.SphereGeometry(0.09, 8, 6), orange, L.root, 5.5 + rr(-1.3, 1.3), rr(2.6, 4.0), 1.5 + rr(-1.3, 1.3), false);
  grassTufts(L, -24, 24, -12, 24, 500, '#8a8a4a', (x, z) => Math.hypot(x + 2, z + 1) < 5);
  // Low adobe wall the coati walks along
  lowWall(L, -2, 7, 14, 0.4, 1.0, '#b89a74');
  // Outdoor table with a basket of fruit
  table(L, -2.5, -2.2, 1.4, 0.9, '#7a5a3a');
  chair(L, -2.5, -3.1, 0, '#6a4a2e'); chair(L, -2.5, -1.3, Math.PI, '#6a4a2e');
  mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.16, 12), mat('#a8834f', 0.9), L.root, -2.2, 0.86, -2.2);
  for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.06, 8, 6), orange, L.root, -2.2 + rr(-0.1, 0.1), 0.95, -2.2 + rr(-0.1, 0.1), false);
  mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.04, 12), mat('#e8e0cf', 0.5), L.root, -2.9, 0.8, -2.5);
  clothesLine(L, -8, -3, -3, 3, 2.4);
  trash(L, 8, 9, 5);
  barrelFire(L, 8.5, -2, false);
  // Bay of Valparaíso far below
  flat(900, 400, std({ color: '#3a6a8a', roughness: 0.2, metalness: 0.2 }), L.root, 0, 0.08, 340);
  hillsideHouses(L, 0, 0, 45, 120, 160);
  L.finalize();
  return L;
}

// ================================================================ ROOM 1 (Valparaíso, 1974)
function buildRoom1() {
  seedRandom(74);
  const L = prep(new Loc('room1', "Emilio's Room", { bounds: { minX: -3.5, maxX: 3.5, minZ: -2.5, maxZ: 2.5 }, interior: true, env: IN('dim'), camMax: 2.6 }));
  L.region = 'Valparaíso · 1976';
  room(L, { w: 7, d: 5, h: 2.6, floor: std({ map: withRepeat(TEX2.dirtFloor, 3, 2), roughness: 1 }), wall: std({ map: withRepeat(TEX2.plaster, 3, 1), roughness: 1 }),
    ceiling: '#8a7a62', doorW: 1.1, lights: [[0.5, -0.4]], lightPower: 8, lightColor: '#ffcf8a', windowAt: [1.4, 1.6, 0.7, 0.5, 'back'] });
  bed(L, -2.4, -1.45, { blanket: '#5a4a3a' });
  // Table, chair, candle, photo
  table(L, 2.3, -1.7, 1.1, 0.7, '#5a4430');
  chair(L, 2.3, -0.95, Math.PI, '#5a4430');
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8), mat('#efe6cf', 0.6), L.root, 2.6, 0.85, -1.85);
  mesh(new THREE.ConeGeometry(0.02, 0.05, 6), std({ color: '#ffcc66', emissive: '#ffaa33', emissiveIntensity: 2 }), L.root, 2.6, 0.95, -1.85, false);
  mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.05, 12), mat('#e2dccb', 0.5), L.root, 2.1, 0.8, -1.7);
  // Bucket, crate, cracked mirror, hanging shirt
  mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.34, 12), mat('#7a7a72', 0.4, 0.6), L.root, 3.0, 0.17, 1.8);
  L.addBox(3.0, 1.8, 0.45, 0.45);
  crate(L, -3.0, 1.6, 0.7);
  mesh(box(0.5, 0.7, 0.03), std({ color: '#b8c8d0', roughness: 0.1, metalness: 0.8 }), L.root, -1.0, 1.6, -2.48, false);
  mesh(box(0.03, 0.03, 1.2), mat('#3a2a1c'), L.root, -3.47, 1.9, 0.6, false);
  mesh(box(0.02, 0.6, 0.5), mat('#8f8a7a', 0.95), L.root, -3.44, 1.55, 0.6, false);
  // Hidden coffee tin (pickup) — under the mattress
  const tin = new THREE.Group();
  tin.userData.dynamic = true;
  mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12), mat('#b03a2a', 0.5, 0.4), tin, 0, 0.08, 0);
  tin.position.set(-1.85, 0.0, -0.5);
  L.root.add(tin);
  // Photo (pickup)
  const photo = new THREE.Group();
  photo.userData.dynamic = true;
  mesh(box(0.14, 0.18, 0.02), mat('#efe6cf', 0.8), photo, 0, 0.09, 0);
  photo.rotation.x = -0.3;
  photo.position.set(2.0, 0.79, -1.85);
  L.root.add(photo);

  L.interactables.push(
    { type: 'pickup', x: -1.7, z: -1.0, r: 1.3, label: 'Take your savings from under the mattress', item: 'savings', pesos: 3150, mesh: tin },
    { type: 'pickup', x: 2.0, z: -1.2, r: 1.1, label: 'Take the photo of Mamá', item: 'photo', mesh: photo },
    { type: 'door', x: 0, z: 2.1, r: 1.1, label: 'Leave', to: 'barrio', spawn: 'home', requires: 'savings', lockedMsg: "Not without my savings. Everything I have is in that tin." },
  );
  L.spawns.bed = { x: -1.5, z: -0.2, yaw: Math.PI / 2 };
  L.spawns.door = { x: 0, z: 1.4, yaw: Math.PI };
  L.spawns.default = L.spawns.bed;
  L.finalize();
  return L;
}

// ================================================================ BARRIO (Valparaíso, 1974)
function buildBarrio() {
  seedRandom(1974);
  const L = prep(new Loc('barrio', 'Cerro Barón', { bounds: { minX: -62, maxX: 62, minZ: -82, maxZ: 72 }, env: OUT('day'), pedCount: 9, camMax: 9 }));
  L.region = 'Valparaíso · 1976';
  L.pedLines = 'barrio';
  ground(L, TEX.dirt, 70);

  // Streets
  dirtRoad(L, -31, 55, 62, true, 7);              // Pasaje Esperanza
  road(L, 0, -5, 154, false, 9);                  // Avenida Altamirano
  dirtRoad(L, -31, 5, 62, true, 7);               // Calle Norte
  dirtRoad(L, 31, -15, 62, true, 7);              // Calle Sur
  road(L, 31, -68, 62, true, 8);                  // Calle Estación
  L.zones.push(
    { name: 'Pasaje Esperanza', minX: -62, maxX: -4.5, minZ: 51.5, maxZ: 72 },
    { name: 'Avenida Altamirano', minX: -4.5, maxX: 4.5, minZ: -82, maxZ: 72 },
    { name: 'Calle Norte', minX: -62, maxX: -4.5, minZ: 1.5, maxZ: 8.5 },
    { name: 'Calle Sur', minX: 4.5, maxX: 62, minZ: -18.5, maxZ: -11.5 },
    { name: 'Estación Barón', minX: 4.5, maxX: 62, minZ: -82, maxZ: -64 },
    { name: 'Callejón del Diablo', minX: -23.5, maxX: -20.5, minZ: 8.5, maxZ: 51.5 },
    { name: 'Callejón del Diablo', minX: 4.5, maxX: 38, minZ: 28.5, maxZ: 31.5 },
    { name: 'Callejón de los Perros', minX: 28.5, maxX: 31.5, minZ: -64, maxZ: -18.5 },
  );

  // Emilio's shack row (south of Pasaje Esperanza)
  shack(L, -38, 63, 7, 8, { face: '-z', colorIndex: 1, h: 3 });
  shackBlock(L, -60, -42, 58.5, 71.5);
  shackBlock(L, -34, -4.5, 58.5, 71.5);
  // Block A, split by alley A1 (x -23.5..-20.5)
  shackBlock(L, -60, -23.5, 8.5, 51.5);
  shackBlock(L, -20.5, -4.5, 8.5, 51.5);
  alleyFloor(L, -23.5, -20.5, 8.5, 51.5);
  // Block B (north-west)
  shackBlock(L, -60, -4.5, -80, 1.5);
  // Block C (south-east) with dead-end alley C1 (z 28.5..31.5, x 4.5..38)
  shackBlock(L, 4.5, 60, 31.5, 71.5);
  shackBlock(L, 4.5, 60, -11.5, 28.5);
  shackBlock(L, 38, 60, 28.5, 31.5, 6.5);
  alleyFloor(L, 4.5, 38, 28.5, 31.5);
  // Block D (east) split by alley D1 (x 28.5..31.5)
  shackBlock(L, 4.5, 28.5, -64, -18.5);
  shackBlock(L, 31.5, 60, -64, -18.5);
  alleyFloor(L, 28.5, 31.5, -64, -18.5);
  // North of the station street, west of the station
  shackBlock(L, 4.5, 29, -81, -72.5);

  // Alley dressing: graffiti, trash, fire barrels
  graffitiOn(L, -23.45, 1.6, 30, Math.PI / 2, 5, 2.2);
  graffitiOn(L, -20.55, 1.6, 20, -Math.PI / 2, 5, 2.2);
  graffitiOn(L, 20, 1.6, 28.55, 0, 5, 2.2);
  graffitiOn(L, 28.55, 1.6, -40, Math.PI / 2, 5, 2.2);
  graffitiOn(L, 31.45, 1.6, -30, -Math.PI / 2, 5, 2.2);
  for (const [x, z] of [[-22, 36], [-21.5, 18], [16, 30], [29.6, -48], [30.3, -30]]) trash(L, x, z, 6, 0.6);
  barrelFire(L, -22.6, 26); barrelFire(L, 34.5, 30); barrelFire(L, 29.4, -42);
  clothesLine(L, -23.3, 44, -20.7, 42, 2.8);
  clothesLine(L, 28.7, -26, 31.3, -24, 2.8);

  // Street life
  for (const [x1, z1, x2, z2] of [[-50, 58.7, -44, 58.7], [-30, 51.6, -26, 51.6], [6, 50, 6, 44]]) clothesLine(L, x1, z1, x2, z2);
  for (const z of [60, 30, 0, -30, -60]) { lampPost(L, -5.2, z); lampPost(L, 5.2, z - 15); }
  parkCar(L, 3.0, 40, 0, '#6a6a5a'); parkCar(L, -3.0, -40, Math.PI, '#8a3a2a');
  crate(L, -6, 53.0); crate(L, -6.8, 53.4, 0.6);
  const cart = new THREE.Group();
  mesh(box(1.5, 0.85, 0.85), mat('#2e86c1', 0.6), cart, 0, 0.7, 0);
  mesh(new THREE.ConeGeometry(1.1, 0.45, 8), mat('#f2e8c8', 0.8), cart, 0, 2.1, 0);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), mat('#888'), cart, 0, 1.6, 0);
  for (let k = 0; k < 6; k++) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10), mat('#d8902a', 0.6), cart, -0.5 + k * 0.2, 1.14, 0.1, false);
  cart.position.set(-14, 0, 52.6); L.root.add(cart); L.addBox(-14, 52.6, 1.5, 0.85);
  dumpster(L, 8, -66, '#4a5a3a');

  // Station
  building(L, { x: 44, z: -77.5, w: 26, d: 8, h: 6, color: '#c9b48a', roof: '#7a5a42', face: '+z', variant: 'window', door: false,
    sign: 'ESTACIÓN BARÓN', signBg: '#2a3a5a', signFg: '#f2e8c8', signSub: 'BARÓN STATION · STATE RAILWAYS', signWidth: 12, signY: 5.2, signOut: 0.1 });
  // Ticket booth and the boarding gate
  const booth = new THREE.Group();
  mesh(box(2.2, 2.6, 1.4), mat('#7a5a3a', 0.8), booth, 0, 1.3, 0);
  mesh(box(1.6, 0.9, 0.06), std({ color: '#1c2a35', roughness: 0.1, metalness: 0.4 }), booth, 0, 1.6, 0.71);
  mesh(box(2.4, 0.15, 1.7), mat('#2a3a5a', 0.6), booth, 0, 2.7, 0.1);
  const bs = new THREE.Mesh(box(2.0, 0.5, 0.08), signMaterials(signTexture('BOLETOS', '#2a3a5a', '#f2e8c8', 'TICKETS'), '#2a3a5a', 0.3));
  bs.position.set(0, 3.1, 0.6); booth.add(bs);
  booth.position.set(36, 0, -72.6); L.root.add(booth); L.addBox(36, -72.6, 2.2, 1.4);
  const gate = mat('#3a3a3a', 0.5, 0.6);
  for (const x of [46, 50]) { mesh(box(0.15, 2.2, 0.15), gate, L.root, x, 1.1, -73.2); L.addBox(x, -73.2, 0.2, 0.2); }
  mesh(box(4.2, 0.15, 0.15), gate, L.root, 48, 2.2, -73.2);
  const gs = new THREE.Mesh(box(3.2, 0.5, 0.08), signMaterials(signTexture('ANDÉN 2 — SANTIAGO', '#2a3a5a', '#f2e8c8', 'PLATFORM 2 — TO SANTIAGO'), '#2a3a5a', 0.3));
  gs.position.set(48, 2.7, -73.2); L.root.add(gs);
  bench(L, 40, -71.6, Math.PI); bench(L, 54, -71.6, Math.PI);
  // Train waiting beyond the station (outside the playable area)
  const rails = new THREE.Group();
  track(rails, 0, -160, 160);
  rails.rotation.y = Math.PI / 2; rails.position.set(0, 0, -88);
  L.root.add(rails);
  const train = createTrain(4);
  train.rotation.y = Math.PI / 2;
  train.position.set(70, 0, -88);
  // (rails run along x here)
  L.root.add(train);

  // The hills of Valparaíso, covered in houses, and the harbour beyond
  hillsideHouses(L, 0, -5, 100, 190, 260);
  flat(1100, 360, std({ color: '#3a6a8a', roughness: 0.15, metalness: 0.3 }), L.root, 0, 0.08, 380);
  for (const [x, z, s2] of [[-80, 260, 1], [40, 300, 1.4], [150, 240, 0.8]]) {   // ships at anchor
    mesh(box(10 * s2, 3 * s2, 40 * s2), mat('#5a3a32', 0.7), L.root, x, 1.5 * s2, z, false);
    mesh(box(8 * s2, 4 * s2, 10 * s2), mat('#e8e2d2', 0.7), L.root, x, 5 * s2, z - 8 * s2, false);
  }
  andes(L, 0, 0, 1, -0.35, 1200, 520);

  // Danger alleys (entering starts a fistfight)
  L.dangers.push(
    { id: 'alleyA', name: 'Callejón del Diablo', minX: -23.5, maxX: -20.5, minZ: 8.5, maxZ: 50.8,
      thugs: [{ look: 'thug', x: -22.3, z: 48.2, yaw: 0 }, { look: 'thug2', x: -21.3, z: 46.8, yaw: -0.3 }],
      barks: ['¡Oye, amigo! Where are you going with those pockets?', 'Wrong alley, amigo. Pay the toll.'], reward: 60 },
    { id: 'alleyC', name: 'Callejón del Diablo', minX: 5.2, maxX: 38, minZ: 28.5, maxZ: 31.5,
      thugs: [{ look: 'thug2', x: 9.5, z: 30.4, yaw: -Math.PI / 2 }, { look: 'thug', x: 12, z: 29.3, yaw: -Math.PI / 2, weapon: 'knife' }, { look: 'thug', x: 30, z: 30, yaw: -Math.PI / 2 }],
      barks: ['Look who wandered into our house.', 'Get him!'], reward: 90 },
    { id: 'alleyD1', name: 'Callejón de los Perros', minX: 28.5, maxX: 31.5, minZ: -40, maxZ: -19.2,
      thugs: [{ look: 'thug', x: 30.4, z: -21.6, yaw: 0 }, { look: 'thug2', x: 29.4, z: -23.4, yaw: 0.2 }],
      barks: ['The station? Through here? That costs extra, hermano.', 'Empty the pockets. Slowly.'], reward: 70 },
    { id: 'alleyD2', name: 'Callejón de los Perros', minX: 28.5, maxX: 31.5, minZ: -63.3, maxZ: -40,
      thugs: [{ look: 'thug2', x: 30, z: -61.5, yaw: Math.PI }, { look: 'thug', x: 29.2, z: -59.8, yaw: Math.PI }],
      barks: ['Leaving the cerro? Not with that tin, you’re not.', '¡Agárrenlo!'], reward: 70 },
  );

  L.interactables.push(
    { type: 'door', x: -38, z: 58.4, r: 1.6, label: 'Go back inside', to: 'room1', spawn: 'door' },
    { type: 'use', x: 36, z: -71.2, r: 1.8, label: 'Buy a train ticket', event: 'ticket', when: (S) => !S.has('ticket') },
    { type: 'use', x: 48, z: -72.2, r: 1.9, label: 'Board the train to Santiago', event: 'board', requires: 'ticket', lockedMsg: 'I need a ticket first. The booth is to the left.' },
  );
  L.storyNpcs.push(
    { id: 'carmen', name: 'Doña Carmen', look: 'marketWoman', x: -14, z: 53.6, yaw: Math.PI, wander: 0, talk: 'carmen' },
    { id: 'neighbor', name: 'Señora Rosa', look: 'neighbor', x: -33, z: 57.6, yaw: Math.PI, wander: 1.5, talk: 'rosa' },
    { id: 'clerk', name: 'Ticket Clerk', look: 'clerk', x: 34.2, z: -71.7, yaw: 0.3, wander: 0, lines: ['Next!'] },
    { id: 'porter', name: 'Porter', look: 'clerk', x: 50.5, z: -71.8, yaw: Math.PI, wander: 0.5, lines: ['Ticket, señor? The Santiago train leaves soon.'] },
    { id: 'kid', name: 'Niño (Boy)', look: 'shoeshine', x: -8, z: 4, yaw: 1, wander: 6, lines: ['Are you going to Santiago? They say the streets there are paved with gold.', '…My papá says they’re paved with soldiers.'] },
  );
  L.spawns.home = { x: -38, z: 57.4, yaw: Math.PI };
  L.spawns.default = L.spawns.home;
  L.finalize();
  return L;
}

// ================================================================ TRAIN (cutscene set)
function buildTrainSet() {
  seedRandom(5);
  const L = prep(new Loc('train', 'Valparaíso – Santiago Railway', { bounds: { minX: -30, maxX: 30, minZ: -500, maxZ: 500 }, env: OUT('golden') }));
  L.region = 'Central Valley · 1976';
  ground(L, TEX.grass, 120);
  track(L.root, 0, -500, 500);
  for (let i = 0; i < 320; i++) {
    const side = rand() < 0.5 ? -1 : 1, x = side * rr(16, 140), z = rr(-500, 500);
    if (rand() < 0.5) tree(L, x, z, rr(0.8, 1.6)); else shrub(L, x, z);
  }
  // Rolling green hills of the central valley
  const hill = std({ color: '#7f9a4a', roughness: 1, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const h = mesh(new THREE.SphereGeometry(rr(25, 60), 10, 6), hill, L.root, side * rr(90, 200), -rr(8, 20), rr(-500, 500), false);
    h.scale.y = rr(0.35, 0.6);
  }
  grassTufts(L, -14, 14, -500, 500, 2500, '#6f8f3a', (x) => Math.abs(x) < 2.6);
  // Andes in the distance
  const snow = std({ color: '#f2f2f2', roughness: 0.9, flatShading: true });
  const rockM = std({ color: '#6a5a5a', roughness: 1, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const z = -500 + i * 40, x = -260 - rr(0, 60), h = rr(90, 160);
    mesh(new THREE.ConeGeometry(rr(60, 90), h, 6), rockM, L.root, x, h / 2 - 5, z, false);
    mesh(new THREE.ConeGeometry(rr(20, 30), h * 0.3, 6), snow, L.root, x, h - h * 0.15 - 5, z, false);
  }
  for (let z = -480; z <= 480; z += 40) {
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 7, 6), mat('#5d4431', 0.9), L.root, -5.5, 3.5, z);
    mesh(box(1.6, 0.1, 0.1), mat('#5d4431', 0.9), L.root, -5.5, 6.6, z);
  }
  L.finalize();
  const train = createTrain(4);
  train.userData.dynamic = true;
  L.root.add(train);
  L.train = train;
  return L;
}

// ================================================================ CUARTEL (enlistment, cutscene set)
function buildCuartel() {
  seedRandom(73);
  const L = prep(new Loc('cuartel', 'Regimiento Tacna', { bounds: { minX: -40, maxX: 40, minZ: -40, maxZ: 40 }, env: OUT('day') }));
  L.region = 'Santiago · 1976';
  ground(L, TEX.dirt, 50);
  flat(50, 36, std({ map: withRepeat(TEX.concrete, 12, 9), roughness: 1, color: '#c8c0b0' }), L.root, 0, 0.03, 0);
  building(L, { x: 0, z: -24, w: 44, d: 10, h: 8, color: '#d8ccb0', roof: '#7a6a5a', face: '+z', variant: 'window',
    sign: 'OFICINA DE RECLUTAMIENTO', signBg: '#5d6447', signFg: '#f2e8c8', signSub: 'ARMY RECRUITMENT OFFICE', signWidth: 14, signY: 6.6, signOut: 0.1, door: true, doorAt: 0, accent: '#5d6447' });
  building(L, { x: -28, z: 6, w: 10, d: 34, h: 6, color: '#d8ccb0', face: '+x', door: false });
  building(L, { x: 28, z: 6, w: 10, d: 34, h: 6, color: '#d8ccb0', face: '-x', door: false });
  flagPole(L, 6, -14, chileFlagTexture(), 11);
  table(L, -3, -12, 2.4, 0.9, '#5a4430');
  chair(L, -3, -12.9, 0, '#5a4430');
  mesh(box(0.4, 0.02, 0.3), mat('#f4f0dc', 0.8), L.root, -3.3, 0.79, -11.9);
  militaryTruck(L, 16, 10, 0.3);
  militaryTruck(L, -14, 14, -0.2);
  for (const [x1, z1, x2, z2] of [[-40, -40, 40, -40], [-40, 42, 40, 42], [-41, -40, -41, 42], [41, -40, 41, 42]]) fence(L, x1, z1, x2, z2, { h: 3, barbed: true });
  // Mess tables in front of the west barracks, sandbags by the east one
  for (const z of [16, 19.5]) { table(L, -19.5, z, 2.6, 0.9, '#5a4430'); }
  for (let k = 0; k < 5; k++) crate(L, 21.6, -6 + k * 0.9, 0.7, '#7a7258');
  andes(L, 0, 0, 1, 0.2, 1200, 430);
  skyline(L, 0, 0, 75, 240, 70, { hMin: 6, hMax: 26 });

  // ---- playable boot camp
  L.region = 'Santiago · 1976';
  L.zones.push(
    { name: 'Behind the Barracks', minX: -40, maxX: -33, minZ: -11, maxZ: 23 },
    { name: 'Behind the Barracks', minX: 33, maxX: 40, minZ: -11, maxZ: 23 },
    { name: 'Barracks', minX: -33, maxX: -23, minZ: -11, maxZ: 23 },
    { name: 'Barracks', minX: 23, maxX: 33, minZ: -11, maxZ: 23 },
    { name: 'Mess Tables', minX: -23, maxX: -15, minZ: 13, maxZ: 23 },
    { name: 'Recruitment Office', minX: -22, maxX: 22, minZ: -40, maxZ: -19 },
    { name: 'Parade Ground', minX: -40, maxX: 40, minZ: -40, maxZ: 42 },
  );
  const at = (S, ...ids) => ids.some((i) => S.at(i));
  L.storyNpcs.push(
    { id: 'sarge', name: 'Sargento Muñoz', look: 'sergeant', x: 4, z: 4, yaw: Math.PI, wander: 0, talk: 'sergeant', when: (S) => at(S, 'bcReport', 'bcCourse', 'bcRations', 'bcVictor') },
    { id: 'tomas', name: 'Tomás Quiroga', look: 'tomas', x: -18.2, z: 17.8, yaw: -Math.PI / 2, wander: 0.4, talk: 'tomas',
      when: (S) => at(S, 'bcReport', 'bcCourse', 'bcRations') || (at(S, 'bcVictor') && !S.flag('tomas:reported')) },
    { id: 'victorIdle', name: 'Víctor Díaz López', look: 'victor', x: 19.5, z: -4.5, yaw: -Math.PI / 2, wander: 0, talk: 'victorIdle', when: (S) => at(S, 'bcReport', 'bcRations') },
    { id: 'rc1', name: 'Recruit', look: 'recruit', x: -9, z: 0, yaw: 1, wander: 5, lines: ['Six weeks, they said. Six weeks and you are a man.', '…My feet are bleeding.'], when: (S) => at(S, 'bcReport', 'bcCourse', 'bcRations', 'bcVictor') },
    { id: 'rc2', name: 'Recruit', look: 'bigRecruit', x: 12, z: 16, yaw: 3, wander: 5, lines: ['Stay away from Díaz López. His uncle is a colonel.'], when: (S) => at(S, 'bcReport', 'bcCourse', 'bcRations', 'bcVictor') },
    { id: 'rc3', name: 'Recruit', look: 'recruit', x: -6, z: 22, yaw: 2, wander: 4, lines: ['Is it true you are from the cerros? You don’t talk like it.'], when: (S) => at(S, 'bcReport', 'bcCourse', 'bcRations', 'bcVictor') },
  );
  L.triggers.push({ id: 'behind', event: 'bc:behind', minX: -40, maxX: -34, minZ: -9, maxZ: 21, when: (S) => S.at('bcVictor') });
  L.dangers.push({ id: 'bcVictor', name: 'Behind the Barracks', minX: -40, maxX: -33.2, minZ: -10, maxZ: 22, when: (S) => S.at('bcFight'),
    speaker: 'Víctor Díaz López', loseMsg: 'Víctor and his friends left you in the dirt behind the barracks. The sergeant found you at dawn.',
    thugs: [{ look: 'victor', x: -36.6, z: 4.6, yaw: Math.PI }, { look: 'bigRecruit', x: -38, z: 6.6, yaw: Math.PI }, { look: 'recruit', x: -35.2, z: 7, yaw: Math.PI }],
    barks: ['¡Ahora, cerro! Let’s see if you bleed like the rest of them.'], reward: 0 });
  L.spawns.yard = { x: 2, z: 14, yaw: Math.PI };
  L.spawns.default = L.spawns.yard;
  L.finalize();
  return L;
}

// ================================================================ HOUSE 2 (Santiago, 1981)
function buildHouse2() {
  seedRandom(81);
  const L = prep(new Loc('house2', "Emilio's House", { bounds: { minX: -4, maxX: 4, minZ: -3, maxZ: 3 }, interior: true, env: IN('warm'), camMax: 2.8 }));
  L.region = 'Santiago · 1981';
  room(L, { w: 8, d: 6, h: 2.7, floor: std({ map: withRepeat(TEX2.planks, 3, 2), roughness: 0.9 }), wall: std({ map: withRepeat(TEX2.cleanWall, 3, 1), roughness: 0.95 }),
    ceiling: '#d0c8b4', doorW: 1.1, lights: [[0, -0.5]], lightPower: 11, windowAt: [-1.5, 1.6, 1.0, 0.7, 'back'] });
  bed(L, -2.9, -1.9, { blanket: '#4f5638', neat: true });
  table(L, 2.6, -2.2, 1.3, 0.75, '#5a4430');
  chair(L, 2.6, -1.4, Math.PI, '#5a4430');
  chair(L, 1.55, -2.2, Math.PI / 2, '#5a4430');   // Mateo's chair, later
  mesh(box(0.35, 0.03, 0.26), mat('#3a2a1c', 0.6), L.root, 2.3, 0.79, -2.2);   // ledger
  // Stove and pot, wardrobe, uniform on a hook
  mesh(box(0.9, 0.85, 0.6), mat('#e8e2d2', 0.5, 0.2), L.root, 3.4, 0.43, 1.2);
  mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.18, 12), mat('#8a8a8a', 0.4, 0.6), L.root, 3.3, 0.95, 1.2);
  L.addBox(3.4, 1.2, 0.9, 0.6);
  mesh(box(1.1, 2.0, 0.55), mat('#5a4430', 0.8), L.root, -3.4, 1.0, 1.4); L.addBox(-3.4, 1.4, 0.6, 1.1);
  framedPicture(L, -1.6, 1.7, -2.96, 0, portraitTexture('#6a5a4a', '#7a4a5a', '#9a6844'), 0.4, 0.5);
  corkBoard(L, 0.9, 1.6, -2.96, 0);
  // Service ID (pickup)
  const id = new THREE.Group(); id.userData.dynamic = true;
  mesh(box(0.12, 0.02, 0.08), mat('#c9b48a', 0.6), id, 0, 0.01, 0);
  id.position.set(2.85, 0.79, -2.0); L.root.add(id);

  const gun = new THREE.Group(); gun.userData.dynamic = true;
  gun.add(createPistol()); gun.rotation.set(0, 0.6, Math.PI / 2); gun.position.set(-2.9, 0.62, -0.75); L.root.add(gun);
  L.interactables.push(
    { type: 'pickup', x: -2.2, z: -0.8, r: 1.0, label: 'Take your service pistol', item: 'pistol', mesh: gun, when: (S) => !S.past('resign') },
    { type: 'pickup', x: 2.85, z: -1.6, r: 1.1, label: 'Take your service ID', item: 'idcard', mesh: id },
    { type: 'use', x: 2.2, z: -1.6, r: 1.0, label: 'Read the savings ledger', event: 'ledger' },
    { type: 'use', x: 0.9, z: -2.2, r: 1.2, label: 'Plan the laundering front', event: 'plan_board', when: (S) => S.at('launder') },
    { type: 'door', x: 0, z: 2.6, r: 1.1, label: 'Go outside', to: 'santiago', spawn: 'home', requires: 'idcard', lockedMsg: "My service ID. They won't let a general in without it — not even me." },
  );
  L.storyNpcs.push(
    { id: 'mateoHome', name: 'Mateo Zagal', look: 'mateo', x: -0.5, z: 0.4, yaw: Math.PI, wander: 0.6, talk: 'mateoPlan', when: (S) => S.at('plan') || S.at('launder') },
  );
  L.spawns.bed = { x: -1.8, z: -1.0, yaw: Math.PI / 2 };
  L.spawns.door = { x: 0, z: 1.8, yaw: Math.PI };
  L.spawns.table = { x: 2.4, z: -0.7, yaw: Math.PI };
  L.spawns.default = L.spawns.bed;
  L.finalize();
  return L;
}

// ================================================================ SANTIAGO (1981)
function buildSantiago() {
  seedRandom(1981);
  const L = prep(new Loc('santiago', 'Barrio Yungay', { bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 72 }, env: OUT('day'), pedCount: 10, camMax: 9 }));
  L.region = 'Santiago · 1981';
  L.pedLines = 'santiago';
  ground(L, TEX.concrete, 120);
  road(L, 0, 10, 124, false, 10);                 // Avenida Ricardo Cumming
  road(L, 0, 20, 100, true, 8);                   // Calle Agustinas
  road(L, -25, 55, 50, true, 6);                  // Pasaje Lucrecia
  road(L, 0, -58, 120, true, 10);                 // in front of the facility
  L.zones.push(
    { name: 'Pasaje Lucrecia', minX: -50, maxX: -5, minZ: 51, maxZ: 72 },
    { name: 'Calle Agustinas', minX: -50, maxX: 50, minZ: 16, maxZ: 24 },
    { name: 'Centro de Investigación Militar', minX: -50, maxX: 50, minZ: -50, maxZ: -38 },
    { name: 'Avenida Ricardo Cumming', minX: -5, maxX: 5, minZ: -50, maxZ: 72 },
  );
  // Emilio's small house on the pasaje
  const h = house(L, { x: -22, z: 63, w: 10, d: 7, color: '#c8b89a', roof: '#6a5a4a', face: '-z', garage: false });
  // Neighbors along the pasaje
  house(L, { x: -38, z: 63, w: 9, d: 7, color: '#b8a88a', roof: '#5a4a3a', face: '-z', garage: false });
  building(L, { x: -12, z: 66, w: 8, d: 10, h: 5, color: '#a9a090', face: '-z', door: false });
  building(L, { x: -25, z: 44, w: 38, d: 10, h: 7, color: '#b9ab92', face: '+z', door: false });
  // Blocks along the avenue
  const shops = [['PANADERÍA', '#c9a27a', 'BAKERY'], ['FARMACIA', '#a9b8c2', 'PHARMACY'], ['ALMACÉN', '#d8cdb5', 'GROCERY'], ['ZAPATERÍA', '#b5a58f', 'SHOEMAKER'], ['SASTRERÍA', '#c2b49a', 'TAILOR'], ['CAFÉ', '#bfa58a', 'COFFEE']];
  let i = 0;
  for (const side of [-1, 1]) {
    for (const [z0, z1] of [[-36, 14], [26, 50]]) {
      if (side === -1 && z0 === 26) continue;
      const n = Math.round((z1 - z0) / 12);
      const step = (z1 - z0) / n;
      for (let k = 0; k < n; k++) {
        const [name, color, en] = shops[i++ % shops.length];
        const zc = z0 + step * (k + 0.5);
        building(L, { x: side * 17, z: zc, w: 16, d: step - 0.4, h: rr(6, 11), color, face: side < 0 ? '+x' : '-x', variant: 'shop',
          sign: name, signSub: en, signBg: '#2a2a2a', signFg: '#f2e2b0', signWidth: 7, signY: 3.6, signOut: 0.1, accent: pick(['#7a3a2a', '#2a4a6a', '#3a5a3a']) });
      }
    }
  }
  building(L, { x: 39, z: 38, w: 28, d: 22, h: 8, color: '#b8ac98', face: '-z', door: false });
  building(L, { x: 39, z: 63, w: 28, d: 16, h: 6, color: '#a99f8d', face: '-z', door: false });
  building(L, { x: -37, z: 0, w: 24, d: 30, h: 7, color: '#c4b69c', face: '+x', door: false });
  for (const z of [-30, -6, 34, 48]) { streetlight(L, -5.6, z, Math.PI / 2); streetlight(L, 5.6, z + 8, -Math.PI / 2); }
  for (const z of [-28, -12, 4, 34, 46]) tree(L, (z > 30 ? 1 : -1) * 7.6, z, 0.75);
  parkCar(L, 3.6, 40, 0, '#3a4a5a'); parkCar(L, -3.6, -20, Math.PI, '#8a7a5a');
  parkCar(L, -3.6, 2, Math.PI, '#2f3a2a', 'police');
  // Newspaper kiosk & empanada cart
  const kiosk = new THREE.Group();
  mesh(box(2.2, 2.3, 1.6), mat('#2f5a3a', 0.7), kiosk, 0, 1.15, 0);
  const ks = new THREE.Mesh(box(2.2, 0.5, 0.08), signMaterials(signTexture('"MILAGRO ECONÓMICO"', '#f4f0dc', '#1a1a1a', '"ECONOMIC MIRACLE" — EL MERCURIO'), '#f4f0dc', 0.2));
  ks.position.set(0, 2.6, 0.82); kiosk.add(ks);
  kiosk.position.set(-6.6, 0, 26); L.root.add(kiosk); L.addBox(-6.6, 26, 2.2, 1.6);
  const cart = new THREE.Group();
  mesh(box(1.6, 0.9, 0.9), mat('#c0392b', 0.6), cart, 0, 0.75, 0);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12).rotateX(Math.PI / 2), mat('#1a1a1a'), cart, 0.6, 0.3, 0.5);
  mesh(new THREE.ConeGeometry(1.2, 0.5, 8), mat('#f2e8c8', 0.8), cart, 0, 2.2, 0);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), mat('#888'), cart, 0, 1.6, 0);
  cart.position.set(6.6, 0, 31); L.root.add(cart); L.addBox(6.6, 31, 1.6, 0.9);

  // The military facility compound (north)
  building(L, { x: 0, z: -66, w: 46, d: 18, h: 9, color: '#9aa09a', roof: '#5a5f5a', face: '+z', variant: 'slit', door: false,
    sign: 'CENTRO DE INVESTIGACIÓN MILITAR', signBg: '#3a3f35', signFg: '#e8e2c8', signSub: 'MILITARY RESEARCH CENTER', signWidth: 20, signY: 7.6, signOut: 0.1 });
  const wall = mat('#8a8f88', 0.95);
  for (const [x0, x1] of [[-50, -4], [4, 50]]) {
    const w = x1 - x0;
    mesh(box(w, 2.6, 0.5), wall, L.root, (x0 + x1) / 2, 1.3, -50, true);
    L.addBox((x0 + x1) / 2, -50, w, 0.5);
    fence(L, x0, -50, x1, -50, { h: 3.4, barbed: true });
  }
  // Gate: barrier arm and guard booth
  mesh(box(8, 0.12, 0.12), mat('#d23a2a', 0.5), L.root, 0, 1.1, -50);
  for (let x = -3.5; x <= 3.5; x += 1) mesh(box(0.5, 0.13, 0.13), mat('#f2f2ee', 0.5), L.root, x, 1.1, -50, false);
  L.addBox(0, -50, 8, 0.4);
  const gb = new THREE.Group();
  mesh(box(2, 2.6, 2), mat('#d8d4c8', 0.8), gb, 0, 1.3, 0);
  mesh(box(1.6, 0.8, 0.05), std({ color: '#1c2a35', roughness: 0.1 }), gb, 0, 1.7, 1.01);
  mesh(box(2.3, 0.15, 2.3), mat('#5d6447', 0.6), gb, 0, 2.7, 0);
  gb.position.set(6.5, 0, -47.5); L.root.add(gb); L.addBox(6.5, -47.5, 2, 2);
  flagPole(L, -8, -46, chileFlagTexture(), 10);
  militaryTruck(L, -20, -44, Math.PI / 2);
  // Backdrop: the Andes rising over the city, and more city in every direction
  andes(L, 0, 10, 1, 0, 1300, 430);
  skyline(L, 0, 10, 85, 260, 90, { hMin: 8, hMax: 34, avoid: (x, z) => Math.abs(x) < 62 && z > -95 && z < 85 });
  const cerro = mesh(new THREE.SphereGeometry(70, 12, 8), std({ color: '#7f8a4a', roughness: 1, flatShading: true }), L.root, -230, -20, 60, false);
  cerro.scale.y = 0.55;   // Cerro San Cristóbal-style hill
  mesh(new THREE.CylinderGeometry(0.8, 1.2, 14, 8), mat('#f2f2ee', 0.6), L.root, -230, 26, 60, false);

  // Any route to the gate crosses this band in front of the facility.
  L.triggers.push({ id: 'chase', event: 'chase', minX: -50, maxX: 50, minZ: -40, maxZ: -35, when: (S) => S.at('walkFacility') });

  // Market on Calle Agustinas (east): two stalls, thieves during the 'crime' objective
  const stall = (x, z, color) => {
    table(L, x, z, 2.4, 1.0, '#7a5a3a', 0.85);
    for (const sx of [-1.1, 1.1]) mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), mat('#5a4430', 0.9), L.root, x + sx, 1.2, z - 0.45);
    const awn = mesh(box(2.8, 0.06, 1.6), mat(color, 0.9), L.root, x, 2.35, z + 0.05);
    awn.rotation.x = 0.15;
    for (let k = 0; k < 7; k++) mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(pick(['#e8a030', '#c0392b', '#7fa04c', '#e8d23a']), 0.6), L.root, x - 0.9 + k * 0.3, 0.95, z + rr(-0.2, 0.2), false);
    crate(L, x + 1.6, z - 0.2, 0.6);
  };
  stall(30, 10.5, '#c0392b'); stall(37, 10.5, '#2e86c1');
  L.zones.push({ name: 'Mercado Agustinas', minX: 24, maxX: 44, minZ: 6, maxZ: 16 });
  L.dangers.push({ id: 'market', name: 'Mercado Agustinas', minX: 25, maxX: 42, minZ: 7, maxZ: 17.5, when: (S) => S.at('crime'),
    thugs: [{ look: 'thug', x: 31, z: 12.4, yaw: 0, weapon: 'knife' }, { look: 'thug2', x: 33.5, z: 13.0, yaw: -0.4 }, { look: 'rioter', x: 36, z: 12.6, yaw: 0.3 }],
    barks: ['¡Mira, un militar! Get him before he calls the others!', 'Walk away, General. This is not your business.'], reward: 0 });
  L.interactables.push(
    { type: 'door', x: h.door.x, z: h.door.z + 0.8, r: 1.6, label: 'Go inside', to: 'house2', spawn: 'door' },
    { type: 'use', x: 0, z: -48.3, r: 2.4, label: 'Show your ID at the gate', event: 'gate', requires: 'idcard', lockedMsg: 'No ID, no entry.', when: (S) => S.at('gate') },
    // His workplace: open to the General whenever he's carrying his ID.
    { type: 'door', x: 0, z: -48.3, r: 2.4, label: 'Enter the Centro de Investigación Militar', to: 'facility', spawn: 'entry', requires: 'idcard',
      lockedMsg: 'No ID, no entry.', when: (S) => S.past('getId') && !S.at('gate') && !S.past('resign') },
  );
  L.storyNpcs.push(
    { id: 'ernesto', name: 'Don Ernesto · Bakery', look: 'shopkeeper', x: -8.1, z: -29.75, yaw: Math.PI / 2, wander: 0, talk: 'ernesto', when: (S) => S.past('getId') },
    { id: 'ines', name: 'Señora Inés · Pharmacy', look: 'pharmacist', x: -8.1, z: -17.25, yaw: Math.PI / 2, wander: 0, talk: 'ines', when: (S) => S.past('getId') },
    { id: 'jacobo', name: 'Don Jacobo · Shoemaker', look: 'cobbler', x: 8.1, z: 44, yaw: -Math.PI / 2, wander: 0, talk: 'jacobo', when: (S) => S.past('getId') },
    { id: 'marta', name: 'Señora Marta', look: 'marketWoman', x: 33.5, z: 9.4, yaw: 0, wander: 0, pose: 'handsUp',
      lines: ['¡Ayúdenme! They are taking everything!'], when: (S) => S.at('crime') },
    { id: 'vendor', name: 'Don Lucho', look: 'vendor', x: 6.6, z: 32.4, yaw: Math.PI, wander: 0, talk: 'empanada' },
    { id: 'shoeshine', name: 'Lustrabotas (Shoeshine boy)', look: 'shoeshine', x: -6.4, z: -8, yaw: Math.PI / 2, wander: 1, talk: 'shoeshine' },
    { id: 'gateGuard', name: 'Gate Guard', look: 'soldier', x: 4.4, z: -47.6, yaw: 0, wander: 0, lines: ['Mi General. ID, please — regulations.'] },
    { id: 'gateGuard2', name: 'Soldier', look: 'soldier', x: -4.6, z: -48, yaw: 0, wander: 0, lines: ['…'] },
  );
  L.spawns.home = { x: h.door.x, z: h.door.z - 0.8, yaw: Math.PI };
  L.spawns.gate = { x: 0, z: -46, yaw: 0 };
  L.spawns.default = L.spawns.home;
  L.finalize();
  return L;
}

// ================================================================ FACILITY interior
function buildFacility() {
  seedRandom(1982);
  const L = prep(new Loc('facility', 'Centro de Investigación Militar', { bounds: { minX: -13, maxX: 13, minZ: -8, maxZ: 8 }, interior: true, env: IN('cold'), camMax: 3.2 }));
  L.region = 'Santiago · 1981';
  const wallM = std({ map: withRepeat(TEX2.institution, 8, 1), roughness: 0.9 });
  room(L, { w: 26, d: 16, h: 3.4, floor: std({ map: withRepeat(TEX2.lino, 13, 8), roughness: 0.6 }), wall: wallM, ceiling: '#e8e8e2', doorW: 1.8,
    lights: [[0, 5], [0, -4], [-9, -4.5], [9, -4.5], [-9, 4.5], [9, 4.5]], lightColor: '#eaf2ff', lightPower: 12 });
  // Rooms: office (NW), lab (NE), clinic (SW), records (SE)
  partition(L, -13, -1, -5, -1, 3.4, wallM, -9);
  partition(L, -5, -8, -5, -1, 3.4, wallM);
  partition(L, 5, -1, 13, -1, 3.4, wallM, 9);
  partition(L, 5, -8, 5, -1, 3.4, wallM);
  partition(L, -13, 1, -5, 1, 3.4, wallM, -9);
  partition(L, -5, 1, -5, 8, 3.4, wallM);
  partition(L, 5, 1, 13, 1, 3.4, wallM, 9);
  partition(L, 5, 1, 5, 8, 3.4, wallM);
  L.zones.push(
    { name: "General's Office", minX: -13, maxX: -5, minZ: -8, maxZ: -1 },
    { name: 'Chemistry Lab', minX: 5, maxX: 13, minZ: -8, maxZ: -1 },
    { name: 'Infirmary', minX: -13, maxX: -5, minZ: 1, maxZ: 8 },
    { name: 'Records', minX: 5, maxX: 13, minZ: 1, maxZ: 8 },
    { name: 'Main Hall', minX: -13, maxX: 13, minZ: -8, maxZ: 8 },
  );
  // Office
  table(L, -9, -5.6, 2.2, 1.0, '#4a3420', 0.78);
  chair(L, -9, -6.5, 0, '#2a2018');
  chair(L, -9.5, -4.4, Math.PI, '#4a3420'); chair(L, -8.5, -4.4, Math.PI, '#4a3420');
  mesh(box(0.35, 0.03, 0.26), mat('#f4f0dc', 0.8), L.root, -9.3, 0.81, -5.6);
  mesh(box(0.2, 0.12, 0.25), mat('#1a1a1a', 0.5), L.root, -8.4, 0.86, -5.8);
  framedPicture(L, -9, 2.2, -7.96, 0, portraitTexture('#2a3a4a'), 0.7, 0.9);
  flagPole(L, -12, -7, chileFlagTexture(), 2.6).scale.setScalar(0.5);
  shelf(L, -12.7, -3.5, 2.2, Math.PI / 2, '#4a3420');
  // Lab: benches, glassware, fume hood
  const labBench = (x, z, w, d) => {
    mesh(box(w, 0.92, d), mat('#3a3a3a', 0.6), L.root, x, 0.46, z);
    mesh(box(w + 0.05, 0.05, d + 0.05), mat('#1a1a1a', 0.3), L.root, x, 0.94, z);
    L.addBox(x, z, w, d);
  };
  labBench(9, -4.2, 4.5, 1.0); labBench(12.4, -4.5, 1.0, 5.4);
  const glassCols = ['#7fd0ea', '#9ae07a', '#e0d27a', '#d0a0f0'];
  for (let k = 0; k < 12; k++) {
    const gx = 7.2 + rr(0, 3.6), gz = -4.2 + rr(-0.3, 0.3);
    const c = pick(glassCols);
    mesh(new THREE.CylinderGeometry(rr(0.04, 0.08), rr(0.06, 0.1), rr(0.15, 0.35), 10), std({ color: c, transparent: true, opacity: 0.75, roughness: 0.05, emissive: c, emissiveIntensity: 0.25 }), L.root, gx, 1.08, gz, false);
  }
  mesh(box(2.2, 1.4, 0.9), mat('#c8ccc6', 0.4, 0.3), L.root, 9, 2.2, -7.5);
  mesh(box(2.2, 0.9, 0.9), mat('#3a3a3a', 0.6), L.root, 9, 0.45, -7.5); L.addBox(9, -7.5, 2.2, 0.9);
  // Infirmary
  bed(L, -11.8, 4.6, { blanket: '#d8dcd6', frame: '#c8ccc6', neat: true });
  table(L, -7, 6.5, 1.4, 0.8, '#c8ccc6');
  chair(L, -7, 7.2, Math.PI, '#5a5a5a');
  shelf(L, -12.7, 2.2, 1.6, Math.PI / 2, '#c8ccc6');
  // Records
  for (const z of [3, 5, 7]) shelf(L, 9, z, 6, 0, '#5a5a52');
  // Hall: bench, plant, notice board
  bench(L, -3.5, 7.5, Math.PI);
  flat(1.8, 5, mat('#6a2430', 0.9), L.root, 0, 0.02, 4);

  L.interactables.push(
    { type: 'door', x: 0, z: 7.6, r: 1.4, label: 'Exit', to: 'santiago', spawn: 'gate' },
    { type: 'use', x: -9, z: -5.1, r: 1.7, label: 'Sit at your desk', event: 'desk', when: (S) => S.at('office') },
  );
  L.storyNpcs.push(
    { id: 'aide', name: 'Teniente Rojas', look: 'aide', x: -6.2, z: -2.4, yaw: Math.PI, wander: 0.5,
      lines: ['Mi General.', 'Nothing urgent on your desk — except the usual requisitions.'], when: (S) => !S.past('bribe') },
    { id: 'guardIn', name: 'Sentry', look: 'soldier', x: 2, z: 6.8, yaw: Math.PI, wander: 0, lines: ['Mi General!'] },
    { id: 'chemist1', name: 'Dr. Vial', look: 'scientist', x: 8.2, z: -3.3, yaw: Math.PI, wander: 0.4, lines: ['The batch is stable, General. The street will not know the difference.'], when: (S) => !S.at('findMateo') },
    { id: 'mateoLab', name: 'Mateo Zagal', look: 'mateo', x: 11.7, z: -6.6, yaw: -2.4, wander: 0, lines: ['…'], when: (S) => S.at('findMateo') },
    { id: 'doctor', name: 'Dr. Herrera', look: 'doctor', x: -7, z: 5.6, yaw: 0, wander: 0.4, talk: 'doctor', when: (S) => S.at('bribe') },
    { id: 'clerkRec', name: 'Archivist', look: 'aide', x: 7, z: 4, yaw: Math.PI / 2, wander: 1, lines: ['Every order since ’73 is filed here, General. Every single one.'] },
  );
  L.triggers.push({ id: 'labEnter', event: 'lab', minX: 5.5, maxX: 13, minZ: -8, maxZ: -1.2, when: (S) => S.at('findMateo') });
  L.spawns.entry = { x: 0, z: 6.4, yaw: Math.PI };
  L.spawns.office = { x: -9, z: -3.6, yaw: Math.PI };
  L.spawns.entry2 = { x: 0, z: 4.6, yaw: Math.PI };
  L.spawns.default = L.spawns.entry;
  L.finalize();
  return L;
}

// ================================================================ LOS POLLOS (Santiago) + riot variant
function buildPollosStreet(riot) {
  seedRandom(riot ? 1986 : 1984);
  const id = riot ? 'riot' : 'pollos';
  const L = prep(new Loc(id, riot ? 'Avenida Matta — Night of the Protests' : 'Avenida Matta', {
    bounds: riot ? { minX: -14, maxX: 14, minZ: -95, maxZ: 26 } : { minX: -80, maxX: 80, minZ: -20, maxZ: 26 },
    env: OUT(riot ? 'night' : 'day'), pedCount: riot ? 0 : 16, camMax: 8 }));
  L.region = riot ? 'Santiago · 1986' : 'Santiago · 1984';
  L.pedLines = riot ? 'riot' : 'santiago';
  ground(L, TEX.concrete, 80);
  road(L, 0, 0, 260, true, 10);
  road(L, 0, -40, 140, false, 9);
  andes(L, 0, -20, 1, 0, 1300, 430);
  skyline(L, 0, -30, 70, 240, 80, { hMin: 8, hMax: 36, avoid: (x, z) => Math.abs(x) < 40 && z > -110 && z < 40 });
  // Los Pollos Hermanos storefront
  building(L, { x: 0, z: 14, w: 16, d: 10, h: 5, color: '#f2e6c4', roof: '#b52a1c', face: '-z', variant: 'shop', door: true, doorColor: '#7a3a1a', accent: '#b52a1c',
    sign: 'LOS POLLOS HERMANOS', signBg: '#f4c23b', signFg: '#b52a1c', signSub: 'THE CHICKEN BROTHERS · SANTIAGO', signWidth: 10, signY: 6.2, signOut: -0.2 });
  for (const [x, c] of [[-22, '#c9a27a'], [22, '#a9b8c2']]) building(L, { x, z: 14, w: 22, d: 10, h: 7, color: c, face: '-z', variant: 'shop', door: false });
  if (!riot) for (const x of [-22, 0, 22]) building(L, { x, z: -14, w: 20, d: 8, h: 8, color: pick(['#b8ac98', '#c4b69c', '#a99f8d']), face: '+z', door: false });
  if (!riot) {
    for (const x of [-6, -3, 3, 6]) { table(L, x, 7.6, 0.9, 0.9, '#f2efe6', 0.72); }
    parkCar(L, -12, 3.2, Math.PI / 2, '#3a4a5a');
    streetlight(L, -15, 5.5, Math.PI); streetlight(L, 15, 5.5, Math.PI);
    // The rest of Avenida Matta: shops both ways, a warehouse at the east end
    const shopsN = [[-45, 20, 'SASTRERÍA', 'TAILOR', '#c2b49a'], [45, 20, 'DENTISTA', 'DENTIST', '#a9b8c2'], [-68.5, 21, 'ESCUELA', 'SCHOOL', '#d8cdb5']];
    for (const [x, w, name, en, c] of shopsN) building(L, { x, z: 14, w, d: 10, h: rr(6, 9), color: c, face: '-z', variant: 'shop',
      sign: name, signSub: en, signBg: '#2a2a2a', signFg: '#f2e2b0', signWidth: 7, signY: 3.6, signOut: 0.1, accent: pick(['#7a3a2a', '#2a4a6a', '#3a5a3a']) });
    building(L, { x: 68.5, z: 14, w: 21, d: 10, h: 7, color: '#8a8478', roof: '#5a5650', face: '-z', variant: 'slit', door: true, doorColor: '#3a3a3a', accent: '#5a5650',
      sign: 'BODEGA SAN PABLO', signSub: 'WAREHOUSE', signBg: '#3a3a3a', signFg: '#e8e2c8', signWidth: 9, signY: 5.4, signOut: 0.1 });
    for (const [x, name, en, c] of [[-44, 'TALLER', 'GARAGE', '#b5a58f'], [44, 'FERRETERÍA', 'HARDWARE', '#c4b69c'], [-67, 'BOTILLERÍA', 'LIQUOR STORE', '#a99f8d'], [67, 'PELUQUERÍA', 'BARBER', '#bfa58a']]) {
      building(L, { x, z: -14, w: 20, d: 8, h: rr(6, 10), color: c, face: '+z', variant: 'shop',
        sign: name, signSub: en, signBg: '#2a2a2a', signFg: '#f2e2b0', signWidth: 7, signY: 3.6, signOut: 0.1, accent: pick(['#7a3a2a', '#2a4a6a', '#3a5a3a']) });
    }
    for (const x of [-62, -40, 40, 62]) streetlight(L, x, 5.5, Math.PI);
    parkCar(L, 52, -3.4, Math.PI / 2, '#8a3a2a'); parkCar(L, -56, 3.4, -Math.PI / 2, '#6a6a5a');
    mesh(box(1.2, 1.2, 1.2), mat('#7a6a4a', 0.9), L.root, 62, 0.6, 8.0); L.addBox(62, 8.0, 1.2, 1.2);
    for (const [x, z, w, d] of [[58, -6.2, 2.4, 1.1], [63, 2.6, 1.2, 2.4], [70.5, -1.5, 2.6, 1.2], [76, 4.5, 1.2, 2.2], [66, -7.5, 1.2, 1.2]]) cover(L, x, z, w, d);
    L.zones.push({ name: 'Bodega San Pablo', minX: 56, maxX: 80, minZ: -5, maxZ: 26 }, { name: 'Avenida Matta', minX: -80, maxX: 80, minZ: -20, maxZ: 26 });
    L.interactables.push({ type: 'use', x: 68.5, z: 8.0, r: 1.8, label: 'Load Mateo’s chemical drums', event: 'chemicals', when: (S) => S.at('pSupply') });
    L.dangers.push({ id: 'choros', name: 'Avenida Matta', minX: 26, maxX: 40, minZ: -10, maxZ: 9, when: (S) => S.at('pAmbush'), speaker: 'Los Choros',
      loseMsg: 'Los Choros left you bleeding on Avenida Matta — and took the drums.',
      thugs: [{ look: 'thug', x: 31, z: -2.5, yaw: Math.PI / 2, weapon: 'knife' }, { look: 'thug2', x: 33, z: 2, yaw: Math.PI / 2 }, { look: 'rioter', x: 29.5, z: 4.5, yaw: Math.PI / 2 }],
      barks: ['Nice drums, chicken man. Whatever is in them is ours now.', 'Los Choros run this avenue. Put them down.'], reward: 0 });
    L.storyNpcs.push({ id: 'mateoStreet', name: 'Mateo', look: 'max', x: 4, z: 6.6, yaw: Math.PI, wander: 0.4, talk: 'mateoSupply',
      when: (S) => S.at('pSupply') || S.at('pAmbush') });
    L.interactables.push({ type: 'door', x: 0, z: 8.6, r: 1.6, label: 'Enter Los Pollos Hermanos', to: 'pollosIn', spawn: 'entry' });
    L.spawns.street = { x: -10, z: 0, yaw: 0.6 };
    L.spawns.door = { x: 0, z: 7.4, yaw: Math.PI };
    L.spawns.bodega = { x: 68.5, z: 6.4, yaw: -Math.PI / 2 };
    L.spawns.default = L.spawns.street;
  } else {
    // A long escape north through burning streets to Schuler's car.
    for (let z = -30; z >= -90; z -= 14) {
      building(L, { x: -16, z, w: 12, d: 12.5, h: rr(6, 10), color: pick(['#8a8478', '#7a7468', '#948a7a']), face: '+x', door: false });
      building(L, { x: 16, z, w: 12, d: 12.5, h: rr(6, 10), color: pick(['#8a8478', '#7a7468', '#948a7a']), face: '-x', door: false });
    }
    flat(12, 60, std({ color: '#2a2a2a', roughness: 1 }), L.root, -16, 0.01, -60);
    barricade(L, 6, -24, 8);
    barricade(L, -5.5, -50, 7);
    barricade(L, 5, -72, 8);
    burntCar(L, -3.5, -24.5, 0.2);
    burntCar(L, 4.5, -50, Math.PI / 2 + 0.3);
    for (const [i, [x, z]] of [[-6, 3], [8, -2], [-2.5, -30], [7.5, -36], [-7.5, -60], [2, -64], [-6, -80]].entries()) barrelFire(L, x, z, i % 2 === 0);
    for (let k = 0; k < 40; k++) trash(L, rr(-9, 9), rr(-90, 20), 1, 0.2);
    for (const z of [-20, -45, -70]) lampPost(L, -9, z, z === -45);
    // Schuler's car at the far end
    const car = createCar('#1a1a1e', 'sedan');
    car.position.set(0, 0, -88); L.root.add(car);
    L.addBox(0, -88, 2.0, 4.5);
    contactShadow(L.root, 0, -88, 1.6, 4.0, 0, 0.9);
    L.interactables.push({ type: 'use', x: 0, z: -84.6, r: 2.2, label: "Get in Schuler's car", event: 'car' });
    for (const [x, z, w, d] of [[-4.5, -76.5, 2.6, 1.0], [4, -79, 2.2, 1.0], [-1, -73.5, 1.6, 1.0]]) cover(L, x, z, w, d, 1.2, '#7a7468');
    L.dangers.push(
      { id: 'mobA', name: 'Avenida Matta', minX: -9, maxX: 9, minZ: -40, maxZ: -30,
        thugs: [{ look: 'rioter', x: -2, z: -34, yaw: 0 }, { look: 'thug2', x: 2, z: -36, yaw: 0, weapon: 'knife' }, { look: 'rioter', x: 5, z: -33, yaw: 0 }],
        barks: ['¡Es el General! The butcher from the facility!', '¡Agárrenlo! Blood for blood!'], reward: 0 },
      { id: 'mobB', name: 'Avenida Matta', minX: -9, maxX: 9, minZ: -68, maxZ: -56,
        thugs: [{ look: 'rioter', x: 1, z: -62, yaw: 0 }, { look: 'rioter', x: -3, z: -60, yaw: 0 }],
        barks: ['There he is — the General and his chemist!', 'No more hiding, Gonzalez!'], reward: 0 },
      { id: 'cni', name: 'Avenida Matta', minX: -9, maxX: 9, minZ: -86, maxZ: -71, guns: true, noEscape: true, speaker: 'CNI agent',
        loseMsg: 'The CNI agents brought you down twenty metres from Schuler\u2019s car.',
        thugs: [{ look: 'cni', x: -5.5, z: -81, yaw: 0 }, { look: 'cni', x: 5, z: -83, yaw: 0 }, { look: 'cni', x: 6.5, z: -86.5, yaw: 0 }],
        barks: ['¡CNI! Gonzalez — Zagal — on the ground, now!', 'Víctor Díaz López sends his regards, General.'], reward: 0 },
    );
    L.zones.push({ name: 'Avenida Matta', minX: -14, maxX: 14, minZ: -95, maxZ: 26 });
    L.storyNpcs.push({ id: 'mateoRiot', name: 'Mateo', look: 'max', x: 0.5, z: 7.5, yaw: Math.PI, wander: 0, follower: true,
      lines: ['Keep moving, Emilio! Schuler said north, past the barricades!', 'They know our faces. Don’t stop!'] });
    L.spawns.street = { x: -1.5, z: 6.5, yaw: Math.PI };
    L.spawns.default = L.spawns.street;
  }
  L.finalize();
  return L;
}

function buildPollosInside() {
  seedRandom(1985);
  const L = prep(new Loc('pollosIn', 'Los Pollos Hermanos', { bounds: { minX: -7, maxX: 7, minZ: -5, maxZ: 5 }, interior: true, env: IN('warm'), camMax: 3.2 }));
  L.region = 'Santiago · 1984';
  room(L, { w: 14, d: 10, h: 3.2, floor: std({ map: withRepeat(TEX.tiles, 7, 5), roughness: 0.5 }), wall: std({ map: withRepeat(TEX2.cleanWall, 4, 1), roughness: 0.9, color: '#f2e2b8' }),
    ceiling: '#f2ecda', doorW: 1.8, lights: [[-3, -1.5], [3, -1.5], [0, 2.5]], lightPower: 12 });
  // Counter, kitchen pass, menu board
  mesh(box(7, 1.05, 0.9), mat('#b52a1c', 0.6), L.root, -1.5, 0.525, -3); L.addBox(-1.5, -3, 7, 0.9);
  mesh(box(7.1, 0.05, 1.0), mat('#f2efe6', 0.3), L.root, -1.5, 1.07, -3);
  const menu = new THREE.Mesh(box(4, 1.2, 0.05), signMaterials(signTexture('LOS POLLOS HERMANOS', '#f4c23b', '#b52a1c', 'POLLO ASADO (ROAST CHICKEN) • PAPAS (FRIES) • BEBIDAS (DRINKS)', 1024, 300), '#f4c23b', 0.3));
  menu.position.set(-1.5, 2.4, -4.95); L.root.add(menu);
  for (const [x, z] of [[-4.5, 1.5], [-1.5, 1.5], [1.5, 1.5], [4.8, -1.8], [4.8, 1.5]]) {
    table(L, x, z, 0.9, 0.9, '#f2efe6', 0.74);
    chair(L, x - 0.7, z, Math.PI / 2, '#f4c23b'); chair(L, x + 0.7, z, -Math.PI / 2, '#f4c23b');
  }
  L.interactables.push({ type: 'door', x: 0, z: 4.6, r: 1.4, label: 'Exit', to: 'pollos', spawn: 'door' });
  L.interactables.push({ type: 'use', x: -1.5, z: -4.0, r: 1.3, label: 'Take the next order', event: 'counter', when: (S) => S.at('pShift') });
  L.storyNpcs.push(
    { id: 'mateoKitchen', name: 'Mateo', look: 'max', x: -4.3, z: -4.3, yaw: 0, wander: 0.3, talk: 'mateoShift', when: (S) => S.at('pShift') },
    { id: 'mateoDinner', name: 'Mateo', look: 'max', x: -5.2, z: 1.5, yaw: Math.PI / 2, wander: 0, sit: true, talk: 'dinner', when: (S) => S.at('pDinner') },
    { id: 'peter', name: 'Peter Schuler', look: 'peter', x: 4.1, z: 1.5, yaw: Math.PI / 2, wander: 0, sit: true, lines: ['Ah — Mr. Gonzalez.'], when: (S) => S.at('meetPeter') },
    { id: 'maxCounter', name: 'Mateo', look: 'max', x: -1.5, z: -3.9, yaw: 0, wander: 0.6, lines: ['Table in the corner, Emilio. The German. He has been waiting twenty minutes.'], when: (S) => S.at('meetPeter') },
    { id: 'waiter', name: 'Waiter', look: 'waiter', x: -4.6, z: -2.0, yaw: 0, wander: 0, talk: 'waiter' },
  );
  L.triggers.push({ id: 'peterSeen', event: 'peter', minX: 2.4, maxX: 7, minZ: -1, maxZ: 3.4, when: (S) => S.at('meetPeter') });
  L.spawns.entry = { x: 0, z: 3.6, yaw: Math.PI };
  L.spawns.counter = { x: -1.5, z: -4.3, yaw: 0 };
  L.spawns.default = L.spawns.entry;
  L.finalize();
  return L;
}

// ================================================================ AIRSTRIP (cutscene set)
function buildAirstrip() {
  seedRandom(19861);
  const L = prep(new Loc('airstrip', 'Private Airstrip', { bounds: { minX: -40, maxX: 40, minZ: -300, maxZ: 300 }, env: OUT('night') }));
  L.region = 'Outside Santiago · 1986';
  ground(L, TEX.dirt, 80);
  flat(18, 600, std({ map: withRepeat(TEX.asphaltPlain, 3, 100), roughness: 0.9 }), L.root, 0, 0.02, 0);
  const lamp = std({ color: '#ffe0a0', emissive: '#ffcc66', emissiveIntensity: 2 });
  for (let z = -290; z <= 290; z += 20) for (const x of [-9.5, 9.5]) mesh(new THREE.SphereGeometry(0.15, 8, 6), lamp, L.root, x, 0.15, z, false);
  mesas(L, 30, 220, 320);
  L.finalize();
  const plane = createPlane();
  plane.userData.dynamic = true;
  L.root.add(plane);
  L.plane = plane;
  const car = createCar('#1a1a1e', 'sedan');
  car.position.set(14, 0, 8); car.rotation.y = -0.4;
  L.root.add(car);
  return L;
}

// ================================================================ HACIENDA (Mexico)
function buildHacienda() {
  seedRandom(1989);
  const L = prep(new Loc('hacienda', "Don Eladio's Hacienda", { bounds: { minX: -30, maxX: 30, minZ: -30, maxZ: 34 }, env: OUT('golden'), pedCount: 0, camMax: 8 }));
  L.region = 'Mexico · 1989';
  L.pedLines = 'mexico';
  ground(L, TEX.grass, 60);
  flat(60, 18, std({ map: withRepeat(TEX.concrete, 15, 4), roughness: 0.8, color: '#e8d8bc' }), L.root, 0, 0.02, -8);
  flat(6, 30, std({ map: withRepeat(TEX.concrete, 2, 8), roughness: 0.8, color: '#e8d8bc' }), L.root, 0, 0.02, 18);
  // Villa with arches
  const stucco = mat('#f0dcc0', 0.9), tileRoof = mat('#b0503a', 0.8);
  const villa = mesh(box(40, 7, 10), stucco, L.root, 0, 3.5, -25); L.addBox(0, -25, 40, 10); L.occluders.push(villa);
  mesh(box(41, 0.6, 11), tileRoof, L.root, 0, 7.3, -25);
  for (let x = -16; x <= 16; x += 4) {
    mesh(box(0.7, 3.2, 0.7), stucco, L.root, x, 1.6, -19.2); L.addBox(x, -19.2, 0.7, 0.7);
  }
  mesh(box(36, 0.6, 2.4), stucco, L.root, 0, 3.5, -19.5);
  mesh(box(36, 0.2, 2.4), tileRoof, L.root, 0, 3.9, -19.5);
  pool(L, 0, -7, 16, 7);
  for (const x of [-11, -9.5, 9.5, 11]) {
    mesh(box(0.8, 0.35, 2), mat('#f2efe6', 0.6), L.root, x, 0.3, -12.8); L.addBox(x, -12.8, 0.8, 2);
  }
  sunUmbrella(L, 12.9, -7, '#f2e8c8');
  sunUmbrella(L, -12.5, -3, '#f2e8c8');
  chair(L, 11.9, -7, -Math.PI / 2, '#f2efe6');
  for (const [x, z] of [[-18, -10], [18, -10], [-20, 4], [20, 4], [-6, 22], [6, 22], [-6, 12], [6, 12], [-22, 20], [22, 20]]) palm(L, x, z, rr(0.9, 1.15));
  flagPole(L, -24, -14, mexicoFlagTexture(), 9);
  // Perimeter walls & gate
  const wallM = mat('#e8d0b0', 0.95);
  for (const [x, z, w, d] of [[0, -30.5, 61, 1], [-30.5, 2, 1, 65], [30.5, 2, 1, 65], [-17, 34.5, 27, 1], [17, 34.5, 27, 1]]) {
    mesh(box(w, 2.8, d), wallM, L.root, x, 1.4, z); L.addBox(x, z, w, d);
  }
  parkCar(L, -8, 28, 0.1, '#e8e8e4', 'suv'); parkCar(L, 8, 27, -0.15, '#1a1a1e', 'suv');
  grassTufts(L, -30, 30, 0, 34, 900, '#5f8a35', (x, z) => Math.abs(x) < 3.5);
  grassTufts(L, -30, 30, -30, 0, 300, '#5f8a35', (x, z) => z > -18 && z < 1);
  mesas(L, 30, 120, 220);
  desertScatter(L, 100, 40, 110);
  L.zones.push({ name: 'Pool Terrace', minX: -30, maxX: 30, minZ: -30, maxZ: 0 }, { name: 'Entrance Drive', minX: -30, maxX: 30, minZ: 0, maxZ: 34 });
  L.storyNpcs.push(
    { id: 'eladio', name: 'Don Eladio', look: 'eladio', x: 11.9, z: -7, yaw: -Math.PI / 2, wander: 0, sit: true, lines: ['…'] },
    { id: 'hector', name: 'Hector Salamanca', look: 'hector', x: 10.6, z: -4.4, yaw: -2.6, wander: 0.4, lines: ['*stares at you, unblinking*'] },
    { id: 'guard1', name: 'Sicario (Hitman)', look: 'cartel', x: -3.5, z: 30, yaw: Math.PI, wander: 0.3, lines: ['Don Eladio is by the pool. Walk.'] },
    { id: 'guard2', name: 'Sicario (Hitman)', look: 'cartel', x: 3.5, z: 30, yaw: Math.PI, wander: 0.3, lines: ['Keep your hands where I can see them, chilenos.'] },
    { id: 'guard3', name: 'Sicario (Hitman)', look: 'cartel', x: -14, z: -14, yaw: 0.5, wander: 1, lines: ['…'] },
    { id: 'maxFollow', name: 'Max', look: 'max', x: 1.5, z: 31, yaw: Math.PI, wander: 0, lines: ['Stay calm, Gustavo. We are partners now. Equals.'], follower: true },
  );
  L.triggers.push({ id: 'poolside', event: 'eladio', minX: -22, maxX: 22, minZ: -14, maxZ: 1, when: (S) => S.at('meetEladio') });
  L.spawns.gate = { x: 0, z: 31.5, yaw: Math.PI };
  L.spawns.default = L.spawns.gate;
  L.finalize();
  return L;
}

const BUILDERS = {
  childhood: buildChildhood, room1: buildRoom1, barrio: buildBarrio, train: buildTrainSet, cuartel: buildCuartel,
  house2: buildHouse2, santiago: buildSantiago, facility: buildFacility,
  pollos: () => buildPollosStreet(false), riot: () => buildPollosStreet(true), pollosIn: buildPollosInside,
  airstrip: buildAirstrip, hacienda: buildHacienda,
};
const cache = {};
export function getLocation(id) {
  return (cache[id] ||= BUILDERS[id]());
}
