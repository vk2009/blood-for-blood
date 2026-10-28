// Character looks for every person in Emilio's story, plus random passers-by.

const GUS_SKIN = '#8a5a3c';
const ARMY = '#5d6447';       // Chilean army grey-green
const CARAB = '#3f4d34';      // Carabineros olive

export const LOOKS = {
  emilioKid: { skin: GUS_SKIN, shirt: '#b9a888', pants: '#5a4a3a', shoes: '#4a3526', hairStyle: 'short', hair: '#151515',
    build: 0.82, height: 0.6, sleeves: 'short' },
  emilio: { skin: GUS_SKIN, shirt: '#8f8a7a', pants: '#4a4238', shoes: '#3a2a1c', hairStyle: 'short', hair: '#151515',
    build: 0.95, height: 1.01 },
  general: { skin: GUS_SKIN, shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'officer', hatColor: ARMY, hair: '#151515',
    glasses: true, tie: '#3a3d2c', build: 0.98, height: 1.02 , pockets: true, epaulettes: true },
  recruit: { skin: '#b97f58', shirt: '#6a6f52', pants: ARMY, shoes: '#111111', hairStyle: 'shaved', hair: '#1c1c1c', sleeves: 'short', build: 1.0 , pockets: true },
  bigRecruit: { skin: '#d9a57f', shirt: '#6a6f52', pants: ARMY, shoes: '#111111', hairStyle: 'shaved', hair: '#3a2a1c', sleeves: 'short', build: 1.25, height: 1.04 , pockets: true },
  emilioRecruit: { skin: GUS_SKIN, shirt: '#6a6f52', pants: ARMY, shoes: '#111111', hairStyle: 'shaved', hair: '#151515', sleeves: 'short', build: 0.95, height: 1.01 , pockets: true },
  lieutenant: { skin: GUS_SKIN, shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'officer', hatColor: ARMY, hair: '#151515',
    tie: '#3a3d2c', build: 0.97, height: 1.01 , pockets: true, epaulettes: true },
  sergeant: { skin: '#a8714c', shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'helmet', hatColor: '#4a5038', beard: 'mustache', build: 1.2 , pockets: true },
  shopkeeper: { skin: '#e0b08f', shirt: '#f2efe6', pants: '#3a3a40', shoes: '#2a2a2a', hairStyle: 'bald', hair: '#8a8a8a', beard: 'mustache', beardColor: '#9a9a9a', build: 1.15 },
  pharmacist: { skin: '#d9a57f', shirt: '#e8eef2', pants: '#4a4a52', shoes: '#2a2a2a', hairStyle: 'long', hair: '#3a2414', build: 0.9, height: 0.95 },
  cobbler: { skin: '#c68a62', shirt: '#6a4a2e', pants: '#3a3226', shoes: '#4a3526', hairStyle: 'short', hair: '#5a5a5a', glasses: true, build: 1.0 },
  marketWoman: { skin: '#9a6844', shirt: '#b8452f', pants: '#3a2a2a', shoes: '#2a2a2a', hairStyle: 'long', hair: '#2a2a2a', build: 1.05, height: 0.93 },
  emilioCivil: { skin: GUS_SKIN, shirt: '#f1e7c9', pants: '#2e2e33', shoes: '#1a1a1a', hairStyle: 'short', hair: '#151515',
    glasses: true, tie: '#d4a017', build: 0.98, height: 1.02 , pockets: false },
  mother: { skin: '#9a6844', shirt: '#7a4a5a', pants: '#6a3e4c', shoes: '#3a2a1c', hairStyle: 'long', hair: '#1c1c1c',
    build: 0.9, height: 0.95 },
  mateoRun: { skin: '#e0b08f', shirt: '#7a3a2a', pants: '#3f4a5a', shoes: '#2a221c', hairStyle: 'short', hair: '#3a2414',
    beard: 'mustache', build: 0.92 },
  mateo: { skin: '#e0b08f', shirt: '#eceae2', pants: '#3f4a5a', shoes: '#2a221c', hairStyle: 'short', hair: '#3a2414',
    beard: 'mustache', build: 0.92 },
  max: { skin: '#e0b08f', shirt: '#d9c27a', pants: '#3a3a40', shoes: '#2a221c', hairStyle: 'short', hair: '#3a2414',
    beard: 'mustache', build: 0.92 },
  peter: { skin: '#f0cbb0', shirt: '#2a2f3a', pants: '#2a2f3a', shoes: '#111111', hairStyle: 'bald', hair: '#d0ccc4',
    glasses: true, tie: '#6a1a1a', build: 1.05, height: 1.03 },
  carabinero: { skin: '#c68a62', shirt: CARAB, pants: CARAB, shoes: '#111111', hairStyle: 'officer', hatColor: CARAB, hair: '#1c1c1c',
    build: 1.05 , pockets: true },
  soldier: { skin: '#b97f58', shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'helmet', hatColor: '#4a5038', build: 1.02 , pockets: true },
  aide: { skin: '#d9a57f', shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'short', hair: '#2a1c14', tie: '#3a3d2c', build: 0.95 , pockets: true, epaulettes: true },
  colonel: { skin: '#e0b08f', shirt: ARMY, pants: ARMY, shoes: '#111111', hairStyle: 'officer', hatColor: ARMY, hair: '#8a8a8a',
    beard: 'mustache', beardColor: '#9a9a9a', tie: '#3a3d2c', build: 1.15 , pockets: true, epaulettes: true },
  scientist: { skin: '#f0cbb0', shirt: '#f2f2ee', pants: '#4a4a52', shoes: '#2a2a2a', hairStyle: 'bald', hair: '#7a6a5a', glasses: true, build: 1.0 },
  doctor: { skin: '#e3b594', shirt: '#f4f4f0', pants: '#3a3a44', shoes: '#1a1a1a', hairStyle: 'short', hair: '#5a5a5a',
    glasses: true, tie: '#2a4a7a', build: 1.08 },
  thug: { skin: '#a8714c', shirt: '#2a2a2e', pants: '#3a3226', shoes: '#1a1a1a', hairStyle: 'beanie', hatColor: '#7a1f1f', build: 1.12 },
  thug2: { skin: '#c68a62', shirt: '#5a3a2a', pants: '#2c3e50', shoes: '#1a1a1a', hairStyle: 'short', hair: '#1c1c1c', beard: 'goatee',
    sleeves: 'short', build: 1.18 },
  rioter: { skin: '#b07a52', shirt: '#7a2a24', pants: '#2c3440', shoes: '#1a1a1a', hairStyle: 'beanie', hatColor: '#222', build: 1.08 },
  neighbor: { skin: '#9a6844', shirt: '#4f7f6a', pants: '#3a3a40', shoes: '#2a2a2a', hairStyle: 'long', hair: '#3a2a1c', build: 0.95, height: 0.94 },
  vendor: { skin: '#c68a62', shirt: '#e8e0cf', pants: '#4a3a2a', shoes: '#2a2a2a', hairStyle: 'hat', hatColor: '#e8e0cf', hair: '#2a2a2a',
    beard: 'mustache', build: 1.2 },
  clerk: { skin: '#d9a57f', shirt: '#2b3a55', pants: '#1f2a40', shoes: '#111', hairStyle: 'hat', hatColor: '#1f2a40', hair: '#2a2a2a', build: 1.0 },
  shoeshine: { skin: '#9a6844', shirt: '#c0392b', pants: '#3a3226', shoes: '#2a2a2a', hairStyle: 'short', hair: '#151515', height: 0.7, build: 0.8 },
  eladio: { skin: '#c68a62', shirt: '#f4f0e6', pants: '#e8e0d0', shoes: '#6b4a2b', hairStyle: 'short', hair: '#2a2a2a',
    glasses: true, build: 1.12, sleeves: 'short' },
  hector: { skin: '#b97f58', shirt: '#3a3a3a', pants: '#2a2a2a', shoes: '#111', hairStyle: 'short', hair: '#1c1c1c', beard: 'mustache', build: 1.05 },
  cartel: { skin: '#b07a52', shirt: '#e8e0cf', pants: '#3a3a40', shoes: '#4a3526', hairStyle: 'hat', hatColor: '#c9b48a', hair: '#1c1c1c',
    beard: 'mustache', build: 1.12 },
  waiter: { skin: '#c68a62', shirt: '#f2c230', pants: '#2a2a2e', shoes: '#1a1a1a', hairStyle: 'hat', hatColor: '#b52a1c', hair: '#1c1c1c', sleeves: 'short' },
};

