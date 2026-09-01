import { MathAST, MathASTNode } from '@eduforge/shared';

export function astToLatex(ast: MathAST): string {
  if (!ast || !ast.nodes) return '';
  return ast.nodes.map(nodeToLatex).join(' ');
}

export function nodeToLatex(node: MathASTNode): string {
  switch (node.type) {
    case 'text':
      return node.value || '';

    case 'symbol':
      return node.latex || node.symbol;

    case 'greek':
      return node.latex || `\\${node.letter}`;

    case 'operator':
      return node.latex || node.operator;

    case 'fraction': {
      const num = node.numerator.map(nodeToLatex).join(' ') || '1';
      const den = node.denominator.map(nodeToLatex).join(' ') || '1';
      return `\\frac{${num}}{${den}}`;
    }

    case 'sqrt': {
      const rad = node.radicand.map(nodeToLatex).join(' ') || 'x';
      return `\\sqrt{${rad}}`;
    }

    case 'nth_root': {
      const idx = node.index.map(nodeToLatex).join(' ') || 'n';
      const rad = node.radicand.map(nodeToLatex).join(' ') || 'x';
      return `\\sqrt[${idx}]{${rad}}`;
    }

    case 'power': {
      const base = node.base.map(nodeToLatex).join(' ') || 'x';
      const exp = node.exponent.map(nodeToLatex).join(' ') || '2';
      return `${base}^{${exp}}`;
    }

    case 'subscript': {
      const base = node.base.map(nodeToLatex).join(' ') || 'x';
      const sub = node.subscript.map(nodeToLatex).join(' ') || '0';
      return `${base}_{${sub}}`;
    }

    case 'sub_sup': {
      const base = node.base.map(nodeToLatex).join(' ') || 'x';
      const sub = node.subscript.map(nodeToLatex).join(' ') || '0';
      const sup = node.superscript.map(nodeToLatex).join(' ') || '2';
      return `${base}_{${sub}}^{${sup}}`;
    }

    case 'integral': {
      const integrand = node.integrand.map(nodeToLatex).join(' ') || 'f(x)';
      const variable = node.variable || 'x';
      if (node.isDefinite && node.lower && node.upper) {
        const lower = node.lower.map(nodeToLatex).join(' ') || 'a';
        const upper = node.upper.map(nodeToLatex).join(' ') || 'b';
        return `\\int_{${lower}}^{${upper}} ${integrand} \\, d${variable}`;
      }
      return `\\int ${integrand} \\, d${variable}`;
    }

    case 'summation': {
      const body = node.body.map(nodeToLatex).join(' ') || 'x_i';
      const lower = node.lower ? node.lower.map(nodeToLatex).join(' ') : 'i=1';
      const upper = node.upper ? node.upper.map(nodeToLatex).join(' ') : 'n';
      return `\\sum_{${lower}}^{${upper}} ${body}`;
    }

    case 'product': {
      const body = node.body.map(nodeToLatex).join(' ') || 'x_i';
      const lower = node.lower ? node.lower.map(nodeToLatex).join(' ') : 'i=1';
      const upper = node.upper ? node.upper.map(nodeToLatex).join(' ') : 'n';
      return `\\prod_{${lower}}^{${upper}} ${body}`;
    }

    case 'limit': {
      const expr = node.expression.map(nodeToLatex).join(' ') || 'f(x)';
      return `\\lim_{${node.variable} \\to ${node.target}} ${expr}`;
    }

    case 'derivative': {
      const num = node.numerator.map(nodeToLatex).join(' ') || 'y';
      const v = node.variable || 'x';
      const d = node.isPartial ? '\\partial' : 'd';
      if (node.order && node.order > 1) {
        return `\\frac{${d}^${node.order} ${num}}{${d} ${v}^${node.order}}`;
      }
      return `\\frac{${d} ${num}}{${d} ${v}}`;
    }

    case 'matrix': {
      const bType = node.bracketType || 'bmatrix';
      const rowsLatex = node.cells.map(row => {
        return row.map(cell => cell.map(nodeToLatex).join(' ') || '0').join(' & ');
      }).join(' \\\\ ');
      return `\\begin{${bType}} ${rowsLatex} \\end{${bType}}`;
    }

    case 'vector': {
      if (node.style === 'hat') return `\\hat{${node.name}}`;
      if (node.style === 'bold') return `\\mathbf{${node.name}}`;
      return `\\vec{${node.name}}`;
    }

    case 'bracket': {
      const content = node.content.map(nodeToLatex).join(' ') || '';
      return `\\left${node.leftBracket} ${content} \\right${node.rightBracket}`;
    }

    case 'chemistry': {
      return node.latex || `\\text{${node.formula}}`;
    }

    default:
      return '';
  }
}

