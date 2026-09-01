import React from 'react';
import {
  Database, LayoutTemplate, Atom, Settings, Plus, Compass
} from 'lucide-react';

export type PageView =
  | 'dashboard'
  | 'editor'
  | 'question_bank'
  | 'templates'
  | 'science'
  | 'settings';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  onNewPaper?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  onNewPaper
}) => {
  const navLinks: { id: PageView; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'question_bank', label: 'Question Bank', icon: Database },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'science', label: 'Science Library', icon: Atom },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      
      {/* Brand / Logo */}
      <div className="flex items-center gap-8">
        <div
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <img
            src="/logo.png"
            alt="EduForge Logo"
            className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-black text-base tracking-tight leading-none text-slate-900 group-hover:text-sky-600 transition-colors">
              EduForge
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Scientific Exam Publishing
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => setCurrentPage(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-500'}`} />
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Quick Actions: New Paper */}
      <div className="flex items-center gap-3">
        {onNewPaper && (
          <button
            type="button"
            onClick={onNewPaper}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Paper
          </button>
        )}
      </div>

    </header>
  );
};
