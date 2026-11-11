import React from 'react';
import { X, CheckSquare, Dog, Cat, Bird, Rabbit } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import Modal from './ui/Modal';
import { IconButton } from './ui/IconButton';

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
  const titleId = 'prep-checklist-title';

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={titleId}
      size="sm"
      panelClassName="p-6 space-y-4"
    >
      <div className="flex justify-between items-center gap-3">
        <h3
          id={titleId}
          className="font-black text-title text-stone-900 dark:text-white flex items-center gap-2"
        >
          <Icon className="w-6 h-6 text-indigo-500" aria-hidden="true" />
          {t('Preparation Checklist', '准备清单')}
        </h3>
        <IconButton
          aria-label={t('Close checklist', '关闭清单')}
          icon={<X className="w-5 h-5" />}
          onClick={onClose}
        />
      </div>
      <p className="text-body text-stone-600 dark:text-stone-400">
        {t(`Tips for your new ${species}:`, `为您新领养的 ${species} 准备的清单：`)}
      </p>
      <ul className="space-y-2">
        {speciesTips.map((tip, idx) => (
          <li key={idx} className="flex items-center gap-2 text-body text-stone-800 dark:text-stone-200">
            <CheckSquare className="w-4 h-4 text-success-500 shrink-0" aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>
      <button onClick={onClose} className="w-full p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-control font-bold transition-colors">
        {t('Got it', '知道了')}
      </button>
    </Modal>
  );
}
