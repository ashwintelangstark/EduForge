import React from 'react';
import { MathTextRenderer, resolveImageUrl, stripQuestionCode } from '../equation/MathTextRenderer.js';
import { Check } from 'lucide-react';

export interface CollegeExamQuestion {
  id: string | number;
  questionNumber?: number;
  rawText?: string;
  content?: any;
  options?: any[];
  correctOption?: string;
  correctAnswer?: string;
  marks?: number;
  negativeMarks?: number;
  diagramSvg?: string;
  diagramUrl?: string;
  imageUrl?: string;
  explanationText?: string;
  solution?: string;
  sectionName?: string;
  sectionId?: string;
  subject?: string;
}

export interface CollegeExamSection {
  id: string;
  name: string;
  instructions?: string;
  questions?: CollegeExamQuestion[];
}

export interface CollegeExamPaperProps {
  instituteName?: string;
  examTitle?: string;
  subjectNames?: string;
  standard?: string;
  paperSet?: string;
  date?: string;
  duration?: string | number;
  totalMarks?: number;
  sections: CollegeExamSection[];
  allQuestions: CollegeExamQuestion[];
  isAnswerKeyMode?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
  columnLayout?: '2-column' | '1-column';
  fontSize?: 'compact' | 'normal' | 'spacious';
  className?: string;
  onEditInstituteName?: (name: string) => void;
}

