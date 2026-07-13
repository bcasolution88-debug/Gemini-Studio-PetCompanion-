import { useState, useEffect } from 'react';
import { Pet } from '../types';
import { MOCK_PETS } from '../data/pets';
import { PetCard } from './PetCard';
import PetDetailModal from './PetDetailModal';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function RecommendationWidget() {
  const [recommendations, setRecommendations] = useState<{petId: string, reason: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const { t } = useLanguage();

  // Helper to load all pets (mock + custom added)
  const getAllPets = (): Pet[] => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      return saved ? JSON.parse(saved) : MOCK_PETS;
    } catch {
      return MOCK_PETS;
    }
  };

  const fetchRecommendations = () => {
    setLoading(true);
    let activePrefs = { species: 'Dog', age: 'Adult', location: 'New York' };
    let activeInteractions: string[] = [];
    
    try {
      const savedFilters = localStorage.getItem('pet_community_filters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        activePrefs = {
          species: parsed.species || 'Dog',
          age: parsed.age || 'Adult',
          location: parsed.location || 'New York'
        };
      }
      const savedViewed = localStorage.getItem('pet_community_viewed_ids');
      if (savedViewed) {
        activeInteractions = JSON.parse(savedViewed);
      }
    } catch (e) {
      console.error('Error reading localStorage for recommendations:', e);
    }

    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: activePrefs,
        interactedPets: activeInteractions.length > 0 ? activeInteractions : ['1']
      })
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecommendations(data);
        } else {
          setRecommendations([]);
        }
      })
      .catch(() => {
        // Simple client side fallback if network is completely off
        const petsList = getAllPets();
        const fallback = petsList.slice(0, 3).map(p => ({
          petId: p.id,
          reason: `Special match matching your focus in ${p.location}.`
        }));
        setRecommendations(fallback);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    fetchRecommendations();

    const handleFiltersChanged = () => fetchRecommendations();
    const handlePetViewed = () => fetchRecommendations();

    window.addEventListener('pet-filters-changed', handleFiltersChanged);
    window.addEventListener('pet-viewed', handlePetViewed);

    return () => {
      window.removeEventListener('pet-filters-changed', handleFiltersChanged);
      window.removeEventListener('pet-viewed', handlePetViewed);
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-12 bg-white dark:bg-stone-900 p-8 rounded-3xl border border-orange-100 dark:border-stone-800 shadow-sm text-center">
        <div className="w-10 h-10 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">{t('Finding your perfect pet matches...', '正在努力为您搜寻最佳宠物伴侣推荐...')}</p>
      </div>
    );
  }

  const allPets = getAllPets();
  const recommendedPets = recommendations
    .map(rec => allPets.find(p => p.id === rec.petId))
    .filter((pet): pet is Pet => !!pet);

  if (recommendedPets.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">{t('Perfect Matches for You', '为您定制的智能推荐')}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendedPets.map((pet, i) => {
          let matchingReason = recommendations.find(r => r.petId === pet.id)?.reason || '';
          if (!matchingReason) {
            matchingReason = t(
              `A highly compatible match based on your recent searches for ${pet.species} companions.`,
              `基于您近期对【${pet.species === 'Dog' ? '狗狗' : pet.species === 'Cat' ? '猫咪' : pet.species === 'Bird' ? '鸟类' : '小型萌宠'}】伴侣的检索偏好，为您高度匹配的萌宠。`
            );
          } else if (matchingReason.startsWith('Special match matching your focus in')) {
            const loc = matchingReason.replace('Special match matching your focus in ', '').replace('.', '').trim();
            const locZh = loc === 'New York' ? '纽约' : loc === 'Los Angeles' ? '洛杉矶' : loc === 'Chicago' ? '芝加哥' : loc === 'San Francisco' ? '旧金山' : loc;
            matchingReason = t(
              matchingReason,
              `特别推荐：完美契合您对【${locZh}】地区的关注与领养检索偏好。`
            );
          }
          return (
            <div key={pet.id} className="space-y-3 flex flex-col h-full bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-orange-50/50 dark:border-stone-800 p-3">
              <div className="flex-1">
                <PetCard pet={pet} onClick={() => {
                  setSelectedPet(pet);
                  try {
                    const viewed = localStorage.getItem('pet_community_viewed_ids');
                    const list = viewed ? JSON.parse(viewed) : [];
                    if (!list.includes(pet.id)) {
                      list.push(pet.id);
                      localStorage.setItem('pet_community_viewed_ids', JSON.stringify(list));
                      window.dispatchEvent(new CustomEvent('pet-viewed'));
                    }
                  } catch (e) {
                    console.error('Error updating viewed list:', e);
                  }
                }} />
              </div>
              <div className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/30 dark:border-rose-950/40 rounded-xl">
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                  {matchingReason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {selectedPet && (
        <PetDetailModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
      )}
    </div>
  );
}
