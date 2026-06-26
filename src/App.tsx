import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { HabitProvider } from './contexts/HabitContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AllHabits from './pages/AllHabits';
import HabitDetails from './pages/HabitDetails';
import Analytics from './pages/Analytics';
import CalendarView from './pages/CalendarView';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <HabitProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/habits" element={<AllHabits />} />
                <Route path="/habit/:id" element={<HabitDetails />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </HashRouter>
        </HabitProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
