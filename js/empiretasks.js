// Empire tasks: every move you pick in the ledger is a mission you go out and
// do. The money is committed when you start; the empire only changes when the
// job is finished (see Empire.finishTask).
const NOBODY = { name: '', look: 'victorCook', x: -90, z: -50, when: () => false };
const finish = (J, move, note) => { J.G.empire.finishTask(move); J.complete(note); };
const at = (J, step) => J.active && J.step === step;

// Where new routes are opened, one after another.
const ROUTE_SPOTS = [
  { x: 70, z: -4.6, place: 'the east end of Central' },
  { x: -72, z: 10.2, place: 'the Gas ’N Go' },
  { x: 12, z: -8.6, place: 'the Desert Sands Motel' },
  { x: 48, z: 6.2, place: 'the lot by The Crossroads' },
];
const LAB_CRATES = [
  { id: 'glass1', x: -11, z: -12.4, where: 'UNM loading door' },
  { id: 'glass2', x: 5, z: 15.6, where: 'Navajo Trading Post' },
  { id: 'glass3', x: -72, z: 10.4, where: 'Gas ’N Go' },
];

export const TASK_JOBS = [
  // ---------------------------------------------------------------- open a restaurant
  {
    id: 'tRestaurant', title: 'A New Los Pollos', blurb: 'Sign a lease, pass inspection, hire a manager.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      lease: { text: 'Meet the realtor at the empty lot by The Crossroads and sign the lease', target: { x: 48.5, z: 9.4 } },
      inspect: { text: 'Get the health permit — the inspector is eating at the Desert Sands Motel', target: { x: 20, z: -8 } },
      hire: { text: 'Hire a manager — the applicant is waiting outside Los Pollos', target: { x: -16, z: 9.2 } },
    },
    npcs: [
      { id: 'realtor', name: 'Realtor', look: 'clerk', x: 48.5, z: 10.2, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'lease'),
        async talk(T, G, S, J) {
          await T.say('Realtor', 'Mr. Fring! Twelve tables, a drive-through window, and the best parking on this side of town.');
          await T.say('Realtor', 'The owner wants five years up front. Cash makes him very flexible.');
          await T.say('', '*You sign "Gustavo Fring" in the same careful hand as always.*');
          J.go('inspect');
        } },
      { id: 'inspector', name: 'Health Inspector', look: 'doctor', x: 20, z: -7.4, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'inspect'),
        async talk(T, G, S, J) {
          await T.say('Health Inspector', 'Fring. The chicken man. Let me guess — you want the permit by Friday.');
          const c = await T.choice(['"Inspect it today. You will not find a crumb."', '"An envelope ($ 2,000) — and you never need to visit."'], 'The permit');
          if (c === 0) {
            await T.say('Health Inspector', '*Two hours later.* …Cleaner than my mother’s kitchen. Permit approved.');
            J.data.clean = true;
          } else if (G.pesos >= 2000) {
            G.addPesos(-2000, 'The inspector’s envelope');
            await T.say('Health Inspector', 'Approved. I was never here.');
            G.empire.add('heat', 2, 'A bought inspector');
          } else {
            await T.say('Gustavo', '(Not enough in my pocket. Then he gets the honest version.)');
            J.data.clean = true;
          }
          J.go('hire');
        } },
      { id: 'applicant', name: 'Applicant', look: 'waiter', x: -16, z: 9.6, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'hire'),
        async talk(T, G, S, J) {
          await T.say('Applicant', 'Mr. Fring. Eight years at Denny’s. I have never been late. Not once.');
          const c = await T.choice(['"Why do you want this job?"', '"You start Monday."'], 'The interview');
          if (c === 0) await T.say('Applicant', 'Because your restaurant is the only one on Central where the staff look proud of the uniform.');
          await T.say('Gustavo', 'Monday. Six a.m. Not five past.');
          finish(J, 'restaurant', J.data.clean ? 'Spotless — the city likes you (+reputation)' : 'Open for business');
          if (J.data.clean) G.empire.add('rep', 3, 'A spotless inspection');
        } },
    ],
  },

  // ---------------------------------------------------------------- open a distribution route
  {
    id: 'tRoute', title: 'A New Route', blurb: 'Load the product at Madrigal and meet the new distributor.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      load: { text: 'Load the product at the Madrigal loading dock', target: { x: -56, z: -10.6 },
        enter(J) {
          J.pickup({ id: 'routeLoad', x: -56, z: -10.6, model: 'drum', label: 'Load the product into the truck', onTake() {
            J.G.ui.toast('Loaded. Hidden under fryer oil drums.', 'A New Route');
            J.go('deliver');
          } });
        } },
      deliver: { text: (J) => `Meet the new distributor at ${ROUTE_SPOTS[J.data.spot ?? 0].place}`, target: (J) => ROUTE_SPOTS[J.data.spot ?? 0] },
      fight: { text: 'It was a setup — deal with them', retry: 'deliver',
        enter(J) {
          const p = ROUTE_SPOTS[J.data.spot ?? 0];
          J.fight({ id: 'jxRoute', name: 'The drop', at: [p.x, p.z], size: 7, speaker: 'Rival crew',
            thugs: [{ look: 'dealer', dx: -2, dz: -2 }, { look: 'thug2', dx: 2, dz: -1, weapon: 'knife' }, { look: 'thug', dx: 0, dz: 2.5 }],
            barks: ['Nice truck, chicken man. We will take it from here.'], loseMsg: 'They took the truck and left you in the gravel.' });
        },
        on(e, J) {
          if (e === 'won:jxRoute') { J.G.empire.add('fear', 4, 'Made an example'); finish(J, 'route', 'They will not try that twice'); }
          if (e === 'escaped:jxRoute') J.go('deliver');
        },
      },
    },
    // one distributor per drop spot; only the one for this route shows up
    npcs: ROUTE_SPOTS.map((p, i) => ({ id: 'distributor' + i, name: 'Distributor', look: 'dealer', x: p.x, z: p.z, yaw: Math.PI, wander: 0,
      when: (S, J) => at(J, 'deliver') && (J.data.spot ?? 0) === i,
      async talk(T, G, S, J) {
        await T.say('Distributor', 'Mr. Fring. Blue, like they said. We move it from here to Santa Fe.');
        if (J.data.ambush) {
          await T.say('Distributor', '…Actually. My friends think the whole truck is a better deal.');
          J.go('fight');
          return;
        }
        await T.say('Gustavo', 'Every Tuesday. Never the same car twice. If anyone is ever arrested, they have never heard of me.');
        await T.say('Distributor', 'Never heard of who?');
        finish(J, 'route', 'The new route is running');
      } })),
  },

  // ---------------------------------------------------------------- invest in the lab
  {
    id: 'tLab', title: 'Lab Equipment', blurb: 'Collect three crates of glassware and bring them to the warehouse.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      collect: {
        text: (J) => `Collect the glassware crates (${(J.data.got || []).length}/3) — they were left where no one asks questions`,
        target: (J) => LAB_CRATES.find((c) => !(J.data.got || []).includes(c.id)),
        enter(J) {
          J.data.got ||= [];
          for (const c of LAB_CRATES) if (!J.data.got.includes(c.id)) J.pickup({ id: c.id, x: c.x, z: c.z, model: 'box', label: `Take the crate (${c.where})`,
            onTake() { J.data.got.push(c.id); J.G.ui.toast(`Glassware ${J.data.got.length}/3`, 'Lab Equipment'); if (J.data.got.length >= 3) J.go('deliver'); else J.refresh(); } });
        },
      },
      deliver: { text: 'Bring the crates down to the lab under the Madrigal warehouse', target: { x: -58, z: -12.6 } },
    },
    uses: [{ x: -58, z: -12.6, r: 2.2, label: 'Hand the equipment to the cook', when: (S, J) => at(J, 'deliver'),
      async fn(T, G, S, J) {
        if (S.flag('crew:gale')) await T.say('Gale Boetticher', 'A rotary evaporator! And a proper fume hood. Mr. Fring, this is — this is wonderful. Ninety-six becomes ninety-eight.');
        else await T.say('Cook', 'Good glass. The last batch came out cloudy because of the old flasks.');
        finish(J, 'lab', 'Purer product');
      } }],
  },

  // ---------------------------------------------------------------- pay off officials
  {
    id: 'tPayoff', title: 'The Envelope', blurb: 'Pay a city official — then make sure nobody followed you.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      meet: { text: 'Meet the councilman’s aide in the lot by The Crossroads', target: { x: 48, z: 5.6 } },
      tail: { text: 'A DEA car pulled out behind you — lose the tail: west, down Central, past the Route 66 sign', retry: 'tailAgain',
        enter(J) {
          J.run({ label: 'Lose the tail', time: 38, points: [[30, 3], [-10, 3], [-50, -3], [-86, 2]],
            onWin: () => finish(J, 'payoff', 'Nobody saw a thing (−heat)'),
            onLose: (why) => { if (why === 'time') { J.G.ui.toast('They stayed on you. Try again.', 'The Envelope', true); J.go('tailAgain'); } } });
        } },
      tailAgain: { text: 'Shake the DEA tail — go back to the lot by The Crossroads and try again', target: { x: 48, z: 5.6 } },
    },
    triggers: [{ id: 'tailRetry', event: 'jx:tailRetry', minX: 44, maxX: 52, minZ: 1, maxZ: 9, when: (S, J) => at(J, 'tailAgain') }],
    onEvent(e, J) { if (e === 'jx:tailRetry' && J.step === 'tailAgain') J.go('tail'); },
    npcs: [
      { id: 'aide', name: 'Councilman’s Aide', look: 'clerk', x: 48, z: 6.2, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'meet'),
        async talk(T, G, S, J) {
          await T.say('Councilman’s Aide', 'The councilman wants you to know he is a great believer in small business.');
          await T.say('', '*The envelope goes into his newspaper. He does not count it. He has done this before.*');
          await T.say('Gustavo', '(A grey sedan has been parked across the street the whole time. Engine running.)');
          J.go('tail');
        } },
    ],
  },

  // ---------------------------------------------------------------- send a message
  {
    id: 'tMessage', title: 'A Message', blurb: 'A rival crew is selling on your corner. Make them stop.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      go: { text: 'A rival crew is selling on your corner at the east end — send a message', retry: 'go', target: { x: 84, z: 3 },
        enter(J) {
          J.fight({ id: 'jxMessage', name: 'The corner', at: [84, 3], size: 7, speaker: 'Rival dealer',
            thugs: [{ look: 'dealer', dx: -2, dz: -1 }, { look: 'thug', dx: 2, dz: 0 }, { look: 'thug2', dx: 0, dz: 2, weapon: 'knife' }],
            barks: ['This corner is ours, abuelo.', 'Go sell your chicken.'], loseMsg: 'The corner kept its new owners. For now.' });
        },
        on(e, J) {
          if (e === 'won:jxMessage') finish(J, 'message', 'Word gets around');
          if (e === 'escaped:jxMessage') J.go('back');
        } },
      back: { text: 'Go back to the corner and finish it', target: { x: 84, z: 3 } },
    },
    triggers: [{ id: 'cornerBack', event: 'jx:corner', minX: 78, maxX: 90, minZ: -3, maxZ: 9, when: (S, J) => at(J, 'back') }],
    onEvent(e, J) { if (e === 'jx:corner' && J.step === 'back') J.go('go'); },
  },

  // ---------------------------------------------------------------- the DEA fun-run
  {
    id: 'tCharity', title: 'The DEA Fun-Run', blurb: 'Los Pollos sponsors the DEA charity 5K. Show your face. Run.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      meet: { text: 'The DEA charity run starts outside UNM — find Agent Schrader', target: { x: -14, z: -8.4 } },
      run: { text: 'Run the 5K along Central — keep up with Hank (hold Shift)', retry: 'meet',
        enter(J) {
          J.run({ label: 'DEA Fun-Run', time: 75, noRivalLose: true, rival: { look: 'dea', name: 'Hank', time: 60 },
            points: [[-30, -3.5], [-80, -3.5], [-84, 4], [40, 4], [84, -2], [-6, -3.5]],
            onWin: (r) => {
              if (r.beatRival) { J.G.ui.toast('You beat a DEA agent in a footrace. He laughs about it for years.', 'Fun-Run'); J.G.empire.add('rep', 4, 'Beat Hank Schrader'); }
              finish(J, 'charity', 'Gustavo Fring, friend of law enforcement');
            },
            onLose: () => { J.G.ui.toast('Too slow. Talk to Hank to run it again.', 'Fun-Run', true); J.go('meet'); } });
        } },
    },
    npcs: [
      { id: 'hank', name: 'Hank Schrader', look: 'dea', x: -14, z: -8.4, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'meet'),
        async talk(T, G, S, J) {
          await T.say('Hank Schrader', 'Hey! The chicken guy! Gus, right? Your company’s check bought every one of these t-shirts.');
          await T.say('Hank Schrader', 'You running, or just writing checks? Come on — I’ll even give you a head start.');
          const c = await T.choice(['"I will run."', '"Give me a minute."'], 'Hank Schrader');
          if (c === 0) J.go('run');
        } },
    ],
  },

  // ---------------------------------------------------------------- Mike: clean house
  {
    id: 'tClean', title: 'Clean House', blurb: 'Mike says one of the street crew is talking to the DEA.', loc: 'abq', avail: () => false, giver: NOBODY,
    steps: {
      meet: { text: 'Meet Mike behind the Madrigal warehouse', target: { x: -50, z: -8.4 } },
      chase: { text: 'Catch the informant before he reaches the motel', retry: 'meet',
        enter(J) {
          J.chase({ look: 'dealer', name: 'the informant', from: [-44, -4], speed: 5.4, path: [[-20, -4], [0, -3], [14, -6], [22, -9]],
            onCatch: () => finish(J, 'clean', 'He will not talk again'),
            onEscape: () => { J.G.ui.toast('He got away. Mike will find him again.', 'Clean House', true); J.go('meet'); } });
        } },
    },
    npcs: [
      { id: 'mikeClean', name: 'Mike Ehrmantraut', look: 'mike', x: -50, z: -8.4, yaw: Math.PI, wander: 0, when: (S, J) => at(J, 'meet'),
        async talk(T, G, S, J) {
          await T.say('Mike Ehrmantraut', 'Kid in a red jacket. He’s been meeting a DEA agent at the motel twice a week.');
          await T.say('Mike Ehrmantraut', 'He’s about to walk out that door. You want to talk to him before he gets to the motel, you’d better run.');
          J.go('chase');
        } },
    ],
  },
];
