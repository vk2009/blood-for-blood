// The rest of the story, after the pool:
//   Chapter II (end)  — forced to leave Max behind; Emilio is buried with him.
//   Chapter III       — Empire: Albuquerque, the ledger, the crew, three strikes on the Salamancas.
//   Chapter IV        — Catalyst: Walter White, the twins, Gale and Victor, Don Eladio, and Hector.
// Violence stays off-screen and non-graphic, like the rest of the game.
import * as THREE from 'three';
import { sfx } from './sfx.js';

const sleep = (d, s) => d.wait(s);
function sitAt(a, x, z, yaw) { a.pos.set(x, Math.max(0, 0.56 - 0.48 * a.h), z); a.yaw = yaw; a.pose.sit = 1; a.noCollide = true; a.sync(); }
function lieDown(a, y = 0.16) { a.noCollide = true; a.extraRot.x = -Math.PI / 2; a.pos.y = y * a.h; a.sync(); }
function kneel(d, a) { d.pose(a, 'sit', 0.6, 0.3); a.noCollide = true; }

export const CH_II = 'Chapter II · Generalísimo';
export const CH_III = 'Chapter III · Empire';
export const CH_IV = 'Chapter IV · Catalyst';
export const CH_IVB = 'Chapter IV · Blood for Blood';

export const ITEMS2 = {
  revolverMax: { name: 'Max’s Revolver', icon: '🔫', desc: 'His father’s. Old, heavy, and it pulls to the left. Max made you carry it.\nIn a gunfight: hold Right-click / Q to aim, click / F to fire, R to reload.' },
  pistolABQ: { name: 'Pistol', icon: '🔫', desc: 'Clean, unregistered, bought by Tyrus from a man who does not ask questions.\nIn a gunfight: hold Right-click / Q to aim, click / F to fire, R to reload.' },
  maxPhoto: { name: 'Photo of Max', icon: '🖼️', desc: 'Max behind the counter in Santiago, laughing at something you said.\nYou do not remember what it was. That is the worst part.' },
  recipe: { name: 'Mamá’s Recipe', icon: '📜', desc: 'Half of an old photograph. The half with the handwriting:\n“Pollo asado — for when you have a kitchen of your own, mijo.”\nThe half with her face is in the desert, with Max.' },
  salLedger: { name: 'The Salamanca Ledger', icon: '📕', desc: 'Payments, names, dates. Every man who works for Hector Salamanca north of the border.\nYou have underlined two names: Rogelio Salamanca. Hector Salamanca.' },
  tequila: { name: 'Zafiro Añejo', icon: '🍾', desc: 'The finest tequila money can buy. A gift for Don Eladio.\nYou took the antidote an hour ago.' },
  bell: { name: 'Hector’s Bell', icon: '🔔', desc: 'A small brass bell. He used it to call his men.\nNobody answers it now.' },
};

