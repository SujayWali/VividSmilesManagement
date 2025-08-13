// Tooth numbering helpers for Universal, FDI, Palmer systems
// and surface labels for dental charting

export type NumberingSystem = 'universal' | 'fdi' | 'palmer';
export type Dentition = 'adult' | 'primary' | 'mixed';
export type ToothSurface = 'O' | 'M' | 'D' | 'B' | 'F' | 'L' | 'P' | 'I' | 'C';

// Universal: 1-32 (adult), A-T (primary)
// FDI: 11-48 (adult), 51-85 (primary)
// Palmer: quadrant + 1-8 (adult), quadrant + A-E (primary)

export function getToothLabel(
  toothNumber: number,
  numberingSystem: NumberingSystem,
  dentition: Dentition
): string {
  if (numberingSystem === 'universal') {
    if (dentition === 'primary') {
      // A-T
      const letters = 'ABCDEFGHIJKLMNOPQRST';
      return letters[toothNumber - 1] || String(toothNumber);
    }
    return String(toothNumber);
  }
  if (numberingSystem === 'fdi') {
    // FDI: 11-48 (adult), 51-85 (primary)
    if (dentition === 'primary') {
      // Map 1-20 to 51-85
      return String(50 + toothNumber);
    }
    // Map 1-32 to FDI
    const fdiMap = [11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28,31,32,33,34,35,36,37,38,41,42,43,44,45,46,47,48];
    return String(fdiMap[toothNumber - 1] || toothNumber);
  }
  if (numberingSystem === 'palmer') {
    // Palmer: quadrant + 1-8
    const quadrant =
      toothNumber <= 8 ? 'UR' :
      toothNumber <= 16 ? 'UL' :
      toothNumber <= 24 ? 'LL' :
      'LR';
    const num = ((toothNumber - 1) % 8) + 1;
    return `${quadrant} ${num}`;
  }
  return String(toothNumber);
}

export function getSurfaceLabel(surface: ToothSurface): string {
  switch (surface) {
    case 'O': return 'Occlusal';
    case 'M': return 'Mesial';
    case 'D': return 'Distal';
    case 'B': return 'Buccal';
    case 'F': return 'Facial';
    case 'L': return 'Lingual';
    case 'P': return 'Palatal';
    case 'I': return 'Incisal';
    case 'C': return 'Cervical';
    default: return surface;
  }
}
