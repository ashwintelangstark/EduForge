import React, { useState } from 'react';
import { api } from '../services/api.js';
import { DocumentModel, DocumentBlock, QuestionBlock, EquationBlock, Question } from '@eduforge/shared';
import { paginateDocument, PageLayout } from './PaginationEngine.js';
import { BlockRenderer } from './BlockRenderer.js';
import { PaperHeader } from '../paper/PaperHeader.js';
import { FormattingState } from './EditorRibbon.js';

interface A4CanvasProps {
  document: DocumentModel;
  zoom?: number; // 50 to 200
  showMarginGuides?: boolean;
  showColumnGuides?: boolean;
  showFormattingMarks?: boolean;
  isFormatPainterActive?: boolean;
  printPreviewMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onUpdateBlock?: (sectionId: string, block: DocumentBlock) => void;
  onDeleteBlock?: (sectionId: string, blockId: string) => void;
  onDuplicateBlock?: (sectionId: string, blockId: string) => void;
  onMoveBlock?: (sectionId: string, blockId: string, direction: 'up' | 'down') => void;
  onReorderBlock?: (secId: string, sourceBlockId: string, targetBlockId?: string, targetColumn?: 0 | 1, position?: 'before' | 'after') => void;
  onToggleBlockColumn?: (secId: string, blockId: string, targetCol?: 0 | 1) => void;
  onInsertNextParagraph?: (currentBlockId: string) => void;
  onFocusPreviousBlock?: (currentBlockId: string) => void;
  onApplyFormatPainter?: (targetBlock: DocumentBlock) => void;
  onEditQuestion?: (question: QuestionBlock) => void;
  onEditEquation?: (eq: EquationBlock) => void;
  onEditHeader?: () => void;
  onUpdateMetadata?: (metadata: DocumentModel['metadata']) => void;
  onTextSelectionChange?: (formatting: Partial<FormattingState>) => void;
  onAddBlankParagraph?: () => void;
  onDropQuestion?: (question: Question, targetBlockId?: string, targetColumn?: 0 | 1) => void;
  onDropItemOnSection?: (sectionId: string, item: any) => void;
}

