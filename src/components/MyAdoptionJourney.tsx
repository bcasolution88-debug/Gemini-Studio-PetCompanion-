import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, ClipboardCheck, ArrowUpRight, CheckCircle2, Circle, 
  Sparkles, Calendar, ChevronRight, Play, Check, RefreshCw, Trash2, 
  User, MessageSquare, MapPin, Award, AlertCircle, FileText, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import PetFlyerGenerator from './PetFlyerGenerator';

interface JourneyApplication {
  id: string;
  petId: string;
  petName: string;
  petImageUrl?: string;
  status: 'pending' | 'screening' | 'interview' | 'approved';
  type: string;
  inquirerName: string;
  inquirerEmail: string;
  timestamp: number;
  // Interactive simulator fields
  currentStep: number; // 0: Submitted, 1: Screening, 2: Phone Interview, 3: Home Visit, 4: Approved
  logs: {
    time: string;
    message: string;
    author: 'System' | 'Shelter Caretaker';
  }[];
}

const DEFAULT_SIMULATED_JOURNEYS: JourneyApplication[] = [
  {
    id: 'sim-app-1',
    petId: 'pet-1',
    petName: 'Max',
    petImageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300&h=300',
    status: 'interview',
    type: 'formal_application',
    inquirerName: 'Alex Mercer',
    inquirerEmail: 'alex.mercer@example.com',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    currentStep: 2,
    logs: [
      { time: '3 days ago', message: 'Application submitted successfully. Caretakers notified.', author: 'System' },
      { time: '2 days ago', message: 'Core profile & residency credentials approved.', author: 'Shelter Caretaker' },
      { time: '1 day ago', message: 'Interview scheduled! Caretaker will contact you soon for the virtual call.', author: 'Shelter Caretaker' }
    ]
  },
  {
    id: 'sim-app-2',
    petId: 'pet-2',
    petName: 'Bella',
    petImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300',
    status: 'screening',
    type: 'formal_application',
    inquirerName: 'Alex Mercer',
    inquirerEmail: 'alex.mercer@example.com',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    currentStep: 1,
    logs: [
      { time: '1 day ago', message: 'Application submitted successfully. Processing background verification.', author: 'System' },
      { time: '10 hours ago', message: 'Assessing indoor environment size vs pet energy levels.', author: 'Shelter Caretaker' }
    ]
  }
];

const JOURNEY_STEPS = [
  { title: 'Application Sent', desc: 'Inquiry and contact background logged', zhTitle: '提交意向', zhDesc: '领养意向书及联系背景已录入' },
  { title: 'Information Screening', desc: 'Verifying landlord, household & safety checks', zhTitle: '资料初审', zhDesc: '核对居住、家属意向及安全环境评估' },
  { title: 'Interactive Interview', desc: 'Discussing daily routines & companion expectations', zhTitle: '沟通面试', zhDesc: '与负责人深入讨论养宠日常及护理预期' },
  { title: 'Home Safety Verification', desc: 'Assessing physical windows, gates & escape hazards', zhTitle: '实地家访', zhDesc: '实地或视频审查纱窗防护、逃生隐患等' },
  { title: 'Placement Approved', desc: 'Finalized medical logs, microchip & pickup plans', zhTitle: '领养审批通过', zhDesc: '终审通过！恭喜准备办理交接手续' }
];

