import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Copy, Edit3, X, Save, Printer, FileText, Download, Columns, Droplet, Building2, CheckCircle2 } from 'lucide-react';
import { DocumentModel } from '@eduforge/shared';
import { api } from '../services/api.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { OptionLayoutRenderer } from '../questions/OptionLayoutRenderer.js';
import { CollegeExamPaper } from '../components/CollegeExamPaper.js';
import { getUserProfile } from '../utils/userProfile.js';

export interface TestItem {
  id: string;
  name: string;
  questions: number;
  duration: string;
  status: string;
  attempts: number;
}

interface TestsPageProps {
  documents?: DocumentModel[];
  onOpenDocument?: (id: string) => void;
  onOpenSelectQuestions?: (doc: DocumentModel) => void;
  onNewPaperWizard?: () => void;
  onDeleteDocument?: (id: string) => void;
  onDuplicateDocument?: (id: string) => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({
  documents: propDocs,
  onOpenDocument,
  onOpenSelectQuestions,
  onNewPaperWizard,
  onDeleteDocument,
  onDuplicateDocument
}) => {
  const user = getUserProfile();
  const [docs, setDocs] = useState<DocumentModel[]>(propDocs || []);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentModel | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDuration, setEditDuration] = useState('60');

  // Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentModel | null>(null);

  // College Exam Paper State
  const [instituteName, setInstituteName] = useState<string>('NLE SOCIETYS Dr RB PATIL MAHESH PU COLLEGE');
  const [isEditingInstitute, setIsEditingInstitute] = useState<boolean>(false);
  const [paperSet, setPaperSet] = useState<string>('1');
  const [standardName, setStandardName] = useState<string>('11 / PUC 1');
  const [columnLayout, setColumnLayout] = useState<'2-column' | '1-column'>('2-column');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('Test');
  const [isAnswerKeyMode, setIsAnswerKeyMode] = useState<boolean>(false);

  const previewExamQuestions = React.useMemo(() => {
    if (!previewDoc || !previewDoc.sections) return [];
    const list: any[] = [];
    let qIdx = 1;
    previewDoc.sections.forEach(sec => {
      if (sec.blocks) {
        sec.blocks.forEach((blk: any) => {
          const qObj = blk.question || blk.data?.question || blk;
          const qText = qObj?.rawText || blk.data?.text || blk.text || 'Question Statement';
          const qOpts = qObj?.options || blk.data?.options || [];
          list.push({
            id: blk.id || `q-${qIdx}`,
            questionNumber: qIdx,
            rawText: qText,
            content: qObj?.content || blk.data?.content,
            options: qOpts,
            correctOption: (qObj?.correct_option || qObj?.correctOption || qObj?.correctAnswer || 'A'),
            correctAnswer: (qObj?.correct_option || qObj?.correctOption || qObj?.correctAnswer || 'A'),
            marks: qObj?.marks || 4,
            negativeMarks: qObj?.negativeMarks || 1,
            diagramSvg: qObj?.diagramSvg || qObj?.diagram_svg,
            imageUrl: qObj?.imageUrl || qObj?.diagramUrl,
            explanationText: qObj?.explanationText || qObj?.solution || qObj?.explanation || '',
            solution: qObj?.explanationText || qObj?.solution || qObj?.explanation || '',
            sectionId: sec.id,
            sectionName: sec.title || 'Section A (MCQ)',
            subject: previewDoc.metadata?.subject || 'Physics'
          });
          qIdx++;
        });
      }
    });
    return list;
  }, [previewDoc]);

  const previewExamSections = React.useMemo(() => {
    if (!previewDoc || !previewDoc.sections) return [];
    return previewDoc.sections.map((sec, idx) => ({
      id: sec.id || `sec-${idx}`,
      name: sec.title || `Section ${String.fromCharCode(65 + idx)} (MCQ)`,
      instructions: sec.instructions
    }));
  }, [previewDoc]);

  const fetchLatestDocs = async () => {
    try {
      const latest = await api.getDocuments();
      setDocs(latest || []);
    } catch {
      if (propDocs) setDocs(propDocs);
    }
  };

  useEffect(() => {
    fetchLatestDocs();
  }, [propDocs]);

  const displayDocs = user.assigned_subject !== 'All'
    ? docs.filter(d => (((d as any).subject || d.metadata?.subject || '') + ' ' + (d.title || '')).toLowerCase().includes(user.assigned_subject.toLowerCase()))
    : docs;

  const toggleSelectDoc = (id: string) => {
    const sId = String(id);
    setSelectedDocIds(prev =>
      prev.includes(sId) ? prev.filter(x => x !== sId) : [...prev, sId]
    );
  };

  const toggleSelectAllDocs = () => {
    if (selectedDocIds.length === docs.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(docs.map(d => String(d.id)));
    }
  };