// ================================================================ scenes
export const SCENES2 = {
  // ---------------------------------------------------------- end of Chapter II
  async aftermath(d, G) {
    d.set('hacienda');
    G.setMood('dusk');
    const g = d.actor('gus', 'emilioCivil', 8.2, -7.8, Math.PI / 2);
    kneel(d, g);
    const h = d.actor('hector', 'hector', 10.6, -4.6, -2.4);
    const el = d.actor('eladio', 'eladio', 13.5, -2.0, -2.2);
    const s1 = d.actor('s1', 'cartel', 9.6, -9.4, -0.6);
    const s2 = d.actor('s2', 'cartel', 7.0, -9.6, 0.4);
    d.face(s1, g); d.face(s2, g);
    // A pistol on the side table, an arm's length away
    const gun = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: '#232326', roughness: 0.35, metalness: 0.8 });
    gun.add(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.035), steel));
    d.prop(gun, 9.0, 0.79, -6.2);
    d.cam([5.4, 1.5, -10.0], [8.6, 0.8, -7.2], { to: [5.8, 1.4, -9.4], dur: 7 });
    await d.fadeIn(1.2);
    await d.say('', '*The water is quiet now. Someone has already pulled Max out and laid a towel over him.*');
    await d.say('Don Eladio', 'Get up, Gustavo. Up. Go home. Sell your chicken.');
    await d.say('Don Eladio', 'And from now on, you pay me. Twenty percent of everything. Every month. Forever.');
    d.cam([8.0, 1.2, -5.0], [9.0, 0.85, -6.2]);
    await d.say('', '*Hector’s pistol lies on the side table. Nobody is looking at it. Nobody is looking at you.*');
    const c = await d.choose(['Reach for the pistol', 'Stay where you are'], 1, 'Gustavo');
    if (c === 0) {
      await d.prompt('Grab it!');
      d.pose(g, 'point', 1, 0.15);
      sfx.whoosh();
      await sleep(d, 0.2);
      d.walk(s1, 8.7, -7.0, 4); d.walk(h, 9.2, -6.0, 4);
      await sleep(d, 0.35);
      sfx.kick(); G.shake = 0.5; G.flash();
      d.pose(g, 'point', 0, 0.1); d.pose(g, 'hurt', 1, 0.1);
      d.prop(gun, 0, -10, 0);
      d.cam([6.0, 1.3, -8.0], [8.6, 0.6, -7.4]);
      await d.say('Hector', '*He has the pistol now. He presses it to your cheek, gently, almost kindly.*');
      await d.say('Hector', 'Not today, chileno. Maybe not ever.');
      G.setFlag('reachedPistol');
    } else {
      await d.say('', '*You keep your hands on your knees. You count your breaths, like you counted pesos.*');
      await d.say('Gustavo', '(Not here. Not today. Today they have all the guns.)');
    }
    d.cam([9.6, 1.5, -9.4], [11.5, 1.4, -3.4]);
    await d.say('Don Eladio', 'You see? He understands. Generals understand who wins.');
    await d.say('Don Eladio', 'Take your friend with you. I don’t want him in my pool.');
    d.pose(g, 'hurt', 0, 0.3); d.pose(g, 'sit', 0, 0.5);
    await sleep(d, 0.6);
    await d.fadeOut(1);
    G.setMood(null);
  },

  async burial(d, G) {
    d.set('desert');
    G.setMood('dusk');
    const g = d.actor('gus', 'emilioCivil', 1.3, 1.4, -2.4);
    d.cam([-5, 2.2, 6], [0, 0.4, -0.5], { to: [-3.5, 1.7, 4.4], dur: 14 });
    await d.card('', 'Somewhere south of Ciudad Juárez.\nThe same night.', 4);
    await d.fadeIn(1);
    await d.say('', '*It takes four hours to dig a grave in the desert with a tire iron. He does not stop once.*');
    kneel(d, g);
    await sleep(d, 0.8);
    d.cam([2.4, 1.2, 2.0], [0.4, 0.5, 0]);
    await d.say('Gustavo', 'You hated this name, Max. Maximino. You said it sounded like a wrestler.');
    await d.say('Gustavo', 'I never told you that it made me laugh. I should have.');
    await sleep(d, 0.8);
    if (G.has('photo')) {
      await d.say('', '*He takes out the photo of Mamá. He tears it in half — her face, and the recipe on the back.*');
      await d.say('Gustavo', 'Mamá. Keep him company. He talks too much. You will like him.');
      G.take('photo'); G.give('recipe');
    }
    if (G.has('savings')) {
      await d.say('', '*The coffee tin. Twelve years of Cerro Barón, counted twice a night. He puts it in the grave.*');
      G.take('savings');
    }
    await d.say('Gustavo', 'Emilio Gonzalez stays here with you. He was a coward. He knelt.');
    await d.say('Gustavo', 'The man who leaves this desert does not kneel. He does not forget. He does not hurry.');
    const c = await d.choose(['"I will come back for them, Max. Every one of them."', 'Say nothing. Stand up.'], 0, 'Max’s grave');
    if (c === 0) await d.say('Gustavo', 'Eladio. Hector. Every man who was at that pool. However long it takes.');
    d.pose(g, 'sit', 0, 0.6); g.noCollide = false;
    await sleep(d, 0.6);
    if (G.has('revolver')) { G.take('revolver'); G.give('revolverMax', false); }
    G.give('maxPhoto');
    d.cam([-8, 4, 10], [0, 0.5, 0], { to: [-14, 9, 18], dur: 7 });
    d.walk(g, 6.2, 3.4, 1.0);
    await sleep(d, 3.5);
    await d.fadeOut(1.2);
    G.setMood(null);
    await d.card('End of Chapter II', 'Emilio Gonzalez was buried in the desert next to his friend.\nOnly Gustavo Fring drove away.', 5);
  },

  // ---------------------------------------------------------- Chapter III
  async abqArrive(d, G) {
    await d.card('Chapter III · Empire', 'Albuquerque, New Mexico — 1990.', 4);
    d.set('abq');
    d.cam([-60, 14, 40], [-28, 3, 14], { to: [-44, 6, 22], lookTo: [-28, 4, 16], dur: 8 });
    await d.fadeIn(0.8);
    await sleep(d, 2.4);
    await d.say('', '*One restaurant on Central Avenue. Twelve tables. A sign with two brothers on it.*');
    await d.fadeOut(0.6);
    d.set('pollosABQ');
    const g = d.actor('gus', 'emilioCivil', 0, 0, 0); sitAt(g, 5.6, -5.2, 0);
    d.cam([4.0, 1.9, -2.2], [5.6, 0.9, -4.6], { to: [4.4, 1.6, -2.8], dur: 12 });
    await d.fadeIn(0.6);
    await d.say('Peter Schuler (phone)', 'Madrigal is pleased, Gustavo. The money is in the account. Sixty thousand dollars — and more when you show us what you can do.');
    await d.say('Peter Schuler (phone)', 'Don Eladio has agreed to the arrangement. You cook, you distribute in the north, and he takes his twenty percent.');
    await d.say('Gustavo', 'He will have it. Every month. On time.');
    await d.say('Peter Schuler (phone)', 'You sound very calm, for a man who works for the people who killed his partner.');
    await d.say('Gustavo', 'I sell chicken, Mr. Schuler. Calm is good for business.');
    await d.say('', '*The line goes dead. He looks at the photo of Max on the wall for a long time.*');
    await d.say('Gustavo', '(A man cannot reach the cartel from below. They have too many guns and too many men.)');
    await d.say('Gustavo', '(So I will become something they need. Too big to touch. Too valuable to kill. And then, one day, close enough.)');
    await d.say('', 'THE EMPIRE: run it from the ledger on this desk. Two big moves a week, then end the week to collect and pay.\nReputation, Product and Fear keep you in charge. Heat brings the DEA. Let any of them run wild and you will pay for it.');
    G.empire.start(60000);
    await d.fadeOut(0.5);
  },

  async hectorLooks(d, G) {
    d.set('pollosABQ');
    G.setMood('dim');
    await d.card('', 'Two years later.\nHector Salamanca comes in person to collect Don Eladio’s cut.', 4);
    const h = d.actor('hector', 'hector', 0, 0, 0); sitAt(h, -2.7, 2.5, -Math.PI / 2);
    const c1 = d.actor('c1', 'twin', -3.6, 4.2, Math.PI);
    const c2 = d.actor('c2', 'twin', -0.4, 4.0, Math.PI);
    const g = d.actor('gus', 'emilioCivil', 1.4, -0.4, Math.PI);
    d.cam([0.2, 1.7, 0.4], [-2.4, 1.1, 2.5]);
    await d.fadeIn(0.8);
    await d.walk(g, -1.3, 1.4, 1.2);
    d.face(g, h); d.face(h, g);
    await d.say('Hector', 'Chicken man. Look at you. A real American businessman.');
    await d.say('', '*Gustavo sets a paper bag on the table. Hector does not count it. He knows it is all there.*');
    await d.say('Hector', 'I heard somebody hit my tire shop. Took my book. Took my courier’s money.');
    if (G.S.flag('rogelio:dead')) await d.say('Hector', 'And my cousin Rogelio went out for a drink and never came home.');
    else await d.say('Hector', 'And my cousin Rogelio came home crying about a chileno who told him to give me a message.');
    await d.say('Hector', 'You know anything about that, Gustavo?');
    d.cam([-3.2, 1.3, 1.6], [-1.3, 1.62, 1.4]);
    await d.choose(['Say nothing. Look at him.'], 0, 'Gustavo');
    await sleep(d, 1.2);
    await d.say('', '*Gustavo Fring does not blink. He does not speak. He looks at Hector Salamanca the way Hector once looked at him, across a swimming pool.*');
    d.cam([0.2, 1.7, 0.4], [-2.4, 1.1, 2.5]);
    await d.say('Hector', '*He laughs, but not for long.* …Your friend. Max, no? He swam very pretty.');
    await sleep(d, 1.4);
    await d.fadeOut(1.4);
    G.setMood(null);
    await d.card('BLOOD FOR BLOOD', 'End of Chapter III.', 5);
  },

  // ---------------------------------------------------------- Chapter IV
  async catalyst(d, G) {
    await d.card('Chapter IV · Catalyst', 'Albuquerque — 2008.\nEighteen years. Fourteen restaurants. Not one mistake.', 5);
    d.set('pollosABQ');
    const g = d.actor('gus', 'emilioCivil', -1.8, -2.2, 0);
    const w = d.actor('walter', 'walter', 0, 0, 0); sitAt(w, -5.5, -0.5, Math.PI / 2);
    d.cam([-3.2, 1.6, 1.4], [-5.2, 1.1, -0.6]);
    await d.fadeIn(0.8);
    await d.say('', '*A middle-aged man in a beige jacket has been sitting at the same table for two hours. His partner never showed up.*');
    await d.walk(g, -4.6, -0.6, 1.2);
    d.face(g, w); d.face(w, g);
    await d.say('Walter White', 'You’re him. You’re the distributor.');
    await d.say('Gustavo', 'I am the manager of this restaurant. Can I get you anything else?');
    await d.say('Walter White', 'My product is ninety-nine percent pure. Nobody in this state comes close. You know that, or you would not have walked over.');
    await d.say('Walter White', 'And there is something else you should know. Tuco Salamanca is dead. I killed him.');
    d.cam([-6.6, 1.5, -1.6], [-4.6, 1.62, -0.6]);
    await sleep(d, 1.0);
    await d.say('Gustavo', '(Tuco. Hector’s nephew. A schoolteacher killed a Salamanca, and walked into my restaurant to tell me.)');
    await d.say('Gustavo', '(The family will come out of hiding to avenge him. All of them. Into the open.)');
    const c = await d.choose(['"Three million dollars for three months of your time."', '"I will think about it. Do not come here again."'], 0, 'Walter White');
    if (c === 0) await d.say('Walter White', '…Three million.');
    else { await d.say('Walter White', 'You will call.'); await d.say('Gustavo', '(He is right. I will.)'); }
    await d.say('Gustavo', 'One more thing, Mr. White. The Salamancas know who killed Tuco. Two of his cousins crossed the border this morning.');
    await d.say('Walter White', 'Then I suppose I am under your protection.');
    await d.say('Gustavo', 'You are under my employment. There is a difference.');
    G.empire.apply({ product: 25 }, 'Walter White’s formula');
    await d.fadeOut(0.6);
  },

  async galeDies(d, G) {
    d.set('pollosABQ');
    G.setMood('dim');
    const g = d.actor('gus', 'emilioCivil', 0, 0, 0); sitAt(g, 5.6, -5.2, 0);
    const m = d.actor('mike', 'mike', 4.4, -2.6, Math.PI);
    d.cam([3.6, 1.8, -1.8], [5.4, 1.0, -4.6]);
    await d.fadeIn(0.8);
    await d.say('Mike Ehrmantraut', 'White is getting harder to handle. Late. Loud. He thinks the lab cannot run without him.');
    await d.say('Gustavo', 'Gale has learned everything he needs. When Gale is ready, Walter White becomes unnecessary.');
    await d.say('Mike Ehrmantraut', 'White knows that too. That is the problem.');
    await d.say('', '*The phone rings. Victor. He does not need to say much.*');
    await d.say('Victor (phone)', 'Mr. Fring… Gale’s apartment. The kid — Pinkman — got there first. White sent him.');
    await sleep(d, 1.4);
    d.cam([6.6, 1.3, -3.6], [5.6, 1.15, -5.0]);
    await d.say('', '*Gustavo takes off his glasses and holds them for a long moment. On the wall, Max laughs at something nobody remembers.*');
    await d.say('Gustavo', 'He used to sing to the flasks. Did you know that? Max did the same thing.');
    await d.say('Mike Ehrmantraut', 'What do you want done?');
    await d.say('Gustavo', 'Nothing. Walter White is now the only man alive who can cook my product. He has made himself irreplaceable.');
    await d.say('Gustavo', 'For now.');
    G.setFlag('gale:dead');
    G.empire.apply({ product: -20, rep: -5 }, 'Gale is gone');
    await d.fadeOut(1);
    G.setMood(null);
    await d.card('', 'Three weeks later, Don Eladio sent his answer to the new competition in the north.', 3.5);
  },

  async victorDies(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const g = d.actor('gus', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    const v = d.actor('victor', 'victorCook', 82.6, 1.6, 0);
    lieDown(v);
    d.cam([P.x + 3, 2, P.z + 3], [82.6, 0.4, 1.6]);
    await d.walk(g, 81.6, 2.4, 2.4);
    kneel(d, g);
    d.cam([80.0, 1.1, 4.2], [82.6, 0.4, 1.6]);
    await d.say('Victor', 'Mr. Fring… I kept the truck… on the road. Like you said. Didn’t stop.');
    await d.say('Gustavo', 'You did well, Victor. Do not talk.');
    await d.say('Victor', 'They said… Don Eladio says hello.');
    await sleep(d, 1.6);
    await d.say('', '*Victor stops talking. Gustavo closes his eyes for him, the way he wished someone had done for Max.*');
    G.setFlag('victor:dead');
    G.clearFlag('crew:victor');
    G.empire.apply({ heat: 12, fear: -6 }, 'Victor is dead');
    d.cam([78, 3, 6], [82.6, 0.5, 1.6], { to: [75, 5, 9], dur: 5 });
    await d.say('Gustavo', 'Eighteen years of patience, Eladio. You have spent them in one afternoon.');
    d.pose(g, 'sit', 0, 0.5); g.noCollide = false;
    await sleep(d, 1);
    await d.fadeOut(0.8);
  },

  async fireWalter(d, G) {
    d.set('desert');
    G.setMood('night');
    const g = d.actor('gus', 'emilioCivil', 4, 4.5, -2.4);
    const w = d.actor('walter', 'walter', 1.6, 2.2, 0.8);
    const m = d.actor('mike', 'mike', 6.2, 2.8, -1.6);
    const j = d.actor('jesse', 'jesse', -2.5, 5.5, 2.2);
    d.face(g, w); d.face(w, g); d.face(m, w); d.face(j, g);
    d.cam([7.5, 1.7, 7], [2.2, 1.3, 2.6]);
    await d.fadeIn(0.8);
    await d.say('Gustavo', 'You are fired, Walter. Your partner killed a man I valued, on your order. You will not go near my lab again.');
    await d.say('Walter White', 'Your lab doesn’t work without me. You said so yourself.');
    await d.say('Gustavo', 'Jesse. You will cook for me now. You have watched him long enough.');
    d.cam([-0.5, 1.6, 7.6], [-2.5, 1.6, 5.5]);
    await d.say('Jesse Pinkman', 'Yeah? And what happens to Mr. White?');
    for (let tries = 0; ; tries++) {
      d.cam([5.6, 1.6, 6.4], [4, 1.6, 4.5]);
      const c = await d.choose([
        '“Mike. Take Mr. White for a walk.”',
        '“Mr. White lives — under Mike’s eyes, every hour of the day.”',
        '“If you interfere, Walter, I will kill your wife. Your son. Your infant daughter.”',
      ], 1, 'Walter’s fate');
      if (c === 0) {
        d.cam([-0.5, 1.6, 7.6], [-2.5, 1.6, 5.5]);
        await d.say('Jesse Pinkman', 'Then I walk. You hear me? He dies, I don’t cook for you. Not one batch. Ever.');
        await d.say('Mike Ehrmantraut', 'Gale is dead. Without the kid, there is no cook. Without a cook, Eladio eats you alive.');
        await d.say('Gustavo', '(Not yet. Not like this.)');
        continue;
      }
      if (c === 2) {
        G.setFlag('walter:threatened');
        G.empire.apply({ fear: 10 }, 'A threat Walter will never forget');
        await d.say('Walter White', '*He says nothing. He looks at you the way you once looked at Hector.*');
      } else {
        G.setFlag('walter:watched');
        await d.say('Mike Ehrmantraut', 'Every hour of the day.');
      }
      break;
    }
    d.cam([-0.5, 1.6, 7.6], [-2.5, 1.6, 5.5]);
    await d.say('Jesse Pinkman', '…Fine. I’ll cook.');
    await d.say('Gustavo', 'Good. Now there is something I need from both of you, Mike. And you, Jesse.');
    await d.say('Gustavo', 'Don Eladio wants a cook of his own. He has asked for Jesse — to teach his chemists in Mexico.');
    await d.say('Gustavo', 'We will go to his hacienda. All three of us. And we will bring him a gift.');
    await d.fadeOut(1);
    G.setMood(null);
  },

  async mexico2(d, G) {
    d.set('airstrip');
    const plane = G.loc.plane;
    plane.position.set(-3, 0, -10); plane.rotation.y = 0; plane.rotation.x = 0;
    const g = d.actor('gus', 'emilioCivil', 9.5, 6.2, -1.8);
    const m = d.actor('mike', 'mike', 11, 8, -1.6);
    const j = d.actor('jesse', 'jesse', 12, 5.4, -1.8);
    d.face(m, g); d.face(j, g);
    G.setMood('golden');
    d.cam([6, 1.8, 10], [10, 1.4, 6]);
    await d.fadeIn(0.8);
    await d.say('Mike Ehrmantraut', 'You really think he lets us walk in there? After Victor?');
    await d.say('Gustavo', 'Eladio believes I am his. Twenty years of paying on time teaches a man to think that.');
    G.give('tequila');
    await d.say('Gustavo', 'When we are at the pool, you will drink nothing. You will eat nothing. And when it starts, you get Jesse to the cars.');
    await d.say('Jesse Pinkman', 'When what starts?');
    await d.say('Gustavo', 'You will know.');
    await d.fadeOut(0.8);
    await d.card('Don Eladio’s Hacienda', 'Mexico — 2009.\nThe same house. The same pool.', 4.5);
  },

  async party(d, G) {
    d.set('hacienda');
    G.setMood('night');
    const lights = [];
    for (const [x, z] of [[-8, -4], [8, -4], [0, -12], [-8, -12], [8, -12]]) lights.push(d.prop(new THREE.PointLight('#ffc070', 10, 14, 1.4), x, 2.4, z));
    const el = d.actor('eladio', 'eladio', 0, 0, 0); sitAt(el, 11.9, -7, -Math.PI / 2);
    const capos = [[11.4, -9.2], [13.2, -4.6], [10.4, -3.8], [13.6, -9.4]].map(([x, z], i) => { const a = d.actor('capo' + i, 'cartel', x, z, 0); d.face(a, el); return a; });
    const g = d.actor('gus', 'emilioCivil', 9.4, -6.8, Math.PI / 2);
    const m = d.actor('mike', 'mike', 6.2, -1.6, Math.PI);
    const j = d.actor('jesse', 'jesse', 5.2, -1.2, Math.PI);
    d.face(g, el); d.face(el, g);
    d.cam([5.4, 2.2, -11], [11, 1.1, -6.4], { to: [6.4, 1.8, -10.4], dur: 10 });
    await d.fadeIn(1);
    await d.say('Don Eladio', '¡Gustavo! My old friend. You brought me a chemist, and now — what is this? ¡Zafiro Añejo!');
    await d.say('Gustavo', 'A gift. For twenty years of partnership.');
    G.take('tequila');
    d.cam([9.0, 1.6, -5.0], [11.6, 1.2, -7.0]);
    await d.say('Don Eladio', 'Twenty years. You know, I almost forgot about the chileno who cried by my pool.');
    await d.say('Don Eladio', 'Look — same pool! I had it cleaned. *He laughs.*');
    await d.say('', '*Gustavo pours. Eladio’s capos hold out their glasses. Gustavo drinks first, so they will.*');
    await d.say('Don Eladio', '¡Salud! To the chicken man!');
    await sleep(d, 1.2);
    await d.say('Gustavo', 'Excuse me. I must find the restroom.');
    d.walk(g, 6.5, -2.4, 1.4);
    d.cam([4, 2.0, 0], [11, 1.1, -6.4]);
    await sleep(d, 1.8);
    // The capos fall, one by one. Eladio barely touched his glass.
    for (const [i, a] of capos.entries()) {
      await sleep(d, 0.5);
      sfx.thud();
      lieDown(a);
      if (i === 1) await d.say('Capo', '¿Qué… qué me pasa…?');
    }
    d.cam([9.2, 1.4, -4.8], [11.9, 1.0, -7.0]);
    await d.say('', '*Don Eladio looks at the glass in his hand. He spits. He has had one sip.*');
    await d.say('Don Eladio', '¡VENENO! ¡Gustavo! ¡GUSTAVO!');
    d.pose(el, 'sit', 0, 0.3); el.noCollide = false; el.pos.y = 0;
    d.walk(el, 0, -22, 4.5);
    sfx.gunshot(); G.flash(); G.shake = 0.4;
    await d.say('Don Eladio', '¡Muchachos! ¡Mátenlo! ¡Mátenlos a todos!');
    d.cam([4, 1.7, 3], [5.6, 1.4, -1.4]);
    await d.say('Gustavo', 'Mike — the cars. Take Jesse. I will hold the drive.');
    await d.say('Mike Ehrmantraut', 'You took the antidote?');
    await d.say('Gustavo', 'An hour ago. Go.');
    d.walk(m, 2, 28, 5); d.walk(j, -1, 28, 5);
    await sleep(d, 0.8);
    G.placePlayer(0, 2.8, Math.PI);
  },

  async eladioEnd(d, G) {
    G.hideHero(true);
    G.clearFallen();
    G.setMood('night');
    const P = G.player.pos;
    const g = d.actor('gus', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    const el = d.actor('eladio', 'eladio', 0.5, -12.2, Math.PI);
    d.pose(el, 'hurt', 1, 0.2);
    d.cam([P.x + 2.5, 1.9, P.z + 3], [0.5, 1.2, -12]);
    await d.walk(g, 0.5, -14.6, 1.6);
    d.face(g, el); d.face(el, g);
    d.cam([2.6, 1.3, -14.8], [0.5, 1.4, -12.6]);
    await d.say('Don Eladio', 'Gustavo… Gustavo, wait. We are partners. Twenty years. I let you live — remember? I let you live!');
    d.cam([-1.6, 1.7, -11.0], [0.5, 1.6, -14.4]);
    await d.say('Gustavo', 'You did. You said: look at him, Generalísimo. Look.');
    await d.say('Gustavo', 'I have been looking at him for twenty years, Eladio. Every day. Every night.');
    await d.say('Gustavo', 'Now look at me.');
    const c = await d.choose(['Say Max’s name', 'Say nothing'], 0, 'Don Eladio');
    if (c === 0) await d.say('Gustavo', 'Maximino Arciniega. Say it.');
    await d.say('Don Eladio', '…Max.');
    await sleep(d, 0.6);
    d.pose(el, 'hurt', 1, 0.05);
    sfx.thud();
    // He stumbles back into his own pool — where Max fell.
    el.noCollide = true;
    let k = 0;
    await new Promise((res) => {
      if (d.skip) return res();
      const stop = d.every((dt) => {
        k = Math.min(1, k + dt * 1.6);
        el.extraRot.x = -1.35 * k; el.pos.z = -12.2 + 3.4 * k; el.pos.y = 0.12 * k;
        if (k >= 1) { stop(); res(); }
      });
    });
    el.extraRot.x = -1.35; el.pos.set(0.5, 0.12, -8.8); el.sync();
    sfx.splash();
    d.cam([4.6, 1.5, -12.4], [0.5, 0.1, -8.6], { to: [5.2, 1.3, -11.6], dur: 6 });
    await sleep(d, 1.6);
    await d.say('', '*Don Eladio Vuente floats in his pool, face down, like a man looking for something he dropped.*');
    await d.say('Gustavo', 'One.');
    G.empire.apply({ fear: 20, rep: 15, heat: 10 }, 'Don Eladio is dead');
    G.setFlag('eladio:dead');
    await d.fadeOut(1.2);
    G.setMood(null);
    G.hideHero(false);
  },

  async reunion(d, G) {
    d.set('pollosABQ');
    G.setMood('dim');
    const g = d.actor('gus', 'emilioCivil', 0, 0, 0); sitAt(g, 5.6, -5.2, 0);
    const m = d.actor('mike', 'mike', 4.4, -2.6, Math.PI);
    d.cam([3.6, 1.8, -1.8], [5.4, 1.0, -4.6]);
    await d.fadeIn(0.8);
    await d.say('Mike Ehrmantraut', 'The cartel is finished. Eladio, his capos, the whole table. The routes are yours if you want them.');
    await d.say('Mike Ehrmantraut', 'The kid is gone. Went straight back to White the minute we landed.');
    await d.say('Gustavo', 'And Walter?');
    await d.say('Mike Ehrmantraut', 'Drove to Chihuahua yesterday. To a ranch. Guess whose.');
    await d.say('Gustavo', 'Hector.');
    await d.say('Mike Ehrmantraut', 'Two men who want you dead, in one house. White builds things, Gus. Smart things. Things that go off.');
    await d.say('Gustavo', 'Then they will both be there.');
    d.cam([6.6, 1.3, -3.6], [5.6, 1.15, -5.0]);
    await d.say('', '*He takes Max’s photo off the wall and puts it in his breast pocket.*');
    await d.fadeOut(1);
    G.setMood(null);
    await d.card('Chapter IV · Blood for Blood', 'Rancho Salamanca, Chihuahua.\nThe last man from the pool.', 4.5);
  },

  async finalBell(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const g = d.actor('gus', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    d.cam([P.x + 3, 2, P.z + 3], [P.x, 1.4, P.z]);
    await d.say('', '*The yard goes quiet. Then a phone buzzes in his pocket.*');
    await d.say('Jesse Pinkman (phone)', 'Mr. Fring? It’s — it’s Jesse. Listen. I’m out. I’m on the road. I don’t want any more of this.');
    await d.say('Jesse Pinkman (phone)', 'Mr. White built a bomb. It’s in one of the sheds by the walls. When you go for Hector, it goes off.');
    await d.say('Gustavo', 'Why are you telling me this?');
    await d.say('Jesse Pinkman (phone)', 'Because I’m done with people dying. Even you. …The timer clicks. You can hear it if you get close.');
    await sleep(d, 0.4);
    sfx.bell();
    await d.say('', '*From the house, a small bell rings. Ding. Ding. Ding.*');
    await d.say('Gustavo', '(He knows I am here. Good.)');
    G.placePlayer(g.pos.x, g.pos.z, g.yaw);
    G.hideHero(false);
  },

  async finalHector(d, G) {
    G.hideHero(true);
    const P = G.player.pos;
    const g = d.actor('gus', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    const h = d.actor('hector', 'hectorOld', 0, -27.6, 0);
    const w = d.actor('walter', 'walter', 3.2, -28.2, -0.4);
    d.cam([P.x + 3, 2.2, P.z + 3], [0, 1.4, -27]);
    await d.walk(g, 0, -4, 1.6);
    d.face(g, h); d.face(h, g); d.face(w, g);
    d.cam([1.4, 1.7, -2], [0, 1.4, -27.6]);
    await d.say('Hector', '*Ding.* …Chileno. You found the little present. The teacher said you would not.');
    d.cam([2.2, 1.6, -25.4], [3.2, 1.6, -28.2]);
    await d.say('Walter White', 'It was never personal, Gus.');
    await d.say('Gustavo', 'Everything is personal, Walter. Go home to your family. While you still have one.');
    d.walk(w, 16, -29, 3).then(() => d.drop('walter'));
    d.cam([-1.6, 1.6, -24.4], [0, 1.55, -27.6]);
    await d.say('Hector', 'Twenty years ago I shot your friend. He fell in the water like a sack of flour. *Ding.*');
    await d.say('Hector', 'Look at me, chileno.');
    d.cam([1.0, 1.7, -2.6], [0, 1.6, -4.0]);
    await d.say('Gustavo', 'No, Hector. Tonight you look at me.');
    G.placePlayer(g.pos.x, g.pos.z, Math.PI);
    G.hideHero(false);
  },

  async finalEnd(d, G) {
    G.hideHero(true);
    G.clearFallen();
    G.setMood('night');
    const P = G.player.pos;
    const g = d.actor('gus', 'emilioCivil', P.x, P.z, G.player.modelYaw);
    const h = d.actor('hector', 'hectorOld', 0, -21, 0);
    d.pose(h, 'sit', 0.6, 0); h.noCollide = true;
    d.cam([P.x + 3, 2, P.z + 3], [0, 1, -21]);
    await d.walk(g, 0, -19.2, 1.4);
    d.face(g, h); d.face(h, g);
    d.cam([1.6, 1.2, -18.4], [0, 1.0, -21]);
    await d.say('', '*Hector Salamanca sits in the dirt of his own courtyard. His men are down. He still holds the little brass bell.*');
    await d.say('Hector', '*Ding.* *Ding.* …Nobody comes.');
    await d.say('Gustavo', 'Nobody comes, Hector. Nobody is left.');
    d.cam([-1.4, 1.65, -20.0], [0, 1.6, -19.2]);
    await d.say('Gustavo', 'Do you remember his name?');
    await d.say('Hector', '…The chemist. Max.');
    await d.say('Gustavo', 'Maximino Arciniega. Mateo Zagal. My brother.');
    const c = await d.choose(['“Look at me.”', 'Take the bell from his hand'], 0, 'Hector Salamanca');
    if (c === 0) await d.say('Gustavo', 'Look at me, Hector. Look at me.');
    G.give('bell');
    await d.say('', '*Gustavo takes the bell. He rings it, once. Nobody answers. Then he turns his back, and Mike walks past him into the courtyard.*');
    await d.say('Gustavo', 'Two.');
    await d.fadeOut(1.4);
    d.drop('hector');
    // Walter — what is left of him
    d.set('desert');
    G.setMood('night');
    const g2 = d.actor('gus', 'emilioCivil', 3.8, 4.5, -2.4);
    const w = d.actor('walter', 'walter', 1.6, 2.2, 0.8);
    const m = d.actor('mike', 'mike', 6.2, 2.8, -1.6);
    d.face(g2, w); d.face(w, g2); d.face(m, w);
    d.cam([7.5, 1.7, 7], [2.2, 1.3, 2.6]);
    await d.fadeIn(0.8);
    await d.say('Walter White', 'So. This is where you bring people.');
    await d.say('Gustavo', 'This is where I brought my friend. Twenty years ago.');
    const c2 = await d.choose([
      'Let him go — for Jesse. “Leave New Mexico. Tonight. Never cook again.”',
      '“Mike.” — and walk back to the car',
    ], 0, 'Walter White');
    if (c2 === 0) {
      G.setFlag('walter:exiled');
      await d.say('Walter White', '…Why?');
      await d.say('Gustavo', 'Because a boy who wanted no more dying saved my life tonight. I pay my debts, Walter. Go.');
    } else {
      G.setFlag('walter:gone');
      await d.say('', '*Gustavo walks back to the car. He does not look back. He never looks back now.*');
    }
    await d.fadeOut(1.2);
    // Running the show
    d.set('pollosABQ');
    G.setMood(null);
    const g3 = d.actor('gus', 'emilioCivil', 0, 0, 0); sitAt(g3, 5.6, -5.2, 0);
    const m3 = d.actor('mike', 'mike', 4.2, -2.6, Math.PI);
    d.cam([3.6, 1.8, -1.8], [5.4, 1.0, -4.6], { to: [4.2, 1.5, -2.6], dur: 14 });
    await d.card('Six months later.', '', 2.5);
    await d.fadeIn(0.8);
    await d.say('Mike Ehrmantraut', 'The cartel’s old routes. Juárez, Chihuahua, the whole border. They come to you now. Every one of them.');
    await d.say('Mike Ehrmantraut', 'You run all of it, Gus. Nobody left to pay. Nobody left to answer to.');
    await d.say('Gustavo', 'Thank you, Mike.');
    await d.say('', '*When Mike is gone, Gustavo takes Max’s photo out of his pocket and sets it on the desk, next to the brass bell.*');
    await d.say('Gustavo', 'Two brothers, Max. One cooks the chicken.');
    await sleep(d, 1.0);
    await d.say('', '*He waits for the rest of the joke, the way Max always made him wait. Nobody finishes it.*');
    await d.fadeOut(1.4);
    // The grave
    d.set('desert');
    G.setMood('golden');
    const g4 = d.actor('gus', 'emilioCivil', 1.3, 1.4, -2.4);
    d.cam([-5, 2.2, 6], [0, 0.6, -0.5], { to: [-9, 4, 11], dur: 12 });
    await d.fadeIn(1);
    await d.say('', '*He leaves the bell on the grave. He does not pray. Max never believed in it.*');
    await d.say('Gustavo', 'It is finished.');
    await sleep(d, 2);
    await d.fadeOut(1.6);
    G.setMood(null);
    await d.card('', 'Gustavo Fring ran the most successful operation in the history of the American Southwest.\nHe had everything he had ever wanted.\n\nHe had paid for it with his mother’s name, his own name, and the only friend he ever had.', 9);
    G.endGame();
  },
};

// ================================================================ conversations
export const CONVOS2 = {
  async hectorAfter(T, G) {
    await T.say('Hector', '*He is drying his hands on a towel. He does not look at you.*');
    const c = await T.choice(['Walk away', 'Go for Hector'], 'Hector Salamanca');
    if (c === 0) { await T.say('Gustavo', '(Not today.)'); return; }
    await T.say('', '*You take one step. Three pistols come up at once. Somebody laughs.*');
    await T.say('Hector', 'Go home, chileno. Next time I don’t miss the pool.');
    sfx.kick(); G.shake = 0.5; G.flash();
    await T.say('', '*The butt of a pistol. Then gravel, and the taste of blood. When you can see again, you are at the gate.*');
    G.player.hp = Math.max(30, G.player.hp - 35); G.ui.setHealth(G.player.hp / 100);
    G.placePlayer(0, 29.2, Math.PI);
  },
  async waiterABQ(T, G, S) {
    await T.say('Cashier', S.past('catalyst') ? 'Good evening, Mr. Fring. The Twelve-Piece Bucket is selling very well this week.' : '¡Bienvenido a Los Pollos Hermanos! Good evening, Mr. Fring.');
    const c = await T.choice(['Order a Two-Piece Meal ($ 9) — heals 60', '“Carry on.”'], 'Cashier');
    if (c !== 0) return;
    if (G.player.hp >= 100) { await T.say('Gustavo', '(I am not hungry. I am never hungry.)'); return; }
    G.addPesos(-9, 'Two-Piece Meal');
    G.player.hp = Math.min(100, G.player.hp + 60); G.ui.setHealth(G.player.hp / 100);
    await T.say('', '*He eats standing up, in the kitchen, the way he did in Santiago.*');
  },
  async empireLedger(T, G) { await G.empire.ledger(T); },
  // ---- Chapter IV: hunting the twins
  async clueSaul(T, G, S) {
    if (S.flag('clue:saul')) { await T.say('Saul Goodman', 'That’s all I got, Mr. F. Scout’s honor.'); return; }
    await T.say('Saul Goodman', 'Two big bald guys in matching suits came to my office. Didn’t say a word. Not one word. They wrote a name on my legal pad. Walter’s.');
    await T.say('Saul Goodman', 'Then they asked the receptionist where a person might buy, quote, a very large axe.');
    G.setFlag('clue:saul'); G.emit('clue');
  },
  async clueClerk(T, G, S) {
    if (S.flag('clue:clerk')) { await T.say('Motel Clerk', 'Room 12. That’s all I know, sir.'); return; }
    await T.say('Motel Clerk', 'Two of them. Room 12. Paid cash for a week. They don’t sleep, I think. They just sit in the parking lot and watch the road.');
    const c = await T.choice(['Slip him $ 500 for the spare key', '“Thank you.”'], 'Motel Clerk');
    if (c === 0) { G.addPesos(-500, 'The spare key'); await T.say('Motel Clerk', 'Their car is the black one. They keep the… the tools in the trunk.'); }
    G.setFlag('clue:clerk'); G.emit('clue');
  },
  async clueDealer(T, G, S) {
    if (S.flag('clue:dealer')) { await T.say('Salamanca dealer', 'I told you everything, man!'); return; }
    await T.say('Salamanca dealer', 'I don’t know nothing about no twins.');
    const c = await T.choice(['Pay him ($ 2,000)', 'Remind him what happened to the tire shop'], 'Salamanca dealer');
    if (c === 0) { if (G.pesos < 2000) { await T.say('Gustavo', '(Not enough on me.)'); return; } G.addPesos(-2000, 'Information'); }
    else G.empire.apply({ fear: 4 }, 'A reminder');
    await T.say('Salamanca dealer', 'Okay, okay! Leonel and Marco. Tuco’s cousins. They’re waiting for the teacher at the Desert Sands. Tonight. They’re gonna do it in the lot.');
    G.setFlag('clue:dealer'); G.emit('clue');
  },
  async cousinsPlan(T, G) {
    await T.say('Mike Ehrmantraut', 'So. The twins. They are in the Desert Sands lot tonight, waiting for White. How do you want to play it?');
    const c = await T.choice([
      'Ambush them yourself — two of them, axes, no help (+fear)',
      'Tip off the DEA through Saul — they take one, you take the other (+heat)',
    ], 'The Salamanca twins');
    if (c === 0) { G.setFlag('twins:ambush'); await T.say('Mike Ehrmantraut', 'Both of them. Hand to hand. …Watch the axe. When it goes up, get out of the way.'); }
    else { G.setFlag('twins:dea'); G.empire.apply({ heat: 20 }, 'An anonymous tip'); await T.say('Mike Ehrmantraut', 'The DEA will hit them at nine. One will run. He’s yours.'); }
    G.emit('twins:plan');
  },
};

// ================================================================ the bomb in the sheds (final, stage II)
const SHEDS = [[-28.6, -16], [-28.6, 2], [-28.6, 20], [28.6, -16], [28.6, 2], [28.6, 20]];
export function shedUses() {
  return SHEDS.map(([x, z], i) => ({
    type: 'use', x, z, r: 1.8, label: 'Search the shed',
    when: (S) => S.at('final2'),
    fn: async (T, G) => searchShed(T, G, i),
  }));
}
function startBombHunt(G) {
  const st = { t: 95, bomb: Math.floor(Math.random() * SHEDS.length), searched: new Set(), tickT: 0, done: false };
  G.bomb = st;
  const timer = document.getElementById('ow-timer');
  timer.classList.add('show');
  G.tickers.add((dt) => {
    if (st.done) return;
    st.t -= dt;
    const [bx, bz] = SHEDS[st.bomb];
    const dist = Math.hypot(G.player.pos.x - bx, G.player.pos.z - bz);
    st.tickT -= dt;
    if (st.tickT <= 0) { sfx.tick(); st.tickT = Math.max(0.1, Math.min(1.3, dist / 34)); }
    const m = Math.floor(Math.max(0, st.t) / 60), s = Math.max(0, st.t) % 60;
    timer.innerHTML = `<small>Walter’s bomb</small><b class="${st.t < 20 ? 'low' : ''}">${m}:${s.toFixed(1).padStart(4, '0')}</b><span>Listen — the ticking is faster the closer you are</span>`;
    if (st.t <= 0) {
      st.done = true;
      timer.classList.remove('show');
      sfx.boom(); G.flash(); G.shake = 1.2;
      G.gameOver('Walter White’s bomb went off. Hector Salamanca rang his bell in the smoke.\n(Follow the ticking: it speeds up as you get closer to the right shed.)');
    }
  });
}
async function searchShed(T, G, i) {
  const st = G.bomb;
  if (!st || st.done) return;
  if (st.searched.has(i)) { await T.say('Gustavo', '(Nothing here. I already looked.)'); return; }
  st.searched.add(i);
  if (i !== st.bomb) {
    await T.say('', '*Saddles, feed sacks, a broken radio. No bomb. The ticking comes from somewhere else.*');
    return;
  }
  await T.say('', '*Behind the feed sacks: a metal box, a car battery, a kitchen timer, and three wires — red, green and white.*');
  await T.say('Jesse Pinkman (phone)', 'Okay — okay. Mr. White always does things in order. Like a lesson. Ground first. Then the one that matches the timer. Then the last one.');
  const order = [['Cut the white wire (ground)', 0], ['Cut the green wire (the timer’s colour)', 1], ['Cut the red wire', 2]];
  let step = 0;
  while (step < 3) {
    const opts = ['Cut the red wire', 'Cut the green wire', 'Cut the white wire'];
    const c = await T.choice(opts, `The bomb — wire ${step + 1} of 3 · ${Math.ceil(st.t)} s left`);
    const want = [2, 1, 0][step];
    if (c === want) { sfx.click(); step++; await T.say('', step < 3 ? '*Snip. The timer keeps running — but the light on the box goes out.*' : '*Snip. The timer stops.*'); }
    else {
      st.t -= 15; sfx.tick(); sfx.tick();
      await T.say('Jesse Pinkman (phone)', 'No — no no no! It skipped ahead! Ground first, Mr. Fring. Ground, then the timer colour, then the last one!');
      if (st.t <= 0) return;
    }
  }
  st.done = true;
  document.getElementById('ow-timer').classList.remove('show');
  await T.say('Gustavo', 'It is done, Jesse. Go home.');
  G.emit('bomb:defused');
}

// ================================================================ beats
const emp = (S) => S.empire?.() || null;
const crewN = (S) => ['victor', 'tyrus', 'mike', 'gale', 'saul'].filter((k) => S.flag('crew:' + k)).length;
export const BEATS2 = [
  { id: 'aftermath', type: 'scene', chapter: CH_II, play: SCENES2.aftermath },
  { id: 'leaveHacienda', type: 'goal', chapter: CH_II, look: 'emilioCivil', mood: 'dusk', loc: 'hacienda', spawn: 'terrace',
    text: 'Leave the hacienda. There is nothing you can do for Max — not today',
    target: { loc: 'hacienda', x: 0, z: 30.5 }, done: (e) => e === 'leftHacienda' },
  { id: 'burial', type: 'scene', chapter: CH_II, play: SCENES2.burial },
  // ---- Chapter III
  { id: 'abqArrive', type: 'scene', chapter: CH_III, play: SCENES2.abqArrive },
  { id: 'ledgerIntro', type: 'goal', chapter: CH_III, look: 'emilioCivil', loc: 'pollosABQ', spawn: 'office', banner: true,
    text: 'Open the ledger on your desk', target: { loc: 'pollosABQ', x: 5.6, z: -3.6 }, done: (e) => e === 'ledger:open' },
  { id: 'empire', type: 'goal', chapter: CH_III, look: 'emilioCivil', loc: 'pollosABQ', spawn: 'office',
    text: (S) => {
      const E = emp(S);
      if (!E) return 'Build the empire';
      return `Build the empire — crew ${crewN(S)}/5 · strikes on the Salamancas ${E.revenge}/3 · restaurants ${E.restaurants}/3 · product ${E.product}/50. Blue markers on Central Avenue have work.`;
    },
    target: null, done: (e) => e === 'empire:ready' },
  { id: 'hectorLooks', type: 'scene', chapter: CH_III, play: SCENES2.hectorLooks },
  // ---- Chapter IV
  { id: 'catalyst', type: 'scene', chapter: CH_IV, play: SCENES2.catalyst },
  { id: 'cousinsClues', type: 'goal', chapter: CH_IV, look: 'emilioCivil', loc: 'abq', spawn: 'pollos', banner: true,
    text: (S) => `The Salamanca twins are hunting Walter. Find out where they will strike — ask around Central (${['saul', 'clerk', 'dealer'].filter((k) => S.flag('clue:' + k)).length}/3)`,
    target: (S) => [{ k: 'saul', x: 29, z: 9.6 }, { k: 'clerk', x: 18, z: -13.2 }, { k: 'dealer', x: 58, z: -10 }].map((c) => ({ loc: 'abq', ...c })).find((c) => !S.flag('clue:' + c.k)),
    done: (e, S) => e === 'clue' && ['saul', 'clerk', 'dealer'].every((k) => S.flag('clue:' + k)) },
  { id: 'cousinsPlan', type: 'goal', chapter: CH_IV, look: 'emilioCivil', loc: 'abq', spawn: 'keep',
    text: 'Talk to Mike in your office: decide how to deal with the twins', target: { loc: 'pollosABQ', x: 4.2, z: -2.4 }, done: (e) => e === 'twins:plan' },
  { id: 'cousinsFight', type: 'goal', chapter: CH_IV, look: 'emilioCivil', loc: 'abq', spawn: 'pollos',
    text: (S) => (S.flag('twins:dea') ? 'One twin escaped the DEA — finish him in the Desert Sands lot. When the axe goes up, dodge (Space)' : 'The Salamanca twins wait in the Desert Sands lot. When the axe goes up, dodge (Space)'),
    target: { loc: 'abq', x: 23, z: -9 }, done: (e) => e === 'won:twins2' || e === 'won:twins1' },
  { id: 'galeDies', type: 'scene', chapter: CH_IV, play: SCENES2.galeDies },
  { id: 'ambushVictor', type: 'goal', chapter: CH_IV, look: 'emilioCivil', loc: 'abq', spawn: 'pollos', banner: true,
    text: 'Eladio’s sicarios hit the Los Pollos truck at the east end of Central. Get to Victor', target: { loc: 'abq', x: 82, z: 0 }, done: (e) => e === 'won:truckAmbush' },
  { id: 'victorDies', type: 'scene', chapter: CH_IV, play: SCENES2.victorDies, inPlace: true },
  { id: 'fireWalter', type: 'scene', chapter: CH_IV, play: SCENES2.fireWalter },
  { id: 'mexico2', type: 'scene', chapter: CH_IV, play: SCENES2.mexico2 },
  { id: 'party', type: 'scene', chapter: CH_IV, play: SCENES2.party },
  { id: 'eladioDrive', type: 'goal', chapter: CH_IV, look: 'emilioCivil', mood: 'night', loc: 'hacienda', spawn: 'terrace', banner: true,
    text: 'Fight down the drive so Mike and Jesse reach the cars — shoot the red propane tanks to break their line', target: { loc: 'hacienda', x: 0, z: 26 }, done: (e) => e === 'won:eladioDrive' },
  { id: 'eladioBoss', type: 'goal', chapter: CH_IV, look: 'emilioCivil', mood: 'night', loc: 'hacienda', spawn: 'keep',
    text: 'Don Eladio — by the pool. Shoot when he stops to reload; his men come when he whistles', target: { loc: 'hacienda', x: 0, z: -12 }, done: (e) => e === 'won:eladioBoss' },
  { id: 'eladioEnd', type: 'scene', chapter: CH_IV, play: SCENES2.eladioEnd, inPlace: true },
  { id: 'reunion', type: 'scene', chapter: CH_IV, play: SCENES2.reunion },
  { id: 'final1', type: 'goal', chapter: CH_IVB, look: 'emilioCivil', mood: 'night', loc: 'ranch', spawn: 'gate', banner: true,
    text: 'Stage I — The Gate: break through Hector’s men. Waves keep coming; the propane tanks are your friends', target: { loc: 'ranch', x: 0, z: 6 }, done: (e) => e === 'won:ranchGate' },
  { id: 'finalBell', type: 'scene', chapter: CH_IVB, play: SCENES2.finalBell, inPlace: true },
  { id: 'final2', type: 'goal', chapter: CH_IVB, look: 'emilioCivil', mood: 'night', loc: 'ranch', spawn: 'keep',
    onStart: (G) => startBombHunt(G),
    text: 'Stage II — The Bomb: search the sheds along the walls before Walter’s bomb goes off. Follow the ticking', target: null, done: (e) => e === 'bomb:defused' },
  { id: 'finalHector', type: 'scene', chapter: CH_IVB, play: SCENES2.finalHector, inPlace: true },
  { id: 'final3', type: 'goal', chapter: CH_IVB, look: 'emilioCivil', mood: 'night', loc: 'ranch', spawn: 'keep',
    text: 'Stage III — Hector Salamanca: hurt him while he reloads, blow the propane by his cover, and deal with the men his bell calls', target: { loc: 'ranch', x: 0, z: -18 }, done: (e) => e === 'won:ranchHector' },
  { id: 'finalEnd', type: 'scene', chapter: CH_IVB, play: SCENES2.finalEnd, inPlace: true },
];
