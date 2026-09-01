import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Question } from '@eduforge/shared';
import { Search, Plus, Trash2, Edit3, Eye, Filter, BookOpen, Layers, Send, Bookmark } from 'lucide-react';
import { StudentPreviewDrawer } from '../components/StudentPreviewDrawer.js';
import { formatQuestionCode } from '../utils/questionCode.js';
import { MathTextRenderer } from '../equation/MathTextRenderer.js';
import { getUserProfile } from '../utils/userProfile.js';

export const getPersistedStatusMap = (): Record<string, 'saved' | 'published'> => {
  try {
    const raw = localStorage.getItem('eduforge_question_status_map');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setPersistedStatus = (id: string, status: 'saved' | 'published') => {
  if (!id) return;
  try {
    const map = getPersistedStatusMap();
    map[id] = status;
    localStorage.setItem('eduforge_question_status_map', JSON.stringify(map));
  } catch {}
};

export const setPersistedStatusMultiple = (ids: string[], status: 'saved' | 'published') => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    const map = getPersistedStatusMap();
    ids.forEach(id => {
      if (id) map[id] = status;
    });
    localStorage.setItem('eduforge_question_status_map', JSON.stringify(map));
  } catch {}
};

export const isQuestionPublished = (q: any): boolean => {
  if (!q) return false;
  if (typeof q.source === 'string' && q.source.startsWith('published:')) return true;
  const statusMap = getPersistedStatusMap();
  if (q.id && statusMap[q.id]) {
    return statusMap[q.id] === 'published';
  }
  if (q.status === 'published') return true;
  if (q.source === 'published') return true;
  if (q.isSystem === true) return true;
  if (q.isPublished === true) return true;
  return false;
};

export const isQuestionPending = (q: any): boolean => {
  if (!q) return false;
  if (typeof q.source === 'string' && q.source.startsWith('pending:')) return true;
  return false;
};

export const isQuestionSaved = (q: any): boolean => {
  if (!q) return false;
  if (q.source === 'saved') return true;
  return !isQuestionPublished(q) && !isQuestionPending(q);
};

interface QuestionBankPageProps {
  mode?: 'all' | 'saved' | 'published' | 'approvals';
  onBackToDashboard?: () => void;
  onOpenCreateQuestion?: (q?: Question) => void;
  selectedChapter?: { id?: string; title?: string; subject?: string } | null;
  onClearChapterFilter?: () => void;
}

