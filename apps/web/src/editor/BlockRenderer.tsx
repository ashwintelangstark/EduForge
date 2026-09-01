import React, { useRef, useEffect, useState, memo } from 'react';
import {
  DocumentBlock, QuestionBlock, TableBlock, ShapeBlock, WordArtBlock,
  EquationBlock, ParagraphBlock, HeadingBlock, SectionHeaderBlock, TextRun,
  QuestionOption, ImageBlock
} from '@eduforge/shared';
import { KaTeXRenderer } from '../equation/KaTeXRenderer.js';
import { MathTextRenderer, resolveImageUrl } from '../equation/MathTextRenderer.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';
import {
  Trash2, Copy, ArrowUp, ArrowDown, Edit3, Type, Wand2, Plus,
  Sigma, Sparkles, ZoomIn, ZoomOut, Maximize2, Minimize2, GripVertical,
  ArrowRight, ArrowLeft, Image as ImageIcon, Loader2
} from 'lucide-react';
import { api } from '../services/api.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { FormattingState } from './EditorRibbon.js';

interface BlockRendererProps {
  block: DocumentBlock;
  sectionId: string;
  isSelected?: boolean;
  isTwoColumn?: boolean;
  currentColumnIndex?: number;
  isFormatPainterActive?: boolean;
  showFormattingMarks?: boolean;
  onSelect?: () => void;
  onUpdateBlock?: (updated: DocumentBlock) => void;
  onDeleteBlock?: () => void;
  onDuplicateBlock?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleColumn?: (targetCol: 0 | 1) => void;
  onInsertNextParagraph?: (currentBlockId: string) => void;
  onFocusPreviousBlock?: (currentBlockId: string) => void;
  onApplyFormatPainter?: (targetBlock: DocumentBlock) => void;
  onEditQuestion?: (question: QuestionBlock) => void;
  onEditEquation?: (eq: EquationBlock) => void;
  onTextSelectionChange?: (formatting: Partial<FormattingState>) => void;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  sectionId,
  isSelected = false,
  isTwoColumn = false,
  currentColumnIndex = 0,
  isFormatPainterActive = false,
  showFormattingMarks = false,
  onSelect,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  onToggleColumn,
  onInsertNextParagraph,
  onFocusPreviousBlock,
  onApplyFormatPainter,
  onEditQuestion,
  onEditEquation,
  onTextSelectionChange
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFormatPainterActive && onApplyFormatPainter) {
      onApplyFormatPainter(block);
      return;
    }
    onSelect && onSelect();
  };

  // Increase Block Size / Font Size / Scale
  const handleIncreaseBlockSize = () => {
    if (!onUpdateBlock) return;
    if (block.type === 'question') {
      const qb = block as QuestionBlock;
      const currentSize = qb.fontSize || 10.5;
      const newSize = Math.min(22, Math.round((currentSize + 1) * 10) / 10);
      const currentScale = qb.scale || 1.0;
      const newScale = Math.min(2.0, Math.round((currentScale + 0.1) * 100) / 100);
      onUpdateBlock({
        ...qb,
        fontSize: newSize,
        scale: newScale
      });
    } else if (block.type === 'paragraph') {
      const p = block as ParagraphBlock;
      const f = p.runs?.[0]?.formatting || {};
      const currentSize = f.fontSize || 10.5;
      const newSize = Math.min(24, Math.round((currentSize + 1) * 10) / 10);
      onUpdateBlock({
        ...p,
        runs: p.runs && p.runs.length > 0
          ? p.runs.map(r => ({ ...r, formatting: { ...r.formatting, fontSize: newSize } }))
          : [{ id: `r-${Date.now()}`, text: '', formatting: { ...f, fontSize: newSize } }]
      });
    } else if (block.type === 'equation') {
      const eq = block as EquationBlock;
      const currentSize = eq.fontSize || 14;
      onUpdateBlock({ ...eq, fontSize: Math.min(26, currentSize + 2) });
    }
  };

  // Decrease Block Size / Font Size / Scale
  const handleDecreaseBlockSize = () => {
    if (!onUpdateBlock) return;
    if (block.type === 'question') {
      const qb = block as QuestionBlock;
      const currentSize = qb.fontSize || 10.5;
      const newSize = Math.max(7, Math.round((currentSize - 1) * 10) / 10);
      const currentScale = qb.scale || 1.0;
      const newScale = Math.max(0.6, Math.round((currentScale - 0.1) * 100) / 100);
      onUpdateBlock({
        ...qb,
        fontSize: newSize,
        scale: newScale
      });
    } else if (block.type === 'paragraph') {
      const p = block as ParagraphBlock;
      const f = p.runs?.[0]?.formatting || {};
      const currentSize = f.fontSize || 10.5;
      const newSize = Math.max(6.5, Math.round((currentSize - 1) * 10) / 10);
      onUpdateBlock({
        ...p,
        runs: p.runs && p.runs.length > 0
          ? p.runs.map(r => ({ ...r, formatting: { ...r.formatting, fontSize: newSize } }))
          : [{ id: `r-${Date.now()}`, text: '', formatting: { ...f, fontSize: newSize } }]
      });
    } else if (block.type === 'equation') {
      const eq = block as EquationBlock;
      const currentSize = eq.fontSize || 14;
      onUpdateBlock({ ...eq, fontSize: Math.max(8, currentSize - 2) });
    }
  };

  // Helper for border styling
  const getBorderStyle = (borderType?: string, customBg?: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (customBg && customBg !== 'transparent') {
      style.backgroundColor = customBg;
      style.padding = '4px 8px';
      style.borderRadius = '3px';
    }
    if (borderType === 'box' || borderType === 'all') {
      style.border = '1px solid #cbd5e1';
      style.padding = '6px 10px';
      style.borderRadius = '4px';
    } else if (borderType === 'left') {
      style.borderLeft = '3px solid #0284c7';
      style.paddingLeft = '10px';
    } else if (borderType === 'bottom') {
      style.borderBottom = '1px solid #cbd5e1';
      style.paddingBottom = '4px';
    } else if (borderType === 'top') {
      style.borderTop = '1px solid #cbd5e1';
      style.paddingTop = '4px';
    }
    return style;
  };

  return (
    <div
      onClick={handleClick}
      className={`relative group rounded-sm transition-all p-1 -m-1 border ${
        isSelected
          ? 'border-sky-500 bg-sky-50/20 ring-2 ring-sky-400/20'
          : 'border-transparent hover:border-slate-300/80 hover:bg-slate-50/40'
      } ${isFormatPainterActive ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400/60' : ''}`}
    >
      {/* Action Toolbar on Hover/Select */}
      <div className={`absolute right-1 -top-4 z-30 flex items-center gap-0.5 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded shadow-lg no-print transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
      }`}>
        {block.type === 'question' && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onEditQuestion && onEditQuestion(block as QuestionBlock);
            }}
            className="p-1 hover:text-sky-400 transition-colors flex items-center gap-1 text-[10px]"
            title="Edit Full Question in Builder / MathType"
          >
            <Edit3 className="w-3 h-3" />
            <span className="font-bold">Edit Builder</span>
          </button>
        )}
        {block.type === 'equation' && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onEditEquation && onEditEquation(block as EquationBlock);
            }}
            className="p-1 hover:text-sky-400 transition-colors"
            title="Edit Math Equation"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}

        {/* Decrease Block Size (A-) */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            handleDecreaseBlockSize();
          }}
          className="px-1 py-0.5 hover:text-sky-400 transition-colors flex items-center font-bold text-[10px] bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
          title={`Decrease Block Size / Font Size (Current: ${(block as any).fontSize || 10.5}pt)`}
        >
          <ZoomOut className="w-2.5 h-2.5 mr-0.5" />
          <span>A-</span>
        </button>

        {/* Increase Block Size (A+) */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            handleIncreaseBlockSize();
          }}
          className="px-1 py-0.5 hover:text-sky-400 transition-colors flex items-center font-bold text-[10px] bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
          title={`Increase Block Size / Font Size (Current: ${(block as any).fontSize || 10.5}pt)`}
        >
          <ZoomIn className="w-2.5 h-2.5 mr-0.5" />
          <span>A+</span>
        </button>

        {/* 1-Click Column Switch in 2-Column Mode (Left <-> Right) */}
        {isTwoColumn && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              const nextCol = (block.column === 1 || currentColumnIndex === 1) ? 0 : 1;
              onToggleColumn && onToggleColumn(nextCol);
            }}
            className="px-1.5 py-0.5 hover:text-sky-300 transition-colors flex items-center gap-0.5 font-bold text-[10px] bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
            title={(block.column === 1 || currentColumnIndex === 1) ? "Move Question to Left Column" : "Move Question to Right Column"}
          >
            {(block.column === 1 || currentColumnIndex === 1) ? (
              <>
                <ArrowLeft className="w-2.5 h-2.5" />
                <span>Left Col</span>
              </>
            ) : (
              <>
                <span>Right Col</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onMoveUp && onMoveUp();
          }}
          className="p-1 hover:text-sky-400 transition-colors"
          title="Move Up"
        >
          <ArrowUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onMoveDown && onMoveDown();
          }}
          className="p-1 hover:text-sky-400 transition-colors"
          title="Move Down"
        >
          <ArrowDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDuplicateBlock && onDuplicateBlock();
          }}
          className="p-1 hover:text-sky-400 transition-colors"
          title="Duplicate Block"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDeleteBlock && onDeleteBlock();
          }}
          className="p-1 hover:text-red-400 transition-colors"
          title="Delete Block"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Render actual block content with MS Word-like inline editing */}
      {renderBlockContent(
        block,
        isSelected,
        showFormattingMarks,
        onUpdateBlock,
        onInsertNextParagraph,
        onFocusPreviousBlock,
        onEditEquation,
        onEditQuestion,
        onTextSelectionChange,
        getBorderStyle
      )}
    </div>
  );
};

