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
    .replace(/&amp;/g, '&');

  // Strip HTML wrapper and text formatting tags (except <img>)
  str = str.replace(/<\/?(p|div|br|span|h[1-6]|ul|ol|li|strong|b|em|i|u|del|sub|sup)[^>]*>/gi, ' ');

  // Collapse multiple whitespace
  return str.replace(/\s+/g, ' ').trim();
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

// Helper to consume a balanced bracket/brace block e.g. {...} or [...]
function consumeBalanced(str: string, startIndex: number, openChar = '{', closeChar = '}'): { content: string; endIndex: number } | null {
  if (str[startIndex] !== openChar) return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '\\' && i + 1 < str.length) {
      i++; // Skip escaped character
      continue;
    }
    if (str[i] === openChar) depth++;
    else if (str[i] === closeChar) {
      depth--;
      if (depth === 0) {
        return {
          content: str.substring(startIndex, i + 1),
          endIndex: i + 1
        };
      }
    }
  }
  return null;
}

// Helper to extract a full LaTeX command with all its arguments and modifiers
function extractFullLatexExpression(str: string, startIndex: number): { latex: string; endIndex: number } | null {
  if (str[startIndex] !== '\\') return null;

  // Match command name e.g. \frac, \sqrt, \alpha, \text
  const match = str.substring(startIndex).match(/^\\([a-zA-Z]+|[,;:! %])/);
  if (!match) return null;

  let currentIdx = startIndex + match[0].length;

  // Consume optional arguments e.g. \sqrt[3]{x}
  if (str[currentIdx] === '[') {
    const opt = consumeBalanced(str, currentIdx, '[', ']');
    if (opt) currentIdx = opt.endIndex;
  }

  // Consume required arguments e.g. {numerator}{denominator}
  while (currentIdx < str.length && str[currentIdx] === '{') {
    const arg = consumeBalanced(str, currentIdx, '{', '}');
    if (arg) {
      currentIdx = arg.endIndex;
    } else {
      break;
    }
  }

  // Consume sub/superscripts attached to this command e.g. \int_a^b or \sigma_{total}^2
  while (currentIdx < str.length && (str[currentIdx] === '_' || str[currentIdx] === '^')) {
    currentIdx++;
    if (str[currentIdx] === '{') {
      const subSup = consumeBalanced(str, currentIdx, '{', '}');
      if (subSup) currentIdx = subSup.endIndex;
      else break;
    } else if (currentIdx < str.length && /[a-zA-Z0-9]/.test(str[currentIdx])) {
      currentIdx++;
    } else {
      break;
    }
  }

  return {
    latex: str.substring(startIndex, currentIdx),
    endIndex: currentIdx
  };
}

