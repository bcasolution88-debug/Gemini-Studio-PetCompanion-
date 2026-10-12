import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Award, Trophy, ShieldCheck, Scale, Heart, Smile, 
  Sparkles, Trash2, Flame, CheckCircle2, Lock, Activity, 
  Tag, Plus, Calendar, Eye, ChevronRight, X, AlertCircle, Info, TrendingUp, Download,
  Check, RotateCcw, Clock, Stethoscope, Search, Filter, Camera, Image
} from 'lucide-react';
import { HealthJournalEntry, Pet } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Levels definition
interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  icon: string;
  badgeColor: string;
}

const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Novice Companion', minXp: 0, maxXp: 100, icon: '🐾', badgeColor: 'from-stone-500 to-stone-600' },
  { level: 2, title: 'Caring Guardian', minXp: 100, maxXp: 250, icon: '🌟', badgeColor: 'from-blue-500 to-indigo-600' },
  { level: 3, title: 'Wellness Advocate', minXp: 250, maxXp: 500, icon: '🛡️', badgeColor: 'from-emerald-500 to-teal-600' },
  { level: 4, title: 'Health Specialist', minXp: 500, maxXp: 800, icon: '⚡', badgeColor: 'from-purple-500 to-fuchsia-600' },
  { level: 5, title: 'Elite Pet Parent', minXp: 800, maxXp: 99999, icon: '👑', badgeColor: 'from-amber-500 to-orange-600' },
];

// Medication Schedule structure
interface MedicationSchedule {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  timeOfDay: string; // Morning, Afternoon, Evening, Night
  startDate: string;
  active: boolean;
  logs: Record<string, 'taken' | 'missed' | 'pending'>;
}

// Achievements definition
interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  check: (entries: HealthJournalEntry[]) => boolean;
  progress: (entries: HealthJournalEntry[]) => { current: number; target: number };
}

const BADGES: Badge[] = [
  {
    id: 'first-entry',
    name: 'First Steps',
    description: 'Log your first wellness journal entry to start your tracking journey.',
    requirement: 'Log at least 1 journal entry.',
    iconName: 'Award',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-900',
    check: (entries: HealthJournalEntry[]) => entries.length >= 1,
    progress: (entries: HealthJournalEntry[]) => ({ current: Math.min(entries.length, 1), target: 1 })
  },
  {
    id: 'consistency-3',
    name: 'Dedicated Companion',
    description: 'Log three wellness entries to show consistent support for your pet.',
    requirement: 'Log at least 3 journal entries.',
    iconName: 'ShieldCheck',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    check: (entries: HealthJournalEntry[]) => entries.length >= 3,
    progress: (entries: HealthJournalEntry[]) => ({ current: Math.min(entries.length, 3), target: 3 })
  },
  {
    id: 'weight-tracker',
    name: 'Weight Watcher',
    description: 'Enter your pet’s weight in multiple records to track health metrics over time.',
    requirement: 'Log weight in at least 2 entries.',
    iconName: 'Scale',
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-900',
    check: (entries: HealthJournalEntry[]) => entries.filter(e => e.weight && e.weight > 0).length >= 2,
    progress: (entries: HealthJournalEntry[]) => ({ current: Math.min(entries.filter(e => e.weight && e.weight > 0).length, 2), target: 2 })
  },
  {
    id: 'mood-insight',
    name: 'Emotional Connect',
    description: 'Log health journal entries that contain a mood selection to watch emotional shifts.',
    requirement: 'Log mood details in at least 3 entries.',
    iconName: 'Heart',
    color: 'text-rose-500 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-900',
    check: (entries: HealthJournalEntry[]) => entries.filter(e => e.mood && e.mood.trim().length > 0).length >= 3,
    progress: (entries: HealthJournalEntry[]) => ({ current: Math.min(entries.filter(e => e.mood && e.mood.trim().length > 0).length, 3), target: 3 })
  },
  {
    id: 'legend-5',
    name: 'Master Guardian',
    description: 'Record five detailed journal logs to earn the ultimate pet caregiver status.',
    requirement: 'Log at least 5 journal entries total.',
    iconName: 'Trophy',
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-900',
    check: (entries: HealthJournalEntry[]) => entries.length >= 5,
    progress: (entries: HealthJournalEntry[]) => ({ current: Math.min(entries.length, 5), target: 5 })
  }
];

// Synth sounds engine to provide rewarding feedback
const playSynthesizedChime = (type: 'levelUp' | 'badge' | 'log') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'levelUp') {
      // Sweeping ascending clean major chord
      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } else if (type === 'badge') {
      // Sparkling shimmer chime
      const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1318.51]; // Bright high notes
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } else if (type === 'log') {
      // Pleasant click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (err) {
    console.warn('Audio synthesis failed (requires user interaction first):', err);
  }
};

const getTagEmoji = (tag: string): string => {
  const clean = tag.toLowerCase().replace('#', '').trim();
  if (clean === 'calm' || clean === '平静') return '😌';
  if (clean === 'energetic' || clean === '精力' || clean === '活力') return '⚡';
  if (clean === 'playful' || clean === '调皮' || clean === '贪玩') return '🤪';
  if (clean === 'tired' || clean === '疲惫' || clean === '累') return '😴';
  if (clean === 'timid' || clean === '胆小') return '🥺';
  if (clean === 'social' || clean === '亲人' || clean === '社交') return '🥰';
  if (clean === 'loving' || clean === '温顺' || clean === '爱') return '❤️';
  if (clean === 'curious' || clean === '好奇') return '🧐';
  if (clean === 'excited' || clean === '兴奋') return '🥳';
  if (clean === 'grumpy' || clean === '暴躁' || clean === '脾气') return '😠';
  if (clean === 'happy' || clean === '开心' || clean === '快乐') return '😸';
  if (clean === 'snuggly' || clean === '撒娇') return '🤗';
  if (clean === 'hungry' || clean === '饥饿') return '😋';
  if (clean === 'sleepy' || clean === '困倦') return '💤';
  if (clean === 'sick' || clean === '不适') return '🤒';
  if (clean === 'lethargy' || clean === '萎靡') return '😴';
  if (clean === 'appetite_loss' || clean === 'appetite-loss' || clean === '食欲不振') return '🍖';
  if (clean === 'vomiting' || clean === '呕吐') return '🤮';
  if (clean === 'coughing' || clean === '咳嗽') return '🗣️';
  if (clean === 'fever' || clean === '发烧') return '🤒';
  if (clean === 'itching' || clean === '瘙痒') return '🐾';
  if (clean === 'sneezing' || clean === '喷嚏') return '🤧';
  if (clean === 'diarrhea' || clean === '腹泻') return '💩';
  return '🐾';
};