  const handleBulkDeleteDocs = async () => {
    if (selectedDocIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedDocIds.length} selected test paper(s)? Once deleted, your tests section will be updated.`)) {
      const idsToDelete = [...selectedDocIds];
      setDocs(prev => prev.filter(d => !idsToDelete.includes(String(d.id))));
      setSelectedDocIds([]);

      for (const id of idsToDelete) {
        try {
          if (onDeleteDocument) await onDeleteDocument(id);
          await api.deleteDocument(id);
        } catch (err) {
          console.error('Failed deleting doc:', err);
        }
      }
      fetchLatestDocs();
    }
  };

  const handleDeleteAllDocs = async () => {
    if (docs.length === 0) return;
    if (confirm(`Are you sure you want to delete ALL ${docs.length} test paper(s)? Once deleted, your tests section will be completely empty.`)) {
      const allIds = docs.map(d => String(d.id));
      setDocs([]);
      setSelectedDocIds([]);

      for (const id of allIds) {
        try {
          if (onDeleteDocument) await onDeleteDocument(id);
          await api.deleteDocument(id);
        } catch (err) {
          console.error('Failed deleting doc:', err);
        }
      }
      fetchLatestDocs();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this test paper?')) {
      // Optimistic delete
      setDocs(prev => prev.filter(d => String(d.id) !== String(id)));
      setSelectedDocIds(prev => prev.filter(x => x !== String(id)));
      try {
        if (onDeleteDocument) {
          await onDeleteDocument(id);
        }
        await api.deleteDocument(id);
      } catch (err) {
        console.error('Failed to delete document:', err);
      } finally {
        fetchLatestDocs();
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      if (onDuplicateDocument) {
        await onDuplicateDocument(id);
      } else {
        await api.duplicateDocument(id);
      }
    } catch (err) {
      console.error('Failed to duplicate document:', err);
    } finally {
      fetchLatestDocs();
    }
  };

  const handleOpenEditModal = (d: DocumentModel) => {
    setEditingDoc(d);
    setEditTitle(d.title || '');
    setEditSubject(d.metadata?.subject || '');
    setEditDuration(String(d.metadata?.timeAllowedMinutes || 60));
    setIsEditModalOpen(true);
  };

  const handleOpenPreviewModal = (d: DocumentModel) => {
    setPreviewDoc(d);
    setIsPreviewModalOpen(true);
  };

  /**
   * Generates a clean, multi-page PDF export without modal scrollbar clipping.
   */
  const handleGeneratePdfStream = () => {
    try {
      const sourceEl = document.querySelector('.printable-paper-sheet');
      if (!sourceEl) {
        window.print();
        return;
      }

      const existingRoot = document.getElementById('print-paper-export-root');
      if (existingRoot) {
        existingRoot.remove();
      }

      const cloneContainer = document.createElement('div');
      cloneContainer.id = 'print-paper-export-root';
      const clonedEl = sourceEl.cloneNode(true) as HTMLElement;
      clonedEl.style.margin = '0 auto';
      clonedEl.style.boxShadow = 'none';
      clonedEl.style.border = 'none';
      clonedEl.style.maxWidth = '100%';
      clonedEl.style.width = '100%';

      cloneContainer.appendChild(clonedEl);
      document.body.appendChild(cloneContainer);

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          const rootToRemove = document.getElementById('print-paper-export-root');
          if (rootToRemove) rootToRemove.remove();
        }, 1000);
      }, 300);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    }
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const updated: DocumentModel = {
      ...editingDoc,
      title: editTitle.trim(),
      metadata: {
        ...editingDoc.metadata,
        subject: editSubject.trim(),
        timeAllowedMinutes: Number(editDuration) || 60
      }
    };

    // Optimistic UI update
    setDocs(prev => prev.map(item => String(item.id) === String(editingDoc.id) ? updated : item));
    setIsEditModalOpen(false);

    try {
      await api.updateDocument(editingDoc.id, updated);
    } catch (err) {
      console.error('Failed to update test paper:', err);
    } finally {
      fetchLatestDocs();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Tests</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generate, publish, preview, edit, and manage all your test papers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedDocIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDeleteDocs}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedDocIds.length})
            </button>
          )}

          {displayDocs.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllDocs}
              className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All Tests
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onNewPaperWizard) onNewPaperWizard();
            }}
            className="px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + Create / Generate Test
          </button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-3 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={displayDocs.length > 0 && selectedDocIds.length === displayDocs.length}
                  onChange={toggleSelectAllDocs}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                />
              </th>
              <th className="px-5 py-3">Test Paper Title</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Questions</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {displayDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Trash2 className="w-8 h-8 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tests section is completely empty.</p>
                    <p className="text-xs text-slate-400">No tests created yet. Click "+ Create / Generate Test" to generate your first test paper.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayDocs.map(d => {
                const totalQ = d.sections?.reduce((acc, s) => acc + (s.blocks?.length || 0), 0) || (d.metadata as any)?.totalQuestions || 25;
                const durationText = `${d.metadata?.timeAllowedMinutes || (d.metadata as any)?.durationMinutes || 60} min`;
                const subjectText = d.metadata?.subject || 'Physics & Chemistry';
                const isSelected = selectedDocIds.includes(String(d.id));

                return (
                  <tr key={d.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}>
                    <td className="px-3 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDoc(d.id)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <button
                        type="button"
                        onClick={() => handleOpenPreviewModal(d)}
                        className="hover:text-teal-700 text-left transition-colors font-bold cursor-pointer"
                      >
                        {d.title}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-semibold">{subjectText}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{totalQ}</td>
                    <td className="px-5 py-3.5 text-slate-600">{durationText}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
                        Published
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreviewModal(d)}
                          className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Preview Test Paper"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenSelectQuestions) {
                              onOpenSelectQuestions(d);
                            } else {
                              handleOpenEditModal(d);
                            }
                          }}
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Edit Test Paper, Sections, Questions & Options"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(d.id)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Duplicate Test Paper"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete Test Paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Test Paper Modal */}
      {isEditModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>Edit Test Paper</span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Paper Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={e => setEditSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={editDuration}
                  onChange={e => setEditDuration(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    if (onOpenSelectQuestions && editingDoc) {
                      onOpenSelectQuestions(editingDoc);
                    } else if (onOpenDocument) {
                      onOpenDocument(editingDoc.id);
                    }
                  }}
                  className="px-3.5 py-2 text-teal-700 hover:bg-teal-50 font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Open Select Questions Editor
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Preview Modal with Space-Saving 2-Column College Exam Layout */}
      {isPreviewModalOpen && previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header Toolbar */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">{previewDoc.title}</h3>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  {previewExamQuestions.length} Qs • {columnLayout === '2-column' ? '📰 2-Column (Saves 70% Paper)' : '📄 1-Column'}
                </span>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 2-Column vs 1-Column Toggle */}
                <button
                  type="button"
                  onClick={() => setColumnLayout(prev => prev === '2-column' ? '1-column' : '2-column')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    columnLayout === '2-column'
                      ? 'bg-sky-50 text-sky-800 border-sky-300 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Toggle 2-column compact newspaper exam layout to save 70% paper"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{columnLayout === '2-column' ? '2-Col Paper Saver' : '1-Col'}</span>
                </button>

                {/* Watermark Toggle */}
                <button
                  type="button"
                  onClick={() => setShowWatermark(prev => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    showWatermark
                      ? 'bg-teal-50 text-teal-800 border-teal-300'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                  title="Toggle background watermark"
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Watermark {showWatermark ? 'ON' : 'OFF'}</span>
                </button>

                {/* Edit Institute Header Toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditingInstitute(prev => !prev)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                  title="Customize College / Institute Title on Paper"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Header</span>
                </button>

                {/* View Mode Toggle Switch */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setIsAnswerKeyMode(false)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      !isAnswerKeyMode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📄 Paper
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnswerKeyMode(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      isAnswerKeyMode ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✓ Key
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 rounded-lg cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Header Editor Drawer if open */}
            {isEditingInstitute && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex-1 min-w-[240px]">
                  <label className="block text-[10px] font-bold uppercase text-amber-900 mb-0.5">College / Institute Name</label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={e => setInstituteName(e.target.value)}
                    placeholder="e.g. NLE SOCIETYS Dr RB PATIL MAHESH PU COLLEGE"
                    className="w-full p-1.5 bg-white border border-amber-300 rounded font-bold text-slate-900 text-xs"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold uppercase text-amber-900 mb-0.5">Paper Set</label>
                  <input
                    type="text"
                    value={paperSet}
                    onChange={e => setPaperSet(e.target.value)}
                    placeholder="1 or A"
                    className="w-full p-1.5 bg-white border border-amber-300 rounded font-bold text-slate-900 text-xs"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-bold uppercase text-amber-900 mb-0.5">Standard</label>
                  <input
                    type="text"
                    value={standardName}
                    onChange={e => setStandardName(e.target.value)}
                    placeholder="11 / PUC 1"
                    className="w-full p-1.5 bg-white border border-amber-300 rounded font-bold text-slate-900 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingInstitute(false)}
                  className="mt-3.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

            {/* Test Paper Body Preview Sheet */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-200/80">
              <div className="printable-paper-sheet max-w-[850px] mx-auto bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
                <CollegeExamPaper
                  instituteName={instituteName}
                  examTitle={previewDoc.title.toUpperCase()}
                  subjectNames={previewDoc.metadata?.subject || 'Physics, Chemistry, Biology'}
                  standard={standardName}
                  paperSet={paperSet}
                  duration={previewDoc.metadata?.timeAllowedMinutes || 60}
                  totalMarks={previewDoc.metadata?.maxMarks || 100}
                  sections={previewExamSections}
                  allQuestions={previewExamQuestions}
                  isAnswerKeyMode={isAnswerKeyMode}
                  showWatermark={showWatermark}
                  watermarkText={watermarkText}
                  columnLayout={columnLayout}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePdfStream}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition-all active:scale-95 cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Export as PDF / Print
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
