import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { LogIn, UserPlus, Lock, Mail, User, ShieldCheck, GraduationCap, School, Check, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, register, quickLoginAs, isLoading } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('student@testhub.uz');
  const [password, setPassword] = useState('12345');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [groupName, setGroupName] = useState('9-A Guruh');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'login') {
      const res = await login(email, password);
      if (res.success) {
        addToast(res.message, 'success', 'Muvaffaqiyatli');
        // Redirect according to email/role
        if (email.includes('teacher')) {
          onNavigate('/teacher');
        } else if (email.includes('admin')) {
          onNavigate('/teacher');
        } else {
          onNavigate('/student');
        }
      } else {
        setErrorMessage(res.message);
        addToast(res.message, 'error', 'Xatolik');
      }
    } else {
      const res = await register({
        name,
        email,
        password,
        role,
        groupName: role === 'student' ? groupName : undefined,
      });

      if (res.success) {
        addToast(res.message, 'success', 'Tabriklaymiz');
        if (role === 'student') {
          onNavigate('/student');
        } else {
          onNavigate('/teacher');
        }
      } else {
        setErrorMessage(res.message);
        addToast(res.message, 'error', 'Xatolik');
      }
    }
  };

  const handleQuickLogin = (targetRole: UserRole) => {
    quickLoginAs(targetRole);
    const demoUser = DEMO_USERS[targetRole];
    addToast(`Xush kelibsiz, ${demoUser.name}! (${targetRole})`, 'success');
    if (targetRole === 'student') {
      onNavigate('/student');
    } else {
      onNavigate('/teacher');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-900 overflow-hidden">
      {/* Subtle modern ambient background */}
      <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-3000" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-xl shadow-indigo-600/30 mb-3">
            T
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            TestHub Pro
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zamonaviy onlayn test va bilimni baholash platformasi
          </p>
        </div>

        {/* Quick Demo Switcher Strip */}
        <div className="mb-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3">
          <div className="text-[11px] font-medium text-slate-400 mb-2 text-center">
            Tezkor testlash uchun bir bosishda kiring:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-700/60 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-slate-600/50 text-slate-200 transition-all text-xs font-medium cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400 mb-1" />
              <span>O'quvchi</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-700/60 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-600/50 text-slate-200 transition-all text-xs font-medium cursor-pointer"
            >
              <School className="w-4 h-4 text-emerald-400 mb-1" />
              <span>O'qituvchi</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-700/60 hover:bg-purple-600/20 hover:border-purple-500/50 border border-slate-600/50 text-slate-200 transition-all text-xs font-medium cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400 mb-1" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-900/60 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
                setEmail('student@testhub.uz');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
                setEmail('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    F.I.SH (Ism va familiya)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Azizbek Aliyev"
                      className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Foydalanuvchi roli
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'student'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>O'quvchi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'teacher'
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                          : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <School className="w-4 h-4" />
                      <span>O'qituvchi</span>
                    </button>
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Guruh nomi
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="9-A Guruh"
                      className="w-full bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Elektron pochta (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@testhub.uz"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Parol
                </label>
                {activeTab === 'login' && (
                  <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">
                    Parol: 12345
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : activeTab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Tizimga kirish</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Ro'yxatdan o'tish</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Info */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-slate-400 text-xs">
            <p className="font-medium text-slate-300 mb-2">Mavjud namunaviy hisoblar:</p>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span>O'quvchi: <span className="text-slate-200">student@testhub.uz</span></span>
                <span className="text-slate-400">12345</span>
              </div>
              <div className="flex items-center justify-between">
                <span>O'qituvchi: <span className="text-slate-200">teacher@testhub.uz</span></span>
                <span className="text-slate-400">12345</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
