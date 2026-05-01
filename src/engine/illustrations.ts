// Illustration mapping: paragraph range → illustration
// Each illustration covers a set of paragraphs where the scene is relevant

export const ILLUSTRATION_MAP: Record<string, string[]> = {
  'station-exterior': [
    // Prologue & early game - arriving at station, outside views
    '1', '3', '4', '5', '56', '57', '58', '59', '60',
  ],
  'phoenixoid': [
    // Phoenixoid encounters
    '6', '7', '8', '9', '76', '77', '84', '162',
  ],
  'spaceport': [
    // Spaceport scenes
    '104', '136', '145', '150', '193', '198',
  ],
  'mine-tunnel': [
    // Mine/cave scenes
    '93', '95', '133', '167', '176',
  ],
  'station-interior': [
    // Station interior: medbay, corridors, command
    '7', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '52', '65',
  ],
  'blizzard-surface': [
    // Outside in blizzard
    '56', '140', '141', '142', '143', '149', '150', '151',
  ],
};

// Reverse mapping: paragraph id → illustration name
export const PARAGRAPH_ILLUSTRATION: Record<number, string> = {};

for (const [illustration, paragraphs] of Object.entries(ILLUSTRATION_MAP)) {
  for (const p of paragraphs) {
    PARAGRAPH_ILLUSTRATION[parseInt(p)] = illustration;
  }
}

// Get illustration path for a paragraph
export function getIllustrationPath(paragraphId: number): string | null {
  const name = PARAGRAPH_ILLUSTRATION[paragraphId];
  if (!name) return null;
  return `/game-genesis/illustrations/${name}.jpg`;
}

// Get illustration name for a paragraph
export function getIllustrationName(paragraphId: number): string | null {
  return PARAGRAPH_ILLUSTRATION[paragraphId] || null;
}