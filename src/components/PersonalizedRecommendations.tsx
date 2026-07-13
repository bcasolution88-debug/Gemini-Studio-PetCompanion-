import React, { useState, useEffect } from 'react';
import { Pet } from '../types';
import { Sparkles, Loader2 } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  pet: Pet;
}

export default function PersonalizedRecommendations({ pet }: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<{
    toys: string[];
    treats: string[];
    training: string[];
    careTips: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/personalized-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pet }),
        });
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [pet]);

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>;
  if (!recommendations) return null;

  return (
    <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-indigo-500 w-5 h-5" />
        <h3 className="font-bold text-stone-900 dark:text-stone-100">AI Personalized Tips</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(recommendations as Record<string, string[]>).map(([key, list]) => (
          <div key={key}>
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{key}</h4>
            <ul className="space-y-1">
              {list.map((item, i) => (
                <li key={i} className="text-sm text-stone-700 dark:text-stone-300">• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
