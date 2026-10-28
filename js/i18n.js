// English subtitles for Spanish dialogue. Each line is run through these
// phrase replacements (longest first); if anything changed, the English
// version is shown under the original in small yellow text.
const PHRASES = [
  ['¡Más rápido, reclutas!', 'Faster, recruits!'],
  ['¡Al blanco, Gonzalez!', 'Take aim, Gonzalez!'],
  ['¿Dónde aprendió a disparar así, recluta?', 'Where did you learn to shoot like that, recruit?'],
  ['¡A correr!', 'Start running!'],
  [' de 8', ' out of 8'],
  ['¡El General no espera a nadie!', 'The General waits for no one!'],
  ['Por su lealtad al General y a la Patria', 'For your loyalty to the General and the Fatherland'],
  ['toque de queda a partir de las veintidós horas', 'curfew begins at ten o’clock tonight'],
  ['¡Bienvenido a Los Pollos Hermanos!', 'Welcome to Los Pollos Hermanos!'],
  ['¡Que Dios lo bendiga!', 'God bless you!'],
  ['¡Buen provecho!', 'Enjoy your meal!'],
  ['¡Sopaipillas calentitas!', 'Warm sopaipillas (fried pumpkin bread)!'],
  ['Empanada de pino', 'Beef empanada'],
  ['Pollo asado', 'Roast chicken'],
  ['pollo asado', 'roast chicken'],
  ['Doña', 'Mrs.'],
  ['¡Por favor, mi teniente!', 'Please, Lieutenant!'],
  ['Él no ha hecho nada', 'He hasn’t done anything'],
  ['¡No he hecho nada!', 'I haven’t done anything!'],
  ['¡Abran la barrera!', 'Raise the barrier!'],
  ['¡Empanadas de pino!', 'Beef empanadas!'],
  ['¡Gracias, mi General!', 'Thank you, General!'],
  ['¡Sí, mi General!', 'Yes, General!'],
  ['¡Mira, un militar!', 'Look — a soldier!'],
  ['¡Oye, amigo!', 'Hey, friend!'],
  ['¡Es el General!', 'It’s the General!'],
  ['¡El Generalísimo!', 'The Generalissimo!'],
  ['¡Así se hace!', 'That’s how it’s done!'],
  ['¡Y va a caer!', 'He’s going to fall!'],
  ['¡Sal de ahí!', 'Come out of there!'],
  ['¡Deténganlo!', 'Stop him!'],
  ['¡Agárrenlo!', 'Grab him!'],
  ['¡Ayúdenme!', 'Help me!'],
  ['¡Asesino!', 'Murderer!'],
  ['¡Mi General!', 'General, sir!'],
  ['¡Pelea!', 'Fight!'],
  ['¡Alto!', 'Halt!'],
  ['¡Oye!', 'Hey!'],
  ['¡poof!', 'poof!'],
  ['¿Cómo?', 'What?'],
  ['¿Pan?', 'Bread?'],
  ['¿Pan,', 'Bread,'],
  ['Llévenselo.', 'Take him away.'],
  ['Buenos días', 'Good morning'],
  ['Sí, mi Coronel', 'Yes, Colonel'],
  ['Sí, mi General', 'Yes, General'],
  ['Sí, Mamá', 'Yes, Mamá'],
  ['Sí, sí', 'Yes, yes'],
  ['mi Coronel', 'Colonel'],
  ['mi General', 'General'],
  ['mi teniente', 'Lieutenant'],
  ['Coronel Gonzalez', 'Colonel Gonzalez'],
  ['Por favor', 'Please'],
  ['Gracias', 'Thank you'],
  ['Generalísimo', 'Generalissimo'],
  ['Sargento', 'Sergeant'],
  ['Mijo', 'Son'],
  ['mijo', 'son'],
  ['hermano', 'brother'],
  ['amigo', 'friend'],
  ['chilenos', 'Chileans'],
  ['señor', 'sir'],
  ['Andén 2', 'Platform 2'],
  ['poblaciones', 'working-class neighborhoods'],
  ['the cerros', 'the hills'],
  ['the cerro', 'the hill'],
  ['the pasaje', 'the lane'],
  ['the Estadio', 'the National Stadium'],
];
const SENORA = [/Señora(?= [A-ZÁÉÍÓÚ])/g, 'Mrs.'];
const SENORA_ALONE = [/Señora/g, 'ma’am'];

export function translate(text) {
  if (!text) return null;
  let out = text;
  for (const [es, en] of PHRASES) if (out.includes(es)) out = out.split(es).join(en);
  out = out.replace(...SENORA).replace(...SENORA_ALONE);
  return out !== text ? out : null;
}

// Place names, signs and HUD text (objective panel, banners, cards, zones).
const PLACES = [
  ['Centro de Investigación Militar', 'Military Research Center'],
  ['Avenida Ricardo Cumming', 'Ricardo Cumming Avenue'],
  ['Callejón de los Perros', 'Dogs’ Alley'],
  ['Callejón del Diablo', 'Devil’s Alley'],
  ['Avenida Altamirano', 'Altamirano Avenue'],
  ['Los Pollos Hermanos', 'Los Pollos Hermanos (The Chicken Brothers)'],
  ['Mercado Agustinas', 'Agustinas Market'],
  ['Pasaje Esperanza', 'Hope Lane'],
  ['Pasaje Lucrecia', 'Lucrecia Lane'],
  ['Regimiento Tacna', 'Tacna Regiment'],
  ['Calle Agustinas', 'Agustinas Street'],
  ['Calle Estación', 'Station Street'],
  ['Estación Barón', 'Barón Station'],
  ['Barrio Yungay', 'Yungay Neighborhood'],
  ['Avenida Matta', 'Matta Avenue'],
  ['Cerro Barón', 'Barón Hill'],
  ['Calle Norte', 'North Street'],
  ['Calle Sur', 'South Street'],
  ['Generalísimo', 'Generalissimo'],
  ['Hacienda', 'Estate'],
];
export function translateHud(text) {
  if (!text) return null;
  let out = text;
  for (const [es, en] of PLACES) if (out.includes(es)) out = out.split(es).join(en);
  out = translate(out) || out;
  return out !== text ? out : null;
}

// Speaker labels.
const NAMES = {
  Sargento: 'Sergeant', Coronel: 'Colonel', Hombre: 'Man', Niño: 'Boy', Lustrabotas: 'Shoeshine boy', Sicario: 'Hitman',
  Carabinero: 'Police officer', 'Teniente Rojas': 'Lieutenant Rojas', 'Teniente Gonzalez': 'Lieutenant Gonzalez', Mamá: 'Mom',
};
export function translateName(name) { return NAMES[name] || null; }
