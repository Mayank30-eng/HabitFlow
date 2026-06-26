import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 1, className = '' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm ${className}`}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full mt-2" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
