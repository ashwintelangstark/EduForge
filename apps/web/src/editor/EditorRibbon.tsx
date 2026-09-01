import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Home, PlusCircle, Sigma, Hash, Atom, FlaskConical, HelpCircle, Layout, Eye,
  Save, Download, Printer, Undo, Redo, Bold, Italic, Underline, Strikethrough,
  Superscript, Subscript, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Search, Image as ImageIcon, Table as TableIcon, Shapes, Sparkles, Columns,
  ZoomIn, ZoomOut, Check, ArrowLeft, Grid, List, ListOrdered, Indent, Outdent,
  Database, HelpCircle as HelpIcon, FileSpreadsheet, PaintBucket, Highlighter,
  Scissors, Copy, Clipboard, Eraser, ArrowDownAZ, ChevronDown, Type,
  BookOpen, CheckSquare, Layers, Wand2, RefreshCw, SlidersHorizontal, Maximize2,
  Plus, ArrowRight, Dices, X
} from 'lucide-react';
import {
  DocumentModel, Alignment, OptionLayoutType, WordArtStyle, ShapeType,
  TextFormatting, ParagraphBlock, Question
} from '@eduforge/shared';
import { FontDropdown } from './FontDropdown.js';
import { ColorPickerPopover } from './ColorPickerPopover.js';
import { StyleGallery } from './StyleGallery.js';
import { DocumentStylePreset } from './styles.js';
import { api } from '../services/api.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';

export type RibbonTab =
  | 'File'
  | 'Home'
  | 'Insert'
  | 'Equation'
  | 'Symbols'
  | 'Physics'
  | 'Chemistry'
  | 'Question';

export interface FormattingState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  underlineStyle?: 'single' | 'double' | 'dotted' | 'dashed' | 'wavy';
  underlineColor?: string;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  alignment?: Alignment;
  lineSpacing?: number;
  listType?: 'none' | 'bullet' | 'number' | 'alpha' | 'roman' | 'multilevel';
  listBulletStyle?: string;
  indent?: number;
  characterBorder?: boolean;
  textEffect?: 'none' | 'glow' | 'shadow' | 'outline' | 'reflection';
  border?: 'none' | 'box' | 'bottom' | 'top' | 'left' | 'all';
  styleName?: string;
}

interface EditorRibbonProps {
  document: DocumentModel;
  activeTab: RibbonTab;
  setActiveTab: (tab: RibbonTab) => void;
  currentFormatting?: FormattingState;
  onApplyFormat: (format: Partial<FormattingState>) => void;
  isFormatPainterActive?: boolean;
  onToggleFormatPainter?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  onPrintPreview?: () => void;
  onNavigateHome?: () => void;
  // Insert actions
  onOpenQuestionBuilder?: () => void;
  onOpenQuestionBank?: () => void;
  onDropQuestionFromBank?: (question: Question) => void;
  onOpenEquationModal?: () => void;
  onOpenSymbolsModal?: () => void;
  onOpenPhysicsModal?: () => void;
  onOpenChemistryModal?: () => void;
  onOpenUnitsModal?: () => void;
  onOpenConstantsModal?: () => void;
  onOpenFindReplace?: () => void;
  onInsertParagraph?: () => void;
  onInsertHeading?: (level: 1 | 2 | 3) => void;
  onInsertTable?: (rows: number, cols: number) => void;
  onInsertImage?: () => void;
  onInsertShape?: (shape: ShapeType) => void;
  onInsertWordArt?: (text: string, style: WordArtStyle) => void;
  onInsertPageBreak?: () => void;
  onInsertHorizontalLine?: () => void;
  // Layout & View actions
  onSetColumns?: (cols: 1 | 2) => void;
  onSetMargins?: (margins: { top: number; bottom: number; left: number; right: number }) => void;
  onToggleColumnDivider?: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showMarginGuides: boolean;
  setShowMarginGuides: (show: boolean) => void;
  showColumnGuides: boolean;
  setShowColumnGuides: (show: boolean) => void;
  showFormattingMarks: boolean;
  setShowFormattingMarks: (show: boolean) => void;
  printPreviewMode: boolean;
  setPrintPreviewMode: (val: boolean) => void;
  onChangeOptionLayout?: (layout: OptionLayoutType) => void;
  onPasteText?: (mode?: 'formatted' | 'plain') => void;
  onCutText?: () => void;
  onCopyText?: () => void;
  onSelectAll?: () => void;
}

