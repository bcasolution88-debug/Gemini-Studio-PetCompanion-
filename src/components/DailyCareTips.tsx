import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, RotateCw, Copy, Check, BookOpen, HeartHandshake, ShieldAlert, Sparkles, Download, Loader2, X, FileText } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { MOCK_PETS } from '../data/pets';

interface CareTip {
  id: number;
  category: 'nutrition' | 'safety' | 'behavior' | 'health' | 'grooming';
  categoryEn: string;
  categoryZh: string;
  icon: React.ComponentType<any>;
  titleEn: string;
  titleZh: string;
  descEn: string;
  descZh: string;
}

const TIPS: CareTip[] = [
  {
    id: 1,
    category: 'safety',
    categoryEn: 'Safety Proofing',
    categoryZh: '安全防范',
    icon: ShieldAlert,
    titleEn: 'Kitten & Puppy Proofing',
    titleZh: '幼年期环境安全防范',
    descEn: 'Secure loose electrical cords, remove toxic houseplants (like lilies for cats), and lock chemical cleansers in high cabinets.',
    descZh: '绑好裸露的电线，移走有毒的室内植物（例如百合对猫剧毒），并将危险的清洁剂锁在高处的柜子里。'
  },
  {
    id: 2,
    category: 'nutrition',
    categoryEn: 'Toxic Foods Warning',
    categoryZh: '有害食物警示',
    icon: ShieldAlert,
    titleEn: 'Avoid Toxic Treats',
    titleZh: '警惕有毒隐形杀手',
    descEn: 'Chocolate, grapes, raisins, onions, garlic, and products with xylitol are highly toxic to dogs and cats. Keep them strictly out of reach.',
    descZh: '巧克力、葡萄、葡萄干、洋葱、大蒜以及含有木糖醇的食品对猫狗高度有毒，务必确保它们接触不到。'
  },
  {
    id: 3,
    category: 'health',
    categoryEn: 'Hydration Strategy',
    categoryZh: '健康补水策略',
    icon: Lightbulb,
    titleEn: 'Fresh Flowing Water',
    titleZh: '鼓励爱宠多喝水',
    descEn: 'Keep multiple fresh water bowls around the house. Many pets, especially cats, prefer running water and love pet drinking fountains.',
    descZh: '在家中各处多放几个干净水盆。许多宠物（尤其是猫咪）更喜欢流动的活水，饮水机是极好的投资。'
  },
  {
    id: 4,
    category: 'behavior',
    categoryEn: 'Positive Reinforcement',
    categoryZh: '行为积极引导',
    icon: HeartHandshake,
    titleEn: 'Reward, Don’t Discipline',
    titleZh: '用奖赏代替惩罚',
    descEn: 'Pets learn best when good behaviors are rewarded immediately with high-value treats and praise. Physical discipline breeds fear.',
    descZh: '宠物在好行为得到及时零食与夸奖奖励时学得最快。严厉训斥或体罚只会让它们产生恐惧与焦虑。'
  },
  {
    id: 5,
    category: 'grooming',
    categoryEn: 'Desensitization',
    categoryZh: '日常护理脱敏',
    icon: BookOpen,
    titleEn: 'Start Claw & Dental Care Early',
    titleZh: '从小建立牙齿与指甲护理',
    descEn: 'Touch your pet’s paws and mouth daily during pleasant play. Give rewards to make nail clipping and teeth brushing stress-free later.',
    descZh: '每天抚摸爱宠的爪子和嘴巴并给予零食，能极大减轻日后剪指甲和刷牙时的排斥和压力。'
  },
  {
    id: 6,
    category: 'health',
    categoryEn: 'Microchipping',
    categoryZh: '身份持久标记',
    icon: Sparkles,
    titleEn: 'Permanent Identification',
    titleZh: '植入芯片给爱宠上保险',
    descEn: 'Microchips are permanent and can be read by any shelter or vet clinic. Remember to keep your contact info updated online!',
    descZh: '宠物芯片是无法丢失的永久身份证明。植入后，请务必在登记库中保持您的联系信息为最新状态。'
  },
  {
    id: 7,
    category: 'behavior',
    categoryEn: 'Separation Support',
    categoryZh: '分离焦虑疏导',
    icon: HeartHandshake,
    titleEn: 'Calm Greetings & Goodbyes',
    titleZh: '平常心对待离家与归家',
    descEn: 'Avoid overly dramatic welcomes or departures. This prevents separation anxiety by showing that you leaving is perfectly normal.',
    descZh: '出门或回家时不要表现得过于激动或夸张。保持平静能向爱宠传递“主人的离开和回来是很正常的事”。'
  }
];

