// The story of Emilio Gonzalez — who becomes Gustavo Fring.
// BEATS run in order: 'scene' beats are cutscenes (autosave afterwards),
// 'goal' beats are objectives that finish when a matching event fires.
import * as THREE from 'three';
import { createCoati, animateCoati, createFruit, createRifle, muzzleFlash } from './props.js';
import { shootingRange } from './range.js';
import { sfx } from './sfx.js';

// ================================================================ items
export const ITEMS = {
  savings: { name: 'Coffee Tin of Savings', icon: '🥫', desc: 'Every peso you have ever kept, counted twice a night. Twelve years of going without.' },
  photo: { name: 'Photo of Mamá', icon: '🖼️', desc: "Mamá in front of the shack on Cerro Barón.\n\nOn the back, in her handwriting: her recipe for pollo asado. “For when you have a kitchen of your own, mijo.”" },
  ticket: { name: 'Train Ticket', icon: '🎫', desc: 'Valparaíso → Santiago, Estación Mapocho. Third class: wooden benches, no window that opens.' },
  idcard: { name: 'Military Service ID', icon: '🪪', desc: 'GENERAL E. GONZALEZ — Ejército de Chile (Chilean Army).\nOpens every door in the Centro de Investigación Militar (Military Research Center).' },
  ledger: { name: 'Savings Ledger', icon: '📒', desc: 'Five years in uniform, written in tiny careful numbers.\n\nRent: 4.000. Bread: 12 a day. Bus: walked instead (saved 30).\nCoffee: no. Cinema: no. New shoes: resoled instead.\n\nTotal saved: $ 812.400.' },
  certificate: { name: 'Medical Certificate', icon: '📄', desc: 'Diagnosis: chronic cardiac arrhythmia. Patient unfit for service.\nSigned, Dr. A. Herrera.\n\nCost: far more than it should have.' },
  madrigal: { name: 'Madrigal Business Card', icon: '💼', desc: 'PETER SCHULER — Madrigal Electromotive GmbH, Hannover.\nOn the back, a Santiago phone number written in fountain pen.' },
  passportG: { name: 'Passport — Gustavo Fring', icon: '🛂', desc: 'Gustavo Fring. Restaurateur. The photo is yours. The life is not — yet.' },
  passportM: { name: 'Passport — Maximino Arciniega', icon: '🛂', desc: "Mateo's new life. He hates the photo." },
  elenaPurse: { name: 'Doña Elena\u2019s Purse', icon: '👛', desc: 'Black leather, worn at the clasp. Heavy with a month of pension.' },
  leaflets: { name: '¿Dónde Está? Leaflets', icon: '📃', desc: 'A grainy photo of a man taken in 1974, and three words: Where is he?\nOn the back, in your handwriting: the student\u2019s name.' },
  pistol: { name: 'Service Pistol', icon: '🔫', desc: 'Army issue. Cleaned every Sunday, fired only on the range.\nIn a gunfight: hold Right-click / Q to aim, click / F to fire, R to reload.' },
  revolver: { name: 'Mateo\u2019s Revolver', icon: '🔫', desc: 'His father\u2019s. Old, heavy, and it pulls to the left.\nIn a gunfight: hold Right-click / Q to aim, click / F to fire, R to reload.' },
  chemicals: { name: 'Chemical Drums', icon: '🛢️', desc: 'Four blue drums from Bodega San Pablo. The label says cleaning fluid. It is not cleaning fluid.' },
};

// ================================================================ food (heals HP)
export const FOODS = {
  sopaipilla: { name: 'Sopaipillas', en: 'fried pumpkin bread', icon: '🫓', heal: 25, price: 30,
    desc: 'Two sopaipillas from Doña Carmen\u2019s cart, still warm.' },
  empanada: { name: 'Empanada de pino', en: 'beef empanada', icon: '🥟', heal: 40, price: 300,
    desc: 'Beef, onion, egg and an olive. Don Lucho swears by his mother\u2019s dough.' },
  pollo: { name: 'Pollo asado', en: 'roast chicken', icon: '🍗', heal: 60, price: 900,
    desc: 'A quarter chicken, Mamá\u2019s recipe. Now with a price tag.' },
};
export const FOOD_CARRY_LIMIT = 2;

// Shared vendor conversation. Emilio's stinginess decides how much you may buy.
async function sellFood(T, G, vendor, foodId, pitch) {
  const f = FOODS[foodId];
  await T.say(vendor, pitch);
  const c = await T.choice([`Buy ${f.name} ($ ${f.price.toLocaleString('es-CL')}) — heals ${f.heal}`, 'Walk on'], vendor);
  if (c !== 0) return;
  if (G.foodCount() >= FOOD_CARRY_LIMIT) {
    G.heroGesture();
    await T.say('', '*Your hand goes to your wallet — and stops. Emilio puts the money back.*');
    await T.say('Emilio', `I already carry ${G.foodCount()}. A man who hoards food is a man who wastes it.`);
    return;
  }
  if (G.pesos < f.price) { await T.say('Emilio', 'Not enough. Of course not.'); return; }
  if (G.player.hp >= 100 && G.foodCount() > 0) {
    G.heroGesture();
    await T.say('', '*Emilio counts the coins twice — then closes his hand.*');
    await T.say('Emilio', 'I am not hungry, and I already have something. No.');
    return;
  }
  G.addPesos(-f.price, f.name);
  G.addFood(foodId);
  await T.say(vendor, '¡Gracias! ¡Buen provecho!');
  const again = await T.choice(['Buy another', 'That\u2019s enough'], vendor);
  if (again === 0) {
    G.heroGesture();
    await T.say('', '*Emilio\u2019s hand freezes over his wallet. He snaps it shut.*');
    await T.say('Emilio', 'One is enough. Every peso counts.');
  }
}

// ================================================================ helpers
const sleep = (d, s) => d.wait(s);
function movePath(d, obj, pts, speed, anim) {
  return new Promise((resolve) => {
    const end = () => { obj.position.set(...pts[pts.length - 1]); anim?.(obj, 0.016, 0); resolve(); };
    if (d.skip) { end(); return; }
    let i = 0;
    const stop = d.every((dt) => {
      if (d.skip) { stop(); end(); return; }
      const [tx, ty, tz] = pts[i];
      const dx = tx - obj.position.x, dy = ty - obj.position.y, dz = tz - obj.position.z;
      const dist = Math.hypot(dx, dy, dz), step = speed * dt;
      if (dist <= step) {
        obj.position.set(tx, ty, tz);
        if (++i >= pts.length) { stop(); anim?.(obj, dt, 0); resolve(); return; }
      } else {
        obj.position.x += (dx / dist) * step; obj.position.y += (dy / dist) * step; obj.position.z += (dz / dist) * step;
        if (Math.hypot(dx, dz) > 0.01) obj.rotation.y = Math.atan2(dx, dz);
      }
      anim?.(obj, dt, speed);
    });
  });
}
function arc(d, obj, from, to, dur, h = 1, spin = true) {
  return new Promise((resolve) => {
    if (d.skip) { obj.position.set(...to); resolve(); return; }
    let t = 0;
    const stop = d.every((dt) => {
      t += dt;
      const k = Math.min(1, t / dur);
      obj.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * h, from[2] + (to[2] - from[2]) * k);
      if (spin) obj.rotation.x += dt * 12;
      if (k >= 1 || d.skip) { obj.position.set(...to); stop(); resolve(); }
    });
  });
}
// Hips land on a 0.48 m seat whatever the character's size (kids sit higher).
function sitAt(a, x, z, yaw) { a.pos.set(x, Math.max(0, 0.56 - 0.48 * a.h), z); a.yaw = yaw; a.pose.sit = 1; a.noCollide = true; a.sync(); }
function standUp(d, a, dur = 0.5) { d.pose(a, 'sit', 0, dur); a.pos.y = 0; a.noCollide = false; }

// Lab confrontation camera angles: over Mateo's shoulder onto Emilio's face, and the reverse.
const MC_EMILIO = [[9.5, 1.7, -5.3], [6.6, 1.62, -5.9]];
const MC_MATEO = [[5.6, 1.7, -5.3], [8.5, 1.55, -5.9]];

