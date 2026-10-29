// Chapter III — Empire. The open part of the game: recruit the crew, strike at
// the Salamancas, run the ledger. Every mission here is a job (see sidejobs.js
// for the job API); the story only moves on when the empire is ready.
// Crisis jobs (DEA raid, mutiny) are started by the ledger when the numbers go bad.

const EMPIRE = (S) => S.at('empire');
const fightStep = (text, target, cfg, onWin, extra = {}) => ({
  text, target, retry: 'idle',
  enter(J) { J.fight(cfg); },
  on(e, J) {
    if (e === 'won:' + cfg.id) onWin(J);
    if (e === 'escaped:' + cfg.id) J.go('idle');
  },
  ...extra,
});
const recruit = (J, id, name) => {
  J.setFlag('crew:' + id);
  J.G.ui.toast(`${name} joins the organization`, 'Crew');
  J.G.empire.render();
  J.G.emit('empire:changed');
};
const strike = (J, fx, why) => {
  const E = J.G.empire.E;
  E.revenge++;
  J.G.empire.apply(fx, why);
  J.G.emit('empire:changed');
};

export const EMPIRE_JOBS = [
  // ================================================================ crew
  {
    id: 'crewVictor', title: 'The Line Cook', blurb: 'Victor, your night cook, says men are hanging around the parking lot.', loc: 'abq',
    avail: EMPIRE, hideGiverWhileActive: false,
    giver: { name: 'Victor', look: 'victorCook', x: -36, z: 7.6, yaw: Math.PI, wander: 0, when: (S, J) => EMPIRE(S) && !J.done },
    steps: {
      fight: fightStep('Deal with the men in the parking lot', { x: -44, z: 15 }, {
        id: 'jxLot', name: 'Parking lot', at: [-46, 15], size: 7, speaker: 'Robber',
        thugs: [{ look: 'thug', dx: -2, dz: -2 }, { look: 'thug2', dx: 2, dz: -1, weapon: 'knife' }, { look: 'dealer', dx: 0, dz: 2.5 }],
        barks: ['Walk away, chicken man.', 'The cash box. Now.'], loseMsg: 'The robbers left you on the asphalt behind your own restaurant.',
      }, (J) => J.go('talk')),
      talk: { text: 'Talk to Victor', target: { x: -36, z: 7.6 } },
      idle: { text: 'Talk to Victor when you are ready', target: { x: -36, z: 7.6 } },
    },
    async talk(T, G, S, J) {
      if (J.step === 'fight') { await T.say('Victor', 'By the cars, Mr. Fring. Three of them.'); return; }
      if (J.step === 'talk') {
        await T.say('Victor', 'They did not get the cash box. I wrote down their plate while you were busy. And the time. And which way they drove.');
        await T.say('Gustavo', 'You did not run. You did not call the police.');
        await T.say('Victor', 'You did not call them either, Mr. Fring.');
        const c = await T.choice(['"How would you like to work for me? Not in the kitchen."', '"Forget the plate number. Forget tonight."'], 'Victor');
        if (c === 1) { await T.say('Victor', '…Forgotten. *He tears the page out and hands it to you.*'); await T.say('Gustavo', '(He did not even ask why. Good.)'); }
        await T.say('Victor', 'Whatever you need, Mr. Fring.');
        recruit(J, 'victor', 'Victor');
        J.complete('Victor watches the roads now (−4 heat a week)');
        return;
      }
      await T.say('Victor', 'Mr. Fring. Three men in the parking lot, every night this week. Tonight they are waiting by the dumpster.');
      await T.say('Victor', 'I can call someone.');
      const c = await T.choice(['"No. I will handle it."', '"Not now."'], 'Victor');
      if (c === 0) J.active ? J.go('fight') : J.start('fight');
    },
  },
  {
    id: 'crewTyrus', title: 'The Doorman', blurb: 'The bouncer at The Crossroads does not let "chicken men" in.', loc: 'abq',
    avail: EMPIRE, hideGiverWhileActive: false,
    giver: { name: 'Tyrus', look: 'tyrus', x: 65, z: 9.6, yaw: Math.PI, wander: 0, when: (S, J) => EMPIRE(S) && !J.done && (!J.active || J.step === 'idle') },
    steps: {
      fight: fightStep('Beat Tyrus — watch for his haymaker (dodge with Space)', { x: 65, z: 4 }, {
        id: 'jxTyrus', name: 'The Crossroads', at: [65, 4], size: 6, speaker: 'Tyrus',
        thugs: [{ look: 'tyrus', dx: 0, dz: 0, boss: true, hp: 190, name: 'Tyrus' }],
        barks: ['All right, old man. One round.'], loseMsg: 'Tyrus picked you up off the sidewalk, put you in a cab and paid the driver.',
      }, (J) => J.go('talk')),
      talk: { text: 'Talk to Tyrus', target: { x: 65, z: 4 } },
      idle: { text: 'Talk to Tyrus when you are ready for round two', target: { x: 65, z: 9.6 } },
    },
    npcs: [{ id: 'tyrusAfter', name: 'Tyrus', look: 'tyrus', x: 66.5, z: 4, yaw: -Math.PI / 2, wander: 0, when: (S, J) => J.active && J.step === 'talk' }],
    async talk(T, G, S, J) {
      if (J.step === 'talk') {
        await T.say('Tyrus', '*He wipes his lip and laughs.* Nobody puts me on the ground. Nobody.');
        await T.say('Gustavo', 'I need a man who stands at a door and nobody walks through it. I pay three times what this bar pays.');
        await T.say('Tyrus', 'Three times? …For a chicken place?');
        await T.say('Gustavo', 'For me.');
        recruit(J, 'tyrus', 'Tyrus');
        J.complete('Tyrus stands behind you now (+3 fear a week)');
        return;
      }
      if (J.step === 'idle') {
        const c = await T.choice(['"Again."', '"Later."'], 'Tyrus');
        if (c === 0) J.go('fight');
        return;
      }
      await T.say('Tyrus', 'Private party. Not for you, chicken man.');
      await T.say('Gustavo', 'I am not here for the party. I am here for you. I need someone at my door.');
      await T.say('Tyrus', '*He laughs.* You want me? Put me on the ground first.');
      const c = await T.choice(['"Very well."', '"Another time."'], 'Tyrus');
      if (c === 0) J.active ? J.go('fight') : J.start('fight');
    },
  },
  {
    id: 'crewMike', title: 'Half Measures', blurb: 'An ex-cop doing security at the motel says one of your dealers talks to the DEA.', loc: 'abq',
    avail: EMPIRE, hideGiverWhileActive: false,
    giver: { name: 'Mike Ehrmantraut', look: 'mike', x: 22, z: -9.5, yaw: Math.PI, wander: 0, when: (S, J) => EMPIRE(S) && !J.done },
    npcs: [
      { id: 'd1', name: 'Dealer — Spooge', look: 'dealer', x: 46, z: -9, yaw: -1, wander: 0, when: (S, J) => J.active && J.step === 'ask',
        async talk(T, G, S, J) { if (J.data.d1) { await T.say('Spooge', 'I told you already, man.'); return; } await T.say('Spooge', 'Leon? Leon drives a new car. Nobody on this corner drives a new car.'); J.data.d1 = 1; clue(J); } },
      { id: 'd2', name: 'Dealer — Wendy', look: 'oldWoman', x: 8, z: 8.4, yaw: Math.PI, wander: 0, when: (S, J) => J.active && J.step === 'ask',
        async talk(T, G, S, J) { if (J.data.d2) { await T.say('Wendy', 'Go away, honey.'); return; } await T.say('Wendy', 'Leon meets a man in a windbreaker by the arroyo. West end, past the gas station. Tuesdays.'); J.data.d2 = 1; clue(J); } },
      { id: 'd3', name: 'Dealer — Leon', look: 'thug2', x: -66, z: 8.4, yaw: Math.PI, wander: 0.5, when: (S, J) => J.active && J.step === 'ask',
        async talk(T, G, S, J) { if (J.data.d3) { await T.say('Leon', '…'); return; } await T.say('Leon', 'Mr. Fring! Everything is good. Real good. Nothing to worry about.'); await T.say('Gustavo', '(He is sweating. It is not that hot.)'); J.data.d3 = 1; clue(J); } },
    ],
    steps: {
      ask: { text: (J) => `Ask your street dealers who talks to the DEA (${['d1', 'd2', 'd3'].filter((k) => J.data[k]).length}/3)`,
        target: (J) => [{ k: 'd1', x: 46, z: -9 }, { k: 'd2', x: 8, z: 8.4 }, { k: 'd3', x: -66, z: 8.4 }].find((d) => !J.data[d.k]) },
      arroyo: { text: 'Catch Leon at the arroyo, west end of Central', target: { x: -88, z: -2 } },
      chase: { text: 'Catch Leon', retry: 'arroyo',
        enter(J) {
          J.chase({ look: 'thug2', name: 'Leon', from: [-86, -4], speed: 5.4, path: [[-70, -12], [-40, -12], [-20, 6], [10, 6], [40, -6], [70, 5]],
            onCatch: async () => { J.go('decide'); },
            onEscape: () => { J.go('arroyo'); J.G.ui.toast('Leon got away — he will be back at the arroyo.', 'Chase', true); } });
        },
      },
      decide: { text: 'Decide what to do with Leon', target: { x: -60, z: 0 } },
      back: { text: 'Go back to Mike at the motel', target: { x: 22, z: -9.5 } },
    },
    triggers: [{ id: 'arroyo', event: 'jx:arroyo', minX: -95, maxX: -80, minZ: -12, maxZ: 8, when: (S, J) => J.active && J.step === 'arroyo' }],
    uses: [{ x: -60, z: 0, r: 60, label: 'Deal with Leon', when: (S, J) => J.active && J.step === 'decide',
      async fn(T, G, S, J) {
        await T.say('Leon', 'Please, Mr. Fring — they had my brother — I only told them about the corners, never about you, never—');
        const c = await T.choice(['Half measure: pay him off and send him away ($5,000)', 'Full measure: “Mike will take care of it.”', 'Give him to the Salamancas — let them owe you'], 'Leon');
        if (c === 0) { G.addPesos(-5000, 'Leon’s bus ticket'); G.empire.apply({ heat: 10, rep: 4 }, 'A half measure'); J.setFlag('leon:half'); await T.say('Gustavo', 'Get on a bus, Leon. Tonight.'); }
        else if (c === 1) { G.empire.apply({ fear: 12, heat: -12 }, 'No half measures'); J.setFlag('leon:full'); await T.say('', '*Mike steps out of a car you did not hear arrive. Leon stops talking.*'); }
        else { G.empire.apply({ rep: -10, fear: 6 }, 'A gift for the cartel'); J.setFlag('leon:cartel'); await T.say('Gustavo', '(Let Hector’s men think I am their friend. For now.)'); }
        J.go('back');
      } }],
    async talk(T, G, S, J) {
      if (J.step === 'back') {
        if (J.flag('leon:half')) await T.say('Mike Ehrmantraut', 'You let him go. I did that once. A man I let go killed a girl two weeks later. No more half measures, Mr. Fring.');
        else await T.say('Mike Ehrmantraut', 'It is done, then.');
        await T.say('Gustavo', 'You were a police officer. Why help me?');
        await T.say('Mike Ehrmantraut', 'I have a granddaughter. You pay better than the city. And you do not seem like a man who makes the same mistake twice.');
        recruit(J, 'mike', 'Mike Ehrmantraut');
        J.complete('Mike handles security now (“Clean house” in the ledger)');
        return;
      }
      if (J.active) { await T.say('Mike Ehrmantraut', J.step === 'ask' ? 'Ask around. Somebody always knows.' : 'You know where he is. Go.'); return; }
      await T.say('Mike Ehrmantraut', 'You are Fring. The chicken man. One of your street guys has been talking to a man in a DEA windbreaker.');
      await T.say('Gustavo', 'And why would you tell me that?');
      await T.say('Mike Ehrmantraut', 'Because you will find out anyway. I would rather you owed me than not.');
      const c = await T.choice(['"Which one?"', '"Not now."'], 'Mike Ehrmantraut');
      if (c === 0) { await T.say('Mike Ehrmantraut', 'That is your job. Ask your people. Somebody always knows.'); J.start('ask'); }
    },
    onEvent(e, J) { if (e === 'jx:arroyo' && J.step === 'arroyo') J.go('chase'); },
  },
  {
    id: 'crewGale', title: 'The Scholarship', blurb: 'A chemistry student at UNM is looking for funding.', loc: 'abq',
    avail: EMPIRE, hideGiverWhileActive: false,
    giver: { name: 'Gale Boetticher', look: 'gale', x: -17, z: -13.6, yaw: Math.PI, wander: 0.5, when: (S, J) => EMPIRE(S) && !J.done },
    steps: {
      lab: { text: 'Meet Gale at the Madrigal warehouse lab and cook a test batch', target: { x: -58, z: -12 } },
    },
    uses: [{ x: -58, z: -12, r: 2, label: 'Start the test cook with Gale', when: (S, J) => J.active && J.step === 'lab',
      async fn(T, G, S, J) {
        await T.say('Gale Boetticher', 'Okay! Okay. Reduction first. You want to watch the temperature like a hawk — a hawk that loves thermometers.');
        let score = 0;
        const q = [
          ['The flask is climbing past 80°. What do you do?', ['Lower the heat, slowly', 'Leave it — faster is better', 'Add more reagent'], 0],
          ['It is time to filter. Gale asks which paper.', ['The cheap paper, it is the same', 'The fine paper — and filter twice', 'Skip filtering'], 1],
          ['Crystals are forming. How long do you let them sit?', ['Ten minutes, we are busy', 'Until Gale says so — overnight', 'Stir them'], 1],
        ];
        for (const [qq, opts, right] of q) {
          await T.say('Gale Boetticher', qq);
          const c = await T.choice(opts, 'The cook');
          if (c === right) { score++; await T.say('Gale Boetticher', 'Yes! Exactly. You have done this before, haven’t you?'); }
          else await T.say('Gale Boetticher', 'Mm. Hm. We can… adjust.');
        }
        await T.say('Gustavo', '(Max used to talk to the flasks like this. Like they could hear him.)');
        G.empire.apply({ product: 8 + score * 6 }, `Test batch — ${score}/3`);
        recruit(J, 'gale', 'Gale Boetticher');
        J.complete('Gale runs the lab (+2 product a week)');
      } }],
    async talk(T, G, S, J) {
      if (J.active) { await T.say('Gale Boetticher', 'The warehouse with the blue sign! I brought my own goggles.'); return; }
      await T.say('Gale Boetticher', 'Oh — hello! Are you here for the poster session? Most people are not here for the poster session.');
      await T.say('Gustavo', 'I am here for you, Mr. Boetticher. Your professor says you are the best chemist he has taught in twenty years. And that you cannot pay for your doctorate.');
      await T.say('Gale Boetticher', 'He said that? …Chemistry is the study of change, you know. Of what things become.');
      await T.say('Gustavo', '(He even talks like Max. Max would have liked him.)');
      const c = await T.choice(['Pay his scholarship ($20,000)', '"Another time."'], 'Gale Boetticher');
      if (c !== 0) return;
      if (G.pesos < 20000) { await T.say('Gustavo', '(Not enough in the safe. Not yet.)'); return; }
      G.addPesos(-20000, 'Gale’s scholarship');
      G.empire.apply({ rep: 4 }, 'A patron of science');
      await T.say('Gale Boetticher', 'I — thank you. What do I… what would you like me to make?');
      await T.say('Gustavo', 'Something pure.');
      J.start('lab');
    },
  },
  {
    id: 'crewSaul', title: 'Better Call', blurb: 'One of your dealers has been arrested. There is a lawyer on Central.', loc: 'abq',
    avail: EMPIRE, hideGiverWhileActive: false,
    giver: { name: 'Saul Goodman', look: 'saul', x: 29, z: 9.6, yaw: Math.PI, wander: 0.4, when: (S, J) => EMPIRE(S) && !J.done },
    steps: {
      witness: { text: 'The only witness waits for the bus at the university — catch him before he testifies', target: { x: -6, z: -9 } },
      chase: { text: 'Catch the witness', retry: 'witness',
        enter(J) {
          J.chase({ look: 'student', name: 'the witness', from: [-20, -5], speed: 5.0, path: [[-34, 4], [-52, 5], [-70, 6], [-84, -4], [-60, -6], [-30, -6]],
            onCatch: () => J.go('persuade'), onEscape: () => { J.go('witness'); J.G.ui.toast('He got on the bus. He will be back tomorrow.', 'Chase', true); } });
        } },
      persuade: { text: 'Persuade the witness', target: { x: -30, z: -2 } },
      back: { text: 'Back to Saul’s office', target: { x: 29, z: 9.6 } },
    },
    triggers: [{ id: 'busstop', event: 'jx:bus', minX: -12, maxX: 0, minZ: -14, maxZ: -6, when: (S, J) => J.active && J.step === 'witness' }],
    uses: [{ x: -30, z: 0, r: 80, label: 'Talk to the witness', when: (S, J) => J.active && J.step === 'persuade',
      async fn(T, G, S, J) {
        await T.say('Witness', 'I saw what I saw! The man had a bag and the cop took it!');
        const c = await T.choice(['"You saw a man drop a bag of laundry." ($3,000)', '"You have a sister in Las Cruces. Pretty house."', '"Testify, then. See what happens."'], 'The witness');
        if (c === 0) { G.addPesos(-3000, 'A new memory'); await T.say('Witness', '…Laundry. Yeah. It was laundry.'); }
        else if (c === 1) { G.empire.apply({ fear: 8, rep: -4 }, 'A quiet word'); await T.say('Witness', '*He goes white.* I didn’t see anything. I swear.'); }
        else { G.empire.apply({ heat: 10 }, 'A witness who talks'); await T.say('Witness', '*He runs to the police the same afternoon.*'); }
        J.go('back');
      } }],
    async talk(T, G, S, J) {
      if (J.step === 'back') {
        await T.say('Saul Goodman', 'And the case evaporates! Like magic. Like a beautiful, expensive magic trick.');
        await T.say('Saul Goodman', 'Now — a man with your kind of… cash flow… needs a man like me. Nail salons. Car washes. Laser tag. I make dirty money look like it went to Sunday school.');
        recruit(J, 'saul', 'Saul Goodman');
        J.complete('Saul launders the money (+15% income, cheaper pay-offs)');
        return;
      }
      if (J.active) { await T.say('Saul Goodman', 'The witness, Mr. F! The bus stop by the university! Chop chop!'); return; }
      await T.say('Saul Goodman', 'Saul Goodman! Did you know you have rights? The Constitution says you do. And so do I.');
      await T.say('Saul Goodman', 'Your guy — Pedro? Pablo? Pedro — got picked up with a bag that was definitely not his. The only witness is a grad student who takes the bus at UNM.');
      const c = await T.choice(['Hire him ($10,000)', '"I do not know any Pedro."'], 'Saul Goodman');
      if (c !== 0) { await T.say('Saul Goodman', 'Course you don’t. Card’s on the desk. Better call!'); return; }
      if (G.pesos < 10000) { await T.say('Saul Goodman', 'Ten grand is ten grand, my friend. Cash, preferably small.'); return; }
      G.addPesos(-10000, 'Saul’s retainer');
      J.start('witness');
    },
    onEvent(e, J) { if (e === 'jx:bus' && J.step === 'witness') J.go('chase'); },
  },

  // ================================================================ strikes against the Salamancas
  {
    id: 'revTires', title: 'Llantera El Tío', blurb: 'The tire shop is Hector Salamanca’s laundry in Albuquerque. Take it apart.', loc: 'abq',
    avail: (S) => EMPIRE(S) && (S.flag('crew:tyrus') || (S.empire?.()?.fear ?? 0) >= 45), hideGiverWhileActive: false,
    giver: { name: 'Tyrus', look: 'tyrus', x: -20, z: 7.4, yaw: Math.PI, wander: 0, when: (S, J) => (EMPIRE(S) && S.flag('crew:tyrus') && !J.done) || (J.active && J.step === 'idle') },
    steps: {
      fight: fightStep('Raid Llantera El Tío — shoot the propane tanks to break their line', { x: 66, z: -14 }, {
        id: 'jxTires', name: 'Llantera El Tío', at: [66, -14], size: 12, guns: true, speaker: 'Salamanca sicario',
        thugs: [{ look: 'cartel', dx: -6, dz: -3 }, { look: 'cartel', dx: 6, dz: -4 }, { look: 'twin', dx: 0, dz: -6 }, { look: 'cartel', dx: 10, dz: 0 }],
        barks: ['¡Es el pollero! Tell El Tío!', 'You picked the wrong shop, chicken man.'], loseMsg: 'The tire shop was a fortress. They left you among the tires.',
        waves: [[{ look: 'cartel', dx: -14, dz: -8 }, { look: 'cartel', dx: 14, dz: -8 }, { look: 'twin', dx: 0, dz: -10 }]],
        waveMsg: 'More of them come out of the shop!',
      }, (J) => J.go('ledger')),
      ledger: { text: 'Take the Salamanca ledger from the office', target: { x: 66, z: -18.4 },
        enter(J) {
          J.pickup({ id: 'salLedger', x: 66, z: -18.4, model: 'bag', label: 'Take the Salamanca ledger', async onTake(T) {
            J.G.give('salLedger');
            strike(J, { money: 30000, fear: 12, heat: 15 }, 'Llantera El Tío');
            J.complete('The first strike. Hector will hear about it.');
          } });
        } },
      idle: { text: 'Talk to Tyrus when you are ready to hit the tire shop', target: { x: -20, z: 7.4 } },
    },
    async talk(T, G, S, J) {
      if (J.step === 'idle') { const c = await T.choice(['"Now."', '"Not yet."'], 'Tyrus'); if (c === 0) J.go('fight'); return; }
      if (J.active) { await T.say('Tyrus', 'East end. The tire shop. I will be right behind you.'); return; }
      await T.say('Tyrus', 'The tire shop on the east end. Llantera El Tío. Cartel money goes in dirty, comes out as invoices for tires nobody buys.');
      await T.say('Gustavo', 'El Tío. Hector Salamanca.');
      await T.say('Tyrus', 'They keep a book in the back. Names, dates, payments. Everyone who works for the Salamancas north of the border.');
      await T.say('Gustavo', '(Everyone who was at the pool.)');
      if (!G.has('pistol') && !G.has('revolverMax') && !G.has('revolver')) G.give('pistolABQ');
      const c = await T.choice(['"We go tonight."', '"Not yet."'], 'Tyrus');
      if (c === 0) J.start('fight');
    },
  },
  {
    id: 'revHighway', title: 'The Shipment', blurb: 'A Salamanca courier drives cartel money down Central every Thursday.', loc: 'abq',
    avail: (S) => EMPIRE(S) && S.flag('crew:mike'), hideGiverWhileActive: false,
    giver: { name: 'Mike Ehrmantraut', look: 'mike', x: -46, z: -8.8, yaw: Math.PI, wander: 0, when: (S, J) => (EMPIRE(S) && S.flag('crew:mike') && !J.done) },
    steps: {
      wait: { text: 'Wait for the Salamanca courier at the west end of Central', target: { x: -86, z: 2 } },
      chase: { text: 'Catch the courier before he reaches the tire shop', retry: 'wait',
        enter(J) {
          J.chase({ look: 'cartel', name: 'the courier', from: [-84, 4], speed: 5.8, path: [[-60, 4], [-30, 5], [0, 5], [30, 5], [60, -4], [66, -12]],
            onCatch: () => J.go('escort'), onEscape: () => { J.go('wait'); J.G.ui.toast('The courier made it to the tire shop. Next Thursday.', 'Chase', true); } });
        } },
      escort: fightStep('His escorts are coming — take them down', { x: 30, z: 0 }, {
        id: 'jxEscort', name: 'Central Avenue', at: [20, 0], size: 16, guns: true, speaker: 'Escort',
        thugs: [{ look: 'cartel', dx: 10, dz: -3 }, { look: 'cartel', dx: 12, dz: 3 }, { look: 'twin', dx: 14, dz: 0 }],
        barks: ['¡Suelta el maletín!', 'Drop the case and walk, old man.'], loseMsg: 'The courier’s escorts brought you down in the middle of Central Avenue.',
      }, (J) => { strike(J, { money: 50000, heat: 18, fear: 6 }, 'The Salamanca shipment'); J.complete('The cartel’s money is in your safe now.'); }),
      idle: { text: 'Talk to Mike when you are ready', target: { x: -46, z: -8.8 } },
    },
    triggers: [{ id: 'courier', event: 'jx:courier', minX: -95, maxX: -78, minZ: -8, maxZ: 10, when: (S, J) => J.active && J.step === 'wait' }],
    async talk(T, G, S, J) {
      if (J.step === 'idle') { const c = await T.choice(['"Go."', '"Not yet."'], 'Mike Ehrmantraut'); if (c === 0) J.go('wait'); return; }
      if (J.active) { await T.say('Mike Ehrmantraut', 'West end. He comes in on 66.'); return; }
      await T.say('Mike Ehrmantraut', 'Every Thursday a courier brings the Salamancas’ cut up from Juárez. Same car, same route, same stupid hat.');
      await T.say('Mike Ehrmantraut', 'You take it, they know it was you. You understand that.');
      const c = await T.choice(['"I want them to know."', '"Not yet."'], 'Mike Ehrmantraut');
      if (c === 0) J.start('wait');
    },
    onEvent(e, J) { if (e === 'jx:courier' && J.step === 'wait') J.go('chase'); },
  },
  {
    id: 'revRogelio', title: 'The Man Who Held Me Down', blurb: 'One of the men who held you at the pool drinks at The Crossroads.', loc: 'abq',
    avail: (S) => EMPIRE(S) && (S.empire?.()?.revenge ?? 0) >= 2, hideGiverWhileActive: false,
    giver: { name: 'Victor', look: 'victorCook', x: -24, z: 7.6, yaw: Math.PI, wander: 0, when: (S, J) => EMPIRE(S) && (S.empire?.()?.revenge ?? 0) >= 2 && !J.done && S.flag('crew:victor') },
    steps: {
      fight: fightStep('Rogelio Salamanca — the man who held you down at the pool', { x: 66, z: 2 }, {
        id: 'jxRogelio', name: 'The Crossroads', at: [66, 2], size: 8, speaker: 'Rogelio Salamanca',
        thugs: [{ look: 'cartel', dx: 0, dz: 1, boss: true, hp: 240, name: 'Rogelio Salamanca' }, { look: 'twin', dx: -3, dz: -1 }, { look: 'cartel', dx: 3, dz: -1.5, weapon: 'knife' }],
        barks: ['*He recognises you.* …The chileno. From the pool.', 'I held you down while your friend died, pollero. I would do it again.'], loseMsg: 'Rogelio Salamanca held you down one more time.',
      }, (J) => J.go('end')),
      end: { text: 'Decide what happens to Rogelio', target: { x: 66, z: 2 } },
      idle: { text: 'Talk to Victor when you are ready', target: { x: -24, z: 7.6 } },
    },
    uses: [{ x: 66, z: 2, r: 30, label: 'Rogelio Salamanca', when: (S, J) => J.active && J.step === 'end',
      async fn(T, G, S, J) {
        await T.say('Rogelio Salamanca', '*on his knees in the gravel* Hector will — Hector will—');
        await T.say('Gustavo', 'Look at me.');
        const c = await T.choice(['"Go home. Tell Hector I am coming."', '“Mike.” (He never leaves the parking lot.)'], 'Rogelio Salamanca');
        if (c === 0) { strike(J, { fear: 8, rep: 6, heat: 6 }, 'A message for Hector'); J.setFlag('rogelio:spared'); await T.say('', '*He runs. He will tell Hector everything, and Hector will be waiting.*'); }
        else { strike(J, { fear: 15, heat: 10 }, 'Blood for blood'); J.setFlag('rogelio:dead'); await T.say('', '*You walk back to your car. You do not look back. You never look back now.*'); }
        J.complete('Two men from the pool are left: Hector Salamanca and Don Eladio.');
      } }],
    async talk(T, G, S, J) {
      if (J.step === 'idle') { const c = await T.choice(['"Tonight."', '"Not yet."'], 'Victor'); if (c === 0) J.go('fight'); return; }
      if (J.active) { await T.say('Victor', 'The Crossroads. He drinks there every night.'); return; }
      await T.say('Victor', 'Mr. Fring. The ledger from the tire shop — I checked every name. One of them is here. Rogelio Salamanca. Hector’s cousin.');
      await T.say('Victor', 'In 1989 he was Don Eladio’s bodyguard. He was at the pool.');
      await T.say('Gustavo', '…He is the one who held me down.');
      const c = await T.choice(['"Where is he?"', '"Not yet."'], 'Victor');
      if (c === 0) { await T.say('Victor', 'The Crossroads. Every night.'); J.start('fight'); }
    },
  },

  // ================================================================ crises (started by the ledger)
  {
    id: 'crisisRaid', title: 'DEA Raid', blurb: 'The DEA has a warrant for the Madrigal warehouse.', loc: 'abq', avail: () => false,
    giver: { name: 'Victor', look: 'victorCook', x: -90, z: -50, when: () => false },
    steps: {
      go: { text: 'DEA raid! Get to the Madrigal warehouse before they do', target: { x: -58, z: -10 } },
      move: { text: 'Load the product into the van before the DEA arrives', retry: 'go',
        enter(J) {
          J.run({ label: 'DEA raid', time: 50, radius: 1.8,
            points: [[-64, -11], [-44, -10], [-52, -11], [-44, -10], [-60, -12], [-44, -10]],
            onWin: () => {
              const G = J.G;
              G.addPesos(-Math.round(G.pesos * 0.15), 'Lawyers and lost product');
              G.empire.E.heat = 55; G.empire.add('product', -5, 'Raid');
              G.empire.endCrisis();
              J.complete('The DEA found a laundry. Only a laundry.');
            },
            onLose: () => {
              const G = J.G;
              G.addPesos(-Math.round(G.pesos * 0.5), 'Seized by the DEA');
              G.empire.E.heat = 50; G.empire.apply({ product: -20, rep: -10 }, 'Raid');
              G.empire.endCrisis();
              J.fail('The DEA seized the product — and half the money.');
            } });
        } },
    },
    triggers: [{ id: 'raidArrive', event: 'jx:raid', minX: -72, maxX: -44, minZ: -14, maxZ: -6, when: (S, J) => J.active && J.step === 'go' }],
    onEvent(e, J) { if (e === 'jx:raid' && J.step === 'go') J.go('move'); },
    async talk() {},
  },
  {
    id: 'crisisMutiny', title: 'Mutiny', blurb: 'Your own street crews have turned.', loc: 'abq', avail: () => false,
    giver: { name: 'Victor', look: 'victorCook', x: -90, z: -50, when: () => false },
    steps: {
      go: fightStep('Your own dealers are waiting behind Los Pollos — armed. Take back control', { x: -40, z: 22 }, {
        id: 'jxMutiny', name: 'Behind Los Pollos', at: [-38, 24], size: 9, guns: true, speaker: 'Your dealers',
        thugs: [{ look: 'dealer', dx: -3, dz: 0 }, { look: 'thug', dx: 3, dz: 1 }, { look: 'thug2', dx: 0, dz: 3 }, { look: 'dealer', dx: 5, dz: -2 }],
        barks: ['We work for ourselves now, Fring.', 'Nobody is scared of the chicken man any more.'], loseMsg: 'Your own men shot you behind your own restaurant.',
      }, (J) => { J.G.empire.apply({ fear: 25, rep: 6 }, 'Control restored'); J.G.empire.endCrisis(); J.complete('Nobody will try that again.'); }),
      idle: { text: 'Your dealers are still waiting behind Los Pollos', target: { x: -40, z: 22 },
        enter(J) { J.G.empire.add('fear', -6, 'You walked away'); J.go('go'); } },
    },
    async talk() {},
  },
];

function clue(J) {
  const n = ['d1', 'd2', 'd3'].filter((k) => J.data[k]).length;
  J.G.ui.toast(`Clue ${n}/3`, 'Half Measures');
  if (n >= 3) J.go('arroyo'); else J.refresh();
}
