import React, { useState, useEffect } from 'react';
import { X, Phone, Heart, Activity, FileText, Mail, User, CheckCircle, MessageSquare, Lightbulb, Calendar, Printer, Sparkles } from 'lucide-react';
import { Pet, HealthJournalEntry } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import PersonalityRadar from './PersonalityRadar';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import PlaydatePlanner from './PlaydatePlanner';
import AvatarGenerator from './AvatarGenerator';
import GrowthTimeline from './GrowthTimeline';
import ApplyToAdoptForm from './ApplyToAdoptForm';
import PetFlyerGenerator from './PetFlyerGenerator';
import PetMatchingQuiz from './PetMatchingQuiz';

interface PetDetailModalProps {
  pet: Pet;
  onClose: () => void;
}

export default function PetDetailModal({ pet, onClose }: PetDetailModalProps) {
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showPlaydate, setShowPlaydate] = useState(false);
  const [showFlyer, setShowFlyer] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(pet.imageUrl);
  const [entries, setEntries] = useState<HealthJournalEntry[]>([]);
  const [inquirerName, setInquirerName] = useState('');
  const [inquirerEmail, setInquirerEmail] = useState('');
  const [inquirerPhone, setInquirerPhone] = useState('');
  const [inquirerMessage, setInquirerMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useLanguage();

  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<{ score: number; explanation: string } | null>(null);
  const [hasAnswers, setHasAnswers] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const checkQuizStatus = async () => {
    const saved = localStorage.getItem('pet_adoption_quiz_answers');
    if (saved) {
      setHasAnswers(true);
      setMatchLoading(true);
      try {
        const quizAnswers = JSON.parse(saved);
        const res = await fetch('/api/calculate-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pet, quizAnswers })
        });
        if (res.ok) {
          const data = await res.json();
          setMatchResult(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMatchLoading(false);
      }
    } else {
      setHasAnswers(false);
      setMatchResult(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pet_health_journal_entries');
    if (saved) {
      const allEntries: HealthJournalEntry[] = JSON.parse(saved);
      setEntries(allEntries.filter(e => e.petId === pet.id));
    }
    
    checkQuizStatus();

    const handleQuizCompleted = () => {
      checkQuizStatus();
    };
    window.addEventListener('compatibility-quiz-completed', handleQuizCompleted);
    return () => {
      window.removeEventListener('compatibility-quiz-completed', handleQuizCompleted);
    };
  }, [pet.id]);


  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquirerName || !inquirerEmail) return;

    const newInquiry = {
      id: `inq-${Date.now()}`,
      petId: pet.id,
      petName: pet.name,
      petImageUrl: pet.imageUrl,
      inquirerName,
      inquirerEmail,
      inquirerPhone,
      inquirerMessage,
      timestamp: Date.now()
    };

    try {
      const savedInquiries = localStorage.getItem('adoption_inquiries');
      const list = savedInquiries ? JSON.parse(savedInquiries) : [];
      list.push(newInquiry);
      localStorage.setItem('adoption_inquiries', JSON.stringify(list));

      // Trigger custom event to notify components (like Stats Dashboard!)
      window.dispatchEvent(new CustomEvent('inquiry-submitted'));

      // Clean audio trigger
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (err) {
      console.error(err);
    }

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-100 dark:border-stone-700">
        <div className="relative">
          <img
            src={avatarUrl}
            alt={pet.name}
            className="w-full h-72 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-stone-800/90 rounded-full hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-stone-900 dark:text-stone-100" />
          </button>
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 dark:text-white mb-1">{pet.name}</h2>
              <p className="text-stone-500 dark:text-stone-400">
                {pet.species === 'Dog' ? t('Dog', '狗狗') : pet.species === 'Cat' ? t('Cat', '猫咪') : pet.species === 'Bird' ? t('Bird', '鸟类') : pet.species === 'Small Pet' ? t('Small Pet', '小型萌宠') : pet.species} • {
                  pet.age === 'Puppy/Kitten' ? t('Puppy/Kitten', '幼年') : pet.age === 'Adult' ? t('Adult', '成年') : pet.age === 'Senior' ? t('Senior', '老年') : pet.age
                } • {
                  pet.location === 'New York' ? t('New York', '纽约') : pet.location === 'Los Angeles' ? t('Los Angeles', '洛杉矶') : pet.location === 'Chicago' ? t('Chicago', '芝加哥') : pet.location === 'San Francisco' ? t('San Francisco', '旧金山') : pet.location
                }
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-stone-900 dark:text-white mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-500" /> {t('Description', '宠物详细描述')}
              </h3>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{pet.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-rose-500" /> {t('Medical Status', '健康与医疗状况')}
                </h3>
                <p className="text-stone-700 dark:text-stone-300">{pet.medicalStatus}</p>
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-rose-500" /> {t('History', '救助成长背景')}
                </h3>
                <p className="text-stone-700 dark:text-stone-300">{pet.history}</p>
              </div>
            </div>

            {pet.personalityTraits && (
              <div className="mt-6">
                <h3 className="font-semibold text-stone-900 dark:text-white mb-2 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-rose-500" /> {t('Personality Radar', '性格特征雷达图')}
                </h3>
                <div className="flex justify-center">
                  <PersonalityRadar traits={{
                  playfulness: pet.personalityTraits.playfulness,
                  affectionLevel: pet.personalityTraits.affectionLevel,
                  intelligence: pet.personalityTraits.intelligence,
                  energyLevels: pet.personalityTraits.energyLevels
                }} />
                </div>
                <div className="mt-4">
                  <GrowthTimeline entries={entries} />
                </div>
                <PersonalizedRecommendations pet={pet} />
              </div>
            )}

            {/* AI Compatibility Match Score & Explanation Card */}
            <div className="p-5 bg-gradient-to-br from-rose-50/40 to-orange-50/40 dark:from-stone-900/40 dark:to-stone-850/40 border border-orange-100/60 dark:border-stone-850 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500 text-white rounded-lg">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">{t('AI Compatibility Matching', 'AI 契合度匹配分值')}</h4>
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">{t('Cognitive Lifestyle Matcher', '生活作息与环境比对顾问')}</p>
                  </div>
                </div>
                {hasAnswers && matchResult && (
                  <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 px-3 py-1 rounded-full text-xs font-black">
                    <span>{t('Match Score', '契合度')}</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">{matchResult.score}%</span>
                  </div>
                )}
              </div>

              {matchLoading ? (
                <div className="flex items-center justify-center py-4 gap-2">
                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-stone-400 font-semibold">{t('Calculating compatibility...', '正在为您精密比对生活作息与环境...')}</span>
                </div>
              ) : hasAnswers && matchResult ? (
                <div className="space-y-2">
                  <div className="p-3.5 bg-white/75 dark:bg-stone-900/60 border border-orange-100/40 dark:border-stone-800 rounded-xl">
                    <p className="text-xs text-stone-700 dark:text-stone-300 font-bold leading-relaxed whitespace-pre-line">
                      {matchResult.explanation}
                    </p>
                  </div>
                  <p className="text-[9px] text-stone-400 text-center font-bold">
                    💡 {t('Compatibility score calculated from your saved lifestyle preferences.', '以上匹配度由 AI 基于您填写的住房环境、独处时长及精力水平多维评估计算得出。')}
                  </p>
                </div>
              ) : (
                <div className="text-center py-3 space-y-3">
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold max-w-md mx-auto">
                    {t('Want to see how compatible you are with this pet? Answer a quick 6-question quiz about your environment and daily schedule to unlock a smart match score and tailored advice!', '想知道您与这只爱宠有多合拍吗？只需填写 6 道生活问答，即可直接在卡片上解锁双子星智能匹配契合度与有温度的匹配解析！')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(true)}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm shadow-rose-500/10 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    {t('Start Match Quiz', '开启智能适配度测评')}
                  </button>
                </div>
              )}
            </div>

            {showQuiz && (
              <PetMatchingQuiz onClose={() => { setShowQuiz(false); checkQuizStatus(); }} />
            )}

            {/* Inquire Action Block */}
            <div className="pt-6 border-t border-orange-100 dark:border-stone-700 space-y-4">
              {!showInquiryForm && !showApplyForm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{t('Shelter Caretaker', '收容救助中心负责人')}</p>
                    <p className="font-bold text-stone-900 dark:text-white">{pet.shelterName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <AvatarGenerator pet={pet} onAvatarGenerated={setAvatarUrl} />
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-rose-500/15"
                    >
                      {t('Apply to Adopt', '申请正式领养')}
                    </button>
                    <button
                      onClick={() => setShowInquiryForm(true)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-rose-400 rounded-xl px-5 py-3 font-semibold text-sm transition-colors cursor-pointer"
                    >
                      {t('Inquire Now', '立即咨询')}
                    </button>
                    <button
                      onClick={() => setShowPlaydate(!showPlaydate)}
                      className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl px-5 py-3 font-semibold text-sm transition-colors cursor-pointer flex items-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" /> {t('Playdate', '预约见面')}
                    </button>
                    <button
                      onClick={() => setShowFlyer(true)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-amber-400 rounded-xl px-5 py-3 font-semibold text-sm transition-colors cursor-pointer flex items-center"
                    >
                      <Printer className="w-4 h-4 mr-2" /> {t('Generate Flyer', '生成社区传单')}
                    </button>
                    <a
                      href={`tel:${pet.shelterPhone}`}
                      className="flex items-center bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-xl px-5 py-3 font-semibold text-sm transition-colors"
                    >
                      <Phone className="w-4 h-4 mr-2" /> {t('Call Shelter', '联系救助中心')}
                    </a>
                  </div>
                </div>
              ) : showApplyForm ? (
                isSubmitted ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-2xl text-center space-y-2 animate-fade-in">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="font-bold text-stone-900 dark:text-white text-sm">{t('Application Submitted Successfully!', '正式领养申请提交成功！')}</h4>
                    <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                      {t('Your formal application for', '您的正式领养申请（针对宠物')} <strong>{pet.name}</strong> {t('）已收到并录入后台。审核员会尽快对您的居住环境和养宠背景进行核实，并在 1-2 个工作日内向您发件或致电通知。', '）已收到并录入后台。审核员会尽快对您的居住环境和养宠背景进行核实，并在 1-2 个工作日内向您发件或致电通知。')}
                    </p>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setShowApplyForm(false);
                      }}
                      className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      {t('Done', '我知道了')}
                    </button>
                  </div>
                ) : (
                  <ApplyToAdoptForm
                    pet={pet}
                    onCancel={() => setShowApplyForm(false)}
                    onSuccess={() => setIsSubmitted(true)}
                  />
                )
              ) : isSubmitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-2xl text-center space-y-2 animate-fade-in">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-stone-900 dark:text-white text-sm">{t('Adoption Inquiry Submitted!', '领养咨询申请已成功提交！')}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                    {t('Thank you! Your inquiry for', '十分感谢！您对')} <strong>{pet.name}</strong> {t('has been logged. The shelter', '的领养意向已成功登记。救助中心')} <strong>{pet.shelterName}</strong> {t('will reach out to you within 24-48 hours.', '将在 24 至 48 小时内与您取得联系，请注意接听电话或查看邮件。')}
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setShowInquiryForm(false);
                    }}
                    className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    {t('Done', '我知道了')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="bg-stone-50 dark:bg-stone-900/40 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h4 className="text-xs font-black text-stone-850 dark:text-white uppercase tracking-wider">{t('Adoption Inquiry Form', '宠物领养意向登记表')}</h4>
                    <button
                      type="button"
                      onClick={() => setShowInquiryForm(false)}
                      className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold cursor-pointer"
                    >
                      {t('Cancel', '返回/取消')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Full Name', '您的姓名 (全名)')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={inquirerName}
                          onChange={(e) => setInquirerName(e.target.value)}
                          placeholder={t('Your Name', '请输入您的姓名')}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                        />
                        <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Email Address', '电子邮箱')}</label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={inquirerEmail}
                          onChange={(e) => setInquirerEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                        />
                        <Mail className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Phone Number', '联系电话')}</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={inquirerPhone}
                          onChange={(e) => setInquirerPhone(e.target.value)}
                          placeholder={t('555-0199', '电话号码')}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                        />
                        <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Inquiry Message', '领养申请理由/寄语')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={inquirerMessage}
                          onChange={(e) => setInquirerMessage(e.target.value)}
                          placeholder={t('Why do you want to adopt?', '简单说说您想领养它的初衷...')}
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                        />
                        <MessageSquare className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 shadow-md"
                  >
                    {t('Send Adoption Inquiry Profile', '提交我的领养申请档案')}
                  </button>
                </form>
              )}

              {showPlaydate && !showInquiryForm && (
                <div className="pt-4 animate-fade-in">
                  <PlaydatePlanner pet={pet} onClose={() => setShowPlaydate(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFlyer && (
        <PetFlyerGenerator
          pet={pet}
          onClose={() => setShowFlyer(false)}
        />
      )}
    </div>
  );
}
