import React from 'react';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const HIGHLIGHTS = [
  { id: 1, title: 'Adoption Drive Success', desc: 'Over 50 pets found homes this week!' },
  { id: 2, title: 'New Senior Pet Program', desc: 'Special support for elderly pet adopters.' }
];

const EVENTS = [
  { id: 1, title: 'Shelter Open House', date: 'June 28' },
  { id: 2, title: 'Pet Grooming Workshop', date: 'July 2' }
];

export default function WeeklyPetDigest() {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-4">
      <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
        <Newspaper className="w-4 h-4 text-indigo-500" /> {t('Weekly Digest', '每周摘要')}
      </h3>
      
      <div className="space-y-3">
        {HIGHLIGHTS.map(h => (
          <div key={h.id} className="text-xs">
            <p className="font-bold text-stone-800 dark:text-stone-200">{h.title}</p>
            <p className="text-stone-500">{h.desc}</p>
          </div>
        ))}
      </div>

      <div className="border-t dark:border-stone-700 pt-3 space-y-2">
        <h4 className="font-black text-stone-900 dark:text-white text-xs uppercase flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-emerald-500" /> {t('Upcoming Events', '近期活动')}
        </h4>
        {EVENTS.map(e => (
          <div key={e.id} className="flex justify-between items-center text-xs text-stone-600 dark:text-stone-400">
            <span>{e.title}</span>
            <span className="font-bold">{e.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
