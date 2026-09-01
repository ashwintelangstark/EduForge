import React, { useState, useEffect } from 'react';
import { ChevronDown, User, LogOut, Shield, X, Check, Mail, Menu } from 'lucide-react';
import { PageView } from './Sidebar.js';
import { getUserProfile } from '../utils/userProfile.js';

interface HeaderProps {
  currentPage: PageView;
  onLogout?: () => void;
  onToggleMobileSidebar?: () => void;
}

const pageTitles: Record<PageView, string> = {
  dashboard: 'Dashboard',
  question_bank: 'Question Bank',
  saved_questions: 'Saved Questions',
  approvals: 'Approvals',
  published_questions: 'Published Questions',
  subjects: 'Subjects',
  chapters: 'Chapters',
  create: 'Create Question',
  generate_test: 'Generate Test Paper',
  tests: 'Tests',
  test_attempts: 'Test Attempts',
  reports: 'Reports',
  media_library: 'Media Library',
  settings: 'Settings',
  editor: 'Question Paper Editor',
  templates: 'Templates',
  science: 'Science Library'
};

export const Header: React.FC<HeaderProps> = ({ currentPage, onLogout, onToggleMobileSidebar }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const user = getUserProfile();
  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const assignedSubject = user.assigned_subject;
  const userRole = user.role === 'admin' ? 'Administrator' : user.assigned_subject === 'None' ? 'Unassigned Guest' : `${user.assigned_subject} Faculty`;

  useEffect(() => {
    const u = getUserProfile();
    setUserName(u.name);
    setUserEmail(u.email);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const savedUser = localStorage.getItem('eduforge_user');
      const parsed = savedUser ? JSON.parse(savedUser) : {};
      const updated = {
        ...parsed,
        name: userName,
        email: userEmail
      };
      localStorage.setItem('eduforge_user', JSON.stringify(updated));
    } catch {}
    setIsProfileModalOpen(false);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Current Page Title / Breadcrumb & Mobile Menu Toggle */}
      <div className="flex items-center gap-2.5">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-xs font-extrabold text-[#005d66]">
          {pageTitles[currentPage] || 'Dashboard'}
        </h2>
      </div>

      {/* User Account Menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-teal-50/50 text-slate-800 text-xs font-bold transition-all cursor-pointer active:scale-[0.98]"
        >
          <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-black uppercase">
            {userName.charAt(0)}
          </div>
          <span className="font-bold text-slate-900">{userName}</span>
          {assignedSubject && (
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
              assignedSubject === 'Physics' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              assignedSubject === 'Chemistry' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
              assignedSubject === 'Biology' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              assignedSubject === 'Mathematics' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
              assignedSubject === 'None' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
              'bg-teal-100 text-teal-800 border border-teal-200'
            }`}>
              {assignedSubject === 'All' ? 'Admin (All)' : assignedSubject === 'None' ? 'Unassigned Guest' : `${assignedSubject} Only`}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </button>

        {isUserMenuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
            </div>

            <button
              type="button"
              className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-teal-50 flex items-center gap-2 cursor-pointer font-semibold"
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsProfileModalOpen(true);
              }}
            >
              <User className="w-3.5 h-3.5 text-teal-600" /> My Profile
            </button>

            <div className="px-4 py-1.5 text-[11px] text-slate-500 flex items-center gap-2 font-medium">
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Role: <b className="text-slate-800">{userRole}</b></span>
            </div>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-semibold"
              onClick={() => {
                setIsUserMenuOpen(false);
                if (onLogout) onLogout();
              }}
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-sm text-slate-900">
              <span>Admin Profile Details</span>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold text-slate-800">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white font-medium focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">
                  User Role
                </label>
                <input
                  type="text"
                  disabled
                  value={userRole}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
