import { Question } from '@eduforge/shared';

const KNOWN_CHAPTER_CODES: Record<string, string> = {
  // Physics
  'units and measurements': 'UNI',
  'units & measurements': 'UNI',
  'motion in a straight line': 'MSL',
  'motion in a plane': 'MIP',
  'laws of motion': 'LOM',
  'work, energy and power': 'WEP',
  'work, energy & power': 'WEP',
  'system of particles and rotational motion': 'ROT',
  'rotational motion': 'ROT',
  'gravitation': 'GRA',
  'mechanical properties of solids': 'MPS',
  'mechanical properties of fluids': 'MPF',
  'thermal properties of matter': 'TPM',
  'thermodynamics': 'THE',
  'kinetic theory': 'KTG',
  'oscillations': 'OSC',
  'waves': 'WAV',
  'electric charges and fields': 'ECF',
  'electric charges & fields': 'ECF',
  'electrostatic potential and capacitance': 'EPC',
  'current electricity': 'CUR',
  'moving charges and magnetism': 'MCM',
  'moving charges & magnetism': 'MCM',
  'magnetism and matter': 'MAG',
  'magnetism & matter': 'MAG',
  'electromagnetic induction': 'EMI',
  'alternating current': 'AC',
  'electromagnetic waves': 'EMW',
  'ray optics and optical instruments': 'RAY',
  'ray optics': 'RAY',
  'wave optics': 'WVO',
  'dual nature of radiation and matter': 'DNR',
  'atoms': 'ATM',
  'nuclei': 'NUC',
  'semiconductor electronics': 'SEM',
  'semiconductors': 'SEM',

  // Chemistry
  'some basic concepts of chemistry': 'BAS',
  'basic concepts of chemistry': 'BAS',
  'structure of atom': 'ATO',
  'atomic structure': 'ATO',
  'classification of elements and periodicity in properties': 'PER',
  'periodic classification': 'PER',
  'chemical bonding and molecular structure': 'BND',
  'chemical bonding': 'BND',
  'equilibrium': 'EQU',
  'redox reactions': 'RED',
  'organic chemistry: some basic principles and techniques': 'GOC',
  'general organic chemistry': 'GOC',
  'hydrocarbons': 'HYD',
  'solutions': 'SOL',
  'electrochemistry': 'ECH',
  'chemical kinetics': 'KIN',
  'the d- and f-block elements': 'DFB',
  'd and f block elements': 'DFB',
  'coordination compounds': 'CRD',
  'haloalkanes and haloarenes': 'HAL',
  'alcohols, phenols and ethers': 'ALC',
  'aldehydes, ketones and carboxylic acids': 'AKC',
  'amines': 'AMN',

  // Biology
  'the living world': 'LIV',
  'living world': 'LIV',
  'biological classification': 'BCL',
  'plant kingdom': 'PLK',
  'animal kingdom': 'ANI',
  'morphology of flowering plants': 'MFP',
  'anatomy of flowering plants': 'AFP',
  'structural organisation in animals': 'SOA',
  'structural organization in animals': 'SOA',
  'cell: the unit of life': 'CEL',
  'cell - the unit of life': 'CEL',
  'cell structure and function': 'CEL',
  'biomolecules': 'BIO',
  'cell cycle and cell division': 'CCD',
  'photosynthesis in higher plants': 'PHO',
  'photosynthesis': 'PHO',
  'respiration in plants': 'RES',
  'plant growth and development': 'PGD',
  'breathing and exchange of gases': 'BEG',
  'body fluids and circulation': 'BFC',
  'excretory products and their elimination': 'EPE',
  'locomotion and movement': 'LOC',
  'neural control and coordination': 'NCC',
  'chemical coordination and integration': 'CCI',
  'sexual reproduction in flowering plants': 'SRF',
  'human reproduction': 'REP',
  'reproductive health': 'RPH',
  'principles of inheritance and variation': 'PIV',
  'genetics': 'GEN',
  'molecular basis of inheritance': 'MBI',
  'evolution': 'EVO',
  'human health and disease': 'HHD',
  'microbes in human welfare': 'MHW',
  'biotechnology: principles and processes': 'BTP',
  'biotechnology and its applications': 'BTA',
  'organisms and populations': 'ONP',
  'ecosystem': 'ECO',
  'biodiversity and conservation': 'BDC',

  // Mathematics
  'sets, relations and functions': 'SET',
  'sets and functions': 'SET',
  'complex numbers and quadratic equations': 'CMP',
  'complex numbers': 'CMP',
  'matrices and determinants': 'MAT',
  'matrices': 'MAT',
  'determinants': 'DET',
  'permutations and combinations': 'PNC',
  'mathematical induction & binomial theorem': 'BIN',
  'binomial theorem': 'BIN',
  'sequences and series': 'SEQ',
  'limits, continuity and differentiability': 'LCD',
  'limits and continuity': 'LCD',
  'integral calculus': 'INT',
  'integrals': 'INT',
  'differential equations': 'DIF',
  'coordinate geometry & straight lines': 'LIN',
  'straight lines': 'LIN',
  'conic sections & circles': 'CON',
  'three dimensional geometry': '3DG',
  'vector algebra': 'VEC',
  'vectors': 'VEC',
  'statistics and probability': 'PRB',
  'probability': 'PRB',
  'trigonometry': 'TRG'
};

