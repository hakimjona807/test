import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/common/StatCard';
import { BookOpen, CheckCircle, Award, Clock, ArrowRight, Play, Eye, Calendar, Sparkles } from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (path: string) => void;
  onStartTest: (testId: string) => void;
  onViewResult: (resultId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate: _onNavigate,
  onStartTest,
  onViewResult,
}) => {
  const { currentUser } = useAuth();
  const { tests, results } = useData();
  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');

  const studentResults = results.filter(r => r.studentId === currentUser?.id || r.studentName === currentUser?.name);

  // Completed test IDs
  const completedTestIds = new Set(studentResults.map(r => r.testId));

  // Available / Open tests
  const openTests = tests.filter(t => t.isActive);

  // Metrics
  const totalCompleted = studentResults.length;
  const passedCount = studentResults.filter(r => r.passed).length;
  const averageScore = totalCompleted
    ? Math.round(studentResults.reduce((acc, curr) => acc + curr.percentage, 0) / totalCompleted)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>O'quvchi shaxsiy kabineti</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalomu alaykum, {currentUser?.name || "O'quvchi"}!
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-indigo-200 max-w-xl">
              Bugungi test sinovlarini muvaffaqiyatli topshiring va o'z bilimlaringizni sinab ko'ring.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div>
              <span className="text-[11px] text-indigo-200 block">Sizning guruhingiz</span>
              <span className="text-base font-bold text-white block">
                {currentUser?.groupName || '9-A Guruh'}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient glow in corner */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ochiq testlar"
          value={openTests.length}
          icon={<BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          hint="Topshirishga tayyor"
        />
        <StatCard
          label="Tugallangan testlar"
          value={totalCompleted}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          hint="Jami topshirilgan"
        />
        <StatCard
          label="O'rtacha natija"
          value={averageScore}
          suffix="%"
          icon={<Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          hint="Umumiy o'zlashtirish"
        />
        <StatCard
          label="O'tgan testlar"
          value={passedCount}
          icon={<Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          hint={`${totalCompleted} tadan ${passedCount} tasi ijobiy`}
        />
      </div>

      {/* Natijalar Grafigi (Results progression chart) */}
      {studentResults.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Natijalar dinamikasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Topshirilgan testlar bo'yicha foiz ko'rsatkichlaringiz
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> O'tgan
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> O'tmagan
              </span>
            </div>
          </div>

          {/* Simple responsive SVG Chart */}
          <div className="h-44 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
            {studentResults.slice(-6).map((res, i) => {
              const heightPercent = Math.max(res.percentage, 10);
              return (
                <div key={res.id || i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[11px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {res.testTitle.slice(0, 20)}...: <b>{res.percentage}%</b>
                  </div>

                  <div className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {res.percentage}%
                  </div>

                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        res.passed
                          ? 'bg-linear-to-t from-emerald-600 to-emerald-400'
                          : 'bg-linear-to-t from-rose-600 to-rose-400'
                      }`}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate max-w-[70px]">
                    {res.subject}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs: Ochiq testlar vs Tugallangan testlar */}
      <div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'open'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Ochiq testlar ({openTests.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tugallangan testlar ({totalCompleted})
            </button>
          </div>
        </div>

        {/* Tab 1: Ochiq testlar */}
        {activeTab === 'open' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openTests.map(test => {
              const isAlreadyDone = completedTestIds.has(test.id);

              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header info without pill sandwich */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{test.subject}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {test.durationMinutes} daqiqa
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {test.description}
                    </p>

                    {/* Metadata text */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-5">
                      <span>Savollar: <strong className="text-slate-700 dark:text-slate-200 font-mono">{test.questions.length} ta</strong></span>
                      <span>·</span>
                      <span>O'tish bali: <strong className="text-slate-700 dark:text-slate-200 font-mono">{test.passingScore}%</strong></span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    {test.deadline ? (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(test.deadline).toLocaleDateString('uz-UZ')} gacha
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Muddatsiz
                      </span>
                    )}

                    <button
                      onClick={() => onStartTest(test.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-xs cursor-pointer ${
                        isAlreadyDone
                          ? 'bg-slate-700 hover:bg-slate-800'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isAlreadyDone ? 'Qayta topshirish' : 'Testni boshlash'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Tugallangan testlar */}
        {activeTab === 'completed' && (
          <div className="space-y-3">
            {studentResults.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Hozircha topshirilgan testlar yo'q
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Ochiq testlar bo'limidan birorta testni tanlang va o'z bilimingizni sinab ko'ring.
                </p>
                <button
                  onClick={() => setActiveTab('open')}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Ochiq testlarni ko'rish
                </button>
              </div>
            ) : (
              studentResults.map(res => {
                const mins = Math.floor(res.timeSpentSeconds / 60);
                const secs = res.timeSpentSeconds % 60;
                const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                return (
                  <div
                    key={res.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm font-mono shrink-0 ${
                          res.passed
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {res.percentage}%
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span>{res.subject}</span>
                          <span>·</span>
                          <span>{new Date(res.completedAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {res.testTitle}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>To'g'ri: <strong className="text-slate-700 dark:text-slate-200 font-mono">{res.score}/{res.totalQuestions}</strong></span>
                          <span>·</span>
                          <span>Vaqt: <strong className="text-slate-700 dark:text-slate-200 font-mono">{timeStr}</strong></span>
                          <span>·</span>
                          <span>Oynadan chiqish: <strong className="text-slate-700 dark:text-slate-200 font-mono">{res.tabSwitchCount} marta</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          res.passed
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {res.passed ? "O'tdi" : "Yiqildi"}
                      </span>
                      <button
                        onClick={() => onViewResult(res.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ko'rish</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