// ================================================================ cutscenes
const SCENES = {
  // ---------------------------------------------------------- Prologue
  async prologue(d, G) {
    d.set('childhood');
    d.cam([4, 4.5, 11], [-2, 1, 0]);
    await d.card('Valparaíso, Chile', '1964');
    const kid = d.actor('kid', 'emilioKid', -1.0, 1.8, -2.5);
    const mom = d.actor('mom', 'mother', -2.5, -3.1, 0);
    sitAt(mom, -2.5, -3.15, 0);
    const coati = d.prop(createCoati(), -9, 1.0, 7);
    coati.rotation.y = Math.PI / 2;
    d.every((dt) => { if (!coati.userData.moving) animateCoati(coati, dt, 0); });
    d.cam([5, 4.2, 11], [-2, 1, 0], { to: [3.5, 3.0, 8.5], dur: 7 });
    await sleep(d, 1.5);
    await d.say('Mamá', 'Emilio! Watch the fruit while I fetch water. Every orange counts this week.');
    await d.say('Emilio', 'Sí, Mamá.');
    standUp(d, mom, 0.4);
    await sleep(d, 0.4);
    d.walkPath(mom, [[-1.2, -3.4], [3.5, -4.6]], 1.3).then(() => d.drop('mom'));
    await d.walk(kid, -1.4, -0.9, 1.6);
    d.face(kid, { x: -2.2, z: -2.2 });
    // The coati sneaks along the wall and drops down toward the table
    d.cam([-3.5, 1.6, 2.5], [-6, 1, 7], { to: [-3.2, 1.4, 1.5], lookTo: [-4, 0.8, 4], dur: 4 });
    await d.say('', '*Something rustles on the wall.*');
    coati.userData.moving = true;
    await movePath(d, coati, [[-4.6, 1.0, 7.0]], 1.6, animateCoati);
    coati.rotation.y = Math.PI;
    await arc(d, coati, [-4.6, 1.0, 7.0], [-4.6, 0, 6.0], 0.45, 0.35, false);
    coati.rotation.x = 0;
    await movePath(d, coati, [[-3.9, 0, -0.4]], 1.6, animateCoati);
    coati.userData.moving = false;
    coati.rotation.y = Math.PI * 0.75;
    const stolen = createFruit();
    coati.add(stolen); stolen.position.set(0, 0.36, 0.42);
    d.cam([-0.4, 1.3, 1.2], [-3.6, 0.5, -0.8]);
    d.face(kid, coati.position);
    await d.say('Emilio', '¡Oye! That one is ours!');
    // Throw the orange — quick-time prompt
    const fruit = d.prop(createFruit(), -1.1, 0.75, -1.0);
    d.cam([0.6, 1.6, 1.2], [-2.6, 0.6, -1.4]);
    await d.prompt('Throw the orange!');
    d.pose(kid, 'throw', 0.5, 0.25);
    await sleep(d, 0.3);
    d.pose(kid, 'throw', 1, 0.15);
    sfx.whoosh();
    await arc(d, fruit, [-1.2, 1.3, -0.9], [coati.position.x, 0.35, coati.position.z], 0.45, 0.6);
    sfx.thud();
    coati.remove(stolen);
    d.prop(stolen, coati.position.x + 0.2, 0.06, coati.position.z + 0.3);
    fruit.position.set(coati.position.x - 0.3, 0.06, coati.position.z + 0.1);
    d.pose(kid, 'throw', 0, 0.4);
    coati.userData.moving = true;
    movePath(d, coati, [[-6, 0, -1.6], [-16, 0, -1.6]], 5, animateCoati);
    d.cam([1.5, 1.8, 2.5], [-4, 0.5, -0.5], { to: [1, 1.6, 2], lookTo: [-10, 0.5, -1.6], dur: 1.8 });
    await d.say('Emilio', 'And stay away! Nobody takes from us!');
    d.actor('mom', 'mother', 4, -5.6, -2);
    d.cam([2.5, 1.7, 2.4], [0.5, 1.0, -2.5]);
    await d.walk(d.get('mom'), -0.6, -1.4, 1.5);
    d.face(d.get('mom'), kid); d.face(kid, d.get('mom'));
    d.cam([1.5, 1.4, 1.6], [-1.0, 1.0, -1.2]);
    await d.say('Mamá', 'Mijo… did you just throw an orange at a coati?');
    await d.say('Emilio', 'He was stealing from us.');
    await d.say('Mamá', '*laughs softly* Then tonight we eat the one with the bruise.');
    // Vignette two: supper
    await d.fadeOut(0.8);
    d.drop('kid'); d.drop('mom');
    const kid2 = d.actor('kid', 'emilioKid', 0, 0, 0); sitAt(kid2, -2.5, -1.25, Math.PI);
    const mom2 = d.actor('mom', 'mother', 0, 0, 0); sitAt(mom2, -2.5, -3.15, 0);
    G.setMood('dusk');
    d.cam([0.4, 1.7, -2.2], [-2.5, 0.9, -2.2], { to: [0.1, 1.5, -2.0], dur: 10 });
    await d.fadeIn(0.8);
    await d.say('Emilio', "Aren't you eating, Mamá?");
    await d.say('Mamá', 'I ate already. While you were fighting coatis.');
    const c = await d.choose(['Share the orange with her', 'Eat it yourself'], 0, 'One orange left');
    if (c === 0) {
      await d.say('Emilio', 'Half for you. Half for me.');
      await d.say('Mamá', '…You keep it, mijo. Grow strong.');
    } else {
      await d.say('', '*He eats it slowly, the way you eat when you don’t know when the next one is coming.*');
    }
    await d.say('Mamá', 'One day you will have more than you need. And when you do — promise me something.');
    await d.say('Mamá', 'Never let anyone take what is yours.');
    await d.say('Emilio', 'I promise.');
    await d.fadeOut(1);
    G.setMood(null);
    await d.card('', 'He never forgot the taste of that hunger.', 3.5);
  },

  // ---------------------------------------------------------- Chapter I
  async wake(d, G) {
    d.set('room1');
    G.ui.fade(true);
    const e = d.actor('emilio', 'emilio', -2.4, -0.62, 0);
    e.pos.y = 0.66; e.extraRot.x = -Math.PI / 2; e.noCollide = true; e.sync();
    d.cam([0.4, 2.1, 0.9], [-2.4, 0.6, -1.5], { to: [-0.2, 1.8, 0.3], dur: 9 });
    await d.card('Twelve years later', 'Cerro Barón, Valparaíso — 1976');
    G.ui.fade(false);
    await sleep(d, 1.2);
    await d.say('', '*Dogs bark. Through the thin wall, a neighbor’s radio crackles.*');
    await d.say('Radio', '“…the Junta reminds all citizens that the curfew remains in effect. The armed forces have restored order to the nation…”');
    await d.say('Emilio', 'Order.');
    await d.say('Emilio', 'Twelve years in this room. Not one more day.');
    // Sit up on the edge of the bed, then stand
    d.cam([1.0, 1.5, 0.9], [-2.2, 0.9, -1.2]);
    let k = 0;
    await new Promise((res) => {
      if (d.skip) return res();
      const stop = d.every((dt) => {
        k = Math.min(1, k + dt / 1.4);
        const t = k * k * (3 - 2 * k);
        e.extraRot.x = -Math.PI / 2 * (1 - t);
        e.yaw = Math.PI / 2 * t;
        e.pos.set(-2.4 + 0.55 * t, 0.66 - 0.66 * t + 0.0 * t, -0.62 - 0.8 * t);
        e.pose.sit = t;
        if (k >= 1 || d.skip) { stop(); res(); }
      });
    });
    sitAt(e, -1.85, -1.42, Math.PI / 2);
    await sleep(d, 0.6);
    standUp(d, e, 0.5);
    e.pos.set(-1.5, 0, -1.2); e.sync();
    await sleep(d, 0.4);
    await d.walk(e, -1.5, -0.2, 1.2);
    d.cam([1.6, 1.6, 1.2], [-1.5, 1.2, -0.2]);
    await d.say('Emilio', "Mamá's tin is under the mattress. Everything I own fits in my pockets.");
    await d.say('Emilio', 'The train to Santiago leaves from Estación Barón. Straight there. And not through the callejones.');
  },

  async train(d, G) {
    d.set('train');
    const train = G.loc.train;
    // The train rolls at a steady speed; every shot is framed relative to it,
    // so the scene looks right however long you take to read the lines.
    const SPEED = 15;
    let z = -330;
    d.every((dt) => { z = Math.min(z + dt * SPEED, 440); train.position.set(0, 0, z); });
    const shot = (fn) => { let t0 = null; d.camWith((t, cam) => { t0 ??= t; fn(t - t0, cam); }); };
    const loco = () => z + 2;          // locomotive centre
    // 1. Wide establishing shot: the train crossing the valley, Andes behind
    shot((t, cam) => { cam.position.set(34 - t * 0.6, 7 + t * 0.15, z + 46); cam.lookAt(-6, 3, z - 6); });
    sfx.horn();
    await sleep(d, 3.2);
    // 2. Tracking shot alongside the carriages, looking forward to the locomotive
    shot((t, cam) => { cam.position.set(9.5, 2.6, z - 30 + Math.min(t, 6) * 1.2); cam.lookAt(0, 2.2, loco()); });
    await sleep(d, 0.8);
    await d.say('Emilio', 'Third class. Wooden benches. Three hours.');
    await d.say('Emilio', 'Worth every peso I did not spend on first.');
    // 3. Low trackside shot: the train thunders past a fixed camera
    const passZ = z + 55;
    shot((t, cam) => { cam.position.set(-7.5, 1.1, passZ); cam.lookAt(0, 2.0, Math.min(z + 4, passZ + 30)); });
    await sleep(d, 4.5);
    // 4. Rising aerial behind the train, heading for the mountains
    shot((t, cam) => {
      const k = Math.min(t, 8);
      cam.position.set(14 + k * 1.5, 10 + k * 2.2, z - 40 - k);
      cam.lookAt(-30, 6, z + 60);
    });
    await sleep(d, 1.0);
    await d.say('', '*The coast falls away behind him. Ahead: Santiago — and the Army of the Junta.*');
    await sleep(d, 1.5);
    await d.fadeOut(0.8);
  },

  async enlist(d, G) {
    d.set('cuartel');
    G.take('ticket');
    d.cam([10, 6, 16], [0, 2, -10]);
    await d.card('Santiago', 'September 1976 — three years after the coup that brought General Augusto Pinochet to power.', 4.5);
    const off = d.actor('rec', 'colonel', 0, 0, 0); sitAt(off, -3, -12.9, 0);
    const e = d.actor('emilio', 'emilio', 2, 12, Math.PI);
    for (let i = 0; i < 8; i++) {
      const s = d.actor('s' + i, 'soldier', 8 + (i % 4) * 1.6, -2 + Math.floor(i / 4) * 2, -Math.PI / 2);
      s.animSpeed = 2.2;
    }
    d.cam([8, 3, 6], [-2, 1.2, -6], { to: [3, 2.2, -4], lookTo: [-3, 1.2, -11], dur: 6 });
    await d.walk(e, -3, -11.0, 1.5);
    d.face(e, off);
    d.cam([-0.6, 1.7, -10.0], [-3, 1.2, -12.7]);
    await d.say('Recruiter', 'Name.');
    d.cam([-4.8, 1.5, -12.4], [-3, 1.6, -11.0]);
    await d.say('Emilio', 'Emilio Gonzalez.');
    d.cam([-0.6, 1.7, -10.0], [-3, 1.2, -12.7]);
    await d.say('Recruiter', 'From?');
    await d.say('Emilio', 'Valparaíso. Cerro Barón.');
    await d.say('Recruiter', '*snorts* A boy from the cerros. Why would the Army of Chile want you?');
    const c = await d.choose(['"Because I never quit."', '"Because I have nothing to lose."', '"Because I will be the best soldier you have ever seen."'], 0, 'Answer the recruiter');
    d.cam([-4.8, 1.5, -12.4], [-3, 1.6, -11.0]);
    if (c === 0) await d.say('Recruiter', 'Everyone says that. Few mean it.');
    else if (c === 1) await d.say('Recruiter', 'Good. Men with nothing are easy to command.');
    else await d.say('Recruiter', '*laughs* We will see how long that lasts in boot camp.');
    await d.say('Recruiter', 'The General rewards loyalty, Gonzalez. Loyalty — and silence. Can you keep your mouth shut?');
    await d.say('Emilio', 'Better than anyone in this room.');
    await d.say('Recruiter', '…Sign.');
    d.pose(e, 'salute', 1, 0.3);
    d.cam([2, 1.8, -8.5], [-3, 1.5, -11]);
    await sleep(d, 1.4);
    await d.fadeOut(0.8);
  },

  // Rise through the army: boot camp, a sparring fight, a night raid, a promotion.
  async rise(d, G) {
    // --- Boot camp run
    await d.card('Boot camp', 'Regimiento Tacna — 1976.\nPrivate Emilio Gonzalez sends half his pay home. He spends nothing on himself.', 4);
    d.set('cuartel');
    const sarge = d.actor('sarge', 'sergeant', 4, 4, -Math.PI / 2);
    const col = [];
    for (let i = 0; i < 7; i++) col.push(d.actor('r' + i, i === 0 ? 'emilioRecruit' : 'recruit', -12 - i * 1.3, 6 + (i % 2) * 1.0, Math.PI / 2));
    col.forEach((a, i) => d.walk(a, 11 - i * 1.3, 6 + (i % 2) * 1.0, 3.4));
    d.camWith((t, cam) => { const x = col[0].pos.x; cam.position.set(x + 2.5, 1.5, 10.5); cam.lookAt(x - 1.5, 1.3, 6.3); });
    await sleep(d, 1.6);
    d.face(sarge, col[0]);
    await d.say('Sargento', '¡Más rápido, reclutas! ¡El General no espera a nadie!');
    await sleep(d, 1.0);
    d.cam([2, 1.4, 9.5], [-6, 1.2, 6.5]);
    await d.say('Emilio', '(Ten more laps. Then ten more. The ones who quit go home to nothing. I have nothing to go home to.)');
    for (let i = 0; i < 7; i++) d.drop('r' + i);
    // --- Rifle range (playable)
    await d.fadeOut(0.4);
    const shooter = d.actor('shooter', 'emilioRecruit', 0, 12, 0);
    sarge.pos.set(2.2, 0, 11); sarge.yaw = -0.6; sarge.sync();
    d.cam([2.6, 1.8, 9.2], [0, 1.5, 20]);
    await d.fadeIn(0.4);
    await d.say('Sargento', '¡Al blanco, Gonzalez! Eight targets. Miss and you run until dawn.');
    await d.prompt('Click to shoulder the rifle', ['Mouse0', 'KeyE']);
    const score = await shootingRange(d, G, shooter, { total: 8, time: 34 });
    d.cam([2.6, 1.7, 10.0], [0, 1.5, 12.5]);
    if (score.hits >= 7) await d.say('Sargento', `${score.hits} de ${score.total}. …¿Dónde aprendió a disparar así, recluta?`);
    else if (score.hits >= 4) await d.say('Sargento', `${score.hits} de ${score.total}. Mediocre. Again tomorrow.`);
    else await d.say('Sargento', `${score.hits} de ${score.total}?! ¡A correr! Laps until you can see straight!`);
    await d.say('Emilio', '(Patience. Breathe out. Squeeze. The target never moves first — you do.)');
    d.drop('shooter');
    // --- Sparring circle
    await d.fadeOut(0.5);
    const e = d.actor('emilio', 'emilioRecruit', -0.42, 0, Math.PI / 2);
    const big = d.actor('big', 'bigRecruit', 0.42, 0, -Math.PI / 2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = d.actor('ring' + i, 'recruit', Math.cos(a) * 3.4, Math.sin(a) * 3.4, 0);
      d.face(r, { x: 0, z: 0 });
      if (i % 2) d.pose(r, 'handsUp', 0.6, 0);
    }
    sarge.pos.set(0, 0, -3.6); sarge.yaw = 0; sarge.sync();
    d.pose(e, 'guard', 1, 0); d.pose(big, 'guard', 1, 0);
    d.cam([0, 1.45, 2.9], [0, 1.25, 0]);
    await d.fadeIn(0.5);
    await d.card('', '1977', 1.2);
    await d.say('Sargento', '¡Pelea! Show me what the boy from the cerros is worth.');
    // Big recruit swings; Emilio blocks, then answers with a jab and a cross
    d.pose(big, 'punch', 1, 0.15); sfx.block();
    await sleep(d, 0.35);
    d.pose(big, 'punch', 0, 0.2);
    d.cam([1.5, 1.55, 1.3], [-0.45, 1.45, 0]);
    await sleep(d, 0.4);
    d.pose(e, 'jab', 1, 0.08); sfx.punch(); d.pose(big, 'hurt', 1, 0.05);
    await sleep(d, 0.25);
    d.pose(e, 'jab', 0, 0.12);
    d.pose(e, 'punch', 1, 0.1); sfx.hit(); G.shake = 0.25;
    await sleep(d, 0.2);
    d.pose(e, 'punch', 0, 0.3);
    big.noCollide = true;
    let k = 0;
    await new Promise((res) => {
      if (d.skip) return res();
      const stop = d.every((dt) => {
        k = Math.min(1, k + dt * 2.4);
        big.extraRot.x = -Math.PI / 2 * k * k; big.pos.y = 0.16 * k * k; big.pos.x = 0.42 + k * 0.5;
        if (k >= 1 || d.skip) { stop(); res(); }
      });
    });
    big.extraRot.x = -Math.PI / 2; big.pos.y = 0.16; big.pos.x = 0.92; big.sync();
    sfx.thud();
    d.cam([-1.8, 1.55, -1.3], [0.7, 0.9, 0.3]);
    await d.say('Sargento', '¡Gonzalez! ¡Así se hace!');
    await d.say('Emilio', '*He offers the man a hand up. Nobody else in the circle does.*');
    d.drop('emilio'); d.drop('big'); d.drop('sarge');
    for (let i = 0; i < 8; i++) d.drop('ring' + i);
    // --- Night raid in the old neighbourhood
    await d.fadeOut(0.6);
    await d.card('1978', 'Lieutenant. His superiors call him cold. Efficient. Patient.\nHe never asks what the orders are for.\n\nVíctor Díaz López transfers to the secret police. He does not forget the barracks.', 5);
    d.set('barrio');
    G.setMood('night');
    d.prop(new THREE.PointLight('#ffcf8a', 26, 22, 1.4), -15, 4.2, 54.5);
    d.prop(new THREE.PointLight('#cfe0ff', 10, 30, 1.2), -22, 3, 52);   // truck headlights
    const lt = d.actor('lt', 'lieutenant', -20, 54.4, Math.PI / 2);
    const s1 = d.actor('s1', 'soldier', -18.6, 55.6, Math.PI / 2);
    const s2 = d.actor('s2', 'soldier', -18.4, 53.4, Math.PI / 2);
    for (const sx of [s1, s2]) { const r = createRifle(); r.position.set(-0.19, 1.3, 0.38); sx.root.add(r); d.pose(sx, 'point', 0.85, 0); }
    const r2flash = muzzleFlash(); r2flash.position.set(0, 0.04, 0.62); s2.root.children.at(-1).add(r2flash);
    const man = d.actor('man', G.randomLook(), -12, 57.6, Math.PI);
    const rosa = d.actor('rosa', 'neighbor', -15.5, 57.8, Math.PI);
    d.cam([-25, 2.2, 53.4], [-16, 1.3, 56]);
    await d.fadeIn(0.6);
    await d.say('Radio', '\u201c…toque de queda a partir de las veintidós horas…\u201d');
    // The man bolts; a warning shot into the air stops him cold
    d.walk(man, -4, 55.5, 4.2);
    d.walk(lt, -14.6, 55.2, 1.6);
    d.walk(s1, -13, 56.6, 2.8);
    await d.walk(s2, -11.5, 56.4, 2.8);
    d.face(s2, man);
    d.cam([-9.5, 1.6, 53.2], [-6, 1.3, 55.6]);
    await d.say('Teniente Gonzalez', '¡Alto!');
    s2.extraRot.x = 0.5; s2.sync();
    r2flash.visible = true; sfx.gunshot(); G.shake = 0.3;
    await sleep(d, 0.08);
    r2flash.visible = false;
    await sleep(d, 0.4);
    s2.extraRot.x = 0;
    man.target = null; man.onArrive = null;
    d.pose(man, 'handsUp', 1, 0.2);
    d.face(man, lt);
    await sleep(d, 0.6);
    d.walk(man, -11.6, 57.4, 1.4);
    d.face(s1, man); d.face(lt, man);
    await sleep(d, 1.6);
    d.cam([-10.0, 1.7, 53.6], [-13.4, 1.4, 56.6]);
    await d.say('Hombre', '¡No he hecho nada! I was only coming home from work!');
    d.pose(lt, 'point', 1, 0.3);
    await d.say('Teniente Gonzalez', 'After curfew. Without papers. That is not nothing.');
    d.walk(rosa, -14.6, 56.8, 1.8);
    await sleep(d, 0.7);
    d.face(rosa, lt); d.face(lt, rosa);
    d.pose(lt, 'point', 0, 0.3);
    d.cam([-16.8, 1.6, 53.2], [-14.6, 1.5, 56.4]);
    await d.say('Señora Rosa', '¡Por favor, mi teniente! Él no ha hecho nada…');
    await d.say('Señora Rosa', '…¿Emilio? ¿Emilio Gonzalez? Mijo — it\u2019s me. Rosa. From the pasaje.');
    d.cam([-13.0, 1.65, 57.6], [-14.6, 1.55, 55.2]);
    await d.say('Teniente Gonzalez', 'Lieutenant Gonzalez, Señora.');
    await d.say('Teniente Gonzalez', 'Go inside. Curfew applies to everyone.');
    d.face(lt, man);
    await d.say('Teniente Gonzalez', 'Llévenselo.');
    d.pose(man, 'hurt', 0.5, 0.2);
    d.walk(s1, -24, 55, 2); d.walk(s2, -24, 56.6, 2); d.walk(man, -24, 55.8, 2);
    d.cam([-10, 1.8, 52], [-16, 1.3, 56]);
    await sleep(d, 2.4);
    await d.say('', '*Señora Rosa stands in the street long after the truck is gone.*');
    await d.fadeOut(0.8);
    G.setMood(null);
    for (const k2 of ['lt', 's1', 's2', 'man', 'rosa']) d.drop(k2);
    // --- Promotion ceremony
    await d.card('1980', 'Colonel.', 1.8);
    d.set('cuartel');
    const c = d.actor('colonel', 'colonel', 0, -12.6, 0);
    const g = d.actor('emilio', 'lieutenant', 0, -10.8, Math.PI);
    for (let i = 0; i < 12; i++) {
      const sx = d.actor('rank' + i, 'soldier', -7.5 + (i % 6) * 3, -4 + Math.floor(i / 6) * 2.2, Math.PI);
      d.pose(sx, 'salute', 1, 0);
    }
    d.cam([4.5, 1.8, -8.0], [0, 1.5, -11.7], { to: [2.8, 1.6, -11.7], lookTo: [0, 1.45, -11.7], dur: 6 });
    await d.fadeIn(0.6);
    await d.say('Coronel', 'Por su lealtad al General y a la Patria…');
    d.pose(c, 'point', 0.8, 0.4);
    await sleep(d, 0.8);
    d.pose(c, 'point', 0, 0.4);
    d.cam([1.2, 1.65, -12.4], [0, 1.6, -10.8]);
    await d.say('Coronel', '…Coronel Gonzalez. And they tell me that by next year you will be a General.');
    d.pose(g, 'salute', 1, 0.3);
    await d.say('Emilio', 'Sí, mi Coronel.');
    d.cam([0, 6, 4], [0, 4, -16], { to: [0, 9, 8], dur: 4 });
    await sleep(d, 2.5);
    await d.fadeOut(0.8);
    await d.card('1981', 'General.\nFive years in uniform. Still living like a private. Still saving every peso.');
  },

  // Behind the barracks: Víctor Díaz López and his friends are waiting.
  async victorTalk(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const e = d.actor('emilio', 'emilioRecruit', P.x, P.z, G.player.modelYaw);
    const v = d.actor('victor', 'victor', -36.6, 4.6, Math.PI);
    const f1 = d.actor('f1', 'bigRecruit', -38, 6.6, Math.PI);
    const f2 = d.actor('f2', 'recruit', -35.2, 7, Math.PI);
    d.face(v, e); d.face(f1, e); d.face(f2, e); d.face(e, v);
    d.cam([P.x + 2.4, 1.8, P.z - 2.6], [-36.6, 1.4, 4.6]);
    await d.walk(e, -36.6, Math.min(P.z, 1.6), 1.6);
    d.face(e, v);
    d.cam([-34.4, 1.65, 2.2], [-36.6, 1.6, 4.6]);
    await d.say('Víctor Díaz López', 'The boy from the cerros. The sergeant’s new favourite.');
    if (G.S.flag('bc:beatVictor')) await d.say('Víctor Díaz López', 'You made me look like a fool on the course this morning. In front of my uncle’s friends.');
    else await d.say('Víctor Díaz López', 'Even on the course you ran behind me. Like a dog. That is your place — behind.');
    if (G.S.flag('tomas:reported')) await d.say('Víctor Díaz López', 'And you turned in Quiroga for a piece of bread. A rat. I like rats. They know where they belong.');
    else if (G.S.flag('tomas:covered')) await d.say('Víctor Díaz López', 'And you lie for thieves. Quiroga steals, you cover. Cerro people stick together, eh?');
    else if (G.S.flag('tomas:partner')) await d.say('Víctor Díaz López', 'I hear you sell the bread Quiroga steals. Six weeks in and already a businessman.');
    d.cam([-37.8, 1.6, 2.4], [-36.6, 1.55, 1.6]);
    const c = await d.choose(['"Say what you came to say."', '"Your uncle cannot help you back here."', 'Say nothing. Wait.'], 0, 'Víctor Díaz López');
    if (c === 0) await d.say('Emilio', 'Say what you came to say, Díaz López. I have boots to polish.');
    else if (c === 1) await d.say('Emilio', 'Your uncle is a colonel. Back here, you are just a boy with soft hands.');
    else await d.say('', '*You say nothing. You have learned that silence makes men like him talk more.*');
    d.cam([-34.4, 1.65, 2.2], [-36.6, 1.6, 4.6]);
    await d.say('Víctor Díaz López', 'Men like me become generals, cerro. Men like you clean up after us.');
    await d.say('Víctor Díaz López', 'Let’s make sure you remember it.');
    d.pose(v, 'guard', 1, 0.2); d.pose(f1, 'guard', 1, 0.2); d.pose(f2, 'guard', 1, 0.2); d.pose(e, 'guard', 1, 0.2);
    await sleep(d, 0.6);
    G.placePlayer(e.pos.x, e.pos.z, e.yaw);
    G.hideHero(false);
  },

  // ---------------------------------------------------------- Chapter II
  async wake2(d, G) {
    d.set('house2');
    const e = d.actor('emilio', 'general', 0, 0, 0); sitAt(e, 2.6, -1.4, Math.PI);
    // Bundles of banknotes and a cash tin on the table
    const cash = new THREE.Group();
    const note = new THREE.MeshStandardMaterial({ color: '#8fa86a', roughness: 0.9 });
    const band = new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.9 });
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.07), note);
      b.position.set((i % 3) * 0.17 - 0.17, 0.015 + Math.floor(i / 3) * 0.031, 0);
      b.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.032, 0.072), band));
      cash.add(b);
    }
    const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 14), new THREE.MeshStandardMaterial({ color: '#b03a2a', roughness: 0.5, metalness: 0.4 }));
    tin.position.set(0.32, 0.07, 0.05); cash.add(tin);
    d.prop(cash, 2.6, 0.785, -1.95);
    d.cam([0.8, 1.9, 0.4], [2.6, 0.9, -2.0], { to: [1.6, 1.5, -0.4], dur: 10 });
    await d.fadeIn(0.6);
    await d.say('Emilio', '…eight hundred and ten. Eight hundred and twelve thousand. Four hundred.');
    G.setPesos(812400, 'Five years of savings');
    G.give('ledger', false);
    await d.say('Emilio', 'Bread, twelve. Bus fare — walked. Coffee…');
    await d.say('Emilio', 'Not today.');
    await d.say('Emilio', 'Almost enough. Almost enough to leave all of this behind.');
    standUp(d, e, 0.5);
    await sleep(d, 0.5);
    await d.walk(e, 2.4, -0.7, 1.0);
    await d.say('Emilio', 'Service ID. Then the morning round on the avenue — the shopkeepers\u2019 \u201ccontributions\u201d do not collect themselves.');
    await d.say('Emilio', 'Then the facility. The Colonel hates it when I am late — so I never am.');
  },

  async chase(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const e = d.actor('emilio', 'general', P.x, P.z, G.player.modelYaw);
    const sx = Math.max(-12, Math.min(40, P.x)), sz = -41.5;
    d.cam([P.x + 4, 2.4, P.z + 4], [P.x, 1.5, P.z]);
    d.walk(e, sx, sz, 2.2);
    await d.say('', '*A police whistle. Running footsteps along the facility wall.*');
    await d.say('Carabinero', '¡Alto! ¡Deténganlo!');
    const m = d.actor('mateo', 'mateoRun', 49, -41.8, -Math.PI / 2);
    const c1 = d.actor('cop1', 'carabinero', 49.5, -40.2, -Math.PI / 2);
    const c2 = d.actor('cop2', 'carabinero', 49.5, -43.2, -Math.PI / 2);
    c1.pos.x = 70; c2.pos.x = 72; c1.noCollide = c2.noCollide = true; c1.sync(); c2.sync();
    d.cam([sx + 7, 1.6, sz + 3.5], [sx + 22, 1.4, sz], { to: [sx + 4, 1.7, sz + 3], lookTo: [sx + 2, 1.4, sz], dur: 5 });
    d.face(e, m);
    await d.walk(m, sx + 1.0, sz - 0.1, 6);
    sfx.thud();
    d.face(m, e); d.face(e, m);
    d.pose(e, 'guard', 0.7, 0.15);
    d.pose(m, 'hurt', 0.6, 0.1);
    d.cam([sx - 1.6, 1.75, sz + 2.2], [sx + 0.6, 1.5, sz - 0.1]);
    await d.say('Mateo', 'Move! Please — let me through!');
    d.pose(m, 'hurt', 0, 0.3);
    await d.say('Emilio', 'Who are you running from?');
    await d.say('Mateo', 'Carabineros. If they catch me, I disappear. You understand, General? Disappear.');
    d.pose(m, 'hands', 1, 0.3);
    await d.say('', '*He tries to shove past you.*');
    await d.prompt('Hold him back!');
    d.pose(e, 'guard', 1, 0.1);
    sfx.block();
    m.pos.x += 0.3; m.sync();
    d.cam([sx + 3.2, 1.6, sz + 1.6], [sx + 0.2, 1.6, sz]);
    await d.say('Emilio', 'You are not going anywhere until I know what you did.');
    await d.say('Mateo', 'Food! I took food from their depot — rice, flour — and gave it to the poblaciones. To children!');
    await d.say('Mateo', 'They eat steak at the station while kids in La Victoria eat bread and tea. So I took some.');
    await d.say('Emilio', 'You are a thief.');
    await d.say('Mateo', 'I am a dead man. Unless you let me go.');
    // The police close in from the east
    d.walk(c1, sx + 16, sz + 1.2, 3); d.walk(c2, sx + 17, sz - 1.4, 3);
    d.cam([sx - 1.0, 1.7, sz + 2.6], [sx + 14, 1.5, sz]);
    await sleep(d, 1.6);
    d.cam([sx - 1.6, 1.75, sz + 2.2], [sx + 0.6, 1.5, sz - 0.1]);
    const c = await d.choose(['Let him go', 'Hand him to the Carabineros'], 0, 'The whistles are getting closer');
    if (c === 1) {
      await d.say('', '*You tighten your grip. He looks like every boy on Cerro Barón.*');
      await d.say('Emilio', '…');
    }
    d.pose(e, 'guard', 0, 0.2);
    await d.say('Emilio', 'Go. Behind the army truck. Not a sound.');
    d.pose(m, 'hands', 0, 0.2);
    await d.walkPath(m, [[-14, -47.2], [-20, -46.6]], 6);
    d.drop('mateo');
    d.face(e, c1);
    await d.walk(c1, sx + 2.4, sz + 0.4, 3.6);
    d.walk(c2, sx + 2.6, sz - 1.0, 3.6);
    d.pose(c1, 'salute', 1, 0.25);
    d.cam([sx - 1.0, 1.7, sz - 2.4], [sx + 2.4, 1.6, sz + 0.2]);
    await d.say('Carabinero', '¡Mi General! A man ran this way — red shirt, mustache. A thief.');
    d.pose(c1, 'salute', 0, 0.25);
    const lie = await d.choose(['"No one came this way."', '"He ran back toward the river." (point south)', 'Say nothing. Stare.'], 0, 'Feign ignorance');
    if (lie === 1) { d.pose(e, 'point', 1, 0.3); e.faceTo = null; e.yaw = 0; }
    if (lie === 2) await d.say('Carabinero', '…Mi General?');
    else await d.say('Emilio', lie === 0 ? 'No one came this way, Sargento. I would have noticed.' : 'Toward the Mapocho. He looked tired.');
    d.pose(e, 'point', 0, 0.3);
    await d.say('Carabinero', 'Gracias, mi General. If you see him—');
    await d.say('Emilio', 'You will be the first to know.');
    d.walk(c1, sx + 4, 20, 4); d.walk(c2, sx + 5, 22, 4);
    d.cam([sx + 2.5, 1.8, sz + 1.4], [-19, 1.2, -45], { to: [sx + 2, 1.7, sz + 1.8], dur: 3 });
    d.face(e, { x: -20, z: -45 });
    await sleep(d, 1.4);
    await d.say('Emilio', '(Five years of keeping my head down. Gone in twenty seconds.)');
    G.placePlayer(e.pos.x, e.pos.z, Math.PI);
    G.hideHero(false);
  },

  // After the market fight: the Carabineros take the thieves; the General takes his cut.
  async arrest(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const e = d.actor('emilio', 'general', P.x, P.z, G.player.modelYaw);
    const marta = d.actor('marta', 'marketWoman', 33.5, 9.4, Math.PI);
    const c1 = d.actor('cop1', 'carabinero', 8, 20, Math.PI / 2);
    const c2 = d.actor('cop2', 'carabinero', 7, 18.6, Math.PI / 2);
    d.cam([P.x - 4, 2.2, P.z + 4], [P.x, 1.3, P.z]);
    d.walk(e, 32.4, 14.6, 1.6);
    d.walk(c1, 30, 16.6, 3.4);
    await d.walk(c2, 34.6, 16.2, 3.4);
    d.face(e, c1); d.face(c1, e); d.face(c2, e);
    d.pose(c1, 'salute', 1, 0.25); d.pose(c2, 'salute', 1, 0.25);
    d.cam([28.6, 1.7, 13.0], [32.4, 1.5, 15.4]);
    await d.say('Carabinero', '¡Mi General! We heard the shouting. Are you hurt?');
    d.pose(c1, 'salute', 0, 0.25); d.pose(c2, 'salute', 0, 0.25);
    await d.say('Emilio', 'No. They are.');
    await d.say('Emilio', 'Take them to the Estadio. Let the General\u2019s justice decide what they are worth.');
    await d.say('Carabinero', '¡Sí, mi General!');
    G.clearFallen();
    d.face(e, marta); d.face(marta, e);
    d.cam([35.6, 1.6, 12.6], [33.5, 1.5, 10.0]);
    await d.say('Señora Marta', '¡Gracias, mi General! ¡Que Dios lo bendiga!');
    d.cam([31.0, 1.65, 11.4], [32.4, 1.6, 14.6]);
    await d.say('Emilio', 'God has nothing to do with it, Señora. The Army protects this market.');
    await d.say('Emilio', 'And protection is not free.');
    d.cam([35.6, 1.6, 12.6], [33.5, 1.5, 10.0]);
    await d.say('Señora Marta', '…¿Cómo?');
    const c = await d.choose(['Take the whole cash box', 'Take half — she will pay again next week'], 1, 'Your cut');
    if (c === 0) {
      G.addPesos(6000, 'Señora Marta\u2019s cash box');
      await d.say('Señora Marta', 'That is everything I made this week…');
      await d.say('Emilio', 'Then next week, make more.');
    } else {
      G.addPesos(3000, 'Señora Marta\u2019s cash box');
      await d.say('Emilio', 'Half. Every Monday. A farmer does not eat the whole cow.');
    }
    d.cam([28.6, 1.7, 13.0], [32.4, 1.5, 15.4]);
    await d.say('Emilio', '(Order. That is what the radio calls it.)');
    G.placePlayer(e.pos.x, e.pos.z, Math.PI);
    G.hideHero(false);
  },

  async gate(d, G) {
    G.hideHero(true);
    const e = d.actor('emilio', 'general', 0, -45.6, Math.PI);
    const gd = d.actor('guard', 'soldier', 3.4, -48.4, -Math.PI / 2);
    d.cam([5, 2.2, -42], [0, 1.6, -48]);
    await d.walk(gd, 0.9, -46.6, 1.8);
    d.face(gd, e); d.face(e, gd);
    d.cam([-2.6, 1.7, -44.2], [0.8, 1.6, -46.7]);
    await d.say('Guard', 'Buenos días, mi General. Identification — regulations, mi General.');
    d.pose(e, 'point', 0.8, 0.3);
    await sleep(d, 0.7);
    d.pose(e, 'point', 0, 0.3);
    await d.say('Guard', 'Gracias. ¡Abran la barrera!');
    d.pose(gd, 'salute', 1, 0.25);
    d.cam([0, 6, -40], [0, 3, -62], { to: [0, 5, -44], dur: 3 });
    await sleep(d, 1.6);
    await d.fadeOut(0.6);
    d.drop('emilio'); d.drop('guard');
    d.set('facility');
    const e2 = d.actor('emilio', 'general', 0, 7.6, Math.PI);
    const s = d.actor('sentry', 'soldier', 1.6, 6.4, -Math.PI / 2);
    const aide = d.actor('aide', 'aide', -3, 0, Math.PI / 2);
    d.cam([2.5, 2.2, 2], [0, 1.4, 6.5]);
    await d.fadeIn(0.6);
    d.walk(e2, 0, 4.8, 1.5);
    await sleep(d, 0.6);
    d.pose(s, 'salute', 1, 0.2);
    await d.say('Sentry', '¡Mi General!');
    d.walk(aide, -0.8, 3.6, 1.8);
    d.face(e2, aide);
    await sleep(d, 1.0);
    d.pose(s, 'salute', 0, 0.3);
    await d.say('Teniente Rojas', 'Buenos días, mi General. Your office is ready. The Colonel sends his regards.');
    await d.say('Emilio', 'Coffee?');
    await d.say('Teniente Rojas', 'There is coffee, mi General.');
    await d.say('Emilio', 'Then I will not need any.');
  },

  async desk(d, G) {
    G.hideHero(true);
    const e = d.actor('emilio', 'general', 0, 0, 0); sitAt(e, -9, -6.55, 0);
    const aide = d.actor('aide', 'aide', -9, -1.6, Math.PI);
    d.cam([-7.2, 2.0, -3.2], [-9, 1.0, -6.0]);
    await d.walk(aide, -9, -4.0, 1.6);
    await d.say('Teniente Rojas', 'Mi General — the Carabineros are at the gate. A thief robbed their supply depot this morning.');
    await d.say('Emilio', 'And why is that my concern, Teniente?');
    d.cam([-10.4, 1.4, -4.6], [-9, 1.1, -6.5]);
    await d.say('Teniente Rojas', 'They say he works here. A chemist from our own laboratory — Zagal. Mateo Zagal. He has not reported for duty.');
    await d.say('Emilio', '(Red shirt. Mustache.)');
    await d.say('Emilio', 'Tell the Carabineros no one enters my facility without my order. I will look into it personally.');
    await d.say('Teniente Rojas', 'Sí, mi General.');
    d.walk(aide, -9, 2, 1.8).then(() => d.drop('aide'));
    d.cam([-8.0, 1.5, -4.8], [-9, 1.1, -6.6], { to: [-8.4, 1.3, -5.6], dur: 4 });
    await sleep(d, 1);
    await d.say('Emilio', 'A chemist. Of course he came back here. The one building in Santiago the Carabineros cannot search.');
    standUp(d, e, 0.4);
    await sleep(d, 0.4);
    G.placePlayer(-9, -3.6, Math.PI);
  },

  async mateo(d, G) {
    G.hideHero(true);
    const e = d.actor('emilio', 'general', 7, -2.2, Math.PI);
    const m = d.actor('mateo', 'mateo', 11.5, -6.5, -2.4);
    d.cam([6.0, 2.4, -2.0], [9.5, 1.0, -6.0]);
    await d.walkPath(e, [[6.0, -2.6], [6.0, -5.4], [6.6, -5.9]], 1.3);
    d.face(e, m);
    d.cam([5.5, 1.65, -5.0], [10.5, 1.4, -6.4]);
    await d.say('Emilio', 'Zagal.');
    await d.walk(m, 8.5, -5.9, 1.0);
    d.face(m, e); d.face(e, m);
    d.cam(MC_MATEO[0], MC_MATEO[1]);
    await d.say('Mateo', '…General. The man from the street.');
    d.cam(MC_EMILIO[0], MC_EMILIO[1]);
    await d.say('Emilio', 'You made me lie to the Carabineros. In my uniform. In daylight. In front of half of Barrio Yungay.');
    await d.say('Mateo', 'And I am grateful—');
    await d.say('Emilio', 'Grateful.');
    await d.say('Emilio', 'Do you know how long I have worked to be invisible to men like that? Five years. And you spent it in one morning.');
    const c = await d.choose(['"Give me one reason not to kill you myself."', '"Turn yourself in. Tonight."', '"Explain. Quickly."'], 0, 'Confront Mateo');
    if (c === 0) {
      await d.walk(e, 7.7, -5.9, 2.5);
      d.pose(m, 'handsUp', 1, 0.2);
      d.cam([7.1, 1.75, -4.4], [8.1, 1.5, -5.9]);
      await d.say('Mateo', 'Wait — wait! You could have handed me over on the street. You didn’t. Why?');
      await d.say('Emilio', 'I am still deciding.');
    } else if (c === 1) {
      await d.say('Mateo', 'Turn myself in? They would take me to Villa Grimaldi. Nobody comes back from Villa Grimaldi, General. You know that better than me.');
    } else {
      await d.say('Mateo', 'All right. All right.');
    }
    d.pose(m, 'handsUp', 0, 0.4);
    d.cam(MC_MATEO[0], MC_MATEO[1]);
    await d.say('Mateo', 'I grew up in La Victoria. You know it? Dirt streets. Tin roofs. My mother cleaned houses in Providencia.');
    await d.say('Mateo', 'The Carabineros keep warehouses full of food — rice, flour, meat. While kids in the poblaciones eat bread and tea.');
    d.pose(m, 'hands', 0.8, 0.3);
    await d.say('Mateo', 'So I took some. I gave it away. That is all I did.');
    d.pose(m, 'hands', 0, 0.3);
    d.cam(MC_EMILIO[0], MC_EMILIO[1]);
    await d.say('Emilio', '“That is all.” For that, they will put you in a hole in the desert.');
    await d.say('Mateo', 'I know.');
    await d.say('Emilio', '…And here you are. A chemist for the regime. Tell me, Zagal — what exactly do we make in this laboratory?');
    d.cam(MC_MATEO[0], MC_MATEO[1]);
    await d.say('Mateo', 'You don’t know? You are the General.');
    await d.say('Emilio', 'I sign requisitions. I do not ask questions. That is how a man from Cerro Barón becomes a General.');
    await d.say('Mateo', '…Product. For the streets. The regime cooks it here and sells it through the Carabineros — to keep the poblaciones quiet, and the money flowing.');
    await d.say('Mateo', 'I am very good at it. That is the only reason they haven’t replaced me.');
    await sleep(d, 0.8);
    d.cam(MC_EMILIO[0], MC_EMILIO[1]);
    await d.say('Emilio', 'You steal their food to feed the poor… and you cook their poison to keep the poor quiet.');
    await d.say('Mateo', 'We all wear a uniform, General.');
    const c2 = await d.choose(['"You will stay hidden in this lab until I say otherwise."', '"…La Victoria. I grew up on Cerro Barón."'], 0, 'Decide');
    if (c2 === 1) {
      await d.say('Mateo', '*a long look* …Then you know exactly what I am talking about.');
      await d.say('Emilio', 'I know that the poor do not get second chances. You just used yours.');
    } else {
      await d.say('Mateo', 'And then?');
      await d.say('Emilio', 'And then we will see what you are worth.');
    }
    await d.say('Mateo', 'Why are you helping me, General?');
    await d.say('Emilio', 'I am not helping you. I am protecting my facility.');
    await d.say('Mateo', '*smiles* Of course, General.');
    await d.fadeOut(1);
  },

  async montage(d, G) {
    await d.card('Months pass.', 'The Carabineros stop looking. Dr. Mateo Zagal returns to his bench as if nothing happened.\nThe General signs the paperwork that makes it so.', 4.5);
    d.set('house2');
    G.setMood('night');
    const e = d.actor('emilio', 'emilioCivil', 0, 0, 0); sitAt(e, 2.6, -1.4, Math.PI);
    const m = d.actor('mateo', 'mateo', 0, 0, 0); sitAt(m, 1.55, -2.2, Math.PI / 2);
    d.cam([0.6, 1.6, 0.4], [2.2, 0.9, -1.9], { to: [0.9, 1.4, 0.0], dur: 18 });
    await d.fadeIn(0.8);
    await d.say('Mateo', 'You count the bread, Emilio. I watched you. Twelve slices.');
    await d.say('Emilio', 'Twelve slices. Six days. Two each.');
    await d.say('Mateo', 'A General, and you live like a monk.');
    await d.say('Emilio', 'I live like a man who intends to leave.');
    await d.say('Mateo', 'Leave what?');
    await d.say('Emilio', 'This. The uniform. The country, if I must. I have saved for five years. It is almost enough.');
    await d.say('Mateo', 'Enough for what?');
    await d.say('Emilio', 'A business. Something clean. Something that is mine.');
    await d.say('Mateo', '*quietly* …I could make it more than enough.');
    await d.say('Emilio', 'First I have to get out of the army alive. Generals do not resign under Pinochet. They are retired — or they vanish.');
    await d.say('Mateo', 'Then don’t resign. Get sick.');
    await d.say('Emilio', 'I have never been sick a day in my life.');
    await d.say('Mateo', 'Dr. Herrera, in the infirmary. He will diagnose anything — for the right price.');
    await d.say('Emilio', '*winces* Price.');
    await d.say('Mateo', '*laughs* It physically hurts you, doesn’t it?');
    await d.fadeOut(1);
    G.setMood(null);
    await d.card('', 'Somewhere between the bread and the chess and the long nights,\nEmilio Gonzalez made the only friend he would ever trust.', 4.5);
  },

  async resign(d, G) {
    d.set('facility');
    const col = d.actor('col', 'colonel', 0, 0, 0); sitAt(col, -9, -6.55, 0);
    const e = d.actor('emilio', 'general', -9, -1.4, Math.PI);
    d.cam([-6.6, 2.0, -2.2], [-9, 1.1, -5.4]);
    await d.fadeIn(0.6);
    await d.walk(e, -9, -4.0, 1.3);
    d.pose(e, 'point', 0.7, 0.4);
    await d.say('', '*You set the medical certificate and your resignation on the Colonel’s desk.*');
    G.take('certificate');
    d.pose(e, 'point', 0, 0.4);
    d.cam([-10.6, 1.45, -4.4], [-9, 1.2, -6.5]);
    await d.say('Colonel', 'A heart condition. You.');
    d.cam([-7.8, 1.6, -6.4], [-9, 1.6, -4.0]);
    await d.say('Emilio', 'Dr. Herrera was very clear, mi Coronel.');
    d.cam([-10.6, 1.45, -4.4], [-9, 1.2, -6.5]);
    await d.say('Colonel', 'Six years, Gonzalez. The General had plans for you.');
    await d.say('Emilio', 'Then the General will understand that a man cannot serve with half a heart.');
    await d.say('Colonel', '…*signs* Dismissed. Civilian.');
    d.pose(e, 'salute', 1, 0.3);
    d.cam([-6.8, 1.8, -2.6], [-9, 1.4, -4.2]);
    await sleep(d, 1.5);
    G.take('idcard');
    G.take('pistol');
    await d.fadeOut(0.8);
    await d.card('March 1982', 'Emilio Gonzalez leaves the army with a medical discharge —\nand almost every peso he has ever earned.');
  },

  // ---------------------------------------------------------- Chapter III
  async opening(d, G) {
    await d.card('Los Pollos Hermanos', 'Santiago — 1984');
    d.set('pollos');
    const e = d.actor('emilio', 'emilioCivil', -2.2, 7.4, 0);
    const m = d.actor('mateo', 'max', 2.2, 7.4, 0);
    const crowd = [];
    for (let i = 0; i < 7; i++) crowd.push(d.actor('c' + i, G.randomLook(), -6 + i * 2, 1.5 + (i % 2), 0));
    d.cam([0, 2, -2], [0, 3.8, 9], { to: [0, 1.8, 1.0], lookTo: [0, 6.0, 9], dur: 6 });
    G.addPesos(-450000, 'Invested in Los Pollos Hermanos');
    await sleep(d, 2.4);
    d.face(e, crowd[3]); d.face(m, crowd[3]);
    d.cam([1, 1.8, 3.2], [0, 1.6, 7.4]);
    await d.say('Mateo', 'Look at them. Our first customers.');
    await d.say('Emilio', 'Our first alibi.');
    crowd.forEach((c, i) => { d.walk(c, -1 + (i % 3), 8.2, 1.2 + i * 0.1).then(() => d.drop('c' + i)); });
    await d.say('Mateo', 'Your mother would be proud.');
    await d.say('Emilio', 'My mother would ask why the fries cost so much.');
    await d.say('Mateo', '*laughs* Los Pollos Hermanos. Two brothers.');
    await d.say('Emilio', 'Two brothers. One cooks the chicken. One cooks… the chicken.');
    await sleep(d, 0.8);
    await d.say('Mateo', 'Now go put on an apron, Señor Gonzalez. The lunch rush waits for nobody.');
  },

  async peter(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const e = d.actor('emilio', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    const p = d.actor('peter', 'peter', 0, 0, 0); sitAt(p, 4.1, 1.5, Math.PI / 2);
    d.cam([2.6, 1.8, 3.6], [4.4, 1.1, 1.5]);
    await d.walk(e, 4.9, 2.7, 1.3);
    d.face(e, p);
    standUp(d, p, 0.5); await sleep(d, 0.5);
    d.face(p, e);
    d.cam([5.7, 1.6, 3.1], [4.1, 1.5, 1.5]);
    await d.say('Peter Schuler', 'Mr. Gonzalez. Peter Schuler. Madrigal Electromotive — Hannover.');
    d.cam([3.3, 1.65, 1.0], [4.9, 1.6, 2.7]);
    await d.say('Emilio', 'Madrigal. Industrial equipment.');
    d.cam([5.7, 1.6, 3.1], [4.1, 1.5, 1.5]);
    await d.say('Peter Schuler', 'Among many things. My company sent me to Chile to scout for partners. Your government is very open to business — for the right partners.');
    await d.say('Emilio', 'I sell chicken, Mr. Schuler.');
    await d.say('Peter Schuler', 'You sell a great deal of chicken. More than any restaurant with eleven tables should.');
    await sleep(d, 0.6);
    await d.say('Peter Schuler', 'Relax. I am not the police. I have eaten here four times. Your fryers are German, your books are immaculate — and your partner is a chemist the Carabineros were once very eager to find.');
    d.cam([3.3, 1.65, 1.0], [4.9, 1.6, 2.7]);
    const c = await d.choose(['"What do you want?"', '"You should leave, Mr. Schuler."', '"Have you tried the papas fritas?"'], 0, 'Respond');
    d.cam([5.7, 1.6, 3.1], [4.1, 1.5, 1.5]);
    if (c === 0) await d.say('Peter Schuler', 'Want? Nothing — today. Madrigal admires efficiency and discretion. You have both.');
    else if (c === 1) await d.say('Peter Schuler', 'I will. But you should hear why I came first.');
    else await d.say('Peter Schuler', '*smiles* Three times. Excellent. Slightly too much salt.');
    await d.say('Peter Schuler', 'Men like you are rare, Mr. Gonzalez. Patient. Careful. Invisible. I would like to watch you grow.');
    await d.say('Peter Schuler', 'And one day — when you need a friend outside of Chile, and you will — I would like you to remember who sat at this table.');
    d.pose(p, 'point', 0.6, 0.3);
    G.give('madrigal');
    await sleep(d, 0.6);
    d.pose(p, 'point', 0, 0.3);
    d.walk(p, 0, 4.4, 1.3).then(() => d.drop('peter'));
    d.cam([3.4, 1.7, 0.6], [4.9, 1.6, 2.7], { to: [3.6, 1.6, 0.9], dur: 3 });
    await sleep(d, 1.6);
    await d.say('Emilio', '…Mateo. Who else has noticed us?');
    await d.fadeOut(0.8);
  },

  // ---------------------------------------------------------- Chapter IV
  async revolt(d, G) {
    await d.card('1986', 'Chile rises. Strikes, barricades and burning tires spread across Santiago.\nIn the poblaciones, people have started saying names out loud.', 4.5);
    d.set('riot');
    const mob = [];
    for (let i = 0; i < 12; i++) {
      const a = d.actor('m' + i, i % 3 ? 'rioter' : G.randomLook(), -7 + (i % 6) * 2.6, -6 - Math.floor(i / 6) * 2.2, 0);
      a.animSpeed = 1.6 + Math.random();
      if (i % 2) d.pose(a, 'handsUp', 0.6 + Math.random() * 0.4, 0);
      mob.push(a);
    }
    d.cam([6, 3, -20], [0, 2, -5], { to: [4, 2.4, -14], dur: 6 });
    await d.say('Crowd', '¡Y va a caer! ¡Y va a caer!');
    d.cam([-8, 4, 4], [0, 3, 12], { to: [-4, 3.5, 2], dur: 4 });
    await d.say('Crowd', '¡Gonzalez! ¡Asesino! ¡Sal de ahí!');
    await d.fadeOut(0.6);
    for (let i = 0; i < 12; i++) d.drop('m' + i);
    d.set('pollosIn');
    G.setMood('night');
    const e = d.actor('emilio', 'emilioCivil', -2.6, -2.0, 0);
    const m = d.actor('mateo', 'max', -0.6, -2.1, 0);
    d.cam([1.4, 1.8, 1.2], [-1.6, 1.3, -2.4]);
    await d.fadeIn(0.6);
    await d.say('Radio', '“…protesters have named former officers accused of crimes in the poblaciones. Among them, retired General Emilio Gonzalez, formerly of the Centro de Investigación Militar…”');
    d.face(m, e); d.face(e, m);
    await d.say('Mateo', 'They know, Emilio. The facility. The product. Someone talked.');
    sfx.thump(); G.shake = 0.3;
    await d.say('', '*Fists hammer on the front windows.*');
    await d.say('Emilio', 'Lights off. Away from the glass.');
    await d.say('', '*The telephone behind the counter rings.*');
    d.walk(e, -3.6, -2.4, 1.6);
    await sleep(d, 1.0);
    d.pose(e, 'salute', 0.6, 0.3);
    await d.say('Peter Schuler (phone)', 'Mr. Gonzalez. You have perhaps ten minutes before they come through your windows.');
    await d.say('Peter Schuler (phone)', 'There is a black car waiting at the north end of Avenida Matta. Go out through the back. Do not stop for anything.');
    await d.say('Emilio', 'And then?');
    await d.say('Peter Schuler (phone)', 'And then Emilio Gonzalez dies tonight. Go.');
    d.pose(e, 'salute', 0, 0.3);
    await d.say('Emilio', 'Mateo. Stay behind me. Whatever happens — keep moving.');
    await d.fadeOut(0.6);
    G.setMood(null);
  },

  async newNames(d, G) {
    d.set('airstrip');
    const plane = G.loc.plane;
    plane.position.set(-3, 0, -30); plane.rotation.y = Math.PI;
    const p = d.actor('peter', 'peter', 11, 6.0, -1.8);
    const e = d.actor('emilio', 'emilioCivil', 13.6, 10.5, Math.PI);
    const m = d.actor('mateo', 'max', 15.0, 10.4, Math.PI);
    d.cam([4, 2.2, 14], [11, 1.4, 7]);
    await d.fadeIn(0.8);
    d.walk(m, 12.6, 7.8, 1.3);
    await d.walk(e, 11.4, 7.6, 1.3);
    d.face(e, p); d.face(m, p); d.face(p, e);
    d.cam([9.6, 1.7, 5.0], [11.6, 1.6, 7.6]);
    await d.say('Peter Schuler', 'Your car was found burning on Avenida Matta an hour ago. Two bodies inside. Very sad.');
    await d.say('Mateo', 'Whose bodies?');
    await d.say('Peter Schuler', 'Does it matter?');
    d.pose(p, 'point', 0.7, 0.3);
    await d.say('Peter Schuler', 'Maximino Arciniega. Chemist. You hate the photo; everyone does.');
    G.give('passportM');
    await d.say('Peter Schuler', 'And Gustavo Fring. Born in Santiago, citizen of nowhere in particular. Restaurateur.');
    G.give('passportG');
    d.pose(p, 'point', 0, 0.3);
    d.cam([12.6, 1.65, 9.6], [11.4, 1.6, 7.6]);
    await d.say('Gustavo', 'Gustavo.');
    await d.say('Gustavo', '…Gustavo Fring.');
    d.cam([9.6, 1.7, 5.0], [11.6, 1.6, 7.6]);
    await d.say('Peter Schuler', 'Mexico first. Then, perhaps, the United States. Madrigal will be in touch.');
    await d.say('Gustavo', 'Why, Mr. Schuler? Why do all this?');
    await d.say('Peter Schuler', 'Because men who can disappear completely are very rare. And very valuable.');
    await d.fadeOut(0.6);
    d.drop('peter'); d.drop('emilio'); d.drop('mateo');
    let t = 0;
    d.every((dt) => { t += dt; plane.position.z -= dt * (8 + t * 9); if (t > 3) { plane.position.y += dt * (t - 3) * 4; plane.rotation.x = Math.min(0.25, (t - 3) * 0.1); } });
    d.camWith((tt, cam) => { cam.position.set(18, 1.2, -60); cam.lookAt(plane.position.x, plane.position.y + 1.5, plane.position.z); });
    await d.fadeIn(0.6);
    await sleep(d, 6.5);
    await d.fadeOut(0.8);
    await d.card('They left Chile that night.', 'Emilio Gonzalez and Mateo Zagal were declared dead in the protests of 1986.\nNo one ever looked for their bodies.', 5);
  },

  // ---------------------------------------------------------- Chapter V
  async mexico(d, G) {
    await d.card('Mexico', '1989 — Three years later.\nLos Pollos Hermanos has crossed the border. So has the product.', 4.5);
    d.set('hacienda');
    d.cam([-20, 12, 34], [0, 0, -10], { to: [-12, 8, 26], dur: 7 });
    await d.fadeIn(0.8);
    await sleep(d, 2.5);
    const g = d.actor('gus', 'emilioCivil', -0.8, 33.5, Math.PI);
    const m = d.actor('max', 'max', 0.9, 33.5, Math.PI);
    d.cam([0, 1.7, 29], [0, 1.6, 33.5]);
    await d.say('Max', 'He is the most powerful man in Mexico, Gustavo. Let me do the talking. Don Eladio likes me.');
    await d.say('Gustavo', 'That is what worries me.');
    await d.say('Max', '*grins* Relax, Generalísimo. We came to ask permission. Like gentlemen.');
    await d.say('Gustavo', 'Don’t call me that. Not here. Not ever.');
  },

  async finale(d, G) {
    G.hideHero(true);
    const g = d.actor('gus', 'emilioCivil', G.player.pos.x, G.player.pos.z, G.player.modelYaw);
    const m = d.actor('max', 'max', G.player.pos.x + 0.8, G.player.pos.z + 0.6, G.player.modelYaw);
    const el = d.actor('eladio', 'eladio', 0, 0, 0); sitAt(el, 11.9, -7, -Math.PI / 2);
    const h = d.actor('hector', 'hector', 10.8, -4.2, Math.PI);
    const s1 = d.actor('s1', 'cartel', 13.5, -9.5, -2.5);
    const s2 = d.actor('s2', 'cartel', 13.6, -4.5, -0.8);
    d.cam([4, 3, -1], [11, 1.2, -7]);
    const gp = G.player.pos;
    const entry = gp.x > 9 ? [] : [[Math.max(gp.x, -9.5), 0.6], [9.6, 0.6]];
    d.walkPath(m, [...entry.map(([x, z]) => [x + 0.8, z - 0.4]), [9.0, -2.4], [9.4, -6.0]], 1.5);
    await d.walkPath(g, [...entry, [9.9, -2.6], [9.6, -8.0]], 1.5);
    d.face(g, el); d.face(m, el); d.face(h, m);
    d.cam([9.6, 1.4, -7.0], [11.9, 1.2, -7]);
    await d.say('Don Eladio', '¡Los Pollos Hermanos! Come, come. Sit— no. No, stand. You look good standing.');
    await d.say('Don Eladio', 'You know what I hear, Gustavo? I hear the chicken is very good. And I hear the other thing is even better.');
    d.cam([11.4, 1.6, -5.2], [9.4, 1.6, -6.4]);
    await d.say('Max', 'Don Eladio, our product is the purest you will find anywhere—');
    d.cam([9.6, 1.4, -7.0], [11.9, 1.2, -7]);
    await d.say('Don Eladio', 'I wasn’t talking to you, Max.');
    await d.say('Don Eladio', 'Gustavo Fring. Restaurant man from… Santiago, no? Funny thing. I have friends in Chile. Old friends from the regime.');
    await d.say('Don Eladio', 'They tell me a story about a General. A very careful man. Never spent a peso. Ran a little laboratory for Pinochet… and then — ¡poof! Dead in the riots.');
    d.cam([11.6, 1.65, -8.4], [9.4, 1.6, -8.0]);
    await sleep(d, 0.8);
    d.cam([9.6, 1.4, -7.0], [11.9, 1.2, -7]);
    await d.say('Don Eladio', '*laughing* ¡El Generalísimo! In my house!');
    await d.say('Hector', '*laughs*');
    d.cam([11.6, 1.65, -8.4], [9.4, 1.6, -8.0]);
    const c = await d.choose(['"I don’t know what you mean, Don Eladio."', '"That man is dead."', 'Say nothing.'], 2, 'Gustavo');
    d.cam([9.6, 1.4, -7.0], [11.9, 1.2, -7]);
    if (c === 0) await d.say('Don Eladio', 'No? No, of course not. Nobody knows anything. That is the beauty of Mexico.');
    else if (c === 1) await d.say('Don Eladio', 'Sí, sí. Very dead. I am dead too. Hector? Dead. Everybody is dead.');
    else await d.say('Don Eladio', 'Look at that face. Like a statue. Like a general on a horse.');
    await d.say('Don Eladio', 'You came to my country. You sold your product in my plazas. Without asking. Cheaper than mine.');
    await d.say('Don Eladio', 'You undercut me, Max. You know what that is? That is disrespect.');
    d.cam([11.4, 1.6, -5.2], [9.4, 1.6, -6.4]);
    await d.say('Max', 'Don Eladio — that is why we came. To ask, to make it right—');
    d.cam([9.6, 1.4, -7.0], [11.9, 1.2, -7]);
    await d.say('Don Eladio', 'Hector.');
    // Hector moves behind Max; the sicarios seize Gus
    d.walk(h, 9.9, -4.9, 1.6);
    d.walk(s1, 10.2, -8.6, 2.4); d.walk(s2, 8.7, -8.8, 2.4);
    d.cam([5.0, 2.0, -7.0], [9.4, 1.3, -7.0]);
    await sleep(d, 1.2);
    d.face(s1, g); d.face(s2, g);
    await d.say('Gustavo', 'No — Don Eladio! It was my decision. Mine! He only does what I—');
    await d.prompt('Break free!');
    d.pose(g, 'guard', 1, 0.1);
    await sleep(d, 0.3);
    d.pose(g, 'guard', 0, 0.2);
    d.pose(g, 'sit', 0.6, 0.25);
    g.noCollide = true;
    sfx.thud();
    await d.say('', '*They force you to your knees.*');
    d.cam([5.2, 1.7, -10.5], [8.8, 0.9, -6.4]);
    await sleep(d, 0.9);
    sfx.gunshot();
    G.flash();
    G.shake = 0.5;
    d.pose(m, 'hurt', 1, 0.05);
    // Max falls backward into the pool
    m.noCollide = true;
    m.extraRot.x = -0.5;
    await movePath(d, { position: m.pos, rotation: {} }, [[8.7, 0.25, -6.0], [7.2, -0.55, -6.0]], 4);
    m.extraRot.x = -1.35;
    sfx.splash();
    await sleep(d, 1.8);
    d.cam([5.6, 1.4, -10.4], [7.6, -0.1, -6.3], { to: [6.2, 1.2, -9.6], dur: 6 });
    await d.say('Don Eladio', 'Look at him, Generalísimo. Look.');
    await d.say('Don Eladio', 'You are alive only because I know who you were. In Chile, you were a General. Here — you are a man who sells chicken.');
    await d.say('Don Eladio', 'Remember that.');
    await sleep(d, 1.2);
    await d.fadeOut(1.4);
    await d.card('', 'Gustavo Fring buried his partner in Mexico.\nHe did not cry. He did not forget.\nHe waited.', 6);
    G.endGame();
  },
};

