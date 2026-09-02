import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXRendererProps {
  math: string;
  block?: boolean;
  className?: string;
  onClick?: () => void;
}

// Global in-memory cache for rendered KaTeX HTML strings (0ms re-computation, 120fps smooth)
const katexHtmlCache = new Map<string, string>();

/**
 * Robust LaTeX sanitizer before passing to KaTeX
 */
export function sanitizeLatexFormula(latex: string): string {
  if (!latex) return '';
  let s = String(latex).trim();

  // Strip accidental outer $ or $$ or \( \) or \[ \]
  s = s.replace(/^\\\[([\s\S]*)\\\]$/, '$1')
       .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
       .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
       .replace(/^\$([\s\S]*)\$$/, '$1')
       .trim();

  // Decode any HTML entities
  s = s.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&nbsp;/g, ' ');

  // Normalize excessive backslashes e.g. \\mathrm -> \mathrm, \\frac -> \frac
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // Fix \text{...} containing ^ or _ or - which KaTeX math-mode rejects inside \text
  s = s.replace(/\\text\{([^{}]*?)[\^]([+-]?\d+|\{[^{}]+\})\}/g, '\\text{$1}^{$2}');
  s = s.replace(/\\text\{([^{}]*?)_([a-zA-Z0-9]+|\{[^{}]+\})\}/g, '\\text{$1}_{$2}');
  s = s.replace(/\\text\{([a-zA-Z]+)-(\d+)\}/g, '\\text{$1}^{-$2}');

  // Fix nested \mathrm{\text{...}} or double wrappers
  s = s.replace(/\\mathrm\{([^{}]*?)\s*\\text\{([^{}]*)\}\s*\}/g, '\\mathrm{$1 $2}');

  // Auto-balance curly braces
  let openBraces = (s.match(/\{/g) || []).length;
  let closeBraces = (s.match(/\}/g) || []).length;
  while (openBraces > closeBraces) {
    s += '}';
    openBraces--;
  }
  while (closeBraces > openBraces && s.endsWith('}')) {
    s = s.slice(0, -1);
    closeBraces--;
  }

  return s;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({
  math,
  block = false,
  className = '',
  onClick
}) => {
  const html = useMemo(() => {
    if (!math) return '';
    const cleanMath = sanitizeLatexFormula(math);
    if (!cleanMath) return '';

    const cacheKey = `${block ? 'B' : 'I'}:${cleanMath}`;
    const cached = katexHtmlCache.get(cacheKey);
    if (cached) return cached;

    try {
      const rendered = katex.renderToString(cleanMath, {
        displayMode: block,
        throwOnError: false,
        output: 'html' // 'html' produces crisp KaTeX layout
      });

      // If KaTeX produced an error span (class katex-error), attempt a sanitized fallback
      if (rendered.includes('katex-error')) {
        // Try simplified plain text/math rendering
        const simplified = cleanMath
          .replace(/\\(mathrm|mathbf|mathit|text|textsubscript|textsuperscript)\{([^{}]*)\}/g, '$2')
          .replace(/\\,/g, ' ')
          .replace(/\\;/g, ' ')
          .replace(/\\quad/g, ' ')
          .replace(/\\/g, '');

        try {
          const secondTry = katex.renderToString(simplified, {
            displayMode: block,
            throwOnError: false,
            output: 'html'
          });
          if (!secondTry.includes('katex-error')) {
            katexHtmlCache.set(cacheKey, secondTry);
            return secondTry;
          }
        } catch {
          // fall through to formatted clean math span
        }

        // Clean formatted span fallback without red error codes
        const formattedFallback = `<span class="inline-math-fallback font-serif italic">${simplified
          .replace(/\^\{?([+-]?\d+)\}?/g, '<sup>$1</sup>')
          .replace(/_\{?([a-zA-Z0-9]+)\}?/g, '<sub>$1</sub>')}</span>`;
        katexHtmlCache.set(cacheKey, formattedFallback);
        return formattedFallback;
      }

      katexHtmlCache.set(cacheKey, rendered);
      return rendered;
    } catch {
      const simplified = cleanMath
        .replace(/\\(mathrm|mathbf|mathit|text)\{([^{}]*)\}/g, '$2')
        .replace(/\\,/g, ' ')
        .replace(/\\/g, '');
      const fallback = `<span class="inline-math-fallback font-serif italic">${simplified
        .replace(/\^\{?([+-]?\d+)\}?/g, '<sup>$1</sup>')
        .replace(/_\{?([a-zA-Z0-9]+)\}?/g, '<sub>$1</sub>')}</span>`;
      katexHtmlCache.set(cacheKey, fallback);
      return fallback;
    }
  }, [math, block]);

  if (block) {
    return (
      <div
        className={`katex-block my-2 text-center overflow-x-auto select-none ${onClick ? 'cursor-pointer hover:bg-sky-50/50 p-1 rounded transition-colors' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={onClick}
      />
    );
  }

  return (
    <span
      className={`katex-inline inline-block mx-0.5 select-none ${onClick ? 'cursor-pointer hover:bg-sky-50/50 px-1 rounded transition-colors' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={onClick}
    />
  );
};