const SKINS = ['#e0ac85', '#c68a62', '#9a6844', '#b07a52', '#d9a57f', '#8a5a3c'];
const SHIRTS = ['#7a3a2a', '#4f6a7f', '#5a6a3a', '#d8d0bc', '#6a4a6a', '#a8743d', '#3a4a5a', '#8a7a5a', '#4a6a5a', '#7f7f7a'];
const PANTS = ['#2c3440', '#3f4a5a', '#4a3a2a', '#5a5248', '#1f1f1f', '#6a5a42'];
const HAIR = ['#151515', '#2a1c14', '#3a2a1c', '#5a4a3a', '#8a8a8a'];
const STYLES = ['short', 'short', 'short', 'long', 'long', 'shaved', 'bald', 'hat', 'beanie'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function randomLook() {
  const style = pick(STYLES);
  return {
    skin: pick(SKINS), shirt: pick(SHIRTS), pants: pick(PANTS), shoes: pick(['#1f1f1f', '#3a2a1c', '#5a3b24']),
    hair: pick(HAIR), hairStyle: style, hatColor: pick(['#2d2d30', '#6b4a2b', '#5a3a2a', '#c9b48a']),
    beard: style !== 'long' && Math.random() < 0.3 ? pick(['goatee', 'mustache']) : null,
    sleeves: Math.random() < 0.5 ? 'short' : 'long',
    build: 0.85 + Math.random() * 0.3, height: 0.92 + Math.random() * 0.1,
  };
}

export const PED_LINES = {
  barrio: [
    'Another day, another empty pot.',
    'Watch yourself near the callejones, hombre.',
    'My son went to Santiago too. Never wrote back.',
    'Bread went up again. Who can afford to eat?',
    'You look like you are going somewhere.',
    "Don't stare at the Callejón boys. That's how it starts.",
  ],
  santiago: [
    'Buenos días, mi General.',
    'Curfew is at ten. Don’t forget.',
    "I didn't see anything. I never see anything.",
    'Prices, prices… everything is prices.',
    'The radio says the economy is a miracle. My wallet disagrees.',
    '*nods nervously at the uniform*',
  ],
  riot: [
    '¡Y va a caer! ¡Y va a caer!',
    'They took my brother in ’73. Never came back.',
    'Get off the street, the soldiers are coming!',
  ],
  mexico: [
    'Don Eladio does not like to wait.',
    'Nice suit. Shame if it got wet.',
  ],
};
