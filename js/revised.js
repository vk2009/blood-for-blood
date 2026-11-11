// REVISED STRUCTURE — the story is told around Gus's revenge.
// The game opens on the pool in Mexico (Max's death). Everything after that
// is the hunt for the men who were there, and Emilio's past in Chile comes
// back as playable memories between the present-day chapters.
//
// The scenes and missions themselves are unchanged; this file only decides
// the order, labels each beat as 'present' or 'past' (a memory), and adds
// the short bridges that cut into and out of each memory.
import { sfx } from './sfx.js';

const sleep = (d, s) => d.wait(s);

// ---------------------------------------------------------------- chapter labels
const P0 = 'Prologue · The Pool — Mexico, 1986';
const P1 = 'Chapter I · Empire';
const P2 = 'Chapter II · Catalyst';
const P3 = 'Chapter III · Blood for Blood';
const M1 = 'Memory · Valparaíso, 1964–1976';
const M2 = 'Memory · Regimiento Tacna, 1976–1980';
const M3 = 'Memory · The General, 1981';
const M4 = 'Memory · Los Pollos Hermanos, 1982–1985';
const M5 = 'Memory · Blood in the Streets, 1986';

// ---------------------------------------------------------------- bridges
// Gus alone in a present-day place, thinking — then the memory takes over.
async function presentShot(d, G, locId, spawnKey, lines) {
  d.set(locId);
  const sp = G.loc.spawns[spawnKey] || G.loc.spawns.default;
  const yaw = sp.yaw ?? 0;
  const g = d.actor('gus', 'emilioCivil', sp.x, sp.z, yaw);
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  d.cam([sp.x + fx * 2.6 + fz * 0.7, 1.65, sp.z + fz * 2.6 - fx * 0.7], [sp.x, 1.55, sp.z],
    { to: [sp.x + fx * 1.9 + fz * 0.5, 1.62, sp.z + fz * 1.9 - fx * 0.5], dur: 9 });
  await d.fadeIn(0.6);
  for (const [who, text] of lines) await d.say(who, text);
  return g;
}
// The cut into a memory: a white flash, a bell, then the place and year.
async function intoMemory(d, G, title, sub) {
  G.flash();
  sfx.bell?.();
  await d.fadeOut(0.5);
  await d.card(title, sub, 3.6);
}

export const BRIDGES = {
  async coldOpen(d, G) {
    // Gus carries the last things he owns from Chile; the memories explain them.
    for (const id of ['savings', 'photo', 'passportG', 'madrigal']) G.give(id, false);
    await d.card('BLOOD FOR BLOOD', 'Mexico — 1986.', 3.5);
    await d.card('', 'Two Chilean businessmen. A small chain of chicken restaurants —\nand something else, sold out of the back door.\n\nThey have come to ask the most powerful man in Mexico for permission.', 6);
  },







  async mem4In(d, G) {
    await d.card('', 'Juan Bolsa stood at the edge of the pool that day.\nOne more name crossed out of the ledger.', 4.5);
    await d.card('', 'Gus remembers who else was there —\nand the one who was never supposed to die.', 4.5);
    await intoMemory(d, G, 'Memory', 'Santiago — 1982.\nTwo brothers, and a recipe.');
  },

  async mem4Out(d, G) {
    await d.card('Albuquerque — 2009', 'He had built something with a friend once.\nThis time, the people around him are only employees. He tells himself that.', 5.5);
  },

  async mem5In(d, G) {
    await presentShot(d, G, 'pollosABQ', 'office', [
      ['Gustavo', '(Don Eladio has invited me to Mexico. To celebrate our partnership.)'],
      ['Gustavo', '(The last time I left a country in a hurry, I had to become someone else to do it.)'],
    ]);
    await intoMemory(d, G, 'Memory', 'Santiago — 1986.\nThe night Emilio Gonzalez died.');
  },

  async mem5Out(d, G) {
    await d.card('', 'Twenty-three years later, Gustavo Fring goes back to Mexico.\n\nThis time, he is the one bringing the gift.', 5.5);
  },
};