// ================================================================ conversations (in-play)
export const CONVOS = {
  async rosa(T, G) {
    await T.say('Señora Rosa', 'Emilio! So it is true — you are leaving for Santiago?');
    await T.say('Emilio', 'Today, Señora.');
    await T.say('Señora Rosa', 'Then listen to an old woman: stay on the big streets. The Callejón boys are out, and they can smell a full pocket.');
    await T.say('Señora Rosa', 'Down the pasaje, up Avenida Altamirano, right on Calle Estación. Long way is the safe way, mijo.');
  },
  async kidLines(T) { await T.say('Niño', 'Are you going to Santiago?'); },
  async ticket(T, G) {
    await T.say('Ticket Clerk', 'Santiago? Train leaves within the hour. First class or third?');
    const opts = [`First class — $ 640`, `Third class — $ 180`];
    let c = await T.choice(opts, 'Buy a ticket');
    if (c === 0) {
      await T.say('Emilio', '…');
      await T.say('Emilio', 'No. Third class. The bench will hold me the same.');
    }
    if (G.pesos < 180) { await T.say('Ticket Clerk', 'No money, no train.'); return; }
    G.addPesos(-180, 'Third-class ticket');
    G.give('ticket');
    await T.say('Ticket Clerk', 'Andén 2. Don’t lose it.');
    G.emit('bought');
  },
  async ledger(T, G) {
    if (!G.has('ledger')) G.give('ledger');
    await T.say('Ledger', 'Rent: 4.000. Bread: 12 a day. Bus: walked instead — saved 30.');
    await T.say('Ledger', 'Coffee: no. Cinema: no. New shoes: resoled instead.');
    await T.say('Ledger', `Total saved: $ ${(812400).toLocaleString('es-CL')}.`);
    await T.say('Emilio', 'Almost enough.');
  },
  async ernesto(T, G, S) {
    if (S.flag('paid:ernesto')) { await T.say('Don Ernesto', '…Buenos días, mi General.'); return; }
    if (!S.at('collect')) { await T.say('Don Ernesto', '¿Pan, mi General? Fresh this morning.'); return; }
    await T.say('Don Ernesto', 'Buenos días, mi General. ¿Pan? Fresh this morning.');
    await T.say('Emilio', 'Not bread, Don Ernesto. The contribution.');
    await T.say('Don Ernesto', 'Again? I paid the Carabineros on Monday—');
    await T.say('Emilio', 'The Carabineros protect your windows. I protect your name from certain lists.');
    const c = await T.choice(['"Five thousand. Today."', '"Ten thousand. You know why."'], 'Shake him down');
    G.addPesos(c === 0 ? 5000 : 10000, 'Don Ernesto\u2019s contribution');
    if (c === 1) await T.say('Don Ernesto', '*his hands shake as he counts* …Ten. Ten thousand.');
    await T.say('Emilio', 'Gracias, Don Ernesto. Your bread smells wonderful.');
    G.setFlag('paid:ernesto'); G.emit('paid');
  },
  async ines(T, G, S) {
    if (S.flag('paid:ines')) { await T.say('Señora Inés', '*She will not look at you.*'); return; }
    if (!S.at('collect')) { await T.say('Señora Inés', 'Buenos días, General.'); return; }
    await T.say('Señora Inés', 'General… my husband is sick. I cannot pay this month. Por favor.');
    const c = await T.choice(['"Then next month you pay double."', '"Your brother-in-law was at the protest in Plaza Italia, I believe."', '"…Keep it. This once."'], 'Señora Inés');
    if (c === 0) {
      await T.say('Emilio', 'Interest, Señora. It is a very modern economy now. Ask the radio.');
      await T.say('Señora Inés', '…Take it. Take what there is.');
      G.addPesos(4000, 'Señora Inés\u2019s contribution');
    } else if (c === 1) {
      await T.say('Señora Inés', '*She goes very pale.* …How much?');
      await T.say('Emilio', 'Eight thousand. And I forget what I know.');
      G.addPesos(8000, 'Señora Inés\u2019s contribution');
    } else {
      await T.say('Emilio', '…');
      await T.say('Emilio', 'No. Exceptions are how men like me disappear. Six thousand.');
      await T.say('Señora Inés', '*She empties the drawer without a word.*');
      G.addPesos(6000, 'Señora Inés\u2019s contribution');
    }
    G.setFlag('paid:ines'); G.emit('paid');
  },
  async jacobo(T, G, S) {
    if (S.flag('paid:jacobo')) { await T.say('Don Jacobo', '…'); return; }
    if (!S.at('collect')) { await T.say('Don Jacobo', 'We are closed.'); return; }
    await T.say('Don Jacobo', 'You again. I fought in no war, and I pay no General. Get out of my shop.');
    const c = await T.choice(['Make an example of him', 'Call over the Carabineros'], 'Don Jacobo refuses');
    if (c === 0) {
      await T.say('', '*You take the glasses off his face and fold them, carefully, into his shirt pocket.*');
      await T.say('Emilio', 'Don Jacobo. In 1974 they took the man who owned this shop before you. Do you know where he is now?');
      await T.say('Don Jacobo', '…No.');
      await T.say('Emilio', 'Neither does his wife.');
      await T.say('Don Jacobo', '*He opens the till.* …Twelve thousand. It\u2019s all of it.');
      G.addPesos(12000, 'Don Jacobo\u2019s contribution');
    } else {
      await T.say('Emilio', '¡Sargento! This man has insulted the Army of Chile.');
      await T.say('Don Jacobo', '¡No, no, no! Wait — here. Here. Take it.');
      G.addPesos(9000, 'Don Jacobo\u2019s contribution');
      await T.say('Emilio', 'Never mind, Sargento. A misunderstanding.');
    }
    G.setFlag('paid:jacobo'); G.emit('paid');
  },
  async empanada(T, G) {
    await sellFood(T, G, 'Don Lucho', 'empanada', '¡Empanadas de pino! Hot from the oven! For you, mi General — only three hundred pesos.');
  },
  async carmen(T, G) {
    await sellFood(T, G, 'Doña Carmen', 'sopaipilla', '¡Sopaipillas calentitas! Thirty pesos, Emilio. For the road to Santiago.');
  },
  async waiter(T, G) {
    await sellFood(T, G, 'Waiter', 'pollo', '¡Bienvenido a Los Pollos Hermanos! A quarter pollo asado, señor?');
  },
  async shoeshine(T, G) {
    await T.say('Lustrabotas', 'Shine, mi General? Make the boots sparkle for the Colonel!');
    const c = await T.choice(['Pay for a shine ($ 150)', '"I polish my own boots."'], 'Lustrabotas');
    if (c === 0) {
      G.addPesos(-150, 'Shoeshine');
      await T.say('Lustrabotas', '*polishes furiously* ¡Gracias, mi General! First time you ever said yes!');
      await T.say('Emilio', 'And the last. Do not tell anyone.');
    } else await T.say('Lustrabotas', 'Every morning at five, I know, I know…');
  },
  async mateoPlan(T, G, S) {
    if (S.at('launder')) {
      await T.say('Mateo', 'The board, Emilio. Pick a front we can live with.');
      return;
    }
    await T.say('Mateo', 'So! A free man. A civilian. How does it feel?');
    await T.say('Emilio', 'Expensive.');
    await T.say('Mateo', 'And what will you do with your famous savings? Open a shoe store?');
    await T.say('Emilio', 'A business. Small. Respectable.');
    await T.say('Mateo', 'Respectable.');
    await T.say('Mateo', 'Emilio. Do you know how much the regime makes from one batch of what I cook? One?');
    await T.say('Emilio', 'I signed the requisitions. I can guess.');
    await T.say('Mateo', 'Now imagine it was ours. Purer than theirs. And I know every buyer the Carabineros sell to.');
    const opts = [{ text: '"You want me to become a criminal."' }, { text: '"How much purer?"' }, { text: '"The regime would kill us."' }, { text: '"…Go on."' }];
    for (;;) {
      const c = await T.choice(opts, 'The idea');
      if (c === 3) break;
      opts[c].used = true;
      if (c === 0) await T.say('Mateo', 'You lied to the Carabineros, bribed a doctor and stole yourself out of the army. You are already a criminal, Emilio. A very careful one.');
      if (c === 1) await T.say('Mateo', 'Ninety-six percent. Nobody in South America comes close. Nobody.');
      if (c === 2) await T.say('Mateo', 'The regime is busy. The regime is old. And the regime does not know what we know about it.');
    }
    await T.say('Emilio', 'If we do this, we do it my way. No flash. No mistakes. No one ever sees the money.');
    await T.say('Mateo', 'Then we need a way to wash it.');
    await T.say('Emilio', '…We need a front.');
    G.emit('talk:mateoPlan');
  },
  async launder(T, G) {
    const ideas = [{ text: 'A laundromat' }, { text: 'A car wash' }, { text: 'A taxi company' }, { text: 'A chain of restaurants' }];
    for (;;) {
      const c = await T.choice(ideas, 'How do you launder the money?');
      if (c === 0) {
        await T.say('Mateo', 'Every launderer in Santiago owns a laundromat. It is the first place the investigators look.');
        await T.say('Emilio', 'Too obvious.');
      } else if (c === 1) {
        await T.say('Emilio', 'A cash business. Cars come and go all day.');
        await T.say('Mateo', 'One car wash cannot clean what I will cook. We would need fifty.');
        await T.say('Emilio', 'Too small.');
      } else if (c === 2) {
        await T.say('Mateo', 'Half the taxi drivers in this city report to the CNI.');
        await T.say('Emilio', 'Too many eyes.');
      } else {
        if (G.has('photo')) {
          await T.say('', '*You take out the photo of Mamá and turn it over. Her recipe, in her handwriting.*');
          await T.say('Emilio', 'Pollo asado. My mother’s.');
        } else await T.say('Emilio', 'Chicken.');
        await T.say('Mateo', 'Chicken?');
        await T.say('Emilio', 'Everyone eats chicken. Rich, poor, soldiers, Carabineros. A restaurant takes cash all day long — and if you open more than one, no one can ever count the customers.');
        await T.say('Mateo', 'Two men selling chicken. Like brothers.');
        await T.say('Emilio', 'Los Pollos Hermanos.');
        await T.say('Mateo', 'We are not brothers.');
        await T.say('Emilio', 'We are now.');
        G.emit('laundered');
        return;
      }
      ideas[c].used = true;
    }
  },
  async doctor(T, G) {
    await T.say('Dr. Herrera', 'General Gonzalez. You look… perfectly healthy.');
    await T.say('Emilio', 'Appearances deceive, Doctor. My heart is very weak.');
    await T.say('Dr. Herrera', '*takes off his glasses* Is it. A medical discharge for a General requires a very… thorough diagnosis.');
    const opts = [{ text: 'Offer $ 50.000' }, { text: 'Remind him who you are' }, { text: 'Offer $ 150.000' }];
    for (;;) {
      const c = await T.choice(opts, 'Bribe the doctor');
      if (c === 0) {
        await T.say('Dr. Herrera', '*laughs* For fifty thousand I can diagnose you with a head cold, General.');
      } else if (c === 1) {
        await T.say('Emilio', 'You know who signs this facility’s budget, Doctor.');
        await T.say('Dr. Herrera', 'And you know who reads my reports. Threaten me, General, and the first thing I diagnose is your loyalty.');
      } else {
        await T.say('Emilio', '…');
        await T.say('Emilio', 'One hundred. And fifty. Thousand.');
        G.addPesos(-150000, 'Paid Dr. Herrera');
        G.give('certificate');
        await T.say('Dr. Herrera', 'Chronic cardiac arrhythmia. Very serious. You must retire immediately, General.');
        await T.say('Emilio', '*under his breath* Thief.');
        await T.say('Dr. Herrera', 'Specialist.');
        G.emit('bribed');
        return;
      }
      opts[c].used = true;
    }
  },
  // ---------------------------------------------------------- boot camp (Regimiento Tacna)
  async sergeant(T, G, S) {
    if (S.at('bcReport')) {
      await T.say('Sargento Muñoz', '¡Gonzalez! The boy from the cerros. You are late — by eleven seconds.');
      await T.say('Emilio', 'Sí, mi Sargento.');
      await T.say('Sargento Muñoz', 'Today: the course. Around both barracks, behind them, along the north fence and back to me. Under fifty-two seconds.');
      await T.say('Sargento Muñoz', 'Díaz López runs with you. His uncle is a colonel, so he thinks he is already an officer. Make him sweat.');
      G.emit('bc:report');
      return;
    }
    if (S.at('bcCourse')) {
      if (G.ow.run) return;
      await T.say('Sargento Muñoz', 'Follow the markers. Run — hold Shift — and do not stop for anything. Ready, recruit?');
      const c = await T.choice(['"Ready."', '"Not yet, mi Sargento."'], 'The course');
      if (c !== 0) { await T.say('Sargento Muñoz', 'The enemy will not wait for you to be ready. Neither will I. Come back fast.'); return; }
      G.ow.startRun({
        label: 'Obstacle course', time: 52, noRivalLose: true, rival: { look: 'victor', name: 'Víctor', time: 46 },
        points: [[-16, -15], [-36, -15], [-36, 32], [0, 35], [36, 32], [36, -15], [4, 2]],
        onWin: (r) => {
          if (r.beatRival) { G.setFlag('bc:beatVictor'); G.ui.toast(`${r.time.toFixed(1)} s — ahead of Víctor`, '¡Así se hace!'); }
          else G.ui.toast(`${r.time.toFixed(1)} s — Víctor beat you`, 'Course passed');
          G.emit('bc:course');
        },
        onLose: (why) => { if (why === 'time') G.ui.toast('Too slow, Gonzalez! Talk to the sergeant and run it again.', 'Failed', true); },
      });
      return;
    }
    if (S.at('bcRations')) {
      await T.say('Sargento Muñoz', S.flag('bc:beatVictor') ? 'Not bad. You beat a colonel’s nephew. He will not thank you for it.' : 'You passed. Barely. Díaz López is telling everyone he waited for you at the finish.');
      await T.say('Sargento Muñoz', 'Now. Bread is disappearing from the mess every night. Find out who. Quietly. The mess tables, by the west barracks.');
      return;
    }
    if (S.at('bcVictor')) {
      await T.say('Sargento Muñoz', 'Díaz López was asking where you were. Behind the west barracks, he said.');
      await T.say('Sargento Muñoz', '…I did not hear that, and I will not hear anything that happens back there. Understood, recruit?');
      return;
    }
    await T.say('Sargento Muñoz', '¡Muévase, recluta!');
  },
  async tomas(T, G, S) {
    if (!S.at('bcRations')) {
      if (S.flag('tomas:covered')) { await T.say('Tomás Quiroga', 'I owe you, Gonzalez. Quiroga pays his debts. Always.'); return; }
      if (S.flag('tomas:partner')) { await T.say('Tomás Quiroga', 'Two loaves tonight. Same as yesterday. Your half is under your mattress.'); return; }
      await T.say('Tomás Quiroga', 'Tomás. From Temuco. My mother thinks the army feeds you like a king. *He laughs. It is not funny.*');
      return;
    }
    await T.say('', '*Tomás jumps when he sees you. There is a lump under his shirt the size of a loaf of bread.*');
    await T.say('Tomás Quiroga', 'Gonzalez. It’s not… My mother and three sisters, in Temuco. Half my pay goes home and it is still not enough.');
    await T.say('Tomás Quiroga', 'Two loaves a night. Nobody even counts them. Please.');
    const c = await T.choice(['"I have to report you."', '"The dogs got into the mess. That is what I will tell the sergeant."', '"Steal four. I sell the extra in town. We split it."'], 'Tomás Quiroga');
    if (c === 0) {
      await T.say('Emilio', 'Rules are what keep men like us alive, Tomás. I am sorry.');
      await T.say('Tomás Quiroga', '*He does not argue. He just looks at you, the way the cerro looks at soldiers.*');
      G.setFlag('tomas:reported'); G.stat('fear');
    } else if (c === 1) {
      await T.say('Tomás Quiroga', '…I won’t forget this, Gonzalez. Never.');
      G.setFlag('tomas:covered'); G.stat('mercy');
    } else {
      await T.say('Tomás Quiroga', 'You… want to sell it?');
      await T.say('Emilio', 'Bread is worth more outside the fence than inside. You take the risk; I find the buyers. Your sisters eat. So do I.');
      await T.say('Tomás Quiroga', '*He laughs, nervously.* You are a strange one, cerro.');
      G.addPesos(120, 'Your half of the bread');
      G.setFlag('tomas:partner');
    }
    G.emit('bc:rations');
    G.refresh();
  },
  async victorIdle(T) {
    await T.say('Víctor Díaz López', 'You. Cerro. Do you know who my uncle is?');
    await T.say('Emilio', 'Everyone knows who your uncle is. You make sure of it.');
    await T.say('Víctor Díaz López', '*His smile goes thin.* We will talk later, you and I.');
  },

  // ---------------------------------------------------------- Los Pollos Hermanos (Mateo)
  async mateoShift(T, G, S) {
    const n = S.stat('shiftN');
    await T.say('Mateo', n === 0 ? 'Two hands, Emilio! The counter. Take the order, say it back, get it right. Like a requisition, but with napkins.' : 'Keep going! Smile — no, not like that. Like a human being.');
  },
  async counter(T, G, S) {
    if (counterBusy || S.stat('shiftN') >= SHIFT_ORDERS.length) return;
    counterBusy = true;
    try {
      const order = SHIFT_ORDERS[S.stat('shiftN')];
      const a = G.ow.addWalker(G.randomLook(), 0, 4.2, Math.PI);
      G.ow.walkTo(a, 3.15, 3.0, 3).then(() => G.ow.walkTo(a, 3.15, 0, 3)).then(() => G.ow.walkTo(a, -1.5, -1.95, 3)).then(() => { a.faceTo = G.player.pos; });
      await T.say('', '*The bell over the door rings. A customer walks up to the counter.*');
      await T.say('Customer', order.say);
      const wrong = SHIFT_ORDERS.filter((o) => o !== order).sort(() => Math.random() - 0.5).slice(0, 2).map((o) => o.answer);
      const opts = [order.answer, ...wrong].sort(() => Math.random() - 0.5);
      const c = await T.choice(opts, 'Ring it up');
      if (opts[c] === order.answer) {
        G.addPesos(order.price, 'Sale');
        G.stat('shiftGood');
        await T.say('Customer', pickLine(['¡Perfecto! Gracias.', 'Smells like my grandmother’s kitchen.', 'Fast! Like a soldier.']));
      } else {
        await T.say('Customer', '¿Qué? That is not what I asked for.');
        await T.say('Emilio', 'My apologies. It is on the house. *You fix it. It hurts.*');
      }
      G.stat('shiftN');
      G.ow.walkTo(a, 3.15, 0, 2.2).then(() => G.ow.walkTo(a, 3.15, 3.0, 2.2)).then(() => G.ow.walkTo(a, 0, 4.4, 2.2)).then(() => G.ow.dropWalker(a));
      if (S.stat('shiftN') >= SHIFT_ORDERS.length) {
        const good = S.stat('shiftGood');
        await T.say('Mateo', good >= 5 ? '¡Cinco de cinco! Emilio, you were born behind a counter.' : good >= 3 ? `${good} of five. For a General, not bad. For a chicken man, we will practice.` : 'Emilio. You gave a man a drink when he asked for chicken. Twice.');
        if (good >= 4) G.stat('bond');
        await T.say('Mateo', 'Now — the real work. I need chemicals, and I don’t want them delivered here. Come outside.');
        G.emit('p:shift');
      } else G.emit('order');
    } finally { counterBusy = false; }
  },
  async chemicals(T, G, S) {
    if (!S.at('pSupply')) return;
    await T.say('Don Beto', 'Ah — the cleaning fluid. For the restaurant, eh? *He winks. He does not ask.*');
    await T.say('', '*Four blue drums. You roll them onto a hand truck. Every eye on Avenida Matta follows you.*');
    G.give('chemicals');
    G.emit('chemicals');
  },
  async mateoSupply(T, G, S) {
    if (S.at('pSupply')) {
      await T.say('Mateo', 'Bodega San Pablo, at the east end. Don Beto thinks it is cleaning fluid. Let him think it.');
      await T.say('Mateo', 'And Emilio — Los Choros have been watching the avenue. A crew. Kids with knives. Be careful.');
      return;
    }
    if (!S.at('pAmbush')) return;
    await T.say('Mateo', 'Emilio! Your shirt — is that blood? Los Choros?');
    await T.say('Emilio', 'Someone told them what was in the drums. They were waiting.');
    const c = await T.choice(['"From now on, I make the runs. Not you. Never you."', '"Find out who talked. Then tell me. Only me."', '"You should have come with me."'], 'Mateo');
    if (c === 0) { await T.say('Mateo', '…You would do that? For me?'); await T.say('Emilio', 'You are the only one who can cook. That is all.'); await T.say('Mateo', '*He smiles. He doesn’t believe that is all.*'); G.stat('bond', 2); }
    else if (c === 1) { await T.say('Mateo', 'And then what will you do to him?'); await T.say('Emilio', 'Whatever is necessary.'); G.stat('fear'); }
    else { await T.say('Mateo', 'I am a chemist, Emilio, not a boxer.'); await T.say('Emilio', 'Then learn. Or stay inside.'); G.stat('bond', -1); }
    G.take('chemicals');
    await T.say('Mateo', '*He takes something wrapped in a dish towel from under the counter.* My father\u2019s revolver. After today, I want you to carry it.');
    await T.say('Emilio', 'I have not carried a gun since the army.');
    await T.say('Mateo', 'And look how peaceful your life has been since then.');
    G.give('revolver');
    G.emit('talk:mateoSupply');
  },
  async dinner(T, G, S) {
    await T.say('', '*Closing time. The chairs are up on every table but one. Two plates of pollo asado. Two glasses of cheap wine.*');
    await T.say('Mateo', 'Sit, sit. Our chicken. Our table. Our first good day.');
    await T.say('Mateo', 'Three years I have known you, Emilio, and I don’t know where you grew up. You never say.');
    const opts = ['Tell him about Cerro Barón — and Mamá', '"Nowhere worth remembering."'];
    const c1 = await T.choice(opts, 'Mateo');
    if (c1 === 0) {
      await T.say('Emilio', 'Valparaíso. Cerro Barón. A tin roof. My mother counted coins at the table every night — rent, food, nothing.');
      await T.say('Emilio', 'Once I threw an orange at a coati that was stealing from us. It was our dinner. She told me she had already eaten.');
      await T.say('Emilio', 'She had not eaten.');
      if (G.has('photo')) await T.say('', '*You put the photo of Mamá on the table. Mateo turns it over and reads the recipe on the back.*');
      await T.say('Mateo', '…This is her chicken. We have been selling your mother’s chicken.');
      await T.say('Emilio', 'Yes.');
      G.stat('bond', 2); G.setFlag('told:cerro');
    } else {
      await T.say('Mateo', '*He waits for more. There is no more.* …One day you will tell me.');
    }
    await T.say('Mateo', 'And when this is over — when we have enough — what then?');
    const c2 = await T.choice(['"Then we stop."', '"There is no such thing as enough."', '"Then you cook for people who deserve it."'], 'Mateo');
    if (c2 === 0) await T.say('Mateo', 'You say it like a man who has already decided not to.');
    else if (c2 === 1) { await T.say('Mateo', '*He puts his fork down.* That is the regime talking, Emilio. Not you.'); G.stat('fear'); }
    else { await T.say('Mateo', 'La Victoria. A kitchen where nobody pays. *He laughs.* You are a romantic, General.'); G.stat('bond'); }
    await T.say('Mateo', '*He raises his glass.* A los hermanos.');
    const c3 = await T.choice(['"A los hermanos."', '"To the business."'], 'The toast');
    if (c3 === 0) { await T.say('', '*The glasses touch. For a moment, neither of you is from anywhere.*'); G.stat('bond'); }
    else await T.say('Mateo', '…To the business, then.');
    await T.say('Mateo', 'Oh — Emilio. The German was here again today. Expensive shoes. Fourth time this month. He asked for you by name.');
    await T.say('Emilio', '…Then I suppose he likes the chicken.');
    await T.say('', '*Three weeks later.*');
    G.emit('talk:dinner');
  },
};