export const EditorRibbon: React.FC<EditorRibbonProps> = ({
  document: doc,
  activeTab,
  setActiveTab,
  currentFormatting = {},
  onApplyFormat,
  isFormatPainterActive = false,
  onToggleFormatPainter,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  onExportDocx,
  onExportPdf,
  onPrintPreview,
  onNavigateHome,
  onOpenQuestionBuilder,
  onOpenQuestionBank,
  onDropQuestionFromBank,
  onOpenEquationModal,
  onOpenSymbolsModal,
  onOpenPhysicsModal,
  onOpenChemistryModal,
  onOpenUnitsModal,
  onOpenConstantsModal,
  onOpenFindReplace,
  onInsertParagraph,
  onInsertHeading,
  onInsertTable,
  onInsertImage,
  onInsertShape,
  onInsertWordArt,
  onInsertPageBreak,
  onInsertHorizontalLine,
  onSetColumns,
  onSetMargins,
  onToggleColumnDivider,
  zoom,
  setZoom,
  showMarginGuides,
  setShowMarginGuides,
  showColumnGuides,
  setShowColumnGuides,
  showFormattingMarks,
  setShowFormattingMarks,
  printPreviewMode,
  setPrintPreviewMode,
  onChangeOptionLayout,
  onPasteText,
  onCutText,
  onCopyText,
  onSelectAll
}) => {
  // Dropdowns local state
  const [isCaseMenuOpen, setIsCaseMenuOpen] = useState(false);
  const [isUnderlineMenuOpen, setIsUnderlineMenuOpen] = useState(false);
  const [isBulletsMenuOpen, setIsBulletsMenuOpen] = useState(false);
  const [isNumberingMenuOpen, setIsNumberingMenuOpen] = useState(false);
  const [isLineSpacingMenuOpen, setIsLineSpacingMenuOpen] = useState(false);
  const [isBordersMenuOpen, setIsBordersMenuOpen] = useState(false);
  const [isTextEffectsMenuOpen, setIsTextEffectsMenuOpen] = useState(false);

  // Question Bank Quick Drop Popover State in Insert Tab
  const [isQuestionBankDropdownOpen, setIsQuestionBankDropdownOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubject, setBankSubject] = useState<string>('all');
  const [loadingBank, setLoadingBank] = useState(false);
  const questionBankMenuRef = useRef<HTMLDivElement>(null);

  const activeFontFamily = currentFormatting.fontFamily || doc.settings.defaultFont || 'Calibri, Inter, sans-serif';
  const activeFontSize = currentFormatting.fontSize || doc.settings.defaultFontSize || 10.5;

  const tabs: { id: RibbonTab; label: string; icon?: any }[] = [
    { id: 'Home', label: 'Home' },
    { id: 'Insert', label: 'Insert' },
    { id: 'Equation', label: 'Math Equation' },
    { id: 'Physics', label: 'Physics' },
    { id: 'Chemistry', label: 'Chemistry' }
  ];

  // Font size options
  const fontSizePresets = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  // Close Quick Question Bank Dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (questionBankMenuRef.current && !questionBankMenuRef.current.contains(e.target as Node)) {
        setIsQuestionBankDropdownOpen(false);
      }
    };
    if (isQuestionBankDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuestionBankDropdownOpen]);

  // Load questions when Question Bank dropdown is open or search/filter changes
  useEffect(() => {
    if (isQuestionBankDropdownOpen) {
      setLoadingBank(true);
      const params: any = {};
      if (bankSearch) params.search = bankSearch;
      if (bankSubject !== 'all') params.subject = bankSubject;

      api.getQuestions(params)
        .then(data => {
          setBankQuestions(data);
          setLoadingBank(false);
        })
        .catch(() => setLoadingBank(false));
    }
  }, [isQuestionBankDropdownOpen, bankSearch, bankSubject]);

  // Grow / Shrink Font
  const handleGrowFont = () => {
    const nextSize = fontSizePresets.find(sz => sz > activeFontSize) || activeFontSize + 2;
    onApplyFormat({ fontSize: nextSize });
  };

  const handleShrinkFont = () => {
    const prevSizes = fontSizePresets.filter(sz => sz < activeFontSize);
    const prevSize = prevSizes.length > 0 ? prevSizes[prevSizes.length - 1] : Math.max(6, activeFontSize - 1);
    onApplyFormat({ fontSize: prevSize });
  };

  // Change Case Handler
  const handleChangeCase = (mode: 'sentence' | 'lower' | 'upper' | 'capitalize' | 'toggle') => {
    setIsCaseMenuOpen(false);
    onApplyFormat({ textEffect: mode as any });
  };

  const handleQuickDropQuestion = (q: Question) => {
    if (onDropQuestionFromBank) {
      onDropQuestionFromBank(q);
    }
    setIsQuestionBankDropdownOpen(false);
  };

  const handleDropRandomQuestion = async () => {
    if (bankQuestions.length > 0) {
      const rand = bankQuestions[Math.floor(Math.random() * bankQuestions.length)];
      handleQuickDropQuestion(rand);
    } else {
      try {
        const all = await api.getQuestions();
        if (all.length > 0) {
          const rand = all[Math.floor(Math.random() * all.length)];
          handleQuickDropQuestion(rand);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="border-b border-slate-300 bg-white shadow-xs select-none no-print sticky top-0 z-40">
      
      {/* ================= 1. Top Bar: File & Quick Access & Tabs ================= */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-slate-200 bg-slate-100 text-xs text-slate-800">
        
        {/* Left: File button + Quick Access Icons + Tabs */}
        <div className="flex items-center gap-1">
          {/* File Menu Trigger */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'File' ? 'Home' : 'File')}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'File'
                ? 'bg-sky-600 text-white'
                : 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs'
            }`}
          >
            <span className="text-sm leading-none">≡</span>
            <span>File</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Quick Access Toolbar Icons */}
          <button
            type="button"
            onClick={onSave}
            className="p-1 hover:bg-slate-200 text-slate-600 hover:text-sky-600 rounded transition-colors cursor-pointer"
            title="Save Document (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleFormatPainter}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isFormatPainterActive
                ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300 font-bold'
                : 'hover:bg-slate-200 text-slate-600 hover:text-amber-600'
            }`}
            title="Format Painter (Click to copy & apply text style)"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            className="p-1 hover:bg-slate-200 text-slate-600 hover:text-emerald-600 rounded transition-colors cursor-pointer"
            title="Quick Print / PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrintPreview}
            className="p-1 hover:bg-slate-200 text-slate-600 hover:text-purple-600 rounded transition-colors cursor-pointer"
            title="Print Preview / Zoom"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600 hover:text-sky-600 rounded transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600 hover:text-sky-600 rounded transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Ribbon Tabs matching MS Word standards */}
          <div className="flex items-center gap-0.5 ml-2">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-t transition-all relative cursor-pointer ${
                    isActive
                      ? 'text-sky-700 font-bold bg-white border-t-2 border-sky-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Document Title & Dashboard */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="EduForge" className="w-4 h-4 object-contain" />
          <span className="text-xs font-semibold truncate max-w-[200px] text-slate-800">
            {doc.title}
          </span>
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded shadow-2xs transition-colors ml-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      {/* ================= 2. Ribbon Content Toolbar ================= */}
      <div className="px-3 py-2 min-h-[76px] flex items-center gap-2 overflow-x-auto bg-white border-b border-slate-200 text-slate-800">
        
        {/* ================= HOME TAB (MS WORD STYLE) ================= */}
        {activeTab === 'Home' && (
          <div className="flex items-center gap-3 w-full">
            
            {/* 1. CLIPBOARD GROUP */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2.5 shrink-0">
              {/* Format Painter button */}
              <button
                type="button"
                onClick={onToggleFormatPainter}
                className={`flex flex-col items-center justify-center p-1.5 rounded transition-all min-w-[50px] cursor-pointer ${
                  isFormatPainterActive
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                title="Format Painter (Copy formatting from one place and apply to another)"
              >
                <Wand2 className={`w-5 h-5 mb-0.5 ${isFormatPainterActive ? 'text-amber-700' : 'text-amber-600'}`} />
                <span className="text-[9.5px] leading-tight text-center">Format<br/>Painter</span>
              </button>

              {/* Paste button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => onPasteText && onPasteText('formatted')}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors min-w-[44px] text-slate-700 hover:text-slate-900 cursor-pointer"
                  title="Paste (Ctrl+V)"
                >
                  <Clipboard className="w-5 h-5 mb-0.5 text-sky-600" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9.5px]">Paste</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </button>
              </div>

              {/* Stacked Cut / Copy */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={onCutText}
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded flex items-center gap-1 cursor-pointer"
                  title="Cut (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCopyText}
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded flex items-center gap-1 cursor-pointer"
                  title="Copy (Ctrl+C)"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. FONT GROUP (80+ FONTS & FORMATTING) */}
            <div className="flex flex-col gap-1 border-r border-slate-200 pr-3 shrink-0">
              
              {/* Row 1: Font Selector, Font Size, Grow/Shrink, Case, Clear Formatting */}
              <div className="flex items-center gap-1">
                {/* 80+ Fonts Selector */}
                <FontDropdown
                  currentFont={activeFontFamily}
                  onSelectFont={(family) => {
                    onApplyFormat({ fontFamily: family });
                  }}
                />

                {/* Font Size Selector */}
                <select
                  value={activeFontSize}
                  onChange={e => onApplyFormat({ fontSize: Number(e.target.value) })}
                  className="text-xs h-7 px-1.5 bg-white border border-slate-300 rounded text-slate-800 font-medium w-16 focus:outline-hidden focus:border-sky-500 cursor-pointer shadow-2xs"
                  title="Font Size (pt)"
                >
                  {fontSizePresets.map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>

                {/* Grow Font Button */}
                <button
                  type="button"
                  onClick={handleGrowFont}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-950 font-bold flex items-center cursor-pointer"
                  title="Increase Font Size"
                >
                  <span className="text-xs font-black">A</span>
                  <span className="text-[9px] font-bold text-sky-600">▲</span>
                </button>

                {/* Shrink Font Button */}
                <button
                  type="button"
                  onClick={handleShrinkFont}
                  className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-950 font-bold flex items-center cursor-pointer"
                  title="Decrease Font Size"
                >
                  <span className="text-[10px] font-bold">A</span>
                  <span className="text-[8px] font-bold text-sky-600">▼</span>
                </button>

                {/* Change Case Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCaseMenuOpen(!isCaseMenuOpen)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-950 flex items-center gap-0.5 cursor-pointer"
                    title="Change Case (Sentence case, UPPERCASE, lowercase, etc.)"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-sky-600" />
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isCaseMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 min-w-[150px] text-xs">
                      <button
                        type="button"
                        onClick={() => handleChangeCase('sentence')}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-slate-800"
                      >
                        Sentence case.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('lower')}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-slate-800"
                      >
                        lowercase
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('upper')}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-slate-800"
                      >
                        UPPERCASE
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('capitalize')}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-slate-800"
                      >
                        Capitalize Each Word
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeCase('toggle')}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 text-slate-800"
                      >
                        tOGGLE cASE
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear All Formatting */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({
                    bold: false,
                    italic: false,
                    underline: false,
                    strikethrough: false,
                    superscript: false,
                    subscript: false,
                    color: '#0f172a',
                    backgroundColor: undefined,
                    fontFamily: 'Calibri, Inter, sans-serif',
                    fontSize: 10.5
                  })}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-rose-600 cursor-pointer"
                  title="Clear All Formatting"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-500" />
                </button>
              </div>

              {/* Row 2: Bold, Italic, Underline (w/ styles), Strikethrough, Subscript, Superscript, Text Color, Highlight Color */}
              <div className="flex items-center gap-0.5">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ bold: !currentFormatting.bold })}
                  className={`p-1 rounded font-bold cursor-pointer ${
                    currentFormatting.bold
                      ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5 stroke-[2.8]" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ italic: !currentFormatting.italic })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.italic
                      ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Underline with styles dropdown */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({ underline: !currentFormatting.underline })}
                    className={`p-1 rounded-l cursor-pointer ${
                      currentFormatting.underline
                        ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUnderlineMenuOpen(!isUnderlineMenuOpen)}
                    className="p-0.5 hover:bg-slate-100 rounded-r text-slate-500 cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isUnderlineMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 min-w-[140px] text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'single' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between"
                      >
                        <span className="underline">Single</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'double' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between"
                      >
                        <span className="underline underline-offset-2 decoration-double">Double</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'dotted' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between"
                      >
                        <span className="underline decoration-dotted">Dotted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'dashed' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between"
                      >
                        <span className="underline decoration-dashed">Dashed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ underline: true, underlineStyle: 'wavy' });
                          setIsUnderlineMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 flex items-center justify-between"
                      >
                        <span className="underline decoration-wavy">Wavy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ strikethrough: !currentFormatting.strikethrough })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.strikethrough
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                {/* Subscript */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ subscript: !currentFormatting.subscript, superscript: false })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.subscript
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Subscript (e.g. H₂O)"
                >
                  <Subscript className="w-3.5 h-3.5" />
                </button>

                {/* Superscript */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ superscript: !currentFormatting.superscript, subscript: false })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.superscript
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Superscript (e.g. x²)"
                >
                  <Superscript className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-0.5" />

                {/* Text Color Popover */}
                <ColorPickerPopover
                  type="text"
                  currentColor={currentFormatting.color || '#0f172a'}
                  onSelectColor={hex => onApplyFormat({ color: hex })}
                >
                  <div className="p-1 hover:bg-slate-100 rounded flex flex-col items-center justify-center cursor-pointer" title="Font Color">
                    <span className="font-black text-xs leading-none">A</span>
                    <div
                      className="w-3.5 h-1 rounded-xs mt-0.5 border border-slate-300"
                      style={{ backgroundColor: currentFormatting.color || '#0f172a' }}
                    />
                  </div>
                </ColorPickerPopover>

                {/* Text Highlight Color Popover */}
                <ColorPickerPopover
                  type="highlight"
                  currentColor={currentFormatting.backgroundColor}
                  onSelectColor={hex => onApplyFormat({ backgroundColor: hex })}
                >
                  <div className="p-1 hover:bg-slate-100 rounded flex flex-col items-center justify-center cursor-pointer" title="Text Highlight Color">
                    <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                    <div
                      className="w-3.5 h-1 rounded-xs mt-0.5 border border-slate-300"
                      style={{ backgroundColor: currentFormatting.backgroundColor || 'transparent' }}
                    />
                  </div>
                </ColorPickerPopover>
              </div>
            </div>

            {/* 3. PARAGRAPH GROUP */}
            <div className="flex flex-col gap-1 border-r border-slate-200 pr-3 shrink-0">
              {/* Row 1: Bullets, Numbering, Multilevel, Indent/Outdent */}
              <div className="flex items-center gap-0.5">
                {/* Bullets */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({ listType: currentFormatting.listType === 'bullet' ? 'none' : 'bullet', listBulletStyle: '•' })}
                    className={`p-1 rounded-l cursor-pointer ${
                      currentFormatting.listType === 'bullet'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Bullets"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulletsMenuOpen(!isBulletsMenuOpen)}
                    className="p-0.5 hover:bg-slate-100 rounded-r text-slate-500 cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isBulletsMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl p-2 z-50 grid grid-cols-3 gap-1">
                      {['•', '○', '■', '◆', '➢', '✔'].map(sym => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ listType: 'bullet', listBulletStyle: sym });
                            setIsBulletsMenuOpen(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center hover:bg-sky-50 border border-slate-200 rounded text-sm text-slate-800"
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Numbering */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onApplyFormat({ listType: currentFormatting.listType === 'number' ? 'none' : 'number', listBulletStyle: '1.' })}
                    className={`p-1 rounded-l cursor-pointer ${
                      currentFormatting.listType === 'number' || currentFormatting.listType === 'alpha' || currentFormatting.listType === 'roman'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Numbering"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNumberingMenuOpen(!isNumberingMenuOpen)}
                    className="p-0.5 hover:bg-slate-100 rounded-r text-slate-500 cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isNumberingMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 min-w-[130px] text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ listType: 'number', listBulletStyle: '1.' });
                          setIsNumberingMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50"
                      >
                        1. 2. 3.
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ listType: 'alpha', listBulletStyle: 'a)' });
                          setIsNumberingMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50"
                      >
                        a) b) c)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApplyFormat({ listType: 'roman', listBulletStyle: 'i.' });
                          setIsNumberingMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50"
                      >
                        i. ii. iii.
                      </button>
                    </div>
                  )}
                </div>

                {/* Decrease & Increase Indent */}
                <button
                  type="button"
                  onClick={() => onApplyFormat({ indent: Math.max(0, (currentFormatting.indent || 0) - 20) })}
                  className="p-1 hover:bg-slate-100 text-slate-700 hover:text-slate-950 rounded cursor-pointer"
                  title="Decrease Indent"
                >
                  <Outdent className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onApplyFormat({ indent: (currentFormatting.indent || 0) + 20 })}
                  className="p-1 hover:bg-slate-100 text-slate-700 hover:text-slate-950 rounded cursor-pointer"
                  title="Increase Indent"
                >
                  <Indent className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Alignment, Line Spacing, Shading, Borders */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'left' })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.alignment === 'left' || !currentFormatting.alignment
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Align Left (Ctrl+L)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'center' })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.alignment === 'center'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Align Center (Ctrl+E)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'right' })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.alignment === 'right'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Align Right (Ctrl+R)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onApplyFormat({ alignment: 'justify' })}
                  className={`p-1 rounded cursor-pointer ${
                    currentFormatting.alignment === 'justify'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Justify (Ctrl+J)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-300 mx-0.5" />

                {/* Line Spacing */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsLineSpacingMenuOpen(!isLineSpacingMenuOpen)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-0.5 cursor-pointer"
                    title="Line and Paragraph Spacing"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  {isLineSpacingMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl py-1 z-50 min-w-[120px] text-xs">
                      {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map(sp => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => {
                            onApplyFormat({ lineSpacing: sp });
                            setIsLineSpacingMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1 hover:bg-sky-50 flex items-center justify-between ${
                            currentFormatting.lineSpacing === sp ? 'font-bold text-sky-700' : 'text-slate-800'
                          }`}
                        >
                          <span>{sp.toFixed(2)}</span>
                          {currentFormatting.lineSpacing === sp && <Check className="w-3 h-3 text-sky-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shading */}
                <ColorPickerPopover
                  type="shading"
                  currentColor={currentFormatting.backgroundColor}
                  onSelectColor={hex => onApplyFormat({ backgroundColor: hex })}
                >
                  <div className="p-1 hover:bg-slate-100 rounded cursor-pointer" title="Shading (Background Color)">
                    <PaintBucket className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </ColorPickerPopover>
              </div>
            </div>

            {/* 4. STYLES GALLERY GROUP */}
            <div className="border-r border-slate-200 pr-3 shrink-0">
              <StyleGallery
                currentStyleName={currentFormatting.styleName || 'Normal'}
                onApplyStyle={(stylePreset: DocumentStylePreset) => {
                  onApplyFormat({
                    styleName: stylePreset.name,
                    fontFamily: stylePreset.formatting.fontFamily,
                    fontSize: stylePreset.formatting.fontSize,
                    bold: stylePreset.formatting.bold,
                    italic: stylePreset.formatting.italic,
                    color: stylePreset.formatting.color,
                    lineSpacing: stylePreset.lineSpacing,
                    alignment: stylePreset.alignment,
                    indent: stylePreset.indent,
                    backgroundColor: stylePreset.formatting.backgroundColor
                  });
                }}
              />
            </div>

            {/* 5. EDITING GROUP */}
            <div className="flex flex-col gap-1 pr-1 shrink-0">
              <button
                type="button"
                onClick={onOpenFindReplace}
                className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded text-[11px] font-medium cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-sky-600" />
                <span>Find</span>
              </button>
              <button
                type="button"
                onClick={onOpenFindReplace}
                className="flex items-center gap-1 px-2 py-1 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded text-[11px] font-medium cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Replace</span>
              </button>
            </div>

          </div>
        )}

        {/* ================= INSERT TAB (QUESTION BANK & INSERTIONS) ================= */}
        {activeTab === 'Insert' && (
          <div className="flex items-center gap-2 w-full">
            
            {/* FEATURE: DROP FROM QUESTION BANK CENTERED POPUP MODAL & BUTTON */}
            <div>
              <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsQuestionBankDropdownOpen(true)}
                  className="flex flex-col items-center justify-center p-1.5 hover:bg-indigo-100 text-indigo-900 rounded transition-colors px-3 cursor-pointer"
                  title="Drop verified objective questions from Question Bank"
                >
                  <Database className="w-5 h-5 mb-0.5 text-indigo-700" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black tracking-tight">Drop from Bank</span>
                    <ChevronDown className="w-2.5 h-2.5 text-indigo-700" />
                  </div>
                </button>
              </div>

              {/* Centered Popup Modal displaying all questions */}
              {isQuestionBankDropdownOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                  <div
                    ref={questionBankMenuRef}
                    className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl flex flex-col overflow-hidden max-h-[88vh] animate-in zoom-in-95 duration-150"
                  >
                    
                    {/* Modal Header */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 tracking-tight">
                              Drop from Question Bank
                            </h3>
                            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                              {bankQuestions.length} Questions Available
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Select any verified question from your repository to drop directly into the question paper
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDropRandomQuestion}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Drop a random verified question"
                        >
                          <Dices className="w-4 h-4 text-indigo-600" />
                          <span>Drop Random</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsQuestionBankDropdownOpen(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Search and Subject Filter Bar */}
                    <div className="p-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search questions by topic, keyword, or chapter..."
                          value={bankSearch}
                          onChange={e => setBankSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900"
                        />
                      </div>

                      {/* Quick Subject Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
                        {['all', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subj => (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => setBankSubject(subj)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                              bankSubject === subj
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {subj === 'all' ? 'All Subjects' : subj}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Questions Full List (All Questions Displayed) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 min-h-[350px]">
                      {loadingBank ? (
                        <div className="p-12 text-center text-sm text-slate-400 font-medium">
                          Loading bank questions...
                        </div>
                      ) : bankQuestions.length === 0 ? (
                        <div className="p-12 text-center text-sm text-slate-400 font-medium">
                          No questions found matching your search. Try another query or add new questions.
                        </div>
                      ) : (
                        bankQuestions.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="p-4 bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all flex flex-col gap-2.5 shadow-xs group"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                                  {q.subject || 'General'}
                                </span>
                                {q.chapter && (
                                  <span className="font-medium text-slate-500 text-[11px]">
                                    {q.chapter}
                                  </span>
                                )}
                                {q.difficulty && (
                                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                    {q.difficulty}
                                  </span>
                                )}
                                <span className="text-[11px] font-bold text-slate-700 ml-1">
                                  [{q.marks} Marks{q.negativeMarks ? `, -${q.negativeMarks}` : ''}]
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickDropQuestion(q)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Drop in Paper</span>
                              </button>
                            </div>

                            {/* Question Statement with LaTeX / Math support */}
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                              <MathTextRenderer text={q.rawText} />
                            </div>

                            {/* Question Images if present */}
                            {(() => {
                              const images: string[] = q.imageUrls && q.imageUrls.length > 0
                                ? q.imageUrls
                                : (q.imageUrl ? [q.imageUrl] : []);

                              if (images.length === 0) return null;

                              return (
                                <div className={`my-1 grid gap-1.5 ${
                                  images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                                }`}>
                                  {images.map((imgSrc, idx) => (
                                    <div key={idx} className="p-1 bg-slate-50 border border-slate-200 rounded max-h-32 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={imgSrc}
                                        alt={`Question illustration ${idx + 1}`}
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          if (target.src.endsWith('.heic') || target.src.endsWith('.HEIC')) {
                                            target.src = target.src.replace(/\.heic$/i, '.jpg');
                                          }
                                        }}
                                        className="max-h-28 object-contain rounded"
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Options Preview with Image support */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={opt.id || oIdx}
                                    className={`p-1.5 rounded-lg border flex flex-col gap-1 ${
                                      opt.isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                        : 'bg-slate-50 border-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-500 text-[11px]">
                                        ({opt.key || String.fromCharCode(97 + oIdx)}).
                                      </span>
                                      <span className="truncate">
                                        <MathTextRenderer text={opt.rawText || ''} />
                                      </span>
                                      {opt.isCorrect && (
                                        <span className="ml-auto text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                                          Ans
                                        </span>
                                      )}
                                    </div>
                                    {opt.imageUrl && (
                                      <img
                                        src={opt.imageUrl}
                                        alt={`Option ${opt.key}`}
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          if (target.src.endsWith('.heic') || target.src.endsWith('.HEIC')) {
                                            target.src = target.src.replace(/\.heic$/i, '.jpg');
                                          }
                                        }}
                                        className="max-h-16 object-contain rounded border border-slate-200 bg-white p-0.5"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Diagram thumbnail if present */}
                            {q.diagramSvg && (
                              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 max-h-24 overflow-hidden flex items-center justify-center">
                                <div className="scale-75" dangerouslySetInnerHTML={{ __html: q.diagramSvg }} />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-3.5 border-t border-slate-200 bg-slate-100/90 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Showing all {bankQuestions.length} questions in repository
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuestionBankDropdownOpen(false);
                            onOpenQuestionBank && onOpenQuestionBank();
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Full Question Bank Manager
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsQuestionBankDropdownOpen(false)}
                          className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Create Custom MCQ */}
            <button
              type="button"
              onClick={onOpenQuestionBuilder}
              className="flex flex-col items-center justify-center p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 rounded-lg transition-colors px-3 cursor-pointer shadow-2xs"
            >
              <HelpCircle className="w-5 h-5 mb-0.5 text-sky-600" />
              <span className="text-[10px] font-bold">+ MCQ Question</span>
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <button
              type="button"
              onClick={onInsertParagraph}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-3 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <Type className="w-5 h-5 mb-0.5 text-sky-600" />
              <span className="text-[10px] font-bold">+ Custom Text</span>
            </button>

            <button
              type="button"
              onClick={onOpenEquationModal}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <Sigma className="w-5 h-5 mb-0.5 text-amber-600" />
              <span className="text-[10px] font-bold">Equation</span>
            </button>

            <button
              type="button"
              onClick={onOpenSymbolsModal}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <Hash className="w-5 h-5 mb-0.5 text-indigo-600" />
              <span className="text-[10px] font-bold">Symbol</span>
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <button
              type="button"
              onClick={() => onInsertTable && onInsertTable(3, 3)}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <TableIcon className="w-5 h-5 mb-0.5 text-emerald-600" />
              <span className="text-[10px] font-bold">Table 3×3</span>
            </button>

            <button
              type="button"
              onClick={onInsertImage}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <ImageIcon className="w-5 h-5 mb-0.5 text-purple-600" />
              <span className="text-[10px] font-bold">Image</span>
            </button>

            <button
              type="button"
              onClick={onInsertHorizontalLine}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <div className="w-5 h-0.5 bg-slate-500 my-2" />
              <span className="text-[10px] font-bold">Divider Line</span>
            </button>

            <button
              type="button"
              onClick={onInsertPageBreak}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded transition-colors px-2 text-slate-700 hover:text-slate-950 cursor-pointer"
            >
              <Layers className="w-5 h-5 mb-0.5 text-sky-600" />
              <span className="text-[10px] font-bold">Page Break</span>
            </button>
          </div>
        )}

        {/* ================= MATH EQUATION TAB ================= */}
        {activeTab === 'Equation' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEquationModal}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sigma className="w-4 h-4" /> Open Math Equation Editor
            </button>
            <button
              type="button"
              onClick={onOpenSymbolsModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Hash className="w-4 h-4 text-indigo-600" /> Math Symbol Palette
            </button>
          </div>
        )}

        {/* ================= PHYSICS TAB ================= */}
        {activeTab === 'Physics' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPhysicsModal}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Atom className="w-4 h-4" /> Physics Formulas & Notation Library
            </button>
            <button
              type="button"
              onClick={onOpenUnitsModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-medium rounded cursor-pointer"
            >
              SI Units Library
            </button>
            <button
              type="button"
              onClick={onOpenConstantsModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-medium rounded cursor-pointer"
            >
              Physical Constants
            </button>
          </div>
        )}

        {/* ================= CHEMISTRY TAB ================= */}
        {activeTab === 'Chemistry' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenChemistryModal}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FlaskConical className="w-4 h-4" /> Chemistry Formula & Reaction Library
            </button>
          </div>
        )}

        {/* ================= FILE TAB ================= */}
        {activeTab === 'File' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSave}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
            >
              <Save className="w-5 h-5 mb-0.5 text-sky-600" />
              <span className="text-[10px] font-bold">Save Paper</span>
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <button
              type="button"
              onClick={onExportDocx}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Download className="w-5 h-5 mb-0.5 text-blue-600" />
              <span className="text-[10px] font-bold">Export DOCX</span>
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <Printer className="w-5 h-5 mb-0.5 text-emerald-600" />
              <span className="text-[10px] font-bold">Export PDF</span>
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <button
              type="button"
              onClick={onPrintPreview}
              className="flex flex-col items-center justify-center p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-purple-600 transition-colors cursor-pointer"
            >
              <Eye className="w-5 h-5 mb-0.5 text-purple-600" />
              <span className="text-[10px] font-bold">Print Preview</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
