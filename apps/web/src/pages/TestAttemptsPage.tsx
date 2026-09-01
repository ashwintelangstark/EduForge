import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { DocumentModel } from '@eduforge/shared';

import { getUserProfile } from '../utils/userProfile.js';

export interface TestAttemptItem {
  id: string;
  student: string;
  test: string;
  score: string;
  accuracy: string;
  status: string;
}

export interface TestAttemptsPageProps {
  documents?: DocumentModel[];
}

/**
 * Automatically calculates accuracy percentage string from a given score string.
 * Supports formats: "160 / 200", "160/200", "160 out of 200", "80%", or "80"
 */
export const calculateAccuracyFromScore = (scoreStr: string): string => {
  if (!scoreStr) return '';
  
  // Case 1: Fraction like "160 / 200", "160/200", "160 out of 200"
  const fractionMatch = scoreStr.match(/([\d.]+)\s*(?:\/|out of|\s+of\s+)\s*([\d.]+)/i);
  if (fractionMatch) {
    const obtained = parseFloat(fractionMatch[1]);
    const total = parseFloat(fractionMatch[2]);
    if (!isNaN(obtained) && !isNaN(total) && total > 0) {
      const pct = Math.min(100, Math.max(0, (obtained / total) * 100));
      const formatted = pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1);
      return `${formatted}%`;
    }
  }

  // Case 2: Percentage string like "80%", "85.5%"
  const pctMatch = scoreStr.match(/^([\d.]+)%$/);
  if (pctMatch) {
    const val = parseFloat(pctMatch[1]);
    if (!isNaN(val)) return `${val}%`;
  }

  // Case 3: Single number like "85" (out of 100)
  const numMatch = scoreStr.trim().match(/^([\d.]+)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
      return `${formatted}%`;
    }
  }

  return '';
};

export const TestAttemptsPage: React.FC<TestAttemptsPageProps> = ({ documents = [] }) => {
  const user = getUserProfile();
  const [attempts, setAttempts] = useState<TestAttemptItem[]>([]);
  const [testOptions, setTestOptions] = useState<string[]>([
    'NEET Biology — Cell Structure & Function',
    'JEE Main Physics — Kinematics & Motion',
    'CBSE Class 12 Chemistry — Atomic Structure & Bonding',
    'KCET Mathematics — Calculus & Vectors'
  ]);

  useEffect(() => {
    loadData();
  }, [documents]);

  const loadData = async () => {
    try {
      const [fetchedDocs, fetchedAttempts] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getAttempts().catch(() => [])
      ]);

      if (fetchedAttempts && fetchedAttempts.length > 0) {
        setAttempts(fetchedAttempts as any[]);
      }

      const docTitles = (fetchedDocs || []).map(d => d.title).filter(Boolean);
      const propDocTitles = (documents || []).map(d => d.title).filter(Boolean);
      const combined = Array.from(new Set([...docTitles, ...propDocTitles, ...testOptions]));
      if (combined.length > 0) {
        setTestOptions(combined);
      }
    } catch (err) {
      console.error('Failed to load attempts data:', err);
    }
  };

  const displayAttempts = user.assigned_subject !== 'All'
    ? attempts.filter(a => (a.test || '').toLowerCase().includes(user.assigned_subject.toLowerCase()))
    : attempts;

  const displayTestOptions = user.assigned_subject !== 'All'
    ? testOptions.filter(t => t.toLowerCase().includes(user.assigned_subject.toLowerCase()))
    : testOptions;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [student, setStudent] = useState('');
  const [test, setTest] = useState('');
  const [score, setScore] = useState('160 / 200');
  const [accuracy, setAccuracy] = useState('80%');
  const [status, setStatus] = useState('Completed');

  const handleOpenAdd = () => {
    setEditingId(null);
    setStudent('');
    setTest(testOptions[0] || 'NEET Biology — Cell Structure & Function');
    const defaultScore = '160 / 200';
    setScore(defaultScore);
    setAccuracy(calculateAccuracyFromScore(defaultScore) || '80%');
    setStatus('Completed');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: TestAttemptItem) => {
    setEditingId(a.id);
    setStudent(a.student);
    setTest(a.test);
    setScore(a.score);
    const computedAcc = calculateAccuracyFromScore(a.score) || a.accuracy || '80%';
    setAccuracy(computedAcc);
    setStatus(a.status);
    setIsModalOpen(true);
  };

  const handleScoreChange = (newScore: string) => {
    setScore(newScore);
    const autoAccuracy = calculateAccuracyFromScore(newScore);
    if (autoAccuracy) {
      setAccuracy(autoAccuracy);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this test attempt record?')) {
      setAttempts(prev => prev.filter(a => a.id !== id));
      try {
        await api.deleteAttempt(id);
      } catch (err) {
        console.error('Failed to delete attempt log:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student.trim() || !test.trim()) return;

    const computedAcc = calculateAccuracyFromScore(score) || accuracy.trim() || '0%';

    const payload = {
      student: student.trim(),
      test: test.trim(),
      score: score.trim(),
      accuracy: computedAcc,
      status
    };

    if (editingId) {
      setAttempts(prev =>
        prev.map(a => (a.id === editingId ? { ...a, ...payload } : a))
      );
      setIsModalOpen(false);
      try {
        await api.updateAttempt(editingId, payload);
      } catch (err) {
        console.error('Failed to update attempt log:', err);
      }
    } else {
      setIsModalOpen(false);
      try {
        const created = await api.createAttempt(payload);
        setAttempts(prev => [created as any, ...prev]);
      } catch (err) {
        console.error('Failed to create attempt log:', err);
        setAttempts(prev => [
          { id: `att-${Date.now()}`, ...payload },
          ...prev
        ]);
      }
    }

    setStudent('');
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Test Attempts</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Student attempts and results.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> + Log Attempt
        </button>
      </div>

      {/* Wireframe Panel Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Student</th>
              <th className="px-5 py-3">Test</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3">Accuracy</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {displayAttempts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No test attempts logged yet. Click "+ Log Attempt" to record a result.
                </td>
              </tr>
            ) : (
              displayAttempts.map((a, idx) => {
                const displayAcc = calculateAccuracyFromScore(a.score) || a.accuracy || '0%';

                return (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{a.student}</td>
                    <td className="px-5 py-3.5">{a.test}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{a.score}</td>
                    <td className="px-5 py-3.5 font-semibold text-teal-700">{displayAcc}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-semibold">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(a)}
                          className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit Attempt"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Attempt"
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

      {/* Log / Edit Attempt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>{editingId ? 'Edit Attempt' : 'Log Test Attempt'}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Name / ID</label>
                <input
                  type="text"
                  required
                  placeholder="Student 004"
                  value={student}
                  onChange={e => setStudent(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Existing Test</label>
                <select
                  required
                  value={test}
                  onChange={e => setTest(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium cursor-pointer"
                >
                  {displayTestOptions.map(tOption => (
                    <option key={tOption} value={tOption}>
                      {tOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Score</label>
                  <input
                    type="text"
                    placeholder="168 / 200"
                    value={score}
                    onChange={e => handleScoreChange(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accuracy (Auto-Calculated)</label>
                  <input
                    type="text"
                    placeholder="84%"
                    value={accuracy}
                    onChange={e => setAccuracy(e.target.value)}
                    className="w-full p-2.5 border border-teal-300 rounded-md text-teal-900 bg-teal-50/60 font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                  />
                </div>
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
                  {editingId ? 'Update' : 'Log Attempt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