const SHIFT_ORDERS = [
  { say: 'Un cuarto de pollo y papas fritas, por favor. (A quarter chicken and fries.)', answer: 'Quarter chicken + fries — $ 1.200', price: 1200 },
  { say: 'El Combo Hermanos. And a smile, if you have one.', answer: 'Combo Hermanos — $ 1.300', price: 1300 },
  { say: 'Just a bebida, señor. I only came in for the shade.', answer: 'One drink — $ 200', price: 200 },
  { say: 'Two quarters of chicken. My husband eats like a horse.', answer: 'Two quarter chickens — $ 1.800', price: 1800 },
  { say: 'Papas fritas. Double. Don’t tell my doctor.', answer: 'Double fries — $ 600', price: 600 },
];
let counterBusy = false;
const pickLine = (a) => a[Math.floor(Math.random() * a.length)];

// Which conversation a "use" spot opens.
export const USE_CONVOS = { ticket: 'ticket', ledger: 'ledger', plan_board: 'launder', counter: 'counter', chemicals: 'chemicals' };

// ================================================================ beats
const SHOPS = [{ id: 'ernesto', x: -8.1, z: -29.75 }, { id: 'ines', x: -8.1, z: -17.25 }, { id: 'jacobo', x: 8.1, z: 44 }];
function nearestShop(S) {
  const left = SHOPS.filter((k) => !S.flag('paid:' + k.id));
  const p = S.playerPos?.() || { x: 0, z: 0 };
  left.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
  return left[0] ? { loc: 'santiago', x: left[0].x - Math.sign(left[0].x) * 0.9, z: left[0].z } : null;
}
const CH0 = 'Prologue · Valparaíso, 1964';
const CH1 = 'Chapter I · Cerro Barón';
const CH1B = 'Chapter I · Regimiento Tacna';
const CH2 = 'Chapter II · The General';
const CH3 = 'Chapter III · Los Pollos Hermanos';
const CH4 = 'Chapter IV · Blood in the Streets';
const CH5 = 'Chapter V · Generalísimo';

