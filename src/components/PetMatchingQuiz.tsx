import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, ChevronRight, ChevronLeft, Heart, 
  Smile, Home, Clock, Award, Users, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Pet } from '../types';
import { MOCK_PETS } from '../data/pets';
import { motion, AnimatePresence } from 'motion/react';

interface RecommendedBreed {
  breed: string;
  species: string;
  reason: string;
}

interface PetMatchResult {
  petId: string;
  score: number;
  reason: string;
}

interface QuizResults {
  profileAnalysis: string;
  recommendedBreeds: RecommendedBreed[];
  petMatches: PetMatchResult[];
}

export default function PetMatchingQuiz({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz Answers State
  const [answers, setAnswers] = useState({
    activityLevel: '',
    housing: '',
    timeAlone: '',
    experience: '',
    household: '',
    preferredSpecies: ''
  });

  // Load pets list on mount to match against
  const [availablePets, setAvailablePets] = useState<Pet[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      if (saved) {
        setAvailablePets(JSON.parse(saved));
      } else {
        setAvailablePets(MOCK_PETS);
      }
    } catch {
      setAvailablePets(MOCK_PETS);
    }
  }, []);

  const steps = [
    {
      key: 'activityLevel',
      title: t('Activity Level', '日常活力水平'),
      subtitle: t('How much exercise and physical stimulation can you provide?', '您日常能提供多少运动和身体活力互动？'),
      options: [
        { value: 'couch potato', label: t('Couch Potato 🛋️', '安静温和型 🛋️'), desc: t('Prefer relaxing, movie nights, and short leisurely strolls.', '喜欢宅家休息、看电影和轻松漫步。') },
        { value: 'moderate', label: t('Moderate Activity 🚶‍♂️', '日常适度型 🚶‍♂️'), desc: t('Enjoy daily outdoor walks, light play, and exploring parks.', '喜欢每日户外散步、轻度游戏和逛公园。') },
        { value: 'high energy', label: t('High Energy Athlete 🏃‍♂️', '高能户外型 🏃‍♂️'), desc: t('Running, hiking, intense fetching, and active agility games.', '喜欢慢跑、登山、高强度接球和敏捷游戏。') }
      ]
    },
    {
      key: 'housing',
      title: t('Housing Space', '居住生活空间'),
      subtitle: t('What is your current home living arrangement?', '您目前居住在怎样的家庭环境里？'),
      options: [
        { value: 'apartment', label: t('Small Apartment 🏙️', '小型公寓/住宅 🏙️'), desc: t('Cosy flat, close quarters, limited or no outdoor yard.', '温馨公寓、空间紧凑，无专属院子。') },
        { value: 'townhouse', label: t('Townhouse / Suburb 🏡', '中型联排别墅/平房 🏡'), desc: t('Moderate space with a balcony or a small garden.', '中等空间，带有露台、小阳台或小型草坪。') },
        { value: 'yard', label: t('Spacious House & Yard 🌳', '宽敞庭院大房 🌳'), desc: t('Large family home with a fully fenced secure yard to run around.', '空间宽敞，带有安全围栏的大型花园草地。') }
      ]
    },
    {
      key: 'timeAlone',
      title: t('Hours Alone', '每日独处时间'),
      subtitle: t('How many hours on average would your pet spend alone daily?', '宠物在工作日平均每天需要独处多久？'),
      options: [
        { value: '0-2 hours', label: t('0-2 hours (Rarely) 🏠', '0-2 小时 (很少独处) 🏠'), desc: t('Work from home or family member always present.', '远程办公或家里始终有其他成员陪伴。') },
        { value: '3-6 hours', label: t('3-6 hours (Part-time) 🚗', '3-6 小时 (部分时间) 🚗'), desc: t('In and out, typical hybrid work style.', '进进出出、经典混合办公或半天外出。') },
        { value: '7+ hours', label: t('7+ hours (Full shift) 💼', '7+ 小时 (长时间外出) 💼'), desc: t('Busy full-time career away from home.', '全天候忙碌上班族，白天基本不在家。') }
      ]
    },
    {
      key: 'experience',
      title: t('Pet Experience', '宠物养育经验'),
      subtitle: t('What is your history with pet ownership?', '您以前有养过宠物的经验吗？'),
      options: [
        { value: 'beginner', label: t('First-Time Parent 🍼', '初次养宠小白 🍼'), desc: t('Brand new to caring for an animal on my own.', '第一次独立对一条生命的全生命周期负责。') },
        { value: 'experienced', label: t('Had Pets Before 🐾', '资深爱宠人士 🐾'), desc: t('Have owned and trained dogs or cats in the past.', '过去曾亲自养育并培训过猫咪或狗狗。') },
        { value: 'expert', label: t('Advanced Handler 🏆', '专业训宠达人 🏆'), desc: t('Experience with high-drive, complex behaviors or breeds.', '养育过高驱动力或有特殊行为挑战的犬猫。') }
      ]
    },
    {
      key: 'household',
      title: t('Household Members', '家庭成员组成'),
      subtitle: t('Who will be sharing the living environment with the pet?', '谁将与这只宠物一同生活在同一个屋檐下？'),
      options: [
        { value: 'single', label: t('Adults Only 👤', '仅限成年人 👤'), desc: t('Quiet, stable home of singles, couples or roommates.', '安静稳定的单身、情侣或合租家庭。') },
        { value: 'children', label: t('Young Children 👶', '有小宝宝/儿童 👶'), desc: t('Active household with noise, playfulness, and toddlers.', '充满欢笑、活动量大、有年幼的小孩。') },
        { value: 'multi-pet', label: t('Multi-Pet Household 🐾', '多宠物大家庭 🐾'), desc: t('Already have dogs, cats, or small animals at home.', '家里目前已经有其他狗狗、猫咪或小动物。') }
      ]
    },
    {
      key: 'preferredSpecies',
      title: t('Preferred Companion', '理想伴侣类别'),
      subtitle: t('What species are you most drawn to?', '您最想领养什么样的动物？'),
      options: [
        { value: 'Dog', label: t('Dogs 🐶', '狗狗 🐶'), desc: t('Loyal, outgoing, loves walks and direct engagement.', '忠诚开朗、热爱散步、游戏以及直接的陪伴。') },
        { value: 'Cat', label: t('Cats 🐱', '猫咪 🐱'), desc: t('Independent, quiet, sweet purrs, and indoor play.', '独立安静、治愈呼噜、喜欢室内攀爬与互动。') },
        { value: 'Any', label: t('Surprise Me! ✨', '不限/等候缘分 ✨'), desc: t('Open to dogs, cats, or whichever buddy fits best.', '只要投缘，狗狗猫咪都欢迎，听从 AI 匹配。') }
      ]
    }
  ];

  const handleSelect = (key: string, val: string) => {
    setAnswers({ ...answers, [key]: val });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      submitQuiz();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/pet-matching-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          pets: availablePets
        })
      });

      if (!response.ok) {
        throw new Error('Matching request returned unhealthy response status.');
      }

      const data = await response.json();
      setResults(data);

      // Save quiz completion flag and full answers to dispatch global state
      localStorage.setItem('pet_adoption_quiz_answers', JSON.stringify(answers));
      localStorage.setItem('compatibility_quiz_completed', 'true');
      window.dispatchEvent(new CustomEvent('compatibility-quiz-completed'));
    } catch (err: any) {
      console.error(err);
      setError(t('An error occurred during AI analysis. Please check your connection or try again.', 'AI 深度分析时发生错误，请检查网络后重试。'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({
      activityLevel: '',
      housing: '',
      timeAlone: '',
      experience: '',
      household: '',
      preferredSpecies: ''
    });
    setStep(0);
    setResults(null);
    setError(null);
  };

  // Find exact Pet object by ID to display matching cards
  const getPetObj = (petId: string) => {
    return availablePets.find(p => p.id === petId) || availablePets[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-stone-100 dark:border-stone-800 flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-gradient-to-r from-orange-500/5 to-rose-500/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-base">
                {t('AI Pet Matching Quiz', 'AI 萌宠领养精准匹配')}
              </h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                {t('Gemini Cognition Matchmaker', '双子星智能匹配算法')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            
            {/* Loading Spinner */}
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                  <Heart className="w-8 h-8 text-rose-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-stone-900 dark:text-white">
                    {t('Consulting AI Counselors...', '咨询 AI 领养顾问中...')}
                  </h4>
                  <p className="text-xs text-stone-400 font-bold max-w-sm mx-auto">
                    {t('Analyzing your work hours, yard space, and activity level to find shelter pets waiting for a home like yours...', '正在综合分析您的工作独处时长、草坪空间及活力偏好，为您比对最契合的救助站萌宠宝贝...')}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex flex-col items-center text-center space-y-4"
              >
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-white">{t('Analysis Failed', '匹配分析失败')}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{error}</p>
                </div>
                <button 
                  onClick={submitQuiz}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('Retry Analysis', '重新发起匹配')}
                </button>
              </motion.div>
            )}

            {/* Quiz Step Wizard */}
            {!loading && !results && !error && (
              <motion.div 
                key={`step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-black text-stone-400">
                    <span>{t(`Question ${step + 1} of ${steps.length}`, `问题 ${step + 1} / ${steps.length}`)}</span>
                    <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300"
                      style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Info */}
                <div className="text-left space-y-1.5">
                  <h4 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
                    {steps[step].title}
                  </h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {steps[step].subtitle}
                  </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {steps[step].options.map((opt) => {
                    const isSelected = answers[steps[step].key as keyof typeof answers] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(steps[step].key, opt.value)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all group relative cursor-pointer ${
                          isSelected 
                            ? 'bg-rose-500/5 border-rose-500 dark:border-rose-400' 
                            : 'bg-stone-50/50 hover:bg-stone-100/50 dark:bg-stone-800/40 dark:hover:bg-stone-800/80 border-stone-150 dark:border-stone-850'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`font-extrabold text-sm ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-stone-850 dark:text-stone-150'}`}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-stone-400 dark:text-stone-400 mt-1 font-semibold">
                              {opt.desc}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-stone-300 dark:border-stone-600'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Actions Nav */}
                <div className="flex justify-between pt-4 border-t border-stone-100 dark:border-stone-850">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 0}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('Back', '上一步')}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!answers[steps[step].key as keyof typeof answers]}
                    className="px-6 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white text-xs font-extrabold rounded-xl shadow-md disabled:shadow-none transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{step === steps.length - 1 ? t('Submit Analysis', '开始智能匹配') : t('Next Step', '下一步')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Results Layout */}
            {!loading && results && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-left"
              >
                {/* Introduction Callout */}
                <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-2xl border border-rose-500/10 space-y-2">
                  <h4 className="text-xs font-extrabold text-rose-500 flex items-center gap-1 uppercase tracking-wider">
                    <Smile className="w-4 h-4 animate-bounce" />
                    {t('Your Adopter Profile Analysis', '领养匹配度分析')}
                  </h4>
                  <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed font-bold">
                    {results.profileAnalysis}
                  </p>
                </div>

                {/* Recommended breeds from Gemini */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-orange-500" />
                    {t('Top Compatible Breed Profiles', '推荐匹配的宠物品种')}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {results.recommendedBreeds?.slice(0, 3).map((br, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-150 dark:border-stone-800 hover:border-orange-200 transition-all space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-rose-500">{br.breed}</span>
                          <span className="text-[9px] bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded text-stone-500 font-bold">
                            {t(br.species, br.species)}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed font-semibold">
                          {br.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shelter animal ranking */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
                    {t('Best Matches Currently In Shelter', '救助站中完美契合的小家伙')}
                  </h4>

                  <div className="space-y-3">
                    {results.petMatches?.map((match) => {
                      const pet = getPetObj(match.petId);
                      if (!pet) return null;
                      return (
                        <div 
                          key={match.petId}
                          className="p-4 bg-white dark:bg-stone-850 rounded-2xl border border-stone-150 dark:border-stone-800/80 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                        >
                          <div className="flex gap-3 items-center flex-1">
                            {pet.imageUrl && (
                              <img 
                                src={pet.imageUrl} 
                                alt={pet.name} 
                                className="w-14 h-14 rounded-full object-cover border-2 border-rose-500/10 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-stone-900 dark:text-white">{pet.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                                  {pet.breed} • {t(pet.age, pet.age)}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400 font-bold mt-0.5">
                                {t('Shelter:', '所属救助站:')} {pet.shelterName}
                              </p>
                              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 font-bold leading-relaxed pr-2">
                                {match.reason}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-850">
                            <div className="text-left sm:text-right">
                              <span className="block text-xs font-black text-stone-400 uppercase tracking-widest">{t('AI Match', '匹配指数')}</span>
                              <span className="block text-xl font-black text-rose-500 leading-none mt-1">
                                {match.score}%
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                // Close modal and focus search on this pet or open adopter form
                                try {
                                  const filters = { species: pet.species, age: '', location: pet.location, search: pet.name, sortByDistance: false, userCoords: null };
                                  localStorage.setItem('pet_community_filters', JSON.stringify(filters));
                                  window.dispatchEvent(new CustomEvent('pet-filters-changed'));
                                } catch (e) {
                                  console.error(e);
                                }
                                onClose();
                              }}
                              className="ml-auto sm:ml-0 px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-extrabold rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              {t('View Detail', '了解细节')}
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex gap-2 pt-4 border-t border-stone-100 dark:border-stone-850 justify-end">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('Retake Quiz', '重新填写')}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {t('Close', '关闭窗口')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