export default function PetHealthJournal() {
  const { t } = useLanguage();
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pet_community_pets');
      if (saved) {
        setPets(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading pets in PetHealthJournal:', e);
    }
  }, []);

  const getPetInfo = (petId: string) => {
    let pet = pets.find(p => p.id === petId);
    if (!pet && pets.length > 0) {
      pet = pets[0];
    }
    return pet;
  };

  const [entries, setEntries] = useState<HealthJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('pet_health_journal_entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'log' | 'badges' | 'stats' | 'meds' | 'symptoms'>('log');

  // Search & Filter state variables
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Memoized 7-day data for Recharts frequency chart
  const last7DaysData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      const dateStrLocale = d.toLocaleDateString();
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      data.push({
        dateStr: dateStrLocale,
        dateObj: d,
        label,
        moodCount: 0,
        symptomCount: 0,
        totalCount: 0,
      });
    }

    const isSameDay = (d1: Date, d2Str: string) => {
      try {
        const d2 = new Date(d2Str);
        if (isNaN(d2.getTime())) {
          return d1.toLocaleDateString() === d2Str;
        }
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
      } catch {
        return d1.toLocaleDateString() === d2Str;
      }
    };

    entries.forEach(entry => {
      const matchedDay = data.find(d => isSameDay(d.dateObj, entry.date));
      if (matchedDay) {
        if (entry.mood && entry.mood.trim().length > 0) {
          matchedDay.moodCount += 1;
        }
        const isSymptom = (entry.moodTags && entry.moodTags.includes('#sick')) || 
                          /cough|fever|scratch|vomit|pain|itch|sneeze|sick|letharg|limp|diarrh|喘|咳|挠|痒|烧|疼|吐|拉|不适|精神/i.test(entry.activity);
        if (isSymptom) {
          matchedDay.symptomCount += 1;
        }
        matchedDay.totalCount += 1;
      }
    });

    return data;
  }, [entries]);

  // Memoized filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const activityMatch = entry.activity.toLowerCase().includes(kw);
        const moodMatch = entry.mood ? entry.mood.toLowerCase().includes(kw) : false;
        const tagsMatch = entry.moodTags ? entry.moodTags.some(t => t.toLowerCase().includes(kw)) : false;
        
        if (!activityMatch && !moodMatch && !tagsMatch) {
          return false;
        }
      }

      const parseEntryDate = (dateStr: string) => {
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) {
            const parts = dateStr.split(/[-//]/);
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
              }
              if (parts[0].length === 4) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              }
            }
            return null;
          }
          return d;
        } catch {
          return null;
        }
      };

      const entryDateObj = parseEntryDate(entry.date);
      if (entryDateObj) {
        const entryTime = new Date(entryDateObj.getFullYear(), entryDateObj.getMonth(), entryDateObj.getDate()).getTime();

        if (startDateFilter) {
          const start = new Date(startDateFilter);
          if (!isNaN(start.getTime())) {
            const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
            if (entryTime < startTime) return false;
          }
        }

        if (endDateFilter) {
          const end = new Date(endDateFilter);
          if (!isNaN(end.getTime())) {
            const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
            if (entryTime > endTime) return false;
          }
        }
      }

      return true;
    });
  }, [entries, searchKeyword, startDateFilter, endDateFilter]);

  // Floating Action Button Quick Log State
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickActivity, setQuickActivity] = useState('');
  const [quickWeight, setQuickWeight] = useState('');
  const [quickMood, setQuickMood] = useState('');
  const [quickSelectedTags, setQuickSelectedTags] = useState<string[]>([]);

  // AI Symptom Checker states
  const [symptomsInput, setSymptomsInput] = useState('');
  const [isAnalyzingSymptoms, setIsAnalyzingSymptoms] = useState(false);
  const [symptomsResult, setSymptomsResult] = useState<{
    ailments: Array<{
      name: string;
      severity: 'Low' | 'Medium' | 'High';
      likelihood: 'Common' | 'Possible' | 'Rare';
      description: string;
    }>;
    reliefTips: string[];
    urgency: 'Urgent Care Required' | 'Monitor Closely' | 'Routine Vet Visit Recommended';
    disclaimer: string;
  } | null>(null);

  const [symptomHistory, setSymptomHistory] = useState<Array<{
    id: string;
    date: string;
    petName: string;
    symptoms: string;
    result: {
      ailments: Array<{
        name: string;
        severity: 'Low' | 'Medium' | 'High';
        likelihood: 'Common' | 'Possible' | 'Rare';
        description: string;
      }>;
      reliefTips: string[];
      urgency: 'Urgent Care Required' | 'Monitor Closely' | 'Routine Vet Visit Recommended';
      disclaimer: string;
    }
  }>>(() => {
    try {
      const saved = localStorage.getItem('pet_symptom_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pet_symptom_history', JSON.stringify(symptomHistory));
  }, [symptomHistory]);
  
  // Medication Schedule states
  const [medications, setMedications] = useState<MedicationSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('pet_medication_schedule');
      if (saved) return JSON.parse(saved);
      
      // Default medication items
      return [
        {
          id: 'med-1',
          petId: '1',
          name: t('Dewormer Tablet', '体内驱虫药'),
          dosage: t('1 tablet', '1 片'),
          timeOfDay: 'Morning',
          startDate: new Date().toLocaleDateString(),
          active: true,
          logs: {}
        },
        {
          id: 'med-2',
          petId: '1',
          name: t('Multivitamin Solution', '宠物多维素'),
          dosage: '5 ml',
          timeOfDay: 'Evening',
          startDate: new Date().toLocaleDateString(),
          active: true,
          logs: {}
        }
      ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pet_medication_schedule', JSON.stringify(medications));
  }, [medications]);

  // Form states for new medication
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('Morning'); // Morning, Afternoon, Evening, Night

  // Form States
  const [activity, setActivity] = useState('');
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Celebration Modals
  const [celebrateLevel, setCelebrateLevel] = useState<LevelInfo | null>(null);
  const [celebrateBadge, setCelebrateBadge] = useState<Badge | null>(null);

  // Photo Attachment and Camera States
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<string | null>(null);
  
  // Undo snackbar notification
  const [undoSnackbar, setUndoSnackbar] = useState<{ visible: boolean; entry: HealthJournalEntry; index: number } | null>(null);

  // AI Insights States
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightResult, setAiInsightResult] = useState<{
    summary: string;
    trends: string[];
    recommendations: string[];
    isFallback?: boolean;
  } | null>(null);
  const [aiInsightError, setAiInsightError] = useState<string | null>(null);

  // AI Behavior Analysis States
  const [isAnalyzingBehavior, setIsAnalyzingBehavior] = useState(false);
  const [behaviorAnalysisResult, setBehaviorAnalysisResult] = useState<{
    postureInterpretation: string;
    emotionalState: string;
    triggers: string[];
    tips: string[];
    disclaimer: string;
  } | null>(null);
  const [behaviorAnalysisError, setBehaviorAnalysisError] = useState<string | null>(null);

  const handleAnalyzeBehavior = async () => {
    if (!formPhoto) return;
    setIsAnalyzingBehavior(true);
    setBehaviorAnalysisError(null);
    setBehaviorAnalysisResult(null);
    try {
      const pet = getPetInfo('1');
      const petSpecies = pet ? pet.species : 'Dog';
      
      const res = await fetch('/api/analyze-behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: formPhoto,
          species: petSpecies
        })
      });
      if (!res.ok) {
        throw new Error('Analysis returned a bad status code');
      }
      const data = await res.json();
      setBehaviorAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setBehaviorAnalysisError(t('Failed to analyze behavioral posture. Try again.', '无法分析行为姿态。请重试。'));
    } finally {
      setIsAnalyzingBehavior(false);
    }
  };

  // AI Vision Analysis States
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false);
  const [visionAnalysisResult, setVisionAnalysisResult] = useState<{
    analysisType: 'symptom' | 'ingredients' | 'general';
    title: string;
    description: string;
    suggestedSymptoms?: string[];
    alertIngredients?: string[];
    vetAdvice?: string;
  } | null>(null);
  const [visionAnalysisError, setVisionAnalysisError] = useState<string | null>(null);

  const handleAnalyzeVision = async () => {
    if (!formPhoto) return;
    setIsAnalyzingVision(true);
    setVisionAnalysisError(null);
    setVisionAnalysisResult(null);
    try {
      const pet = getPetInfo('1');
      const petSpecies = pet ? pet.species : 'Dog';
      
      const res = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: formPhoto,
          species: petSpecies
        })
      });
      if (!res.ok) {
        throw new Error('Vision analysis returned a bad status code');
      }
      const data = await res.json();
      setVisionAnalysisResult(data);
    } catch (err: any) {
      console.error(err);
      setVisionAnalysisError(t('Failed to perform AI vision analysis. Try again.', '无法执行AI多模态视觉分析。请重试。'));
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (undoSnackbar && undoSnackbar.visible) {
      const timer = setTimeout(() => {
        setUndoSnackbar(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [undoSnackbar]);

  const getRecent7DaysEntries = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= sevenDaysAgo && entryDate <= today;
    });
  };

  const handleGenerateAIInsights = async () => {
    setAiInsightLoading(true);
    setAiInsightError(null);
    setAiInsightResult(null);
    try {
      const recentEntries = getRecent7DaysEntries();
      const entriesToAnalyze = recentEntries.length > 0 ? recentEntries : entries.slice(0, 10);
      
      if (entriesToAnalyze.length === 0) {
        throw new Error(t(
          'No journal entries found. Please add some logs first before generating insights.',
          '未找到日志记录。请先添加一些健康日志，然后再生成 AI 洞察分析。'
        ));
      }
      
      const pet = getPetInfo('1');
      const petName = pet ? pet.name : t('My Pet', '我的宠物');

      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: entriesToAnalyze.map(e => ({
            date: e.date,
            activity: e.activity,
            weight: e.weight,
            mood: e.mood,
            moodTags: e.moodTags
          })),
          petName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights from the server.');
      }

      const data = await response.json();
      setAiInsightResult(data);
    } catch (err: any) {
      console.error(err);
      setAiInsightError(err.message || t('An error occurred while generating insights.', '生成洞察分析时发生错误。'));
    } finally {
      setAiInsightLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      // Short delay to ensure ref is bound
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(t('Could not access camera. Please upload an image instead.', '无法访问相机。请直接上传图片。'));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const undoDelete = () => {
    if (!undoSnackbar) return;
    const restored = [...entries];
    restored.splice(undoSnackbar.index, 0, undoSnackbar.entry);
    setEntries(restored);
    localStorage.setItem('pet_health_journal_entries', JSON.stringify(restored));
    playSynthesizedChime('log');
    setUndoSnackbar(null);
  };

  // Dynamic Level & XP calculations based on journal entries
  const { totalXp, currentLevel, nextLevel, progressPercent } = useMemo(() => {
    // 50 base XP per entry, +10 XP bonus for including weight, +10 XP bonus for including mood, +10 XP bonus for mood tags, +15 XP for photo
    const calculatedXp = entries.reduce((acc, entry) => {
      let xp = 50;
      if (entry.weight && entry.weight > 0) xp += 10;
      if (entry.mood && entry.mood.trim()) xp += 10;
      if (entry.moodTags && entry.moodTags.length > 0) xp += 10;
      if (entry.photo) xp += 15;
      return acc + xp;
    }, 0);

    // Find current level profile
    let activeLevel = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (calculatedXp >= LEVELS[i].minXp) {
        activeLevel = LEVELS[i];
        break;
      }
    }

    const nLvl = LEVELS.find(l => l.level === activeLevel.level + 1) || null;
    let percent = 100;
    if (nLvl) {
      const range = nLvl.minXp - activeLevel.minXp;
      const progressInRange = calculatedXp - activeLevel.minXp;
      percent = Math.min((progressInRange / range) * 100, 100);
    }

    return {
      totalXp: calculatedXp,
      currentLevel: activeLevel,
      nextLevel: nLvl,
      progressPercent: percent
    };
  }, [entries]);

  // Compute unlocked status list
  const unlockedBadges = useMemo(() => {
    return BADGES.filter(b => b.check(entries));
  }, [entries]);

  // Tag frequencies computation for mood pattern summary
  const tagFrequencies = useMemo(() => {
    const freqs: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.moodTags) {
        entry.moodTags.forEach(tag => {
          freqs[tag] = (freqs[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(freqs).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  // Mood frequencies computation for mood pattern summary
  const moodFrequencies = useMemo(() => {
    const freqs: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        const m = entry.mood.trim();
        if (m) freqs[m] = (freqs[m] || 0) + 1;
      }
    });
    return Object.entries(freqs).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const addEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activity.trim()) return;

    const parsedWeight = parseFloat(weight);
    const newEntry: HealthJournalEntry = {
      id: Date.now().toString(),
      petId: '1', // Mock pet id
      date: new Date().toLocaleDateString(),
      activity: activity.trim(),
      weight: !isNaN(parsedWeight) ? parsedWeight : 0,
      mood: mood.trim(),
      moodTags: selectedTags,
      photo: formPhoto || undefined
    };

    const updatedEntries = [newEntry, ...entries]; // newest on top

    // Pre-calculate to detect leveling up
    const prevXp = totalXp;
    const nextXp = prevXp + 50 + (newEntry.weight > 0 ? 10 : 0) + (newEntry.mood ? 10 : 0) + (newEntry.moodTags && newEntry.moodTags.length > 0 ? 10 : 0) + (newEntry.photo ? 15 : 0);

    let prevLevelInfo = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (prevXp >= LEVELS[i].minXp) {
        prevLevelInfo = LEVELS[i];
        break;
      }
    }

    let nextLevelInfo = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (nextXp >= LEVELS[i].minXp) {
        nextLevelInfo = LEVELS[i];
        break;
      }
    }

    // Pre-calculate to detect newly unlocked achievements
    const prevUnlockedCount = BADGES.filter(b => b.check(entries)).length;
    const nextUnlockedBadges = BADGES.filter(b => b.check(updatedEntries));
    const newlyUnlocked = nextUnlockedBadges.filter(b => !BADGES.filter(ob => ob.check(entries)).some(ob => ob.id === b.id));

    // Save
    setEntries(updatedEntries);
    localStorage.setItem('pet_health_journal_entries', JSON.stringify(updatedEntries));

    // Trigger feedback and animations
    if (nextLevelInfo.level > prevLevelInfo.level) {
      playSynthesizedChime('levelUp');
      setCelebrateLevel(nextLevelInfo);
    } else if (newlyUnlocked.length > 0) {
      playSynthesizedChime('badge');
      setCelebrateBadge(newlyUnlocked[0]);
    } else {
      playSynthesizedChime('log');
    }

    // Reset Form
    setActivity('');
    setWeight('');
    setMood('');
    setSelectedTags([]);
    setCustomTagInput('');
    setFormPhoto(null);
    setBehaviorAnalysisResult(null);
    setBehaviorAnalysisError(null);
  };

  const deleteEntry = (id: string) => {
    const originalIndex = entries.findIndex(e => e.id === id);
    if (originalIndex === -1) return;
    const deletedEntry = entries[originalIndex];

    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('pet_health_journal_entries', JSON.stringify(updated));
    playSynthesizedChime('log');

    // Display Undo Snackbar
    setUndoSnackbar({
      visible: true,
      entry: deletedEntry,
      index: originalIndex
    });
  };

  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    const newMed: MedicationSchedule = {
      id: 'med-' + Date.now().toString(),
      petId: '1',
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      timeOfDay: newMedTime,
      startDate: new Date().toLocaleDateString(),
      active: true,
      logs: {}
    };

    setMedications([...medications, newMed]);
    setNewMedName('');
    setNewMedDosage('');
    playSynthesizedChime('log');
  };

  const deleteMedication = (id: string) => {
    const updated = medications.filter(m => m.id !== id);
    setMedications(updated);
    playSynthesizedChime('log');
  };

  const toggleMedicationStatus = (id: string, date: string, status: 'taken' | 'missed' | 'pending') => {
    const updated = medications.map(m => {
      if (m.id === id) {
        return {
          ...m,
          logs: {
            ...m.logs,
            [date]: status
          }
        };
      }
      return m;
    });
    setMedications(updated);
    playSynthesizedChime('log');
  };

  const analyzeSymptoms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomsInput.trim() || isAnalyzingSymptoms) return;

    setIsAnalyzingSymptoms(true);
    setSymptomsResult(null);

    const pet = getPetInfo('1');
    const petName = pet ? pet.name : 'Buddy';
    const petSpecies = pet ? pet.species : 'Dog';
    const petBreed = pet ? pet.breed : 'Golden Retriever';
    const petAge = pet ? pet.age : 'Puppy';

    try {
      const response = await fetch('/api/check-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: petSpecies,
          breed: petBreed,
          age: petAge,
          symptoms: symptomsInput.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Symptom analysis network request failed');
      }

      const data = await response.json();
      setSymptomsResult(data);

      const newHistoryItem = {
        id: 'sym-' + Date.now().toString(),
        date: new Date().toLocaleString(),
        petName,
        symptoms: symptomsInput.trim(),
        result: data
      };

      setSymptomHistory(prev => [newHistoryItem, ...prev]);
      playSynthesizedChime('log');
    } catch (error) {
      console.error('Error checking symptoms:', error);
    } finally {
      setIsAnalyzingSymptoms(false);
    }
  };

  const deleteSymptomRecord = (id: string) => {
    setSymptomHistory(prev => prev.filter(item => item.id !== id));
    playSynthesizedChime('log');
  };

  const handleQuickLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickActivity.trim()) return;

    const parsedWeight = parseFloat(quickWeight);
    const newEntry: HealthJournalEntry = {
      id: Date.now().toString(),
      petId: '1',
      date: new Date().toLocaleDateString(),
      activity: quickActivity.trim(),
      weight: !isNaN(parsedWeight) ? parsedWeight : 0,
      mood: quickMood.trim(),
      moodTags: quickSelectedTags
    };

    const updatedEntries = [newEntry, ...entries];

    // Pre-calculate level/xp and badges for rewards
    const prevXp = totalXp;
    const nextXp = prevXp + 50 + (newEntry.weight > 0 ? 10 : 0) + (newEntry.mood ? 10 : 0) + (newEntry.moodTags && newEntry.moodTags.length > 0 ? 10 : 0);

    let prevLevelInfo = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (prevXp >= LEVELS[i].minXp) {
        prevLevelInfo = LEVELS[i];
        break;
      }
    }

    let nextLevelInfo = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (nextXp >= LEVELS[i].minXp) {
        nextLevelInfo = LEVELS[i];
        break;
      }
    }

    const nextUnlockedBadges = BADGES.filter(b => b.check(updatedEntries));
    const newlyUnlocked = nextUnlockedBadges.filter(b => !BADGES.filter(ob => ob.check(entries)).some(ob => ob.id === b.id));

    // Save state & storage
    setEntries(updatedEntries);
    localStorage.setItem('pet_health_journal_entries', JSON.stringify(updatedEntries));

    // Audio & modal celebration triggers
    if (nextLevelInfo.level > prevLevelInfo.level) {
      playSynthesizedChime('levelUp');
      setCelebrateLevel(nextLevelInfo);
    } else if (newlyUnlocked.length > 0) {
      playSynthesizedChime('badge');
      setCelebrateBadge(newlyUnlocked[0]);
    } else {
      playSynthesizedChime('log');
    }

    // Reset Form & Close popover
    setQuickActivity('');
    setQuickWeight('');
    setQuickMood('');
    setQuickSelectedTags([]);
    setIsQuickLogOpen(false);
  };

  const generatePDF = (entriesToUse: HealthJournalEntry[] = entries, isFiltered = false) => {
    const doc = new jsPDF();
    const pet = getPetInfo('1');
    const petName = pet ? pet.name : t('My Pet', '我的宠物');
    const petSpecies = pet ? t(pet.species, pet.species) : t('Companion', '伴侣宠物');
    const petAge = pet ? t(pet.age, pet.age) : '-';
    const petBreed = pet?.breed ? pet.breed : '-';

    // Set high-end styling colors
    const primaryColor = '#e11d48'; // rose-600
    const darkStone = '#1c1917'; // stone-900
    const lightStone = '#78716c'; // stone-500
    const accentPurple = '#8b5cf6'; // purple-500

    // Main Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text('🐾 ' + t('PET COMPANION', '宠物家园'), 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(lightStone);
    doc.text(isFiltered ? t('VET VISIT - FILTERED HEALTH JOURNAL REPORT', '兽医就诊-筛选后宠物健康日志报告') : t('WELLNESS & HEALTH CLINICAL REPORT', '宠物管理与临床指标分析报告'), 14, 26);

    // Draw horizontal separator
    doc.setDrawColor(226, 226, 226);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    // Metadata Grid (2-column key-value list)
    doc.setFontSize(11);
    doc.setTextColor(darkStone);
    
    // Left column metadata
    doc.setFont('helvetica', 'bold');
    doc.text(t('Pet Name:', '宠物名称:'), 14, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(petName, 42, 38);

    doc.setFont('helvetica', 'bold');
    doc.text(t('Species/Type:', '物种类别:'), 14, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(petSpecies + (petBreed !== '-' ? ` (${petBreed})` : ''), 42, 44);

    doc.setFont('helvetica', 'bold');
    doc.text(t('Age Category:', '年龄阶段:'), 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(petAge, 42, 50);

    // Right column metadata
    doc.setFont('helvetica', 'bold');
    doc.text(t('Academy Level:', '守护者等级:'), 110, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(`Level ${currentLevel.level} - ${t(currentLevel.title, currentLevel.title)}`, 146, 38);

    doc.setFont('helvetica', 'bold');
    doc.text(t('Report Date:', '报告导出时间:'), 110, 44);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleString(), 146, 44);

    doc.setFont('helvetica', 'bold');
    doc.text(t('Document ID:', '报告流水单号:'), 110, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`PCP-REPORT-${Date.now().toString().slice(-6)}`, 146, 50);

    doc.line(14, 54, 196, 54);

    // Insights section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(accentPurple);
    doc.text(isFiltered ? t('🛡️ Vet Visit Diagnostic Summary', '🛡️ 兽医就诊行为表现与异常指标洞察') : t('🛡️ Clinical Wellness Insights', '🛡️ 宠物健康成长与日常表现洞察报告'), 14, 62);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(darkStone);

    // Compute tag frequencies local to entriesToUse
    const localFreqs: Record<string, number> = {};
    entriesToUse.forEach(entry => {
      if (entry.moodTags) {
        entry.moodTags.forEach(tag => {
          localFreqs[tag] = (localFreqs[tag] || 0) + 1;
        });
      }
    });
    const localTagFrequencies = Object.entries(localFreqs).sort((a, b) => b[1] - a[1]);
    const topTag = localTagFrequencies[0]?.[0];

    // Construct insight statement
    let insightText = '';
    if (topTag) {
      const tagClean = topTag.replace('#', '');
      insightText = t(
        `Wellness Status: Your pet displays a primary behavior characteristic of #${tagClean}. This indicates high emotional stability and active engagement in their care routine. `,
        `健康状态评估：该宠物近期主要情绪与行为标签为 ${topTag}。这表明宠物生理状况、心理稳定度以及日常饮食睡眠都处于优良状态。`
      );
    } else {
      insightText = t(
        'Wellness Status: Balanced behavior pattern logged. Regular logging of clinical indicators (weight, mood, and behaviors) is recommended for high-resolution vet assessment.',
        '健康状态评估：当前宠物行为记录状态平衡。建议坚持定期记录体重、情绪指数和日常习惯，以便宠物医生进行精准评估。'
      );
    }

    if (entriesToUse.some(e => e.weight > 0)) {
      const weights = entriesToUse.filter(e => e.weight > 0).map(e => e.weight);
      const minWeight = Math.min(...weights);
      const maxWeight = Math.max(...weights);
      const avgWeight = (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1);
      insightText += t(
        `Biometric Data: Over the logging period, weight ranged between ${minWeight} kg and ${maxWeight} kg, with an average weight of ${avgWeight} kg. Maintain current nutritional guidelines.`,
        ` 生理测量学指标：在记录周期内，宠物的体重在 ${minWeight} kg 至 ${maxWeight} kg 之间波动，平均体重为 ${avgWeight} kg。建议按照当前饮食量继续科学喂养。`
      );
    }

    if (isFiltered) {
      insightText += ' ' + t(
        'This summary report lists the filtered log entries relevant to recent symptoms and health activities, serving as clinical history reference for veterinarian visits.',
        '此摘要报告列出了与近期异常症状及健康行为相关的筛选后日志记录，用于在兽医就诊时作为临床病史参考。'
      );
    }

    const splitInsight = doc.splitTextToSize(insightText, 180);
    doc.text(splitInsight, 14, 68);

    const insightY = 68 + (splitInsight.length * 5) + 4;
    doc.line(14, insightY, 196, insightY);

    // Historic log table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(primaryColor);
    doc.text(isFiltered ? t('📋 Vet Reference Clinical Chronology', '📋 兽医参考：临床异常与行为症状编年表') : t('📋 Detailed Wellness Chronology', '📋 历史成长发育与医疗日常行为数据表'), 14, insightY + 8);

    // Health Logs Map
    const tableData = entriesToUse.map(entry => [
      entry.date, 
      entry.activity, 
      entry.weight > 0 ? `${entry.weight} kg` : '-', 
      entry.mood ? t(entry.mood, entry.mood) : '-',
      entry.moodTags ? entry.moodTags.join(', ') : '-'
    ]);

    autoTable(doc, {
      startY: insightY + 12,
      head: [[
        t('Date', '记录日期'), 
        t('Activity / Indicator', '日志描述与护理行为'), 
        t('Weight', '体重'), 
        t('Mood', '宠物情绪'), 
        t('Tags', '行为标签')
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [225, 29, 72], // Rose-600
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 70 },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 26, halign: 'center' },
        4: { cellWidth: 38 }
      },
      didDrawPage: (data) => {
        // Footer message on each page
        const str = t(
          'Pet Companion Platform - Wellness Academy Report. Present this report to your veterinarian for diagnosis assistance.',
          '宠物管理中心 报告书。请妥善保存，并在就诊时向兽医师提供作为参考诊断数据。'
        );
        doc.setFontSize(8);
        doc.setTextColor(lightStone);
        doc.setFont('helvetica', 'normal');
        doc.text(str, 14, 287);
        doc.text(`Page ${data.pageNumber}`, 180, 287);
      }
    });

    const fileSuffix = isFiltered ? 'vet_visit_summary' : 'health_report';
    doc.save(`${petName.replace(/\s+/g, '_')}_${fileSuffix}.pdf`);
  };

  // Helper to render badge icons
  const renderBadgeIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Award': return <Award className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Scale': return <Scale className={className} />;
      case 'Heart': return <Heart className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // Activity Suggestions
  const suggestions = [
    { label: 'Vet Visit 🏥', val: 'Veterinary Checkup' },
    { label: 'Vaccination 💉', val: 'Regular Vaccination' },
    { label: 'Medication 💊', val: 'Gave medication' },
    { label: 'Weight Check ⚖️', val: 'Routine weight measurement' },
    { label: 'Daily Walk 🦮', val: 'Long morning walk' },
    { label: 'Grooming ✂️', val: 'Nail clipping & bath' }
  ];

  // Mood Suggestions
  const moodSuggestions = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '🤪', label: 'Playful' },
    { emoji: '😴', label: 'Sleepy' },
    { emoji: '🤒', label: 'Sick' },
    { emoji: 'Anxious', label: 'Anxious' }
  ];

  return (
    <>
      {/* 1. Sidebar Compact Component */}
      <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-950 dark:text-stone-50 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-rose-500 animate-pulse" /> {t('Wellness Journal', '健康日志')}
          </h3>
          <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
            {t('Academy', '学院')}
          </span>
        </div>

        {/* Level Up Stats Display */}
        <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-900/40 dark:to-stone-900/90 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">{currentLevel.icon}</span>
              <div>
                <p className="text-xs font-black text-stone-900 dark:text-white leading-tight">
                  Lv.{currentLevel.level} {currentLevel.title === 'Novice Companion' ? t('Novice Companion', '新手伙伴') : currentLevel.title === 'Caring Guardian' ? t('Caring Guardian', '呵护守护者') : currentLevel.title === 'Wellness Advocate' ? t('Wellness Advocate', '健康倡导者') : currentLevel.title === 'Health Specialist' ? t('Health Specialist', '健康专家') : t('Elite Pet Parent', '精英宠主')}
                </p>
                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">{t('Current Ranking', '当前等级')}</p>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-stone-600 dark:text-stone-300">
              {totalXp} XP
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 h-full transition-all duration-700 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {nextLevel ? (
              <div className="flex justify-between text-[9px] text-stone-400 font-bold">
                <span>{currentLevel.minXp} XP</span>
                <span>{nextLevel.minXp - totalXp} {t('XP to Lv.', 'XP 升级至 Lv.')}{nextLevel.level}</span>
                <span>{nextLevel.minXp} XP</span>
              </div>
            ) : (
              <p className="text-[9px] text-amber-500 font-bold text-center">🏆 {t('MAX LEVEL ACHIEVED', '🏆 已达最高等级')}</p>
            )}
          </div>
        </div>

        {/* Badge preview showcase */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Achievements', '成就')} ({unlockedBadges.length}/{BADGES.length})</p>
          <div className="flex items-center gap-2">
            {BADGES.map((badge) => {
              const isUnlocked = badge.check(entries);
              return (
                <div 
                  key={badge.id}
                  title={`${badge.name}: ${badge.requirement}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    isUnlocked 
                      ? `${badge.bgColor} ${badge.borderColor} ${badge.color} scale-105 shadow-sm` 
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-300 dark:text-stone-700'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, 'w-4 h-4')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setModalTab('log');
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1 py-2 px-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> {t('Log Daily', '每日记录')}
          </button>
          <button
            onClick={() => {
              setModalTab('badges');
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1 py-2 px-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-bold text-xs rounded-xl transition-all active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> {t('Academy', '学院')}
          </button>
        </div>

        {/* Quick display of latest journal entry */}
        {entries.length > 0 && (
          <div className="border-t border-stone-100 dark:border-stone-800 pt-3 flex items-start gap-2 text-left">
            <Calendar className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-stone-400 font-bold leading-none mb-1">{t('LATEST ENTRY', '最新日志')} • {entries[0].date}</p>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">{entries[0].activity}</p>
              <p className="text-[10px] text-stone-500">
                {entries[0].weight > 0 ? `${entries[0].weight}kg` : t('No weight', '未记录体重')} {entries[0].mood && `• ${t('Mood:', '心情:')} ${entries[0].mood}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Expanded Academy & Log Dashboard Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-100 dark:border-stone-800 w-full max-w-4xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-6 text-white flex items-center justify-between relative">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-300 animate-bounce" />
                    <h2 className="text-2xl font-black tracking-tight">{t('Pet Wellness Academy', '宠物健康学院')}</h2>
                  </div>
                  <p className="text-rose-100 text-xs font-medium mt-1">
                    {t('Log indicators to level up your status, track bio-trends, and unlock high-level guardian medals.', '记录健康指标以提升等级，追踪生物趋势，并解锁高阶守护者勋章。')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={generatePDF}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all outline-none mr-2"
                  title={t('Download PDF', '下载 PDF')}
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Bar */}
              <div className="flex border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20">
                {[
                  { id: 'log', label: t('Log & Health Records', '日志与健康记录'), icon: BookOpen },
                  { id: 'meds', label: t('Medication Schedule', '用药日程'), icon: Clock },
                  { id: 'symptoms', label: t('AI Symptom Checker', 'AI 症状自查'), icon: Stethoscope },
                  { id: 'badges', label: `${t('Achievements', '成就')} (${unlockedBadges.length}/${BADGES.length})`, icon: Award },
                  { id: 'stats', label: t('Academy Bio-Stats', '学院生物数据'), icon: TrendingUp }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = modalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id as any)}
                      className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                        isActive 
                          ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-stone-900' 
                          : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body / Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* TAB 1: LOG & HEALTH RECORDS */}
                {modalTab === 'log' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Log Form Column */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                        <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2">
                          <Plus className="w-4 h-4 text-rose-500" /> {t('New Log Entry', '新建日志')}
                        </h3>
                        
                        <form onSubmit={addEntry} className="space-y-4">
                          {/* Quick Pre-fill Actions */}
                          <div className="space-y-1.5 p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-500/10 dark:border-rose-500/20">
                            <label className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-rose-500 animate-pulse" />
                              {t('⚡ One-Tap Fast Presets', '⚡ 一键快速预设填表')}
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                {
                                  label: t('Happy & Active 💖', '健康快乐 💖'),
                                  color: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                                  action: () => {
                                    setMood('Happy');
                                    setActivity(t('Daily health and mood status check: Energetic and happy!', '每日健康与情绪检查：精力充沛、开心快乐！'));
                                    setSelectedTags(['#playful', '#loving']);
                                  }
                                },
                                {
                                  label: t('Lethargic 😴', '精神萎靡 😴'),
                                  color: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300',
                                  action: () => {
                                    setMood('Sick');
                                    setActivity(t('Noticed low energy, sleeping more, and lethargic behavior', '注意到精力不足，睡眠增加，精神状态有些萎靡'));
                                    setSelectedTags(['#lethargy']);
                                  }
                                },
                                {
                                  label: t('Appetite Normal 🍖', '食欲良好 🍖'),
                                  color: 'border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300',
                                  action: () => {
                                    setMood('Happy');
                                    setActivity(t('Ate full meal with high enthusiasm. Normal digestion.', '饱餐一顿，食欲旺盛，消化良好。'));
                                    setSelectedTags(selectedTags.filter(tag => tag !== '#appetite_loss'));
                                  }
                                },
                                {
                                  label: t('Appetite Loss 🤒', '食欲不振 🤒'),
                                  color: 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300',
                                  action: () => {
                                    setMood('Sick');
                                    setActivity(t('Refusing food or exhibiting appetite loss during meals', '拒绝进食或在用餐时表现出明显的食欲不振'));
                                    setSelectedTags([...new Set([...selectedTags.filter(tag => tag !== '#playful'), '#appetite_loss'])]);
                                  }
                                },
                                {
                                  label: t('Stomach Discomfort 🤮', '胃肠不适 🤮'),
                                  color: 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300',
                                  action: () => {
                                    setMood('Sick');
                                    setActivity(t('Noticed symptoms of digestive discomfort, vomiting, or diarrhea', '发现消化不良、呕吐或腹泻拉稀等肠胃不适症状'));
                                    setSelectedTags([...new Set([...selectedTags.filter(tag => tag !== '#playful'), '#vomiting', '#diarrhea'])]);
                                  }
                                },
                                {
                                  label: t('Cold/Sneeze 🤧', '着凉感冒 🤧'),
                                  color: 'border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300',
                                  action: () => {
                                    setMood('Sick');
                                    setActivity(t('Frequent sneezing, light coughing, or suspected fever symptoms', '频繁打喷嚏、轻微咳嗽或疑似发烧不适症状'));
                                    setSelectedTags([...new Set([...selectedTags.filter(tag => tag !== '#playful'), '#sneezing', '#coughing', '#fever'])]);
                                  }
                                }
                              ].map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={item.action}
                                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 active:scale-95 hover:scale-[1.02] ${item.color}`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Activity Field */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('Activity / Care Log', '活动/护理日志')}</label>
                            <input
                              type="text"
                              required
                              placeholder={t("e.g. Vaccination, Diet checkup...", "例如：接种疫苗、饮食检查...")}
                              value={activity}
                              onChange={(e) => setActivity(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                            />
                            {/* Suggestions */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {suggestions.map((s) => (
                                <button
                                  key={s.label}
                                  type="button"
                                  onClick={() => setActivity(s.val)}
                                  className="text-[10px] font-bold px-2 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-all"
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Weight Field */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                              {t('Weight', '体重')} <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">+10 XP {t('Bonus', '奖励')}</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                placeholder={t("e.g. 12.5", "例如：12.5")}
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full pl-3.5 pr-12 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                              />
                              <span className="absolute right-3.5 top-3 text-xs font-bold text-stone-400">kg</span>
                            </div>
                          </div>

                          {/* Mood Field */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                              {t('Pet Mood', '宠物心情')} <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">+10 XP {t('Bonus', '奖励')}</span>
                            </label>
                            <input
                              type="text"
                              placeholder={t("Describe mood (or click emojis below)...", "描述心情 (或点击下方表情)...")}
                              value={mood}
                              onChange={(e) => setMood(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                            />
                            {/* Mood Shortcuts */}
                            <div className="flex gap-1 pt-1 overflow-x-auto pb-1 scrollbar-none">
                              {moodSuggestions.map((m) => (
                                <button
                                  key={m.label}
                                  type="button"
                                  onClick={() => setMood(m.label)}
                                  className={`text-xs font-bold px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                                    mood === m.label 
                                      ? 'bg-rose-500 border-rose-500 text-white shadow-sm' 
                                      : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                                  }`}
                                >
                                  <span>{m.emoji}</span>
                                  <span>{t(m.label, m.label === 'Happy' ? '开心' : m.label === 'Playful' ? '调皮' : m.label === 'Sleepy' ? '困倦' : m.label === 'Sick' ? '不适' : '焦虑')}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Mood Tags Field */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                              {t('Mood Tags', '心情标签')} <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">+10 XP {t('Bonus', '奖励')}</span>
                            </label>
                            
                            {/* Preset Tags Grid */}
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {['#calm', '#energetic', '#playful', '#tired', '#timid', '#social', '#loving', '#curious', '#excited', '#grumpy'].map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedTags(selectedTags.filter(t => t !== tag));
                                      } else {
                                        setSelectedTags([...selectedTags, tag]);
                                      }
                                    }}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-purple-500 border-purple-500 text-white shadow-sm'
                                        : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                                    }`}
                                  >
                                    <span className="text-xs">{getTagEmoji(tag)}</span>
                                    <span>{tag}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Common Symptoms Picker */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                              {t('Common Symptoms Picker', '异常症状多选')} <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">+10 XP {t('Bonus', '奖励')}</span>
                            </label>
                            
                            {/* Preset Symptom Tags Grid */}
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {[
                                { tag: '#lethargy', label: t('Lethargy 😴', '精神萎靡 😴') },
                                { tag: '#appetite_loss', label: t('Appetite Loss 🍖', '食欲不振 🍖') },
                                { tag: '#vomiting', label: t('Vomiting 🤮', '呕吐 🤮') },
                                { tag: '#coughing', label: t('Coughing 🗣️', '咳嗽 🗣️') },
                                { tag: '#fever', label: t('Fever 🤒', '发烧 🤒') },
                                { tag: '#itching', label: t('Itching 🐾', '皮肤瘙痒 🐾') },
                                { tag: '#sneezing', label: t('Sneezing 🤧', '打喷嚏 🤧') },
                                { tag: '#diarrhea', label: t('Diarrhea 💩', '腹泻拉稀 💩') }
                              ].map((item) => {
                                const isSelected = selectedTags.includes(item.tag);
                                return (
                                  <button
                                    key={item.tag}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedTags(selectedTags.filter(t => t !== item.tag));
                                      } else {
                                        setSelectedTags([...selectedTags, item.tag]);
                                      }
                                    }}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                                        : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                                    }`}
                                  >
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Custom Tag Input */}
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder={t("Add custom tag (e.g. #snuggly)...", "添加自定义标签 (例如：#撒娇)...")}
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const tag = customTagInput.trim();
                                    if (tag) {
                                      const formatted = tag.startsWith('#') ? tag : `#${tag}`;
                                      if (!selectedTags.includes(formatted)) {
                                        setSelectedTags([...selectedTags, formatted]);
                                      }
                                      setCustomTagInput('');
                                    }
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const tag = customTagInput.trim();
                                  if (tag) {
                                    const formatted = tag.startsWith('#') ? tag : `#${tag}`;
                                    if (!selectedTags.includes(formatted)) {
                                      setSelectedTags([...selectedTags, formatted]);
                                    }
                                    setCustomTagInput('');
                                  }
                                }}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all"
                              >
                                {t('Add', '添加')}
                              </button>
                            </div>

                            {/* Active Custom/Selected Tags List */}
                            {selectedTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[10px] font-bold text-stone-400 self-center mr-1">{t('Selected:', '已选:')}</span>
                                {selectedTags.map(tag => (
                                  <span 
                                    key={tag} 
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-full"
                                  >
                                    <span>{getTagEmoji(tag)}</span>
                                    <span>{tag}</span>
                                    <button 
                                      type="button" 
                                      onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                      className="text-purple-400 hover:text-purple-600 focus:outline-none font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Photo & Camera Attachment Section */}
                          <div className="space-y-2 p-3 bg-stone-50/50 dark:bg-stone-900/20 rounded-xl border border-stone-200/40 dark:border-stone-800/40">
                            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-rose-500" />
                              {t('Attach Entry Photo', '附带日志照片')} <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">+15 XP {t('Bonus', '奖励')}</span>
                            </label>

                            {isCameraActive ? (
                              <div className="space-y-2">
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-stone-200 dark:border-stone-800 flex items-center justify-center">
                                  <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-[9px] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {t('Live Feed', '实时画面')}
                                  </div>
                                </div>
                                
                                {cameraError && (
                                  <p className="text-[11px] text-rose-500 font-bold text-center">
                                    {cameraError}
                                  </p>
                                )}

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                                  >
                                    <Camera className="w-3.5 h-3.5" />
                                    {t('Snap Photo', '拍照')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-lg transition-all"
                                  >
                                    {t('Cancel', '取消')}
                                  </button>
                                </div>
                              </div>
                            ) : formPhoto ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 bg-white dark:bg-stone-900 p-2 rounded-lg border border-stone-150 dark:border-stone-800">
                                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-100 dark:border-stone-800 flex-shrink-0">
                                    <img src={formPhoto} alt="Attached" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormPhoto(null);
                                        setBehaviorAnalysisResult(null);
                                        setBehaviorAnalysisError(null);
                                        setVisionAnalysisResult(null);
                                        setVisionAnalysisError(null);
                                      }}
                                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-all hover:scale-110 active:scale-90"
                                      title={t('Remove Photo', '删除照片')}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-stone-700 dark:text-stone-200 truncate">{t('Photo attached successfully!', '照片已成功附带！')}</p>
                                    <p className="text-[10px] text-stone-400 font-bold">{t('Will be saved with your journal entry', '将与您的日志一同保存')}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormPhoto(null);
                                      setBehaviorAnalysisResult(null);
                                      setBehaviorAnalysisError(null);
                                      setVisionAnalysisResult(null);
                                      setVisionAnalysisError(null);
                                    }}
                                    className="text-[10px] font-bold text-rose-500 hover:underline px-2"
                                  >
                                    {t('Remove', '移除')}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={handleAnalyzeBehavior}
                                    disabled={isAnalyzingBehavior || isAnalyzingVision}
                                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-70 text-white text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    {isAnalyzingBehavior ? t('Analyzing Posture...', '行为分析中...') : t('Analyze Behavior (AI)', 'AI 行为姿态分析')}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleAnalyzeVision}
                                    disabled={isAnalyzingBehavior || isAnalyzingVision}
                                    className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-70 text-white text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                    {isAnalyzingVision ? t('Analyzing Vision...', '视觉筛查中...') : t('Vision Health AI', 'AI 视觉病症/饲料筛查')}
                                  </button>
                                </div>

                                {visionAnalysisError && (
                                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-[10px] text-rose-500 font-extrabold rounded-lg border border-rose-100 dark:border-rose-900/40 flex items-center gap-1.5 animate-fade-in">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{visionAnalysisError}</span>
                                  </div>
                                )}

                                {visionAnalysisResult && (
                                  <div className="p-4 bg-stone-100/50 dark:bg-stone-850 border border-teal-100 dark:border-teal-900/30 rounded-xl space-y-3 text-left animate-fade-in">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                                        {visionAnalysisResult.analysisType === 'symptom' ? t('AI Clinical Symptom Analyzer', 'AI 临床体征筛查') : 
                                         visionAnalysisResult.analysisType === 'ingredients' ? t('AI Ingredient Label Analysis', 'AI 配料成分翻译与分析') : 
                                         t('AI Multimodal Vision Assistant', 'AI 视觉多模态分析')}
                                      </span>
                                      <span className="text-[10px] font-black bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                                        ✨ {visionAnalysisResult.title}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Detailed Analysis Summary:', '详细分析报告:')}</p>
                                      <p className="text-xs text-stone-700 dark:text-stone-200 font-semibold leading-relaxed whitespace-pre-line">
                                        {visionAnalysisResult.description}
                                      </p>
                                    </div>

                                    {visionAnalysisResult.alertIngredients && visionAnalysisResult.alertIngredients.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                                          {visionAnalysisResult.analysisType === 'ingredients' ? t('Potential Allergens / Bad Additives:', '可能致敏成分/风险添加剂:') : t('Abnormal Clinical Metrics:', '异常生理指标与体征:')}
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {visionAnalysisResult.alertIngredients.map((item, index) => (
                                            <span key={index} className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-150 dark:border-rose-900/30">
                                              ⚠ {item}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {visionAnalysisResult.vetAdvice && (
                                      <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/20 rounded-lg space-y-1">
                                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{t('Vet Care Guidelines:', '兽医居家关怀指南:')}</p>
                                        <p className="text-xs text-teal-700 dark:text-teal-300 font-medium leading-relaxed">
                                          {visionAnalysisResult.vetAdvice}
                                        </p>
                                      </div>
                                    )}

                                    {visionAnalysisResult.suggestedSymptoms && visionAnalysisResult.suggestedSymptoms.length > 0 && (
                                      <div className="space-y-2 pt-2 border-t border-stone-200/50 dark:border-stone-700/50">
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Interactive Autofill Tags (Click to insert):', '可交互智能填充标签 (点击直接录入日志):')}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {visionAnalysisResult.suggestedSymptoms.map((symptom, index) => (
                                            <button
                                              type="button"
                                              key={index}
                                              onClick={() => {
                                                setActivity(prev => {
                                                  if (!prev) return symptom;
                                                  if (prev.includes(symptom)) return prev;
                                                  return `${prev}，${symptom}`;
                                                });
                                              }}
                                              className="text-[10px] font-bold bg-stone-100 hover:bg-teal-50 dark:bg-stone-800 dark:hover:bg-teal-950/40 text-stone-600 hover:text-teal-600 dark:text-stone-300 dark:hover:text-teal-400 px-2.5 py-1 rounded-full border border-stone-200 hover:border-teal-300 dark:border-stone-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>+</span> {symptom}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {behaviorAnalysisError && (
                                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-[10px] text-rose-500 font-extrabold rounded-lg border border-rose-100 dark:border-rose-900/40 flex items-center gap-1.5 animate-fade-in">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{behaviorAnalysisError}</span>
                                  </div>
                                )}

                                {behaviorAnalysisResult && (
                                  <div className="p-4 bg-stone-100/50 dark:bg-stone-850 border border-purple-100 dark:border-purple-900/30 rounded-xl space-y-3 text-left animate-fade-in">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">{t('AI Behavioral Ethology', 'AI 行为学与情绪分析')}</span>
                                      <span className="text-[10px] font-black bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                        ✨ {behaviorAnalysisResult.emotionalState}
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Posture Interpretation:', '姿态与动作释义:')}</p>
                                      <p className="text-xs text-stone-700 dark:text-stone-200 font-semibold leading-relaxed">
                                        {behaviorAnalysisResult.postureInterpretation}
                                      </p>
                                    </div>

                                    {behaviorAnalysisResult.triggers && behaviorAnalysisResult.triggers.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Common Triggers & Context:', '常见触发场景与环境:')}</p>
                                        <ul className="list-disc pl-4 space-y-0.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                                          {behaviorAnalysisResult.triggers.map((trig, index) => (
                                            <li key={index}>{trig}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {behaviorAnalysisResult.tips && behaviorAnalysisResult.tips.length > 0 && (
                                      <div className="space-y-1">
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Recommended Bonding Tips:', '推荐互动/训练方案:')}</p>
                                        <ul className="list-disc pl-4 space-y-0.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                                          {behaviorAnalysisResult.tips.map((tip, index) => (
                                            <li key={index}>{tip}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActivity(prev => {
                                            const addedText = `[AI Posture Analysis: ${behaviorAnalysisResult.emotionalState}] ${behaviorAnalysisResult.postureInterpretation}`;
                                            return prev ? `${prev}\n\n${addedText}` : addedText;
                                          });
                                          const lResult = behaviorAnalysisResult.emotionalState.toLowerCase();
                                          const newTags = [...selectedTags];
                                          if (lResult.includes('playful') || lResult.includes('play bow') || lResult.includes('游戏') || lResult.includes('调皮')) {
                                            if (!newTags.includes('#playful')) newTags.push('#playful');
                                          }
                                          if (lResult.includes('calm') || lResult.includes('relaxed') || lResult.includes('安详') || lResult.includes('放鬆')) {
                                            if (!newTags.includes('#calm')) newTags.push('#calm');
                                          }
                                          if (lResult.includes('alert') || lResult.includes('curious') || lResult.includes('好奇') || lResult.includes('警惕')) {
                                            if (!newTags.includes('#curious')) newTags.push('#curious');
                                          }
                                          setSelectedTags(newTags);
                                        }}
                                        className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        {t('Apply to Journal Log', '将分析同步填入日志')}
                                      </button>
                                    </div>

                                    <p className="text-[9px] text-stone-400 dark:text-stone-500 font-bold leading-normal pt-1 bg-stone-50 dark:bg-stone-900/50 p-2 rounded border border-stone-250/20 dark:border-stone-800">
                                      ⚠️ {behaviorAnalysisResult.disclaimer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-stone-200/40 dark:border-stone-700/40"
                                >
                                  <Camera className="w-3.5 h-3.5 text-rose-500" />
                                  {t('Use Camera', '使用相机拍照')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('pet-journal-photo-upload')?.click()}
                                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 border border-stone-200/40 dark:border-stone-700/40"
                                >
                                  <Image className="w-3.5 h-3.5 text-rose-500" />
                                  {t('Upload File', '选择本地图片')}
                                </button>
                                <input
                                  type="file"
                                  id="pet-journal-photo-upload"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                              </div>
                            )}
                          </div>

                          {/* Submit Button */}
                          <button
                            type="submit"
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> {t('Add Journal Entry', '添加日志记录')}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* History Column */}
                    <div className="lg:col-span-7 flex flex-col space-y-4">
                      {/* Last 7 Days Analytics Chart */}
                      <div className="bg-stone-50 dark:bg-stone-950/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-rose-500 animate-pulse" />
                              {t('7-Day Wellness Trends', '7日健康状况走势')}
                            </h4>
                            <p className="text-[10px] text-stone-400 font-semibold">{t('Frequency of logged mood states & health symptoms', '每日情绪状态与身体异常指标记录频次')}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-bold">
                            <span className="flex items-center gap-1 text-rose-500">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {t('Moods', '情绪')}
                            </span>
                            <span className="flex items-center gap-1 text-purple-500">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              {t('Symptoms', '异常')}
                            </span>
                          </div>
                        </div>

                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={last7DaysData}
                              margin={{ top: 10, right: 5, left: -32, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-stone-800" />
                              <XAxis 
                                dataKey="label" 
                                tick={{ fontSize: 9, fontWeight: 700, fill: '#888888' }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                tick={{ fontSize: 9, fontWeight: 700, fill: '#888888' }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                              />
                              <Tooltip
                                contentStyle={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                  borderColor: '#e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                              />
                              <Bar dataKey="moodCount" name={t('Mood Entries', '情绪记录')} fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={10} />
                              <Bar dataKey="symptomCount" name={t('Symptoms Logged', '异常异常')} fill="#a855f7" radius={[3, 3, 0, 0]} barSize={10} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* AI Health Insights Section */}
                      <div className="bg-gradient-to-br from-rose-500/5 to-purple-600/5 dark:from-rose-500/10 dark:to-purple-600/10 p-5 rounded-2xl border border-rose-500/10 dark:border-rose-500/20 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                              <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                              {t('AI Health & Wellness Insights', 'AI 健康与护理表现深度洞察')}
                            </h4>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
                              {t('Analyze recent 7-day health logs, weight fluctuations, and mood patterns', '多维度对近期7天饮食健康、情绪状态、异常表现等进行深度诊断分析')}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleGenerateAIInsights}
                            disabled={aiInsightLoading}
                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 disabled:from-stone-300 disabled:to-stone-400 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 hover:scale-[1.02] flex items-center gap-1.5 outline-none"
                          >
                            {aiInsightLoading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t('Analyzing...', '深度分析中...')}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                {t('Generate Insight', '一键生成 AI 洞察报告')}
                              </>
                            )}
                          </button>
                        </div>

                        {aiInsightError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{aiInsightError}</span>
                          </div>
                        )}

                        {aiInsightResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 dark:bg-stone-900/80 backdrop-blur p-4 rounded-xl border border-rose-500/10 dark:border-rose-500/20 space-y-3.5 text-stone-900 dark:text-stone-100"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-wider block">
                                {t('Wellness Summary', '整体状况评估')}
                              </span>
                              <p className="text-xs font-medium leading-relaxed">
                                {aiInsightResult.summary}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-stone-100 dark:border-stone-800">
                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block">
                                  {t('Identified Trends', '近期核心趋势')}
                                </span>
                                <ul className="space-y-1.5">
                                  {aiInsightResult.trends.map((trend, i) => (
                                    <li key={i} className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-start gap-1.5">
                                      <span className="text-rose-500 mt-0.5">•</span>
                                      <span>{trend}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider block">
                                  {t('Recommended Actions', '健康管理与建议')}
                                </span>
                                <ul className="space-y-1.5">
                                  {aiInsightResult.recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs font-semibold text-stone-600 dark:text-stone-300 flex items-start gap-1.5">
                                      <span className="text-emerald-500 mt-0.5">✓</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {aiInsightResult.isFallback && (
                              <div className="text-[9px] text-stone-400 font-bold italic border-t border-stone-100 dark:border-stone-850 pt-2 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5" />
                                {t(
                                  'AI service is currently operating in smart offline mode. Recommendations are generated locally from your entries.',
                                  'AI服务当前以智能离线模式运行。分析推荐基于本地记录和日常行为指标进行评估。'
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col h-full min-h-[300px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2 mb-4">
                          <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-rose-500" /> {t('Historic Logs', '历史日志')} ({filteredEntries.length})
                          </h3>

                          {/* Quick Stats Summary info */}
                          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wide">
                            {entries.length > filteredEntries.length && t(`Showing ${filteredEntries.length} of ${entries.length}`, `已筛选 ${filteredEntries.length} / 共 ${entries.length}`)}
                          </span>
                        </div>

                        {/* Search & Date Range Filters Bar */}
                        <div className="bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800 space-y-2 mb-4">
                          <div className="flex items-center justify-between border-b border-stone-100/60 dark:border-stone-850 pb-1.5">
                            <span className="text-[10px] font-black text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
                              <Search className="w-3 h-3 text-rose-500" />
                              {t('Filter Logs by Keyword & Date', '筛选历史日志')}
                            </span>
                            <div className="flex items-center gap-3">
                              {(searchKeyword || startDateFilter || endDateFilter) && (
                                <button
                                  onClick={() => {
                                    setSearchKeyword('');
                                    setStartDateFilter('');
                                    setEndDateFilter('');
                                  }}
                                  className="text-[10px] text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-200 font-bold hover:underline"
                                >
                                  {t('Reset Filters', '重置')}
                                </button>
                              )}
                              <button
                                onClick={() => generatePDF(filteredEntries, true)}
                                className="text-[10px] text-rose-500 hover:text-rose-600 font-black flex items-center gap-1 bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-0.5 rounded-md transition-all hover:scale-105 active:scale-95 outline-none"
                                title={t('Export filtered entries to PDF for vet visit', '导出筛选日志为PDF以便就医诊断')}
                              >
                                <Download className="w-3 h-3" />
                                {t('Export to PDF', '导出为 PDF')}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            {/* Symptom Keyword Search */}
                            <div className="relative md:col-span-6">
                              <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder={t('Search symptom, activity, tags...', '输入症状/行为/标签筛选...')}
                                className="w-full pl-7 pr-3 py-1 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-1 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                              />
                              <Search className="absolute left-2 top-2 w-3 h-3 text-stone-400" />
                            </div>

                            {/* Date Picker Range */}
                            <div className="flex items-center gap-1 md:col-span-6">
                              <input
                                type="date"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                                className="flex-1 px-1.5 py-1 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white outline-none font-bold"
                                title={t('Start Date', '开始日期')}
                              />
                              <span className="text-[10px] text-stone-400 font-bold">~</span>
                              <input
                                type="date"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                                className="flex-1 px-1.5 py-1 text-xs bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white outline-none font-bold"
                                title={t('End Date', '结束日期')}
                              />
                            </div>
                          </div>
                        </div>

                        {filteredEntries.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                            <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-700 mb-2 animate-pulse" />
                            <p className="font-bold text-stone-600 dark:text-stone-300">
                              {entries.length === 0 
                                ? t('Journal is completely empty', '日志为空')
                                : t('No matching logs found', '未找到匹配的日志')}
                            </p>
                            <p className="text-xs text-stone-400 max-w-xs mt-1 text-center">
                              {entries.length === 0 
                                ? t('Start entering care logs like vaccines or daily weight to gain levels and medals!', '开始输入护理日志（如疫苗或每日体重）以获取等级和勋章！')
                                : t('Try adjusting your search query or loosening date filters.', '请尝试调整搜索关键字或重置日期筛选。')}
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[350px]">
                            <AnimatePresence initial={false}>
                              {filteredEntries.map((entry) => (
                                <motion.div
                                  key={entry.id}
                                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl hover:border-rose-200 dark:hover:border-rose-950 transition-all flex justify-between items-center group relative overflow-hidden text-left"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded">
                                        {entry.date}
                                      </span>
                                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{t('HEALTH RECORD', '健康记录')}</span>
                                    </div>
                                    <h4 className="font-extrabold text-stone-900 dark:text-white text-sm">
                                      {entry.activity}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                      {entry.weight > 0 && (
                                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                                          <Scale className="w-3.5 h-3.5" /> {entry.weight} kg
                                        </span>
                                      )}
                                      {(entry.mood || (entry.moodTags && entry.moodTags.length > 0)) && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {entry.mood && (
                                            <span className="flex items-center gap-1 text-rose-500 font-semibold">
                                              <Smile className="w-3.5 h-3.5" /> {t('Mood:', '心情:')} {entry.mood}
                                            </span>
                                          )}
                                          {entry.moodTags && entry.moodTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {entry.moodTags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded">
                                                  <span>{getTagEmoji(tag)}</span>
                                                  <span>{tag}</span>
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {entry.photo && (
                                      <div 
                                        onClick={() => setSelectedPreviewPhoto(entry.photo!)}
                                        className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-850 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all group/thumb flex items-center justify-center"
                                        title={t('Click to enlarge', '点击查看大图')}
                                      >
                                        <img src={entry.photo} alt="Care Log" className="w-full h-full object-cover absolute inset-0" />
                                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all">
                                          <Eye className="w-4 h-4 text-white drop-shadow" />
                                        </div>
                                      </div>
                                    )}

                                    <button
                                      onClick={() => deleteEntry(entry.id)}
                                      className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all opacity-60 md:opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none animate-none flex-shrink-0"
                                      title={t('Delete Log Entry', '删除日志条目')}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 1.5: MEDICATION SCHEDULE */}
                {modalTab === 'meds' && (
                  <div className="space-y-6">
                    {/* Header Board / Metrics */}
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                          <h3 className="font-extrabold text-stone-950 dark:text-white text-base flex items-center gap-2">
                            <Clock className="w-5 h-5 text-rose-500" />
                            {t("Today's Medication Tracker", '今日用药追踪')}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {t('Log daily doses of scheduled medications as taken or missed to maintain compliance.', '记录今日预定药物的服用或漏服状态，保障爱宠健康用药。')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Metrics cards row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 text-center">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Total Scheduled', '预定总数')}</p>
                          <p className="text-xl font-black text-stone-900 dark:text-white">{medications.length}</p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 text-center">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Taken Today', '今日已服')}</p>
                          <p className="text-xl font-black text-emerald-500">
                            {medications.filter(m => m.logs[new Date().toLocaleDateString()] === 'taken').length}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 text-center">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Missed Today', '今日漏服')}</p>
                          <p className="text-xl font-black text-rose-500">
                            {medications.filter(m => m.logs[new Date().toLocaleDateString()] === 'missed').length}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800 text-center">
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('Compliance Rate', '今日用药率')}</p>
                          <p className="text-xl font-black text-purple-500">
                            {(() => {
                              const todayStr = new Date().toLocaleDateString();
                              const total = medications.length;
                              if (total === 0) return '0%';
                              const taken = medications.filter(m => m.logs[todayStr] === 'taken').length;
                              return `${Math.round((taken / total) * 100)}%`;
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Adherence progress bar */}
                      <div className="mt-4 space-y-1">
                        <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                            style={{
                              width: (() => {
                                const todayStr = new Date().toLocaleDateString();
                                const total = medications.length;
                                if (total === 0) return '0%';
                                const taken = medications.filter(m => m.logs[todayStr] === 'taken').length;
                                return `${Math.round((taken / total) * 100)}%`;
                              })()
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Main Section layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Form Column */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                          <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2">
                            <Plus className="w-4 h-4 text-rose-500" /> {t('Schedule New Medication', '添加新预定用药')}
                          </h3>

                          <form onSubmit={addMedication} className="space-y-4">
                            {/* Medication Name */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('Medication Name', '药物名称')}</label>
                              <input
                                type="text"
                                required
                                placeholder={t("e.g. Probiotics, Dewormer, Ear drops...", "例如：益生菌、体内驱虫药、洗耳液...")}
                                value={newMedName}
                                onChange={(e) => setNewMedName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                              />
                            </div>

                            {/* Dosage */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('Dosage Description', '用药剂量')}</label>
                              <input
                                type="text"
                                required
                                placeholder={t("e.g. 1 pill, 2.5 ml, 2 drops...", "例如：1片、2.5毫升、2滴...")}
                                value={newMedDosage}
                                onChange={(e) => setNewMedDosage(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                              />
                            </div>

                            {/* Time of Day */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('Time of Day', '用药时间段')}</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'Morning', label: t('Morning 🌅', '早上 🌅') },
                                  { id: 'Afternoon', label: t('Afternoon ☀️', '下午 ☀️') },
                                  { id: 'Evening', label: t('Evening 🌆', '晚上 🌆') },
                                  { id: 'Night', label: t('Night 🌙', '深夜 🌙') }
                                ].map((time) => (
                                  <button
                                    key={time.id}
                                    type="button"
                                    onClick={() => setNewMedTime(time.id)}
                                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                                      newMedTime === time.id
                                        ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                                        : 'bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                                    }`}
                                  >
                                    {time.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> {t('Add to Schedule', '加入日常用药日程')}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Schedule & Actions Column */}
                      <div className="lg:col-span-7 flex flex-col">
                        <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col h-full min-h-[300px]">
                          <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-800 pb-2 mb-4">
                            <Clock className="w-4 h-4 text-rose-500" /> {t('Active Medications', '当前用药日程')} ({medications.length})
                          </h3>

                          {medications.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-400">
                              <Info className="w-12 h-12 text-stone-300 dark:text-stone-700 mb-2 animate-pulse" />
                              <p className="font-bold text-stone-600 dark:text-stone-300">{t('No scheduled medications', '暂无预定用药')}</p>
                              <p className="text-xs text-stone-400 max-w-xs mt-1">
                                {t('Add daily medications above to set up dosage times and easily log daily adherence.', '在左侧添加爱宠每日所需的药剂或保健品，设定剂量和时间段，轻松打卡。')}
                              </p>
                            </div>
                          ) : (
                            <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[400px]">
                              <AnimatePresence initial={false}>
                                {medications.map((med) => {
                                  const todayStr = new Date().toLocaleDateString();
                                  const status = med.logs[todayStr] || 'pending';

                                  const timeEmojis: Record<string, string> = {
                                    Morning: '🌅',
                                    Afternoon: '☀️',
                                    Evening: '🌆',
                                    Night: '🌙'
                                  };
                                  const translatedTimes: Record<string, string> = {
                                    Morning: t('Morning', '早上'),
                                    Afternoon: t('Afternoon', '下午'),
                                    Evening: t('Evening', '晚上'),
                                    Night: t('Night', '深夜')
                                  };

                                  return (
                                    <motion.div
                                      key={med.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      transition={{ duration: 0.15 }}
                                      className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl hover:border-rose-200 dark:hover:border-rose-950 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group relative overflow-hidden"
                                    >
                                      {/* Info */}
                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-md">
                                            {timeEmojis[med.timeOfDay]} {translatedTimes[med.timeOfDay]}
                                          </span>
                                          <span className="text-xs font-bold text-stone-400">{med.dosage}</span>
                                        </div>
                                        <h4 className="font-extrabold text-stone-900 dark:text-white text-base">
                                          {med.name}
                                        </h4>
                                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-semibold">
                                          <span>{t('Started on', '启用时间')}: {med.startDate}</span>
                                        </div>
                                      </div>

                                      {/* Right Controls */}
                                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                        {/* Status Badge */}
                                        <div>
                                          {status === 'taken' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                              <Check className="w-3.5 h-3.5" />
                                              {t('Taken', '已服')}
                                            </span>
                                          )}
                                          {status === 'missed' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full border border-rose-100 dark:border-rose-900/30">
                                              <X className="w-3.5 h-3.5" />
                                              {t('Missed', '漏服')}
                                            </span>
                                          )}
                                          {status === 'pending' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full border border-stone-200/50 dark:border-stone-700/50">
                                              <Clock className="w-3.5 h-3.5" />
                                              {t('Pending', '待服')}
                                            </span>
                                          )}
                                        </div>

                                        {/* Toggle Action Buttons */}
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => toggleMedicationStatus(med.id, todayStr, 'taken')}
                                            className={`p-1.5 rounded-lg border transition-all ${
                                              status === 'taken'
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                : 'bg-white dark:bg-stone-900 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 border-stone-200 dark:border-stone-800 text-stone-400'
                                            }`}
                                            title={t('Mark as Taken', '打卡已服')}
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => toggleMedicationStatus(med.id, todayStr, 'missed')}
                                            className={`p-1.5 rounded-lg border transition-all ${
                                              status === 'missed'
                                                ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                                                : 'bg-white dark:bg-stone-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 border-stone-200 dark:border-stone-800 text-stone-400'
                                            }`}
                                            title={t('Mark as Missed', '标为漏服')}
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                          {status !== 'pending' && (
                                            <button
                                              type="button"
                                              onClick={() => toggleMedicationStatus(med.id, todayStr, 'pending')}
                                              className="p-1.5 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded-lg transition-all"
                                              title={t('Reset to Pending', '重置为待服')}
                                            >
                                              <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => deleteMedication(med.id)}
                                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all opacity-0 group-hover:opacity-100 outline-none"
                                            title={t('Remove from Schedule', '删除用药预定')}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 1.7: AI SYMPTOM CHECKER */}
                {modalTab === 'symptoms' && (
                  <div className="space-y-6">
                    {/* Header Board */}
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="font-extrabold text-stone-950 dark:text-white text-base flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                            {t("Gemini AI Pet Symptom Checker", "Gemini AI 宠物症状自查系统")}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {t("Analyze your pet's visible symptoms to get non-diagnostic triage guidelines, potential matching ailments, and immediate care tips.", "智能分析爱宠表现出的临床症状，获取非诊断性的分诊级别、潜在疾病筛查以及辅助护理建议。")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-purple-500 bg-purple-50 dark:bg-purple-950/30 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-900/30 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t("Empathetic AI Triage", "医辅级智能分诊")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Input Form & Pet Profile */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                            <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5">
                              <Stethoscope className="w-4 h-4 text-rose-500" /> {t('Active Patient Profile', '当前自查档案')}
                            </h3>
                            <span className="text-[10px] font-bold text-stone-400 bg-stone-200 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                              {getPetInfo('1')?.name || 'Buddy'}
                            </span>
                          </div>

                          {/* Pet Info Snapshot */}
                          <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
                            <div>
                              <p className="text-[10px] text-stone-400 font-bold uppercase">{t('Species', '物种')}</p>
                              <p className="font-extrabold text-stone-800 dark:text-stone-200">{getPetInfo('1')?.species === 'Dog' ? t('Dog 🐶', '犬 🐶') : t('Cat 🐱', '猫 🐱')}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-stone-400 font-bold uppercase">{t('Breed', '品种')}</p>
                              <p className="font-extrabold text-stone-800 dark:text-stone-200 truncate">{getPetInfo('1')?.breed || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-stone-400 font-bold uppercase">{t('Age Stage', '生命阶段')}</p>
                              <p className="font-extrabold text-stone-800 dark:text-stone-200">{getPetInfo('1')?.age === 'Puppy' || getPetInfo('1')?.age === 'Kitten' ? t('Young', '幼年') : t('Adult', '成年')}</p>
                            </div>
                          </div>

                          <form onSubmit={analyzeSymptoms} className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                                {t("What symptoms are you seeing?", "爱宠表现出了什么症状？")}
                              </label>
                              <textarea
                                required
                                value={symptomsInput}
                                onChange={(e) => setSymptomsInput(e.target.value)}
                                placeholder={t(
                                  "e.g. Scratching ears constantly and shaking head. Seems restless and has some slight red patches on inner ear flap.",
                                  "例如：频繁抓挠耳朵、甩头。显得焦躁不安，内耳廓有一些红斑点，有轻微异味。"
                                )}
                                className="w-full h-32 px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={isAnalyzingSymptoms || !symptomsInput.trim()}
                              className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:scale-100"
                            >
                              {isAnalyzingSymptoms ? (
                                <>
                                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  {t("AI Analyzing...", "AI 正在分析中...")}
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" /> {t("Run AI Symptom Checker", "运行 AI 症状智能自查")}
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        {/* Stethoscope Tips Card */}
                        <div className="bg-purple-50/50 dark:bg-purple-950/10 p-4 rounded-2xl border border-purple-100/40 dark:border-purple-900/20 text-xs space-y-2">
                          <p className="font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1">
                            <Info className="w-4 h-4 text-purple-500" /> {t("How it works", "使用说明与原理")}
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-stone-500 dark:text-stone-400">
                            <li>{t("Generates a non-binding risk profile based on clinical veterinary databases via Gemini.", "通过 Gemini 大模型基于临床宠物医学常识评估风险，不具有法律效力。")}</li>
                            <li>{t("Provides triage urgency: Urgent Care, Monitor Closely, or Routine Visit.", "智能分诊评级：紧急就医、密切观察或常规约诊。")}</li>
                            <li>{t("Always consult a licensed veterinarian for formal medical diagnoses.", "本自查服务无法代替宠物医师的面对面听诊或实验室化验。")}</li>
                          </ul>
                        </div>
                      </div>

                      {/* Right Column: Active Results / History */}
                      <div className="lg:col-span-7 space-y-4">
                        {isAnalyzingSymptoms && (
                          <div className="bg-stone-50 dark:bg-stone-950/50 p-8 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center text-center h-[350px]">
                            <div className="relative mb-4">
                              {/* Pulse wave animation */}
                              <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25" />
                              <div className="bg-rose-500 text-white p-4 rounded-full relative">
                                <Stethoscope className="w-8 h-8 animate-pulse" />
                              </div>
                            </div>
                            <h4 className="font-extrabold text-stone-800 dark:text-stone-200 text-base">{t("Consulting Pet Medical Model...", "正在对接临床宠物大模型...")}</h4>
                            <p className="text-xs text-stone-400 max-w-xs mt-1">
                              {t("Gemini is triaging the described symptoms against common veterinary databases to compile safety metrics...", "AI 正在针对常见宠物多发症状库进行匹配，评估紧急程度，制定日常舒缓和就医建议...")}
                            </p>
                          </div>
                        )}

                        {!isAnalyzingSymptoms && !symptomsResult && symptomHistory.length === 0 && (
                          <div className="bg-stone-50 dark:bg-stone-950/50 p-8 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center text-center h-[350px] text-stone-400">
                            <Stethoscope className="w-12 h-12 text-stone-300 dark:text-stone-700 mb-2 animate-bounce" />
                            <p className="font-bold text-stone-600 dark:text-stone-300">{t("No check-ups run yet", "暂无分析数据")}</p>
                            <p className="text-xs text-stone-400 max-w-xs mt-1">
                              {t("Describe your pet's current abnormal behaviors or visible symptoms in the input form on the left to start checking.", "在左侧输入您观察到的爱宠异常表现或症状，即可开启医辅级智能分诊自查。")}
                            </p>
                          </div>
                        )}

                        {!isAnalyzingSymptoms && symptomsResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                              <h3 className="font-bold text-stone-950 dark:text-stone-50 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-purple-500" /> {t("Symptom Analysis Results", "症状评估报告")}
                              </h3>
                              <button
                                onClick={() => setSymptomsResult(null)}
                                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold"
                              >
                                {t("Close Report", "关闭当前报告")}
                              </button>
                            </div>

                            {/* Urgency Badge Banner */}
                            <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                              symptomsResult.urgency === 'Urgent Care Required'
                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
                                : symptomsResult.urgency === 'Monitor Closely'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                            }`}>
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-black text-xs uppercase tracking-wide opacity-85">
                                  {t("Recommended Action Status", "就诊建议状态")}
                                </p>
                                <p className="font-black text-sm mt-0.5">
                                  {symptomsResult.urgency === 'Urgent Care Required' && t("🔴 Urgent Care Required (Seek Veterinarian Immediately)", "🔴 紧急就医 (请立即联系执业兽医师或急诊医院)")}
                                  {symptomsResult.urgency === 'Monitor Closely' && t("🟡 Monitor Closely (Track closely & isolate if necessary)", "🟡 密切观察 (若症状恶化请及时约诊并做好隔离)")}
                                  {symptomsResult.urgency === 'Routine Vet Visit Recommended' && t("🔵 Routine Vet Visit Recommended", "🔵 建议常规约诊 (普通门诊检查即可)")}
                                </p>
                              </div>
                            </div>

                            {/* Potential Ailments list */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t("Potential Common Ailments", "筛查出的可能疾病")}</h4>
                              <div className="space-y-2">
                                {symptomsResult.ailments?.map((ailment, idx) => (
                                  <div key={idx} className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <span className="font-extrabold text-stone-950 dark:text-white text-sm">{ailment.name}</span>
                                      <div className="flex items-center gap-1.5">
                                        {/* Severity Badge */}
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                          ailment.severity === 'High'
                                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                                            : ailment.severity === 'Medium'
                                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500'
                                        }`}>
                                          {t("Severity: ", "严重程度: ")}{t(ailment.severity, ailment.severity)}
                                        </span>
                                        {/* Likelihood Badge */}
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-purple-50 dark:bg-purple-950/30 text-purple-500 rounded-md">
                                          {t("Match: ", "匹配概率: ")}{t(ailment.likelihood, ailment.likelihood)}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-stone-500 leading-relaxed">{ailment.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Soothing Relief Tips */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t("Soothing Care & Relief Tips", "临时舒缓与应急措施")}</h4>
                              <div className="bg-purple-50/20 dark:bg-purple-950/5 p-4 rounded-xl border border-purple-100/30 dark:border-purple-900/10">
                                <ul className="space-y-1.5">
                                  {symptomsResult.reliefTips?.map((tip, idx) => (
                                    <li key={idx} className="text-xs text-stone-600 dark:text-stone-300 flex items-start gap-1.5 leading-relaxed">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Disclaimer Panel */}
                            <div className="p-3 bg-stone-100 dark:bg-stone-900 text-[10px] text-stone-400 rounded-xl leading-relaxed">
                              <p className="font-bold text-stone-500 dark:text-stone-300 flex items-center gap-1 mb-1">
                                <AlertCircle className="w-3.5 h-3.5 text-stone-400" /> {t("Medical Disclaimer", "医学免责声明")}
                              </p>
                              <p>{symptomsResult.disclaimer || t("Disclaimer: AI models provide guidance based on general patterns but do not represent formal veterinary diagnoses. Always consult a vet.", "免责声明：本模块评估内容属于医学辅助参考信息，基于大规模数据概率生成，无法代替临床检验、兽医师听诊等标准确诊流程。若爱宠出现危急状态，请即刻送医。")}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Past History Stack */}
                        {!isAnalyzingSymptoms && symptomHistory.length > 0 && (
                          <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                            <h3 className="font-bold text-stone-950 dark:text-stone-50 text-xs flex items-center gap-1.5 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
                              <Calendar className="w-3.5 h-3.5 text-rose-500" /> {t("Past Symptom Check-Ups", "过往自查记录历史")} ({symptomHistory.length})
                            </h3>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {symptomHistory.map((historyItem) => (
                                <div
                                  key={historyItem.id}
                                  className="p-3 bg-white dark:bg-stone-900 hover:bg-stone-100/50 dark:hover:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-xl flex items-center justify-between gap-4 transition-all group cursor-pointer"
                                  onClick={() => setSymptomsResult(historyItem.result)}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 rounded-md">
                                        {historyItem.petName}
                                      </span>
                                      <span className="text-[10px] font-bold text-stone-400">{historyItem.date}</span>
                                    </div>
                                    <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mt-1 truncate">
                                      {t("Symptoms: ", "自查症状: ")}{historyItem.symptoms}
                                    </p>
                                    <p className="text-[10px] font-semibold text-purple-500 flex items-center gap-0.5 mt-0.5">
                                      {historyItem.result?.urgency === 'Urgent Care Required' && `🔴 ${t("Urgent", "急诊就诊")}`}
                                      {historyItem.result?.urgency === 'Monitor Closely' && `🟡 ${t("Monitor Closely", "密切观察")}`}
                                      {historyItem.result?.urgency === 'Routine Vet Visit Recommended' && `🔵 ${t("Routine Visit", "常规门诊")}`}
                                      {` • ${historyItem.result?.ailments?.length || 0} ${t("ailments screened", "项潜在异常")}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSymptomRecord(historyItem.id);
                                      }}
                                      className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all opacity-0 group-hover:opacity-100 outline-none"
                                      title={t("Delete Record", "删除此记录")}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <ChevronRight className="w-4 h-4 text-stone-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ACHIEVEMENTS & BADGES */}
                {modalTab === 'badges' && (
                  <div className="space-y-6">
                    <div className="bg-stone-50 dark:bg-stone-950/50 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-950/40 p-3 rounded-2xl text-amber-500">
                          <Trophy className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-stone-950 dark:text-white text-base">{t('Achievements Progress', '成就进度')}</h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {t('Unlock special caregiver badges by staying consistent with your daily reporting.', '坚持每日记录，解锁专属守护者勋章。')}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-stone-900 px-5 py-3 rounded-xl border border-stone-100 dark:border-stone-800 text-center font-bold">
                        <p className="text-2xl text-amber-500">{unlockedBadges.length} / {BADGES.length}</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-0.5">{t('Badges Earned', '已获得勋章')}</p>
                      </div>
                    </div>

                    {/* Badges Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {BADGES.map((badge) => {
                        const isUnlocked = badge.check(entries);
                        const progressData = badge.progress(entries);
                        const percent = Math.min((progressData.current / progressData.target) * 100, 100);

                        return (
                          <div
                            key={badge.id}
                            className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                              isUnlocked
                                ? `${badge.bgColor} ${badge.borderColor} shadow-sm border-2 relative overflow-hidden group`
                                : 'bg-stone-50/50 dark:bg-stone-900/30 border-stone-100 dark:border-stone-800'
                            }`}
                          >
                            {/* Shiny Overlay for Unlocked Badges */}
                            {isUnlocked && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                            )}

                            {/* Badge Icon Container */}
                            <div className="flex-shrink-0">
                              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                                isUnlocked
                                  ? 'bg-white dark:bg-stone-800 shadow-md scale-105'
                                  : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-600'
                              }`}>
                                {isUnlocked ? (
                                  renderBadgeIcon(badge.iconName, `w-7 h-7 ${badge.color} animate-pulse`)
                                ) : (
                                  <div className="relative">
                                    {renderBadgeIcon(badge.iconName, 'w-7 h-7 filter grayscale opacity-50')}
                                    <Lock className="w-3.5 h-3.5 absolute -bottom-1 -right-1 bg-white dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700 rounded-full p-0.5" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 space-y-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className={`font-bold text-sm ${isUnlocked ? 'text-stone-900 dark:text-white' : 'text-stone-500'}`}>
                                    {badge.name}
                                  </h4>
                                  {isUnlocked && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  )}
                                </div>
                                <p className="text-xs text-stone-500 mt-1 leading-normal">{badge.description}</p>
                              </div>

                              {/* Progress bar info */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold text-stone-400">
                                  <span>{badge.requirement}</span>
                                  <span>{progressData.current} / {progressData.target}</span>
                                </div>
                                <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      isUnlocked ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: HEALTH ANALYTICS & STATS */}
                {modalTab === 'stats' && (
                  <div className="space-y-6">
                    {/* Core numeric logs metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: t('Academy Score (Total XP)', '学院总得分 (总 XP)'), value: `${totalXp} XP`, detail: `${t('Level', '等级')} ${currentLevel.level} ${t('Ranking', '排名')}`, color: 'text-rose-500' },
                        { label: t('Total Recorded Logs', '记录日志总数'), value: `${entries.length} ${t('entries', '条')}`, detail: t('Verified Health Journals', '已验证健康日志'), color: 'text-indigo-500' },
                        { label: t('Bio-indicators Tracked', '追踪生物指标'), value: `${entries.filter(e => e.weight > 0 || e.mood).length} ${t('stats', '项')}`, detail: t('Details like weight & mood', '如体重和心情等详情'), color: 'text-emerald-500' }
                      ].map((card) => (
                        <div key={card.label} className="bg-stone-50/50 dark:bg-stone-900/30 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-1">
                          <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{card.label}</p>
                          <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                          <p className="text-xs text-stone-500 font-semibold">{card.detail}</p>
                        </div>
                      ))}
                    </div>

                    {/* Weight History Charts/Trend Cards */}
                    <div className="bg-stone-50/50 dark:bg-stone-900/30 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                      <h3 className="font-extrabold text-stone-950 dark:text-white text-sm flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-purple-500" /> {t('Bio-Weight Log Progression', '生物体重记录进展')}
                      </h3>

                      {entries.filter(e => e.weight > 0).length < 1 ? (
                        <p className="text-xs text-stone-500">{t('No weight records logged yet. Enter your pet’s weight when logging to view biosign trend indicators.', '暂无体重记录。请在记录时输入体重以查看生物指标趋势。')}</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-stone-500">{t('Weight metrics tracking history (Newest first):', '体重指标追踪历史 (最新优先):')}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {entries.filter(e => e.weight > 0).map((record, index, arr) => {
                              // Calculate difference if there's a previous record in chronical order
                              let diffText = t('Starting weight', '初始体重');
                              let isUp = false;
                              let isDown = false;
                              
                              if (index < arr.length - 1) {
                                const prevWeight = arr[index + 1].weight;
                                const diff = record.weight - prevWeight;
                                if (diff > 0) {
                                  diffText = `+${diff.toFixed(1)} kg ${t('gained', '增加')}`;
                                  isUp = true;
                                } else if (diff < 0) {
                                  diffText = `${diff.toFixed(1)} kg ${t('lost', '减少')}`;
                                  isDown = true;
                                } else {
                                  diffText = t('No weight change', '体重无变化');
                                }
                              }

                              return (
                                <div key={record.id} className="p-3.5 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-stone-400">{record.date}</span>
                                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">{record.weight} kg</span>
                                  </div>
                                  <p className={`text-[10px] font-bold ${
                                    isUp ? 'text-rose-500' : isDown ? 'text-emerald-500' : 'text-stone-400'
                                  }`}>
                                    {diffText}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mood Patterns & Tag Analytics Section */}
                    <div className="bg-stone-50/50 dark:bg-stone-900/30 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-4">
                      <h3 className="font-extrabold text-stone-950 dark:text-white text-sm flex items-center gap-1.5">
                        <Smile className="w-4 h-4 text-rose-500" /> {t('Mood Patterns & Tag-Based Analytics', '心情模式与标签统计分析')}
                      </h3>

                      {entries.filter(e => e.mood || (e.moodTags && e.moodTags.length > 0)).length < 1 ? (
                        <p className="text-xs text-stone-500">{t('No mood entries logged yet. Record your pet’s daily mood and tags when logging entries to view emotional patterns.', '暂无心情记录。记录日志时选择宠物心情并添加标签，即可查看心情模式与行为标签统计。')}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left: Top Mood Tags cloud */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                              <Tag className="w-3 h-3 text-purple-500" /> {t('Most Common Mood Tags', '常用心情标签')}
                            </h4>
                            {tagFrequencies.length === 0 ? (
                              <p className="text-xs text-stone-400 italic">{t('No tags recorded yet', '暂未记录标签')}</p>
                            ) : (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {tagFrequencies.map(([tag, count]) => (
                                  <div 
                                    key={tag}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 rounded-full"
                                  >
                                    <span>{getTagEmoji(tag)}</span>
                                    <span>{tag}</span>
                                    <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 w-4 h-4 rounded-full flex items-center justify-center font-mono font-black">{count}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right: Core Mood Distribution */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                              <Smile className="w-3 h-3 text-rose-500" /> {t('Primary Mood Distribution', '主要心情分布')}
                            </h4>
                            {moodFrequencies.length === 0 ? (
                              <p className="text-xs text-stone-400 italic">{t('No primary moods logged', '暂未记录心情')}</p>
                            ) : (
                              <div className="space-y-2">
                                {moodFrequencies.map(([mLabel, count]) => {
                                  const totalMoodLogs = entries.filter(e => e.mood).length || 1;
                                  const pct = Math.round((count / totalMoodLogs) * 100);
                                  return (
                                    <div key={mLabel} className="space-y-1">
                                      <div className="flex justify-between items-center text-xs font-extrabold text-stone-800 dark:text-stone-200">
                                        <span>{mLabel}</span>
                                        <span className="text-stone-400">{count} {t('logs', '次')} ({pct}%)</span>
                                      </div>
                                      <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Bottom: Dynamic Care Insights */}
                          <div className="md:col-span-2 bg-gradient-to-br from-purple-50/50 to-rose-50/20 dark:from-stone-900/40 dark:to-stone-900/90 p-4 rounded-xl border border-purple-100/30 dark:border-stone-800 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5 animate-pulse" />
                            <div className="space-y-1 text-left">
                              <p className="text-xs font-black text-stone-950 dark:text-stone-50 uppercase tracking-wide">{t('Bio-Behavioral Insights', '生物行为洞察报告')}</p>
                              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-medium">
                                {(() => {
                                  const topTag = tagFrequencies[0]?.[0];
                                  if (!topTag) {
                                    return t(
                                      'Add tags like #playful, #tired, or #calm to unlock advanced pattern insights about your pet’s physical and mental wellness connection.',
                                      '记录日志并附带标签 (如 #playful、#tired、#calm 等) 即可解锁宠物身体健康与心理舒适度之间的深度趋势洞察。'
                                    );
                                  }
                                  
                                  if (['#energetic', '#playful', '#excited'].includes(topTag)) {
                                    return t(
                                      'Insight: Your pet exhibits high-energy characteristics. Pair this physical wellness check with consistent active exercise, outdoor play, and stimulating puzzle toys.',
                                      '洞察分析：您的宠物近期活力四射。建议结合规律的户外运动、活跃的游戏时间以及益智玩具来引导其充沛的精力。'
                                    );
                                  }
                                  if (['#tired', '#grumpy', '#timid'].includes(topTag)) {
                                    return t(
                                      'Insight: Signs of low energy or shyness are prominent. Provide a warm, quiet resting sanctuary and carefully monitor their nutrition, weight, and general hydration level.',
                                      '洞察分析：您的宠物近期表现出疲倦或害羞情绪。建议为其提供安静舒适的休息空间，并仔细观察其日常饮食、体重变化和饮水状况。'
                                    );
                                  }
                                  return t(
                                    'Insight: Excellent emotional consistency. Your pet is feeling highly secure, stable, and loving. Keep supporting their consistent health milestones to maintain this golden companion bond!',
                                    '洞察分析：极其稳定的良好情绪状态！您的宠物正感到十分安全、舒适且充满爱意。坚持记录健康成长里程碑，共同维系这段完美的默契羁绊！'
                                  );
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. POPUP CELEBRATION MODALS (Portal equivalent) */}
      <AnimatePresence>
        {/* Level Up Celebration Card */}
        {celebrateLevel && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              {/* Confetti element decorations */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500" />
              
              <div className="space-y-2">
                <p className="text-3xl animate-bounce">🎉</p>
                <h3 className="text-2xl font-black text-stone-950 dark:text-white uppercase tracking-tight">Level Up!</h3>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Wellness Academy Achievement</p>
              </div>

              <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-stone-950 dark:to-stone-900 rounded-2xl border border-rose-100/40 dark:border-stone-800">
                <span className="text-5xl">{celebrateLevel.icon}</span>
                <div>
                  <h4 className="text-lg font-black text-stone-900 dark:text-white leading-tight">
                    Level {celebrateLevel.level} REACHED!
                  </h4>
                  <p className="text-sm text-rose-500 dark:text-rose-400 font-bold">{celebrateLevel.title}</p>
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed px-4">
                Excellent! You are building fantastic, consistent tracking habits. Keep recording logs to unlock advanced master badges and deeper biometric tracking.
              </p>

              <button
                onClick={() => setCelebrateLevel(null)}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold text-sm rounded-xl transition-all shadow active:scale-95 outline-none"
              >
                Awesome! Continue Tracking
              </button>
            </motion.div>
          </div>
        )}

        {/* Badge Unlock Celebration Card */}
        {celebrateBadge && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
              
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-md">
                  {renderBadgeIcon(celebrateBadge.iconName, 'w-9 h-9 animate-pulse')}
                </div>
                <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tight mt-2">Medal Unlocked!</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">New Achievement Earned</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-stone-50 to-stone-100/50 dark:from-stone-950 dark:to-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 text-center">
                <h4 className="font-extrabold text-stone-900 dark:text-white text-base leading-tight">
                  {celebrateBadge.name}
                </h4>
                <p className="text-xs text-stone-500 mt-1 leading-normal px-2">
                  {celebrateBadge.description}
                </p>
              </div>

              <p className="text-xs text-stone-400 font-medium">
                Requirement completed: <span className="font-bold text-stone-600 dark:text-stone-300">{celebrateBadge.requirement}</span>
              </p>

              <button
                onClick={() => setCelebrateBadge(null)}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-xl transition-all shadow active:scale-95 outline-none"
              >
                Proud Caregiver! Collect Medal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Quick Log Floating Action Button (FAB) & Popover Panel */}
      <div className="fixed bottom-24 right-6 md:bottom-6 md:right-24 z-50">
        <AnimatePresence>
          {isQuickLogOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute bottom-full right-0 mb-4 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-5 space-y-4 text-left overflow-hidden z-50 animate-fade-in"
            >
              {/* Decorative top header strip */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-emerald-500" />
              
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                <div>
                  <h3 className="font-extrabold text-stone-950 dark:text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                    {t('Quick Wellness Log', '极速健康登记')}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">
                    {t('Instantly Track Mood & Symptoms', '随时随地记录爱宠状态')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen(false)}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickLog} className="space-y-4">
                {/* Active Patient snippet */}
                <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-950/40 p-2.5 rounded-xl border border-stone-100 dark:border-stone-850 text-xs">
                  <span className="text-stone-500 font-bold">{t('Active Pet:', '记录对象:')}</span>
                  <span className="font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-100/30">
                    {getPetInfo('1')?.name || 'Buddy'}
                  </span>
                </div>

                {/* Mood selector row */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Select Current Mood', '选择当前情绪')}
                  </label>
                  <div className="flex justify-between bg-stone-50 dark:bg-stone-950/40 p-2 rounded-xl border border-stone-100 dark:border-stone-850">
                    {[
                      { emoji: '😊', label: 'Happy', tag: '#happy' },
                      { emoji: '🤪', label: 'Playful', tag: '#playful' },
                      { emoji: '😴', label: 'Sleepy', tag: '#tired' },
                      { emoji: '🤒', label: 'Sick', tag: '#sick' },
                      { emoji: '🥺', label: 'Anxious', tag: '#timid' }
                    ].map((item) => {
                      const isSelected = quickMood === item.label;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setQuickMood('');
                              setQuickSelectedTags(quickSelectedTags.filter(t => t !== item.tag));
                            } else {
                              setQuickMood(item.label);
                              // automatically add tag
                              if (!quickSelectedTags.includes(item.tag)) {
                                setQuickSelectedTags([...quickSelectedTags, item.tag]);
                              }
                            }
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white scale-110 shadow-sm'
                              : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                          }`}
                          title={t(item.label, item.label)}
                        >
                          <span className="text-xl mb-0.5">{item.emoji}</span>
                          <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-white' : 'text-stone-400'}`}>
                            {t(item.label, item.label)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity or Symptoms input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Activity / Symptoms Description', '行为表现或异常症状')}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={quickActivity}
                    onChange={(e) => setQuickActivity(e.target.value)}
                    placeholder={t('e.g. Coughed twice, scratching left ear, full appetite...', '例如：咳嗽了两次，频繁抓耳朵，食欲正常...')}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none"
                  />
                </div>

                {/* 1-Tap Quick Presets */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">
                    {t('⚡ 1-Tap Presets:', '⚡ 常用一键录入:')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: t('Fever 🤒', '发烧 🤒'), text: 'Slight fever detected', tag: '#sick' },
                      { label: t('Coughing 🗣️', '咳嗽 🗣️'), text: 'Mild coughing spells', tag: '#sick' },
                      { label: t('Healthy Meal 🍖', '饱餐 🍖'), text: 'Ate full meal with high enthusiasm', tag: '#energetic' },
                      { label: t('Good Sleep 💤', '睡眠佳 💤'), text: 'Slept soundly and rested well', tag: '#calm' },
                      { label: t('Scratching 🐾', '抓挠 🐾'), text: 'Frequent ear/skin scratching', tag: '#sick' },
                      { label: t('Playful ⚡', '贪玩 ⚡'), text: 'Ran around happily playing with toys', tag: '#playful' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          let newText = quickActivity.trim();
                          if (newText) {
                            newText += `, ${preset.text}`;
                          } else {
                            newText = preset.text;
                          }
                          setQuickActivity(newText);
                          if (preset.tag && !quickSelectedTags.includes(preset.tag)) {
                            setQuickSelectedTags([...quickSelectedTags, preset.tag]);
                          }
                        }}
                        className="text-[9px] font-bold px-2 py-1 bg-stone-50 hover:bg-rose-50 dark:bg-stone-800 dark:hover:bg-rose-950/30 text-stone-500 dark:text-stone-400 hover:text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 border border-stone-200/60 dark:border-stone-700/60 rounded-lg transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Weight & Tags Column Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                      {t('Weight (kg - Optional)', '体重 (公斤 - 选填)')}
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={quickWeight}
                      onChange={(e) => setQuickWeight(e.target.value)}
                      placeholder="e.g. 10.5"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                      {t('Tags Selected', '已选标签')}
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-[44px] overflow-y-auto p-1 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-100 dark:border-stone-850">
                      {quickSelectedTags.length === 0 ? (
                        <span className="text-[9px] text-stone-400 font-medium italic p-1">{t('None', '无')}</span>
                      ) : (
                        quickSelectedTags.map(tag => (
                          <span
                            key={tag}
                            onClick={() => setQuickSelectedTags(quickSelectedTags.filter(t => t !== tag))}
                            className="text-[9px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer hover:bg-rose-500 transition-all"
                            title={t('Click to remove', '点击移除')}
                          >
                            <span>{tag}</span>
                            <span className="text-[8px]">×</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset tags multi-select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Toggle Behavior Tags', '切换行为标签')}
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                    {['#calm', '#energetic', '#playful', '#tired', '#timid', '#social', '#loving', '#curious', '#excited', '#grumpy'].map((tag) => {
                      const isSelected = quickSelectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setQuickSelectedTags(quickSelectedTags.filter(t => t !== tag));
                            } else {
                              setQuickSelectedTags([...quickSelectedTags, tag]);
                            }
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500 text-white shadow-sm'
                              : 'bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-750'
                          }`}
                        >
                          <span>{getTagEmoji(tag)}</span>
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggle Symptoms tags multi-select */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">
                    {t('Toggle Common Symptoms', '切换异常症状')}
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                    {[
                      { tag: '#lethargy', label: t('Lethargy 😴', '萎靡 😴') },
                      { tag: '#appetite_loss', label: t('Appetite Loss 🍖', '食欲差 🍖') },
                      { tag: '#vomiting', label: t('Vomiting 🤮', '呕吐 🤮') },
                      { tag: '#coughing', label: t('Coughing 🗣️', '咳嗽 🗣️') },
                      { tag: '#fever', label: t('Fever 🤒', '发烧 🤒') },
                      { tag: '#itching', label: t('Itching 🐾', '瘙痒 🐾') },
                      { tag: '#sneezing', label: t('Sneezing 🤧', '喷嚏 🤧') },
                      { tag: '#diarrhea', label: t('Diarrhea 💩', '腹泻 💩') }
                    ].map((item) => {
                      const isSelected = quickSelectedTags.includes(item.tag);
                      return (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setQuickSelectedTags(quickSelectedTags.filter(t => t !== item.tag));
                            } else {
                              setQuickSelectedTags([...quickSelectedTags, item.tag]);
                            }
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition-all flex items-center gap-0.5 ${
                            isSelected
                              ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                              : 'bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-750'
                          }`}
                        >
                          <span>{getTagEmoji(item.tag)}</span>
                          <span>{item.tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Log button */}
                <button
                  type="submit"
                  disabled={!quickActivity.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 disabled:from-stone-300 disabled:to-stone-400 dark:disabled:from-stone-800 dark:disabled:to-stone-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> {t('Save Wellness Log', '保存并录入日志')} (+50 XP)
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button Trigger */}
        <button
          onClick={() => setIsQuickLogOpen(!isQuickLogOpen)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
            isQuickLogOpen
              ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 rotate-45 scale-110'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:scale-110'
          }`}
          title={t('Quick Health Log', '极速健康登记')}
        >
          {isQuickLogOpen ? <X className="w-6 h-6" /> : <Stethoscope className="w-6 h-6 animate-pulse" />}
        </button>

        {/* Undo Snackbar Notification */}
        <AnimatePresence>
          {undoSnackbar && undoSnackbar.visible && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 dark:bg-stone-50/95 text-stone-100 dark:text-stone-950 px-4 py-3 rounded-xl shadow-2xl border border-stone-800 dark:border-stone-200 flex items-center gap-3 backdrop-blur-md min-w-[300px] justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold truncate max-w-[160px]">
                  {t('Log deleted', '日志已删除')}
                </span>
              </div>
              <button
                onClick={undoDelete}
                className="text-xs font-black text-emerald-400 dark:text-emerald-600 hover:underline flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {t('UNDO', '撤销')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-size Photo Preview Modal */}
        <AnimatePresence>
          {selectedPreviewPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedPreviewPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={selectedPreviewPhoto} 
                  alt={t('Full preview', '照片预览')} 
                  className="max-w-full max-h-[75vh] object-contain"
                />
                <div className="p-3 bg-stone-900/90 flex items-center justify-between border-t border-stone-800 text-white">
                  <span className="text-xs font-bold text-stone-400">
                    {t('Journal Photo Attachment', '健康日志附带照片')}
                  </span>
                  <button
                    onClick={() => setSelectedPreviewPhoto(null)}
                    className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {t('Close', '关闭')}
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPreviewPhoto(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full shadow-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
