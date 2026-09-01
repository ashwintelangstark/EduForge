import React from 'react';
import { Question, DocumentBlock } from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';

interface ContentBlockProps {
  block: any;
}

export const ContentBlockRenderer: React.FC<ContentBlockProps> = ({ block }) => {
  if (!block) return null;

  // Handles standard block types or legacy mixed content objects
  const type = block.type || (block.latex ? 'equation' : block.html ? 'text' : 'text');

  switch (type) {
    case 'equation':
    case 'math': {
      const latex = block.latex || block.rawLatex || '';
      return (
        <div className="my-1.5 inline-block">
          <KaTeXRenderer math={latex} block={block.displayMode === 'block'} />
        </div>
      );
    }

    case 'image': {
      const src = block.src || block.url || '';
      if (!src) return null;
      return (
        <div className="my-2 max-w-md">
          <img
            src={src}
            alt={block.alt || 'Question Diagram'}
            className="max-h-64 object-contain rounded-md border border-slate-200"
          />
          {block.caption && <p className="text-xs text-slate-500 mt-1 italic">{block.caption}</p>}
        </div>
      );
    }

    case 'symbol': {
      const latex = block.latex || block.symbol || '';
      return <KaTeXRenderer math={latex} block={false} />;
    }

    case 'shape': {
      return (
        <div className="my-2 p-2 bg-slate-100 rounded border border-slate-300 text-xs font-mono">
          [Shape: {block.shapeType || 'diagram'}]
        </div>
      );
    }

    case 'table': {
      if (!block.cells || !Array.isArray(block.cells)) return null;
      return (
        <div className="my-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 border border-slate-300">
            <tbody>
              {block.cells.map((row: any[], rIdx: number) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell: any, cIdx: number) => (
                    <td key={cell.id || cIdx} className="px-3 py-2 text-xs border border-slate-200">
                      {Array.isArray(cell.content) ? (
                        cell.content.map((b: any, i: number) => (
                          <ContentBlockRenderer key={b.id || i} block={b} />
                        ))
                      ) : (
                        <span>{cell.text || ''}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'paragraph':
    case 'text':
    case 'richText':
    default: {
      const html = block.html || block.text || '';
      if (html) {
        return (
          <div className="prose prose-slate prose-sm max-w-none inline-block leading-relaxed">
            <MathTextRenderer text={html} />
          </div>
        );
      }

      if (Array.isArray(block.runs)) {
        return (
          <p className="inline-block leading-relaxed">
            {block.runs.map((r: any) => (
              <span
                key={r.id || Math.random()}
                style={{
                  fontWeight: r.formatting?.bold ? 'bold' : 'normal',
                  fontStyle: r.formatting?.italic ? 'italic' : 'normal',
                  textDecoration: r.formatting?.underline ? 'underline' : 'none'
                }}
              >
                <MathTextRenderer text={r.text || ''} />
              </span>
            ))}
          </p>
        );
      }

      return null;
    }
  }
};

interface QuestionRendererProps {
  question: Question;
  showExplanation?: boolean;
  showOptions?: boolean;
  className?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  showExplanation = false,
  showOptions = true,
  className = ''
}) => {
  if (!question) return null;

  const contentBlocks = Array.isArray(question.content) ? question.content : [];

  return (
    <div className={`space-y-3 font-sans text-slate-900 ${className}`}>
      {/* Question Content */}
      <div className="space-y-1 text-sm font-medium leading-relaxed">
        {contentBlocks.length > 0 ? (
          contentBlocks.map((block: any, idx: number) => (
            <ContentBlockRenderer key={block.id || idx} block={block} />
          ))
        ) : (
          <p>{question.rawText || 'Question Content'}</p>
        )}
      </div>

      {/* Question Options */}
      {showOptions && question.options && question.options.length > 0 && (
        <div className="pt-2">
          <OptionLayoutRenderer
            options={question.options}
            layoutType={question.optionLayout || 'grid_2x2'}
          />
        </div>
      )}

      {/* Explanation */}
      {showExplanation && question.explanation && question.explanation.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
          <span className="font-bold text-amber-800 uppercase tracking-wider block mb-1">
            Solution & Explanation
          </span>
          {question.explanation.map((b: any, idx: number) => (
            <ContentBlockRenderer key={b.id || idx} block={b} />
          ))}
        </div>
      )}
    </div>
  );
};
