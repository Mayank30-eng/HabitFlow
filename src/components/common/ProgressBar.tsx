import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'green' | 'red' | 'amber' | 'blue';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const colorMap = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
};

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, color = 'green', showLabel = true, size = 'md' }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${colorMap[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
