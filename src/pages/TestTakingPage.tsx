import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Test, StudentAnswer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

interface TestTakingPageProps {
  testId: string;
  onFinish: (resultId: string) => void;
  onCancel: () => void;
}

export const TestTakingPage: React.FC<TestTakingPageProps> = ({
  testId,
  onFinish,
  onCancel,
}) => {
  const { currentUser } = useAuth();
  const { tests, submitResult, isOnline } = useData();
  const { addToast } = useToast();

  const test = tests.find(t => t.id === testId);

  // Fallback if test not found
  if (!test) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Test topilmadi</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">Ushbu test mavjud emas yoki o'chirilgan bo'lishi mumkin.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Ortga qaytish
        </button>
      </div>
    );
  }

  // Restore saved session from localStorage if exists
  const storageKey = `testhub_session_${test.id}_${currentUser?.id || 'anon'}`;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch {
      // ignore
    }
    const initial: Record<string, string | null> = {};
    test.questions.forEach(q => {
      initial[q.id] = null;
    });
    return initial;
  });

  const totalDurationSeconds = test.durationMinutes * 60;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.remainingSeconds === 'number' && parsed.remainingSeconds > 0) {
          return parsed.remainingSeconds;
        }
      }
    } catch {
      // ignore
    }
    return totalDurationSeconds;
  });

  const [tabSwitchCount, setTabSwitchCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.tabSwitchCount || 0;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save progress to localStorage
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        testId: test.id,
        answers,
        remainingSeconds,
        tabSwitchCount,
        lastUpdated: Date.now(),
      })
    );
  }, [test.id, answers, remainingSeconds, tabSwitchCount, storageKey]);

  // Submission handler
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    const formattedAnswers: StudentAnswer[] = test.questions.map(q => {
      const selected = answers[q.id] || null;
      const isCorrect = selected === q.correctOptionId;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        selectedOptionId: selected,
        isCorrect,
      };
    });

    const totalQuestions = test.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = percentage >= test.passingScore;
    const timeSpentSeconds = totalDurationSeconds - remainingSeconds;

    try {
      const res = await submitResult({
        testId: test.id,
        testTitle: test.title,
        subject: test.subject,
        studentId: currentUser?.id || 'guest',
        studentName: currentUser?.name || "O'quvchi",
        studentGroup: currentUser?.groupName || 'Umumiy',
        score,
        totalQuestions,
        percentage,
        passed,
        timeSpentSeconds,
        tabSwitchCount,
        answers: formattedAnswers,
        questionsSnapshot: test.questions,
      });

      // Clear local test session
      localStorage.removeItem(storageKey);
      addToast("Test muvaffaqiyatli topshirildi!", 'success', 'Natija tayyor');
      onFinish(res.id);
    } catch (err) {
      setIsSubmitting(false);
      addToast("Natijani saqlashda xatolik ro'y berdi", 'error');
    }
  }, [isSubmitting, test, answers, totalDurationSeconds, remainingSeconds, tabSwitchCount, currentUser, submitResult, storageKey, addToast, onFinish]);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          addToast("Vaqt tugadi! Testingiz avtomatik tarzda topshirilmoqda.", 'warning', 'Vaqt me\'yori');
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [handleFinalSubmit, addToast]);

  // Anti-cheat detection: window blur & visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setShowWarningModal(true);
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount(prev => prev + 1);
      setShowWarningModal(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const currentQuestion = test.questions[currentIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progressPercent = Math.round(((currentIndex + 1) / test.questions.length) * 100);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = remainingSeconds < 300; // < 5 mins
  const isCriticalTime = remainingSeconds < 60; // < 1 min

  const handleSelectOption = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
      {/* Anti-cheat Alert Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Diqqat! Oynadan chiqish aniqlandi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Siz test sahifasidan boshqa ilova yoki ilovalar paneliga o'tdingiz. Bu holat o'qituvchi monitoring tizimida qayd etiladi.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-mono">
              Qayd etilgan chiqishlar soni: <strong>{tabSwitchCount} marta</strong>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="mt-6 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tushundim, testni davom ettirish
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submission Dialog */}
      <ConfirmDialog
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleFinalSubmit}
        title="Testni yakunlash"
        message={`Siz ${test.questions.length} ta savoldan ${answeredCount} tasiga javob berdingiz. Haqiqatan ham testni topshirmoqchimisiz?`}
        confirmText="Ha, topshirish"
        cancelText="Davom ettirish"
      />

      {/* Top Test Header Card with Timer & Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{test.subject}</span>
              <span>·</span>
              <span>{test.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                Savol {currentIndex + 1} / {test.questions.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({answeredCount} ta belgilandi)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Online / Offline Sync badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                isOnline
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
              }`}
              title={isOnline ? 'Online - doimiy sinxronlash' : 'Offline - mahalliy xotira faol'}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
              <span className="hidden sm:inline">{isOnline ? 'Sinxron' : 'Offline'}</span>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-sm sm:text-base transition-all ${
                isCriticalTime
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 animate-pulse'
                  : isLowTime
                  ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs mb-6 transition-all duration-200">
        <div className="mb-6">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
            SAVOL #{currentIndex + 1}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="space-y-3">
          {currentQuestion.options.map(option => {
            const isSelected = answers[currentQuestion.id] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option.id)}
                className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-slate-100 font-medium'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {option.id}
                  </div>
                  <span className="text-sm sm:text-base leading-snug break-words">
                    {option.text}
                  </span>
                </div>

                <div className="shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons & Question Drawer */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Oldingi savol</span>
        </button>

        {currentIndex === test.questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setShowConfirmSubmit(true)}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Testni yakunlash</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, test.questions.length - 1))}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span>Keyingi savol</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question Number Palette (Map) */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-3">
          Savollar xaritasi:
        </span>
        <div className="flex flex-wrap gap-2">
          {test.questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]);
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white'
                    : isAnswered
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
