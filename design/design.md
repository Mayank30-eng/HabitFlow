# Habit Tracker Dashboard - Design Document

## Product Concept

A premium, minimal habit tracker dashboard that helps users build good habits, reduce bad ones, and visualize their personal growth over time. Inspired by Notion, Linear, GitHub, and Stripe — clean, data-rich, and emotionally rewarding.

## Pages & Routes (HashRouter)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Main overview with stats, charts, habit list, recent activity |
| `/habits` | All Habits | Full habit list with CRUD, filters, search |
| `/habit/:id` | Habit Details | Single habit analytics, calendar, streaks, trends |
| `/analytics` | Analytics | Global charts: completion trends, heatmap, comparisons |
| `/calendar` | Calendar View | Monthly calendar with color-coded completion |
| `/settings` | Settings | Theme toggle, data export/import, preferences |

## Color Palette

### Light Mode
- Background: `#f8fafc` (slate-50)
- Surface: `#ffffff` (white)
- Primary: `#0f172a` (slate-900) — for text, buttons, borders
- Accent Good: `#22c55e` (green-500) — completed habits, positive streaks
- Accent Bad: `#ef4444` (red-500) — missed, bad habits performed
- Accent Warning: `#f59e0b` (amber-500) — pending, streak at risk
- Accent Info: `#3b82f6` (blue-500) — links, info badges
- Text Primary: `#0f172a` (slate-900)
- Text Secondary: `#64748b` (slate-500)
- Text Muted: `#94a3b8` (slate-400)
- Border: `#e2e8f0` (slate-200)
- Card Shadow: `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`

### Dark Mode
- Background: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Primary: `#f8fafc` (slate-50) — text
- Accent Good: `#4ade80` (green-400)
- Accent Bad: `#f87171` (red-400)
- Accent Warning: `#fbbf24` (amber-400)
- Accent Info: `#60a5fa` (blue-400)
- Text Primary: `#f8fafc` (slate-50)
- Text Secondary: `#94a3b8` (slate-400)
- Text Muted: `#475569` (slate-600)
- Border: `#334155` (slate-700)
- Card Shadow: `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)`

## Typography

- Font: `Inter` (Google Fonts) or system sans-serif fallback
- Scale:
  - Display: `2.25rem` / `36px` (font-bold)
  - H1: `1.5rem` / `24px` (font-semibold)
  - H2: `1.25rem` / `20px` (font-semibold)
  - H3: `1rem` / `16px` (font-medium)
  - Body: `0.875rem` / `14px` (font-normal)
  - Small: `0.75rem` / `12px` (font-medium)
- Line height: 1.5 for body, 1.25 for headings

## Layout

- Sidebar: `240px` fixed left (desktop), hidden on mobile with hamburger menu
- Top bar: `64px` height, fixed, contains greeting, search, theme toggle, user avatar
- Content area: fluid, max-width `1440px`, centered, `px-6` padding
- Card radius: `12px` (rounded-xl)
- Card padding: `20px` (p-5)
- Section gap: `24px` (gap-6)
- Grid: responsive — 1 col mobile, 2 col tablet, 3-4 col desktop

## Sidebar Navigation

Items with icons:
- Dashboard (LayoutDashboard)
- All Habits (ListChecks)
- Analytics (BarChart3)
- Calendar (CalendarDays)
- Settings (Settings)

Active state: subtle background tint, accent left border, bold text.

## Shared Components

### StatCard
- Icon + value + label + trend indicator
- Rounded-xl, surface bg, shadow-sm
- Hover: subtle lift shadow

### ProgressBar
- Thin bar (8px), rounded-full
- Color based on type: green (good), red (bad), amber (warning)
- Optional percentage label

### HabitCard
- Habit name, category badge, streak badge, progress bar
- Checkbox for today (good) or X for missed (bad)
- Edit/Delete actions (dropdown or icon buttons)
- Good/Bad indicator color strip on left edge

### CalendarHeatmap
- GitHub-style grid of colored squares
- 7 rows (days), 53 columns (weeks) for year view
- Color scale: 0 = gray, 1+ = light green to dark green
- Red for bad habits performed

### ChartCard
- Title + chart area
- Recharts-based
- Responsive container

### Modal/Dialog
- Centered overlay, backdrop blur, slide-up animation
- Form fields for habit CRUD
- Confirmation for delete

### Toast
- Top-right, auto-dismiss 3s
- Success: green, Error: red, Info: blue
- Framer Motion: slide in from right, fade out

### EmptyState
- Illustration icon, message, action CTA
- Centered, generous padding

### LoadingSkeleton
- Shimmering pulse animation
- Card-sized blocks

## Interactions & Animations

- Page transitions: `opacity: 0 → 1`, `y: 10 → 0`, `0.2s`, `ease: [0.16, 1, 0.3, 1]`
- Card hover: `translateY(-2px)`, `shadow-md`, `0.2s`
- Button hover: `scale(1.02)`, `0.15s`
- Stagger children: `0.05s` delay between list items
- Checkbox: `scale(0.8) → scale(1)` spring
- Modal: backdrop fade, content slide-up with spring
- Toast: slide-in from right, auto-dismiss with fade
- Loading: shimmer pulse, 1.5s cycle

## Data Model

```typescript
interface Habit {
  id: string;
  name: string;
  category: string;
  type: 'good' | 'bad';
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0-6 for custom frequency
  startDate: string; // ISO date
  createdAt: string;
  history: HabitRecord[];
  order: number;
}

interface HabitRecord {
  date: string; // ISO date
  completed: boolean;
}

interface AppState {
  habits: Habit[];
  theme: 'light' | 'dark';
  filters: FilterState;
}

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  category: string | null;
  status: 'all' | 'completed' | 'missed' | 'pending';
  type: 'all' | 'good' | 'bad';
  startDate?: string;
  endDate?: string;
}
```

## State Management (Context API)

- `HabitContext`: CRUD operations, history tracking, filter state
- `ThemeContext`: light/dark toggle, localStorage sync
- `ToastContext`: notification queue
- `ModalContext`: modal stack management

All state persisted to localStorage on every change.

## Dependencies

- `react` + `react-dom` + `react-router-dom` (HashRouter)
- `framer-motion` — animations
- `recharts` — charts
- `lucide-react` — icons (preferred over react-icons)
- `date-fns` — date utilities (lighter than moment)
- `tailwindcss` + `postcss` + `autoprefixer`

## Asset Manifest

No custom images needed. Icons are from Lucide. Gradient accents are CSS-only. No external assets.

## Responsive Rules

- Mobile (< 640px): single column, sidebar hidden (drawer), compact stats
- Tablet (640-1024px): 2 columns, sidebar visible
- Desktop (> 1024px): 3-4 columns, sidebar visible, full layout
- Touch targets: minimum 44px

## Worker Grouping Suggestions

1. **Scaffold Worker**: Initialize project, setup Tailwind, routing, theme, layout, global state contexts
2. **Dashboard Worker**: Dashboard page, stat cards, habit list, recent activity, create habit modal
3. **Analytics Worker**: Analytics page, all charts (line, bar, pie, heatmap, comparisons), calendar page
4. **Habits Worker**: All Habits page, Habit Details page, filters, CRUD operations, single habit analytics
5. **Settings Worker**: Settings page, theme toggle, import/export, data management

## Calculation Formulas

- Completion Rate: `(completed / total) × 100`
- Streak: consecutive days from today backward where completed = true
- Longest Streak: max consecutive streak in history
- Growth Score: `(current_month_avg - previous_month_avg) / previous_month_avg × 100`
- Good vs Bad Ratio: `good_habits_count : bad_habits_count`
