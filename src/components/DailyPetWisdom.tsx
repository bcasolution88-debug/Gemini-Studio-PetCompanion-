import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function DailyPetWisdom({ species }: { species?: string }) {
  const [wisdom, setWisdom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchWisdom() {
      try {
        const response = await fetch('/api/behavior-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ species }),
        });
        if (!response.ok) throw new Error(t('Failed to fetch wisdom', '获取智慧提示失败'));
        const data = await response.json();
        setWisdom(data.tip);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchWisdom();
  }, [t, species]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return null; // Or show error UI
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-5 rounded-3xl shadow-sm border border-indigo-100 dark:border-indigo-800 flex flex-col space-y-3">
      <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
        <Sparkles className="w-5 h-5" />
        <h3 className="text-sm font-black uppercase tracking-wider">{t('Daily Pet Wisdom', '每日宠物智慧')}</h3>
      </div>
      <p className="text-sm text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
        {wisdom}
      </p>
    </div>
  );
}