const DEFAULT_CHAPTER_BY_SUB: Record<string, string> = {
  PHY: 'Units and Measurements',
  CHE: 'Some Basic Concepts of Chemistry',
  BIO: 'The Living World',
  MAT: 'Sets, Relations and Functions',
  GEN: 'General Unit'
};

/**
 * Format dynamic question code based strictly on subject and chosen chapter
 * Example: BIO-ANI-0071, PHY-UNI-0042, CHE-BAS-0045, MAT-SET-8812
 */
export const formatQuestionCode = (q?: Partial<Question> | any | null): string => {
  const sub = (q?.subject || 'Physics').trim();
  const subLower = sub.toLowerCase();

  let subCode = 'PHY';
  if (subLower.includes('phys')) subCode = 'PHY';
  else if (subLower.includes('chem')) subCode = 'CHE';
  else if (subLower.includes('bio')) subCode = 'BIO';
  else if (subLower.includes('math')) subCode = 'MAT';
  else subCode = sub.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';

  const defaultChapter = DEFAULT_CHAPTER_BY_SUB[subCode] || 'General Unit';
  const chap = (q?.chapter && String(q.chapter).trim().length > 0 ? String(q.chapter) : defaultChapter).trim();
  const chapLower = chap.toLowerCase();

  let chapCode = 'GEN';
  if (KNOWN_CHAPTER_CODES[chapLower]) {
    chapCode = KNOWN_CHAPTER_CODES[chapLower];
  } else {
    const matchedKnown = Object.entries(KNOWN_CHAPTER_CODES).find(([k]) => chapLower.includes(k) || k.includes(chapLower));
    if (matchedKnown) {
      chapCode = matchedKnown[1];
    } else {
      const words = chap.split(/\s+/).filter((w: string) => !['and', 'of', 'the', 'in', 'a', '&', 'to', 'for'].includes(w.toLowerCase()));
      if (words.length >= 3) {
        chapCode = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      } else if (words.length === 2) {
        chapCode = (words[0].substring(0, 2) + words[1][0]).toUpperCase();
      } else {
        const clean = chap.replace(/[^a-zA-Z]/g, '').toUpperCase();
        chapCode = clean.length >= 3 ? clean.substring(0, 3) : (clean || 'GEN').padEnd(3, 'X');
      }
    }
  }

  // Extract sequence number from existing questionCode or id
  const existingCode = String(q?.questionCode || q?.question_code || (typeof q?.id === 'string' ? q.id : '') || '');
  const matchNum = existingCode.match(/(\d{1,4})$/);
  const numPart = matchNum
    ? matchNum[1].padStart(4, '0')
    : (typeof q?.id === 'string' && q.id.replace(/\D/g, '')
        ? q.id.replace(/\D/g, '').slice(-4).padStart(4, '0')
        : String(Math.floor(Math.random() * 9000) + 1000));

  return `${subCode}-${chapCode}-${numPart}`;
};