/* =========================================================================
   QUESTION BLOCK ITEM (WITH DYNAMIC SIZING, QUESTION/OPTION EDITING & DROP)
   ========================================================================= */
const QuestionBlockItem: React.FC<{
  qb: QuestionBlock;
  onUpdateBlock?: (updated: DocumentBlock) => void;
  onEditQuestion?: (q: QuestionBlock) => void;
}> = ({ qb, onUpdateBlock, onEditQuestion }) => {
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const q = qb.question;
  const [statementText, setStatementText] = useState(q.rawText || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontSize = qb.fontSize || 10.5;
  const scale = qb.scale || 1.0;

  useEffect(() => {
    setStatementText(q.rawText || '');
  }, [q.rawText]);

  // Set block font size & scale
  const setBlockFontSize = (newSize: number) => {
    if (!onUpdateBlock) return;
    const clamped = Math.max(7, Math.min(22, Math.round(newSize * 10) / 10));
    onUpdateBlock({
      ...qb,
      fontSize: clamped,
      scale: Math.round((clamped / 10.5) * 100) / 100
    });
  };

  // Upload more images to this question directly on canvas
  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpdateBlock) return;
    try {
      setIsUploading(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploadImage(files[i]);
        if (res.url) newUrls.push(res.url);
      }
      const existing = q.imageUrls && q.imageUrls.length > 0 ? q.imageUrls : (q.imageUrl ? [q.imageUrl] : []);
      const merged = [...existing, ...newUrls];
      onUpdateBlock({
        ...qb,
        question: {
          ...q,
          imageUrls: merged,
          imageUrl: merged[0]
        }
      });
    } catch (err) {
      console.error('Error uploading question images:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drop handler: drop formulas/symbols from Science Drawer directly onto the question
  const handleDropOnQuestion = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const eduData = e.dataTransfer.getData('application/eduforge-item');
      let inserted = '';
      if (eduData) {
        const item = JSON.parse(eduData);
        inserted = item.latex || item.symbol || item.value || item.formula || '';
      } else {
        inserted = e.dataTransfer.getData('text/plain') || '';
      }

      if (inserted && onUpdateBlock) {
        const current = q.rawText || '';
        const updated = current ? `${current} ${inserted}` : inserted;
        setStatementText(updated);
        onUpdateBlock({
          ...qb,
          question: { ...q, rawText: updated }
        });
      }
    } catch (err) {
      console.error('Error dropping on question:', err);
    }
  };

  // Copy-paste handler for images/diagrams directly onto the question card
  const handlePasteOnQuestion = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      try {
        setIsUploading(true);
        const newUrls: string[] = [];
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            const res = await api.uploadImage(file);
            if (res.url) newUrls.push(res.url);
          }
        }
        if (newUrls.length > 0 && onUpdateBlock) {
          const existing = q.imageUrls && q.imageUrls.length > 0 ? q.imageUrls : (q.imageUrl ? [q.imageUrl] : []);
          const merged = [...existing, ...newUrls];
          onUpdateBlock({
            ...qb,
            question: {
              ...q,
              imageUrls: merged,
              imageUrl: merged[0]
            }
          });
        }
      } catch (err) {
        console.error('Error pasting image onto question:', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddOption = () => {
    if (!onUpdateBlock) return;
    const currentOpts = q.options || [];
    const nextKey = String.fromCharCode(97 + currentOpts.length);
    const newOpt: QuestionOption = {
      id: `opt-${Date.now()}-${currentOpts.length}`,
      key: nextKey,
      rawText: 'New option formula or text',
      isCorrect: false,
      content: []
    };
    onUpdateBlock({
      ...qb,
      question: { ...q, options: [...currentOpts, newOpt] }
    });
  };

  return (
    <div
      style={{
        fontSize: `${fontSize}pt`,
        lineHeight: 1.35
      }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDropOnQuestion}
      onPaste={handlePasteOnQuestion}
      className="my-2 select-text border border-transparent hover:border-sky-300 hover:bg-sky-50/20 p-2 rounded-lg text-black transition-all group/qcard relative"
    >
      {/* Floating Action Controls on Hover */}
      <div className="relative w-full">
        <div className="absolute -top-3.5 right-0 flex items-center gap-1 opacity-0 group-hover/qcard:opacity-100 transition-opacity no-print bg-white/95 backdrop-blur-xs border border-slate-200 shadow-xs rounded-md px-1.5 py-0.5 z-20">
          {/* Quick Add Image to Question */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUploadImages}
            className="hidden"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
            title="Attach images to this question"
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
            <span className="hidden sm:inline">+ Image</span>
          </button>

          <div className="h-3 w-px bg-slate-200" />

          {/* Block Size Stepper */}
          <div className="flex items-center gap-0.5 text-[9px]">
            <span className="text-slate-500 font-bold hidden sm:inline">Size:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBlockFontSize(fontSize - 1);
              }}
              className="w-4 h-4 flex items-center justify-center font-black bg-white hover:bg-slate-200 border border-slate-300 rounded text-slate-800 cursor-pointer shadow-2xs"
              title="Decrease Block Size (-1pt)"
            >
              -
            </button>
            <span className="font-mono font-bold px-0.5 text-slate-900 min-w-[26px] text-center">
              {fontSize}pt
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBlockFontSize(fontSize + 1);
              }}
              className="w-4 h-4 flex items-center justify-center font-black bg-white hover:bg-slate-200 border border-slate-300 rounded text-slate-800 cursor-pointer shadow-2xs"
              title="Increase Block Size (+1pt)"
            >
              +
            </button>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          {/* Quick Builder Studio Button */}
          <button
            type="button"
            onClick={() => onEditQuestion && onEditQuestion(qb)}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
            title="Open MathType & Diagram Studio for this question"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Continuous Full-Width Flow for Question Number, Statement & Marks */}
        {isEditingStatement ? (
          <div className="w-full my-1">
            <RichTextEditor
              autoFocus
              value={statementText}
              onChange={val => {
                setStatementText(val);
                onUpdateBlock && onUpdateBlock({
                  ...qb,
                  question: { ...q, rawText: val }
                });
              }}
              onImagePasted={url => {
                if (onUpdateBlock) {
                  const existing = q.imageUrls && q.imageUrls.length > 0 ? q.imageUrls : (q.imageUrl ? [q.imageUrl] : []);
                  const merged = [...existing, url];
                  onUpdateBlock({
                    ...qb,
                    question: {
                      ...q,
                      imageUrls: merged,
                      imageUrl: merged[0]
                    }
                  });
                }
              }}
              onBlur={() => setIsEditingStatement(false)}
              className="w-full"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsEditingStatement(false)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer shadow-2xs"
              >
                Done Editing
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingStatement(true)}
            className="w-full text-black font-semibold leading-relaxed hover:bg-sky-50/40 rounded px-1 -mx-1 py-0.5 cursor-pointer transition-all select-text break-words"
            title="Click to edit question text / Drop science formulas here"
          >
            {/* Question Number */}
            <span
              contentEditable
              suppressContentEditableWarning
              onClick={e => e.stopPropagation()}
              onBlur={e => {
                const val = parseInt(e.currentTarget.textContent?.replace(/\D/g, '') || '1', 10);
                onUpdateBlock && onUpdateBlock({
                  ...qb,
                  question: { ...q, questionNumber: isNaN(val) ? 1 : val }
                });
              }}
              className="font-black text-black mr-1.5 outline-hidden hover:bg-slate-200/60 rounded px-0.5 cursor-text select-text"
            >
              {q.questionNumber ? `${q.questionNumber}.` : 'Q.'}
            </span>

            {/* Statement Text with Inline Math */}
            <span className="font-semibold text-black">
              <MathTextRenderer text={q.rawText || ''} />
            </span>

            {/* If rawText does not embed an <img> tag but imageUrl/diagramUrl is present, render it here in the Question Diagram position */}
            {(!q.rawText || !/<img\s+/i.test(q.rawText)) && (q.imageUrl || q.diagramUrl || (q.imageUrls && q.imageUrls.length > 0)) && (
              <span className="block my-2 text-center">
                <img
                  src={resolveImageUrl(q.imageUrl || q.diagramUrl || q.imageUrls?.[0])}
                  alt="Question Diagram"
                  className="max-h-52 max-w-full rounded-md border border-slate-200 bg-white p-1 object-contain inline-block shadow-2xs"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.triedFallback) {
                      target.dataset.triedFallback = 'true';
                      const src = target.src;
                      if (src.includes('/api/assets/') && !src.includes('/raw/')) {
                        target.src = src.replace('/api/assets/', '/api/assets/raw/');
                      }
                    }
                  }}
                />
              </span>
            )}

            {/* Marks Badge Inline */}
            <span
              contentEditable
              suppressContentEditableWarning
              onClick={e => e.stopPropagation()}
              onBlur={e => {
                const text = e.currentTarget.textContent || '';
                const match = text.match(/\d+/);
                const marksVal = match ? parseInt(match[0], 10) : q.marks;
                onUpdateBlock && onUpdateBlock({
                  ...qb,
                  question: { ...q, marks: marksVal }
                });
              }}
              className="inline-block align-baseline text-[9.5px] font-bold text-sky-800 whitespace-nowrap ml-1.5 px-1 py-0.2 bg-sky-50 rounded border border-sky-300 outline-hidden cursor-text"
            >
              [{q.marks}{q.negativeMarks ? `, -${q.negativeMarks}` : ''}M]
            </span>
          </div>
        )}
      </div>

      {/* Render Attached Diagram SVG if present */}
      {q.diagramSvg && (
        <div className="my-2 p-2 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative group/diag">
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            dangerouslySetInnerHTML={{ __html: q.diagramSvg }}
          />
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onUpdateBlock && onUpdateBlock({
                ...qb,
                question: { ...q, diagramSvg: undefined }
              });
            }}
            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded text-[10px] opacity-0 group-hover/diag:opacity-100 transition-opacity cursor-pointer"
            title="Remove Diagram"
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Multiple Choice Options with direct editing, image attachments & drop support */}
      <div className="mt-1">
        <OptionLayoutRenderer
          options={q.options}
          layoutType={q.optionLayout || 'grid_2x2'}
          showAnswers={false}
          isEditable={true}
          onUpdateOptionText={(optId, newText) => {
            const updatedOptions = q.options.map(o => (o.id === optId ? { ...o, rawText: newText } : o));
            onUpdateBlock && onUpdateBlock({
              ...qb,
              question: { ...q, options: updatedOptions }
            });
          }}
          onUpdateOptionImage={(optId, newImgUrl) => {
            const updatedOptions = q.options.map(o => (o.id === optId ? { ...o, imageUrl: newImgUrl } : o));
            onUpdateBlock && onUpdateBlock({
              ...qb,
              question: { ...q, options: updatedOptions }
            });
          }}
          onRemoveOption={(optId) => {
            if ((q.options?.length || 0) <= 2) return;
            const updatedOptions = q.options.filter(o => o.id !== optId);
            onUpdateBlock && onUpdateBlock({
              ...qb,
              question: { ...q, options: updatedOptions }
            });
          }}
          onToggleCorrectOption={(optId) => {
            const updatedOptions = q.options.map(o => ({ ...o, isCorrect: o.id === optId }));
            onUpdateBlock && onUpdateBlock({
              ...qb,
              question: { ...q, options: updatedOptions }
            });
          }}
        />

        {/* Quick Add Option Action */}
        {q.options && q.options.length < 6 && (
          <div className="opacity-0 group-hover/qcard:opacity-100 transition-opacity pl-4 pt-1 no-print">
            <button
              type="button"
              onClick={handleAddOption}
              className="text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Option ({String.fromCharCode(97 + (q.options?.length || 0))})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   CARET-PRESERVING PARAGRAPH COMPONENT (NO BACKWARD TYPING BUG)
   ========================================================================= */
const EditableParagraph: React.FC<{
  block: ParagraphBlock;
  showFormattingMarks: boolean;
  onUpdateBlock?: (updated: DocumentBlock) => void;
  onInsertNextParagraph?: (currentBlockId: string) => void;
  onFocusPreviousBlock?: (currentBlockId: string) => void;
  onTextSelectionChange?: (formatting: Partial<FormattingState>) => void;
  getBorderStyle?: (borderType?: string, customBg?: string) => React.CSSProperties;
}> = ({
  block: p,
  showFormattingMarks,
  onUpdateBlock,
  onInsertNextParagraph,
  onFocusPreviousBlock,
  onTextSelectionChange,
  getBorderStyle
}) => {
  const elRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const primaryRun = p.runs?.[0];
  const f = primaryRun?.formatting || {};
  const fullText = p.runs?.map(r => r.text).join('') || '';

  // Synchronize initial text to DOM node without React reconciling children on every keystroke
  useEffect(() => {
    if (elRef.current && !isFocusedRef.current) {
      if (elRef.current.textContent !== fullText) {
        elRef.current.textContent = fullText;
      }
    }
  }, [fullText, p.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onInsertNextParagraph && onInsertNextParagraph(p.id);
    } else if (e.key === 'Backspace') {
      const content = elRef.current?.textContent || '';
      if (content.length === 0 || content === '\n') {
        e.preventDefault();
        onFocusPreviousBlock && onFocusPreviousBlock(p.id);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndent = p.indent || 0;
      const newIndent = e.shiftKey ? Math.max(0, currentIndent - 15) : currentIndent + 15;
      onUpdateBlock && onUpdateBlock({ ...p, indent: newIndent });
    }
  };

  const handleInput = () => {
    if (!elRef.current) return;
    const text = elRef.current.textContent || '';
    onUpdateBlock && onUpdateBlock({
      ...p,
      runs: [{ id: `run-${Date.now()}`, text, formatting: f }]
    });
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (!elRef.current) return;
    const text = elRef.current.textContent || '';
    onUpdateBlock && onUpdateBlock({
      ...p,
      runs: [{ id: `run-${Date.now()}`, text, formatting: f }]
    });
  };

  // Drop handler: drop formulas/symbols from Science Drawer directly into paragraph
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const eduData = e.dataTransfer.getData('application/eduforge-item');
      let inserted = '';
      if (eduData) {
        const item = JSON.parse(eduData);
        inserted = item.latex || item.symbol || item.value || item.formula || '';
      } else {
        inserted = e.dataTransfer.getData('text/plain') || '';
      }

      if (inserted && elRef.current && onUpdateBlock) {
        const current = elRef.current.textContent || '';
        const updated = current ? `${current} ${inserted}` : inserted;
        elRef.current.textContent = updated;
        onUpdateBlock({
          ...p,
          runs: [{ id: `run-${Date.now()}`, text: updated, formatting: f }]
        });
      }
    } catch (err) {
      console.error('Error dropping on paragraph:', err);
    }
  };

  // WordArt / Text shadow styling
  let textShadow: string | undefined = undefined;
  if (f.textEffect === 'shadow') textShadow = '2px 2px 4px rgba(0,0,0,0.4)';
  else if (f.textEffect === 'glow') textShadow = '0 0 8px rgba(56,189,248,0.8)';
  else if (f.textEffect === 'outline') textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
  else if (f.textEffect === 'reflection') textShadow = '0 8px 6px rgba(0,0,0,0.3)';

  // Underline / Strikethrough
  let textDecoration = 'none';
  if (f.underline && f.strikethrough) textDecoration = 'underline line-through';
  else if (f.underline) textDecoration = 'underline';
  else if (f.strikethrough) textDecoration = 'line-through';

  // List numbering or bullet rendering
  const bulletPrefix = p.listType === 'bullet'
    ? (p.listBulletStyle || '•')
    : p.listType === 'number'
    ? (p.listBulletStyle || '1.')
    : p.listType === 'alpha'
    ? (p.listBulletStyle || 'a.')
    : p.listType === 'roman'
    ? (p.listBulletStyle || 'i.')
    : null;

  const containerStyle: React.CSSProperties = {
    textAlign: p.alignment || 'left',
    lineHeight: p.lineSpacing || 1.25,
    paddingLeft: p.indent ? `${p.indent}px` : undefined,
    ...(getBorderStyle ? getBorderStyle(p.border, p.backgroundColor) : {})
  };

  return (
    <div
      style={containerStyle}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
      className="my-1 text-black group/para relative flex items-baseline"
    >
      {/* List bullet or numbering prefix */}
      {bulletPrefix && (
        <span
          className="mr-2 font-black select-none text-black shrink-0"
          style={{
            fontFamily: f.fontFamily || undefined,
            fontSize: f.fontSize ? `${f.fontSize}pt` : '10.5pt'
          }}
        >
          {bulletPrefix}
        </span>
      )}

      {/* Editable Text Area (Caret moves naturally left-to-right) */}
      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        data-block-id={p.id}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={async (e) => {
          const clipboardData = e.clipboardData;
          if (!clipboardData) return;
          const items = Array.from(clipboardData.items || []);
          const imageItems = items.filter(item => item.type.startsWith('image/'));
          if (imageItems.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            for (const item of imageItems) {
              const file = item.getAsFile();
              if (file) {
                try {
                  const res = await api.uploadImage(file);
                  if (res.url && onUpdateBlock) {
                    onUpdateBlock({
                      ...p,
                      runs: [
                        ...(p.runs || []),
                        {
                          id: `r-${Date.now()}`,
                          text: ` [Image: ${res.url}] `
                        }
                      ]
                    });
                  }
                } catch (err) {
                  console.error('Error pasting image in paragraph:', err);
                }
              }
            }
          }
        }}
        onSelect={() => {
          onTextSelectionChange && onTextSelectionChange({
            ...f,
            alignment: p.alignment,
            lineSpacing: p.lineSpacing,
            listType: p.listType,
            indent: p.indent,
            styleName: p.styleName
          });
        }}
        style={{
          fontWeight: f.bold ? 'bold' : 'normal',
          fontStyle: f.italic ? 'italic' : 'normal',
          textDecoration,
          textDecorationStyle: f.underlineStyle === 'single' || !f.underlineStyle ? 'solid' : f.underlineStyle,
          textDecorationColor: f.underlineColor || undefined,
          verticalAlign: f.superscript ? 'super' : f.subscript ? 'sub' : 'baseline',
          fontSize: f.superscript || f.subscript ? '0.75em' : f.fontSize ? `${f.fontSize}pt` : '10.5pt',
          color: f.color || '#000000',
          backgroundColor: f.backgroundColor && f.backgroundColor !== 'transparent' ? f.backgroundColor : undefined,
          fontFamily: f.fontFamily || undefined,
          border: f.characterBorder ? '1px solid #94a3b8' : undefined,
          padding: f.characterBorder ? '1px 3px' : undefined,
          textShadow,
          minWidth: '10px'
        }}
        className="flex-1 outline-hidden cursor-text select-text empty:before:content-['Type_text_here_or_drop_from_science_library...'] empty:before:text-slate-400 empty:before:italic"
      />

      {/* Formatting Mark: Pilcrow ¶ */}
      {showFormattingMarks && (
        <span className="text-slate-400 select-none ml-0.5 text-xs font-mono">
          ¶
        </span>
      )}
    </div>
  );
};

/* =========================================================================
   CARET-PRESERVING HEADING COMPONENT
   ========================================================================= */
const EditableHeading: React.FC<{
  block: HeadingBlock;
  showFormattingMarks: boolean;
  onUpdateBlock?: (updated: DocumentBlock) => void;
  onInsertNextParagraph?: (currentBlockId: string) => void;
  getBorderStyle?: (borderType?: string, customBg?: string) => React.CSSProperties;
}> = ({ block: h, showFormattingMarks, onUpdateBlock, onInsertNextParagraph, getBorderStyle }) => {
  const elRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const fullText = h.runs?.map(r => r.text).join('') || '';
  const f = h.runs?.[0]?.formatting || {};
  const sizeClass = h.level === 1 ? 'text-lg font-black' : h.level === 2 ? 'text-base font-bold' : 'text-sm font-bold';

  useEffect(() => {
    if (elRef.current && !isFocusedRef.current) {
      if (elRef.current.textContent !== fullText) {
        elRef.current.textContent = fullText;
      }
    }
  }, [fullText, h.id]);

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (!elRef.current) return;
    const text = elRef.current.textContent || '';
    onUpdateBlock && onUpdateBlock({
      ...h,
      runs: [{ id: `run-${Date.now()}`, text, formatting: f }]
    });
  };

  return (
    <div
      style={{
        textAlign: h.alignment || 'left',
        ...(getBorderStyle ? getBorderStyle(h.border, h.backgroundColor) : {})
      }}
      className="my-2 text-black flex items-baseline"
    >
      <div
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        data-block-id={h.id}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={handleBlur}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onInsertNextParagraph && onInsertNextParagraph(h.id);
          }
        }}
        onInput={() => {
          if (!elRef.current) return;
          const text = elRef.current.textContent || '';
          onUpdateBlock && onUpdateBlock({
            ...h,
            runs: [{ id: `run-${Date.now()}`, text, formatting: f }]
          });
        }}
        style={{
          fontFamily: f.fontFamily || undefined,
          fontSize: f.fontSize ? `${f.fontSize}pt` : undefined,
          color: f.color || '#000000'
        }}
        className={`${sizeClass} flex-1 outline-hidden cursor-text select-text empty:before:content-['Heading_text...'] empty:before:text-slate-400`}
      />

      {showFormattingMarks && (
        <span className="text-slate-400 select-none ml-1 text-xs font-mono">
          ¶
        </span>
      )}
    </div>
  );
};

