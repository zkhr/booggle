const TILES = [
  "DEXLIR",
  "TUICOM",
  "OTTAOW",
  "ZNRNLH",
  "POHCAS",
  "LTYRET",
  "RLVEDY",
  "TVRHWE",
  "GEWHNE",
  "JBOAOB",
  "TYTDIS",
  "IENSEU",
  "UMHQIN",
  "NAEAGE",
  "FAKPSF",
  "ESTISO",
];

export function getRandomLetters() {
  const tiles = Array.from(TILES);
  const letters = [];
  while (tiles.length) {
    const index = Math.floor(Math.random() * tiles.length);
    const offset = Math.floor(Math.random() * 6);
    const tile = tiles.splice(index, 1)[0];
    letters.push(tile[offset]);
  }
  return letters;
}