export default function MyAdoptionJourney() {
  const { t, language } = useLanguage();
  const [journeys, setJourneys] = useState<JourneyApplication[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeFlyerPet, setActiveFlyerPet] = useState<any | null>(null);

  // Load merged journeys (localStorage real submissions + simulated mock)
  const loadJourneys = () => {
    try {
      const realInquiriesStr = localStorage.getItem('adoption_inquiries');
      const realInquiries = realInquiriesStr ? JSON.parse(realInquiriesStr) : [];
      
      const savedJourneysStr = localStorage.getItem('adoption_journey_list');
      let currentJourneys: JourneyApplication[] = [];

      if (savedJourneysStr) {
        currentJourneys = JSON.parse(savedJourneysStr);
      } else {
        currentJourneys = [...DEFAULT_SIMULATED_JOURNEYS];
      }

      // Sync any new real inquiries that are not yet in the journey list
      realInquiries.forEach((req: any) => {
        const exists = currentJourneys.some(j => j.id === req.id || (j.petId === req.petId && j.timestamp === req.timestamp));
        if (!exists) {
          const stepIndex = req.status === 'approved' ? 4 : req.status === 'interview' ? 2 : req.status === 'screening' ? 1 : 0;
          currentJourneys.push({
            id: req.id || `app-${Date.now()}`,
            petId: req.petId,
            petName: req.petName || 'Companion',
            petImageUrl: req.petImageUrl,
            status: req.status || 'pending',
            type: req.type || 'formal_application',
            inquirerName: req.inquirerName || 'Adopter',
            inquirerEmail: req.inquirerEmail || 'adopter@example.com',
            timestamp: req.timestamp || Date.now(),
            currentStep: stepIndex,
            logs: [
              { time: 'Just now', message: t('Application submitted successfully. Under active shelter review.', '领养意向书已成功送达，工作人员正快马加鞭为您开启初审。'), author: 'System' }
            ]
          });
        }
      });

      setJourneys(currentJourneys);
      localStorage.setItem('adoption_journey_list', JSON.stringify(currentJourneys));

      if (currentJourneys.length > 0 && !activeAppId) {
        setActiveAppId(currentJourneys[0].id);
      }
    } catch (e) {
      console.error('Failed to load journeys:', e);
      setJourneys(DEFAULT_SIMULATED_JOURNEYS);
      setActiveAppId(DEFAULT_SIMULATED_JOURNEYS[0].id);
    }
  };

  useEffect(() => {
    loadJourneys();
    
    // Listen to when new applications are made
    window.addEventListener('inquiry-submitted', loadJourneys);
    return () => {
      window.removeEventListener('inquiry-submitted', loadJourneys);
    };
  }, []);

  const saveJourneys = (updated: JourneyApplication[]) => {
    setJourneys(updated);
    try {
      localStorage.setItem('adoption_journey_list', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Delete/Cancel application
  const handleDeleteJourney = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = journeys.filter(j => j.id !== id);
    saveJourneys(updated);
    
    // Also remove from real inquiries so it stays in sync
    try {
      const realInquiriesStr = localStorage.getItem('adoption_inquiries');
      if (realInquiriesStr) {
        const realInquiries = JSON.parse(realInquiriesStr);
        const filteredReal = realInquiries.filter((app: any) => app.id !== id);
        localStorage.setItem('adoption_inquiries', JSON.stringify(filteredReal));
        window.dispatchEvent(new CustomEvent('inquiry-submitted'));
      }
    } catch {}

    if (activeAppId === id) {
      setActiveAppId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Interactive step advancer for user demonstration
  const handleAdvanceStep = (id: string) => {
    const updated = journeys.map(j => {
      if (j.id === id) {
        const nextStep = Math.min(4, j.currentStep + 1);
        if (nextStep === j.currentStep) return j;

        const nextStatus = nextStep === 4 ? 'approved' : nextStep >= 2 ? 'interview' : 'screening';
        const logMessages = [
          t('Application sent successfully.', '申请已成功递交。'),
          t('Document checklist verification completed. Advancing to home check.', '资料要点审核已通关，正在筹备居住安全核实。'),
          t('Interview session scheduled! Please expect a video call verification.', '视频或电话面试已敲定，请留意救助中心后续联系。'),
          t('Environment safety check verified. Gate boundaries and microchip logs confirmed.', '实地环境安全自查完成，确认物理护栏、窗网等已悉数到位。'),
          t('Congratulations! Full approval granted. Ready for companion placement! 🎉', '恭喜！领养申请终审全部通关。可以安排前往领爱宠回家了！🎉')
        ];

        const newLog = {
          time: t('Just now', '刚刚'),
          message: logMessages[nextStep],
          author: 'Shelter Caretaker' as const
        };

        const updatedApp = {
          ...j,
          currentStep: nextStep,
          status: nextStatus as any,
          logs: [...j.logs, newLog]
        };

        // Also update local storage real inquiries status for stats dashboard integration!
        try {
          const realInquiriesStr = localStorage.getItem('adoption_inquiries');
          if (realInquiriesStr) {
            const realInquiries = JSON.parse(realInquiriesStr);
            const syncedReal = realInquiries.map((app: any) => {
              if (app.id === id) {
                return { ...app, status: nextStatus };
              }
              return app;
            });
            localStorage.setItem('adoption_inquiries', JSON.stringify(syncedReal));
            window.dispatchEvent(new CustomEvent('inquiry-submitted'));
          }
        } catch {}

        return updatedApp;
      }
      return j;
    });

    saveJourneys(updated);
  };

  // Reset steps simulator
  const handleResetSimulator = () => {
    saveJourneys(DEFAULT_SIMULATED_JOURNEYS);
    setActiveAppId(DEFAULT_SIMULATED_JOURNEYS[0].id);
    
    // Sync with real inquiries
    try {
      const realInquiriesStr = localStorage.getItem('adoption_inquiries');
      if (realInquiriesStr) {
        const realInquiries = JSON.parse(realInquiriesStr);
        const syncedReal = realInquiries.map((app: any) => {
          const matchedSim = DEFAULT_SIMULATED_JOURNEYS.find(s => s.id === app.id);
          if (matchedSim) {
            return { ...app, status: matchedSim.status };
          }
          return app;
        });
        localStorage.setItem('adoption_inquiries', JSON.stringify(syncedReal));
        window.dispatchEvent(new CustomEvent('inquiry-submitted'));
      }
    } catch {}
  };

  const activeApp = journeys.find(j => j.id === activeAppId);

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-500" />
            {t('My Adoption Journey', '我的领养成长日志')}
            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
              {t('Interactive Tracker', '阶段进度追踪')}
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
            {t('Monitor and progress through your pending adoption applications step-by-step.', '实时查阅您递交的各项爱心领养意向书进度，参与全透明的评估成长体验。')}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
            title={t('Reset Simulated Applications', '重置并演示')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('Reset Simulation', '重置演示案例')}
          </button>
        </div>
      </div>

      {journeys.length === 0 ? (
        <div className="text-center py-12 px-4 bg-stone-50/50 dark:bg-stone-950/40 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="font-extrabold text-sm text-stone-800 dark:text-stone-200 mb-1">
            {t('Ready to begin your journey?', '开启您的首个领养成长故事？')}
          </h4>
          <p className="text-xs text-stone-400 dark:text-stone-500 max-w-md mx-auto mb-5">
            {t('You do not have any pending applications. Go to the pet listings below, pick a companion and tap "Apply to Adopt" to automatically log your journey here!', '您目前还没有提交任何领养意向。在下方宝贝列表中，点击申请即可瞬间点亮您的进度图谱！')}
          </p>
          <button
            onClick={() => {
              const el = document.getElementById('pets-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95"
          >
            {t('Find a Pet to Adopt', '立即去挑选宝贝')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Applications List */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              {t('Submitted Applications', '意向申请列表')} ({journeys.length})
            </p>
            <div className="space-y-2..5 max-h-[420px] overflow-y-auto pr-1">
              {journeys.map((j) => {
                const isActive = j.id === activeAppId;
                const progressPct = Math.round((j.currentStep / 4) * 100);
                
                return (
                  <div
                    key={j.id}
                    onClick={() => setActiveAppId(j.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-center gap-3 ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 dark:from-indigo-950/40 dark:to-stone-900 border-indigo-400/80 dark:border-indigo-800/80 ring-2 ring-indigo-500/15'
                        : 'bg-stone-50/50 dark:bg-stone-900/40 hover:bg-stone-100/60 dark:hover:bg-stone-850/50 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    {j.petImageUrl ? (
                      <img 
                        src={j.petImageUrl} 
                        alt={j.petName} 
                        className="w-11 h-11 rounded-xl object-cover border border-stone-200 dark:border-stone-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center font-black flex-shrink-0">
                        🐾
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                          {j.petName}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          j.currentStep === 4 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
                        }`}>
                          {progressPct}% {t('Done', '就绪')}
                        </span>
                      </div>

                      <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold mt-1 line-clamp-1">
                        {t('Adopter:', '领养人：')} {j.inquirerName}
                      </p>

                      {/* Small visual line-indicator */}
                      <div className="w-full bg-stone-200 dark:bg-stone-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            j.currentStep === 4 ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteJourney(j.id, e)}
                      className="p-1.5 text-stone-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-white/80 dark:hover:bg-stone-800 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100 absolute right-1.5 top-1.5 cursor-pointer"
                      title={t('Cancel Journey Record', '撤销此条记录')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Step Visual & interactive details */}
          {activeApp ? (
            <div className="lg:col-span-8 bg-stone-50/50 dark:bg-stone-950/30 p-5 rounded-2xl border border-stone-150 dark:border-stone-800/80 space-y-6">
              
              {/* Pet Quick Panel & Simulator Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/60 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500/10 rounded-xl">
                    <Award className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                      {t('Interactive Road for', '领养培育路线：')} {activeApp.petName}
                    </h4>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500">
                      {t('Watch real caretakers actions or advance simulator manually to test.', '查看救助负责人留言或手动模拟下一步以观察效果。')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Share local flyer */}
                  <button
                    onClick={() => setActiveFlyerPet({
                      id: activeApp.petId,
                      name: activeApp.petName,
                      imageUrl: activeApp.petImageUrl,
                      species: 'Dog', // Default species, can fallback
                      age: 'Adult',
                      location: 'Local Shelter',
                      description: t(`Help ${activeApp.petName} find a loving home! Read their full story and contact the shelter today.`, `协助 ${activeApp.petName} 找到温馨新家！点击查阅描述并立即预约。`),
                      shelterName: 'Foster Rescue',
                      shelterPhone: '555-0199',
                      medicalStatus: 'Healthy & fully vaccinated',
                      history: 'Rescued from local suburban area.'
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t('Generate Flyer', '生成社区传单')}
                  </button>

                  <button
                    disabled={activeApp.currentStep === 4}
                    onClick={() => handleAdvanceStep(activeApp.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 hover:text-white text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {activeApp.currentStep === 4 ? t('Fully Approved! 🎉', '终审通过！🎉') : t('Simulate Next Step', '模拟下一步')}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Progress Visual */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  {t('Process Timeline Progress', '阶段进度追踪流')}
                </p>

                <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-3 before:w-0.5 before:bg-stone-200 dark:before:bg-stone-800">
                  {JOURNEY_STEPS.map((step, idx) => {
                    const isCompleted = idx < activeApp.currentStep;
                    const isActive = idx === activeApp.currentStep;
                    const isUpcoming = idx > activeApp.currentStep;

                    return (
                      <motion.div 
                        key={idx} 
                        className={`relative flex gap-4 transition-all ${
                          isUpcoming ? 'opacity-50' : 'opacity-100'
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isUpcoming ? 0.45 : 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        {/* Bullet circle */}
                        <div 
                          className={`absolute -left-5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                            isCompleted
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : isActive
                                ? 'bg-white dark:bg-stone-900 border-indigo-500 animate-pulse'
                                : 'bg-stone-100 dark:bg-stone-950 border-stone-300 dark:border-stone-800'
                          }`}
                        >
                          {isCompleted && <Check className="w-2 h-2 text-white stroke-[4]" />}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className={`text-xs font-black flex items-center gap-2 ${
                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-800 dark:text-stone-200'
                          }`}>
                            {language === 'en' ? step.title : step.zhTitle}
                            {isActive && (
                              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                {t('Active Checkpoint', '当前环')}
                              </span>
                            )}
                          </h5>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {language === 'en' ? step.desc : step.zhDesc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Caretaker / System Logs Section */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200 dark:border-stone-800 space-y-3">
                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                  {t('Verification Log & Caretaker Comments', '交互核查日志与负责人评语')}
                </p>

                <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                  {activeApp.logs.map((log, lIdx) => (
                    <div 
                      key={lIdx} 
                      className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                        log.author === 'Shelter Caretaker'
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
                          : 'bg-stone-50 dark:bg-stone-950/30 border-stone-150 dark:border-stone-850'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className={log.author === 'Shelter Caretaker' ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-400'}>
                          👤 {log.author === 'Shelter Caretaker' ? t('Shelter Caretaker Officer', '收容救助中心审批人') : t('System Automatic Log', '系统日志')}
                        </span>
                        <span className="text-stone-400">{log.time}</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-8 flex items-center justify-center py-20 text-stone-400">
              {t('Select an application from the left panel to inspect progress.', '从左侧面板选择一个意向申请，即可开启查看详细互动。')}
            </div>
          )}

        </div>
      )}

      {/* Embedded Flyer Popup Modal */}
      {activeFlyerPet && (
        <PetFlyerGenerator
          pet={activeFlyerPet}
          onClose={() => setActiveFlyerPet(null)}
        />
      )}
    </div>
  );
}
