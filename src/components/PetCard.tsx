import React, { FC, useState, useEffect } from 'react';
import { Pet } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { Sparkles, Share2, Video, Loader2, CheckCircle, Facebook, Twitter, Mail, Link, Copy, X } from 'lucide-react';
import { calculateAge, isSoundEnabled } from '../lib/utils';

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
  distance?: number;
}

export const PetCard: FC<PetCardProps> = ({ pet, onClick, distance }) => {
  const { t } = useLanguage();
  const [matchScore, setMatchScore] = useState<{score: number, reason: string} | null>(null);
  const [tourLoading, setTourLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const fetchScore = () => {
      const detailedQuiz = localStorage.getItem('pet_adoption_quiz_answers');
      const basicQuiz = localStorage.getItem('adoption_quiz_answers');

      if (detailedQuiz) {
        try {
          const quizAnswers = JSON.parse(detailedQuiz);
          fetch('/api/calculate-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet, quizAnswers })
          })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch detailed match');
            return res.json();
          })
          .then(data => {
            setMatchScore({
              score: data.score,
              reason: data.explanation || 'Perfect match for your lifestyle!'
            });
          })
          .catch(console.error);
        } catch (e) {
          console.error(e);
        }
      } else if (basicQuiz) {
        try {
          const quizProfile = JSON.parse(basicQuiz);
          fetch('/api/match-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet, quizProfile })
          })
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch basic match');
            return res.json();
          })
          .then(data => {
            setMatchScore({
              score: data.score,
              reason: data.reason || 'High compatibility match.'
            });
          })
          .catch(console.error);
        } catch (e) {
          console.error(e);
        }
      } else {
        setMatchScore(null);
      }
    };

    fetchScore();

    window.addEventListener('compatibility-quiz-completed', fetchScore);
    window.addEventListener('adoption-quiz-completed', fetchScore);
    
    return () => {
      window.removeEventListener('compatibility-quiz-completed', fetchScore);
      window.removeEventListener('adoption-quiz-completed', fetchScore);
    };
  }, [pet]);

  const breedText = pet.breed ? ` (${pet.breed})` : '';
  const shareUrl = `${window.location.origin}/?pet=${pet.id}`;
  const shareText = `🐾 Meet ${pet.name}! A lovely ${pet.age.toLowerCase()} ${pet.species.toLowerCase()}${breedText} waiting for adoption at ${pet.location}. View more details: ${shareUrl}`;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t(`Meet ${pet.name}!`, `快来见见 ${pet.name}！`),
          text: t(`Check out this lovely pet: ${pet.name}. ${pet.description}`, `看看这个可爱的宝贝：${pet.name}。${pet.description}`),
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing via native Web Share API:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);

      // Soft audio feedback for premium interaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && isSoundEnabled()) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (clipboardErr) {
      console.error('Failed to copy share link to clipboard:', clipboardErr);
    }
  };

  const handleVirtualTour = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setTourLoading(true);
    try {
        const res = await fetch('/api/generate-virtual-tour', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet })
        });
        const { operationName } = await res.json();
        
        // Poll
        let done = false;
        while (!done) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch('/api/virtual-tour-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operationName })
            });
            const status = await statusRes.json();
            done = status.done;
        }
        setVideoUrl(`/api/virtual-tour-download?operationName=${operationName}`);
    } catch (err) {
        console.error('Error generating tour:', err);
    } finally {
        setTourLoading(false);
    }
  };

  const getCategory = () => {
    const desc = pet.description.toLowerCase();
    if (desc.includes('retriever') || desc.includes('energetic')) return { label: 'High Energy', color: 'bg-orange-100 text-orange-800' };
    if (desc.includes('calm') || desc.includes('quiet')) return { label: 'Calm', color: 'bg-sky-100 text-sky-800' };
    if (desc.includes('senior') || pet.age === 'Senior') return { label: 'Senior', color: 'bg-purple-100 text-purple-800' };
    return null;
  };

  const category = getCategory();

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-orange-100 dark:border-stone-700 overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer relative"
    >
      {matchScore && (
        <div 
          className="absolute top-3 right-3 z-20 group/tooltip"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 border border-rose-200 dark:border-rose-950 shadow-sm cursor-help hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="text-xs font-black text-rose-600 dark:text-rose-400">{matchScore.score}%</span>
          </div>
          
          {/* Tooltip Content */}
          <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-stone-950/95 dark:bg-stone-900/95 backdrop-blur-md text-white dark:text-stone-100 text-[11px] rounded-2xl shadow-xl border border-stone-800/80 pointer-events-none opacity-0 translate-y-1 group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-250 z-30 leading-relaxed font-bold">
            <div className="flex items-center gap-1.5 mb-1.5 text-rose-400 font-extrabold uppercase tracking-wider text-[9px]">
              <Sparkles className="w-3 h-3 text-rose-400 fill-current" />
              <span>{t('AI Match Analysis', 'AI 匹配度智能分析')}</span>
            </div>
            {matchScore.reason}
          </div>
        </div>
      )}
      <button 
        onClick={handleShare}
        className="absolute top-3 left-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm p-1.5 rounded-full border border-stone-100 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors z-10"
        title={t('Share Pet', '分享宝贝')}
      >
        <Share2 className="w-4 h-4 text-stone-700 dark:text-stone-300" />
      </button>
      
      {videoUrl ? (
        <video src={videoUrl} controls className="w-full h-48 object-cover" />
      ) : (
        <div className="relative w-full h-48 bg-stone-100 dark:bg-stone-900 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-stone-200 via-stone-150 to-stone-200 dark:from-stone-800 dark:via-stone-850 dark:to-stone-800 flex items-center justify-center">
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 animate-pulse">Loading...</span>
            </div>
          )}
          <img
            src={pet.imageUrl}
            alt={pet.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-48 object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
            }`}
          />
        </div>
      )}

      {showShareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-stone-900/90 dark:bg-stone-950/90 text-white text-[11px] py-2 px-4 rounded-xl shadow-lg flex items-center gap-2 font-bold whitespace-nowrap z-20 animate-fade-in-up border border-stone-800/80">
          <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{t('Pet details copied!', '宝贝详情与链接已复制！')}</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100">{pet.name}</h3>
          {category && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${category.color}`}>
              {t(category.label, category.label)}
            </span>
          )}
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-1">
          {pet.species === 'Dog' ? t('Dog', '狗狗') : pet.species === 'Cat' ? t('Cat', '猫咪') : pet.species === 'Bird' ? t('Bird', '鸟类') : pet.species === 'Small Pet' ? t('Small Pet', '小型萌宠') : pet.species} • {
            pet.birthDate ? calculateAge(pet.birthDate) : (pet.age === 'Puppy/Kitten' ? t('Puppy/Kitten', '幼年') : pet.age === 'Adult' ? t('Adult', '成年') : pet.age === 'Senior' ? t('Senior', '老年') : pet.age)
          }
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-stone-500 dark:text-stone-500 font-bold">
            {pet.location === 'New York' ? t('New York', '纽约') : pet.location === 'Los Angeles' ? t('Los Angeles', '洛杉矶') : pet.location === 'Chicago' ? t('Chicago', '芝加哥') : pet.location === 'San Francisco' ? t('San Francisco', '旧金山') : pet.location}
          </p>
          {distance !== undefined && (
            <span className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold px-2 py-0.5 rounded-full border border-rose-100/40 dark:border-rose-900/30 shadow-sm shrink-0 flex items-center gap-0.5 animate-pulse">
              📍 {distance.toFixed(1)} km
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => {
                e.stopPropagation();
                handleVirtualTour(e);
            }}
            disabled={tourLoading}
            className="flex-1 mt-4 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-xl py-2 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            {tourLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
            {tourLoading ? t('Creating...', '正在生成...') : t('Tour', '导览')}
          </button>

          <button
            onClick={handleShare}
            className="mt-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
            title={t('Share Pet Details', '分享领养详情')}
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('Share', '分享')}</span>
          </button>

          <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="flex-1 mt-4 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl py-2 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
          >
            {t('View Details', '查看详情资料')}
          </button>
        </div>
      </div>

      {/* Social Media Sharing Modal overlay */}
      {showShareModal && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowShareModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 animate-scale-in text-left"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h4 className="font-extrabold text-stone-900 dark:text-white text-sm">
                  {t(`Share ${pet.name}`, `分享 ${pet.name}`)}
                </h4>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                  {t('Post to your social network', '发布至您的社交网络')}
                </p>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pet Quick card info preview */}
            <div className="flex gap-3 bg-stone-50 dark:bg-stone-850 p-3 rounded-2xl border border-stone-150/50 dark:border-stone-800">
              <img 
                src={pet.imageUrl} 
                alt={pet.name} 
                className="w-12 h-12 rounded-xl object-cover border border-stone-200/50 flex-shrink-0"
              />
              <div className="text-left min-w-0">
                <p className="font-black text-xs text-stone-900 dark:text-white truncate">{pet.name}</p>
                <p className="text-[10px] text-stone-400 font-bold truncate">
                  {pet.breed || pet.species} • {pet.location}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate italic mt-0.5">
                  "{pet.description}"
                </p>
              </div>
            </div>

            {/* Social Sharing grid */}
            <div className="grid grid-cols-4 gap-2">
              {/* X / Twitter */}
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer border border-stone-100 dark:border-stone-800 group"
              >
                <div className="p-2 bg-stone-900 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Twitter className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[9px] text-stone-600 dark:text-stone-300 font-black">Twitter</span>
              </a>

              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer border border-stone-100 dark:border-stone-800 group"
              >
                <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Facebook className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[9px] text-stone-600 dark:text-stone-300 font-black">Facebook</span>
              </a>

              {/* WhatsApp */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareModal(false)}
                className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer border border-stone-100 dark:border-stone-800 group"
              >
                <div className="p-2 bg-emerald-500 text-white rounded-lg group-hover:scale-105 transition-transform flex items-center justify-center w-8 h-8">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.02-5.101-2.871-6.956C16.613 1.93 14.137.91 11.517.91 6.08.91 1.657 5.332 1.654 10.774c-.001 1.763.463 3.483 1.343 5.01L2.012 21.6l5.962-1.564z" />
                  </svg>
                </div>
                <span className="text-[9px] text-stone-600 dark:text-stone-300 font-black">WhatsApp</span>
              </a>

              {/* Email */}
              <a 
                href={`mailto:?subject=${encodeURIComponent(t(`Adopt ${pet.name}!`, `领养 ${pet.name}！`))}&body=${encodeURIComponent(shareText)}`}
                onClick={() => setShowShareModal(false)}
                className="flex flex-col items-center gap-1.5 p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-850 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer border border-stone-100 dark:border-stone-800 group"
              >
                <div className="p-2 bg-rose-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-stone-600 dark:text-stone-300 font-black">Email</span>
              </a>
            </div>

            {/* Native / System share button if available */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  handleNativeShare();
                }}
                className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                {t('Open Native Share Menu', '打开系统级原生分享')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  handleCopyLink();
                }}
                className="w-full py-2 bg-stone-150 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-750 dark:text-stone-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200 dark:border-stone-700"
              >
                <Copy className="w-3.5 h-3.5 text-rose-500" />
                {t('Copy Listing Link', '复制领养页面链接')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
