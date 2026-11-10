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

  async mem1In(d, G) {
    d.set('desert');
    G.setMood('dusk');
    const g = d.actor('gus', 'emilioCivil', 1.3, 1.4, -2.4);
    d.cam([2.6, 1.5, 3.4], [1.0, 1.4, 0.6], { to: [2.2, 1.45, 2.8], dur: 9 });
    await d.fadeIn(0.8);
    await d.say('Gustavo', '(Max asked me once why I count every peso twice. I never told him.)');
    await d.say('Gustavo', '(I should have told him. He would have laughed — and then he would have understood.)');
    d.drop('gus');
    G.setMood(null);
    await intoMemory(d, G, 'Memory', 'Valparaíso, Chile.\nBefore there was a Gustavo Fring.');
  },

  async mem1Out(d, G) {
    await d.card('', 'The train carried Emilio Gonzalez away from the sea.\n\nFourteen years later, Gustavo Fring stepped off a plane into the desert,\nwith a dead man’s name to avenge.', 6);
  },

  async mem2In(d, G) {
    await presentShot(d, G, 'pollosABQ', 'office', [
      ['Gustavo', '(Eladio takes twenty percent, and I smile when I pay it.)'],
      ['Gustavo', '(Discipline. Patience. Obedience — until the day it is no longer necessary.)'],
      ['Gustavo', '(The army taught me that. Before it taught me anything else.)'],
    ]);
    await intoMemory(d, G, 'Memory', 'Regimiento Tacna, Santiago — 1976.');
  },

  async mem2Out(d, G) {
    await d.card('Albuquerque', 'The present.\nThe general is gone. The patience stayed.', 4.5);
  },

  async mem3In(d, G) {
    await d.card('', 'Hector Salamanca stood in his restaurant and smiled,\nand Gustavo Fring said nothing at all.\n\nThe last time a man had looked at him like that, he was wearing a uniform.', 6);
    await intoMemory(d, G, 'Memory', 'Santiago — 1981.\nThe morning he met Mateo Zagal.');
  },

  async mem3Out(d, G) {
    await d.card('', 'Mateo Zagal had a few good years left.\nGustavo Fring would spend twenty-two of his own making sure they were not forgotten.', 5.5);
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

// ---------------------------------------------------------------- order
// Each segment: [era, chapter label, [beat ids or bridge ids]].
// Beats keep their own chapter label unless the segment gives one.
const ORDER = [
  ['present', P0, ['coldOpen', 'mexico', 'meetEladio', 'finale', 'aftermath', 'leaveHacienda', 'burial']],
  ['present', P0, ['mem1In']],
  ['past', M1, ['prologue', 'wake', 'savings', 'toStation', 'board', 'train']],
  ['present', P1, ['mem1Out', 'abqArrive', 'ledgerIntro', 'mem2In']],
  ['past', M2, ['enlist', 'bcReport', 'bcCourse', 'bcRations', 'bcVictor', 'victorTalk', 'bcFight', 'rise']],
  ['present', P1, ['mem2Out', 'empire', 'hectorLooks', 'mem3In']],
  ['past', M3, ['wake2', 'getId', 'collect', 'crime', 'arrest', 'walkFacility', 'chase', 'gate', 'gateScene', 'office',
    'deskScene', 'findMateo', 'mateoScene', 'montage', 'bribe', 'resign']],
  ['present', P2, ['mem3Out', 'catalyst', 'cousinsClues', 'cousinsPlan', 'cousinsFight', 'bolsaIntel', 'bolsaHit', 'bolsaEnd', 'mem4In']],
  ['past', M4, ['plan', 'launder', 'opening', 'pShift', 'pSupply', 'pAmbush', 'pDinner', 'meetPeter', 'peterScene']],
  ['present', P2, ['mem4Out', 'galeDies', 'ambushVictor', 'victorDies', 'fireWalter', 'mem5In']],
  ['past', M5, ['revolt', 'escape', 'newNames']],
  ['present', P3, ['mem5Out', 'mexico2', 'party', 'eladioDrive', 'eladioBoss', 'eladioEnd', 'reunion',
    'final1', 'finalBell', 'final2', 'finalHector', 'final3', 'finalEnd']],
];

// Build the revised beat list from the chronological one.
export function reorder(chrono) {
  const byId = Object.fromEntries(chrono.map((b) => [b.id, b]));
  const out = [];
  for (const [era, chapter, ids] of ORDER) {
    for (const id of ids) {
      const base = byId[id] || (BRIDGES[id] && { id, type: 'scene', play: BRIDGES[id] });
      if (!base) throw new Error(`revised order: unknown beat "${id}"`);
      out.push({ ...base, era, chapter });
    }
  }
  const missing = chrono.filter((b) => !out.some((o) => o.id === b.id)).map((b) => b.id);
  if (missing.length) console.warn('revised order: beats left out', missing);
  return out;
}