// Preset builders for visual palette
export const MathConstructTemplates = {
  fraction(num = 'a', den = 'b'): MathASTNode {
    return {
      id: `frac-${Date.now()}`,
      type: 'fraction',
      numerator: [{ id: `n-${Date.now()}-1`, type: 'text', value: num }],
      denominator: [{ id: `n-${Date.now()}-2`, type: 'text', value: den }]
    };
  },
  sqrt(rad = 'x'): MathASTNode {
    return {
      id: `sqrt-${Date.now()}`,
      type: 'sqrt',
      radicand: [{ id: `n-${Date.now()}-1`, type: 'text', value: rad }]
    };
  },
  nthRoot(idx = 'n', rad = 'x'): MathASTNode {
    return {
      id: `nthroot-${Date.now()}`,
      type: 'nth_root',
      index: [{ id: `n-${Date.now()}-1`, type: 'text', value: idx }],
      radicand: [{ id: `n-${Date.now()}-2`, type: 'text', value: rad }]
    };
  },
  power(base = 'x', exp = '2'): MathASTNode {
    return {
      id: `pow-${Date.now()}`,
      type: 'power',
      base: [{ id: `n-${Date.now()}-1`, type: 'text', value: base }],
      exponent: [{ id: `n-${Date.now()}-2`, type: 'text', value: exp }]
    };
  },
  subscript(base = 'x', sub = '0'): MathASTNode {
    return {
      id: `sub-${Date.now()}`,
      type: 'subscript',
      base: [{ id: `n-${Date.now()}-1`, type: 'text', value: base }],
      subscript: [{ id: `n-${Date.now()}-2`, type: 'text', value: sub }]
    };
  },
  integral(lower = 'a', upper = 'b', expr = 'f(x)', v = 'x'): MathASTNode {
    return {
      id: `int-${Date.now()}`,
      type: 'integral',
      isDefinite: true,
      lower: [{ id: `n-${Date.now()}-1`, type: 'text', value: lower }],
      upper: [{ id: `n-${Date.now()}-2`, type: 'text', value: upper }],
      integrand: [{ id: `n-${Date.now()}-3`, type: 'text', value: expr }],
      variable: v
    };
  },
  summation(lower = 'i=1', upper = 'n', body = 'x_i'): MathASTNode {
    return {
      id: `sum-${Date.now()}`,
      type: 'summation',
      lower: [{ id: `n-${Date.now()}-1`, type: 'text', value: lower }],
      upper: [{ id: `n-${Date.now()}-2`, type: 'text', value: upper }],
      body: [{ id: `n-${Date.now()}-3`, type: 'text', value: body }]
    };
  },
  matrix2x2(a = 'a', b = 'b', c = 'c', d = 'd'): MathASTNode {
    return {
      id: `mat-${Date.now()}`,
      type: 'matrix',
      rows: 2,
      cols: 2,
      bracketType: 'bmatrix',
      cells: [
        [[{ id: `c-1-1`, type: 'text', value: a }], [{ id: `c-1-2`, type: 'text', value: b }]],
        [[{ id: `c-2-1`, type: 'text', value: c }], [{ id: `c-2-2`, type: 'text', value: d }]]
      ]
    };
  },
  derivative(num = 'y', v = 'x', order = 1): MathASTNode {
    return {
      id: `deriv-${Date.now()}`,
      type: 'derivative',
      numerator: [{ id: `n-${Date.now()}-1`, type: 'text', value: num }],
      variable: v,
      order
    };
  }
};
