import React, { useState, useRef, useEffect } from 'react';
import { Question, QuestionOption, OptionLayoutType, QuestionDifficulty } from '@eduforge/shared';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { MathTypeEditor } from '../equation/MathTypeEditor.js';
import { DiagramStudioModal } from './DiagramStudioModal.js';
import { RichTextEditor } from '../components/RichTextEditor.js';
import { api } from '../services/api.js';
import { getUserProfile } from '../utils/userProfile.js';
import { formatQuestionCode } from '../utils/questionCode.js';
import { getDatabaseChaptersForSubject } from '../pages/CreateQuestionPage.js';
import {
  HelpCircle, X, Check, Plus, Trash2, Sigma, Sparkles,
  Image as ImageIcon, Palette, Upload, Loader2
} from 'lucide-react';

interface QuestionBuilderModalProps {
  isOpen: boolean;
  initialQuestion?: Partial<Question>;
  onClose: () => void;
  onSave: (question: Question) => void;
}

type MathTypeTarget =
  | { field: 'statement' }
  | { field: 'option'; index: number; key: string }
  | { field: 'explanation' };

const topicSuggestionsByChapter: Record<string, string[]> = {
  'Kinematics & Motion': ['Projectile Motion', 'Uniform Circular Motion', 'Relative Velocity', 'Newton Laws of Motion'],
  'Thermodynamics & Heat': ['Carnot Engine', 'First Law of Thermodynamics', 'Heat Transfer & Radiation', 'Ideal Gas Law'],
  'Electrostatics & Current': ['Coulomb Law', 'Electric Field & Potential', 'Gauss Theorem', 'Ohm Law & Kirchhoff Rules'],
  'Atomic Structure & Periodicity': ['Bohr Atomic Model', 'Quantum Numbers', 'Periodic Trends & Ionization', 'Photoelectric Effect'],
  'Organic Chemistry & Mechanisms': ['Electrophilic Substitution', 'Nucleophilic Addition', 'Resonance Effects', 'Stereoisomerism'],
  'Cell Structure & Function': ['Organelles & Membranes', 'Mitosis & Meiosis Cell Division', 'Plasma Membrane Transport'],
  'Genetics & Evolution': ['Mendelian Inheritance', 'DNA Replication', 'Transcription & Translation', 'Natural Selection'],
  'Calculus & Integration': ['Limits & Continuity', 'Derivatives & Chain Rule', 'Definite Integrals', 'Differential Equations']
};

