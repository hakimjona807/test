import React from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Moon, Sun, LogOut, WifiOff, ShieldCheck, GraduationCap, School } from 'lucide-react';
import { UserRole } from '../../types';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  onToggleSidebar,
  showSidebarToggle,
}) => {
  const { currentUser, logout, quickLoginAs } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = useData();

  const handleRoleSwitch = (role: UserRole) => {
    quickLoginAs(role);
    if (role === 'student') {
      onNavigate('/student');
    } else {
      onNavigate('/teacher');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Offline Alert Strip if connection lost */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Internet aloqasi uzildi. Javoblaringiz va amallaringiz mahalliy xotirada xavfsiz saqlanmoqda.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title & hamburger for mobile */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Menyu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <button
            onClick={() => onNavigate(currentUser?.role === 'student' ? '/student' : '/teacher')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              T
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 block leading-tight">
                TestHub Pro
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
                Onlayn Test Platformasi
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {currentUser?.role === 'student' ? (
            <>
              <button
                onClick={() => onNavigate('/student')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  currentPath === '/student'
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Mening Testlarim
              </button>
              <button
                onClick={() => onNavigate('/student-results')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  currentPath === '/student-results'
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Natijalarim
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('/teacher')}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  currentPath === '/teacher'
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Boshqaruv Paneli
              </button>
              <button
                onClick={() => onNavigate('/teacher?tab=tests')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Testlar
              </button>
              <button
                onClick={() => onNavigate('/teacher?tab=results')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Natijalar
              </button>
              <button
                onClick={() => onNavigate('/teacher?tab=analytics')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Statistika
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Actions (Role Switcher, Theme Toggle, User Profile, Logout) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="hidden lg:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => handleRoleSwitch('student')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentUser?.role === 'student'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="O'quvchi profiliga o'tish"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>O'quvchi</span>
            </button>
            <button
              onClick={() => handleRoleSwitch('teacher')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentUser?.role === 'teacher'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="O'qituvchi profiliga o'tish"
            >
              <School className="w-3.5 h-3.5" />
              <span>O'qituvchi</span>
            </button>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                currentUser?.role === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Admin profiliga o'tish"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Mavzuni almashtirish"
            title={theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'u rejim'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Info */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-semibold text-xs shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {currentUser.role === 'student' ? currentUser.groupName || "O'quvchi" : currentUser.role === 'teacher' ? "O'qituvchi" : 'Admin'}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  onNavigate('/login');
                }}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Tizimdan chiqish"
                aria-label="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Kirish
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