// Regex to test if a string contains common LaTeX keywords or mathematical markers
const LATEX_KEYWORD_REGEX = /\\(frac|sqrt|vec|int|sum|prod|partial|alpha|beta|gamma|delta|Delta|theta|Theta|lambda|Lambda|mu|pi|Pi|sigma|Sigma|omega|Omega|phi|Phi|psi|Psi|infty|times|div|pm|mp|le|ge|neq|approx|equiv|rightarrow|leftarrow|rightleftharpoons|ce|text|mathrm|mathbf|mathit|textsubscript|textsuperscript|cdot|circ|degree|angle|sin|cos|tan|cot|sec|csc|log|ln|lim|Omega|quad|qquad)\b|[_^]\{|\\[a-zA-Z]+/;

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

  // First decode HTML entities if encoded like &lt;p&gt;
  let decoded = textStr
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // 0. Support HTML <img> tags embedded directly in TipTap editor text
  if (/<img\s+/i.test(decoded)) {
    const htmlImgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/gi;
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    let imgMatch: RegExpExecArray | null;
    const re = new RegExp(htmlImgRegex.source, 'gi');
    while ((imgMatch = re.exec(decoded)) !== null) {
      if (imgMatch.index > lastIdx) {
        const rawSlice = decoded.substring(lastIdx, imgMatch.index);
        const cleanText = cleanHtmlTags(rawSlice);
        if (cleanText) {
          parts.push(
            <MathTextRenderer
              key={`html-txt-${lastIdx}`}
              text={cleanText}
            />
          );
        }
      }
      const rawImgSrc = imgMatch[1] || '';
      const imgSrc = resolveImageUrl(rawImgSrc);

      if (imgSrc && imgSrc !== 'undefined' && imgSrc !== 'null' && imgSrc.trim() !== '') {
        parts.push(
          <span key={`html-img-${imgMatch.index}`} className="block my-2 text-center">
            <img
              src={imgSrc}
              alt=""
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedFallback && imgSrc.includes('/api/assets/')) {
                  target.dataset.triedFallback = 'true';
                  if (!imgSrc.includes('/raw/')) {
                    target.src = imgSrc.replace('/api/assets/', '/api/assets/raw/');
                    return;
                  }
                }
                target.style.display = 'none';
                if (target.parentElement) target.parentElement.style.display = 'none';
              }}
              className="max-h-52 max-w-full rounded-md border border-slate-200 bg-white p-1 object-contain inline-block shadow-2xs"
            />
          </span>
        );
      }
      lastIdx = re.lastIndex;
    }
    if (lastIdx < decoded.length) {
      const rawSlice = decoded.substring(lastIdx);
      const cleanText = cleanHtmlTags(rawSlice);
      if (cleanText) {
        parts.push(
          <MathTextRenderer
            key={`html-txt-end-${lastIdx}`}
            text={cleanText}
          />
        );
      }
    }
    return <span className={`block w-full ${className}`}>{parts}</span>;
  }

  // Clean HTML wrapper tags like <p>...</p> or <div>...</div>
  let trimmed = cleanHtmlTags(decoded);
  if (!trimmed) return null;

  // Convert LaTeX inline \( ... \) and block \[ ... \] delimiters to $ ... $ and $$ ... $$
  if (trimmed.includes('\\(') || trimmed.includes('\\[')) {
    trimmed = trimmed
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$ $1 $$$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$ $1 $$');
  }

  // Auto-detect and wrap un-delimited math expressions, exponents, scientific notation, and chemical formulas into $...$
  if (!trimmed.includes('$')) {
    // 1. Scientific notation e.g. 6.67 x 10^-11 or 2.5 x 10^5
    trimmed = trimmed.replace(/(\b\d+(?:\.\d+)?\s*(?:x|×|\*|\\times)\s*10\s*[\^]\s*(?:\{[+-]?\d+\}|[+-]?\d+))/gi, (m) => `$${m.replace(/\s*x\s*/g, ' \\times ').replace(/10\^([+-]?\d+)/g, '10^{$1}')}$`);
    // 2. Pure powers of 10 e.g. 10^-11, 10^5, 10^-28
    trimmed = trimmed.replace(/(?<!\$)\b(10\s*[\^]\s*(?:\{[+-]?\d+\}|[+-]?\d+))\b(?!\$)/gi, (m) => `$${m.replace(/10\^([+-]?\d+)/g, '10^{$1}')}$`);
    // 3. Dimensional formulas e.g. [M L^2 T^-2], [M L^-1 T^-2]
    trimmed = trimmed.replace(/(?<!\$)(\[[MmLlTtAaKk\d\s\^\-\+\{\}]+\])(?!\$)/g, (m) => `$${m}$`);
    // 4. Units with powers e.g. N m^-2, g cm^-3, dyne cm^-2, s^-1, m s^-2
    trimmed = trimmed.replace(/(?<!\$)\b((?:[Nn]|dyne|dyn|[Gg]|kg|[Cc]m|[Mm]|s)\s*[\^]\s*\{?[+-]?\d+\}?)(?!\$)/g, (m) => `$\\text{${m}}$`);
    // 5. Chemical formulas with subscripts e.g. CaCO_3, H_2O, CO_2, H_2SO_4
    trimmed = trimmed.replace(/(?<!\$)\b(CaCO_3|H_2O|CO_2|O_2|N_2|H_2SO_4|KMnO_4|FeSO_4|NaCl|C_6H_\{?12\}?O_6|NO_2|SO_2|NH_3)\b(?!\$)/g, (m) => `$\\text{${m}}$`);
    // 6. Inline LaTeX expressions with backslash e.g. \frac{a}{b}, \sqrt{x}, \alpha, \beta, \Delta, \mu, \Omega
    trimmed = trimmed.replace(/(?<!\$)(\\[a-zA-Z]+(?:\{[^\}]*\})*(?:_\{?[a-zA-Z0-9]+\}?)?(?:\^\{?[a-zA-Z0-9+-]+\}?)?)(?!\$)/g, (m) => `$${m}$`);
  }

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

  // 3. Pure formula test:
  // Must NOT be a natural language sentence (i.e. contains spaces between ordinary words)
  const wordCount = trimmed.split(/\s+/).length;
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

  // 4. Mixed Text with embedded LaTeX expressions e.g.
  // "Find the maximum height H = \frac{u^2 \sin^2\theta}{2g} when \theta = 30^\circ."
  if (trimmed.includes('\\') || LATEX_KEYWORD_REGEX.test(trimmed)) {
    const parts: React.ReactNode[] = [];
    let i = 0;
    let textBuffer = '';

    while (i < trimmed.length) {
      if (trimmed[i] === '\\') {
        const expr = extractFullLatexExpression(trimmed, i);
        if (expr && expr.latex) {
          // Flush text buffer
          if (textBuffer) {
            parts.push(<span key={`t-${parts.length}-${i}`}>{textBuffer}</span>);
            textBuffer = '';
          }
          // Push rendered KaTeX equation
          parts.push(
            <KaTeXRenderer
              key={`m-${parts.length}-${i}`}
              math={expr.latex}
              block={false}
            />
          );
          i = expr.endIndex;
          continue;
        }
      }

      textBuffer += trimmed[i];
      i++;
    }

    if (textBuffer) {
      parts.push(<span key={`t-end-${parts.length}`}>{textBuffer}</span>);
    }

    return <span className={className}>{parts}</span>;
  }

  // 5. Normal plain text
  return <span className={className}>{trimmed}</span>;
};
