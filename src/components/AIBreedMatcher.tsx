import React, { useState } from 'react';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Modal from './ui/Modal';
import { IconButton } from './ui/IconButton';

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
    <Modal open onClose={onClose} labelledBy="breed-matcher-title" size="sm" panelClassName="p-6 space-y-4">
        <div className="flex justify-between items-center gap-3">
            <h3 id="breed-matcher-title" className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="text-brand-500" aria-hidden="true" />
              {t('Breed Matcher', '智能品种匹配')}
            </h3>
            <IconButton
              aria-label={t('Close breed matcher', '关闭品种匹配')}
              icon={<X className="w-5 h-5" />}
              onClick={onClose}
            />
        </div>
        
        {!suggestions ? (
            <div className="space-y-4">
                <input aria-label={t('Your lifestyle', '生活方式')} className="w-full p-3 rounded-control border bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" placeholder={t('Your lifestyle (e.g., active)', '生活方式 (例如：活跃)')} value={lifestyle} onChange={e => setLifestyle(e.target.value)} />
                <input aria-label={t('Living space', '居住空间')} className="w-full p-3 rounded-control border bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" placeholder={t('Living space (e.g., small apt)', '居住空间 (例如：小型公寓)')} value={space} onChange={e => setSpace(e.target.value)} />
                <button onClick={handleSubmit} disabled={loading || !lifestyle || !space} className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-control py-3 font-bold transition-colors disabled:opacity-50">{loading ? t('Matching...', '匹配中...') : t('Match!', '匹配!')}</button>
            </div>
        ) : (
            <div className="space-y-3">
                {suggestions.map(s => (
                    <div key={s.breed} className="p-3 bg-stone-50 dark:bg-stone-700 rounded-control">
                        <p className="font-bold text-brand-500">{s.breed}</p>
                        <p className="text-caption text-stone-600 dark:text-stone-300">{s.reason}</p>
                    </div>
                ))}
            </div>
        )}
    </Modal>
  );
}