export const QuestionBankPage: React.FC<QuestionBankPageProps> = ({
  mode = 'all',
  onOpenCreateQuestion,
  selectedChapter,
  onClearChapterFilter
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getUserProfile();
  const userSubject = user.assigned_subject || 'All';
  const userRoleStr = user.role === 'admin' ? 'System Admin' : user.assigned_subject === 'None' ? 'System' : `${user.assigned_subject} Faculty`;

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(userSubject !== 'All' ? userSubject : 'all');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fast Preview Drawer State
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Admin Approvals Tab State
  const [adminApprovalTab, setAdminApprovalTab] = useState<'sent' | 'received'>('sent');

  useEffect(() => {
    loadMetadataAndQuestions();
  }, [difficultyFilter]);

  useEffect(() => {
    if (selectedChapter) {
      if (selectedChapter.id) {
        setSelectedChapterFilter(selectedChapter.id);
      } else if (selectedChapter.title) {
        setSelectedChapterFilter(selectedChapter.title);
      }
      if (selectedChapter.subject) {
        setSelectedSubject(selectedChapter.subject);
      }
    }
  }, [selectedChapter]);

  const loadMetadataAndQuestions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (difficultyFilter !== 'all') params.difficulty = difficultyFilter;

      const [qData, subData, chData] = await Promise.all([
        api.getQuestions(params),
        api.getSubjects(),
        api.getChapters()
      ]);

      let filteredSubs = subData || [];
      let filteredChs = chData || [];

      if (userSubject !== 'All') {
        const uSubLower = userSubject.toLowerCase();
        filteredSubs = filteredSubs.filter((s: any) => (s.name || '').toLowerCase().includes(uSubLower));
        filteredChs = filteredChs.filter((c: any) => ((c.subject_name || c.subject || '')).toLowerCase().includes(uSubLower));
      }

      setQuestions(qData || []);
      setSubjects(filteredSubs);
      setChapters(filteredChs);
    } catch (err) {
      console.error('Failed to load questions or metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectQuestion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(q => q.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected question(s)?`)) {
      const idsToDelete = [...selectedIds];
      setQuestions(prev => prev.filter(q => !idsToDelete.includes(q.id)));
      setSelectedIds([]);
      try {
        await api.deleteMultipleQuestions(idsToDelete);
      } catch (err) {
        console.error('Failed bulk delete:', err);
      } finally {
        loadMetadataAndQuestions();
      }
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Publish ${selectedIds.length} selected question(s) to Published Questions?`)) {
      const idsToPublish = [...selectedIds];
      const questionsToUpdate = questions.filter(q => idsToPublish.includes(q.id));
      const publishedSource = `published:${userRoleStr}`;

      setPersistedStatusMultiple(idsToPublish, 'published');
      setQuestions(prev =>
        prev.map(q =>
          idsToPublish.includes(q.id)
            ? { ...q, status: 'published', source: publishedSource, isSystem: true, isPublished: true }
            : q
        )
      );
      setSelectedIds([]);

      try {
        for (const q of questionsToUpdate) {
          await api.updateQuestion(q.id, {
            ...q,
            status: 'published',
            source: publishedSource,
            isSystem: true,
            isPublished: true
          } as any);
        }
        alert(`Successfully published ${idsToPublish.length} question(s) to Published Questions!`);
      } catch (err) {
        console.error('Failed bulk publish:', err);
      } finally {
        loadMetadataAndQuestions();
      }
    }
  };

  const handleSendForApproval = async (targetSubject: string) => {
    if (selectedIds.length === 0) return;
    
    const idsToSend = [...selectedIds];
    const questionsToUpdate = questions.filter(q => idsToSend.includes(q.id));

    // Validate that questions match the target subject
    const mismatchedQuestions = questionsToUpdate.filter(q => {
      const qSub = (q.subject || '').toLowerCase();
      const targetSub = targetSubject.toLowerCase();
      if (qSub && !qSub.includes(targetSub) && qSub !== targetSub) {
        return true;
      }
      return false;
    });

    if (mismatchedQuestions.length > 0) {
      alert(`Validation Error: You selected ${mismatchedQuestions.length} question(s) that do not match the ${targetSubject} subject (e.g. found "${mismatchedQuestions[0].subject || 'Unknown'}"). Please send only ${targetSubject} questions to the ${targetSubject} Faculty.`);
      return;
    }

    if (confirm(`Send ${selectedIds.length} selected question(s) to ${targetSubject} Faculty for approval?`)) {
      const pendingSource = `pending:${targetSubject}`;

      setQuestions(prev =>
        prev.map(q =>
          idsToSend.includes(q.id)
            ? { ...q, source: pendingSource }
            : q
        )
      );
      setSelectedIds([]);

      try {
        for (const q of questionsToUpdate) {
          await api.updateQuestion(q.id, {
            ...q,
            source: pendingSource
          } as any);
        }
        alert(`Successfully sent ${idsToSend.length} question(s) to ${targetSubject} Faculty for approval!`);
      } catch (err) {
        console.error('Failed to send for approval:', err);
      } finally {
        loadMetadataAndQuestions();
      }
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Move ${selectedIds.length} selected question(s) back to Saved Questions?`)) {
      const idsToSave = [...selectedIds];
      const questionsToUpdate = questions.filter(q => idsToSave.includes(q.id));

      setPersistedStatusMultiple(idsToSave, 'saved');
      setQuestions(prev =>
        prev.map(q =>
          idsToSave.includes(q.id)
            ? { ...q, status: 'saved', source: 'saved', isSystem: false, isPublished: false }
            : q
        )
      );
      setSelectedIds([]);

      try {
        for (const q of questionsToUpdate) {
          await api.updateQuestion(q.id, {
            ...q,
            status: 'saved',
            source: 'saved',
            isSystem: false,
            isPublished: false
          } as any);
        }
        alert(`Successfully moved ${idsToSave.length} question(s) back to Saved Questions!`);
      } catch (err) {
        console.error('Failed bulk unpublish:', err);
      } finally {
        loadMetadataAndQuestions();
      }
    }
  };

  const handleFastDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (confirm('Delete this question from your question bank?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));

      try {
        await api.deleteQuestion(id);
      } catch (err) {
        console.error('Failed to delete question on server:', err);
        loadMetadataAndQuestions();
      }
    }
  };

  const handleFastPreview = async (q: Question, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewQuestion(q);
    setIsPreviewOpen(true);
    try {
      if (q.id) {
        const fullDetail = await api.getQuestion(q.id);
        if (fullDetail) {
          setPreviewQuestion(fullDetail);
        }
      }
    } catch {
      // Fallback
    }
  };


  const handleEditQuestion = async (q: Question, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onOpenCreateQuestion) return;
    try {
      if (q.id) {
        const fullDetail = await api.getQuestion(q.id);
        if (fullDetail) {
          onOpenCreateQuestion(fullDetail);
          return;
        }
      }
    } catch {
      // Fallback
    }
    onOpenCreateQuestion(q);
  };

  const getCleanQuestionText = (htmlText?: string) => {
    if (!htmlText) return 'Question statement text';
    const clean = htmlText
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean || 'Question statement text';
  };

  // Available chapters filtered by selected subject or faculty assigned subject
  const availableChapters = chapters.filter(c => {
    const effectiveSubject = userSubject !== 'All' ? userSubject : selectedSubject;
    if (effectiveSubject === 'all') return true;
    const subName = (c.subject_name || c.subject || c.subjects?.name || '').toLowerCase();
    const subId = (c.subject_id || c.subjectId || '').toLowerCase();
    const targetSubLower = effectiveSubject.toLowerCase();
    return subName === targetSubLower || subName.includes(targetSubLower) || targetSubLower.includes(subName) || subId === targetSubLower;
  });

  const filteredList = questions.filter(q => {
    // Mode Scoping (All vs Saved vs Published vs Approvals)
    if (mode === 'saved' && !isQuestionSaved(q)) return false;
    if (mode === 'published' && !isQuestionPublished(q)) return false;
    if (mode === 'approvals') {
      if (user.role === 'admin') {
        if (adminApprovalTab === 'sent') {
          if (!isQuestionPending(q)) return false;
        } else {
          // received: published by faculty (not System Admin)
          if (!isQuestionPublished(q)) return false;
          if (q.source === 'published:System Admin') return false;
        }
      } else {
        if (!isQuestionPending(q)) return false;
        if (userSubject !== 'All') {
          const expectedPending = `pending:${userSubject}`;
          if (q.source !== expectedPending) return false;
        }
      }
    }

    // 1. Role-based user scoping
    if (userSubject !== 'All') {
      const userSubLower = userSubject.toLowerCase();
      const qSubLower = (q.subject || '').toLowerCase();
      if (qSubLower && !qSubLower.includes(userSubLower) && !userSubLower.includes(qSubLower)) {
        return false;
      }
    }

    // 2. Subject Filter
    if (selectedSubject !== 'all') {
      const targetSubLower = selectedSubject.toLowerCase();
      const qSubLower = (q.subject || '').toLowerCase();
      const qSubId = ((q as any).subject_id || (q as any).subjectId || '').toLowerCase();
      if (qSubLower !== targetSubLower && !qSubLower.includes(targetSubLower) && qSubId !== targetSubLower) {
        return false;
      }
    }

    // 3. Chapter Filter Dropdown or Active Selected Chapter
    const activeChapterId = selectedChapterFilter !== 'all' ? selectedChapterFilter : (selectedChapter?.id || '');
    const activeChapterTitle = selectedChapterFilter !== 'all' ? '' : (selectedChapter?.title || '');

    if (activeChapterId || activeChapterTitle) {
      const targetCh = chapters.find(c => c.id === activeChapterId || c.title === activeChapterId || c.title === activeChapterTitle);
      const chTitle = (targetCh?.title || activeChapterTitle || activeChapterId).toLowerCase();
      const chId = (targetCh?.id || activeChapterId).toLowerCase();
      const qChId = String((q as any).chapter_id || (q as any).chapterId || '').toLowerCase();
      const qChapter = String((q as any).chapter || (q as any).chapter_name || (q as any).topic || '').toLowerCase();
      const code = formatQuestionCode(q).toLowerCase();

      let codeMatches = false;
      if (chTitle.includes('living world') && (code.includes('liv') || code.includes('01'))) codeMatches = true;
      if (chTitle.includes('animal kingdom') && (code.includes('ani') || code.includes('02'))) codeMatches = true;
      if (chTitle.includes('thermodynamics') && (code.includes('the') || code.includes('02'))) codeMatches = true;
      if (chTitle.includes('basic concepts') && (code.includes('sbc') || code.includes('01'))) codeMatches = true;
      if (chTitle.includes('motion in a plane') && (code.includes('mip') || code.includes('02'))) codeMatches = true;
      if (chTitle.includes('units and measurements') && (code.includes('uam') || code.includes('01'))) codeMatches = true;

      const matches =
        (chId && qChId && (qChId === chId || qChId.includes(chId) || chId.includes(qChId))) ||
        (chTitle && qChapter && (qChapter === chTitle || qChapter.includes(chTitle) || chTitle.includes(qChapter))) ||
        codeMatches;

      if (!matches) return false;
    }

    // 5. Search Text Filter
    if (search.trim()) {
      const s = search.toLowerCase();
      const code = formatQuestionCode(q).toLowerCase();
      const statement = getCleanQuestionText(q.rawText).toLowerCase();
      const qSub = (q.subject || '').toLowerCase();
      const qCh = String((q as any).chapter || (q as any).topic || '').toLowerCase();
      if (!code.includes(s) && !statement.includes(s) && !qSub.includes(s) && !qCh.includes(s)) return false;
    }

    // 6. Status Filter
    if (statusFilter === 'Draft' && q.isSystem) return false;
    if (statusFilter === 'Published' && !q.isSystem) return false;

    return true;
  });

  const currentPreviewIndex = previewQuestion
    ? filteredList.findIndex(q => q.id === previewQuestion.id)
    : -1;

  const handlePrevQuestion = () => {
    if (currentPreviewIndex > 0) {
      handleFastPreview(filteredList[currentPreviewIndex - 1]);
    }
  };

  const handleNextQuestion = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < filteredList.length - 1) {
      handleFastPreview(filteredList[currentPreviewIndex + 1]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
            {mode === 'saved' ? 'Saved Questions' : mode === 'published' ? 'Published Questions' : mode === 'approvals' ? 'Approvals' : 'Question Bank'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {mode === 'saved'
              ? `Manage newly created draft and saved questions (${filteredList.length} questions displayed). Select questions to send for approval or publish.`
              : mode === 'published'
              ? `View active published question repository (${filteredList.length} questions displayed). Select questions to move back to Saved Questions.`
              : mode === 'approvals'
              ? `Review questions sent to you for approval (${filteredList.length} pending). Select questions to publish them.`
              : `Manage, preview, and organize your question repository (${filteredList.length} questions displayed of ${questions.length} total).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === 'saved' && selectedIds.length > 0 && (
            <div className="flex items-center bg-teal-50 border border-teal-200 rounded-lg px-2 shadow-sm transition-all hover:shadow-md">
              <select
                className="bg-transparent text-teal-800 text-xs font-bold outline-none cursor-pointer py-2 appearance-none pr-4"
                onChange={(e) => {
                  if (e.target.value) {
                    handleSendForApproval(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Send for Approval...</option>
                <option value="Physics">Physics Faculty</option>
                <option value="Chemistry">Chemistry Faculty</option>
                <option value="Biology">Biology Faculty</option>
                <option value="Mathematics">Mathematics Faculty</option>
              </select>
            </div>
          )}

          {mode === 'saved' && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkPublish}
              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans"
            >
              <Send className="w-3.5 h-3.5" /> Publish Selected ({selectedIds.length})
            </button>
          )}

          {mode === 'approvals' && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkPublish}
              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans"
            >
              <Send className="w-3.5 h-3.5" /> Publish Selected ({selectedIds.length})
            </button>
          )}

          {mode === 'published' && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkUnpublish}
              className="px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans"
            >
              <Bookmark className="w-3.5 h-3.5" /> Save Question (Move to Saved) ({selectedIds.length})
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3.5 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCreateQuestion && onOpenCreateQuestion()}
            className="px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" /> Create Question
          </button>
        </div>
      </div>

      {/* Admin Approvals Tabs */}
      {mode === 'approvals' && user.role === 'admin' && (
        <div className="flex border-b border-slate-200 gap-6 mt-2">
          <button
            type="button"
            className={`pb-2.5 font-bold text-xs sm:text-sm transition-colors ${adminApprovalTab === 'sent' ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => {
              setAdminApprovalTab('sent');
              setSelectedIds([]);
            }}
          >
            Sent (Pending Faculty Approval)
          </button>
          <button
            type="button"
            className={`pb-2.5 font-bold text-xs sm:text-sm transition-colors ${adminApprovalTab === 'received' ? 'text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => {
              setAdminApprovalTab('received');
              setSelectedIds([]);
            }}
          >
            Received (Published by Faculty)
          </button>
        </div>
      )}

      {/* Chapter Filter Active Banner */}
      {selectedChapter && selectedChapter.title && (
        <div className="bg-teal-50/90 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-medium text-teal-900 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-teal-950">Active Chapter Banner:</span>
            <span className="px-2.5 py-0.5 bg-teal-700 text-white rounded-md font-mono font-bold text-[11px]">
              {selectedChapter.title}
            </span>
            <span className="text-teal-800 font-bold ml-1">
              — {filteredList.length > 0 ? `${filteredList.length} question(s) found for this topic.` : '0 questions exist.'}
            </span>
          </div>
          {onClearChapterFilter && (
            <button
              type="button"
              onClick={() => {
                setSelectedChapterFilter('all');
                if (onClearChapterFilter) onClearChapterFilter();
              }}
              className="px-3 py-1 bg-white hover:bg-teal-100 border border-teal-300 text-teal-800 font-bold rounded-md transition-colors cursor-pointer text-xs self-start sm:self-auto"
            >
              Clear Banner Filter
            </button>
          )}
        </div>
      )}

      {/* Search & Comprehensive Filter Row */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Instant Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by code, keyword, or statement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900"
            />
          </div>

          {/* Subject Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedChapterFilter('all');
              }}
              disabled={userSubject !== 'All'}
              className="w-full py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900 font-semibold cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {userSubject === 'All' && <option value="all">All Subjects</option>}
              {subjects.map(s => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name} ({s.code || s.name.substring(0, 3)})
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedChapterFilter}
              onChange={e => setSelectedChapterFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900 font-semibold cursor-pointer"
            >
              <option value="all">All Chapters</option>
              {availableChapters.map(c => (
                <option key={c.id || c.title} value={c.id || c.title}>
                  {c.title} ({c.code || 'CH'})
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter Dropdown */}
          <div className="relative">
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="w-full py-2.5 px-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-white text-slate-900 font-semibold cursor-pointer"
            >
              <option value="all">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Quick Reset */}
        {(selectedSubject !== 'all' || selectedChapterFilter !== 'all' || difficultyFilter !== 'all' || search.trim()) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                Filters applied: 
                {selectedSubject !== 'all' && <b className="text-teal-700 ml-1">Subject: {selectedSubject}</b>}
                {selectedChapterFilter !== 'all' && <b className="text-teal-700 ml-1">· Chapter: {chapters.find(c => c.id === selectedChapterFilter)?.title || selectedChapterFilter}</b>}
                {difficultyFilter !== 'all' && <b className="text-teal-700 ml-1">· Difficulty: {difficultyFilter}</b>}
                {search.trim() && <b className="text-teal-700 ml-1">· Search: "{search}"</b>}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSubject('all');
                setSelectedChapterFilter('all');
                setDifficultyFilter('all');
                setStatusFilter('all');
                setSearch('');
                if (onClearChapterFilter) onClearChapterFilter();
              }}
              className="text-teal-700 hover:text-teal-900 hover:underline cursor-pointer self-start sm:self-auto"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Questions Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredList.length > 0 && selectedIds.length === filteredList.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5">Question & Code</th>
                <th className="px-5 py-3.5">Subject & Chapter</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5">Marks</th>
                <th className="px-5 py-3.5 text-right">Instant Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-semibold">
                    Loading questions from bank...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-semibold">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <p className="text-slate-700 font-bold text-sm">
                        No questions match your current subject or chapter filter.
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Try selecting "All Subjects" / "All Chapters" or click "Create Question".
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((q, idx) => {
                  const isSelected = selectedIds.includes(q.id);
                  const qChapterName = (q as any).chapter_name || (q as any).chapter || (q as any).topic || 'General Chapter';

                  return (
                    <tr
                      key={q.id || idx}
                      onClick={() => handleFastPreview(q as Question)}
                      className={`hover:bg-teal-50/40 transition-colors cursor-pointer group ${isSelected ? 'bg-teal-50/50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => toggleSelectQuestion(q.id, e as any)}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Question Statement & Dynamic Code */}
                      <td className="px-5 py-3.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <b className="text-[#007a87] font-mono text-[11px] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-black shrink-0">
                            {formatQuestionCode(q)}
                          </b>
                        </div>
                        <span className="text-slate-900 font-semibold line-clamp-2 mt-1 block">
                          <MathTextRenderer text={getCleanQuestionText(q.rawText)} />
                        </span>
                      </td>

                      {/* Subject & Chapter Badges */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 flex flex-col items-start">
                          <span className="inline-block font-bold text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                            {q.subject || 'General'}
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
                            {qChapterName}
                          </p>
                          {typeof q.source === 'string' && q.source.startsWith('published:') && (
                            <span className="inline-block font-bold text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
                              Published by {q.source.replace('published:', '')}
                            </span>
                          )}
                          {typeof q.source === 'string' && q.source.startsWith('pending:') && (
                            <span className="inline-block font-bold text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            (q.difficulty || '').toLowerCase() === 'easy'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : (q.difficulty || '').toLowerCase() === 'hard'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {q.difficulty || 'Medium'}
                        </span>
                      </td>

                      {/* Marks */}
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">
                        +{q.marks || 4} / -{q.negativeMarks || 1}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Instant Fast Preview Button */}
                          <button
                            type="button"
                            onClick={e => handleFastPreview(q as Question, e)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-lg transition-all shadow-2xs hover:shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Instant Preview Question"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={e => handleEditQuestion(q as Question, e)}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Instant Fast Delete Button */}
                          <button
                            type="button"
                            onClick={e => q.id && handleFastDelete(q.id, e)}
                            className="p-1.5 border border-slate-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Instant Fast Delete"
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
      </div>

      {/* Student Preview Drawer */}
      <StudentPreviewDrawer
        isOpen={isPreviewOpen}
        question={previewQuestion}
        onClose={() => setIsPreviewOpen(false)}
        onPrevious={handlePrevQuestion}
        onNext={handleNextQuestion}
        hasPrevious={currentPreviewIndex > 0}
        hasNext={currentPreviewIndex >= 0 && currentPreviewIndex < filteredList.length - 1}
        currentIndex={currentPreviewIndex >= 0 ? currentPreviewIndex : 0}
        totalQuestions={filteredList.length}
      />
    </div>
  );
};
