// Side content for the open world: who offers work where, what's hidden in the
// streets, and how often street crimes happen. The engine is openworld.js.
//
// A job: { id, title, blurb, loc, avail(S), giver, npcs?, steps?, talk(T, G, S, J) }
//   J (the job API): J.start(step) · J.go(step) · J.complete(note) · J.fail(msg)
//   J.run(cfg) · J.chase(cfg) · J.fight(cfg) · J.pickup(cfg) · J.data (saved with the job)
//   J.stat('mercy' | 'fear' | 'bond') nudges the hidden reputation values.
// instant: true jobs are one conversation (a single tough choice) rather than a task.

import { EMPIRE_JOBS } from './empirejobs.js';

const CHAPTER_I = (S) => S.at('toStation') || S.at('board');
const SANTIAGO = (S) => S.past('getId') && !S.past('resign');
const POLLOS = (S) => S.past('opening') && !S.past('peterScene');

// ================================================================ jobs
export const JOBS = [
  // ---------------------------------------------------------- Cerro Barón, 1976
  {
    id: 'rent', title: 'What Is Owed', blurb: 'Your landlord is waiting by your door.', loc: 'barrio', instant: true,
    avail: CHAPTER_I,
    giver: { name: 'Don Aurelio', look: 'landlord', x: -45, z: 55.4, yaw: Math.PI / 2, wander: 0, when: (S, J) => CHAPTER_I(S) },
    async talk(T, G, S, J) {
      if (J.done) {
        if (J.flag('rent:paid')) await T.say('Don Aurelio', 'Go with God, Emilio. Your mother was a good woman.');
        else if (J.flag('rent:half')) await T.say('Don Aurelio', 'Half. Your mother would be ashamed. …Go on, go.');
        else await T.say('Don Aurelio', '*He spits in the dirt and turns his back on you.*');
        return;
      }
      await T.say('Don Aurelio', 'Emilio. So the whole cerro is right — you are leaving. With your mother’s tin.');
      await T.say('Don Aurelio', 'Three months of rent since the funeral, mijo. Six hundred pesos. I let it go because of her. But if you are leaving…');
      await T.say('Emilio', '(The tin is everything. Every peso I give him is a day longer in this place.)');
      const c = await T.choice(['Pay all of it ($ 600)', 'Pay half ($ 300) — "The rest when I can."', '"My mother paid you for twelve years. We are even."'], 'Don Aurelio');
      if (c === 0) {
        if (G.pesos < 600) { await T.say('Emilio', 'I don’t have it.'); return; }
        G.addPesos(-600, 'Rent for Don Aurelio');
        await T.say('Don Aurelio', '*He counts it twice, like you do.* …She raised you right.');
        J.setFlag('rent:paid'); J.stat('mercy');
      } else if (c === 1) {
        G.addPesos(-300, 'Half the rent');
        await T.say('Don Aurelio', '"When you can." In Santiago. Of course.');
        J.setFlag('rent:half');
      } else {
        await T.say('Don Aurelio', '¡Desgraciado! She would spit on you! ¡Que te vaya mal, Gonzalez!');
        await T.say('', '*Up and down the pasaje, doors open to see who is shouting.*');
        J.setFlag('rent:skipped'); J.stat('fear');
      }
      J.complete();
    },
  },
  {
    id: 'flour', title: 'Flour for Don Pancho', blurb: 'A baker at the end of the pasaje lost his delivery.', loc: 'barrio',
    avail: CHAPTER_I,
    giver: { name: 'Don Pancho', look: 'baker', x: -53, z: 54.8, yaw: 0, wander: 0.4 },
    steps: {
      collect: {
        text: (J) => `Find Don Pancho’s three flour sacks (${(J.data.got || []).length}/3)`,
        target: (J) => FLOUR.find((s) => !(J.data.got || []).includes(s.id)),
        enter(J) {
          J.data.got ||= [];
          for (const s of FLOUR) if (!J.data.got.includes(s.id)) J.pickup({
            id: s.id, x: s.x, z: s.z, model: 'sack', label: 'Pick up the flour sack',
            onTake() { J.data.got.push(s.id); J.G.ui.toast(`Flour sack ${J.data.got.length}/3`, 'Side job'); if (J.data.got.length >= 3) J.go('return'); else J.refresh(); },
          });
        },
      },
      return: { text: 'Bring the flour back to Don Pancho', target: { x: -53, z: 54.8 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Don Pancho', 'Bread for the train, Emilio? No? Always no with you. ¡Buen viaje!'); return; }
      if (J.step === 'collect') { await T.say('Don Pancho', 'Calle Norte, the avenue, Calle Sur… the cart lost them everywhere. Three sacks, mijo.'); return; }
      if (J.step === 'return') {
        await T.say('Don Pancho', '¡Las tres! You carried them all the way here? ¡Mira este muchacho!');
        await T.say('Don Pancho', 'Here — one hundred and fifty. And take sopaipillas for the train. No, no, I insist.');
        G.addPesos(150, 'Don Pancho’s thanks');
        G.addFood('sopaipilla');
        await T.say('Emilio', '…Gracias, Don Pancho.');
        J.stat('mercy');
        J.complete('$ 150 and sopaipillas');
        return;
      }
      await T.say('Don Pancho', '¡Ay, Emilio! The flour cart went down the avenue like a runaway horse. Three sacks bounced off the back!');
      await T.say('Don Pancho', 'My knees, mijo. I cannot walk the whole cerro. Bring them back and I pay you. Honest money.');
      const c = await T.choice(['"I will find them."', '"I have a train to catch."'], 'Don Pancho');
      if (c === 0) J.start('collect');
      else await T.say('Don Pancho', 'Of course. Santiago. Everybody has a train to catch.');
    },
  },
  {
    id: 'race', title: 'Pato’s Challenge', blurb: 'A street kid on the avenue says nobody can outrun him.', loc: 'barrio',
    avail: CHAPTER_I, hideGiverWhileActive: true,
    giver: { name: 'Pato', look: 'kidRunner', x: -1.5, z: 26, yaw: Math.PI, wander: 0.5 },
    steps: {
      race: {
        text: 'Beat Pato: down Calle Norte, then Calle Sur, and back to the avenue', retry: 'idle',
        enter(J) {
          J.run({
            label: 'Race Pato', time: 62, rival: { look: 'kidRunner', name: 'Pato', time: 50 },
            points: [[0, 8], [-50, 5], [-2, 5], [2, -15], [50, -15], [5, -15], [2, 5], [-1.5, 24]],
            onWin: (r) => {
              J.G.addPesos(50, 'Pato pays up');
              J.G.ui.toast(`${r.time.toFixed(1)} s`, 'You beat Pato');
              J.setFlag('race:won');
              J.complete('$ 50 from Pato');
            },
            onLose: (why) => J.fail(why === 'rival' ? 'Pato beat you. Talk to him for a rematch.' : why === 'time' ? 'Too slow. Talk to Pato for a rematch.' : 'Race abandoned.'),
          });
        },
      },
      idle: { text: 'Talk to Pato for a rematch', target: { x: -1.5, z: 26 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Pato', 'You cheated. Grown-ups have longer legs. …Will you write to me from Santiago?'); return; }
      await T.say('Pato', '¡Oye! You walk like an old man. I bet you fifty pesos I can beat you down Calle Norte, over to Calle Sur and back here.');
      await T.say('Pato', 'Stay on the big streets — if you cut through the callejones the Callejón boys will eat you.');
      const c = await T.choice(['"You are on." (hold Shift to run)', '"I do not bet."'], 'Pato');
      if (c === 0) J.active ? J.go('race') : J.start('race');
      else await T.say('Pato', 'Gallina. Chicken!');
    },
  },

  // ---------------------------------------------------------- Santiago, 1981
  {
    id: 'purse', title: 'Doña Elena’s Purse', blurb: 'An old woman by the kiosk has been robbed.', loc: 'santiago',
    avail: SANTIAGO,
    giver: { name: 'Doña Elena', look: 'oldWoman', x: -12, z: 30, yaw: Math.PI / 2, wander: 0 },
    steps: {
      ask: { text: 'Talk to Doña Elena again', target: { x: -12, z: 30 } },
      chase: {
        text: 'Catch the boy who stole Doña Elena’s purse', retry: 'ask',
        enter(J) {
          J.chase({
            look: 'thiefKid', name: 'the thief', from: [-17, 31.5], speed: 5.5,
            path: [[-38, 31], [-41, 21], [-5, 20], [3, 0], [3, -28], [2.5, -33]],
            onCatch: (a) => J.G.runConvo(async (T) => {
              a.faceTo = J.G.player.pos;
              await T.say('Thief', '¡Suélteme! Let me go! It was for my sister — we have not eaten since Tuesday!');
              await T.say('', '*He is maybe fourteen. Shoes held together with wire. He looks like every boy on Cerro Barón.*');
              const c = await T.choice(['"Give it back. Then go home."', '*Hit him. He will remember the lesson.*', '"Your name. For the Carabineros."'], 'The thief');
              if (c === 0) { await T.say('Thief', '…Gracias, General.'); J.stat('mercy'); }
              else if (c === 1) { await T.say('', '*One slap, open-handed. He does not cry. That is worse.*'); J.stat('fear'); }
              else { await T.say('Thief', '…Rodrigo. Rodrigo Pérez.'); await T.say('Emilio', 'Now you are on a list, Rodrigo. Do not make me look at it again.'); J.stat('fear'); J.setFlag('purse:named'); }
              J.G.give('elenaPurse');
              J.ow.walkTo(a, -45, 20, 4.5).then(() => J.ow.dropWalker(a));
              J.go('return');
            }),
            onEscape: (why) => J.fail(why === 'fight' ? 'The thief slipped away in the commotion.' : 'The thief got away. Doña Elena is still waiting.'),
          });
        },
      },
      return: { text: 'Return the purse to Doña Elena', target: { x: -12, z: 30 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Doña Elena', J.flag('purse:kept') ? '*She will not look at you.*' : 'God keeps an eye on you, General. Even you.'); return; }
      if (J.step === 'return') {
        await T.say('Doña Elena', '¡Mi cartera! You caught him?');
        await T.say('', '*The purse is heavy. Inside: her pension for the month. Six thousand pesos.*');
        const c = await T.choice(['Give it back', 'Give back the purse — and keep the money'], 'Doña Elena’s purse');
        G.take('elenaPurse');
        if (c === 0) {
          await T.say('Doña Elena', 'Here — take this. No, I insist. One thousand five hundred, for your trouble.');
          G.addPesos(1500, 'Doña Elena’s reward');
          J.stat('mercy');
          J.complete('$ 1.500');
        } else {
          G.addPesos(6000, 'Doña Elena’s pension');
          await T.say('Doña Elena', '…It is empty. General? It is empty.');
          await T.say('Emilio', 'The boy must have spent it, Señora. Boys are fast.');
          J.setFlag('purse:kept'); J.stat('fear');
          J.complete('$ 6.000 — and her silence');
        }
        return;
      }
      if (J.step === 'ask') { await T.say('Doña Elena', 'He went toward the lot behind the kiosk! Please, General!'); J.go('chase'); return; }
      if (J.step === 'chase') return;
      await T.say('Doña Elena', '¡General! ¡Mi cartera! A boy — he just grabbed it and ran!');
      await T.say('Doña Elena', 'It is my whole pension — please!');
      const c = await T.choice(['Chase him', '"The Carabineros handle thieves, Señora."'], 'Doña Elena');
      if (c === 0) J.start('chase');
      else await T.say('Doña Elena', 'The Carabineros. Yes. Of course, General.');
    },
  },
  {
    id: 'bet', title: 'Cabo Reyes’ Bet', blurb: 'A young corporal bets he can outrun a General.', loc: 'santiago',
    avail: SANTIAGO, hideGiverWhileActive: true,
    giver: { name: 'Cabo Reyes', look: 'cabo', x: 7, z: -2, yaw: -Math.PI / 2, wander: 0.3 },
    steps: {
      race: {
        text: 'Beat Cabo Reyes around Calle Agustinas and back', retry: 'idle',
        enter(J) {
          J.run({
            label: 'Race Cabo Reyes', time: 54, rival: { look: 'cabo', name: 'Cabo Reyes', time: 43 },
            points: [[3, 18], [44, 20], [3, 21], [-42, 20], [-32, 31], [2, 33], [7, -1]],
            onWin: () => { J.G.addPesos(1000, 'Won the bet'); J.setFlag('bet:won'); J.complete('$ 1.000'); },
            onLose: (why) => J.fail(why === 'rival' ? 'Cabo Reyes won. Your $ 500 is gone. He will race again.' : 'Too slow. The bet is lost.'),
          });
        },
      },
      idle: { text: 'Talk to Cabo Reyes for a rematch', target: { x: 7, z: -2 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Cabo Reyes', 'Mi General. I have told the whole barracks. They do not believe me.'); return; }
      await T.say('Cabo Reyes', 'Mi General — with respect — the men say you used to be the fastest recruit in the Regimiento Tacna.');
      await T.say('Cabo Reyes', 'Five hundred pesos says that was a long time ago. Around Calle Agustinas, past the lot, and back here.');
      const c = await T.choice(['Bet $ 500', '"A General does not gamble, Cabo."'], 'Cabo Reyes');
      if (c !== 0) { await T.say('Cabo Reyes', 'Of course, mi General. *He is trying not to smile.*'); return; }
      if (G.pesos < 500) { await T.say('Emilio', 'Not today.'); return; }
      G.heroGesture();
      await T.say('', '*Your hand hovers over the wallet for a long moment.*');
      G.addPesos(-500, 'The bet');
      await T.say('Emilio', 'Five hundred. Win it back for me, Gonzalez.');
      J.active ? J.go('race') : J.start('race');
    },
  },
  {
    id: 'papers', title: 'Papers, Please', blurb: 'A Carabinero has stopped a student on the avenue.', loc: 'santiago', instant: true,
    avail: SANTIAGO,
    giver: { name: 'Cabo Fuentes', look: 'carabinero', x: -1.5, z: 47, yaw: Math.PI, wander: 0, when: (S, J) => SANTIAGO(S) && !J.done },
    npcs: [{ id: 'student', name: 'Student', look: 'student', x: -2.7, z: 46.2, yaw: 0.6, wander: 0, pose: 'handsUp',
      lines: ['Please, señor. I only asked a question on a piece of paper.'], when: (S, J) => SANTIAGO(S) && !J.done }],
    async talk(T, G, S, J) {
      await T.say('Cabo Fuentes', '¡Mi General! This one was handing these out at the bus stop.');
      await T.say('', '*A leaflet: a grainy photo of a man, and three words. ¿DÓNDE ESTÁ? — Where is he?*');
      await T.say('Student', 'He is my father. They took him from our house in 1974. I only want to know where he is.');
      await T.say('Cabo Fuentes', 'Shall I take him in, mi General? Or will you?');
      const c = await T.choice(['"Let him go. Tell your sergeant I questioned him myself."', '"Take him in. Leaflets are leaflets."', '"Give me the leaflets. And write down his name."'], 'The student');
      if (c === 0) {
        await T.say('Cabo Fuentes', '…As you say, mi General.');
        await T.say('Student', '*He doesn’t thank you. He just runs.*');
        J.setFlag('papers:freed'); J.stat('mercy');
      } else if (c === 1) {
        await T.say('Student', 'You are one of them. Of course you are.');
        J.setFlag('papers:taken'); J.stat('fear');
      } else {
        G.give('leaflets');
        await T.say('Emilio', 'Every name is worth something. Someday.');
        await T.say('Cabo Fuentes', 'Sí, mi General. *He writes it down.*');
        J.setFlag('papers:name'); J.stat('fear');
      }
      J.complete();
    },
  },

  // ---------------------------------------------------------- Avenida Matta, 1984
  {
    id: 'delivery', title: 'Chicken Delivery', blurb: 'The delivery boy needs help with the lunch orders.', loc: 'pollos',
    avail: POLLOS, hideGiverWhileActive: false,
    giver: { name: 'Rodrigo', look: 'waiter', x: -10, z: 6.4, yaw: Math.PI, wander: 0.3 },
    steps: {
      run: {
        text: 'Deliver four orders up and down Avenida Matta before they go cold', retry: 'idle',
        enter(J) {
          J.run({
            label: 'Deliveries', time: 48, points: [[-44, -8.2], [-69, 7.2], [45, 7.2], [67, -8.2]],
            onWin: (r) => {
              const tip = r.time < 40 ? 1000 : 0;
              J.G.addPesos(2500 + tip, tip ? 'Delivery money + tips' : 'Delivery money');
              J.complete(tip ? 'hot chicken, big tips' : 'delivered');
            },
            onLose: () => J.fail('Cold chicken. Talk to Rodrigo to try again.'),
          });
        },
      },
      idle: { text: 'Talk to Rodrigo to try the deliveries again', target: { x: -10, z: 6.4 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Rodrigo', 'Señor Gonzalez delivering chicken! The whole avenue is talking about it.'); return; }
      await T.say('Rodrigo', 'Señor Gonzalez! My bicycle has a flat and four orders are going cold. The tailor, the dentist, the garage, the school.');
      await T.say('Emilio', 'Customers who wait are customers who leave.');
      const c = await T.choice(['"Give me the bags." (hold Shift to run)', '"Fix your bicycle, Rodrigo."'], 'Rodrigo');
      if (c === 0) J.active ? J.go('run') : J.start('run');
      else await T.say('Rodrigo', 'Sí, señor… *He stares sadly at the bags.*');
    },
  },
  {
    id: 'ortuzar', title: 'Protection', blurb: 'A Carabinero sergeant wants a weekly "contribution".', loc: 'pollos',
    avail: POLLOS, hideGiverWhileActive: true,
    giver: { name: 'Sargento Ortúzar', look: 'carabinero', x: -24, z: 6.4, yaw: Math.PI, wander: 0.2, when: (S, J) => POLLOS(S) && !J.done && !J.active },
    steps: {
      fight: {
        text: 'Deal with Sargento Ortúzar and his partner', retry: 'idle',
        enter(J) {
          J.fight({
            id: 'ortuzar', name: 'Avenida Matta', at: [-24, 4], size: 6, speaker: 'Sargento Ortúzar',
            thugs: [{ look: 'carabinero', dx: 0, dz: 1.8, yaw: Math.PI }, { look: 'carabinero', dx: 2.2, dz: 0.8, yaw: -Math.PI / 2 }],
            barks: ['Wrong answer, chicken man.'],
            loseMsg: 'Ortúzar’s men beat you in the street while your customers watched.',
          });
        },
        on(e, J) {
          if (e === 'won:ortuzar') { J.setFlag('ortuzar:beaten'); J.stat('fear', 2); J.complete('He will not ask again'); }
          if (e === 'escaped:ortuzar') J.fail('You ran. Ortúzar will be back.');
        },
      },
      idle: { text: 'Sargento Ortúzar is waiting outside Los Pollos', target: { x: -24, z: 6.4 } },
    },
    async talk(T, G, S, J) {
      await T.say('Sargento Ortúzar', 'So. The chicken man. Gonzalez, no? They say you used to be a General.');
      await T.say('Sargento Ortúzar', 'Avenida Matta is a dangerous street, señor. Windows break. Kitchens catch fire. Five thousand a week and nothing breaks.');
      await T.say('Emilio', '(I know this speech. I used to give it.)');
      const c = await T.choice(['Pay him ($ 5.000)', '"Every Friday, you and your men eat here. On the house. Whatever you want."', '"No."'], 'Sargento Ortúzar');
      if (c === 0) {
        if (G.pesos < 5000) { await T.say('Emilio', 'I don’t have it on me.'); return; }
        G.addPesos(-5000, 'Ortúzar’s "contribution"');
        await T.say('Sargento Ortúzar', 'A sensible man. Same time next week.');
        J.setFlag('ortuzar:paid');
        J.complete();
      } else if (c === 1) {
        await T.say('Sargento Ortúzar', '…Free chicken. Every Friday.');
        await T.say('Emilio', 'And when your men are hungry, they will know whose table they eat at.');
        await T.say('Sargento Ortúzar', '*He laughs, slowly.* You really were a General. Friday, then.');
        await T.say('Emilio', '(Never pay a policeman in cash. Pay him in habit.)');
        J.setFlag('ortuzar:fed');
        J.complete('a friend in the Carabineros');
      } else {
        await T.say('Sargento Ortúzar', '*He nods to his partner.*');
        J.active ? J.go('fight') : J.start('fight');
      }
    },
  },
  {
    id: 'choros', title: 'Los Choros Come Back', blurb: 'Don Beto says Los Choros are back at his bodega — armed.', loc: 'pollos',
    avail: (S) => S.past('pAmbush') && !S.past('peterScene'), hideGiverWhileActive: false,
    giver: { name: 'Don Beto', look: 'shopkeeper', x: 45, z: 6.8, yaw: Math.PI / 2, wander: 0 },
    steps: {
      fight: {
        text: 'Drive Los Choros away from Bodega San Pablo — use the crates for cover', retry: 'idle',
        target: { x: 64, z: 0 },
        enter(J) {
          J.fight({
            id: 'choros2', name: 'Bodega San Pablo', at: [69, -1], size: 13, guns: true, speaker: 'Los Choros',
            thugs: [{ look: 'thug', dx: 3, dz: -3 }, { look: 'thug2', dx: 7, dz: 4 }, { look: 'rioter', dx: -1, dz: -5.5 }, { look: 'thug', dx: 8, dz: -5 }],
            barks: ['¡El pollero! He came back for more!', 'This time we brought more than knives, viejo.'],
            loseMsg: 'Los Choros brought you down in front of the bodega.',
          });
        },
        on(e, J) {
          if (e === 'won:choros2') { J.G.addPesos(8000, 'Don Beto\u2019s gratitude'); J.stat('fear'); J.setFlag('choros:gone'); J.complete('Los Choros are finished on Avenida Matta'); }
          if (e === 'escaped:choros2') J.fail('You pulled back. Los Choros still hold the bodega.');
        },
      },
      idle: { text: 'Talk to Don Beto when you are ready to take back the bodega', target: { x: 45, z: 6.8 } },
    },
    async talk(T, G, S, J) {
      if (J.done) { await T.say('Don Beto', 'Not one of them has shown his face since. The whole avenue owes you, Señor Gonzalez.'); return; }
      if (J.step === 'fight') { await T.say('Don Beto', '¡Cuidado! They are behind the crates!'); return; }
      await T.say('Don Beto', 'Señor Gonzalez! Los Choros came back — four of them, and this time they have guns. They are in front of my bodega, waiting for you.');
      await T.say('Don Beto', 'They said the pollero owes them for yesterday.');
      if (!G.has('revolver') && !G.has('pistol')) { await T.say('Emilio', '(Not with my bare hands. Not against guns.)'); return; }
      const c = await T.choice(['"Stay here. Keep your head down."', '"Call the Carabineros, Don Beto."'], 'Don Beto');
      if (c === 0) J.active ? J.go('fight') : J.start('fight');
      else await T.say('Don Beto', 'The Carabineros? On Avenida Matta? *He laughs until he coughs.*');
    },
  },
];

JOBS.push(...EMPIRE_JOBS);

const FLOUR = [{ id: 'flour1', x: -55, z: 4.5 }, { id: 'flour2', x: 3.2, z: -30 }, { id: 'flour3', x: 52, z: -15 }];

// ================================================================ collectibles
export const KINDS = {
  pesos: { name: 'Dropped pesos', plural: 'Dropped pesos', icon: '🪙', model: 'coin', where: 'Valparaíso & Avenida Matta' },
  tag: { name: 'Dog tag', plural: 'Dog tags', icon: '🏷️', model: 'tag', where: 'Regimiento Tacna' },
  clipping: { name: 'Censored clipping', plural: 'Censored clippings', icon: '📰', model: 'clipping', where: 'Santiago',
    reward: { text: '*All eight clippings. Read together, they tell the story the newspapers would not print.*' } },
};

export const COLLECTIBLES = {
  barrio: [
    [-58, 55, 20], [-12, 56.5, 15], [-50, 4, 30], [3.5, 48, 10], [-3.5, -55, 25], [58, -15, 40], [20, -69.5, 20], [59, -68, 35],
  ].map(([x, z, pesos], i) => ({ id: `bp${i}`, kind: 'pesos', x, z, pesos })),
  pollos: [
    [-75, 6.5, 400], [-60, -7.5, 300], [30, 6.8, 500], [75, -6.5, 600], [52, -7.5, 300], [-30, -7.5, 400],
  ].map(([x, z, pesos], i) => ({ id: `pp${i}`, kind: 'pesos', x, z, pesos })),
  cuartel: [
    { x: -37, z: -18, title: 'Dog tag — Soldado R. Aravena', text: 'Scratched into the back: "Mamá, Temuco." He washed out in week two. Nobody knows where he went.' },
    { x: 37, z: 36, title: 'Dog tag — Soldado J. Millán', text: 'Bent in half, as if someone stood on it. Millán is the one who cries at night. Everyone pretends not to hear.' },
    { x: -20, z: 38, title: 'Dog tag — Soldado T. Quiroga', text: 'Tomás Quiroga. The thin one. The chain was cut, and sold, by the look of it.' },
    { x: 30, z: -17, title: 'Dog tag — Cabo V. Díaz López', text: 'Polished. Engraved, not stamped — somebody paid for this one. Víctor dropped it and never noticed.' },
  ].map((c, i) => ({ id: `ct${i}`, kind: 'tag', ...c })),
  santiago: [
    { x: -30, z: 30, title: 'El Mercurio — March 1981', text: 'The new Constitution takes effect. General Pinochet is sworn in as President for an eight-year term. The front page calls it "the return to institutional order."' },
    { x: -45, z: 20, title: 'Cut from page 9', text: 'A small notice, half torn away: the Vicaría de la Solidaridad asks families of the detained-disappeared to bring photographs and dates. The editor cut the address.' },
    { x: 47, z: 20, title: 'Economy section', text: '"MILAGRO ECONÓMICO." The peso is fixed at 39 to the dollar. Imported televisions fill the shop windows on Providencia. On the next page: unemployment, in very small type.' },
    { x: 7, z: -30, title: 'A curfew notice', text: 'The curfew remains in effect. Citizens found in the street without authorization after the hour will be detained. Signed: the Jefatura de Zona en Estado de Emergencia.' },
    { x: -7, z: 10, title: 'Sports page', text: 'Colo-Colo fans fill the Estadio Nacional. The paper does not mention what the stadium was used for in September 1973.' },
    { x: 40, z: -44, title: 'A typed memo, not a newspaper', text: 'CENTRO DE INVESTIGACIÓN MILITAR — requisition: precursor chemicals, 200 kg. Purpose: "agricultural research." Countersigned: Gral. E. Gonzalez. Your own signature.' },
    { x: -40, z: -44, title: 'Underground newsletter', text: 'Mimeographed, smudged. "They say the economy is a miracle. Ask the poblaciones what a miracle tastes like: bread and tea, three times a day."' },
    { x: -45, z: 55, title: 'Classified ads', text: 'SE VENDE: restaurant equipment, good condition, owner leaving the country. Call after six. You read it twice. You tear it out.' },
  ].map((c, i) => ({ id: `sc${i}`, kind: 'clipping', ...c })),
};

// ================================================================ street crimes
// interval: seconds between crimes · police: punching people brings Carabineros
export const CRIME = {
  barrio: {
    interval: [55, 95], police: true, knife: 0.25, thugLooks: ['thug', 'thug2'], reward: [15, 50],
    barks: ['Walk away, hombre. This is not your business.', '¿Y tú? You want some too?'],
    kinds: [{ name: 'Street robbery' }, { name: 'Mugging', alert: 'Shouting nearby — somebody is being mugged.' }],
    special: [{
      flag: 'kidSaved', flagIgnored: 'kidIgnored', at: [-36, 5], thugs: 2, victimLook: 'shoeshine', name: 'Calle Norte', time: 80,
      alert: 'A kid is screaming on Calle Norte — two men have him against a wall.',
      barks: ['The kid owes us, amigo. Keep walking.', 'You his papá? No? Then go.'],
      thanks: '*The boy grabs your sleeve.* ¡Gracias, señor! I won’t forget you. I won’t!',
      ignoredMsg: 'Too late. The boy on Calle Norte lost everything he had.', reward: [0, 0],
    }],
  },
  santiago: {
    interval: [60, 100], police: false, knife: 0.4, thugLooks: ['thug', 'thug2', 'rioter'], reward: [800, 2000],
    when: (S) => !S.at('crime') && !S.at('walkFacility'),
    barks: ['Keep walking, milico. Not your business.', '¡Un General! Get out of here, viejo!'],
    kinds: [{ name: 'Street robbery' }, { name: 'Shop robbery', alert: 'Glass breaking — someone is robbing a shopkeeper.' }],
  },
  abq: {
    interval: [70, 120], police: true, knife: 0.4, thugLooks: ['thug', 'thug2', 'dealer'], reward: [200, 600],
    policeLook: 'apd', policeName: 'APD!', policeBarks: ['Albuquerque Police! Get on the ground!', 'Hands where I can see them!'],
    when: (S) => S.at('empire'),
    barks: ['Mind your business, chicken man.', 'Keep walking, old man.'],
    kinds: [{ name: 'Mugging', alert: 'Someone is being mugged on Central Avenue.' }, { name: 'Robbery', alert: 'A shopkeeper is shouting for help.' }],
  },
  pollos: {
    interval: [55, 95], police: true, knife: 0.35, thugLooks: ['thug', 'thug2', 'rioter'], reward: [1500, 4000],
    when: (S) => !S.at('pAmbush'),
    barks: ['Go back to your chickens, viejo.', 'You want to be a hero? Come on.'],
    kinds: [{ name: 'Street robbery' }, { name: 'Robbery', alert: 'A woman is shouting for help on Avenida Matta.' }],
  },
};
