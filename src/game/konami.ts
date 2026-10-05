/** ↑ ↑ ↓ ↓ ← → ← → B A : renvoie une fonction à appeler à chaque touche, vraie quand la suite est complète. */
const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function konamiDetector() {
  // Fenêtre glissante des dernières touches : tolère les répétitions (↑ ↑ ↑ ↓ …) et les fautes.
  const recent: string[] = [];
  return (key: string) => {
    recent.push(key.length === 1 ? key.toLowerCase() : key);
    if (recent.length > SEQUENCE.length) recent.shift();
    const match = recent.length === SEQUENCE.length && recent.every((k, i) => k === SEQUENCE[i]);
    if (match) recent.length = 0;
    return match;
  };
}
