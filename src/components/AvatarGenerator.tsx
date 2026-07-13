import React, { useState } from 'react';
import { Pet } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface AvatarGeneratorProps {
  pet: Pet;
  onAvatarGenerated: (imageUrl: string) => void;
}

export default function AvatarGenerator({ pet, onAvatarGenerated }: AvatarGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ species: pet.species, breed: pet.breed }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        onAvatarGenerated(data.imageUrl);
      }
    } catch (error) {
      console.error('Failed to generate avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {loading ? t('Generating...', '生成中...') : t('Generate AI Avatar', '生成AI头像')}
    </button>
  );
}
