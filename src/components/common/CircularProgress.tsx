import React from 'react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number; // pixel diameter, default 96
  strokeWidth?: number; // stroke width in px, default 8
  color?: 'primary' | 'green' | 'amber' | 'blue';
  sublabel?: string;
  showValue?: boolean;
  children?: React.ReactNode;
}

const strokeColorMap = {
  primary: '#6366F1',
  green: '#22C55E',
  amber: '#F59E0B',
  blue: '#3B82F6',
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 96,
  strokeWidth = 8,
  color = 'primary',
  sublabel,
  showValue = true,
  children,
}) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;
  const strokeColor = strokeColorMap[color] || strokeColorMap.primary;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        {children ? (
          children
        ) : (
          <>
            {showValue && (
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
                {Math.round(clampedValue)}%
              </span>
            )}
            {sublabel && (
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
                {sublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
