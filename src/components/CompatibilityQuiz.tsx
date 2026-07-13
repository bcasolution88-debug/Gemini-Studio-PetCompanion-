import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { MOCK_PETS } from '../data/pets';
import { Pet } from '../types';

export default function CompatibilityQuiz({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ playfulness: 0, calmness: 0, affectionLevel: 0 });
  const [results, setResults] = useState<{pet: Pet, score: number}[] | null>(null);

  const questions = [
    { key: 'playfulness', question: t('How energetic are you?', '您有多活力充沛？'), options: [ { label: 'Prefer relaxing', val: 20 }, { label: 'Like to go out', val: 50 }, { label: 'High energy', val: 90 } ] },
    { key: 'calmness', question: t('How much do you value quiet time?', '您有多重视安静时光？'), options: [ { label: 'Needs excitement', val: 20 }, { label: 'Balanced', val: 50 }, { label: 'Love quiet', val: 90 } ] },
    { key: 'affectionLevel', question: t('How much affection do you want?', '您需要多少陪伴？'), options: [ { label: 'Independent', val: 20 }, { label: 'Some cuddle', val: 50 }, { label: 'Constant cuddle', val: 90 } ] },
  ];

  const handleAnswer = (key: string, value: number) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (finalAnswers: typeof answers) => {
    const scoredPets = MOCK_PETS.map(pet => {
        if (!pet.personalityTraits) return { pet, score: 0 };
        
        const score = Math.round(
            (100 - Math.abs(pet.personalityTraits.playfulness - finalAnswers.playfulness)) * 0.33 +
            (100 - Math.abs(pet.personalityTraits.calmness - finalAnswers.calmness)) * 0.33 +
            (100 - Math.abs(pet.personalityTraits.affectionLevel - finalAnswers.affectionLevel)) * 0.34
        );
        return { pet, score };
    });
    setResults(scoredPets.sort((a, b) => b.score - a.score));
    
    try {
      localStorage.setItem('compatibility_quiz_completed', 'true');
      window.dispatchEvent(new CustomEvent('compatibility-quiz-completed'));
    } catch (e) {
      console.error('Error saving quiz completion:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-xl w-full max-w-sm space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Sparkles className="text-rose-500" /> {t('Perfect Match Quiz', '完美匹配问卷')}</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        
        {!results ? (
            <div className="space-y-4">
                <p className="font-semibold">{questions[step].question}</p>
                {questions[step].options.map(opt => (
                    <button key={opt.label} onClick={() => handleAnswer(questions[step].key, opt.val)} className="w-full p-3 bg-stone-100 dark:bg-stone-700 rounded-xl hover:bg-rose-100">{opt.label}</button>
                ))}
            </div>
        ) : (
            <div className="space-y-3">
                <p className="font-bold">{t('Your top matches:', '为您推荐的宠物：')}</p>
                {results.slice(0, 3).map(res => (
                    <div key={res.pet.id} className="p-3 bg-stone-50 dark:bg-stone-700 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-bold text-rose-500">{res.pet.name}</p>
                            <p className="text-xs text-stone-600">{res.pet.description}</p>
                        </div>
                        <span className="font-black text-indigo-600">{res.score}%</span>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
