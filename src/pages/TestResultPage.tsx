import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { sendResultToTelegram } from '../services/telegram';
import { CheckCircle2, XCircle, Clock, ShieldAlert, ArrowLeft, RotateCcw, Send, Printer } from 'lucide-react';

interface TestResultPageProps {
  resultId: string;
  onBackToDashboard: () => void;
  onRetakeTest: (testId: string) => void;
}

export const TestResultPage: React.FC<TestResultPageProps> = ({
  resultId,
  onBackToDashboard,
  onRetakeTest,
}) => {
  const { results, telegramConfig } = useData();
  const { addToast } = useToast();
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const result = results.find(r => r.id === resultId) || results[0];

  if (!result) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Natija topilmadi</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">Ushbu natija mavjud emas yoki o'chirilgan bo'lishi mumkin.</p>
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Dashboardga qaytish
        </button>
      </div>
    );
  }

  const mins = Math.floor(result.timeSpentSeconds / 60);
  const secs = result.timeSpentSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // SVG Circle animation math
  const circleRadius = 58;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (result.percentage / 100) * circumference;

  const handleSendTelegram = async () => {
    if (!telegramConfig.botToken || !telegramConfig.chatId) {
      addToast(
        "Telegram xabarnomasi sozlanmagan. O'qituvchi sozlamalar bo'limida bot tokenini kiritishi kerak.",
        'warning',
        'Sozlama zarur'
      );
      return;
    }

    setIsSendingTelegram(true);
    const res = await sendResultToTelegram(result, telegramConfig);
    setIsSendingTelegram(false);

    if (res.success) {
      addToast(res.message, 'success', 'Yuborildi');
    } else {
      addToast(res.message, 'error', 'Xatolik');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Top back button */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboardga qaytish</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Natijani chop etish yoki PDF saqlash"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendTelegram}
            disabled={isSendingTelegram}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegramga yuborish</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg mb-8 text-center relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-3xl pointer-events-none rounded-full opacity-30 ${
            result.passed ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        <div className="relative z-10">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {result.subject} · {result.studentGroup}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            {result.testTitle}
          </h1>

          {/* Animated Circular Progress Gauge */}
          <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated value circle */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                className={`transition-all duration-1000 ease-out ${
                  result.passed
                    ? 'stroke-emerald-500'
                    : 'stroke-rose-500'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Inner text inside circle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-mono">
                <AnimatedCounter value={result.percentage} suffix="%" />
              </span>
              <span
                className={`text-[11px] font-bold mt-0.5 tracking-wider uppercase ${
                  result.passed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {result.passed ? "O'TDINGIZ" : "YIQILDINGIZ"}
              </span>
            </div>
          </div>

          {/* Primary stats row */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto py-4 border-y border-slate-100 dark:border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">To'plangan Ball</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {result.score} / {result.totalQuestions}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Sarflangan vaqt
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                {timeFormatted}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Oynadan chiqish
              </span>
              <span className={`text-lg font-bold font-mono ${result.tabSwitchCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {result.tabSwitchCount} marta
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              onClick={() => onRetakeTest(result.testId)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Qayta topshirish</span>
            </button>
            <button
              onClick={onBackToDashboard}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Answers Review */}
      {result.questionsSnapshot && result.questionsSnapshot.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            Savollar tahlili va to'g'ri javoblar
          </h3>

          {result.questionsSnapshot.map((question, idx) => {
            const studentAns = result.answers.find(a => a.questionId === question.id);
            const isCorrect = studentAns?.isCorrect;
            const selectedOptId = studentAns?.selectedOptionId;

            return (
              <div
                key={question.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri javob
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Noto'g'ri javob
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 leading-relaxed">
                  {question.text}
                </p>

                {/* Options list */}
                <div className="space-y-2 mb-3">
                  {question.options.map(opt => {
                    const isSelected = selectedOptId === opt.id;
                    const isRealCorrect = question.correctOptionId === opt.id;

                    let rowStyle = 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    if (isRealCorrect) {
                      rowStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isSelected && !isRealCorrect) {
                      rowStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold">{opt.id})</span>
                          <span>{opt.text}</span>
                        </div>
                        {isRealCorrect && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            To'g'ri variant
                          </span>
                        )}
                        {isSelected && !isRealCorrect && (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            Siz tanlagan
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                    <strong className="block mb-0.5">Izoh:</strong>
                    {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