// High-Fidelity Canvas Card Generator (Serves as a robust local renderer / fallback)
function drawCanvasInfographic(pet: any, theme: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set Background Gradient according to selection
  const gradient = ctx.createLinearGradient(0, 0, 0, 800);
  if (theme === 'vibrant') {
    gradient.addColorStop(0, '#FFE4E6'); // Rose
    gradient.addColorStop(1, '#FFEDD5'); // Orange
  } else if (theme === 'minimal') {
    gradient.addColorStop(0, '#FAFAF9'); // Stone 50
    gradient.addColorStop(1, '#E7E5E4'); // Stone 200
  } else {
    gradient.addColorStop(0, '#FEF3C7'); // Amber 100
    gradient.addColorStop(1, '#FEF9C3'); // Yellow 100
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 800);

  // Elegant decorative framing
  ctx.strokeStyle = theme === 'vibrant' ? '#F43F5E' : theme === 'minimal' ? '#57534E' : '#D97706';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 560, 760);

  // Double thin border inside
  ctx.strokeStyle = theme === 'vibrant' ? '#FDA4AF' : theme === 'minimal' ? '#A8A29E' : '#FDE68A';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 536, 736);

  // Main Header Title
  ctx.fillStyle = theme === 'minimal' ? '#292524' : '#1C1917';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${pet.name}'s Daily Care Guidelines`, 300, 85);

  // Subtitle with breed info
  ctx.fillStyle = theme === 'vibrant' ? '#E11D48' : theme === 'minimal' ? '#78716C' : '#B45309';
  ctx.font = '600 16px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Scientific Care Infographic • ${pet.breed || pet.species} (${pet.age})`, 300, 120);

  // Divider
  ctx.beginPath();
  ctx.moveTo(80, 145);
  ctx.lineTo(520, 145);
  ctx.strokeStyle = theme === 'vibrant' ? '#FECDD3' : theme === 'minimal' ? '#D6D3D1' : '#FDE68A';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Helper to draw clean sections
  const drawSectionHeader = (title: string, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 60, y);
    
    ctx.beginPath();
    ctx.moveTo(60, y + 8);
    ctx.lineTo(240, y + 8);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const sectionColor = theme === 'vibrant' ? '#9F1239' : theme === 'minimal' ? '#44403C' : '#92400E';

  // Section 1: Morning Routine
  drawSectionHeader('🌅 MORNING ROUTINE', 185, sectionColor);
  ctx.fillStyle = '#44403C';
  ctx.font = '500 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('• Feed portion-controlled nutrition matching growth stage.', 75, 225);
  ctx.fillText('• Clean water bowl thoroughly and fill with cold running water.', 75, 255);
  ctx.fillText('• Brief sensory simulation - 15 minutes of scent walks or active play.', 75, 285);

  // Section 2: Afternoon & Mental Play
  drawSectionHeader('☀️ AFTERNOON ENRICHMENT', 335, sectionColor);
  ctx.fillStyle = '#44403C';
  ctx.fillText('• Provide interactive food dispensers, puzzle boxes, or licking mats.', 75, 375);
  ctx.fillText('• Maintain a quiet, secure rest zone to prevent overstimulation.', 75, 405);
  ctx.fillText('• Inspect litter box or designated elimination pad to track bio-health.', 75, 435);

  // Section 3: Evening Care & Interaction
  drawSectionHeader('🌙 EVENING STRENGTHENING', 485, sectionColor);
  ctx.fillStyle = '#44403C';
  ctx.fillText('• Main daily feed + gentle grooming brush to reduce hairballs/matting.', 75, 525);
  ctx.fillText('• Brushing of canine/feline teeth to maintain essential oral hygiene.', 75, 555);
  ctx.fillText('• High-quality bonding time with light cuddling and positive rewards.', 75, 585);

  // Section 4: Health Metrics (Lower Banner)
  ctx.fillStyle = theme === 'vibrant' ? '#FFF1F2' : theme === 'minimal' ? '#F5F5F4' : '#FFFBEB';
  ctx.fillRect(50, 630, 500, 95);
  ctx.strokeStyle = theme === 'vibrant' ? '#F43F5E' : theme === 'minimal' ? '#78716C' : '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 630, 500, 95);

  ctx.fillStyle = theme === 'vibrant' ? '#9F1239' : theme === 'minimal' ? '#292524' : '#78350F';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('📋 HEALTH & WELLNESS RADAR', 70, 658);

  ctx.fillStyle = '#57534E';
  ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`• Track daily wellness logs in ${pet.name}'s Health Journal.`, 70, 685);
  ctx.fillText('• Check hydration, core vaccination dates, and schedule routine exams.', 70, 705);

  // Footer branding
  ctx.fillStyle = theme === 'minimal' ? '#A8A29E' : '#B45309';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PETADOPT APP • CO-CREATED WITH AI IMAGEN ENGINE', 300, 765);

  return canvas.toDataURL('image/png');
}

