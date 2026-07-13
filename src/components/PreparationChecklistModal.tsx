import React from 'react';
import { X, CheckSquare, Dog, Cat, Bird, Rabbit } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface Props {
  species: string;
  onClose: () => void;
}

const TIPS: Record<string, string[]> = {
  'Dog': ['High-quality dog food', 'Leash and collar with ID tag', 'Crate or dog bed', 'Food and water bowls', 'Toys and treats'],
  'Cat': ['Litter box and litter', 'Scratching post', 'Cat carrier', 'Cat food', 'Toys', 'Comfy bed'],
  'Bird': ['Appropriate sized cage', 'Perches', 'Bird-safe food', 'Water dishes', 'Toys for stimulation'],
  'Small Pet': ['Cage or habitat', 'Appropriate bedding', 'Water bottle/dish', 'Small pet food', 'Chew toys']
};

export default function PreparationChecklistModal({ species, onClose }: Props) {
  const { t } = useLanguage();
  const speciesTips = TIPS[species] || [];

  const icons: Record<string, any> = {
    'Dog': Dog,
    'Cat': Cat,
    'Bird': Bird,
    'Small Pet': Rabbit
  };
  const Icon = icons[species] || CheckSquare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl w-full max-w-sm shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-xl text-stone-900 dark:text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-indigo-500" />
            {t('Preparation Checklist', '准备清单')}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-stone-500"/></button>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          {t(`Tips for your new ${species}:`, `为您新领养的 ${species} 准备的清单：`)}
        </p>
        <ul className="space-y-2">
          {speciesTips.map((tip, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-stone-800 dark:text-stone-200">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              {tip}
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="w-full p-3 bg-indigo-500 text-white rounded-xl font-bold">
          {t('Got it', '知道了')}
        </button>
      </div>
    </div>
  );
}