export const BEATS = [
  { id: 'prologue', type: 'scene', chapter: CH0, play: SCENES.prologue },
  { id: 'wake', type: 'scene', chapter: CH1, play: SCENES.wake },
  { id: 'savings', type: 'goal', chapter: CH1, look: 'emilio', text: 'Take your savings from under the mattress', loc: 'room1', spawn: 'bed',
    target: { loc: 'room1', x: -1.7, z: -1.0 }, done: (e) => e === 'pickup:savings', banner: true },
  { id: 'toStation', type: 'goal', chapter: CH1, look: 'emilio', text: 'Walk to Estación Barón and buy a train ticket — stay out of the alleys', loc: 'room1', spawn: 'door',
    target: { loc: 'barrio', x: 36, z: -70.4 }, done: (e) => e === 'bought' },
  { id: 'board', type: 'goal', chapter: CH1, look: 'emilio', text: 'Board the train to Santiago', loc: 'barrio', spawn: 'home',
    target: { loc: 'barrio', x: 48, z: -71.6 }, done: (e) => e === 'board' },
  { id: 'train', type: 'scene', chapter: CH1, play: SCENES.train },
  { id: 'enlist', type: 'scene', chapter: CH1, play: SCENES.enlist },
  // ---- boot camp (playable)
  { id: 'bcReport', type: 'goal', chapter: CH1B, look: 'emilioRecruit', text: 'Report to Sargento Muñoz on the parade ground', loc: 'cuartel', spawn: 'yard',
    target: { loc: 'cuartel', x: 4, z: 4.8 }, done: (e) => e === 'bc:report', banner: true },
  { id: 'bcCourse', type: 'goal', chapter: CH1B, look: 'emilioRecruit', text: 'Run the obstacle course in under 52 seconds — talk to the sergeant to start', loc: 'cuartel', spawn: 'yard',
    target: { loc: 'cuartel', x: 4, z: 4.8 }, done: (e) => e === 'bc:course' },
  { id: 'bcRations', type: 'goal', chapter: CH1B, look: 'emilioRecruit', text: 'Bread is going missing from the mess. Find out who — the mess tables by the west barracks', loc: 'cuartel', spawn: 'yard',
    target: { loc: 'cuartel', x: -18.2, z: 17.8 }, done: (e) => e === 'bc:rations' },
  { id: 'bcVictor', type: 'goal', chapter: CH1B, look: 'emilioRecruit', text: 'Víctor Díaz López wants a word — behind the west barracks', loc: 'cuartel', spawn: 'yard',
    target: { loc: 'cuartel', x: -36.5, z: 1.5 }, done: (e) => e === 'bc:behind' },
  { id: 'victorTalk', type: 'scene', chapter: CH1B, play: SCENES.victorTalk, inPlace: true },
  { id: 'bcFight', type: 'goal', chapter: CH1B, look: 'emilioRecruit', text: 'Fight Víctor Díaz López and his friends', loc: 'cuartel', spawn: 'keep',
    target: { loc: 'cuartel', x: -36.6, z: 4.6 }, done: (e) => e === 'won:bcVictor' },
  { id: 'rise', type: 'scene', chapter: CH2, play: SCENES.rise },
  { id: 'wake2', type: 'scene', chapter: CH2, play: SCENES.wake2 },
  { id: 'getId', type: 'goal', chapter: CH2, look: 'general', text: 'Take your service ID from the table', loc: 'house2', spawn: 'table',
    target: { loc: 'house2', x: 2.85, z: -1.9 }, done: (e) => e === 'pickup:idcard', banner: true },
  { id: 'collect', type: 'goal', chapter: CH2, look: 'general', loc: 'house2', spawn: 'table',
    text: (S) => `Collect \u201ccontributions\u201d from the shopkeepers on the avenue (${SHOPS.filter((k) => S.flag('paid:' + k.id)).length}/3)`,
    target: (S) => nearestShop(S), done: (e, S) => e === 'paid' && SHOPS.every((k) => S.flag('paid:' + k.id)), banner: true },
  { id: 'crime', type: 'goal', chapter: CH2, look: 'general', text: 'Thieves are robbing the market on Calle Agustinas — deal with them', loc: 'santiago', spawn: 'home',
    target: { loc: 'santiago', x: 33, z: 13 }, done: (e) => e === 'won:market' },
  { id: 'arrest', type: 'scene', chapter: CH2, play: SCENES.arrest, inPlace: true },
  { id: 'walkFacility', type: 'goal', chapter: CH2, look: 'general', text: 'Walk to the Centro de Investigación Militar', loc: 'santiago', spawn: 'keep',
    target: { loc: 'santiago', x: 0, z: -47 }, done: (e) => e === 'chase' },
  { id: 'chase', type: 'scene', chapter: CH2, play: SCENES.chase, inPlace: true },
  { id: 'gate', type: 'goal', chapter: CH2, look: 'general', text: 'Show your ID at the facility gate', loc: 'santiago', spawn: 'keep',
    target: { loc: 'santiago', x: 0, z: -47.4 }, done: (e) => e === 'gate' },
  { id: 'gateScene', type: 'scene', chapter: CH2, play: SCENES.gate },
  { id: 'office', type: 'goal', chapter: CH2, look: 'general', text: 'Go to your office', loc: 'facility', spawn: 'entry2',
    target: { loc: 'facility', x: -9, z: -5.0 }, done: (e) => e === 'desk' },
  { id: 'deskScene', type: 'scene', chapter: CH2, play: SCENES.desk, inPlace: true },
  { id: 'findMateo', type: 'goal', chapter: CH2, look: 'general', text: 'Search the chemistry lab for Mateo Zagal', loc: 'facility', spawn: 'office',
    target: { loc: 'facility', x: 9, z: -2.4 }, done: (e) => e === 'lab' },
  { id: 'mateoScene', type: 'scene', chapter: CH2, play: SCENES.mateo, inPlace: true },
  { id: 'montage', type: 'scene', chapter: CH2, play: SCENES.montage },
  { id: 'bribe', type: 'goal', chapter: CH2, look: 'general', text: 'Get a medical discharge from Dr. Herrera in the infirmary', loc: 'facility', spawn: 'entry',
    target: { loc: 'facility', x: -7, z: 5.0 }, done: (e) => e === 'bribed' },
  { id: 'resign', type: 'scene', chapter: CH2, play: SCENES.resign },
  { id: 'plan', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Talk to Mateo', loc: 'house2', spawn: 'door',
    target: { loc: 'house2', x: -0.5, z: 0.4 }, done: (e) => e === 'talk:mateoPlan', banner: true },
  { id: 'launder', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Use the board to choose a front for laundering the money', loc: 'house2', spawn: 'door',
    target: { loc: 'house2', x: 0.9, z: -2.4 }, done: (e) => e === 'laundered' },
  { id: 'opening', type: 'scene', chapter: CH3, play: SCENES.opening },
  // ---- the partnership (playable)
  { id: 'pShift', type: 'goal', chapter: CH3, look: 'emilioCivil', loc: 'pollosIn', spawn: 'counter', banner: true,
    text: (S) => `Lunch rush: take the orders at the counter (${S.stat?.('shiftN') || 0}/5)`,
    target: { loc: 'pollosIn', x: -1.5, z: -4.0 }, done: (e) => e === 'p:shift' },
  { id: 'pSupply', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Pick up Mateo\u2019s chemical drums at Bodega San Pablo, the east end of Avenida Matta', loc: 'pollos', spawn: 'door',
    target: { loc: 'pollos', x: 68.5, z: 8.2 }, done: (e) => e === 'chemicals' },
  { id: 'pAmbush', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Bring the drums back to Mateo outside Los Pollos', loc: 'pollos', spawn: 'bodega',
    target: { loc: 'pollos', x: 4, z: 6.6 }, done: (e) => e === 'talk:mateoSupply' },
  { id: 'pDinner', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Close up for the night — have dinner with Mateo', loc: 'pollosIn', spawn: 'entry',
    target: { loc: 'pollosIn', x: -4.5, z: 1.5 }, done: (e) => e === 'talk:dinner' },
  { id: 'meetPeter', type: 'goal', chapter: CH3, look: 'emilioCivil', text: 'Meet the German investor inside Los Pollos Hermanos', loc: 'pollos', spawn: 'door',
    target: { loc: 'pollosIn', x: 4.8, z: 1.6 }, done: (e) => e === 'peter' },
  { id: 'peterScene', type: 'scene', chapter: CH3, play: SCENES.peter, inPlace: true },
  { id: 'revolt', type: 'scene', chapter: CH4, play: SCENES.revolt },
  { id: 'escape', type: 'goal', chapter: CH4, look: 'emilioCivil', text: "Escape to Schuler's car at the north end of Avenida Matta", loc: 'riot', spawn: 'street',
    target: { loc: 'riot', x: 0, z: -85 }, done: (e) => e === 'car', banner: true },
  { id: 'newNames', type: 'scene', chapter: CH4, play: SCENES.newNames },
  { id: 'mexico', type: 'scene', chapter: CH5, play: SCENES.mexico },
  { id: 'meetEladio', type: 'goal', chapter: CH5, look: 'emilioCivil', text: 'Meet Don Eladio by the pool', loc: 'hacienda', spawn: 'gate',
    target: { loc: 'hacienda', x: 11.9, z: -7 }, done: (e) => e === 'eladio', banner: true },
  { id: 'finale', type: 'scene', chapter: CH5, play: SCENES.finale, inPlace: true },
];
export const BEAT_INDEX = Object.fromEntries(BEATS.map((b, i) => [b.id, i]));
