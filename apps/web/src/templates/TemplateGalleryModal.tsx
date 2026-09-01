import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Template } from '@eduforge/shared';
import { LayoutTemplate, X, Check, Columns, FileText, Award, School } from 'lucide-react';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('a4-single-column');

  useEffect(() => {
    if (isOpen) {
      api.getTemplates()
        .then(data => {
          setTemplates(data);
          setLoading(false);
          if (data.length > 0) setSelectedId(data[0].id);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    const t = templates.find(item => item.id === selectedId);
    if (t) {
      onSelectTemplate(t);
      onClose();
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'competitive': return <Award className="w-5 h-5 text-amber-600" />;
      case 'school': return <School className="w-5 h-5 text-emerald-600" />;
      default: return <Columns className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full md:w-[60vw] max-w-[60vw] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Question Paper Template Gallery</h3>
              <p className="text-xs text-slate-500">Choose a professionally designed academic layout template</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto min-h-[360px]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">Loading templates...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => {
                const isSelected = selectedId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedId(tpl.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/40 shadow-md ring-2 ring-sky-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            {getTemplateIcon(tpl.category)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                            <span className="text-[11px] text-slate-500 capitalize">{tpl.category} Format</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {tpl.description?.replace(/2-Column/gi, 'Single-Column')}
                      </p>

                      <div className="flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          Single Column
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          Font: {tpl.settings.defaultFont} ({tpl.settings.defaultFontSize}pt)
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          Margins: {tpl.settings.margins?.top || 15}mm
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>Header: {tpl.defaultMetadata.headerTemplate || 'Boxed'}</span>
                      <span className="font-mono">{tpl.defaultSections.length} default sections</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Selected: {templates.find(t => t.id === selectedId)?.name || 'None'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" /> Apply Template
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
