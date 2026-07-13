import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, Bot, Send, Check, RefreshCw, Trash2, Heart, Award, 
  AlertCircle, BookOpen, Utensils, MessageSquare, Info, Star, HelpCircle, 
  CheckCircle, Plus, Copy, Volume2, Calendar, User, Sliders, ChevronRight, Camera
} from 'lucide-react';
import { Pet } from '../types';
import { MOCK_PETS } from '../data/pets';
import { PetCard } from './PetCard';
import PetDetailModal from './PetDetailModal';
import CameraCapture from './CameraCapture';
import { useLanguage } from '../lib/LanguageContext';

type ActiveTab = 'chat' | 'matchmaker' | 'nutrition';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  petContextName?: string;
}

export default function AIHelperView() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedDetailPet, setSelectedDetailPet] = useState<Pet | null>(null);

  // Load pets from local storage with MOCK_PETS fallback
  const pets = useMemo(() => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      return saved ? JSON.parse(saved) : MOCK_PETS;
    } catch {
      return MOCK_PETS;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 1. CHAT TAB STATE & FUNCTIONS
  // ---------------------------------------------------------------------------
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello there! 🐾 I am your AI Pet Companion. I'm here to provide smart symptom guidance, behavioral training advice, or custom breed insight. Select one of your pets as context to customize my answers!",
      timestamp: 'Just now'
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedPetContextId, setSelectedPetContextId] = useState<string>('none');
  const [showCopyIndex, setShowCopyIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [idResult, setIdResult] = useState<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleCapture = async (blob: Blob) => {
    setShowCamera(false);
    setChatLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
            const res = await fetch('/api/identify-pet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 }),
            });
            const data = await res.json();
            setIdResult(data);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `Based on the image, the pet appears to be a ${data.breed || 'unknown'}. Analysis: ${data.analysis || 'N/A'}. Potential symptoms: ${data.symptoms || 'N/A'}.` }]);
        } catch (e) {
            console.error(e);
        } finally {
            setChatLoading(false);
        }
    };
  };

  // Pre-set quick questions based on species context
  const quickQuestions = [
    { label: t("🐶 Chewing shoes help", "🐶 纠正拆家咬鞋子"), query: t("My puppy is constantly chewing shoes and furniture. How can I redirect this behavior?", "我的幼犬经常乱啃鞋子和家具，我应该如何纠正和引导它的这种行为？"), species: 'Dog' },
    { label: t("🐱 Safe cat plants", "🐱 猫咪安全绿植"), query: t("What are some popular house plants that are 100% safe for cats, and which core ones should I avoid?", "有哪些常见的室内植物对猫咪是100%安全的？有哪些植物需要绝对避免？"), species: 'Cat' },
    { label: t("🥗 Safe dog foods", "🥗 狗狗安全食物"), query: t("What common human foods are highly toxic to dogs, and what are safe alternatives?", "哪些常见的人类食物对狗狗是有毒的？有哪些安全的替代食物？"), species: 'Dog' },
    { label: t("🧼 Budgie cage setup", "🧼 虎皮鹦鹉笼舍布置"), query: t("What are the essential elements for a healthy budgie/bird cage setup to prevent stress?", "布置一个健康的虎皮鹦鹉或其他鸟类笼子需要哪些基本要素，以防止它们产生焦虑压力？"), species: 'Bird' },
    { label: t("💤 Adult dog sleeping", "💤 成年犬睡眠时长"), query: t("My adult dog is sleeping 14+ hours a day. Is this normal or a sign of lethargy/illness?", "我的成年狗每天睡14个小时以上，这正常吗，还是嗜睡或生病的迹象？"), species: 'Dog' },
  ];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [chatMessages, chatLoading]);

  // Context pet detail
  const currentContextPet = useMemo(() => {
    return pets.find(p => p.id === selectedPetContextId);
  }, [pets, selectedPetContextId]);

  const handleSendChatMessage = async (inputStr: string) => {
    const trimmed = inputStr.trim();
    if (!trimmed || chatLoading) return;

    // Build the user message
    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      petContextName: currentContextPet?.name
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    // Build dynamic rich prompt incorporating pet context
    let enrichedPrompt = trimmed;
    if (currentContextPet) {
      enrichedPrompt = `[PET PROFILE CONTEXT: Name: ${currentContextPet.name}, Species: ${currentContextPet.species}, Age Group: ${currentContextPet.age}, Current Medical Status: ${currentContextPet.medicalStatus}]. Please answer the following question on behalf of this pet: ${trimmed}`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: enrichedPrompt }] 
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();

      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Gemini chat error:', err);
      setChatMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an issue consulting my model. Please make sure the Gemini API Key is configured in Settings or try again later!\n\n*(Note: I can still assist with standard local pet care guides if you enter simple terms like nutrition, vaccine, train, or emergency.)*",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      chatLoadingRef.current = false; // local track
      setChatLoading(false);
    }
  };

  const chatLoadingRef = useRef(false);

  const handleCopyText = (text: string, index: number) => {
    try {
      navigator.clipboard.writeText(text);
      setShowCopyIndex(index);
      setTimeout(() => setShowCopyIndex(null), 2000);
    } catch (e) {
      console.warn("Clipboard access failed:", e);
    }
  };

  const handleSpeakText = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      if (speakingIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[\*\#\`]/g, ''));
        utterance.onend = () => setSpeakingIndex(null);
        utterance.onerror = () => setSpeakingIndex(null);
        window.speechSynthesis.speak(utterance);
        setSpeakingIndex(index);
      }
    } else {
      alert("Text-to-speech is not supported on this browser.");
    }
  };

  const handleClearChat = () => {
    if (window.confirm(t("Are you sure you want to clear your conversation history?", "您确定要清空您的对话历史记录吗？"))) {
      setChatMessages([
        { 
          role: 'assistant', 
          content: "Conversation cleared. Ask me another question anytime! 🐾",
          timestamp: 'Just now'
        }
      ]);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. MATCHMAKER TAB STATE & FUNCTIONS
  // ---------------------------------------------------------------------------
  const [matchPrefs, setMatchPrefs] = useState({
    species: 'Dog',
    age: 'Puppy/Kitten',
    energy: 'High',
    space: 'Apartment',
    lifestyle: 'Active'
  });
  const [matchResults, setMatchResults] = useState<Array<{ pet: Pet; reason: string }>>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchDone, setMatchDone] = useState(false);

  const handleRunMatchmaker = async () => {
    setMatchLoading(true);
    setMatchResults([]);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { 
            species: matchPrefs.species, 
            age: matchPrefs.age,
            location: 'Anywhere'
          },
          interactedPets: []
        })
      });

      const recs = await response.json();
      
      // Match recommendations with local pets
      const matches: Array<{ pet: Pet; reason: string }> = [];
      if (Array.isArray(recs)) {
        recs.forEach(rec => {
          const matchPet = pets.find(p => p.id === rec.petId);
          if (matchPet) {
            // Incorporate preferred lifestyle custom touches to reasons
            let customizedReason = rec.reason;
            if (matchPrefs.space === 'Apartment' && matchPrefs.energy === 'High') {
              customizedReason += " Even though they are high energy, they can thrive in your Apartment with sufficient outdoor park walks and active exercise!";
            }
            matches.push({
              pet: matchPet,
              reason: customizedReason
            });
          }
        });
      }

      // If no perfect matches returned, find species equivalents
      if (matches.length === 0) {
        const equivalentPets = pets.filter(p => p.species === matchPrefs.species || !matchPrefs.species);
        equivalentPets.slice(0, 2).forEach((p, idx) => {
          matches.push({
            pet: p,
            reason: `Highly compatible companion found! ${p.name} matches your interest in ${matchPrefs.species} pets and has an adaptable demeanor suited for ${matchPrefs.space} settings.`
          });
        });
      }

      setMatchResults(matches);
      setMatchDone(true);
    } catch (err) {
      console.error("Matchmaker error:", err);
      // Fallback manual match
      const fallbackMatches = pets
        .filter(p => p.species === matchPrefs.species)
        .slice(0, 2)
        .map(p => ({
          pet: p,
          reason: `Companion match: ${p.name} is a sweet ${p.species} who fits your target age range of ${matchPrefs.age} and would fit well into an ${matchPrefs.space}.`
        }));
      setMatchResults(fallbackMatches);
      setMatchDone(true);
    } finally {
      setMatchLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. DIET & NUTRITION TAB STATE & FUNCTIONS
  // ---------------------------------------------------------------------------
  const [nutritionForm, setNutritionForm] = useState({
    species: 'Dog',
    weight: '12',
    ageGroup: 'Adult',
    activityLevel: 'Normal',
    healthFocus: 'Standard wellness'
  });
  const [nutritionPlan, setNutritionPlan] = useState<string | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  const handleGenerateDietPlan = async () => {
    setNutritionLoading(true);
    setNutritionPlan(null);

    const prompt = `Generate a highly structured pet daily diet and nutrition planner for a ${nutritionForm.species}, weight: ${nutritionForm.weight} kg/lbs, age group: ${nutritionForm.ageGroup}, activity level: ${nutritionForm.activityLevel}, and health focus: ${nutritionForm.healthFocus}. 

Format the response into clear, human-readable sections:
- **Core Daily Caloric Estimate**: Estimated calories (kCal/day)
- **Morning Feeding Schedule**: Portions, diet type recommendation
- **Evening Feeding Schedule**: Portions, diet type recommendation
- **Health/Supplements Guidance**: Custom nutritional recommendation based on their focus
- **Banned Foods Checklist**: Absolute list of toxic ingredients for this specific species.

Keep the advice highly detailed, bulleted, and structured with clear spacing.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: prompt }] 
        }),
      });

      if (!response.ok) throw new Error('Failed to query diet planner');
      const data = await response.json();
      setNutritionPlan(data.reply);
    } catch (err) {
      console.error("Diet Plan error:", err);
      // Fallback
      const dailyCal = parseFloat(nutritionForm.weight) * 30 + 70;
      setNutritionPlan(`### 🥗 Custom ${nutritionForm.species} Nutrition Planner (Fallback)

- **Core Daily Caloric Estimate**: Approximately **${Math.round(dailyCal)} kCal/day** based on weight ${nutritionForm.weight} kg.
- **Morning Feeding Schedule**: 
  - Feed 50% of daily dry kibble (approx. 1 cup) mixed with warm water or wet broth.
  - Serve fresh water.
- **Evening Feeding Schedule**:
  - Feed remaining 50% portion (1 cup). 
  - Optionally supplement with 1-2 spoonfuls of species-safe wet wet food to stimulate hydration.
- **Health/Supplements Guidance (${nutritionForm.healthFocus})**:
  - Ensure constant fresh hydration. Regular weight checks are encouraged to maintain active metabolic wellness. 
- **Banned Foods**: Do not serve chocolate, onions, grapes, macadamia nuts, or artificial sugars. Always consult your clinic veterinarian before major dietary modifications.`);
    } finally {
      setNutritionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Card */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-500 p-8 rounded-3xl text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 translate-x-12 flex items-center select-none pointer-events-none">
          <Bot className="w-96 h-96" />
        </div>
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 backdrop-blur-sm text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> {t('Advanced Vet AI Suite', '高级宠物智能 AI 诊断套件')}
          </span>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8" /> {t('Smart AI Pet Assistant', '智能 AI 宠物助手')}
          </h1>
          <p className="text-sm text-violet-100 max-w-xl font-medium">
            {t('Get instant expert symptom checking, run advanced adopter compatibility algorithms, or design custom clinical dietary nutrition planners instantly.', '即时获取专业的症状检查，运行科学的领养兼容性匹配，或定制科学的宠物膳食营养计划。')}
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-stone-100 dark:bg-stone-900 rounded-2xl max-w-2xl">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('Vet Q&A & Symptom', 'AI 问诊与症状自测')}</span>
        </button>

        <button
          onClick={() => setActiveTab('matchmaker')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'matchmaker'
              ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>{t('AI Matchmaker', 'AI 智能领养匹配')}</span>
        </button>

        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'nutrition'
              ? 'bg-white dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
          }`}
        >
          <Utensils className="w-4 h-4 text-orange-500" />
          <span>{t('Diet & Nutrition', '科学膳食与营养规划')}</span>
        </button>
      </div>

      {/* -----------------------------------------------------------------------
          TAB CONTENT: VET Q&A CHAT
          ----------------------------------------------------------------------- */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar controls */}
          <div className="lg:col-span-1 space-y-5">
            {/* Pet Context Selector */}
            <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider">{t('Conversation Context', '对话背景关联')}</h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('Tailor Gemini replies for a specific companion profile.', '通过关联特定宠物档案，让 AI 回答更加精准贴切。')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">{t('Select Profile:', '选择爱宠档案:')}</label>
                <select
                  value={selectedPetContextId}
                  onChange={(e) => setSelectedPetContextId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="none">{t('General Inquiry (No context)', '通用业务咨询 (不关联宠物)')}</option>
                  {pets.map(p => {
                    const speciesText = p.species === 'Dog' ? t('Dog', '狗狗') : p.species === 'Cat' ? t('Cat', '猫咪') : p.species === 'Bird' ? t('Bird', '鸟类') : t('Other', '其他');
                    return (
                      <option key={p.id} value={p.id}>{p.name} ({speciesText} • {p.age})</option>
                    );
                  })}
                </select>
              </div>

              {currentContextPet && (
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/30 text-xs text-stone-700 dark:text-stone-300 space-y-1.5 animate-fade-in">
                  <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {t('Context Active', '对话背景已绑定')}: {currentContextPet.name}
                  </div>
                  <div className="text-[11px] space-y-1">
                    <p>• <strong>{t('Species', '宠物种类')}:</strong> {currentContextPet.species === 'Dog' ? t('Dog', '狗狗 🐶') : currentContextPet.species === 'Cat' ? t('Cat', '猫咪 🐱') : currentContextPet.species === 'Bird' ? t('Bird', '鸟儿 🐦') : t('Other', '其他 🐾')}</p>
                    <p>• <strong>{t('Age Group', '年龄阶段')}:</strong> {currentContextPet.age}</p>
                    <p>• <strong>{t('Medical', '健康状况')}:</strong> <span className="italic text-stone-500">{currentContextPet.medicalStatus}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase text-stone-400 dark:text-stone-500 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-rose-500" /> {t('Suggested Topics', '推荐对话主题')}
              </h4>
              <div className="flex flex-col gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(q.query);
                      handleSendChatMessage(q.query);
                    }}
                    className="w-full text-left p-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-100 hover:border-indigo-200 dark:border-stone-800 dark:hover:border-stone-700 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Card */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-200/50 dark:border-amber-900/30 flex gap-3 text-xs text-amber-800 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-bold block mb-0.5">{t('Disclaimer Notice', '健康免责声明')}</strong>
                {t('Our AI offers educational guidance and care suggestions. It is not a physical vet and does not replace clinic triage or professional diagnosis in emergencies.', '我们的 AI 助手仅提供科学科普指导与日常护理建议。它不能替代线下兽医诊疗，亦不能作为紧急情况下的临床诊断或专业治疗依据。')}
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-3 flex flex-col bg-white dark:bg-stone-850 rounded-3xl shadow-sm border border-stone-200/60 dark:border-stone-850 flex-1 h-[600px] overflow-hidden">
            {/* Window header */}
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">{t('Pet Assistant Brain', '宠物 AI 助理大脑')}</h3>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">{t('Gemini model live integration • Active context', 'Gemini 极速模型对接 • 会话上下文已关联')}</p>
                </div>
              </div>
 
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-red-500 dark:text-stone-400 dark:hover:text-red-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('Clear History', '清空历史')}</span>
              </button>
            </div>
 
            {/* Chat message display */}
            <div ref={chatScrollRef} className="flex-1 p-6 overflow-y-auto space-y-5 bg-stone-50/20 dark:bg-stone-950/10">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-3.5 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                  </div>
 
                  <div className="space-y-1">
                    {msg.petContextName && (
                      <span className="text-[9px] font-black uppercase text-indigo-500 dark:text-indigo-400 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-full w-fit block ml-1">
                        {t('Concern', '关切爱宠')}: {msg.petContextName}
                      </span>
                    )}
                    
                    <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed relative group ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white shadow-sm rounded-tr-none' 
                        : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-100/60 dark:border-stone-700/50 shadow-sm rounded-tl-none'
                    }`}>
                      {/* Formatted Markdown/Structured text parsing helper */}
                      <div className="space-y-2 whitespace-pre-line">
                        {msg.content === "Hello there! 🐾 I am your AI Pet Companion. I'm here to provide smart symptom guidance, behavioral training advice, or custom breed insight. Select one of your pets as context to customize my answers!"
                          ? t("Hello there! 🐾 I am your AI Pet Companion. I'm here to provide smart symptom guidance, behavioral training advice, or custom breed insight. Select one of your pets as context to customize my answers!", '你好！🐾 我是您的 AI 宠物助手。我可以为您提供智能症状指导、行为训练建议或宠物品种洞察。选择您的某个宠物作为背景，我将为您量身定制专属的解答！')
                          : msg.content === "Conversation cleared. Ask me another question anytime! 🐾"
                          ? t("Conversation cleared. Ask me another question anytime! 🐾", "对话已清空。随时欢迎向我提问！🐾")
                          : msg.content
                        }
                      </div>
 
                      {/* Floating actions for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="absolute right-3 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-stone-800/95 py-1 px-1.5 rounded-lg border dark:border-stone-700 shadow-sm">
                          <button
                            onClick={() => handleCopyText(msg.content, i)}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            title="Copy message"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleSpeakText(msg.content, i)}
                            className={`p-1 transition-colors cursor-pointer ${
                              speakingIndex === i ? 'text-rose-500 animate-pulse' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                            }`}
                            title="Speak message"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          
                          {showCopyIndex === i && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] py-0.5 px-1.5 rounded shadow-sm whitespace-nowrap">
                              {t('Copied!', '已复制！')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[10px] text-stone-400 block px-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp === 'Just now' ? t('Just now', '刚刚') : msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
 
              {chatLoading && (
                <div className="flex gap-3.5 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex-shrink-0 flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-3xl rounded-tl-none text-xs font-semibold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>{t('Gemini is generating dynamic guidance...', 'AI 正在为您生成科学指导与回答建议...')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage(chatInput);
              }} 
              className="p-4 bg-stone-50 dark:bg-stone-900/40 border-t border-stone-100 dark:border-stone-800/80 flex gap-2.5 items-center"
            >
              <input
                type="text"
                required
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("Ask our AI Vet anything about diet, behavioral training, or symptom checks...", "向我们的 AI 宠物助理咨询日常饮食、行为训练、健康检查或养宠指南等任意问题...")}
                className="flex-1 px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-stone-900 dark:text-white"
              />
              <button 
                type="button"
                onClick={() => setShowCamera(true)}
                className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl w-full max-w-sm space-y-4">
            <CameraCapture onCapture={handleCapture} />
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB CONTENT: AI ADOPTION MATCHMAKER
          ----------------------------------------------------------------------- */}
      {activeTab === 'matchmaker' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main matchmaking wizard */}
          <div className="bg-white dark:bg-stone-850 p-6 sm:p-8 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-50 dark:border-stone-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white text-base">{t('Compatibility Questionnaire', '领养兼容性评估问卷')}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">{t('Specify details to let Gemini calculate matching companion scores.', '请提供您的生活习惯与偏好，让 AI 算法帮您精准计算匹配度得分。')}</p>
              </div>
            </div>

            {/* Questions Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Q1: Species */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('1. Target Species', '1. 期望领养的宠物种类')}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Dog', 'Cat', 'Bird', 'Small Pet'].map(sp => (
                    <button
                      type="button"
                      key={sp}
                      onClick={() => setMatchPrefs(prev => ({ ...prev, species: sp }))}
                      className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        matchPrefs.species === sp 
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {sp === 'Dog' ? t('Dog', '狗狗 🐶') : sp === 'Cat' ? t('Cat', '猫咪 🐱') : sp === 'Bird' ? t('Bird', '鸟儿 🐦') : t('Small Pet', '小型宠物 🐹')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Age Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('2. Ideal Age group', '2. 理想的宠物年龄段')}</label>
                <select
                  value={matchPrefs.age}
                  onChange={(e) => setMatchPrefs(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Puppy/Kitten">{t('Puppy/Kitten', '幼年 (幼犬/幼猫)')}</option>
                  <option value="Adult">{t('Adult', '成年')}</option>
                  <option value="Senior">{t('Senior', '老年')}</option>
                </select>
              </div>

              {/* Q3: Energy Match */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('3. Energy Compatibility', '3. 期望的活跃程度')}</label>
                <select
                  value={matchPrefs.energy}
                  onChange={(e) => setMatchPrefs(prev => ({ ...prev, energy: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Low">{t('Low (Prefers naps & relaxation)', '低 (偏好打盹与安静)')}</option>
                  <option value="Medium">{t('Medium (Requires basic daily strolls)', '中等 (需要每日基础散步)')}</option>
                  <option value="High">{t('High (Endless fetch & agility runs)', '高 (需要大量寻回与敏捷运动)')}</option>
                </select>
              </div>

              {/* Q4: Living Space */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('4. Current Living Space', '4. 您的居住空间环境')}</label>
                <select
                  value={matchPrefs.space}
                  onChange={(e) => setMatchPrefs(prev => ({ ...prev, space: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Apartment">{t('Apartment (Limited size)', '公寓 / 套房 (空间有限)')}</option>
                  <option value="House with Yard">{t('House with fenced yard', '带有围栏小院的独立住宅')}</option>
                  <option value="Rural/Farm">{t('Rural estate / Farm range', '郊外庄园 / 农场开阔空地')}</option>
                </select>
              </div>

              {/* Q5: Owner Lifestyle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">{t('5. Owner Lifestyle', '5. 您的生活节奏/生活方式')}</label>
                <select
                  value={matchPrefs.lifestyle}
                  onChange={(e) => setMatchPrefs(prev => ({ ...prev, lifestyle: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
                >
                  <option value="Calm">{t('Calm & Quiet (Home relaxation)', '安静闲适 (居家修身养性)')}</option>
                  <option value="Normal">{t('Moderate (Occasional hikes)', '中等强度 (偶尔户外徒步)')}</option>
                  <option value="Active">{t('Highly Active (Agility training/runs)', '高强度运动 (规律跑步或敏捷训练)')}</option>
                </select>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="border-t border-stone-50 dark:border-stone-800 pt-5 flex items-center justify-between gap-4">
              <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {t('Scores are matched in real-time across database candidates using cognitive compatibility weights.', '配对分数是根据认知兼容性权重在待领养数据库中进行实时匹配与解算的。')}
              </p>

              <button
                onClick={handleRunMatchmaker}
                disabled={matchLoading}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md shadow-rose-500/10 active:scale-95 disabled:opacity-40"
              >
                {matchLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('Analyzing compatibility...', '正在计算并分析兼容性...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('Run Matchmaker Engine', '运行智能领养配对')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results section */}
          {matchDone && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-stone-900 dark:text-white text-lg">{t('Your Top Compatible Companion Matches', '为您精准挑选的最佳兼容宠物候选')}</h3>
              </div>

              {matchResults.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl">
                  <p className="text-sm text-stone-500 dark:text-stone-400">{t('No compatible candidates currently found in the local area. Try broadening your questionnaire parameters!', '当前未在您所在的区域找到完美的匹配候选。请尝试放宽问卷筛选条件！')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {matchResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative"
                    >
                      {/* Left Badge Match Indicator */}
                      <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {t('#{num} Best Match', '#{num} 最佳匹配').replace('#{num}', `#${idx + 1}`)}
                      </span>

                      {/* Image section */}
                      <div className="w-full md:w-40 h-40 rounded-2xl overflow-hidden shrink-0">
                        <img 
                          src={result.pet.imageUrl} 
                          alt={result.pet.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Context & Reason */}
                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-xl font-bold text-stone-900 dark:text-white">{result.pet.name}</h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {result.pet.species === 'Dog' ? t('Dog', '狗狗') : result.pet.species === 'Cat' ? t('Cat', '猫咪') : result.pet.species === 'Bird' ? t('Bird', '鸟儿') : t('Other', '其他')} • {result.pet.age} • {result.pet.location}
                          </p>
                          <p className="text-xs text-stone-600 dark:text-stone-300 italic pt-2.5 bg-rose-50/40 dark:bg-rose-950/10 p-3 rounded-xl border border-rose-100/30 dark:border-rose-900/10">
                            <strong>{t('AI Match Reason:', 'AI 匹配理由:')}</strong> {result.reason}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedDetailPet(result.pet)}
                          className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-colors w-fit pt-2 cursor-pointer"
                        >
                          <span>{t("View {name}'s Profile", "查看 {name} 的完整档案").replace('{name}', result.pet.name)}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB CONTENT: DIET & NUTRITION PLANNER
          ----------------------------------------------------------------------- */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-1 bg-white dark:bg-stone-850 p-6 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-stone-50 dark:border-stone-800">
              <Utensils className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">{t('Meal Setup Parameters', '膳食与营养计算参数')}</h3>
            </div>

            {/* Species Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">{t('Species Type', '宠物种类')}</label>
              <div className="grid grid-cols-2 gap-2">
                {['Dog', 'Cat', 'Bird', 'Rabbit'].map(sp => (
                  <button
                    type="button"
                    key={sp}
                    onClick={() => setNutritionForm(prev => ({ ...prev, species: sp }))}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      nutritionForm.species === sp 
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {sp === 'Dog' ? t('Dog', '狗狗 🐶') : sp === 'Cat' ? t('Cat', '猫咪 🐱') : sp === 'Bird' ? t('Bird', '鸟儿 🐦') : t('Rabbit', '兔子 🐰')}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Weight */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">{t('Pet Weight (kg / lbs)', '宠物体重 (kg / 磅)')}</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                value={nutritionForm.weight}
                onChange={(e) => setNutritionForm(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
              />
            </div>

            {/* Age Group */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">{t('Life Stage', '成长/生命阶段')}</label>
              <select
                value={nutritionForm.ageGroup}
                onChange={(e) => setNutritionForm(prev => ({ ...prev, ageGroup: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
              >
                <option value="Puppy/Kitten">{t('Puppy / Kitten (Growth Phase)', '幼年期 (生长发育阶段)')}</option>
                <option value="Adult">{t('Adult (Maintenance Phase)', '成年期 (基础维持阶段)')}</option>
                <option value="Senior">{t('Senior (Geriatric Phase)', '老年期 (老年退化阶段)')}</option>
              </select>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">{t('Daily Activity Rate', '每日运动量')}</label>
              <select
                value={nutritionForm.activityLevel}
                onChange={(e) => setNutritionForm(prev => ({ ...prev, activityLevel: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
              >
                <option value="Low">{t('Low / Sedentary', '极低 / 室内不爱运动')}</option>
                <option value="Normal">{t('Moderate / Companion Strolls', '中等 / 伴随散步')}</option>
                <option value="Active">{t('Active (1-2 hours active fetch)', '高 / 1-2小时抛接跑动')}</option>
                <option value="Athletic">{t('High Athletic (Working or long runs)', '极高 / 工作犬或长距离跑步')}</option>
              </select>
            </div>

            {/* Health Focus */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">{t('Target Health/Diet Focus', '特定健康/膳食关注点')}</label>
              <select
                value={nutritionForm.healthFocus}
                onChange={(e) => setNutritionForm(prev => ({ ...prev, healthFocus: e.target.value }))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-850 dark:text-stone-200 focus:outline-none"
              >
                <option value="Standard wellness">{t('Standard Companion Wellness', '基础全期日常健康调理')}</option>
                <option value="Weight loss">{t('Weight Management / Calorie Deficit', '体重管理 (科学减脂减重)')}</option>
                <option value="Muscle gain">{t('Muscle Development / High Protein', '增肌发育 (高蛋白营养)')}</option>
                <option value="Healthy joints">{t('Joint & Bone Support (Glucosamine)', '关节骨骼养护 (补充氨糖/软骨素)')}</option>
                <option value="Sensitive stomach">{t('Sensitive Stomach / Easy Digestion', '肠胃调理 (温和易消化)')}</option>
              </select>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleGenerateDietPlan}
              disabled={nutritionLoading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-95 disabled:opacity-40"
            >
              {nutritionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('Drafting custom diet guide...', '正在为您定制科学膳食指南...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('Generate AI Nutrition Plan', '生成 AI 科学膳食规划')}</span>
                </>
              )}
            </button>
          </div>

          {/* Results Output Dashboard */}
          <div className="lg:col-span-2 bg-white dark:bg-stone-850 rounded-3xl border border-stone-200/60 dark:border-stone-800/80 shadow-sm p-6 sm:p-8 flex flex-col min-h-[500px]">
            <div className="flex items-center gap-2 border-b border-stone-50 dark:border-stone-800 pb-4">
              <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
                <Utensils className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white text-sm">{t('Custom Dietary Schedule', '定制膳食配方计划书')}</h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">{t('Nutritional calculations matched against active body condition score goals.', '基于您设定的宠物身体特征与健康目标，科学计算每日所需卡路里。')}</p>
              </div>
            </div>

            {/* Plan Display */}
            <div className="flex-1 flex flex-col justify-center py-4">
              {nutritionLoading ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center mx-auto animate-spin">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-white text-sm">{t('Consulting Clinical Nutrition Models', '正在向兽医临床营养学模型发起运算')}</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">{t('Calculating estimated caloric requirements and daily ingredient portion schedule...', '正在计算所需每日摄入热量、配料配比和喂食周期频率表...')}</p>
                </div>
              ) : nutritionPlan ? (
                <div className="bg-stone-50/40 dark:bg-stone-950/20 p-6 rounded-2xl border border-stone-100 dark:border-stone-800/80 prose dark:prose-invert max-w-none text-xs sm:text-sm text-stone-800 dark:text-stone-300 leading-relaxed space-y-4 whitespace-pre-line animate-fade-in">
                  {nutritionPlan}
                </div>
              ) : (
                <div className="text-center py-16 space-y-4 max-w-xs mx-auto">
                  <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-900/60 text-stone-400 flex items-center justify-center mx-auto">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-950 dark:text-white text-sm">{t('No Active Nutrition Plan', '暂无激活的膳食方案')}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t("Configure your pet's life stage, activity, and weight details on the left, then trigger the AI generate engine to view a custom schedule.", '请在左侧配置您的爱宠成长阶段、每日活动量与体重参数，然后点击“生成 AI 科学膳食规划”查看推荐方案。')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal if open */}
      {selectedDetailPet && (
        <PetDetailModal pet={selectedDetailPet} onClose={() => setSelectedDetailPet(null)} />
      )}
    </div>
  );
}
