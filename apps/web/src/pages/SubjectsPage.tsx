import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';

import { getUserProfile } from '../utils/userProfile.js';

export interface SubjectItem {
  id?: number | string;
  name: string;
  code: string;
  chapters: number;
  questions: number;
  color?: string;
  status?: string;
}

interface SubjectsPageProps {
  subjectsList?: SubjectItem[];
  onAddSubject?: (newSub: SubjectItem) => void;
  onEditSubject?: (originalCode: string, updatedSub: SubjectItem) => void;
  onDeleteSubject?: (code: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  subjectsList,
  onAddSubject,
  onEditSubject,
  onDeleteSubject
}) => {
  const user = getUserProfile();
  const [subjects, setSubjects] = useState<SubjectItem[]>(subjectsList || []);

  const loadBackendSubjects = async () => {
    try {
      const data = await api.getSubjects();
      if (data && Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (e) {
      console.error('Failed to load subjects:', e);
    }
  };

  useEffect(() => {
    loadBackendSubjects();
  }, []);

  useEffect(() => {
    if (subjectsList && subjectsList.length > 0) {
      setSubjects(subjectsList);
    }
  }, [subjectsList]);

  const displaySubjects = user.assigned_subject !== 'All'
    ? subjects.filter(s => s.name.toLowerCase() === user.assigned_subject.toLowerCase())
    : subjects;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [chaptersCount, setChaptersCount] = useState<number | string>(0);
  const [questionsCount, setQuestionsCount] = useState<number | string>(0);

  const handleOpenAdd = () => {
    setEditingCode(null);
    setName('');
    setCode('');
    setChaptersCount(0);
    setQuestionsCount(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SubjectItem) => {
    setEditingCode(s.code);
    setName(s.name);
    setCode(s.code);
    setChaptersCount(s.chapters || 0);
    setQuestionsCount(s.questions || 0);
    setIsModalOpen(true);
  };

  const handleDelete = async (s: SubjectItem) => {
    const subIdentifier = s.name || s.code;
    if (confirm(`Are you sure you want to delete subject "${subIdentifier}"?`)) {
      const targetId = s.id || s.code;
      // Optimistic delete
      setSubjects(prev => prev.filter(item => item.code !== s.code && item.id !== s.id));
      try {
        if (onDeleteSubject) {
          onDeleteSubject(s.code);
        }
        await api.deleteSubject(targetId);
      } catch (err) {
        console.error('Failed deleting subject:', err);
      } finally {
        loadBackendSubjects();
      }
    }
  };

  const handleSubmitSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const formattedCode = code.trim().toUpperCase();

    if (editingCode) {
      const updatedSub: SubjectItem = {
        name: name.trim(),
        code: formattedCode,
        chapters: Number(chaptersCount) || 0,
        questions: Number(questionsCount) || 0,
        status: 'Active'
      };

      if (onEditSubject) {
        onEditSubject(editingCode, updatedSub);
      } else {
        const subToEdit = subjects.find(s => s.code === editingCode);
        if (subToEdit?.id) {
          await api.updateSubject(subToEdit.id, updatedSub);
        }
        setSubjects(prev => prev.map(s => (s.code === editingCode ? updatedSub : s)));
      }
    } else {
      const newSub: SubjectItem = {
        name: name.trim(),
        code: formattedCode,
        chapters: Number(chaptersCount) || 0,
        questions: Number(questionsCount) || 0,
        status: 'Active'
      };

      if (onAddSubject) {
        onAddSubject(newSub);
      } else {
        const created = await api.createSubject(newSub);
        setSubjects(prev => [...prev, created || newSub]);
      }
    }

    setName('');
    setCode('');
    setChaptersCount(0);
    setQuestionsCount(0);
    setEditingCode(null);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage subjects ({displaySubjects.length} active).</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 sm:px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> + Add Subject
        </button>
      </div>

      {/* Wireframe Panel Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[540px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Chapters</th>
              <th className="px-5 py-3">Questions</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {displaySubjects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                  No subjects created yet. Click "+ Add Subject" to add your first subject.
                </td>
              </tr>
            ) : (
              displaySubjects.map(s => (
                <tr key={s.id || s.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{s.name}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{s.code}</td>
                  <td className="px-5 py-3.5">{s.chapters || 0}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{(s.questions || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
                      {s.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>{editingCode ? 'Edit Subject' : 'Add Subject'}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSubject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="Biology"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (!editingCode && !code) setCode(e.target.value.substring(0, 3).toUpperCase());
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="BIO"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md shadow-2xs cursor-pointer"
                >
                  {editingCode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
