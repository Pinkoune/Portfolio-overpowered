/** Miroir des tokens de couleur pour la 3D et les canvas (même source : DA, section 02 Palette). */
export const colors = {
  void: '#07060D',
  hull900: '#0D0C17',
  hull800: '#151426',
  hull700: '#201F36',
  hull600: '#2E2C4A',
  line: '#3B3960',
  lineSoft: '#22213A',
  text: '#EEECF5',
  textDim: '#A29FBD',
  pink: '#FF5FA2',
  pinkSoft: '#FFB8D5',
  pinkDeep: '#B8286A',
  amber: '#FFB547',
  core: '#FFF2DC',
  holo: '#5CE1E6',
} as const;

/** Rampe du disque d'accrétion, intérieur → extérieur. */
export const accretionRamp = ['#FFF2DC', '#FFD08A', '#FFB547', '#FF8A78', '#FF5FA2', '#B8286A', '#4D1043'];

/** Couleurs du pingouin, d'après l'avatar. */
export const penguinColors = {
  body: '#FF9CCB',
  flippers: '#F0679F',
  belly: '#FFF4F8',
  beak: '#FFB547',
  cheeks: '#FF7FB6',
} as const;
