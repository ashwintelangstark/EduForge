export type MathASTNodeType =
  | 'text'
  | 'symbol'
  | 'greek'
  | 'operator'
  | 'fraction'
  | 'sqrt'
  | 'nth_root'
  | 'power'
  | 'subscript'
  | 'sub_sup'
  | 'integral'
  | 'summation'
  | 'product'
  | 'limit'
  | 'derivative'
  | 'matrix'
  | 'vector'
  | 'bracket'
  | 'chemistry';

export interface BaseMathNode {
  id: string;
  type: MathASTNodeType;
}

export interface TextMathNode extends BaseMathNode {
  type: 'text';
  value: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface SymbolMathNode extends BaseMathNode {
  type: 'symbol';
  symbol: string;
  latex: string;
  name?: string;
}

export interface GreekMathNode extends BaseMathNode {
  type: 'greek';
  letter: string;
  latex: string;
  isCapital?: boolean;
}

export interface OperatorMathNode extends BaseMathNode {
  type: 'operator';
  operator: string;
  latex: string;
}

export interface FractionMathNode extends BaseMathNode {
  type: 'fraction';
  numerator: MathASTNode[];
  denominator: MathASTNode[];
}

export interface SqrtMathNode extends BaseMathNode {
  type: 'sqrt';
  radicand: MathASTNode[];
}

export interface NthRootMathNode extends BaseMathNode {
  type: 'nth_root';
  index: MathASTNode[];
  radicand: MathASTNode[];
}

export interface PowerMathNode extends BaseMathNode {
  type: 'power';
  base: MathASTNode[];
  exponent: MathASTNode[];
}

export interface SubscriptMathNode extends BaseMathNode {
  type: 'subscript';
  base: MathASTNode[];
  subscript: MathASTNode[];
}

export interface SubSupMathNode extends BaseMathNode {
  type: 'sub_sup';
  base: MathASTNode[];
  subscript: MathASTNode[];
  superscript: MathASTNode[];
}

export interface IntegralMathNode extends BaseMathNode {
  type: 'integral';
  lower?: MathASTNode[];
  upper?: MathASTNode[];
  integrand: MathASTNode[];
  variable?: string;
  isDefinite?: boolean;
}

export interface SummationMathNode extends BaseMathNode {
  type: 'summation';
  lower?: MathASTNode[];
  upper?: MathASTNode[];
  body: MathASTNode[];
}

export interface ProductMathNode extends BaseMathNode {
  type: 'product';
  lower?: MathASTNode[];
  upper?: MathASTNode[];
  body: MathASTNode[];
}

export interface LimitMathNode extends BaseMathNode {
  type: 'limit';
  variable: string;
  target: string;
  expression: MathASTNode[];
}

export interface DerivativeMathNode extends BaseMathNode {
  type: 'derivative';
  order?: number;
  numerator: MathASTNode[];
  variable: string;
  isPartial?: boolean;
}

export interface MatrixMathNode extends BaseMathNode {
  type: 'matrix';
  rows: number;
  cols: number;
  cells: MathASTNode[][][];
  bracketType?: 'matrix' | 'pmatrix' | 'bmatrix' | 'Bmatrix' | 'vmatrix' | 'Vmatrix';
}

export interface VectorMathNode extends BaseMathNode {
  type: 'vector';
  name: string;
  style?: 'arrow' | 'bold' | 'hat';
}

export interface BracketMathNode extends BaseMathNode {
  type: 'bracket';
  leftBracket: '(' | '[' | '{' | '|' | '⟨';
  rightBracket: ')' | ']' | '}' | '|' | '⟩';
  content: MathASTNode[];
}

export interface ChemistryMathNode extends BaseMathNode {
  type: 'chemistry';
  formula: string;
  latex: string;
  state?: 's' | 'l' | 'g' | 'aq';
}

export type MathASTNode =
  | TextMathNode
  | SymbolMathNode
  | GreekMathNode
  | OperatorMathNode
  | FractionMathNode
  | SqrtMathNode
  | NthRootMathNode
  | PowerMathNode
  | SubscriptMathNode
  | SubSupMathNode
  | IntegralMathNode
  | SummationMathNode
  | ProductMathNode
  | LimitMathNode
  | DerivativeMathNode
  | MatrixMathNode
  | VectorMathNode
  | BracketMathNode
  | ChemistryMathNode;

export interface MathAST {
  version: '1.0';
  nodes: MathASTNode[];
  rawLatex?: string;
}
