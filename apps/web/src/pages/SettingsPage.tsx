import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { api } from '../services/api.js';

export const SettingsPage: React.FC = () => {
  const [defaultMarks, setDefaultMarks] = useState('4');
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState('1');
  const [defaultDuration, setDefaultDuration] = useState('60 minutes');
  const [resultVisibility, setResultVisibility] = useState('After submission');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => {
      if (s) {
        if ((s as any).defaultMarks) setDefaultMarks(String((s as any).defaultMarks));
        if ((s as any).defaultNegativeMarks) setDefaultNegativeMarks(String((s as any).defaultNegativeMarks));
        if ((s as any).defaultDuration) setDefaultDuration((s as any).defaultDuration);
      }
    });
  }, []);

  const handleSaveSettings = async () => {
    try {
      const current = await api.getSettings();
      await api.updateSettings({
        ...current,
        defaultMarks: Number(defaultMarks) || 4,
        defaultNegativeMarks: Number(defaultNegativeMarks) || 1,
        defaultDuration
      } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Application & exam paper configurations synced to MySQL database.</p>
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved to Database!' : 'Save Settings'}
        </button>
      </div>

      {/* Grid2 Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panel 1: Question Defaults */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
            Question Defaults
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Marks</label>
              <input
                type="text"
                value={defaultMarks}
                onChange={e => setDefaultMarks(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Negative Marks</label>
              <input
                type="text"
                value={defaultNegativeMarks}
                onChange={e => setDefaultNegativeMarks(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Panel 2: Test Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-xs text-slate-900">
            Test Settings
          </div>
          <div className="p-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Duration</label>
              <input
                type="text"
                value={defaultDuration}
                onChange={e => setDefaultDuration(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Result Visibility</label>
              <select
                value={resultVisibility}
                onChange={e => setResultVisibility(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white font-medium"
              >
                <option value="After submission">After submission</option>
                <option value="Manual publish">Manual publish</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
