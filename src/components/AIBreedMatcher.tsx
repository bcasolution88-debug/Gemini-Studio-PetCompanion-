import React, { useState } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface BreedSuggestion {
  breed: string;
  reason: string;
}

export default function AIBreedMatcher({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [lifestyle, setLifestyle] = useState('');
  const [space, setSpace] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BreedSuggestion[] | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/match-breed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lifestyle, space }),
      });
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-xl w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-rose-500" /> {t('Breed Matcher', '智能品种匹配')}</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        
        {!suggestions ? (
            <div className="space-y-4">
                <input className="w-full p-3 rounded-xl border" placeholder={t('Your lifestyle (e.g., active)', '生活方式 (例如：活跃)')} value={lifestyle} onChange={e => setLifestyle(e.target.value)} />
                <input className="w-full p-3 rounded-xl border" placeholder={t('Living space (e.g., small apt)', '居住空间 (例如：小型公寓)')} value={space} onChange={e => setSpace(e.target.value)} />
                <button onClick={handleSubmit} disabled={loading || !lifestyle || !space} className="w-full bg-rose-500 text-white rounded-xl py-3 font-bold">{loading ? t('Matching...', '匹配中...') : t('Match!', '匹配!')}</button>
            </div>
        ) : (
            <div className="space-y-3">
                {suggestions.map(s => (
                    <div key={s.breed} className="p-3 bg-stone-50 dark:bg-stone-700 rounded-xl">
                        <p className="font-bold text-rose-500">{s.breed}</p>
                        <p className="text-xs text-stone-600 dark:text-stone-300">{s.reason}</p>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
