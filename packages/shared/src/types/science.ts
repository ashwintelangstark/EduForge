export interface PhysicsSymbol {
  id: string;
  symbol: string;
  latex: string;
  name: string;
  chapter: string;
  standardUnit?: string;
  dimension?: string;
  description?: string;
  commonFormulas?: string[];
}

export interface PhysicsChapter {
  id: string;
  name: string;
  category: string; // e.g. "Mechanics", "Electromagnetism", "Modern Physics"
  symbols: PhysicsSymbol[];
}

export interface ChemistryElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: string;
  group: number;
  period: number;
  electronConfiguration?: string;
  oxidationStates?: string[];
}

export interface ChemistryNotation {
  id: string;
  name: string;
  type: 'structure' | 'reaction' | 'arrow' | 'ion' | 'state' | 'organic' | 'inorganic' | 'physical';
  formula: string;
  latex: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  type: 'base' | 'derived' | 'custom';
  dimension?: string;
  siEquivalent?: string;
  category: string; // e.g. 'Length', 'Mass', 'Energy', 'Electricity'
}

export interface MetricPrefix {
  id: string;
  name: string;
  symbol: string;
  factor: string;
  power: number;
}

export interface ScientificConstant {
  id: string;
  symbol: string;
  latex: string;
  name: string;
  value: string;
  unit: string;
  category: 'Universal' | 'Electromagnetic' | 'Atomic' | 'Physico-Chemical' | 'Gravitational';
  description: string;
}

export interface SymbolCategory {
  id: string;
  name: string;
  symbols: {
    symbol: string;
    latex: string;
    name: string;
    description?: string;
  }[];
}