export const A4Canvas: React.FC<A4CanvasProps> = ({
  document: doc,
  zoom = 100,
  showMarginGuides = false,
  showColumnGuides = false,
  showFormattingMarks = false,
  isFormatPainterActive = false,
  printPreviewMode = false,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onReorderBlock,
  onToggleBlockColumn,
  onInsertNextParagraph,
  onFocusPreviousBlock,
  onApplyFormatPainter,
  onEditQuestion,
  onEditEquation,
  onEditHeader,
  onUpdateMetadata,
  onTextSelectionChange,
  onAddBlankParagraph,
  onDropQuestion,
  onDropItemOnSection
}) => {
  const pages: PageLayout[] = React.useMemo(() => paginateDocument(doc), [doc]);
  const isTwoColumn = false; // Always 1 Single Full A4 Paper Layout
  const margins = doc.settings.margins || { top: 15, bottom: 15, left: 15, right: 15 };

  // Drag and drop state for live interactive movement between left/right sides
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    blockId?: string;
    colIdx?: number;
    position: 'before' | 'after';
  } | null>(null);

  // Convert mm to CSS px (1mm = 3.7795px)
  const topPx = Math.round(margins.top * 3.7795);
  const bottomPx = Math.round(margins.bottom * 3.7795);
  const leftPx = Math.round(margins.left * 3.7795);
  const rightPx = Math.round(margins.right * 3.7795);
  const gapPx = Math.round((doc.settings.columnGap || 8) * 3.7795);

  const handleContainerDrop = (e: React.DragEvent, targetBlockId?: string, targetCol?: 0 | 1) => {
    e.preventDefault();
    try {
      // 1. Moving an existing block across columns / reordering
      const blockMoveId = e.dataTransfer.getData('application/eduforge-block-id');
      const blockMoveSecId = e.dataTransfer.getData('application/eduforge-section-id');
      if (blockMoveId) {
        const position = dropTarget?.position || 'after';
        onReorderBlock && onReorderBlock(
          blockMoveSecId || doc.sections[0]?.id || 'sec-0',
          blockMoveId,
          targetBlockId,
          targetCol,
          position
        );
        setDraggedBlockId(null);
        setDropTarget(null);
        return;
      }

      // 2. Dropping a question from Science Drawer / Question Bank
      const eduforgeData = e.dataTransfer.getData('application/eduforge-item');
      if (eduforgeData) {
        const item = JSON.parse(eduforgeData);
        if (item.category === 'questions' && item.questionData && onDropQuestion) {
          onDropQuestion(item.questionData, targetBlockId, targetCol);
          setDraggedBlockId(null);
          setDropTarget(null);
          return;
        } else if (onDropItemOnSection) {
          const targetSecId = doc.sections[0]?.id || 'sec-0';
          onDropItemOnSection(targetSecId, item);
          setDraggedBlockId(null);
          setDropTarget(null);
          return;
        }
      }

      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed.type === 'question' && parsed.data && onDropQuestion) {
          onDropQuestion(parsed.data, targetBlockId, targetCol);
        }
      }
    } catch (err) {
      console.error('Failed to parse dropped item:', err);
    }
    setDraggedBlockId(null);
    setDropTarget(null);
  };

  // Paste handler for pasting images directly onto the paper canvas sheet
  const handlePagePaste = async (e: React.ClipboardEvent) => {
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
            if (res.url && onDropItemOnSection) {
              const targetSecId = doc.sections[0]?.id || 'sec-0';
              onDropItemOnSection(targetSecId, {
                id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                type: 'image',
                src: res.url,
                alt: file.name || 'Pasted image',
                width: 550
              });
            }
          } catch (err) {
            console.error('Error pasting image onto canvas:', err);
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8 w-full select-text">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          style={{
            width: '794px',
            minHeight: '1123px',
            height: '1123px',
            paddingTop: `${topPx}px`,
            paddingBottom: `${bottomPx}px`,
            paddingLeft: `${leftPx}px`,
            paddingRight: `${rightPx}px`,
            fontFamily: doc.settings.defaultFont || 'Inter',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            marginBottom: zoom !== 100 ? `${1123 * (zoom / 100 - 1)}px` : undefined
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => handleContainerDrop(e)}
          onPaste={handlePagePaste}
          onClick={(e) => {
            // If user clicks on the empty page area, create/focus a new paragraph
            if (e.target === e.currentTarget && onAddBlankParagraph) {
              onAddBlankParagraph();
            }
          }}
          className={`page-sheet relative bg-white text-slate-900 shadow-page rounded-xs flex flex-col justify-between overflow-hidden transition-all ${
            printPreviewMode ? 'border-none' : 'border border-slate-200 hover:border-slate-300'
          }`}
        >
          {/* Margin Guides (Overlay) */}
          {showMarginGuides && !printPreviewMode && (
            <div
              style={{
                top: `${topPx}px`,
                bottom: `${bottomPx}px`,
                left: `${leftPx}px`,
                right: `${rightPx}px`
              }}
              className="absolute pointer-events-none border border-dashed border-sky-400/40 z-30"
            />
          )}

          {/* Page Top Area */}
          <div className="w-full flex-1 flex flex-col">
            {/* Header (First page only) */}
            {page.isFirstPage && (
              <PaperHeader
                metadata={doc.metadata}
                onEditMetadata={onEditHeader}
                onUpdateMetadata={onUpdateMetadata}
              />
            )}

            {/* Columns Content Container */}
            <div
              style={{ gap: `${gapPx}px` }}
              className={`flex-1 ${
                isTwoColumn ? 'grid grid-cols-2 relative' : 'flex flex-col'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => handleContainerDrop(e)}
              onClick={(e) => {
                if (e.target === e.currentTarget && onAddBlankParagraph) {
                  onAddBlankParagraph();
                }
              }}
            >
              {/* Column divider line */}
              {isTwoColumn && (doc.settings.columnDivider || showColumnGuides) && (
                <div
                  style={{ left: '50%' }}
                  className={`absolute top-0 bottom-0 w-px ${
                    doc.settings.columnDivider ? 'bg-slate-300' : 'bg-dashed bg-sky-300/60'
                  } -translate-x-1/2 pointer-events-none z-10`}
                />
              )}

              {/* Render Columns */}
              {page.columns.map((col, colIdx) => {
                const isColDropActive = dropTarget?.colIdx === colIdx && !dropTarget?.blockId;
                return (
                  <div
                    key={colIdx}
                    className={`flex flex-col gap-1 min-w-0 flex-1 transition-colors rounded p-1 ${
                      isColDropActive ? 'bg-sky-50/50 border border-dashed border-sky-400' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (!dropTarget || dropTarget.colIdx !== colIdx || dropTarget.blockId) {
                        setDropTarget({ colIdx, position: 'after' });
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleContainerDrop(e, undefined, colIdx as 0 | 1);
                    }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget && onAddBlankParagraph) {
                        onAddBlankParagraph();
                      }
                    }}
                  >
                    {col.blocks.length === 0 && isTwoColumn && colIdx === 1 && (
                      <div
                        className={`h-full min-h-[140px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                          isColDropActive
                            ? 'border-sky-500 bg-sky-100/40 text-sky-700'
                            : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/50 text-slate-400'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDropTarget({ colIdx: 1, position: 'after' });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContainerDrop(e, undefined, 1);
                        }}
                      >
                        <span className="text-xs font-semibold">Right Column (Drop zone)</span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Drag questions here or let left side fill naturally
                        </span>
                      </div>
                    )}

                    {col.blocks.map((item, bIdx) => {
                      const isDraggingThis = draggedBlockId === item.block.id;
                      const isDropBefore = dropTarget?.blockId === item.block.id && dropTarget.position === 'before';
                      const isDropAfter = dropTarget?.blockId === item.block.id && dropTarget.position === 'after';

                      return (
                        <div
                          key={item.block.id || bIdx}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/eduforge-block-id', item.block.id);
                            e.dataTransfer.setData('application/eduforge-section-id', item.sectionId);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedBlockId(item.block.id);
                          }}
                          onDragEnd={() => {
                            setDraggedBlockId(null);
                            setDropTarget(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            const rect = e.currentTarget.getBoundingClientRect();
                            const isTopHalf = e.clientY < rect.top + rect.height / 2;
                            setDropTarget({
                              blockId: item.block.id,
                              colIdx: colIdx,
                              position: isTopHalf ? 'before' : 'after'
                            });
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleContainerDrop(e, item.block.id, colIdx as 0 | 1);
                          }}
                          className={`relative transition-all ${
                            isDraggingThis ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                          }`}
                        >
                          {/* Drop Indicator (Before) */}
                          {isDropBefore && (
                            <div className="h-1 bg-sky-500 rounded-full my-0.5 shadow-md shadow-sky-400/50 animate-pulse pointer-events-none" />
                          )}

                          <BlockRenderer
                            block={item.block}
                            sectionId={item.sectionId}
                            isSelected={selectedBlockId === item.block.id}
                            isTwoColumn={isTwoColumn}
                            currentColumnIndex={colIdx}
                            isFormatPainterActive={isFormatPainterActive}
                            showFormattingMarks={showFormattingMarks}
                            onSelect={() => onSelectBlock && onSelectBlock(item.block.id)}
                            onUpdateBlock={updated => onUpdateBlock && onUpdateBlock(item.sectionId, updated)}
                            onDeleteBlock={() => onDeleteBlock && onDeleteBlock(item.sectionId, item.block.id)}
                            onDuplicateBlock={() => onDuplicateBlock && onDuplicateBlock(item.sectionId, item.block.id)}
                            onMoveUp={() => onMoveBlock && onMoveBlock(item.sectionId, item.block.id, 'up')}
                            onMoveDown={() => onMoveBlock && onMoveBlock(item.sectionId, item.block.id, 'down')}
                            onToggleColumn={(targetCol) => onToggleBlockColumn && onToggleBlockColumn(item.sectionId, item.block.id, targetCol)}
                            onInsertNextParagraph={onInsertNextParagraph}
                            onFocusPreviousBlock={onFocusPreviousBlock}
                            onApplyFormatPainter={onApplyFormatPainter}
                            onEditQuestion={q => onEditQuestion && onEditQuestion(q)}
                            onEditEquation={eq => onEditEquation && onEditEquation(eq)}
                            onTextSelectionChange={onTextSelectionChange}
                          />

                          {/* Drop Indicator (After) */}
                          {isDropAfter && (
                            <div className="h-1 bg-sky-500 rounded-full my-0.5 shadow-md shadow-sky-400/50 animate-pulse pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Footer */}
          {doc.settings.showPageNumbers && (
            <div className="w-full pt-3 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[9pt] text-slate-500 font-mono select-none">
              <span>{doc.title}</span>
              <span>
                Page {page.pageNumber} of {pages.length}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
