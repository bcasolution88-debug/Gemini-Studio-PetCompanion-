import React, { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { LanguageProvider } from './lib/LanguageContext';

const App = React.lazy(() => import('./App.tsx'));


const GlobalLoadingSkeleton = () => (
  <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 md:p-8 space-y-6 animate-pulse select-none">
    {/* Simulated Navbar */}
    <div className="max-w-7xl mx-auto h-16 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 rounded-2xl flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-800" />
        <div className="w-24 h-5 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
      <div className="flex gap-6">
        <div className="w-16 h-4 bg-stone-100 dark:bg-stone-800 rounded-md hidden md:block" />
        <div className="w-16 h-4 bg-stone-100 dark:bg-stone-800 rounded-md hidden md:block" />
        <div className="w-16 h-4 bg-stone-100 dark:bg-stone-800 rounded-md hidden md:block" />
      </div>
      <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800" />
    </div>

    {/* Main layout skeleton */}
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar placeholder */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 rounded-3xl h-48 space-y-3 shadow-sm">
          <div className="w-1/2 h-4 bg-stone-200 dark:bg-stone-800 rounded-md" />
          <div className="w-full h-8 bg-stone-100 dark:bg-stone-800/50 rounded-xl" />
          <div className="w-full h-8 bg-stone-100 dark:bg-stone-800/50 rounded-xl" />
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 rounded-3xl h-36 space-y-3 shadow-sm">
          <div className="w-2/3 h-4 bg-stone-200 dark:bg-stone-800 rounded-md" />
          <div className="w-full h-12 bg-stone-100 dark:bg-stone-800/50 rounded-xl" />
        </div>
      </div>

      {/* Primary Screen Area placeholder */}
      <div className="flex-1 space-y-6">
        {/* Banner placeholder */}
        <div className="h-44 bg-stone-200 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 rounded-3xl p-8 flex flex-col justify-end space-y-3 shadow-sm">
          <div className="w-1/4 h-4 bg-stone-300 dark:bg-stone-800 rounded-full" />
          <div className="w-1/2 h-8 bg-stone-300 dark:bg-stone-800 rounded-md" />
          <div className="w-2/3 h-4 bg-stone-300 dark:bg-stone-800 rounded-full animate-pulse" />
        </div>

        {/* Dynamic Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 p-5 rounded-3xl space-y-4 shadow-sm">
              <div className="h-40 bg-stone-100 dark:bg-stone-800/80 rounded-2xl w-full" />
              <div className="space-y-2">
                <div className="w-2/3 h-5 bg-stone-200 dark:bg-stone-800 rounded-md" />
                <div className="w-1/3 h-4 bg-stone-100 dark:bg-stone-800/60 rounded-md" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="w-16 h-8 bg-stone-100 dark:bg-stone-800/60 rounded-xl" />
                <div className="w-24 h-8 bg-stone-200 dark:bg-stone-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <Suspense fallback={<GlobalLoadingSkeleton />}>
        <App />
      </Suspense>
    </LanguageProvider>
  </StrictMode>,
);
