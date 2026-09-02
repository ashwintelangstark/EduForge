import React from 'react';
import { KaTeXRenderer } from './KaTeXRenderer.js';

interface MathTextRendererProps {
  text?: string;
  className?: string;
  block?: boolean;
}

// Helper to check if a character is whitespace or punctuation
const isBoundary = (ch: string) => /\s|[.,;:!?"'()\[\]{}]/.test(ch);

export function resolveImageUrl(src: string | undefined): string {
  if (!src) return '';
  let imgSrc = src.trim();
  imgSrc = imgSrc.replace(/&amp;/g, '&');

  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) {
    return imgSrc;
  }

  if (!imgSrc.startsWith('/')) {
    imgSrc = `/${imgSrc}`;
  }

  return imgSrc;
}

export function cleanHtmlTags(text: string): string {
  if (!text) return '';
  let str = text.trim();
  // Decode HTML entities
  str = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');

  // Strip HTML wrapper and text formatting tags (except <img>)
  str = str.replace(/<\/?(p|div|br|span|h[1-6]|ul|ol|li|strong|b|em|i|u|del|sub|sup)[^>]*>/gi, ' ');

  // Collapse multiple whitespace
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Auto-detects and wraps any un-delimited LaTeX commands, exponents, subscripts,
 * scientific notation, and chemical formulas into $ ... $ so they render everywhere.
 */
export function autoDetectAndWrapLatex(str: string): string {
  if (!str) return '';
  let s = str;

  // Convert LaTeX inline \( ... \) and block \[ ... \] delimiters to $ ... $ and $$ ... $$
  s = s
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$ $1 $$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$ $1 $$');

  // 1. Scientific notation e.g. 6.67 x 10^-11 or 2.5 x 10^5
  s = s.replace(/(?<!\$)\b(\d+(?:\.\d+)?\s*(?:x|×|\*|\\times)\s*10\s*[\^]\s*(?:\{[+-]?\d+\}|[+-]?\d+))\b(?!\$)/gi, (m) => `$${m.replace(/\s*x\s*/gi, ' \\times ').replace(/10\^([+-]?\d+)/g, '10^{$1}')}$`);

  // 2. Pure powers of 10 e.g. 10^-11, 10^5, 10^-28
  s = s.replace(/(?<!\$)\b(10\s*[\^]\s*(?:\{[+-]?\d+\}|[+-]?\d+))\b(?!\$)/gi, (m) => `$${m.replace(/10\^([+-]?\d+)/g, '10^{$1}')}$`);

  // 3. Dimensional formulas e.g. [M L^2 T^-2]
  s = s.replace(/(?<!\$)(\[[MmLlTtAaKk\d\s\^\-\+\{\}]+\])(?!\$)/g, (m) => `$${m}$`);

  // 4. Units with powers e.g. N m^-2, g cm^-3, dyne cm^-2, s^-1, m s^-2
  s = s.replace(/(?<!\$)\b((?:[Nn]|dyne|dyn|[Gg]|kg|[Cc]m|[Mm]|s)\s*[\^]\s*\{?[+-]?\d+\}?)(?!\$)/g, (m) => `$\\text{${m}}$`);

  // 5. Chemical formulas with subscripts e.g. CaCO_3, H_2O, CO_2, H_2SO_4
  s = s.replace(/(?<!\$)\b(CaCO_3|H_2O|CO_2|O_2|N_2|H_2SO_4|KMnO_4|FeSO_4|NaCl|C_6H_\{?12\}?O_6|NO_2|SO_2|NH_3)\b(?!\$)/g, (m) => `$\\text{${m}}$`);

  // 6. LaTeX commands starting with backslash e.g. \sqrt{x}, \frac{a}{b}, \alpha, \beta, \theta, \pm, \times, \int_a^b, \vec{v}
  const latexCommandPattern = /\\([a-zA-Z]+|[,;:! %])(?:\s*\[[^\]]*\])?(?:\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*(?:\s*[_^]\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[a-zA-Z0-9+-]+))*/g;

  // Split string into existing $ math blocks and plain text blocks
  const parts = s.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);
  const processed = parts.map((part) => {
    if (!part || part.startsWith('$')) return part;

    // Auto-wrap backslash LaTeX expressions in this text part
    let p = part.replace(latexCommandPattern, (m) => {
      const trimmedMatch = m.trim();
      if (!trimmedMatch || trimmedMatch === '\\') return m;
      return `$${trimmedMatch}$`;
    });

    // Auto-wrap standalone variables with exponents or subscripts e.g. x^2, y_1, (a+b)^2, a_i^2
    p = p.replace(/(?<!\$)\b([a-zA-Z0-9\(\)]+\s*[\^\_]\s*(?:\{[^{}]+\}|[a-zA-Z0-9\+\-]+)(?:\s*[\^\_]\s*(?:\{[^{}]+\}|[a-zA-Z0-9\+\-]+))?)\b(?!\$)/g, (m) => `$${m}$`);

    return p;
  });

  return processed.join('');
}

