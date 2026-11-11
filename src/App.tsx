/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import AdoptionFilterSidebar from './components/AdoptionFilterSidebar';
import PetGrid from './components/PetGrid';
import PostFeed from './components/PostFeed';
import DailyPetWisdom from './components/DailyPetWisdom';
import {
  Users, MessageSquare, BookOpen, Heart,
  MapPin, ChevronUp
} from 'lucide-react';
import { useLanguage } from './lib/LanguageContext';

// ---------------------------------------------------------------------------
// Code splitting
//
// These views were all statically imported, so the entry graph pulled in
// recharts, leaflet, the QR reader, jsPDF and motion before the first paint —
// even though the landing view needs none of them. Loading them lazily means
// the browser can render the pet grid first and fetch the heavy chunks only
// when the user opens that view.
//
// Kept eager on purpose: Navbar, PetGrid, AdoptionFilterSidebar, PostFeed and
// DailyPetWisdom, because they are visible on the default route.
// ---------------------------------------------------------------------------
const AIChatWidget = lazy(() => import('./components/AIChatWidget'));
const AIHelperView = lazy(() => import('./components/AIHelperView'));
const NearbyServicesMap = lazy(() => import('./components/NearbyServicesMap'));
const PetTracker = lazy(() => import('./components/PetTracker'));
const AdoptionStatsDashboard = lazy(() => import('./components/AdoptionStatsDashboard'));
const MyAdoptionJourney = lazy(() => import('./components/MyAdoptionJourney'));
const SuccessStories = lazy(() => import('./components/SuccessStories'));
const PetMemoriesGallery = lazy(() => import('./components/PetMemoriesGallery'));
const PetQAFeed = lazy(() => import('./components/PetQAFeed'));
const RecommendationWidget = lazy(() => import('./components/RecommendationWidget'));
const ReminderService = lazy(() => import('./components/ReminderService'));
const WeeklyPetDigest = lazy(() => import('./components/WeeklyPetDigest'));
const DailyCareTips = lazy(() => import('./components/DailyCareTips'));
const PetHealthJournal = lazy(() => import('./components/PetHealthJournal'));

/**
 * Placeholder shown while a lazily-loaded chunk is in flight.
 * Keeps layout height stable so the page does not jump when it resolves,
 * and is announced politely rather than being a silent blank.
 */
