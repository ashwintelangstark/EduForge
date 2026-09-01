import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Template } from '@eduforge/shared';
import { LayoutTemplate, ArrowLeft, Award, School, Columns } from 'lucide-react';

interface TemplatesPageProps {
  onBackToDashboard: () => void;
  onUseTemplate: (template: Template) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  onBackToDashboard,
  onUseTemplate
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'competitive': return <Award className="w-6 h-6 text-amber-600" />;
      case 'school': return <School className="w-6 h-6 text-emerald-600" />;
      default: return <Columns className="w-6 h-6 text-sky-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="p-2 rounded-lg transition-colors hover:bg-slate-100 text-slate-700 cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="p-2.5 rounded-xl border bg-amber-50 text-amber-700 border-amber-200">
          <LayoutTemplate className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Exam Layout Templates</h1>
          <p className="text-xs text-slate-500">Standardized question paper templates for entrance exams, board tests, and generic evaluations</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl border bg-slate-50 border-slate-200">
                    {getTemplateIcon(tpl.category)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-snug text-slate-900">{tpl.name}</h3>
                    <span className="text-[11px] font-semibold capitalize text-slate-500">{tpl.category}</span>
                  </div>
                </div>
                {tpl.isSystem && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                    Built-in
                  </span>
                )}
              </div>

              <p className="text-xs mb-4 leading-relaxed text-slate-600">
                {tpl.description?.replace(/2-Column/gi, 'Single-Column')}
              </p>

              <div className="space-y-1.5 text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Columns:</span>
                  <span className="font-semibold text-slate-800">Single Column Layout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Font:</span>
                  <span className="font-semibold text-slate-800">{tpl.settings.defaultFont} ({tpl.settings.defaultFontSize}pt)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Margins:</span>
                  <span className="font-semibold text-slate-800">{tpl.settings.margins?.top || 15}mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Header Box:</span>
                  <span className="font-semibold text-slate-800">{tpl.defaultMetadata.headerTemplate || 'Boxed'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUseTemplate(tpl)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