export const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  isOpen,
  initialQuestion,
  onClose,
  onSave
}) => {
  const [questionNumber, setQuestionNumber] = useState<string | number>(initialQuestion?.questionNumber || 1);
  const [rawText, setRawText] = useState(initialQuestion?.rawText || '');
  const extractSvg = (q?: Partial<Question> | Question | null) => {
    if (!q) return '';
    if (q.diagramSvg) return q.diagramSvg;
    if ((q as any).diagram_svg) return (q as any).diagram_svg;
    if (Array.isArray(q.content)) {
      const diag = q.content.find((c: any) => c.type === 'diagram' || (c as any).diagramSvg || (c as any).svg) as any;
      if (diag) return diag.diagramSvg || diag.svg || '';
    }
    return '';
  };

  const user = getUserProfile();
  const userSubject = user.assigned_subject || 'All';
  const effectiveSubject = userSubject !== 'All' ? userSubject : (initialQuestion?.subject || 'Physics');

  const [subject, setSubject] = useState(effectiveSubject);
  const [chapter, setChapter] = useState(initialQuestion?.chapter || '');
  const [isCustomChapter, setIsCustomChapter] = useState(false);
  const [dbChapters, setDbChapters] = useState<any[]>([]);
  const [dbSubjects, setDbSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (userSubject !== 'All' && subject !== userSubject) {
      setSubject(userSubject);
    }
  }, [userSubject, subject]);

  useEffect(() => {
    api.getSubjects().then(subs => {
      if (subs && Array.isArray(subs)) setDbSubjects(subs);
    }).catch(console.error);

    api.getChapters().then(chs => {
      if (chs && Array.isArray(chs)) setDbChapters(chs);
    }).catch(console.error);
  }, []);

  const availableChapters = React.useMemo(() => {
    if (!subject) return [];
    return getDatabaseChaptersForSubject(subject, dbChapters, dbSubjects);
  }, [dbChapters, dbSubjects, subject]);

  useEffect(() => {
    if (!isCustomChapter && availableChapters.length > 0) {
      const exists = availableChapters.some(c => c.title.toLowerCase() === (chapter || '').toLowerCase());
      if (!exists) {
        setChapter(availableChapters[0].title);
        setIsCustomChapter(false);
      }
    }
  }, [subject, availableChapters, isCustomChapter, chapter]);

  // Question Code manual override state
  const [customQuestionCode, setCustomQuestionCode] = useState<string>(
    initialQuestion?.questionCode || initialQuestion?.question_code || ''
  );
  const [isManualQuestionCode, setIsManualQuestionCode] = useState<boolean>(
    Boolean(initialQuestion?.questionCode || initialQuestion?.question_code)
  );

  useEffect(() => {
    if (!isManualQuestionCode) {
      const chObj = availableChapters.find(c => c.title.toLowerCase() === (chapter || '').toLowerCase());
      setCustomQuestionCode(formatQuestionCode({ subject, chapter, chapterCode: chObj?.code, id: initialQuestion?.id }));
    }
  }, [subject, chapter, isManualQuestionCode, availableChapters, initialQuestion?.id]);

  const [topic, setTopic] = useState(initialQuestion?.topic || '');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>(initialQuestion?.difficulty || 'Medium');
  const [marks, setMarks] = useState<number>(initialQuestion?.marks || 4);
  const [negativeMarks, setNegativeMarks] = useState<number>(initialQuestion?.negativeMarks !== undefined ? initialQuestion.negativeMarks : 1);
  const [optionLayout, setOptionLayout] = useState<OptionLayoutType>(initialQuestion?.optionLayout || 'grid_2x2');
  const [tagsInput, setTagsInput] = useState<string>((initialQuestion?.tags || []).join(', '));
  const [explanationText, setExplanationText] = useState<string>(initialQuestion?.explanationText || '');
  const [diagramSvg, setDiagramSvg] = useState<string>(extractSvg(initialQuestion));
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (initialQuestion?.imageUrls && initialQuestion.imageUrls.length > 0) {
      return initialQuestion.imageUrls;
    }
    if (initialQuestion?.imageUrl) return [initialQuestion.imageUrl];
    if (initialQuestion?.diagramUrl && !initialQuestion?.diagramSvg) return [initialQuestion.diagramUrl];
    return [];
  });
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState<boolean>(false);
  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null);

  // Hidden file input refs
  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const optionImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // MathType Visual Equation Editor integration
  const [isMathTypeOpen, setIsMathTypeOpen] = useState<boolean>(false);
  const [mathTypeTarget, setMathTypeTarget] = useState<MathTypeTarget>({ field: 'statement' });
  const [mathTypeInitial, setMathTypeInitial] = useState<string>('');

  // Diagram Studio integration
  const [isDiagramStudioOpen, setIsDiagramStudioOpen] = useState<boolean>(false);
  const [diagramStudioTarget, setDiagramStudioTarget] = useState<{ field: 'statement' } | { field: 'option'; index: number }>({ field: 'statement' });

  const defaultOptions: QuestionOption[] = [
    { id: 'opt-1', key: 'a', rawText: '', isCorrect: true, content: [] },
    { id: 'opt-2', key: 'b', rawText: '', isCorrect: false, content: [] },
    { id: 'opt-3', key: 'c', rawText: '', isCorrect: false, content: [] },
    { id: 'opt-4', key: 'd', rawText: '', isCorrect: false, content: [] }
  ];

  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : defaultOptions
  );

  // Synchronize / Reset Form State when Modal Opens or Initial Question Changes
  useEffect(() => {
    if (isOpen) {
      if (initialQuestion && (initialQuestion.id || initialQuestion.rawText)) {
        setQuestionNumber(initialQuestion.questionNumber || 1);
        setRawText(initialQuestion.rawText || '');
        setSubject(initialQuestion.subject || 'Physics');
        setChapter(initialQuestion.chapter || '');
        setTopic(initialQuestion.topic || '');
        setDifficulty(initialQuestion.difficulty || 'Medium');
        setMarks(initialQuestion.marks || 4);
        setNegativeMarks(initialQuestion.negativeMarks !== undefined ? initialQuestion.negativeMarks : 1);
        setOptionLayout(initialQuestion.optionLayout || 'grid_2x2');
        setTagsInput((initialQuestion.tags || []).join(', '));
        setExplanationText(initialQuestion.explanationText || '');
        setDiagramSvg(extractSvg(initialQuestion));

        if (initialQuestion.imageUrls && initialQuestion.imageUrls.length > 0) {
          setImageUrls(initialQuestion.imageUrls);
        } else if (initialQuestion.imageUrl) {
          setImageUrls([initialQuestion.imageUrl]);
        } else {
          setImageUrls([]);
        }

        if (initialQuestion.options && initialQuestion.options.length > 0) {
          setOptions(initialQuestion.options);
        } else {
          setOptions([
            { id: 'opt-1', key: 'a', rawText: '', isCorrect: true, content: [] },
            { id: 'opt-2', key: 'b', rawText: '', isCorrect: false, content: [] },
            { id: 'opt-3', key: 'c', rawText: '', isCorrect: false, content: [] },
            { id: 'opt-4', key: 'd', rawText: '', isCorrect: false, content: [] }
          ]);
        }
      } else {
        // Entirely FRESH RESET for new question creation
        setQuestionNumber(1);
        setRawText('');
        setSubject('Physics');
        setChapter('');
        setTopic('');
        setDifficulty('Medium');
        setMarks(4);
        setNegativeMarks(1);
        setOptionLayout('grid_2x2');
        setTagsInput('');
        setExplanationText('');
        setDiagramSvg('');
        setImageUrls([]);
        setOptions([
          { id: 'opt-1', key: 'a', rawText: '', isCorrect: true, content: [] },
          { id: 'opt-2', key: 'b', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-3', key: 'c', rawText: '', isCorrect: false, content: [] },
          { id: 'opt-4', key: 'd', rawText: '', isCorrect: false, content: [] }
        ]);
      }
    }
  }, [isOpen, initialQuestion]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextKey = String.fromCharCode(97 + options.length);
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, key: nextKey, rawText: '', isCorrect: false, content: [] }
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, idx) => idx !== index).map((opt, idx) => ({
      ...opt,
      key: String.fromCharCode(97 + idx)
    }));
    if (!updated.some(o => o.isCorrect) && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setOptions(updated);
  };

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], rawText: text };
    setOptions(updated);
  };

  const handleSetCorrect = (index: number) => {
    const updated = options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index
    }));
    setOptions(updated);
  };

  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingQuestionImage(true);
      const newUrls: string[] = [];
      let updatedHtml = rawText || '';
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploadImage(files[i]);
        if (res.url) {
          newUrls.push(res.url);
          updatedHtml += `<p><img src="${res.url}" /></p>`;
        }
      }
      setRawText(updatedHtml);
      setImageUrls(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Question image upload error:', err);
    } finally {
      setIsUploadingQuestionImage(false);
      if (questionImageInputRef.current) questionImageInputRef.current.value = '';
    }
  };

  const handleOptionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingOptionIdx(index);
      let updatedText = options[index].rawText || '';
      let lastUrl = options[index].imageUrl;
      for (let i = 0; i < files.length; i++) {
        const res = await api.uploadImage(files[i]);
        if (res.url) {
          lastUrl = res.url;
          updatedText += `<p><img src="${res.url}" /></p>`;
        }
      }
      const updated = [...options];
      updated[index] = {
        ...updated[index],
        rawText: updatedText,
        imageUrl: lastUrl
      };
      setOptions(updated);
    } catch (err) {
      console.error('Option image upload error:', err);
    } finally {
      setUploadingOptionIdx(null);
      if (optionImageInputRefs.current[index]) {
        optionImageInputRefs.current[index]!.value = '';
      }
    }
  };

  const handleOptionImageChange = (index: number, url: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], imageUrl: url };
    setOptions(updated);
  };

  const handleSaveDiagram = (svg: string) => {
    if (diagramStudioTarget.field === 'statement') {
      setDiagramSvg(svg);
    } else if (diagramStudioTarget.field === 'option') {
      const updated = [...options];
      updated[diagramStudioTarget.index] = {
        ...updated[diagramStudioTarget.index],
        diagramSvg: svg
      };
      setOptions(updated);
    }
  };

  const openMathTypeForStatement = () => {
    setMathTypeTarget({ field: 'statement' });
    setMathTypeInitial(rawText);
    setIsMathTypeOpen(true);
  };

  const openMathTypeForOption = (index: number, key: string, currentText: string) => {
    setMathTypeTarget({ field: 'option', index, key });
    setMathTypeInitial(currentText);
    setIsMathTypeOpen(true);
  };

  const openMathTypeForExplanation = () => {
    setMathTypeTarget({ field: 'explanation' });
    setMathTypeInitial(explanationText);
    setIsMathTypeOpen(true);
  };

  const handleInsertMathTypeFormula = (formulaLatex: string) => {
    if (mathTypeTarget.field === 'statement') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      setRawText(prev => (prev.trim() ? `${prev.trim()} ${formatted}` : formatted));
    } else if (mathTypeTarget.field === 'option') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      handleOptionTextChange(mathTypeTarget.index, formatted);
    } else if (mathTypeTarget.field === 'explanation') {
      const formatted = formulaLatex.startsWith('$') ? formulaLatex : `$${formulaLatex}$`;
      setExplanationText(prev => (prev.trim() ? `${prev.trim()} ${formatted}` : formatted));
    }
  };

  const getTargetLabel = () => {
    if (mathTypeTarget.field === 'statement') return 'Question Statement';
    if (mathTypeTarget.field === 'option') return `Option (${mathTypeTarget.key})`;
    if (mathTypeTarget.field === 'explanation') return 'Solution / Explanation';
    return 'Question Field';
  };

  const handleSave = () => {
    const correctOpt = options.find(o => o.isCorrect);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const subToUse = userSubject !== 'All' ? userSubject : subject;
    const dynamicCode = formatQuestionCode({ subject: subToUse, chapter, id: initialQuestion?.id });
    const finalCode = (customQuestionCode || dynamicCode).trim();

    const question: Question = {
      id: initialQuestion?.id || `q-${Date.now()}`,
      questionCode: finalCode,
      question_code: finalCode,
      questionNumber,
      questionType: 'MCQ_SINGLE',
      rawText,
      content: [
        {
          id: `p-${Date.now()}`,
          type: 'paragraph',
          runs: [{ id: `t-${Date.now()}`, text: rawText }]
        }
      ],
      options: options.map(o => ({
        ...o,
        imageUrl: o.imageUrl || undefined,
        content: [{ id: `p-${Date.now()}`, type: 'paragraph', runs: [{ id: `t-${Date.now()}`, text: o.rawText || '' }] }]
      })),
      correctAnswer: correctOpt?.key || 'a',
      marks,
      negativeMarks,
      subject: subToUse,
      chapter,
      topic,
      difficulty,
      tags,
      optionLayout,
      explanationText,
      diagramSvg: diagramSvg || undefined,
      imageUrl: imageUrls[0] || undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      diagramUrl: imageUrls[0] || undefined,
      isSystem: false,
      createdAt: initialQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(question);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white text-black rounded-xl shadow-2xl border border-slate-200 w-full md:w-[60vw] max-w-[60vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black">
                  {initialQuestion?.id ? 'Edit MCQ Question' : 'Create New MCQ Question'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">Configure statement, formulas with MathType, local image attachments, diagrams, and options</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            
            {/* Metadata Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Question Code
                  </label>
                  {isManualQuestionCode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualQuestionCode(false);
                        setCustomQuestionCode(formatQuestionCode({ subject, chapter, id: initialQuestion?.id }));
                      }}
                      className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Reset Auto
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={customQuestionCode}
                  onChange={e => {
                    setCustomQuestionCode(e.target.value);
                    setIsManualQuestionCode(true);
                  }}
                  placeholder="e.g. PHY-UNI-0001"
                  className="w-full text-sm font-mono font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Q. No.
                </label>
                <input
                  type="text"
                  value={questionNumber}
                  onChange={e => setQuestionNumber(e.target.value)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                  <option value="General Science">General Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    Marks
                  </label>
                  <input
                    type="number"
                    value={marks}
                    onChange={e => setMarks(Number(e.target.value))}
                    className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                    -ve Marks
                  </label>
                  <input
                    type="number"
                    value={negativeMarks}
                    onChange={e => setNegativeMarks(Number(e.target.value))}
                    className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Chapter & Topic with Dropdown + Typing Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Chapter / Unit
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomChapter(!isCustomChapter);
                      if (!isCustomChapter) setChapter('');
                      else if (availableChapters.length > 0) setChapter(availableChapters[0].title);
                    }}
                    className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    {isCustomChapter ? '← Choose from dropdown' : '+ Type custom chapter'}
                  </button>
                </div>

                {!isCustomChapter ? (
                  <select
                    value={chapter}
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomChapter(true);
                        setChapter('');
                      } else {
                        setChapter(e.target.value);
                      }
                    }}
                    className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                  >
                    {availableChapters.length === 0 ? (
                      <option value="">No chapters in database for {subject}</option>
                    ) : (
                      availableChapters.map(ch => (
                        <option key={ch.id || ch.title} value={ch.title}>
                          {ch.title} {ch.code ? `(${ch.code})` : ''}
                        </option>
                      ))
                    )}
                    <option value="__NEW__">+ Add Custom Chapter...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Type custom chapter name..."
                    value={chapter}
                    onChange={e => setChapter(e.target.value)}
                    className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  list="builder-topic-list"
                  placeholder="Select from dropdown or type custom topic..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs placeholder:text-slate-400"
                />
                <datalist id="builder-topic-list">
                  {(topicSuggestionsByChapter[chapter] || ['General Concept', 'Overview', 'Advanced Theory', 'Numerical Problems']).map(topItem => (
                    <option key={topItem} value={topItem} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Question Statement with MathType, Local Image Upload & Diagram Studio */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Question Statement
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={questionImageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleQuestionImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => questionImageInputRef.current?.click()}
                    disabled={isUploadingQuestionImage}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingQuestionImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{imageUrls.length > 0 ? `+ Add Images (${imageUrls.length})` : 'Add Question Images'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openMathTypeForStatement}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Sigma className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>MathType Formula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDiagramStudioOpen(true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>{diagramSvg ? 'Edit Diagram' : 'Draw Shapes'}</span>
                  </button>
                </div>
              </div>

              <RichTextEditor
                value={rawText}
                onChange={setRawText}
                onImagePasted={url => setImageUrls(prev => [...prev, url])}
                placeholder="Enter question statement (e.g. In the circuit shown below, determine the equivalent resistance...)"
                className="w-full"
                showPreview
              />

              {diagramSvg && (
                <div className="mt-2.5 p-3 bg-slate-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 bg-white border border-slate-300 rounded-lg p-1 overflow-hidden flex items-center justify-center">
                      <div className="w-full h-full scale-90" dangerouslySetInnerHTML={{ __html: diagramSvg }} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> SVG Diagram Attached
                      </span>
                      <span className="text-[10px] text-slate-500">Will render cleanly above/below options on the question paper</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsDiagramStudioOpen(true)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagramSvg('')}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Remove diagram"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Options Header & Layout */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                    Multiple Choice Options ({options.length} options)
                  </h4>
                  <span className="text-[11px] text-slate-600 font-medium">Add text, formulas, or images from your local system for each option</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-black font-bold">Layout:</span>
                    <select
                      value={optionLayout}
                      onChange={e => setOptionLayout(e.target.value as OptionLayoutType)}
                      className="text-xs font-bold p-1 border border-slate-300 rounded bg-white text-black shadow-2xs cursor-pointer"
                    >
                      <option value="grid_2x2">2x2 Grid (a) (b) / (c) (d)</option>
                      <option value="grid_2x2_upper">2x2 Grid A. B. / C. D.</option>
                      <option value="vertical">Vertical Stack</option>
                      <option value="horizontal">Horizontal Inline</option>
                    </select>
                  </div>

                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-300 hover:border-sky-400 text-sky-800 text-xs font-bold rounded flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  )}
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={opt.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer" title="Mark as correct answer">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrect(idx)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={`text-xs font-bold uppercase tracking-wider ${opt.isCorrect ? 'text-emerald-700 font-black' : 'text-black'}`}>
                          Option ({opt.key}) {opt.isCorrect && '— Correct Answer'}
                        </span>
                      </label>

                      <div className="flex items-center gap-2">
                        <input
                          ref={el => (optionImageInputRefs.current[idx] = el)}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={e => handleOptionImageUpload(idx, e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => optionImageInputRefs.current[idx]?.click()}
                          disabled={uploadingOptionIdx === idx}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingOptionIdx === idx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{opt.imageUrl ? 'Option Image' : 'Add Option Images'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openMathTypeForOption(idx, opt.key, opt.rawText || '')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Sigma className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>MathType Formula</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDiagramStudioTarget({ field: 'option', index: idx });
                            setIsDiagramStudioOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>{opt.diagramSvg ? 'Edit Diagram' : 'Draw Shapes'}</span>
                        </button>

                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <RichTextEditor
                      value={opt.rawText || ''}
                      onChange={val => handleOptionTextChange(idx, val)}
                      onImagePasted={url => handleOptionImageChange(idx, url)}
                      placeholder={`Enter Option (${opt.key}) text or formula (e.g. H = \\frac{u^2}{2g})`}
                      className="w-full"
                      showPreview
                    />

                    {opt.diagramSvg && (
                      <div className="mt-2 p-2.5 bg-slate-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-14 bg-white border border-slate-300 rounded-lg p-1 overflow-hidden flex items-center justify-center">
                            <div className="w-full h-full scale-90" dangerouslySetInnerHTML={{ __html: opt.diagramSvg }} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> SVG Diagram Attached
                            </span>
                            <span className="text-[10px] text-slate-500">Will render for Option ({opt.key})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDiagramStudioTarget({ field: 'option', index: idx });
                              setIsDiagramStudioOpen(true);
                            }}
                            className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...options];
                              updated[idx] = { ...updated[idx], diagramSvg: undefined };
                              setOptions(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                            title="Remove diagram"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-black">
                    Solution / Explanation (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={openMathTypeForExplanation}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sigma className="w-3 h-3" /> MathType
                  </button>
                </div>
                <RichTextEditor
                  value={explanationText}
                  onChange={setExplanationText}
                  onImagePasted={url => setImageUrls(prev => [...prev, url])}
                  placeholder="Detailed step-by-step solution or rationale..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                  Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. jee-main, formulas, mechanics, medium"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg text-black bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400 min-h-[42px]"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-xs font-bold text-black">
              {marks} Marks ({negativeMarks ? `-${negativeMarks} negative` : 'No negative marking'})
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Question
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded MathType Visual Equation Editor */}
      <MathTypeEditor
        isOpen={isMathTypeOpen}
        initialLatex={mathTypeInitial}
        targetFieldLabel={getTargetLabel()}
        onClose={() => setIsMathTypeOpen(false)}
        onInsertEquation={handleInsertMathTypeFormula}
      />

      {/* Embedded Diagram Studio Modal */}
      <DiagramStudioModal
        isOpen={isDiagramStudioOpen}
        initialSvg={
          diagramStudioTarget.field === 'statement'
            ? diagramSvg
            : (options[diagramStudioTarget.index]?.diagramSvg || '')
        }
        onClose={() => setIsDiagramStudioOpen(false)}
        onSaveDiagram={handleSaveDiagram}
      />
    </>
  );
};