const ViewFallback: React.FC<{ label: string }> = ({ label }) => (
  <div
    role="status"
    aria-live="polite"
    className="rounded-card border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 animate-pulse"
  >
    <div className="h-3 w-24 rounded bg-stone-200 dark:bg-stone-700 mb-3" />
    <div className="h-3 w-full rounded bg-stone-100 dark:bg-stone-800 mb-2" />
    <div className="h-3 w-2/3 rounded bg-stone-100 dark:bg-stone-800" />
    <span className="sr-only">{label}</span>
  </div>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [communityTab, setCommunityTab] = useState<'feed' | 'qa'>('feed');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    // Make local a-tag navigation a fluid SPA experience
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('/')) {
          e.preventDefault();
          window.history.pushState(null, '', href);
          setCurrentPath(href);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  // Determine active view route
  const isCommunity = currentPath === '/community';
  const isAiHelper = currentPath === '/ai-helper';
  const isMap = currentPath === '/map';
  const isAdoption = currentPath === '/adoption' || (!isCommunity && !isAiHelper && !isMap);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 dark:text-stone-100 transition-colors duration-200">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Dynamic Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          {isAdoption && <AdoptionFilterSidebar />}
          <Suspense fallback={<ViewFallback label={t('Loading care tools', '正在加载护理工具')} />}>
            <DailyCareTips />
            <ReminderService />
            <WeeklyPetDigest />
            <PetHealthJournal />
          </Suspense>
        </aside>

        {/* Primary Screen Area */}
        <section className="flex-1 min-w-0">
          
          {/* ADOPTION TAB VIEW */}
          {isAdoption && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Heart className="w-8 h-8 text-rose-500 fill-current" /> {t('Find Your New Companion', '寻找您的全新伴侣伙伴')}
                </h1>
                <p className="text-body text-stone-500 dark:text-stone-400 mt-1 font-medium">{t('Browse adorable pets looking for loving homes, and get smart recommendations.', '浏览正在寻找有爱家庭的萌宠宝贝，并获取专属您的 AI 智能推荐。')}</p>
              </div>
              <DailyPetWisdom />
              <Suspense fallback={<ViewFallback label={t('Loading your adoption journey', '正在加载领养旅程')} />}>
                <MyAdoptionJourney />
                <AdoptionStatsDashboard />
                <SuccessStories />
                <PetMemoriesGallery />
              </Suspense>
              <PetGrid />
              <Suspense fallback={<ViewFallback label={t('Loading recommendations', '正在加载推荐')} />}>
                <RecommendationWidget />
              </Suspense>
            </div>
          )}

          {/* COMMUNITY TAB VIEW */}
          {isCommunity && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <span className="bg-white/20 text-caption font-black px-3 py-1 rounded-full uppercase tracking-wider">{t('Companion Network', '伴侣守护社交网络')}</span>
                  <h1 className="text-3xl font-black tracking-tight mt-2 flex items-center gap-2">
                    <Users className="w-8 h-8" /> {t('Community Hub', '社区互助分享中心')}
                  </h1>
                  <p className="text-body text-rose-100 mt-1 max-w-xl font-medium">
                    {t('Exchange heartwarming adoption stories, daily care advice, and consult vet professionals.', '分享温馨趣味的领养日记、日常养护攻略，并与宠物医生和专家在线交流。')}
                  </p>
                </div>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="bg-stone-100 dark:bg-stone-900 p-1.5 rounded-2xl flex gap-1 border border-stone-200/50 dark:border-stone-800">
                <button
                  onClick={() => setCommunityTab('feed')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-body font-black rounded-xl transition-all ${
                    communityTab === 'feed'
                      ? 'bg-white dark:bg-stone-800 text-rose-500 shadow-sm scale-[1.01]'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> {t('Community Feed', '社区热点动态')}
                </button>
                <button
                  onClick={() => setCommunityTab('qa')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-body font-black rounded-xl transition-all ${
                    communityTab === 'qa'
                      ? 'bg-white dark:bg-stone-800 text-rose-500 shadow-sm scale-[1.01]'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> {t('Pet Expert Q&A', '专家在线问答')}
                </button>
              </div>

              {/* View Render */}
              <div className="mt-4">
                <Suspense fallback={<ViewFallback label={t('Loading community posts', '正在加载社区内容')} />}>
                  {communityTab === 'feed' ? <PostFeed /> : <PetQAFeed />}
                </Suspense>
              </div>
            </div>
          )}

          {/* AI HELPER VIEW */}
          {isAiHelper && (
            <Suspense fallback={<ViewFallback label={t('Loading AI assistant', '正在加载 AI 助理')} />}>
              <AIHelperView />
            </Suspense>
          )}

          {/* MAP & TRACKER VIEW */}
          {isMap && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <MapPin className="w-8 h-8 text-rose-500" /> {t('Clinic Finder & Tracker', '诊所查找与宠物定位')}
                </h1>
                <p className="text-body text-stone-500 dark:text-stone-400 mt-1 font-medium">{t('Locate emergency care, vet hospitals, or shelter events on the real-time map, and track pets.', '在实时地图上快速查找急诊中心、宠物医院或救助站，并追踪您的爱宠位置。')}</p>
              </div>
              <Suspense fallback={<ViewFallback label={t('Loading map', '正在加载地图')} />}>
                <NearbyServicesMap />
                <div className="border-t dark:border-stone-800 pt-8">
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-4">{t('Real-Time Pet GPS Tracker', '实时宠物智能 GPS 追踪')}</h2>
                  <PetTracker />
                </div>
              </Suspense>
            </div>
          )}

        </section>
      </main>

      {/* Floating backup assistant for adoption screen only */}
      {isAdoption && (
        <Suspense fallback={null}>
          <AIChatWidget />
        </Suspense>
      )}

      {/* Back to Top floating action button at bottom-left */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-300 hover:scale-110 active:scale-95 border border-rose-400/20 cursor-pointer flex items-center justify-center group animate-fade-in"
          title={t('Back to Top', '返回顶部')}
          id="back-to-top-btn"
          aria-label={t('Back to Top', '返回顶部')}
        >
          <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
}