/**
 * Strips question code identifiers like [Q-BIO-001], [Q-PHY-01-001], Q-BIO-001:, (Q-001), [Q101], etc.
 * from question statements, option texts, and preview text.
 */
export function stripQuestionCode(text: string | undefined): string {
  if (!text) return '';
  let str = String(text).trim();
  // Strip bracketed or leading code prefixes
  str = str.replace(/^\s*\[?\s*Q\s*[-_]?[A-Za-z0-9_-]+\s*\]?\s*[:.-]?\s*/i, '');
  str = str.replace(/^\s*\[?\s*[A-Z]{2,6}-[A-Z0-9]{2,6}-[0-9]{1,6}\s*\]?\s*[:.-]?\s*/i, '');
  return str.trim();
}

const LATEX_KEYWORD_REGEX = /\\(frac|sqrt|vec|int|sum|prod|partial|alpha|beta|gamma|delta|Delta|theta|Theta|lambda|Lambda|mu|pi|Pi|sigma|Sigma|omega|Omega|phi|Phi|psi|Psi|infty|times|div|pm|mp|le|ge|neq|approx|equiv|rightarrow|leftarrow|rightleftharpoons|ce|text|mathrm|mathbf|mathit|textsubscript|textsuperscript|cdot|circ|degree|angle|sin|cos|tan|cot|sec|csc|log|ln|lim|Omega|quad|qquad)\b|[_^]\{|\\[a-zA-Z]+/;

function RenderSingleMathTextChunk({ text, block, className }: { text: string; block?: boolean; className?: string }) {
  let trimmed = autoDetectAndWrapLatex(cleanHtmlTags(text));
  if (!trimmed) return null;

  // 1. Explicit $...$ or $$...$$ delimiters
  if (trimmed.includes('$')) {
    const parts: React.ReactNode[] = [];
    const delimiterRegex = /\$\$([\s\S]*?)\$\$|\$([^\$]+?)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = delimiterRegex.exec(trimmed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`}>{trimmed.substring(lastIndex, match.index)}</span>
        );
      }

      const isBlockMath = Boolean(match[1]);
      const mathContent = match[1] || match[2] || '';

      parts.push(
        <KaTeXRenderer
          key={`math-${match.index}`}
          math={mathContent.trim()}
          block={isBlockMath || block}
        />
      );

      lastIndex = delimiterRegex.lastIndex;
    }

    if (lastIndex < trimmed.length) {
      parts.push(
        <span key={`txt-${lastIndex}`}>{trimmed.substring(lastIndex)}</span>
      );
    }

    return <span className={className}>{parts}</span>;
  }

  // 2. Explicit LaTeX environment like \begin{equation} or \begin{matrix}
  if (trimmed.startsWith('\\begin{') && trimmed.endsWith('\\end{')) {
    return (
      <KaTeXRenderer
        math={trimmed}
        block={block || true}
        className={className}
      />
    );
  }

  // 3. Pure formula test
  const hasEnglishWords = /\b(the|is|are|of|in|to|and|for|with|from|by|at|which|what|calculate|find|determine|when|if|where|each|connected|equivalent|combination|resistor|resistors|identical)\b/i.test(trimmed);

  const isPureFormula = !hasEnglishWords && (
    (trimmed.startsWith('\\') && !trimmed.includes('. ')) ||
    (trimmed.includes('\\frac')) ||
    (trimmed.includes('\\sqrt')) ||
    (trimmed.includes('\\pm')) ||
    (trimmed.includes('\\rightleftharpoons')) ||
    (trimmed.includes('\\rightarrow')) ||
    (trimmed.includes('=') && (trimmed.includes('\\') || trimmed.includes('^') || trimmed.includes('_'))) ||
    (/^\d+\s*\\Omega$/.test(trimmed)) ||
    (/^[a-zA-Z0-9_\^\+\-\*/\(\)\{\}\s\\=]+$/.test(trimmed) && (trimmed.includes('^') || trimmed.includes('_') || trimmed.includes('\\')))
  );

  if (isPureFormula) {
    return (
      <KaTeXRenderer
        math={trimmed}
        block={block}
        className={className}
      />
    );
  }

  return <span className={className}>{trimmed}</span>;
}

export const MathTextRenderer: React.FC<MathTextRendererProps> = ({
  text = '',
  className = '',
  block = false
}) => {
  if (!text) return null;

  // Support JSON-stringified block arrays e.g. [{"type":"equation","latex":"..."}]
  if (typeof text === 'string' && (text.startsWith('[') || text.startsWith('{'))) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return (
          <span className={className}>
            {parsed.map((item: any, idx: number) => {
              if (item.type === 'equation' || item.latex) {
                return <KaTeXRenderer key={idx} math={item.latex || item.rawLatex || ''} block={item.displayMode === 'block'} />;
              }
              if (item.html || item.text) {
                return <MathTextRenderer key={idx} text={item.html || item.text} />;
              }
              return null;
            })}
          </span>
        );
      } else if (parsed && (parsed.type === 'equation' || parsed.latex)) {
        return <KaTeXRenderer math={parsed.latex || parsed.rawLatex || ''} block={parsed.displayMode === 'block'} className={className} />;
      }
    } catch {
      // Not valid JSON, proceed to text parsing
    }
  }

  const textStr = typeof text === 'string' ? text : String(text);

  // If contains HTML <img> tags, parse them into uncropped JSX <img> elements
  if (/<img\s+/i.test(textStr)) {
    const imgTagRegex = /(<img\s+[^>]*>)/gi;
    const parts = textStr.split(imgTagRegex);

    return (
      <span className={className}>
        {parts.map((part, idx) => {
          if (!part) return null;

          if (/^<img\s+/i.test(part.trim())) {
            const srcMatch = part.match(/src=["']([^"']+)["']/i) || part.match(/src=([^\s>]+)/i);
            const widthMatch = part.match(/width=["']([^"']+)["']/i);
            const altMatch = part.match(/alt=["']([^"']+)["']/i);
            const imgSrc = srcMatch ? srcMatch[1] : '';

            if (!imgSrc) return null;

            const resolvedSrc = resolveImageUrl(imgSrc);
            const customWidth = widthMatch ? widthMatch[1] : undefined;

            return (
              <img
                key={`img-${idx}`}
                src={resolvedSrc}
                alt={altMatch ? altMatch[1] : 'Question Image'}
                style={{
                  width: customWidth || undefined,
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 'none',
                  objectFit: 'contain'
                }}
                className="my-2 max-w-full h-auto object-contain border border-slate-300 p-1 bg-white rounded-md block shadow-2xs"
              />
            );
          }

          return <RenderSingleMathTextChunk key={`chunk-${idx}`} text={part} block={block} className={className} />;
        })}
      </span>
    );
  }

  return <RenderSingleMathTextChunk text={textStr} block={block} className={className} />;
};
