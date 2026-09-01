import React, { useState, useEffect } from 'react';
import { Download, BarChart3, TrendingUp, Award, Layers, BookOpen, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Question, DocumentModel } from '@eduforge/shared';
import { getUserProfile } from '../utils/userProfile.js';

export const ReportsPage: React.FC = () => {
  const user = getUserProfile();
  const [selectedRange, setSelectedRange] = useState('This Month');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [apiSubjects, setApiSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [docs, qList, subList, chList] = await Promise.all([
        api.getDocuments(),
        api.getQuestions(),
        api.getSubjects(),
        api.getChapters()
      ]);

      let filteredDocs = docs || [];
      let filteredQs = qList || [];
      let filteredSubs = subList || [];
      let filteredChs = chList || [];

      if (user.role === 'faculty' && user.assigned_subject !== 'All') {
        const targetSubLower = user.assigned_subject.toLowerCase();
        filteredDocs = filteredDocs.filter(d => 
          (((d as any).subject || d.metadata?.subject || '') + ' ' + (d.title || '')).toLowerCase().includes(targetSubLower)
        );
        filteredQs = filteredQs.filter(q => 
          (q.subject || '').toLowerCase().includes(targetSubLower)
        );
        filteredSubs = filteredSubs.filter(s => 
          (s.name || '').toLowerCase().includes(targetSubLower)
        );
        filteredChs = filteredChs.filter(c => 
          (c.subject || '').toLowerCase().includes(targetSubLower)
        );
      }

      setDocuments(filteredDocs);
      setQuestions(filteredQs);
      setApiSubjects(filteredSubs);
      setChapters(filteredChs);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Subject Colors Palette
  const defaultColors = [
    'bg-emerald-500',
    'bg-[#007a8c]',
    'bg-amber-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-sky-500',
    'bg-teal-500'
  ];

  // Unify all distinct subjects across apiSubjects, chapters, and questions
  const allSubjectsMap = new Map<string, { id?: string; code?: string; name: string }>();

  apiSubjects.forEach(s => {
    if (s?.name) {
      allSubjectsMap.set(s.name.trim().toLowerCase(), {
        id: s.id,
        code: s.code || s.name.substring(0, 3).toUpperCase(),
        name: s.name.trim()
      });
    }
  });

  chapters.forEach(c => {
    const subName = (c.subject || c.subject_name || '').trim();
    if (subName && !allSubjectsMap.has(subName.toLowerCase())) {
      allSubjectsMap.set(subName.toLowerCase(), {
        name: subName,
        code: subName.substring(0, 3).toUpperCase()
      });
    }
  });

  questions.forEach(q => {
    const subName = (q.subject || (q as any).subject_name || '').trim();
    if (subName && !allSubjectsMap.has(subName.toLowerCase())) {
      allSubjectsMap.set(subName.toLowerCase(), {
        name: subName,
        code: subName.substring(0, 3).toUpperCase()
      });
    }
  });

  const unifiedSubjectsList = Array.from(allSubjectsMap.values());
  const totalQuestionsCount = questions.length;
  const totalChaptersCount = chapters.length;

  // Compute Real Question Counts, Chapters Count & Subject Share dynamically
  const subjectPerformance = unifiedSubjectsList.map((sub, idx) => {
    const subName = sub.name;
    const subNameLower = subName.toLowerCase();
    const subId = sub.id;

    // Filter chapters belonging to this subject
    const subjectChapters = chapters.filter(c => {
      const cSub = (c.subject || c.subject_name || '').trim().toLowerCase();
      const cSubId = c.subject_id || c.subjectId;
      return (cSub && cSub === subNameLower) || (subId && cSubId === subId);
    });
    const chaptersCount = subjectChapters.length;

    // Filter questions belonging to this subject
    const subjectQuestions = questions.filter(q => {
      const qSub = (q.subject || (q as any).subject_name || '').trim().toLowerCase();
      const qSubId = (q as any).subject_id || (q as any).subjectId;
      return (qSub && qSub === subNameLower) || (subId && qSubId === subId);
    });
    const count = subjectQuestions.length;

    // Dynamic Share percentage with 1 decimal place precision
    let percent = 0;
    if (totalQuestionsCount > 0) {
      const rawPct = (count / totalQuestionsCount) * 100;
      percent = rawPct === 0 ? 0 : Number(rawPct.toFixed(1));
    } else if (totalChaptersCount > 0) {
      const rawPct = (chaptersCount / totalChaptersCount) * 100;
      percent = rawPct === 0 ? 0 : Number(rawPct.toFixed(1));
    }

    return {
      name: subName,
      code: sub.code || subName.substring(0, 3).toUpperCase(),
      count,
      chaptersCount,
      percent,
      color: defaultColors[idx % defaultColors.length]
    };
  });

  // Compute Chapter Breakdown for active scope
  const chapterPerformance = chapters.map(ch => {
    const chId = String(ch.id || '').toLowerCase();
    const chTitle = (ch.title || '').toLowerCase();
    const chSubLower = (ch.subject || ch.subject_name || '').trim().toLowerCase();

    const count = questions.filter(q => {
      const qChId = String((q as any).chapter_id || (q as any).chapterId || '').toLowerCase();
      const qChapter = String((q as any).chapter || (q as any).chapter_name || '').toLowerCase();
      return (qChId && qChId === chId) || (qChapter && (qChapter === chTitle || qChapter.includes(chTitle)));
    }).length;

    const subjectQuestionsCount = questions.filter(q => {
      const qSub = (q.subject || (q as any).subject_name || '').trim().toLowerCase();
      return qSub && chSubLower && qSub === chSubLower;
    }).length || totalQuestionsCount;

    const percent = subjectQuestionsCount > 0 ? Math.round((count / subjectQuestionsCount) * 100) : 0;

    return {
      title: ch.title,
      code: ch.code || ch.chapter_code || 'CH-01',
      subject: ch.subject || 'General',
      count,
      percent
    };
  });

  // Compute Real Difficulty Breakdown from Question Bank
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  questions.forEach(q => {
    const diff = (q.difficulty || 'Medium').toLowerCase();
    if (diff === 'easy') easyCount++;
    else if (diff === 'hard') hardCount++;
    else mediumCount++;
  });

  const difficultyBreakdown = [
    {
      level: 'Easy',
      count: easyCount,
      percent: totalQuestionsCount > 0 ? Math.round((easyCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-emerald-500'
    },
    {
      level: 'Medium',
      count: mediumCount,
      percent: totalQuestionsCount > 0 ? Math.round((mediumCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-amber-500'
    },
    {
      level: 'Hard',
      count: hardCount,
      percent: totalQuestionsCount > 0 ? Math.round((hardCount / totalQuestionsCount) * 100) : 0,
      color: 'bg-rose-500'
    }
  ];

  const handleExportPdfReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>EduForge Analytics & Subject Performance Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 24px; font-weight: 800; color: #005d66; margin-bottom: 4px; }
            p { font-size: 13px; color: #64748b; margin-top: 0; }
            .header-info { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; background: #e6f4f5; color: #005d66; border-radius: 6px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .card-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
            .card-val { font-size: 26px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; color: #334155; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <div>
              <h1>EduForge Analytics & Subject Performance Report</h1>
              <p>Generated for: ${user.name} (${user.role === 'admin' ? 'Administrator' : `${user.assigned_subject} Faculty`}) · Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <span class="badge">Live Dynamic Backend Sync</span>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Total Questions</div>
              <div class="card-val">${totalQuestionsCount}</div>
            </div>
            <div class="card">
              <div class="card-title">Generated Papers</div>
              <div class="card-val">${documents.length}</div>
            </div>
            <div class="card">
              <div class="card-title">Active Subjects</div>
              <div class="card-val">${apiSubjects.length}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Chapters</div>
              <div class="card-val">${chapters.length}</div>
            </div>
          </div>

          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 24px;">Subject Distribution Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Question Count</th>
                <th>Chapters</th>
                <th>Distribution Share</th>
              </tr>
            </thead>
            <tbody>
              ${subjectPerformance.map(s => `
                <tr>
                  <td><b>${s.name}</b></td>
                  <td>${s.code}</td>
                  <td>${s.count.toLocaleString()}</td>
                  <td>${s.chaptersCount}</td>
                  <td>${s.percent}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 32px;">Difficulty Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Difficulty Tier</th>
                <th>Total Questions</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${difficultyBreakdown.map(d => `
                <tr>
                  <td><b>${d.level}</b></td>
                  <td>${d.count.toLocaleString()}</td>
                  <td>${d.percent}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Confidential · Exported from EduForge Exam & MCQ Generator Platform
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, '_blank');
    if (!printWin) {
      alert('Please allow popups to download and print the PDF report.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-sans">
            Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real dynamic backend statistics, live subject metrics, and test paper analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRange}
            onChange={e => setSelectedRange(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600 shadow-2xs cursor-pointer"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="All Time">All Time</option>
          </select>

          <button
            type="button"
            onClick={handleExportPdfReport}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Report (PDF)
          </button>
        </div>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Questions</span>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">
              Live Bank
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : totalQuestionsCount}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-600 rounded-full" style={{ width: totalQuestionsCount > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Generated Tests</span>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">
              Live Papers
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : documents.length}
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: documents.length > 0 ? '100%' : '0%' }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Subjects</span>
            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold">
              Synced
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : apiSubjects.length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            {apiSubjects.map(s => s.name).join(', ') || 'No active subjects'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Chapters</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
              Synced
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {loading ? '...' : chapters.length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Synced with backend DB</p>
        </div>
      </div>

      {/* GRAPHICAL REPRESENTATION CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Dynamic Subject / Chapter Distribution Share */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" /> {user.role === 'admin' ? 'Subject Question Share' : `${user.assigned_subject} Chapter Share`}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live distribution share calculated from Question Bank
              </p>
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
              Live Sync
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading subject metrics...</div>
            ) : user.role === 'admin' ? (
              subjectPerformance.length > 0 ? (
                subjectPerformance.map(s => (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.name} ({s.code})
                      </span>
                      <span>{s.count} Qs · {s.chaptersCount} Chs ({s.percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(s.percent, s.count > 0 || s.chaptersCount > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No subjects created yet.</div>
              )
            ) : (
              chapterPerformance.length > 0 ? (
                chapterPerformance.map(ch => (
                  <div key={ch.title} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                        {ch.title}
                      </span>
                      <span>{ch.count} Qs ({ch.percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${ch.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No chapters found for {user.assigned_subject}.</div>
              )
            )}
          </div>
        </div>

        {/* Chart 2: Real Difficulty Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-700" /> Difficulty Level Breakdown
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Easy, Medium, and Hard question balance</p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md">
              AI Balanced
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center">Loading difficulty breakdown...</div>
            ) : (
              difficultyBreakdown.map(d => (
                <div key={d.level} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                      {d.level}
                    </span>
                    <span>{d.count} Qs ({d.percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all duration-500`}
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Subject Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Live Subject & Chapter Directory
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {apiSubjects.length} Subject{apiSubjects.length !== 1 ? 's' : ''} Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-6">Subject</th>
                <th className="py-3 px-6">Subject Code</th>
                <th className="py-3 px-6">Chapters</th>
                <th className="py-3 px-6">Question Count</th>
                <th className="py-3 px-6">Share</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
              {subjectPerformance.length > 0 ? (
                subjectPerformance.map(s => (
                  <tr key={s.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.name}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">{s.code}</td>
                    <td className="py-3.5 px-6">{s.chaptersCount} Chapter{s.chaptersCount !== 1 ? 's' : ''}</td>
                    <td className="py-3.5 px-6 font-bold text-teal-800">{s.count} Questions</td>
                    <td className="py-3.5 px-6">{s.percent}%</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Live Synced
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                    No subjects configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