export const CollegeExamPaper: React.FC<CollegeExamPaperProps> = ({
  instituteName = 'NLE SOCIETYS Dr RB PATIL MAHESH PU COLLEGE',
  examTitle = 'NEET WEEKLY TEST (PCBM) PUC 1',
  subjectNames = 'Biology, Physics, Chemistry, Mathematics',
  standard = '11 / PUC',
  paperSet = '1',
  date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
  duration = '3H:00M',
  totalMarks = 720,
  sections = [],
  allQuestions = [],
  isAnswerKeyMode = false,
  showWatermark = true,
  watermarkText = 'Test',
  columnLayout = '2-column',
  fontSize = 'compact',
  className = ''
}) => {
  // Format duration
  const formattedDuration = typeof duration === 'number'
    ? (duration >= 60 ? `${Math.floor(duration / 60)}H:${String(duration % 60).padStart(2, '0')}M` : `${duration} Mins`)
    : String(duration);

  // Group questions by section
  const sectionGroups = React.useMemo(() => {
    if (sections.length === 0) {
      return [{
        id: 'sec-all',
        name: `${subjectNames.split(',')[0] || 'General'} - Section A (MCQ)`,
        instructions: undefined as string | undefined,
        questions: allQuestions
      }];
    }

    return sections.map((sec, sIdx) => {
      const secQs = allQuestions.filter(q => q.sectionId === sec.id || q.sectionName === sec.name);
      return {
        id: sec.id || `sec-${sIdx}`,
        name: sec.name || `Section ${String.fromCharCode(65 + sIdx)} (MCQ)`,
        instructions: sec.instructions,
        questions: secQs.length > 0 ? secQs : (sections.length === 1 ? allQuestions : [])
      };
    });
  }, [sections, allQuestions, subjectNames]);

  return (
    <div className={`college-exam-sheet relative bg-white text-black font-sans leading-snug ${className}`} style={{ minHeight: '100%' }}>
      {/* Print Specific CSS Rules */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 10mm 10mm;
          }
          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .college-exam-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }
          .exam-columns-container {
            column-count: ${columnLayout === '2-column' ? 2 : 1} !important;
            column-gap: 20px !important;
            column-rule: ${columnLayout === '2-column' ? '1px solid #94a3b8' : 'none'} !important;
          }
          .exam-q-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 8px !important;
          }
          .exam-sec-divider {
            break-after: avoid !important;
            page-break-after: avoid !important;
            margin-top: 10px !important;
            margin-bottom: 6px !important;
          }
          .exam-master-key-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }

        /* Screen 2-column styles */
        .exam-columns-container {
          column-count: ${columnLayout === '2-column' ? 2 : 1};
          column-gap: 24px;
          column-rule: ${columnLayout === '2-column' ? '1px solid #cbd5e1' : 'none'};
        }
        .exam-q-block {
          break-inside: avoid;
          page-break-inside: avoid;
          display: inline-block;
          width: 100%;
        }
        .exam-sec-divider {
          break-after: avoid;
          page-break-after: avoid;
          display: inline-block;
          width: 100%;
        }
      `}</style>

      {/* Subtle Diagonal Watermark */}
      {showWatermark && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center select-none z-0">
          <div
            className="text-[120px] font-black text-slate-300/40 uppercase tracking-widest rotate-[-35deg] select-none"
            style={{ opacity: 0.15, userSelect: 'none' }}
          >
            {watermarkText}
          </div>
        </div>
      )}

      <div className="relative z-10 p-4 sm:p-6 text-black">
        {/* ========================================================================= */}
        {/* 1. AUTHENTIC COLLEGE EXAM HEADER (Border Box with 2-Column Metadata)      */}
        {/* ========================================================================= */}
        <div className="border border-black p-3 mb-3 bg-white">
          {/* Institution / College Name (Large Bold Centered) */}
          <div className="text-center pb-2 border-b border-black">
            <h1 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight text-black font-sans">
              {instituteName}
            </h1>
          </div>

          {/* Exam Title & Metadata Grid */}
          <div className="pt-2 grid grid-cols-2 gap-x-4 text-[11px] sm:text-xs font-semibold leading-tight text-black">
            {/* Left Column */}
            <div className="space-y-1">
              <div className="flex">
                <span className="w-20 font-bold shrink-0">Subject</span>
                <span className="font-bold">:</span>
                <span className="ml-1.5 font-medium truncate">{subjectNames}</span>
              </div>
              <div className="flex">
                <span className="w-20 font-bold shrink-0">Standard</span>
                <span className="font-bold">:</span>
                <span className="ml-1.5 font-medium">{standard}</span>
              </div>
              <div className="flex">
                <span className="w-20 font-bold shrink-0">Total Mark</span>
                <span className="font-bold">:</span>
                <span className="ml-1.5 font-bold">{totalMarks}</span>
              </div>
            </div>

            {/* Right Column with Exam Title */}
            <div className="space-y-1">
              <div className="text-center sm:text-left font-black text-xs sm:text-sm uppercase tracking-wide pb-0.5">
                {examTitle}
              </div>
              <div className="flex justify-between sm:justify-start gap-4">
                <div className="flex">
                  <span className="w-18 font-bold shrink-0">Paper Set</span>
                  <span className="font-bold">:</span>
                  <span className="ml-1.5 font-bold">{paperSet}</span>
                </div>
                <div className="flex">
                  <span className="w-12 font-bold shrink-0">Date</span>
                  <span className="font-bold">:</span>
                  <span className="ml-1.5 font-medium">{date}</span>
                </div>
              </div>
              <div className="flex">
                <span className="w-18 font-bold shrink-0">Time</span>
                <span className="font-bold">:</span>
                <span className="ml-1.5 font-medium">{formattedDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DENSE 2-COLUMN QUESTION BODY (High-Efficiency Paper Saver)             */}
        {/* ========================================================================= */}
        <div className="exam-columns-container text-[11px] sm:text-[11.5px] leading-snug">
          {sectionGroups.map((sec, sIdx) => {
            const secQuestions = sec.questions && sec.questions.length > 0
              ? sec.questions
              : allQuestions;

            return (
              <React.Fragment key={sec.id || sIdx}>
                {/* Section Header with Centered Border Box */}
                <div className="exam-sec-divider my-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="border-t border-dotted border-slate-400 flex-1 max-w-[25%]"></span>
                    <span className="border border-black px-2.5 py-0.5 font-bold text-xs uppercase bg-white shadow-2xs">
                      {sec.name}
                    </span>
                    <span className="border-t border-dotted border-slate-400 flex-1 max-w-[25%]"></span>
                  </div>
                  {sec.instructions && (
                    <p className="text-[10px] italic text-slate-600 mt-0.5">{sec.instructions}</p>
                  )}
                </div>

                {/* Questions in this section */}
                {secQuestions.map((q, qIdx) => {
                  const qNum = q.questionNumber || (allQuestions.indexOf(q) >= 0 ? allQuestions.indexOf(q) + 1 : qIdx + 1);
                  const targetOptKey = (q.correctOption || q.correctAnswer || (q as any).correct_option || (q as any).correct_answer || 'A').toString().toUpperCase().trim();

                  // Options extraction
                  const rawOpts = q.options && Array.isArray(q.options) && q.options.length > 0
                    ? q.options
                    : [
                        { key: 'A', rawText: 'Option A' },
                        { key: 'B', rawText: 'Option B' },
                        { key: 'C', rawText: 'Option C' },
                        { key: 'D', rawText: 'Option D' }
                      ];

                  // Question Text & Diagrams
                  const rawTextStr = stripQuestionCode(q.rawText || (typeof q.content === 'string' ? q.content : '') || '');
                  const hasEmbeddedImg = /<img\s+/i.test(rawTextStr);

                  // Diagrams & Images
                  const contentArr = Array.isArray(q.content) ? (q.content as any[]) : [];
                  const qSvg = q.diagramSvg || (q as any).diagram_svg || contentArr.find((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)?.diagramSvg || contentArr.find((b: any) => b.type === 'diagram' || b.diagramSvg || b.svg)?.svg;
                  const qImg = q.imageUrl || q.diagramUrl || contentArr.find((b: any) => b.type === 'image' || b.imageUrl || b.url)?.url;

                  // Determine optimal option layout (2x2 vs 1-col vs inline 4)
                  const maxOptLen = Math.max(...rawOpts.map(o => String(o.rawText || o.text || o.label || '').length));
                  const isUltraShort = maxOptLen <= 10 && rawOpts.length === 4;
                  const isShort2x2 = maxOptLen <= 26 && rawOpts.length === 4;

                  return (
                    <div key={q.id || qIdx} className="exam-q-block mb-3.5 pl-0.5 text-black">
                      {/* Question Text */}
                      <div className="flex items-start gap-1.5 font-normal">
                        <span className="font-bold shrink-0 select-none">({qNum})</span>
                        <div className="flex-1 font-medium leading-relaxed">
                          <MathTextRenderer text={rawTextStr || 'Question Statement'} />
                        </div>
                      </div>

                      {/* Embedded Diagram / Image (Only if rawText does not already embed an image) */}
                      {!hasEmbeddedImg && (qSvg || (qImg && qImg !== 'undefined' && qImg !== 'null' && String(qImg).trim() !== '')) && (
                        <div className="my-1.5 flex justify-center max-h-36 overflow-hidden">
                          {qSvg ? (
                            <div
                              className="max-h-32 max-w-full flex items-center justify-center scale-90"
                              dangerouslySetInnerHTML={{ __html: qSvg }}
                            />
                          ) : (
                            <img
                              src={resolveImageUrl(qImg)}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.parentElement) e.currentTarget.parentElement.style.display = 'none';
                              }}
                              className="max-h-32 max-w-full object-contain border border-slate-300 p-1"
                            />
                          )}
                        </div>
                      )}

                      {/* MCQ Options with College Exam Format */}
                      <div className="mt-1 pl-4">
                        {isUltraShort ? (
                          // Ultra-compact 4 in one line: (A) ... (B) ... (C) ... (D) ...
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            {rawOpts.map((opt, oIdx) => {
                              const key = (opt.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                              const isCorrect = isAnswerKeyMode && (key === targetOptKey || opt.isCorrect);
                              const optText = opt.rawText || opt.text || opt.label || '';

                              return (
                                <div key={opt.id || oIdx} className={`flex items-baseline gap-1 ${isCorrect ? 'font-bold text-emerald-800' : ''}`}>
                                  <span className="font-bold">({key})</span>
                                  <MathTextRenderer text={optText} />
                                  {isCorrect && <Check className="inline w-3 h-3 text-emerald-600 stroke-[3] ml-0.5" />}
                                </div>
                              );
                            })}
                          </div>
                        ) : isShort2x2 ? (
                          // 2x2 Grid: (A) ...   (B) ...  /  (C) ...   (D) ...
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            {rawOpts.map((opt, oIdx) => {
                              const key = (opt.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                              const isCorrect = isAnswerKeyMode && (key === targetOptKey || opt.isCorrect);
                              const optText = opt.rawText || opt.text || opt.label || '';

                              return (
                                <div key={opt.id || oIdx} className={`flex items-baseline gap-1 truncate ${isCorrect ? 'font-bold text-emerald-800' : ''}`}>
                                  <span className="font-bold shrink-0">({key})</span>
                                  <span className="truncate">
                                    <MathTextRenderer text={optText} />
                                  </span>
                                  {isCorrect && <Check className="inline w-3 h-3 text-emerald-600 stroke-[3] ml-0.5 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Stacked 1 per line: (A) ... \n (B) ...
                          <div className="space-y-0.5">
                            {rawOpts.map((opt, oIdx) => {
                              const key = (opt.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                              const isCorrect = isAnswerKeyMode && (key === targetOptKey || opt.isCorrect);
                              const optText = opt.rawText || opt.text || opt.label || '';

                              return (
                                <div key={opt.id || oIdx} className={`flex items-start gap-1.5 ${isCorrect ? 'font-bold text-emerald-800 bg-emerald-50/60 px-1 rounded' : ''}`}>
                                  <span className="font-bold shrink-0">({key})</span>
                                  <div className="flex-1">
                                    <MathTextRenderer text={optText} />
                                  </div>
                                  {isCorrect && <Check className="inline w-3.5 h-3.5 text-emerald-600 stroke-[3] ml-1 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Detailed Solution (Answer Key Mode Only) */}
                      {isAnswerKeyMode && (q.explanationText || q.solution || (q as any).explanation) && (
                        <div className="mt-1.5 pl-4 pr-1 py-1 bg-emerald-50 border-l-2 border-emerald-600 text-[10.5px] text-emerald-950 font-normal">
                          <span className="font-bold mr-1">Sol:</span>
                          <MathTextRenderer text={q.explanationText || q.solution || (q as any).explanation || ''} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. MASTER ANSWER KEY TABLE (Compact Grid at bottom in Answer Key Mode)    */}
        {/* ========================================================================= */}
        {isAnswerKeyMode && allQuestions.length > 0 && (
          <div className="exam-master-key-block mt-4 pt-3 border-t-2 border-black text-black">
            <div className="text-center font-bold text-xs uppercase tracking-wider mb-2">
              Master Answer Key ({allQuestions.length} Questions)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-[10px] text-center font-mono font-bold">
                <tbody>
                  {/* Split questions into rows of 15 or 20 */}
                  {(() => {
                    const rowSize = 15;
                    const rows: CollegeExamQuestion[][] = [];
                    for (let i = 0; i < allQuestions.length; i += rowSize) {
                      rows.push(allQuestions.slice(i, i + rowSize));
                    }

                    return rows.map((rowQs, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {/* Q.No Header Row */}
                        <tr className="bg-slate-100 border-b border-black">
                          <td className="border border-black px-1.5 py-0.5 bg-slate-200 font-sans font-bold">Q.No</td>
                          {rowQs.map((q, cIdx) => (
                            <td key={cIdx} className="border border-black px-1 py-0.5">
                              {rIdx * rowSize + cIdx + 1}
                            </td>
                          ))}
                        </tr>
                        {/* Ans Row */}
                        <tr className="border-b border-black">
                          <td className="border border-black px-1.5 py-0.5 bg-slate-200 font-sans font-bold">Ans</td>
                          {rowQs.map((q, cIdx) => {
                            const correct = (q.correctOption || q.correctAnswer || (q as any).correct_option || (q as any).correct_answer || 'A').toString().toUpperCase().trim();
                            return (
                              <td key={cIdx} className="border border-black px-1 py-0.5 text-emerald-900 bg-emerald-50">
                                {correct}
                              </td>
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Page Number */}
        <div className="mt-4 pt-2 text-center text-[10px] text-slate-500 font-mono select-none">
          — Page 1 —
        </div>
      </div>
    </div>
  );
};
