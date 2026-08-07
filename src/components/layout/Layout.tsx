import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useHabits } from '../../contexts/HabitContext';
import LoadingSkeleton from '../common/LoadingSkeleton';

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setFilters, state } = useHabits();

  const handleSearch = (q: string) => {
    setFilters({ searchQuery: q });
  };

  return (
    <div className="min-h-[100dvh] bg-bg-light dark:bg-bg-dark text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          searchQuery={state.filters.searchQuery || ''}
          onSearchChange={handleSearch}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="max-w-7xl mx-auto space-y-4"
          >
            {state.error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {state.error}
              </div>
            )}
            {state.saving && (
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                Saving changes...
              </div>
            )}
            {state.loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <LoadingSkeleton count={4} />
              </div>
            ) : (
              <Outlet />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
