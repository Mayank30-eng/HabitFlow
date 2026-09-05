import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar, Shield, Activity } from 'lucide-react';
import { useHabits } from '../contexts/HabitContext';
import CalendarHeatmap from '../components/common/CalendarHeatmap';
import {
  getCompletionTrend, getWeeklyData, getMonthlyData, getHabitComparison,
  getOverallStatus, getGoodVsBadStats, getBadHabitTrend
} from '../utils/calculations';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const Analytics: React.FC = () => {
  const { state } = useHabits();
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const habits = state.habits;

  const trendData = getCompletionTrend(habits, parseInt(timeRange));
  const badTrendData = getBadHabitTrend(habits, parseInt(timeRange));
  const weeklyData = getWeeklyData(habits);
  const monthlyData = getMonthlyData(habits);
  const comparisonData = getHabitComparison(habits);
  const overallStatus = getOverallStatus(habits);
  const { goodCompleted, badAvoided, badPerformed } = getGoodVsBadStats(habits);

  const pieData = [
    { name: 'Completed', value: overallStatus.completed, color: '#22c55e' },
    { name: 'Missed', value: overallStatus.missed, color: '#ef4444' },
    { name: 'Pending', value: overallStatus.pending, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  const goodVsBadData = [
    { name: 'Good Completed', value: goodCompleted, color: '#22c55e' },
    { name: 'Bad Avoided', value: badAvoided, color: '#6366F1' },
    { name: 'Bad Occurred', value: badPerformed, color: '#ef4444' },
  ];

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color?: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
          <p className="text-slate-500 dark:text-slate-400 font-semibold mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.color || '#6366F1' }}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{p.name}:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1.5">
            Visualize your consistency trends, success patterns, and behavioral improvements
          </p>
        </div>

        {/* Time Range Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800/60 self-start sm:self-auto shadow-xs">
          {(['7', '30', '90'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {range} Days
            </button>
          ))}
        </div>
      </div>

      {/* Good Completion Trend */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Good Habit Completion Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily completions vs total active good habits over the past {timeRange} days
              </p>
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                name="Completed Good Habits"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Active Good Habits"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bad Habit Trend */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Bad Habit Avoidance Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track days successfully avoided vs slips over the past {timeRange} days
              </p>
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={badTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => v.slice(5)}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="avoided"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={false}
                name="Days Avoided"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="occurrences"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                name="Occurrences / Slips"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Active Bad Habits"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly & Monthly Aggregations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Weekly Completion Rate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consistency breakdown week by week
              </p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="rate"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  name="Good Completion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary dark:text-primary-light border border-primary/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Monthly Completion Rate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Long-term monthly progression
              </p>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="rate"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  name="Good Completion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Habit Comparison & Donut Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Comparison */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Habit Success Comparison
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                30-day success percentage across all active habits
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={90}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]} name="30-Day Success %">
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === 'good' ? '#22c55e' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2 Donut Distribution Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Donut 1: Good Habit Status */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Good Status</h3>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-center">
              <div>
                <span className="text-emerald-600 font-bold block">{overallStatus.completed}</span>
                <span className="text-slate-400">Done</span>
              </div>
              <div>
                <span className="text-amber-500 font-bold block">{overallStatus.pending}</span>
                <span className="text-slate-400">Pending</span>
              </div>
              <div>
                <span className="text-rose-500 font-bold block">{overallStatus.missed}</span>
                <span className="text-slate-400">Missed</span>
              </div>
            </div>
          </div>

          {/* Donut 2: Today by Type */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Today by Type</h3>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goodVsBadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {goodVsBadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-center">
              <div>
                <span className="text-emerald-600 font-bold block">{goodCompleted}</span>
                <span className="text-slate-400">Done</span>
              </div>
              <div>
                <span className="text-primary font-bold block">{badAvoided}</span>
                <span className="text-slate-400">Avoided</span>
              </div>
              <div>
                <span className="text-rose-500 font-bold block">{badPerformed}</span>
                <span className="text-slate-400">Slips</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-Day Activity Heatmap */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              365-Day Complete Activity Heatmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Long-term annual view of daily habit completions and avoidances
            </p>
          </div>
        </div>
        <CalendarHeatmap habits={habits} days={365} />
      </div>
    </div>
  );
};

export default Analytics;
