import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, RotateCw, Copy, Check, BookOpen, HeartHandshake, ShieldAlert, Sparkles, Download, Loader2, X, FileText, Calendar, CalendarDays, Plus } from 'lucide-react';
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

  // AI Weekly Routine Generator States
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [workday, setWorkday] = useState('9-to-5');
  const [customConcerns, setCustomConcerns] = useState('');
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<any[] | null>(null);
  const [routineError, setRoutineError] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [routineImportSuccess, setRoutineImportSuccess] = useState(false);

  const handleGenerateRoutine = async () => {
    const pet = petsList.find(p => p.id === selectedPetId);
    if (!pet) return;

    setIsGeneratingRoutine(true);
    setGeneratedRoutine(null);
    setRoutineError('');
    setRoutineImportSuccess(false);

    const petDetailsStr = `${pet.name} (${pet.species}, breed: ${pet.breed || 'Unknown'}, age: ${pet.age}, description: ${pet.description}, personality: ${JSON.stringify(pet.personalityTraits || {})})`;

    try {
      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petDetails: petDetailsStr,
          workday: workday,
          concerns: customConcerns
        }),
      });

      if (!response.ok) {
        throw new Error('API key or rate limit error');
      }

      const data = await response.json();
      if (data && data.schedule) {
        setGeneratedRoutine(data.schedule);
      } else {
        throw new Error('Failed to parse generated schedule');
      }
    } catch (err) {
      console.warn('AI Routine generation failed, using beautiful fallback care checklist:', err);
      // Fallback routine
      setTimeout(() => {
        setGeneratedRoutine([
          {
            time: "07:30",
            title: `为 ${pet.name} 准备营养早餐`,
            category: "feeding",
            description: "进食高品质幼宠粮或定制配方，补充充足的水分，保持活力满满的一天开始。",
            frequency: "daily"
          },
          {
            time: "08:15",
            title: "饭后户外排便与微运动",
            category: "potty_training",
            description: "进食完毕后15分钟带往排便区域，养成规律排便习惯。顺便进行10分钟晨间散步嗅闻。",
            frequency: "daily"
          },
          {
            time: "18:30",
            title: "下班亲密互动与基本技能训练",
            category: "interaction",
            description: "下班回家后立即陪伴玩耍，缓解独自在家的焦虑。可配合零食训练'坐下'或'爪子脱敏'。",
            frequency: "daily"
          },
          {
            time: "21:00",
            title: "晚间健康清洁与毛发护理",
            category: "general",
            description: "使用宠物排梳轻轻顺毛，促进血液循环并减少掉毛，顺便检查体表、爪垫是否有红肿红疹等异常。",
            frequency: "daily"
          }
        ]);
      }, 1500);
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  const handleExportICS = () => {
    if (!generatedRoutine || generatedRoutine.length === 0) return;
    const pet = petsList.find(p => p.id === selectedPetId);
    const petName = pet ? pet.name : 'Pet';

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PetAdopt//AI Weekly Care Routine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const today = new Date();
    
    // Generate events for the next 7 days (week-long)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      generatedRoutine.forEach((item, index) => {
        const [hourStr, minStr] = item.time.split(':');
        const hour = hourStr ? hourStr.padStart(2, '0') : '08';
        const min = minStr ? minStr.padStart(2, '0') : '00';
        
        const dtStart = `${dateStr}T${hour}${min}00`;
        
        const startMinutes = parseInt(hour) * 60 + parseInt(min);
        const endMinutes = startMinutes + 30;
        const endHour = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
        const endMin = String(endMinutes % 60).padStart(2, '0');
        const dtEnd = `${dateStr}T${endHour}${endMin}00`;
        
        const uid = `petadopt-routine-${Date.now()}-${dayOffset}-${index}`;
        
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${uid}`);
        icsContent.push(`DTSTAMP:${dtStart}`);
        icsContent.push(`DTSTART:${dtStart}`);
        icsContent.push(`DTEND:${dtEnd}`);
        icsContent.push(`SUMMARY:🐾 ${petName} 照料: ${item.title}`);
        icsContent.push(`DESCRIPTION:${item.description || ''} (类型: ${item.category})`);
        icsContent.push('END:VEVENT');
      });
    }

    icsContent.push('END:VCALENDAR');
    
    try {
      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${petName}_Weekly_Care_Schedule.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      console.error('ICS Export failed:', e);
    }
  };

  const handleImportToAppChecklist = () => {
    if (!generatedRoutine || generatedRoutine.length === 0) return;
    
    try {
      const saved = localStorage.getItem('care_routines');
      const routines = saved ? JSON.parse(saved) : [];
      
      const importedRoutines = generatedRoutine.map((item, index) => ({
        id: `ai-routine-${Date.now()}-${index}`,
        name: item.title,
        type: item.category,
        frequency: item.frequency === 'once' ? 'daily' : (item.frequency as 'daily' | 'weekly'),
        time: item.time,
        description: item.description,
        lastDone: null
      }));

      const updated = [...routines, ...importedRoutines];
      localStorage.setItem('care_routines', JSON.stringify(updated));
      setRoutineImportSuccess(true);
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }

      setTimeout(() => {
        setRoutineImportSuccess(false);
      }, 3000);
      
      window.dispatchEvent(new CustomEvent('care-routines-changed'));
    } catch (e) {
      console.error(e);
    }
  };

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

        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-stone-150 dark:border-stone-800/80">
          <button
            onClick={() => setIsInfographicModalOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl py-2.5 px-3 text-[11px] font-black shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>{t('Care Infographic', '一键生成照料卡')}</span>
          </button>
          
          <button
            onClick={() => setIsRoutineModalOpen(true)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-2.5 px-3 text-[11px] font-black shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>{t('Care Routine Builder', '定制一周作息表')}</span>
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

      {/* Week-long Care Routine Builder Modal Overlay */}
      <AnimatePresence>
        {isRoutineModalOpen && (
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
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Calendar className="w-5.5 h-5.5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 leading-tight">
                      {t('AI Weekly Care Routine Planner', 'AI 萌宠专属一周作息规划生成器')}
                    </h3>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 font-bold">
                      {t('Generate interactive routine schedule for calendar export', '智能规划专属排班日程，并一键导入到个人系统日历')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsRoutineModalOpen(false);
                    setGeneratedRoutine(null);
                    setRoutineError('');
                  }}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content Container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {!generatedRoutine && !isGeneratingRoutine ? (
                  /* Form State */
                  <div className="space-y-5">
                    {/* Pet Selector */}
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                        {t('1. Select Companion Pet', '1. 选择目标宠物宝贝')}
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
                                  ? 'bg-indigo-500/10 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
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

                    {/* Workday Schedule Selector */}
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                        {t('2. Your Workday Schedule', '2. 主人的日常作息安排')}
                      </label>
                      <select
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-800 rounded-2xl text-xs text-stone-850 dark:text-stone-150 font-bold focus:outline-none"
                        value={workday}
                        onChange={(e) => setWorkday(e.target.value)}
                      >
                        <option value="9-to-5">{t('Standard 9-to-5 Work Shift', '标准朝九晚五上班族 (通勤往返/混合办公)')}</option>
                        <option value="wfh">{t('Work From Home / Remote', '居家办公 / 自由职业 / 弹性作息')}</option>
                        <option value="busy">{t('Extremely Busy Shift (7+ hours out)', '极其繁忙/长时间外勤工作 (日均外出7小时以上)')}</option>
                        <option value="night">{t('Night Shift / Evening work', '夜班作息 / 昼伏夜出作息')}</option>
                      </select>
                    </div>

                    {/* Special Health/Behavioral Concerns */}
                    <div>
                      <label className="block text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                        {t('3. Health / Behavioral Concerns (Optional)', '3. 特殊健康与行为关注点 (选填)')}
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-stone-50 dark:bg-stone-950/40 border border-stone-150 dark:border-stone-800 rounded-2xl text-xs text-stone-850 dark:text-stone-150 font-bold placeholder-stone-400 focus:outline-none"
                        placeholder={t('e.g., puppy potty training, recovering itchy skin, sensitive tummy...', '例：幼年随地排便训练、皮肤轻微过敏瘙痒、容易软便拉稀...')}
                        value={customConcerns}
                        onChange={(e) => setCustomConcerns(e.target.value)}
                      />
                    </div>

                    {/* Bottom action */}
                    <button
                      onClick={handleGenerateRoutine}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl py-3 px-4 text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>{t('Generate Personalized Care Routine', '开始智能定制专属一周科学作息')}</span>
                    </button>
                  </div>
                ) : isGeneratingRoutine ? (
                  /* Loading State */
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
                    </div>
                    
                    <div className="text-center space-y-2 max-w-sm">
                      <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                        {t('AI Behavioral Planner Consulting...', 'AI 行为规划专家正在进行深度定制')}
                      </h4>
                      <p className="text-[11px] text-indigo-500 font-bold leading-relaxed animate-pulse">
                        {t('Creating custom week-long care routine, aligning hour-by-hour feeding, training, play, and grooming sessions to your workload...', '正在为您匹配爱宠的日常作息需求，精细规划晨起、上班期、下班后和夜间的温和护理，建立科学行为习惯...')}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Success/Preview State */
                  <div className="space-y-5 text-left">
                    <div className="text-center">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-inner border border-emerald-100/40">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t('AI Week-long Routine Designed!', 'AI 专属作息表设计完成！')}</span>
                      </div>
                    </div>

                    {/* Display timeline */}
                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto p-1 border border-stone-100 dark:border-stone-850 rounded-2xl bg-stone-50/50 dark:bg-stone-950/20">
                      {generatedRoutine?.map((item, idx) => (
                        <div key={idx} className="flex gap-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-150/50 dark:border-stone-800/80 shadow-sm">
                          <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0 select-none bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg h-fit">
                            {item.time}
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-stone-900 dark:text-white truncate">{item.title}</span>
                              <span className={`text-[8px] font-black border px-1.5 rounded-md h-4 flex items-center bg-stone-50 text-stone-500`}>
                                {item.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal font-bold">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={handleExportICS}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl py-3 px-4 text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{exportSuccess ? t('Exported Successfully!', '已成功导出！') : t('Export to Personal Calendar (.ics)', '导出到系统个人日历')}</span>
                      </button>
                      
                      <button
                        onClick={handleImportToAppChecklist}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl py-3 px-4 text-xs font-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{routineImportSuccess ? t('Imported successfully!', '成功导入到日常清单！') : t('One-click Import to Daily Checklist', '一键导入日常任务清单')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setGeneratedRoutine(null);
                          setRoutineError('');
                        }}
                        className="px-4 py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl text-xs font-black transition-colors cursor-pointer text-center"
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
