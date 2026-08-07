import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
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
  ].filter(d => d.value > 0);

  const goodVsBadData = [
    { name: 'Good Completed', value: goodCompleted, color: '#22c55e' },
    { name: 'Bad Avoided', value: badAvoided, color: '#3b82f6' },
    { name: 'Bad Occurred', value: badPerformed, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
          <p className="text-slate-500 dark:text-slate-400">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="font-semibold text-slate-900 dark:text-slate-100">{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
              }`}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      {/* Good Completion Trend */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Good Habit Completion Trend</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} name="Completed Good Habits" />
              <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} dot={false} name="Active Good Habits" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bad Habit Trend */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bad Habit Avoidance Trend</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={badTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="avoided" stroke="#22c55e" strokeWidth={2} dot={false} name="Avoided" />
              <Line type="monotone" dataKey="occurrences" stroke="#ef4444" strokeWidth={2} dot={false} name="Occurrences" />
              <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} dot={false} name="Active Bad Habits" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly & Monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Good Weekly Completion</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Good Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Good Monthly Completion</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="#a855f7" radius={[4, 4, 0, 0]} name="Good Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Habit Comparison & Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Habit Success Comparison</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="30-Day Success %">
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'good' ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Good Habit Status</h2>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Today by Type</h2>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goodVsBadData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {goodVsBadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity Heatmap</h2>
        </div>
        <CalendarHeatmap habits={habits} days={365} />
      </div>
    </div>
  );
};

export default Analytics;