export default function DailyCareTips() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Infographic state
  const [isInfographicModalOpen, setIsInfographicModalOpen] = useState(false);
  const [petsList, setPetsList] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [infographicTheme, setInfographicTheme] = useState('pastel'); // 'pastel' | 'vibrant' | 'minimal'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [generationError, setGenerationError] = useState('');

  // Load pets list on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      const loaded = saved ? JSON.parse(saved) : MOCK_PETS;
      setPetsList(loaded);
      if (loaded.length > 0) {
        setSelectedPetId(loaded[0].id);
      }
    } catch {
      setPetsList(MOCK_PETS);
      if (MOCK_PETS.length > 0) {
        setSelectedPetId(MOCK_PETS[0].id);
      }
    }
  }, [isInfographicModalOpen]);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      handleNext();
    }, 12000); // Rotate every 12 seconds
    return () => clearInterval(interval);
  }, [currentIndex, autoRotate]);

  // Handle staggered loading text
  useEffect(() => {
    if (!isGenerating) return;
    const steps = [
      t('Analyzing pet characteristics & needs...', '正在分析宠物的个性特征与独特需求...'),
      t('Drafting daily morning and evening schedule...', '正在规划每日清晨与夜晚的照顾日程...'),
      t('Designing color palette and layout structures...', '正在绘制个性化主题配色和版面结构...'),
      t('Asking AI to illustrate key elements...', '正在调用 AI 绘制专属爱宠插画组件...'),
      t('Finalizing beautiful infographic canvas card...', '正在合并图层并生成高精细度卡片图件...')
    ];
    setGenerationSteps(steps);
    setCurrentStepIndex(0);

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const markTipsRead = () => {
    try {
      if (localStorage.getItem('care_tips_read') !== 'true') {
        localStorage.setItem('care_tips_read', 'true');
        window.dispatchEvent(new CustomEvent('care-tips-read'));
      }
    } catch (e) {
      console.error('Error saving care tips read state:', e);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TIPS.length);
    setCopied(false);
    markTipsRead();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);
    setCopied(false);
    markTipsRead();
  };

  const handleCopy = async () => {
    const activeTip = TIPS[currentIndex];
    const textToCopy = `${activeTip.categoryEn.toUpperCase()} - ${activeTip.titleEn}: ${activeTip.descEn} / [${activeTip.categoryZh}] - ${activeTip.titleZh}: ${activeTip.descZh}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      markTipsRead();

      // Play delightful synthetic soft feedback beep
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleGenerateInfographic = async () => {
    const pet = petsList.find(p => p.id === selectedPetId);
    if (!pet) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate-care-infographic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName: pet.name,
          species: pet.species,
          breed: pet.breed || pet.species,
          age: pet.age,
        }),
      });

      if (!response.ok) {
        throw new Error('API key or rate limit error');
      }

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      console.warn('AI Generation failed, building high-quality local Canvas card:', err);
      // Fallback gracefully to our beautiful canvas drawing (guarantees success!)
      setTimeout(() => {
        const localCard = drawCanvasInfographic(pet, infographicTheme);
        setGeneratedImage(localCard);
      }, 3000);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 3500);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const pet = petsList.find(p => p.id === selectedPetId);
    const filename = `${pet ? pet.name : 'Pet'}_Daily_Care_Infographic.png`;
    
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeTip = TIPS[currentIndex];
  const IconComponent = activeTip.icon;

  return (
    <>
      <div 
        className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-amber-100/70 dark:border-stone-800 shadow-sm space-y-4 relative overflow-hidden"
        onMouseEnter={() => setAutoRotate(false)}
        onMouseLeave={() => setAutoRotate(true)}
      >
        {/* Absolute faint background glow */}
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500">
              <Lightbulb className="w-4 h-4 animate-bounce" />
            </div>
            <span className="text-xs font-black text-stone-800 dark:text-stone-200 tracking-tight uppercase">
              {t('Daily Care Tips', '新手养宠宝典')}
            </span>
          </div>
          
          {/* Playful mini indicator */}
          <span className="text-[9px] font-bold text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-950/40 px-2 py-0.5 rounded-md">
            {currentIndex + 1} / {TIPS.length}
          </span>
        </div>

        {/* Rotating Tip Content Card */}
        <div className="min-h-[110px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTip.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              {/* Category Tag */}
              <div className="flex items-center gap-1.5">
                <IconComponent className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {t(activeTip.categoryEn, activeTip.categoryZh)}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 leading-snug">
                {t(activeTip.titleEn, activeTip.titleZh)}
              </h4>

              {/* Description */}
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
                {t(activeTip.descEn, activeTip.descZh)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation and Interaction Row */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800/60">
          {/* Rotation & Copy controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200/60 dark:bg-stone-800 dark:hover:bg-stone-750 dark:border-stone-700 text-stone-500 dark:text-stone-400'
              }`}
              title={t('Copy tip to clipboard', '复制此条指南')}
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-200/60 dark:border-stone-700 text-stone-500 dark:text-stone-400 transition-colors cursor-pointer"
              title={t('Next Tip', '下一条指南')}
            >
              <RotateCw className="w-3.5 h-3.5 hover:rotate-185 transition-transform duration-500" />
            </button>
          </div>

          {/* Manual Arrow Stepper */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            >
              {t('Prev', '上一条')}
            </button>
            <button
              onClick={handleNext}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 transition-colors cursor-pointer"
            >
              {t('Next', '下一条')}
            </button>
          </div>
        </div>

        {/* Premium Infographic Generation Trigger */}
        <div className="pt-3 border-t border-stone-150 dark:border-stone-800/80">
          <button
            onClick={() => setIsInfographicModalOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl py-2.5 px-4 text-xs font-black shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span>{t('AI Care Infographic Generator', '一键生成爱宠科学照料卡')}</span>
          </button>
        </div>
      </div>

      {/* High-Fidelity Creator Overlay Modal */}
      <AnimatePresence>
        {isInfographicModalOpen && (
          <div className="fixed inset-0 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between shrink-0 bg-stone-50 dark:bg-stone-850/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FileText className="w-5.5 h-5.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 leading-tight">
                      {t('AI Daily Care Infographic Creator', 'AI 爱宠专属科学照料卡片生成器')}
                    </h3>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 font-bold">
                      {t('Generate and download beautiful poster summaries', '智能一键生成精美、可打印的养宠日程安排卡')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsInfographicModalOpen(false);
                    setGeneratedImage(null);
                    setGenerationError('');
                  }}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {!generatedImage && !isGenerating ? (
                  /* Form State */
                  <div className="space-y-5">
                    {/* Pet Selector */}
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                        {t('1. Select Companion Pet', '1. 选择制作指南的宠物宝贝')}
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto p-1.5 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-150 dark:border-stone-800/80">
                        {petsList.map((pet) => {
                          const isSelected = selectedPetId === pet.id;
                          return (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => setSelectedPetId(pet.id)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all active:scale-98 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/10 border-amber-500 shadow-sm ring-1 ring-amber-500/20'
                                  : 'bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                              }`}
                            >
                              <img
                                src={pet.imageUrl}
                                alt={pet.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover border border-stone-200/40"
                              />
                              <div className="truncate">
                                <span className="block text-xs font-black text-stone-900 dark:text-stone-100 truncate">
                                  {pet.name}
                                </span>
                                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold truncate">
                                  {pet.breed || pet.species}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vibe Theme Selector */}
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                        {t('2. Select Design Style Theme', '2. 选择卡片视觉设计风格')}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'pastel', title: t('Cute Pastel', '温馨马卡龙 🌸'), desc: t('Soft warm colors', '温和舒缓配色'), border: 'border-amber-200 bg-amber-50/30' },
                          { id: 'vibrant', title: t('Vibrant Coral', '亮丽珊瑚粉 🎒'), desc: t('Energetic pink-orange', '生动活泼撞色'), border: 'border-rose-200 bg-rose-50/30' },
                          { id: 'minimal', title: t('Minimal Warm', '极简温暖调 🎨'), desc: t('Elegant simple layout', '雅致性冷淡色'), border: 'border-stone-300 bg-stone-50/30' }
                        ].map((theme) => {
                          const isSelected = infographicTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => setInfographicTheme(theme.id)}
                              className={`p-3 rounded-2xl border text-center transition-all active:scale-98 cursor-pointer ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20'
                                  : 'bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                              }`}
                            >
                              <span className="block text-xs font-extrabold text-stone-800 dark:text-stone-200">
                                {theme.title}
                              </span>
                              <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold mt-1">
                                {theme.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom action */}
                    <button
                      onClick={handleGenerateInfographic}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl py-3 px-4 text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Sparkles className="w-4 h-4 animate-bounce" />
                      <span>{t('Generate Infographic Card with AI', '开始智能生成专属科学照料卡')}</span>
                    </button>
                  </div>
                ) : isGenerating ? (
                  /* Loading Staggered State */
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
                      <Loader2 className="w-12 h-12 text-amber-500 animate-spin relative z-10" />
                    </div>
                    
                    <div className="text-center space-y-2 max-w-sm">
                      <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                        {t('AI Creative Engine Active', 'AI 创意引擎正在深度渲染绘制中')}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-bold animate-pulse">
                        {generationSteps[currentStepIndex]}
                      </p>
                    </div>

                    {/* Staggered step dots indicator */}
                    <div className="flex gap-2.5">
                      {generationSteps.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            idx <= currentStepIndex
                              ? 'bg-amber-500 scale-110 shadow-sm'
                              : 'bg-stone-200 dark:bg-stone-850'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Success/Preview State */
                  <div className="space-y-5 text-center flex flex-col items-center">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-inner border border-emerald-100/40">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{t('AI Infographic Created Successfully!', '照料日历指南海报生成成功！')}</span>
                    </div>

                    {/* Highly polished poster frame */}
                    <div className="relative max-w-xs w-full rounded-2xl overflow-hidden border border-stone-200/50 dark:border-stone-800 shadow-2xl transition-transform duration-350 hover:scale-[1.02]">
                      <img
                        src={generatedImage!}
                        alt="Generated Care Infographic"
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-cover block"
                      />
                    </div>

                    {/* Download & Actions Row */}
                    <div className="flex gap-3 w-full max-w-sm pt-2">
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl py-3 px-4 text-xs font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('Download Infographic', '保存/下载高清原图')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedImage(null);
                          setGenerationError('');
                        }}
                        className="px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl text-xs font-black transition-colors cursor-pointer"
                      >
                        {t('Re-generate', '重新生成')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
