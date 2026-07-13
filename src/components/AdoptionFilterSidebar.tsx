import { useState, useEffect } from 'react';
import { Filter, ChevronDown, Search, Sparkles, Heart, HelpCircle, History, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import AIBreedMatcher from './AIBreedMatcher';
import CompatibilityQuiz from './PetMatchingQuiz';

export default function AdoptionFilterSidebar() {
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState(''); // Category: '', 'Puppy/Kitten', 'Adult', 'Senior'
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const [showMatcher, setShowMatcher] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  
  // Geolocation states
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { t } = useLanguage();

  const filterOptions = {
    species: ['Dog', 'Cat', 'Bird', 'Small Pet'],
    location: ['New York', 'Los Angeles', 'Chicago', 'San Francisco'],
  };


  // Sync state with localstorage if changed externally (e.g. Cleared filters button in Grid)
  useEffect(() => {
    const savedRecent = localStorage.getItem('recent_adoption_searches');
    if (savedRecent) {
      setRecentSearches(JSON.parse(savedRecent));
    }
    const handleFiltersChanged = () => {
      try {
        const saved = localStorage.getItem('pet_community_filters');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSpecies(parsed.species || '');
          setAge(parsed.age || '');
          setLocation(parsed.location || '');
          setSearch(parsed.search || '');
          setSortByDistance(parsed.sortByDistance || false);
          setUserCoords(parsed.userCoords || null);
        } else {
          setSpecies('');
          setAge('');
          setLocation('');
          setSearch('');
          setSortByDistance(false);
          setUserCoords(null);
        }
      } catch (e) {
        console.error('Error syncing filters state:', e);
      }
    };

    window.addEventListener('pet-filters-changed', handleFiltersChanged);
    handleFiltersChanged(); // initial load
    return () => {
      window.removeEventListener('pet-filters-changed', handleFiltersChanged);
    };
  }, []);

  const handleApplyFilters = () => {
    try {
      const currentFilter = { species, age, location, search, sortByDistance, userCoords };
      localStorage.setItem('pet_community_filters', JSON.stringify(currentFilter));
      const updated = [currentFilter, ...recentSearches.filter(s => JSON.stringify(s) !== JSON.stringify(currentFilter))].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recent_adoption_searches', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('pet-filters-changed'));
    } catch (e) {
      console.error('Error applying filters:', e);
    }
  };

  const handleClearFilters = () => {
    setSpecies('');
    setAge('');
    setLocation('');
    setSearch('');
    setSortByDistance(false);
    setUserCoords(null);
    setErrorMsg('');
    try {
      localStorage.removeItem('pet_community_filters');
      window.dispatchEvent(new CustomEvent('pet-filters-changed'));
    } catch (e) {
      console.error('Error clearing filters:', e);
    }
  };

  const handleToggleDistance = () => {
    if (!sortByDistance) {
      if (!navigator.geolocation) {
        setErrorMsg(t('Geolocation not supported by browser.', '您的浏览器不支持地理定位服务。'));
        return;
      }

      setIsLocating(true);
      setErrorMsg('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserCoords(coords);
          setSortByDistance(true);

          // Apply directly for a seamless experience
          const currentFilter = { 
            species, 
            age, 
            location, 
            search, 
            sortByDistance: true, 
            userCoords: coords 
          };
          localStorage.setItem('pet_community_filters', JSON.stringify(currentFilter));
          window.dispatchEvent(new CustomEvent('pet-filters-changed'));
        },
        (error) => {
          setIsLocating(false);
          console.error('Geolocation error:', error);
          let msg = t('Failed to get your location.', '无法获取您的位置，请检查浏览器定位权限。');
          if (error.code === error.PERMISSION_DENIED) {
            msg = t('Location permission denied.', '定位权限被拒，请在浏览器中开启定位。');
          }
          setErrorMsg(msg);
          setSortByDistance(false);
          setUserCoords(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setSortByDistance(false);
      setUserCoords(null);
      setErrorMsg('');

      // Apply directly
      const currentFilter = { 
        species, 
        age, 
        location, 
        search, 
        sortByDistance: false, 
        userCoords: null 
      };
      localStorage.setItem('pet_community_filters', JSON.stringify(currentFilter));
      window.dispatchEvent(new CustomEvent('pet-filters-changed'));
    }
  };

  return (
    <div className="w-full bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-100 dark:border-stone-800 shadow-sm h-fit">
      <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center">
        <Filter className="w-5 h-5 mr-2 text-rose-500" />
        {t('Filter Pets', '筛选宠物')}
      </h3>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t('Keyword Search', '关键词检索')}</label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('e.g. Golden Retriever, calm...', '例如：金毛犬, 温柔温顺...')}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white"
            />
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t('Species', '宠物类别')}</label>
          <div className="relative">
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full appearance-none bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white font-bold"
            >
              <option value="">{t('Select Species', '选择宠物物种')}</option>
              {filterOptions.species.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Dog' ? t('Dog', '狗狗 🐶') : 
                   opt === 'Cat' ? t('Cat', '猫咪 🐱') : 
                   opt === 'Bird' ? t('Bird', '鸟类 🐦') : 
                   opt === 'Small Pet' ? t('Small Pet', '小型萌宠 🐹') : opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t('Age Category', '年龄阶段')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('All Ages', '不限年龄'), value: '' },
              { label: t('Puppy/Kitten', '幼年期 🍼'), value: 'Puppy/Kitten' },
              { label: t('Adult', '成年期 🐕'), value: 'Adult' },
              { label: t('Senior', '老年期 👵'), value: 'Senior' }
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setAge(opt.value)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                  age === opt.value
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-750'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t('Location', '所在地区')}</label>
          <div className="relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full appearance-none bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white font-bold"
            >
              <option value="">{t('Select Location', '选择地区位置')}</option>
              {filterOptions.location.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'New York' ? t('New York', '纽约 (New York)') : 
                   opt === 'Los Angeles' ? t('Los Angeles', '洛杉矶 (Los Angeles)') : 
                   opt === 'Chicago' ? t('Chicago', '芝加哥 (Chicago)') : 
                   opt === 'San Francisco' ? t('San Francisco', '旧金山 (San Francisco)') : opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Premium Geolocation Sort Card */}
        <div className="bg-stone-50 dark:bg-stone-850/40 p-4 rounded-2xl border border-stone-150 dark:border-stone-800 shadow-inner space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 ${sortByDistance ? 'text-rose-500 animate-bounce' : 'text-stone-400 dark:text-stone-500'}`} />
              <div className="text-left">
                <span className="block text-xs font-extrabold text-stone-800 dark:text-stone-200">
                  {t('Sort by Proximity', '按距离近到远排序')}
                </span>
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold">
                  {t('Use GPS Geolocation', '使用 GPS 浏览器定位')}
                </span>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={handleToggleDistance}
              disabled={isLocating}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                sortByDistance ? 'bg-rose-500' : 'bg-stone-250 dark:bg-stone-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  sortByDistance ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isLocating && (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-extrabold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t('Retrieving exact GPS coordinates...', '正在获取精确 GPS 卫星坐标...')}</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100/40">
              ⚠️ {errorMsg}
            </div>
          )}

          {sortByDistance && userCoords && (
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1.5 rounded-lg border border-emerald-100/40 dark:border-emerald-900/30 flex items-center justify-between">
              <span>📍 {t('Connected to GPS', '卫星定位成功')}</span>
              <span className="font-mono text-[9px] opacity-80">
                {userCoords.lat.toFixed(4)}°, {userCoords.lng.toFixed(4)}°
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button 
            onClick={() => setShowMatcher(true)}
            className="w-full bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('AI Breed Matcher', '智能品种匹配')}
          </button>
          <button 
            onClick={() => setShowQuiz(true)}
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
          >
            <HelpCircle className="w-4 h-4" />
            {t('Compatibility Quiz', '领养匹配问卷')}
          </button>
          <button 
            onClick={handleApplyFilters}
            className="w-full bg-rose-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-rose-600 transition-colors cursor-pointer"
          >
            {t('Apply Filters', '应用筛选')}
          </button>
          <button 
            onClick={handleClearFilters}
            className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer"
          >
            {t('Clear Filters', '重置清空')}
          </button>
          <button 
            className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl py-2.5 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            {t('Donate to Shelter', '捐助救助站')}
          </button>
        </div>
      </div>
      {recentSearches.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
          <h4 className="text-xs font-bold text-stone-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <History className="w-3.5 h-3.5" />
            {t('Recent Searches', '最近搜索')}
          </h4>
          <div className="space-y-2">
            {recentSearches.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSpecies(s.species || '');
                  setAge(s.age || '');
                  setLocation(s.location || '');
                  setSearch(s.search || '');
                }}
                className="w-full text-left text-xs text-stone-600 dark:text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors truncate"
              >
                {s.search || s.species || s.location || '...'}
              </button>
            ))}
          </div>
        </div>
      )}
      {showMatcher && <AIBreedMatcher onClose={() => setShowMatcher(false)} />}
      {showQuiz && <CompatibilityQuiz onClose={() => setShowQuiz(false)} />}
    </div>
  );
}