// ---------------------------------------------------------------- the hunt (Chapter I)
// The empire chapter is split into stages. Each strike on the Salamancas is a
// turning point, and right there — ledger in hand, money in the trunk, a man
// on his knees — a memory takes over. When it ends, you are back where you
// stood, mid-hunt.
const rev = (S) => S.empire?.()?.revenge ?? 0;
const fear = (S) => S.empire?.()?.fear ?? 0;
const jobDone = (S, id) => S.flag('job:' + id);
function huntStep(S) {
  if (!jobDone(S, 'revTires')) return S.flag('crew:tyrus') || fear(S) >= 45
    ? { t: 'Tyrus is waiting outside Los Pollos — raid Llantera El Tío, the Salamancas’ tire shop', x: -20, z: 7.4 }
    : { t: 'Win over Tyrus, the doorman at The Crossroads — he knows the Salamancas’ tire shop', x: 65, z: 9.6 };
  if (!jobDone(S, 'revHighway')) return S.flag('crew:mike')
    ? { t: 'Mike is at the Madrigal warehouse — take the Salamancas’ Thursday shipment', x: -46, z: -8.8 }
    : { t: 'Recruit Mike Ehrmantraut at the Desert Sands Motel — he knows the courier’s route', x: 22, z: -9.5 };
  if (!jobDone(S, 'revRogelio')) return S.flag('crew:victor')
    ? { t: 'Victor found one of the men from the pool — talk to him outside Los Pollos', x: -24, z: 7.6 }
    : { t: 'Recruit Victor in the Los Pollos parking lot — he can find the men from the pool', x: -36, z: 7.6 };
  return null;
}
const hunt = (id, n, extra = {}) => ({
  id, type: 'goal', look: 'emilioCivil', loc: 'abq', spawn: 'resume', empireOpen: true,
  text: (S) => { const h = huntStep(S); return `Hunt the men from the pool — strike ${rev(S)}/3. ${h ? h.t : ''}`; },
  target: (S) => { const h = huntStep(S); return h ? { loc: 'abq', x: h.x, z: h.z } : null; },
  done: (e, S) => rev(S) >= n,
  ...extra,
});
const STAGES = {
  hunt1: hunt('hunt1', 1, { loc: 'pollosABQ', spawn: 'office', banner: true }),
  hunt2: hunt('hunt2', 2),
  hunt3: hunt('hunt3', 3),
};

// A memory that cuts in right where Gus stands.
async function memoryCut(d, G, lines, title, sub) {
  G.hideHero(true);
  const P = G.player.pos, yaw = G.player.modelYaw;
  d.actor('gus', 'emilioCivil', P.x, P.z, yaw);
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  d.cam([P.x + fx * 2.3 + fz * 0.6, 1.66, P.z + fz * 2.3 - fx * 0.6], [P.x, 1.56, P.z],
    { to: [P.x + fx * 1.6 + fz * 0.4, 1.63, P.z + fz * 1.6 - fx * 0.4], dur: 8 });
  for (const [who, text] of lines) await d.say(who, text);
  await intoMemory(d, G, title, sub);
}
Object.assign(BRIDGES, {
  async huntIn1(d, G) {
    await memoryCut(d, G, [
      ['', '*The Salamanca ledger. Names, dates, payments, in a careful hand.*'],
      ['Gustavo', '(Every name in this book owes a debt.)'],
      ['Gustavo', '(Mamá kept a book like this once. Rent. Bread. Nothing.)'],
    ], 'Memory', 'Valparaíso, Chile.\nBefore there was a Gustavo Fring.');
  },
  async huntOut1(d, G) {
    G.flash();
    await d.card('', 'Albuquerque. The ledger is still open in his hands.\nOne strike. Two to go.', 4);
  },
  async huntIn2(d, G) {
    await memoryCut(d, G, [
      ['', '*The courier’s case is full of cartel money. Hector’s money.*'],
      ['Gustavo', '(They will want it back. Let them come. Anger loses wars. Discipline wins them.)'],
      ['Gustavo', '(The army taught me that — the hard way.)'],
    ], 'Memory', 'Regimiento Tacna, Santiago — 1976.');
  },
  async huntOut2(d, G) {
    G.flash();
    await d.card('', 'Albuquerque. Sirens somewhere far off on Central.\nTwo strikes. One man from the pool is close.', 4);
  },
  async huntIn3(d, G) {
    await memoryCut(d, G, [
      ['Gustavo', '(He called Max "your friend". As if Max were someone I happened to stand beside.)'],
      ['Gustavo', '(I remember the morning I met him. He ran straight into me, with the Carabineros behind him.)'],
    ], 'Memory', 'Santiago — 1981.\nThe morning he met Mateo Zagal.');
  },
  async huntOut3(d, G) {
    G.flash();
    await d.card('', 'Albuquerque.\nThree men from the pool are paid for. The rest will take an empire.', 4.5);
  },
});

