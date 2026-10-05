import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  hint?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix = '',
  prefix = '',
  icon,
  hint,
  change,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
            {label}
          </span>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <AnimatedCounter value={value} suffix={suffix} prefix={prefix} />
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60">
          {icon}
        </div>
      </div>

      {(hint || change) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {change && (
            <span
              className={`font-medium ${
                change.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {change.value}
            </span>
          )}
          {hint && (
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
