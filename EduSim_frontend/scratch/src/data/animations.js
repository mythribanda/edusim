import * as objectDataModule from './objectData';

const objectData = objectDataModule.default ?? objectDataModule;

// Detect simple sprite sequences based on numeric suffixes.
// Returns mapping: baseName -> { frames: [...], typeGuess: 'walk' }
export function detectAnimations() {
  const sequences = {};
  Object.keys(objectData).forEach((key) => {
    const m = key.match(/(.+?)[-_](\d+)$/);
    if (m) {
      const base = m[1];
      sequences[base] = sequences[base] || { frames: [] };
      sequences[base].frames.push(key);
    }
  });

  // simple heuristics for typeGuess by keywords
  Object.keys(sequences).forEach((base) => {
    const lc = base.toLowerCase();
    if (lc.includes('walk') || lc.includes('run')) sequences[base].typeGuess = 'walk';
    else if (lc.includes('idle')) sequences[base].typeGuess = 'idle';
    else if (lc.includes('attack') || lc.includes('hit')) sequences[base].typeGuess = 'attack';
    else sequences[base].typeGuess = 'unknown';
  });

  return sequences;
}

export default { detectAnimations };
