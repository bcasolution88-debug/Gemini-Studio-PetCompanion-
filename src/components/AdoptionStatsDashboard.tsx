import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MOCK_PETS } from '../data/pets';
import { Sparkles, Heart, ClipboardCheck, ArrowUpRight, User, HelpCircle, Send, Check, ListChecks, ChevronRight, CheckCircle2, Circle, Home, Award, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import PreparationChecklistModal from './PreparationChecklistModal';
import ProgressBar from './ProgressBar';
import CareRoutinePlanner from './CareRoutinePlanner';

export default function AdoptionStatsDashboard() {
  const [petsCount, setPetsCount] = useState(MOCK_PETS.length);
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvedSpecies, setApprovedSpecies] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true';
  });
  const { t } = useLanguage();

  const [readiness, setReadiness] = useState(() => {
    try {
      const saved = localStorage.getItem('adoption_readiness');
      const base = saved ? JSON.parse(saved) : {
        quizCompleted: false,
        careTipsRead: false,
        profileInfoSet: false,
        homeContextSet: false,
      };
      
      // Auto-initialize if completed elsewhere
      if (localStorage.getItem('compatibility_quiz_completed') === 'true') {
        base.quizCompleted = true;
      }
      if (localStorage.getItem('care_tips_read') === 'true') {
        base.careTipsRead = true;
      }
      return base;
    } catch {
      return {
        quizCompleted: false,
        careTipsRead: false,
        profileInfoSet: false,
        homeContextSet: false,
      };
    }
  });

  const toggleReadiness = (key: string) => {
    const nextValue = !readiness[key as keyof typeof readiness];
    const updated = { ...readiness, [key]: nextValue };
    setReadiness(updated);
    try {
      localStorage.setItem('adoption_readiness', JSON.stringify(updated));
      
      // Play a soft synthetic beep for interactive feedback
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(nextValue ? 587.33 : 392.00, ctx.currentTime); // D5 or G4
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.error('Error saving readiness item:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('notifications_enabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const stages = [
    { label: t('Application Sent', '申请已发送'), key: 'pending' },
    { label: t('Screening', '资料审核'), key: 'screening' },
    { label: t('Interview', '面试沟通'), key: 'interview' },
    { label: t('Final Approval', '最终审批'), key: 'approved' },
  ];

  const updateApplicationStatus = (appId: string, newStatus: string) => {
    try {
      const savedInquiriesStr = localStorage.getItem('adoption_inquiries');
      let inquiriesList = savedInquiriesStr ? JSON.parse(savedInquiriesStr) : [];
      inquiriesList = inquiriesList.map((app: any) => {
        if (app.id === appId) {
          return { ...app, status: newStatus };
        }
        return app;
      });
      localStorage.setItem('adoption_inquiries', JSON.stringify(inquiriesList));
      loadStats();
      window.dispatchEvent(new CustomEvent('inquiry-submitted'));

      // Play soft sound tone for interactive satisfaction
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(newStatus === 'approved' ? 659.25 : 523.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const deleteApplication = (appId: string) => {
    try {
      const savedInquiriesStr = localStorage.getItem('adoption_inquiries');
      let inquiriesList = savedInquiriesStr ? JSON.parse(savedInquiriesStr) : [];
      inquiriesList = inquiriesList.filter((app: any) => app.id !== appId);
      localStorage.setItem('adoption_inquiries', JSON.stringify(inquiriesList));
      loadStats();
      window.dispatchEvent(new CustomEvent('inquiry-submitted'));
    } catch (e) {
      console.error('Error deleting application:', e);
    }
  };

  const loadStats = () => {
    try {
      const savedPetsStr = localStorage.getItem('pet_community_pets');
      const petsList = savedPetsStr ? JSON.parse(savedPetsStr) : MOCK_PETS;
      setPetsCount(petsList.length);

      const savedInquiriesStr = localStorage.getItem('adoption_inquiries');
      const inquiriesList = savedInquiriesStr ? JSON.parse(savedInquiriesStr) : [];
      setInquiriesCount(inquiriesList.length);
      setApplications(inquiriesList);
      
      // Look for approved inquiries
      const approved = inquiriesList.find((i: any) => i.status === 'approved');
      if (approved) {
        const pet = petsList.find((p: any) => p.id === approved.petId);
        if (pet) {
            setApprovedSpecies(pet.species);
        }
      } else {
        setApprovedSpecies(null);
      }

      const customPetsCount = Math.max(0, petsList.length - MOCK_PETS.length);
      const customInquiriesCount = inquiriesList.length;

      const baseData = [
        { day: '1', adoptions: 2, inquiries: 3 },
        { day: '5', adoptions: 4, inquiries: 6 },
        { day: '10', adoptions: 6, inquiries: 9 },
        { day: '15', adoptions: 5, inquiries: 8 },
        { day: '20', adoptions: 8, inquiries: 12 },
        { day: '25', adoptions: 9 + customPetsCount, inquiries: 14 + customInquiriesCount },
      ];
      setChartData(baseData);
    } catch (e) {
      console.error('Error loading stats:', e);
      setChartData([
        { day: '1', adoptions: 2, inquiries: 3 },
        { day: '5', adoptions: 4, inquiries: 6 },
        { day: '10', adoptions: 6, inquiries: 9 },
        { day: '15', adoptions: 5, inquiries: 8 },
        { day: '20', adoptions: 8, inquiries: 12 },
        { day: '25', adoptions: 9, inquiries: 14 },
      ]);
    }
  };

  useEffect(() => {
    loadStats();

    const handleInquirySubmitted = () => {
      loadStats();
    };

    const handlePetListChanged = () => {
      loadStats();
    };

    const handleQuizCompleted = () => {
      setReadiness(prev => {
        const updated = { ...prev, quizCompleted: true };
        try {
          localStorage.setItem('adoption_readiness', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    };

    const handleTipsRead = () => {
      setReadiness(prev => {
        const updated = { ...prev, careTipsRead: true };
        try {
          localStorage.setItem('adoption_readiness', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    };

    window.addEventListener('inquiry-submitted', handleInquirySubmitted);
    window.addEventListener('pet-list-changed', handlePetListChanged);
    window.addEventListener('pet-filters-changed', handlePetListChanged);
    window.addEventListener('compatibility-quiz-completed', handleQuizCompleted);
    window.addEventListener('care-tips-read', handleTipsRead);

    return () => {
      window.removeEventListener('inquiry-submitted', handleInquirySubmitted);
      window.removeEventListener('pet-list-changed', handlePetListChanged);
      window.removeEventListener('pet-filters-changed', handlePetListChanged);
      window.removeEventListener('compatibility-quiz-completed', handleQuizCompleted);
      window.removeEventListener('care-tips-read', handleTipsRead);
    };
  }, []);

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return (app.status || 'pending') === statusFilter;
  });

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-orange-100/60 dark:border-stone-800/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Available Companions', '待领养伙伴')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">{petsCount}</span>
              <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {t('Live', '实时数据')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-orange-100/60 dark:border-stone-800/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Your Inquiries', '您的意向咨询')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">{inquiriesCount}</span>
              {inquiriesCount > 0 && (
                <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded">
                  {t('New', '最新记录')}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-orange-100/60 dark:border-stone-800/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">{t('Match Accuracy', 'AI 推荐度')}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-stone-900 dark:text-white">98%</span>
              <span className="text-[10px] font-semibold text-purple-500 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded">
                {t('High', '高精准')}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Adoption Journey & Readiness Tracker */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-indigo-100/60 dark:border-stone-800/60 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-stone-900 dark:text-white text-base tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" />
            {t('Application Readiness Tracker', '申请就绪度追踪')}
          </h3>
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            {t('Maximize your adoption readiness score by completing essential preparatory checkpoints.', '通过完善新手学习、档案和居住自检，点亮您的就绪徽章。')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Radial Progress Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50/40 to-rose-50/20 dark:from-indigo-950/15 dark:to-stone-950/20 rounded-2xl border border-indigo-50/50 dark:border-stone-800/40 text-center relative overflow-hidden">
            {/* Ambient visual shine */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-rose-400/10 to-indigo-500/10 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/10 to-emerald-400/10 rounded-full filter blur-2xl pointer-events-none" />

            <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={36}
                  className="stroke-stone-150 dark:stroke-stone-800 fill-none"
                  strokeWidth={7}
                />
                <circle
                  cx="48"
                  cy="48"
                  r={36}
                  className="stroke-indigo-500 dark:stroke-indigo-400 fill-none transition-all duration-1000 ease-out"
                  strokeWidth={7}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 - (Math.round((((readiness.quizCompleted ? 1 : 0) + (readiness.careTipsRead ? 1 : 0) + (readiness.profileInfoSet ? 1 : 0) + (readiness.homeContextSet ? 1 : 0) + (applications.length > 0 ? 1 : 0)) / 5) * 100) / 100) * (2 * Math.PI * 36)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black text-stone-900 dark:text-white leading-none">
                  {Math.round((((readiness.quizCompleted ? 1 : 0) + (readiness.careTipsRead ? 1 : 0) + (readiness.profileInfoSet ? 1 : 0) + (readiness.homeContextSet ? 1 : 0) + (applications.length > 0 ? 1 : 0)) / 5) * 100)}%
                </span>
                <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-0.5">{t('Score', '就绪分')}</span>
              </div>
            </div>

            <div className="space-y-1.5 z-10">
              <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/40 uppercase tracking-wide inline-block">
                {(() => {
                  const totalPercent = Math.round((((readiness.quizCompleted ? 1 : 0) + (readiness.careTipsRead ? 1 : 0) + (readiness.profileInfoSet ? 1 : 0) + (readiness.homeContextSet ? 1 : 0) + (applications.length > 0 ? 1 : 0)) / 5) * 100);
                  if (totalPercent === 100) return t('Certified Adopter', '完美通关 🏆');
                  if (totalPercent >= 80) return t('Almost Ready', '即将就绪 ✨');
                  if (totalPercent >= 50) return t('Ready Adopter', '蓄势待发 🔋');
                  if (totalPercent >= 20) return t('Explorer', '探索收集 🧭');
                  return t('Beginner', '规划起步 🚀');
                })()}
              </span>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 px-2 line-clamp-3">
                {(() => {
                  const totalPercent = Math.round((((readiness.quizCompleted ? 1 : 0) + (readiness.careTipsRead ? 1 : 0) + (readiness.profileInfoSet ? 1 : 0) + (readiness.homeContextSet ? 1 : 0) + (applications.length > 0 ? 1 : 0)) / 5) * 100);
                  if (totalPercent === 100) return t('Outstanding! You are fully qualified. Prepare to welcome your new family member.', '无懈可击！您的资料完全齐备。做好万全准备迎接新家庭成员吧！');
                  if (totalPercent >= 80) return t('Almost there! Complete the remaining task to become an optimal companion.', '更进一步！核对最后一项要点，即可拥有完美的领养就绪档案。');
                  if (totalPercent >= 50) return t('Excellent progress! Take a look at daily advice or submit your inquiry.', '进程过半！建议仔细阅读新手指南或开始在列表挑选合意的伴侣。');
                  if (totalPercent >= 20) return t('Off to a great start! Set your contact and home settings to boost your readiness.', '良好的开端！请完善您的联络信息与居住说明，加速领养筹备。');
                  return t('Kick off your journey by completing the personality test and checking guidelines.', '开启温馨之旅！可以从匹配性格测评与日常科普指南开始探索。');
                })()}
              </p>
            </div>
          </div>

          {/* Right Column: Checkable Journey Milestones */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
            {[
              {
                key: 'quizCompleted',
                label: t('Compatibility Personality Quiz', '相性匹配性格测评'),
                desc: t('Matches your style to find the most compatible companions.', '协助分析您的日常起居与期望偏好，推荐精准对口萌宠。'),
                actionText: t('Take Quiz', '性格测评'),
                icon: Sparkles,
                color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
              },
              {
                key: 'careTipsRead',
                label: t('Browse Expert Daily Care Tips', '掌握科学喂养常识'),
                desc: t('Gain guidelines on initial food, safety and boundaries.', '浏览新手家长爱心贴士，阅读我们精心准备的护理百科。'),
                actionText: t('Read Tips', '去读指南'),
                icon: ListChecks,
                color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30'
              },
              {
                key: 'profileInfoSet',
                label: t('Set Core Application Profile', '确立主领养人档案'),
                desc: t('Provide valid contact details for shelter verification.', '确立有效的姓名、电子邮箱及联系电话，用于接收意向反馈。'),
                actionText: t('Configure', '设联系人'),
                icon: User,
                color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
              },
              {
                key: 'homeContextSet',
                label: t('Verify Home Safety & Context', '居住环境安全自审'),
                desc: t('Evaluate housing, physical space and family/landlord consent.', '确认居住空间（公寓/独栋）以及同住家属/房东的知情同意。'),
                actionText: t('Verify', '自核环境'),
                icon: Home,
                color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
              },
              {
                key: 'isSubmitted',
                label: t('Submit Formal Pet Inquiry', '递交意向领养申请'),
                desc: t('Send a formal inquiry for your chosen furry companion.', '在下方萌宠列表点击【申请领养】，发出正式意向书。'),
                actionText: t('Browse Pets', '浏览萌宠'),
                icon: Heart,
                color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30',
                isAuto: true
              }
            ].map((item) => {
              const isChecked = item.isAuto ? (applications.length > 0) : !!readiness[item.key as keyof typeof readiness];
              const Icon = item.icon;
              return (
                <div 
                  key={item.key}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isChecked 
                      ? 'bg-emerald-50/15 dark:bg-emerald-950/5 border-emerald-100/50 dark:border-emerald-900/30' 
                      : 'bg-stone-50/30 dark:bg-stone-950/10 border-stone-150/40 dark:border-stone-800/40 hover:border-indigo-150 dark:hover:border-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      disabled={item.isAuto}
                      onClick={() => toggleReadiness(item.key)}
                      className={`flex-shrink-0 cursor-pointer focus:outline-none transition-transform active:scale-90 ${item.isAuto ? 'cursor-default opacity-80' : ''}`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/10" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600 hover:text-indigo-400 transition-colors" />
                      )}
                    </button>

                    <div className={`w-8 h-8 rounded-lg ${item.color} border border-transparent flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate transition-colors ${isChecked ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-stone-800 dark:text-stone-200'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 leading-tight line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (item.isAuto) {
                        const gridEl = document.getElementById('pets-grid');
                        if (gridEl) {
                          gridEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }
                        return;
                      }
                      toggleReadiness(item.key);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                      isChecked
                        ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'
                        : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100/40 dark:border-indigo-900/30 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500'
                    }`}
                  >
                    {isChecked ? t('Completed', '已就绪') : item.actionText}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Application Progress Tracker */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-indigo-100/60 dark:border-stone-800/60 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-black text-stone-900 dark:text-white text-base tracking-tight">{t('Adoption Application Hub', '领养申请追踪中心')}</h3>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">{t('Track the step-by-step progress of your submitted companion inquiries.', '实时追踪您已提交的领养意向书或申请进展。')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 self-start sm:self-center">
            {/* Status Filter Dropdown */}
            {applications.length > 0 && (
              <div className="relative inline-block text-left">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-xs font-bold px-3 py-1.5 pr-8 rounded-full text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
                >
                  <option value="all">📁 {t('All Statuses', '全部状态')}</option>
                  <option value="pending">⚙️ {t('Sent', '已提交')}</option>
                  <option value="screening">🔎 {t('Screening', '资料审核')}</option>
                  <option value="interview">🗣️ {t('Interview', '面试沟通')}</option>
                  <option value="approved">✅ {t('Approved', '终审通过')}</option>
                </select>
                <ChevronRight className="absolute right-3 top-2 w-3.5 h-3.5 text-stone-400 pointer-events-none rotate-90" />
              </div>
            )}

            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={notificationsEnabled} 
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)} 
                />
                <div className={`block w-9 h-5 rounded-full ${notificationsEnabled ? 'bg-indigo-600' : 'bg-stone-300 dark:bg-stone-700'}`}></div>
                <div className={`absolute left-1 top-1 w-3 h-3 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className="ml-2 text-[10px] font-bold text-stone-500 uppercase">{t('Notify', '通知')}</span>
            </label>
            {approvedSpecies && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                    <ListChecks className="w-3.5 h-3.5" /> {t('Checklist', '准备清单')}
                </button>
            )}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-8 px-4 bg-stone-50/60 dark:bg-stone-950/40 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">{t('No Submitted Applications', '暂无提交的领养申请')}</h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
              {t('You haven\'t submitted any adoption applications or inquiries yet. Explore our lovely pets and start your application journey!', '您目前还没有提交任何领养申请。浏览待领养列表，开启属于您的温馨故事吧！')}
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 px-4 bg-stone-50/40 dark:bg-stone-950/20 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200 mb-1">{t('No Matching Applications', '无符合筛选状态的申请')}</h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto">
              {t('You currently do not have any applications in this status stage. Please try selecting a different filter.', '您当前暂无处于该状态阶段的申请。请尝试选择其他筛选条件。')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => {
              // Current index based on app.status
              // status can be 'pending' | 'screening' | 'interview' | 'approved'
              const statusKeys = ['pending', 'screening', 'interview', 'approved'];
              const currentStepIdx = statusKeys.indexOf(app.status || 'pending');
              const activeStepIdx = currentStepIdx === -1 ? 0 : currentStepIdx;
              
              // Custom text explaining each stage
              const stageNotes = {
                pending: t('Application sent successfully. Caretakers are preparing your review.', '申请已成功送达，救助站工作人员正准备开启资料初审。'),
                screening: t('Caretakers are evaluating your home, space, and family suitability.', '资料深度审核中，评估家庭环境、空间及日常陪伴条件的契合度。'),
                interview: t('Ready for direct communication! A caretaker will reach out to schedule an interview.', '进入互动与评估阶段！工作人员将与您联系安排线下或视频交流。'),
                approved: t('Approved! 🎉 You are certified to complete adoption. Prepare to bring your companion home!', '终审通过！🎉 恭喜您可以办理领养手续了。请查看上方【准备清单】。')
              }[app.status as 'pending' | 'screening' | 'interview' | 'approved'] || t('Processing your request...', '我们正在加急处理您的领养请求...');

              return (
                <div 
                  key={app.id} 
                  className="p-5 rounded-2xl border border-stone-100 dark:border-stone-850 bg-stone-50/40 dark:bg-stone-950/10 space-y-4"
                >
                  {/* Top: Pet Info and Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {app.petImageUrl ? (
                        <img 
                          src={app.petImageUrl} 
                          alt={app.petName} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-100 dark:ring-stone-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center font-black">
                          {app.petName ? app.petName[0] : '🐾'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100">{app.petName || t('Pet Companion', '爱心伙伴')}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-100 dark:border-rose-900/30">
                            {app.type === 'formal_application' ? t('Formal Application', '正式领养申请') : t('General Inquiry', '咨询意向')}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500">
                          {t('Submitted by:', '提交人：')} {app.inquirerName || app.name || t('Guest User', '访客')}
                        </p>
                      </div>
                    </div>

                    {/* Simulation Controls for testing */}
                    <div className="flex items-center gap-2">
                      <div className="relative inline-block text-left">
                        <select
                          value={app.status || 'pending'}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                          className="appearance-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] font-bold px-2.5 py-1.5 pr-6 rounded-lg text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="pending">⚙️ {t('Sent', '已提交')}</option>
                          <option value="screening">🔎 {t('Screening', '资料审核')}</option>
                          <option value="interview">🗣️ {t('Interview', '面试沟通')}</option>
                          <option value="approved">✅ {t('Approved', '终审通过')}</option>
                        </select>
                        <ChevronRight className="absolute right-1.5 top-2.5 w-3 h-3 text-stone-400 pointer-events-none rotate-90" />
                      </div>

                      <button
                        onClick={() => deleteApplication(app.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        title={t('Cancel Application', '撤销申请')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Visual Timeline Tracker */}
                  <div className="pt-2">
                    <div className="relative flex items-center justify-between">
                      {/* Progress Line Track */}
                      <div className="absolute left-3.5 right-3.5 top-3.5 h-1 bg-stone-150 dark:bg-stone-800 z-0">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                          style={{ width: `${(activeStepIdx / (stages.length - 1)) * 100}%` }}
                        />
                      </div>

                      {/* Timeline Nodes */}
                      {stages.map((stage, sIdx) => {
                        const isCompleted = sIdx < activeStepIdx;
                        const isActive = sIdx === activeStepIdx;
                        const isUpcoming = sIdx > activeStepIdx;

                        return (
                          <div key={stage.key} className="relative z-10 flex flex-col items-center flex-1">
                            {/* Dot */}
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                isCompleted 
                                  ? 'bg-indigo-500 text-white shadow-sm'
                                  : isActive
                                    ? 'bg-white dark:bg-stone-900 border-2 border-indigo-500 text-indigo-500 shadow-sm animate-pulse'
                                    : 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-400'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <span className="text-xs font-bold">{sIdx + 1}</span>
                              )}
                            </div>
                            {/* Label */}
                            <span 
                              className={`text-[10px] font-bold mt-2 text-center transition-colors ${
                                isActive 
                                  ? 'text-indigo-600 dark:text-indigo-400' 
                                  : isCompleted 
                                    ? 'text-stone-700 dark:text-stone-300' 
                                    : 'text-stone-400'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanatory update message */}
                  <div className="bg-stone-100/60 dark:bg-stone-900/60 rounded-xl px-3.5 py-2.5 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2 border border-stone-150/40 dark:border-stone-800/40">
                    <span className="text-indigo-500 font-bold">ℹ️</span>
                    <p className="leading-relaxed">{stageNotes}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {isModalOpen && approvedSpecies && (
        <PreparationChecklistModal species={approvedSpecies} onClose={() => setIsModalOpen(false)} />
      )}

      {/* Chart Card */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-orange-100/60 dark:border-stone-800/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-stone-900 dark:text-white text-base tracking-tight">{t('Adoption Trends (June)', '领养与关怀趋势分析 (六月份)')}</h3>
            <p className="text-[11px] text-stone-400">{t('Activity matching index, showing newly added pets vs. incoming queries.', '活跃匹配度统计：直观展示最新发布的待领养宝贝数与用户的互动申请数对比。')}</p>
          </div>
          <span className="text-[10px] font-bold bg-stone-150 dark:bg-stone-800 px-2.5 py-1 rounded-full text-stone-500 uppercase tracking-wider">
            {t('Realtime Updating', '实时更新')}
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-stone-800/40" />
              <XAxis dataKey="day" stroke="#a8a29e" fontSize={11} tickLine={false} />
              <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  backgroundColor: '#1c1917',
                  color: '#fafaf9'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="adoptions" stroke="#f43f5e" strokeWidth={3} name={t('Listed Pets', '待领养数量')} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="inquiries" stroke="#8b5cf6" strokeWidth={3} name={t('Total Inquiries', '用户咨询意向')} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <CareRoutinePlanner />
    </motion.div>
  );
}