function renderBlockContent(
  block: DocumentBlock,
  isSelected: boolean,
  showFormattingMarks: boolean,
  onUpdateBlock?: (updated: DocumentBlock) => void,
  onInsertNextParagraph?: (currentBlockId: string) => void,
  onFocusPreviousBlock?: (currentBlockId: string) => void,
  onEditEquation?: (eq: EquationBlock) => void,
  onEditQuestion?: (q: QuestionBlock) => void,
  onTextSelectionChange?: (formatting: Partial<FormattingState>) => void,
  getBorderStyle?: (borderType?: string, customBg?: string) => React.CSSProperties
) {
  switch (block.type) {
    case 'question':
      return (
        <QuestionBlockItem
          qb={block as QuestionBlock}
          onUpdateBlock={onUpdateBlock}
          onEditQuestion={onEditQuestion}
        />
      );

    case 'paragraph':
      return (
        <EditableParagraph
          block={block as ParagraphBlock}
          showFormattingMarks={showFormattingMarks}
          onUpdateBlock={onUpdateBlock}
          onInsertNextParagraph={onInsertNextParagraph}
          onFocusPreviousBlock={onFocusPreviousBlock}
          onTextSelectionChange={onTextSelectionChange}
          getBorderStyle={getBorderStyle}
        />
      );

    case 'heading':
      return (
        <EditableHeading
          block={block as HeadingBlock}
          showFormattingMarks={showFormattingMarks}
          onUpdateBlock={onUpdateBlock}
          onInsertNextParagraph={onInsertNextParagraph}
          getBorderStyle={getBorderStyle}
        />
      );

    case 'section_header': {
      const sh = block as SectionHeaderBlock;
      return (
        <div className="my-3 text-center border-b-2 border-black pb-1">
          <h3
            contentEditable
            suppressContentEditableWarning
            onBlur={e => {
              const text = e.currentTarget.textContent || '';
              onUpdateBlock && onUpdateBlock({
                ...sh,
                title: text
              });
            }}
            className="text-base font-black tracking-wider uppercase text-black outline-hidden"
          >
            {sh.title || 'SECTION'}
          </h3>
          {sh.instructions && (
            <p
              contentEditable
              suppressContentEditableWarning
              onBlur={e => {
                const text = e.currentTarget.textContent || '';
                onUpdateBlock && onUpdateBlock({
                  ...sh,
                  instructions: text
                });
              }}
              className="text-xs italic text-slate-700 outline-hidden mt-0.5"
            >
              {sh.instructions}
            </p>
          )}
        </div>
      );
    }

    case 'equation': {
      const eq = block as EquationBlock;
      return (
        <div
          style={{ fontSize: eq.fontSize ? `${eq.fontSize}pt` : undefined }}
          onDoubleClick={() => onEditEquation && onEditEquation(eq)}
          className="my-2 cursor-pointer p-1 rounded hover:bg-sky-50/50 border border-transparent hover:border-sky-300 transition-all text-black"
          title="Double-click to edit equation in Math AST editor"
        >
          <KaTeXRenderer math={eq.rawLatex || 'E = mc^2'} block={eq.displayMode !== 'inline'} />
        </div>
      );
    }

    case 'table': {
      const tb = block as TableBlock;
      return (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-xs">
            <tbody>
              {tb.cells.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cell.id || `${rIdx}-${cIdx}`}
                      style={{
                        backgroundColor: cell.backgroundColor || (rIdx === 0 ? '#f8fafc' : '#ffffff'),
                        textAlign: cell.textAlign || 'left',
                        padding: cell.padding ? `${cell.padding}px` : '6px 8px'
                      }}
                      className="border border-slate-300"
                    >
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => {
                          const val = e.currentTarget.textContent || '';
                          const newCells = JSON.parse(JSON.stringify(tb.cells));
                          newCells[rIdx][cIdx].content = [
                            {
                              id: `p-${Date.now()}`,
                              type: 'paragraph',
                              runs: [{ id: `r-${Date.now()}`, text: val }]
                            }
                          ];
                          onUpdateBlock && onUpdateBlock({ ...tb, cells: newCells });
                        }}
                        className="outline-hidden min-h-[18px] cursor-text"
                      >
                        {cell.content?.[0]?.type === 'paragraph'
                          ? (cell.content[0] as ParagraphBlock).runs?.map(r => r.text).join('') || `Cell ${rIdx + 1},${cIdx + 1}`
                          : `Cell`}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'image': {
      const imgBlock = block as ImageBlock;
      let imgSrc = imgBlock.src || '';
      if (imgSrc && !imgSrc.startsWith('http://') && !imgSrc.startsWith('https://') && !imgSrc.startsWith('data:')) {
        imgSrc = `http://localhost:5001${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
      }
      return (
        <div className="my-3 flex flex-col items-center group/img relative">
          <img
            src={imgSrc}
            alt={imgBlock.alt || 'Pasted image'}
            style={{
              width: imgBlock.width ? `${imgBlock.width}px` : '100%',
              maxWidth: '100%',
              maxHeight: '500px',
              objectFit: 'contain'
            }}
            className="rounded shadow-xs border border-slate-200"
            onError={(e) => {
              const target = e.currentTarget;
              if (imgBlock.src && !target.dataset.tried) {
                target.dataset.tried = 'true';
                if (!imgBlock.src.startsWith('http')) {
                  target.src = `http://localhost:5001${imgBlock.src.startsWith('/') ? '' : '/'}${imgBlock.src}`;
                }
              }
            }}
          />
          {imgBlock.caption && (
            <span className="text-[10px] text-slate-500 italic mt-1">{imgBlock.caption}</span>
          )}
        </div>
      );
    }

    case 'shape': {
      const sb = block as ShapeBlock;
      return (
        <div className="my-3 flex justify-center">
          <div
            style={{
              width: `${sb.width || 140}px`,
              height: `${sb.height || 70}px`,
              backgroundColor: sb.fill || '#e0f2fe',
              borderColor: sb.stroke || '#0284c7',
              borderWidth: `${sb.strokeWidth || 2}px`,
              borderRadius: sb.shapeType === 'circle' ? '9999px' : '6px'
            }}
            className="border flex items-center justify-center text-xs font-bold text-sky-900 shadow-xs"
          >
            {sb.labelText || sb.shapeType.toUpperCase()}
          </div>
        </div>
      );
    }

    case 'wordart': {
      const wa = block as WordArtBlock;
      return (
        <div className="my-3 text-center">
          <span
            style={{ fontSize: `${wa.fontSize || 22}pt`, fontFamily: wa.fontFamily || undefined }}
            className={`wordart-${wa.style} inline-block`}
          >
            {wa.text}
          </span>
        </div>
      );
    }

    case 'horizontal_line': {
      return <hr className="my-3 border-t border-slate-300" />;
    }

    case 'page_break': {
      return (
        <div className="my-2 flex items-center gap-2 text-slate-400 no-print">
          <div className="flex-1 border-t border-dashed border-slate-300" />
          <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded">
            --- Page Break ---
          </span>
          <div className="flex-1 border-t border-dashed border-slate-300" />
        </div>
      );
    }

    default:
      return null;
  }
}
