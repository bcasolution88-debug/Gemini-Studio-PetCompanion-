import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { MOCK_PETS } from '../data/pets';
import { Pet } from '../types';
import { PetCard } from './PetCard';
import PetDetailModal from './PetDetailModal';
import AddPetModal from './AddPetModal';
import { ArrowUpDown, Plus, SlidersHorizontal, Check, ChevronDown, Search, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const CITY_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
};

function getCoordinatesForLocation(location: string): { lat: number; lng: number } {
  const locLower = (location || '').toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (locLower.includes(city)) {
      return coords;
    }
  }
  // Stable fallback coordinate based on string hashing
  let hash = 0;
  for (let i = 0; i < locLower.length; i++) {
    hash = locLower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 35 + (Math.abs(hash % 100) / 10); // Between 35 and 45
  const lng = -100 + (Math.abs((hash >> 8) % 300) / 10); // Between -100 and -70
  return { lat, lng };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export default function PetGrid() {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'youngest' | 'oldest'>('newest');
  const { t } = useLanguage();


  // Load pets from local storage with MOCK_PETS fallback
  const [pets, setPets] = useState<Pet[]>(() => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      return saved ? JSON.parse(saved) : MOCK_PETS;
    } catch {
      return MOCK_PETS;
    }
  });

  // Track filter state dynamically
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('pet_community_filters');
      return saved ? JSON.parse(saved) : { species: '', age: '', location: '', special: '', sortByDistance: false, userCoords: null };
    } catch {
      return { species: '', age: '', location: '', special: '', sortByDistance: false, userCoords: null };
    }
  });

  // Listen to filter updates from AdoptionFilterSidebar
  useEffect(() => {
    const handleFiltersChanged = () => {
      try {
        const saved = localStorage.getItem('pet_community_filters');
        if (saved) {
          setFilters(JSON.parse(saved));
        } else {
          setFilters({ species: '', age: '', location: '', special: '', sortByDistance: false, userCoords: null });
        }
      } catch (e) {
        console.error('Failed to parse filters from localStorage:', e);
      }
    };

    window.addEventListener('pet-filters-changed', handleFiltersChanged);
    return () => {
      window.removeEventListener('pet-filters-changed', handleFiltersChanged);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    try {
      localStorage.setItem('pet_community_filters', JSON.stringify(newFilters));
      window.dispatchEvent(new CustomEvent('pet-filters-changed'));
    } catch (e) {
      console.error('Error setting search filter:', e);
    }
  };

  const handlePetAdded = (newPet: Pet) => {
    setPets((prev) => [newPet, ...prev]);
    try {
      window.dispatchEvent(new CustomEvent('pet-list-changed'));
    } catch (_) {}
  };

  // Label map for the sort selections
  const sortLabels = {
    newest: t('Newest Added', '最新发布时间'),
    youngest: t('Age (Youngest)', '按年龄 (从小到大)'),
    oldest: t('Age (Oldest)', '按年龄 (从大到小)'),
  };

  // Memoize filtered pets
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      if (filters.special === 'needs_care') {
        const text = ((pet.medicalStatus || '') + ' ' + (pet.description || '')).toLowerCase();
        const hasSpecialNeed = text.includes('need') || text.includes('supplement') || text.includes('care') || text.includes('special') || text.includes('regular') || text.includes('medication') || text.includes('disabled');
        if (!hasSpecialNeed) return false;
      }
      if (filters.species) {
        if (filters.species === 'Other') {
          if (pet.species === 'Dog' || pet.species === 'Cat') return false;
        } else if (pet.species !== filters.species) {
          return false;
        }
      }
      if (filters.age && pet.age !== filters.age) return false;
      if (filters.location) {
        const query = filters.location.toLowerCase().trim();
        const petLoc = pet.location.toLowerCase();
        if (!petLoc.includes(query)) return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const petName = (pet.name || '').toLowerCase();
        const petBreed = (pet.breed || '').toLowerCase();
        const petLoc = (pet.location || '').toLowerCase();
        const petShelter = (pet.shelterName || '').toLowerCase();
        const petDesc = (pet.description || '').toLowerCase();
        const petSpec = (pet.species || '').toLowerCase();
        
        const matchesName = petName.includes(query);
        const matchesBreed = petBreed.includes(query);
        const matchesLoc = petLoc.includes(query);
        const matchesShelter = petShelter.includes(query);
        const matchesDesc = petDesc.includes(query);
        const matchesSpec = petSpec.includes(query);
        
        if (!matchesName && !matchesBreed && !matchesLoc && !matchesShelter && !matchesDesc && !matchesSpec) {
          return false;
        }
      }
      return true;
    });
  }, [pets, filters]);

  // Memoize sorted results
  const sortedPets = useMemo(() => {
    const sorted = [...filteredPets];

    // Priority 1: Geolocation proximity sorting
    if (filters.sortByDistance && filters.userCoords) {
      const { lat: userLat, lng: userLng } = filters.userCoords;
      sorted.sort((a, b) => {
        const coordsA = getCoordinatesForLocation(a.location);
        const coordsB = getCoordinatesForLocation(b.location);
        const distA = calculateDistance(userLat, userLng, coordsA.lat, coordsA.lng);
        const distB = calculateDistance(userLat, userLng, coordsB.lat, coordsB.lng);
        return distA - distB;
      });
      return sorted;
    }

    if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const aVal = (a as any).createdAt || Number(a.id) || 0;
        const bVal = (b as any).createdAt || Number(b.id) || 0;
        return bVal - aVal;
      });
    } else {
      const ageWeights = {
        'Puppy/Kitten': 1,
        'Adult': 2,
        'Senior': 3,
      };
      sorted.sort((a, b) => {
        const aWeight = ageWeights[a.age] || 2;
        const bWeight = ageWeights[b.age] || 2;
        return sortBy === 'youngest' ? aWeight - bWeight : bWeight - aWeight;
      });
    }

    return sorted;
  }, [filteredPets, sortBy, filters.sortByDistance, filters.userCoords]);

  const quickCategories = [
    { id: 'all', label: t('All Companions', '所有萌宠'), icon: '✨', filterValues: { species: '', special: '' } },
    { id: 'dog', label: t('Dogs', '狗狗'), icon: '🐶', filterValues: { species: 'Dog', special: '' } },
    { id: 'cat', label: t('Cats', '猫咪'), icon: '🐱', filterValues: { species: 'Cat', special: '' } },
    { id: 'small_mammal', label: t('Small Mammals', '小型哺乳'), icon: '🐹', filterValues: { species: 'Small Pet', special: '' } },
    { id: 'special_care', label: t('Needs Special Care', '特别关爱'), icon: '🩹', filterValues: { species: '', special: 'needs_care' } },
  ];

  const currentCategory = useMemo(() => {
    if (filters.special === 'needs_care') return 'special_care';
    if (filters.species === 'Dog') return 'dog';
    if (filters.species === 'Cat') return 'cat';
    if (filters.species === 'Small Pet') return 'small_mammal';
    if (!filters.species && !filters.special) return 'all';
    return null;
  }, [filters.species, filters.special]);

  const handleSelectQuickCategory = (cat: typeof quickCategories[0]) => {
    const newFilters = { 
      ...filters, 
      species: cat.filterValues.species, 
      special: cat.filterValues.special 
    };
    try {
      localStorage.setItem('pet_community_filters', JSON.stringify(newFilters));
      window.dispatchEvent(new CustomEvent('pet-filters-changed'));
    } catch (e) {
      console.error('Error saving filters from quick bar:', e);
    }
  };

  return (
    <div className="space-y-6" id="pets-grid">
      {/* Sticky Horizontal Quick-Filter Bar */}
      <div className="sticky top-16 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200/40 dark:border-stone-850/40 shadow-sm flex items-center transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {quickCategories.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectQuickCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm border ${
                  isActive
                    ? 'bg-rose-500 text-white border-rose-500 scale-[1.02]'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200/60 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="bg-gradient-to-br from-rose-50/60 to-orange-50/30 dark:from-stone-900/40 dark:to-stone-950/20 p-6 rounded-3xl border border-rose-100/40 dark:border-stone-850/60 shadow-sm space-y-4 animate-fade-in">
        <div className="relative">
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('Search by pet breed, name, or shelter location...', '搜索宠物特定品种 (如金毛、布偶猫)、姓名或救助站位置...')}
            className="w-full bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 rounded-2xl pl-12 pr-10 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-500 font-bold shadow-inner"
          />
          <Search className="absolute left-4.5 top-4 h-4.5 w-4.5 text-rose-500" />
          {filters.search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 top-4 p-0.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
            </button>
          )}
        </div>
        
        {/* Hot Quick Search Recommendations */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-stone-400 dark:text-stone-500 font-bold">{t('Popular searches:', '热门搜索品种/地点：')}</span>
          {[
            { label: t('Golden Retriever', '金毛犬 🦮'), value: 'Golden Retriever' },
            { label: t('Ragdoll', '布偶猫 🐈'), value: 'Ragdoll' },
            { label: t('Husky', '哈士奇 🐺'), value: 'Husky' },
            { label: t('Poodle', '贵宾犬 🐩'), value: 'Poodle' },
            { label: t('New York', '纽约 🗽'), value: 'New York' },
            { label: t('Los Angeles', '洛杉矶 🌴'), value: 'Los Angeles' },
            { label: t('San Francisco', '旧金山 🌉'), value: 'San Francisco' }
          ].map((tag) => (
            <button
              key={tag.value}
              onClick={() => handleSearchChange(tag.value)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filters.search === tag.value
                  ? 'bg-rose-500 text-white shadow-sm scale-[1.03]'
                  : 'bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200/40 dark:border-stone-700/50'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-orange-100/60 dark:border-stone-800/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all active:scale-95 shadow-sm text-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('Add New Pet', '登记发布待领养')}
          </button>
        </div>

        {/* Custom Sort Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-stone-700 dark:text-stone-300 font-medium text-xs transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('Sort by:', '排序方式：')} <strong className="text-stone-900 dark:text-white">{sortLabels[sortBy]}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 ml-1 text-stone-400" />
          </button>
          
          {isSortDropdownOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                {(Object.keys(sortLabels) as Array<keyof typeof sortLabels>).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-left text-xs rounded-xl transition-colors cursor-pointer ${
                      sortBy === opt 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-semibold' 
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <span>{sortLabels[opt]}</span>
                    {sortBy === opt && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid or Empty State */}
      {sortedPets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-stone-900 dark:text-white mb-1 text-sm">{t('No Companions Found', '未找到匹配的宠物宝贝')}</h4>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-5">
            {t('Try adjusting your species, age filters, or location query to find your match.', '您可以尝试重新调整物种类别、年龄区间或搜索地区，以便匹配到待领养的宝贝。')}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.removeItem('pet_community_filters');
                window.dispatchEvent(new CustomEvent('pet-filters-changed'));
              } catch (_) {}
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            {t('Clear Filters', '清空所有筛选条件')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPets.map((pet) => {
            let petDistance: number | undefined;
            if (filters.sortByDistance && filters.userCoords) {
              const petCoords = getCoordinatesForLocation(pet.location);
              petDistance = calculateDistance(
                filters.userCoords.lat,
                filters.userCoords.lng,
                petCoords.lat,
                petCoords.lng
              );
            }
            return (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PetCard 
                  pet={pet} 
                  distance={petDistance}
                  onClick={() => {
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
                  }} 
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedPet && (
        <PetDetailModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
      )}
      <AddPetModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onPetAdded={handlePetAdded}
      />
    </div>
  );
}