// ---------------------------------------------------------------- order
// Each segment: [era, chapter label, [beat ids or bridge ids]].
const ORDER = [
  ['present', P0, ['coldOpen', 'mexico', 'meetEladio', 'finale', 'aftermath', 'leaveHacienda', 'burial']],
  ['present', P1, ['abqArrive', 'ledgerIntro', 'hunt1', 'huntIn1']],
  ['past', M1, ['prologue', 'wake', 'savings', 'toStation', 'board', 'train']],
  ['present', P1, ['huntOut1', 'hunt2', 'huntIn2']],
  ['past', M2, ['enlist', 'bcReport', 'bcCourse', 'bcRations', 'bcVictor', 'victorTalk', 'bcFight', 'rise']],
  ['present', P1, ['huntOut2', 'hunt3', 'huntIn3']],
  ['past', M3, ['wake2', 'getId', 'collect', 'crime', 'arrest', 'walkFacility', 'chase', 'gate', 'gateScene', 'office',
    'deskScene', 'findMateo', 'mateoScene', 'montage', 'bribe', 'resign']],
  ['present', P1, ['huntOut3', 'empire', 'hectorLooks']],
  ['present', P2, ['catalyst', 'cousinsClues', 'cousinsPlan', 'cousinsFight', 'bolsaIntel', 'bolsaHit', 'bolsaEnd', 'mem4In']],
  ['past', M4, ['plan', 'launder', 'opening', 'pShift', 'pSupply', 'pAmbush', 'pDinner', 'meetPeter', 'peterScene']],
  ['present', P2, ['mem4Out', 'galeDies', 'ambushVictor', 'victorDies', 'fireWalter', 'mem5In']],
  ['past', M5, ['revolt', 'escape', 'newNames']],
  ['present', P3, ['mem5Out', 'mexico2', 'party', 'eladioDrive', 'eladioBoss', 'eladioEnd', 'reunion',
    'final1', 'finalBell', 'final2', 'finalHector', 'final3', 'finalEnd']],
];
// Per-beat adjustments for the new order.
const OVERRIDES = {
  empire: { spawn: 'resume', loc: 'abq', empireOpen: true },
};

// Build the revised beat list from the chronological one.
export function reorder(chrono) {
  const byId = Object.fromEntries(chrono.map((b) => [b.id, b]));
  const out = [];
  for (const [era, chapter, ids] of ORDER) {
    for (const id of ids) {
      const base = byId[id] || STAGES[id] || (BRIDGES[id] && { id, type: 'scene', play: BRIDGES[id] });
      if (!base) throw new Error(`revised order: unknown beat "${id}"`);
      out.push({ ...base, ...OVERRIDES[id], era, chapter });
    }
  }
  const missing = chrono.filter((b) => !out.some((o) => o.id === b.id)).map((b) => b.id);
  if (missing.length) console.warn('revised order: beats left out', missing);
  return out;
}
