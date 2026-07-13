import React, { useState, useEffect, useMemo } from 'react';
import QuestionCard from './QuestionCard';
import { Question, Answer } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { Toast } from './Toast';
import { 
  HelpCircle, Plus, Search, SlidersHorizontal, CheckCircle2, 
  MessageSquare, Users, AlertCircle, RefreshCw, Sparkles 
} from 'lucide-react';

const INITIAL_QUESTIONS: Question[] = [
  { 
    id: 'q-1', 
    title: 'How to transition a new puppy to dry food?', 
    body: 'I just adopted a 3-month-old golden retriever, and he is struggling with the new dry food. He keeps ignoring the bowl and seems to have a hard time chewing the dry kibble.', 
    author: 'Mark Jenkins', 
    status: 'open', 
    timestamp: '2 hours ago',
    answersList: [
      { id: 'ans-1', questionId: 'q-1', author: 'Dr. Evelyn Carter (DVM)', content: 'Try mixing it with warm water for a few days to soften it. You can also mix in a spoonful of wet puppy food to make the scent more appealing and stimulate their appetite!', upvotes: 12, timestamp: '1 hour ago' }
    ]
  },
  {
    id: 'q-2',
    title: 'How often should a house cat get a grooming session?',
    body: 'My Siamese cat is mostly indoors. I brush her weekly, but I am wondering if professional grooming, bathing, or nail clipping is necessary and how often.',
    author: 'Sarah Wood',
    status: 'resolved',
    timestamp: '1 day ago',
    answersList: [
      { id: 'ans-2', questionId: 'q-2', author: 'Groomer Pro (Expert)', content: 'Indoor cats are generally very good at self-grooming. A weekly thorough brushing is excellent for preventing hairballs. Professional nail trims are ideal every 3-4 weeks if they do not wear them down naturally. Baths are rarely needed unless they get extremely dirty!', upvotes: 8, timestamp: '18 hours ago' }
    ]
  }
];

export default function PetQAFeed() {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem('pet_community_questions');
      return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
    } catch {
      return INITIAL_QUESTIONS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [onlyVerified, setOnlyVerified] = useState(false);
  
  // Create Question Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUrgentFormOpen, setIsUrgentFormOpen] = useState(false);
  const [qTitle, setQTitle] = useState('');
  const [qBody, setQBody] = useState('');
  const [qAuthor, setQAuthor] = useState('');
  const [urgentSymptoms, setUrgentSymptoms] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // Expert Search States
  const [expertSearchQuery, setExpertSearchQuery] = useState('');
  const [isExpertSearching, setIsExpertSearching] = useState(false);
  const [expertSearchResult, setExpertSearchResult] = useState<{ answer: string; sources: { title: string; uri: string }[] } | null>(null);

  const handleExpertSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertSearchQuery.trim()) return;
    setIsExpertSearching(true);
    setExpertSearchResult(null);
    try {
      const response = await fetch('/api/expert-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: expertSearchQuery }),
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setExpertSearchResult(data);
      addToast(t('Expert search completed with citations!', '专家检索完成并已生成学术引用！'));
    } catch (err) {
      console.error(err);
      addToast(t('Expert search failed. Using fallback care advice.', '专家检索失败，已载入离线行为护理建议。'));
      setExpertSearchResult({
        answer: t(
          `Offline Expert Advice:\n\nFor pet behavior issues, experts recommend positive reinforcement, rich mental enrichment, and consulting a licensed vet to rule out any clinical causes.`,
          `离线专家建议：\n\n对于宠物行为问题，专家建议采用正向激励法、丰富的精神刺激，并及时咨询执业兽医以排除潜在病痛。`
        ),
        sources: [
          { title: 'AVMA Pet Behavior Guides', uri: 'https://www.avma.org' },
          { title: 'ASPCA Care Tips', uri: 'https://www.aspca.org' },
        ],
      });
    } finally {
      setIsExpertSearching(false);
    }
  };

  // Add the firebase imports and logic
  const handlePingExperts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urgentSymptoms.trim()) return;
    
    // Add to Firestore
    try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase'); // Need to create this
        await addDoc(collection(db, 'urgentRequests'), {
            petId: 'unknown',
            symptoms: urgentSymptoms,
            urgency: 'high',
            userId: 'unknown',
            timestamp: new Date().toISOString() // serverTimestamp()
        });
        addToast(t('Ping sent to nearby experts!', '已向附近专家发出求助！'));
        setIsUrgentFormOpen(false);
        setUrgentSymptoms('');
    } catch (e) {
        console.error(e);
        addToast(t('Failed to send ping', '发送求助失败'));
    }
  };

  const addToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
  };

  useEffect(() => {
    localStorage.setItem('pet_community_questions', JSON.stringify(questions));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Search match
      const matchesSearch = 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status match
      if (statusFilter === 'all') return true;
      return q.status === statusFilter;
    });
  }, [questions, searchQuery, statusFilter]);

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    // Detect new professional answer
    const oldQuestion = questions.find(q => q.id === updatedQuestion.id);
    if (oldQuestion && updatedQuestion.answersList && oldQuestion.answersList) {
      const newAnswer = updatedQuestion.answersList.find(a => 
        !oldQuestion.answersList?.some(oldA => oldA.id === a.id)
      );

      if (newAnswer && (newAnswer.author.toLowerCase().includes('dvm') || newAnswer.author.toLowerCase().includes('expert'))) {
        addToast(t(`New professional response for your question: "${updatedQuestion.title}"`, `针对您的提问“${updatedQuestion.title}”有了新的专业回复`));
      }
    }
    
    setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !qBody.trim()) return;

    const author = qAuthor.trim() || 'Caring Owner';
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      title: qTitle.trim(),
      body: qBody.trim(),
      author,
      status: 'open',
      timestamp: 'Just now',
      answersList: []
    };

    setQuestions([newQuestion, ...questions]);
    
    // Play audio feedback chime
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.08); // C# chord vibe
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (_) {}

    // Reset Form
    setQTitle('');
    setQBody('');
    setQAuthor('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Action Panel */}

      {/* Vet AI Expert Search (Search Grounding) */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-950 dark:to-indigo-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-2xl">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                {t('Expert Veterinary AI Search', '权威宠物行为与健康 AI 检索')}
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {t('Live Search Grounded', '谷歌搜索学术增强')}
                </span>
              </h3>
              <p className="text-xs text-indigo-100/80">
                {t('Queries real-time veterinary science & certified pet behaviorists for accurate, trusted advice.', '实时检索权威兽医学术文章与持证行为分析师意见，获取最可靠的专业建议。')}
              </p>
            </div>
          </div>

          <form onSubmit={handleExpertSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={expertSearchQuery}
                onChange={(e) => setExpertSearchQuery(e.target.value)}
                placeholder={t("e.g. Why does my cat lick my face, or how to stop separation anxiety?", "例如：为什么猫咪总是舔我？狗狗分离焦虑怎么缓解？")}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-2xl text-sm text-white placeholder-indigo-200/60 focus:ring-2 focus:ring-white/20 outline-none font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isExpertSearching}
              className="px-5 py-3 bg-white text-violet-750 hover:bg-indigo-50 disabled:bg-white/50 disabled:text-violet-300 font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer animate-fade-in"
            >
              {isExpertSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('Consulting...', '咨询中...')}
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {t('Consult AI', '问诊 AI')}
                </>
              )}
            </button>
          </form>

          {/* Expert Search Results */}
          {expertSearchResult && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-violet-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {t('Expert Answer', '专家诊断参考')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setExpertSearchResult(null);
                    setExpertSearchQuery('');
                  }}
                  className="text-white/60 hover:text-white transition-colors text-xs font-bold"
                >
                  {t('Clear', '清除')}
                </button>
              </div>

              <div className="text-sm leading-relaxed text-indigo-50 font-medium whitespace-pre-wrap">
                {expertSearchResult.answer}
              </div>

              {expertSearchResult.sources && expertSearchResult.sources.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <p className="text-[11px] font-bold text-violet-200 uppercase tracking-wider">
                    {t('Verified Academic / Web Sources:', '检索到的学术与网络参考源：')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expertSearchResult.sources.map((src: any, idx: number) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-amber-200 hover:text-amber-100 font-bold transition-all flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-stone-100 dark:border-stone-700/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={t("Search questions or advice...", "搜索问题或建议...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
        </div>

        {/* Status Filters & Verified Toggle */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(['all', 'open', 'resolved'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all capitalize ${
                statusFilter === filter
                  ? 'bg-rose-500 text-white shadow-sm scale-105'
                  : 'bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-100 dark:border-stone-800'
              }`}
            >
              {filter === 'all' ? t('All Questions', '全部问题') : filter === 'open' ? t('Open Questions', '待解决问题') : t('Resolved Questions', '已解决问题')}
            </button>
          ))}
          
          <button
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
              onlyVerified
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-100 dark:border-stone-800'
            }`}
          >
            {onlyVerified ? t('Verified Only', '仅认证') : t('All Pro', '全部建议')}
          </button>
        </div>

        {/* Ask Question Button */}
        <div className="flex gap-2 w-full md:w-auto">
            <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-1.5 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-95 flex-1 md:flex-none justify-center ${new Date().getHours() >= 9 && new Date().getHours() < 17 ? 'animate-pulse' : ''}`}
            >
            <Plus className="w-4 h-4" /> {t('Ask Expert', '专家问答')}
            </button>
            <button
            onClick={() => setIsUrgentFormOpen(!isUrgentFormOpen)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-95 flex-1 md:flex-none justify-center"
            >
            <AlertCircle className="w-4 h-4" /> {t('Ping Expert', '紧急求助')}
            </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {t('Question posted to Vet-Academy expert community!', '问题已成功发布到宠物在线专家社区！')}
        </div>
      )}

      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
      ))}

      {/* Collapsible Ask Question Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl border border-stone-100 dark:border-stone-700/60 shadow-sm space-y-4 animate-fade-in-down">
          <h3 className="font-extrabold text-stone-950 dark:text-white text-base flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-700/40 pb-2.5">
            <HelpCircle className="w-5 h-5 text-rose-500 animate-pulse" /> {t('Post a Question to Veterinary Experts', '向宠物兽医专家提问')}
          </h3>

          <form onSubmit={handleCreateQuestion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Question Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Short Question Title', '问题标题 (简明扼要)')}</label>
                <input
                  type="text"
                  required
                  placeholder={t("e.g. My cat is coughing constantly - is this hairballs or asthma?", "例如：猫咪一直咳嗽——是毛球症还是哮喘？")}
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                />
              </div>

              {/* Author name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Your Name', '您的姓名')}</label>
                <input
                  type="text"
                  placeholder={t("e.g. Liam Smith", "例如：李明")}
                  value={qAuthor}
                  onChange={(e) => setQAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                />
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Detailed Description & Symptoms', '详细描述与症状描述')}</label>
              <textarea
                required
                rows={3}
                placeholder={t("List symptom details, duration, pet breed/age, and any home remedies you tried, to help our community vets provide tailored tips.", "请列出症状详情、持续时间、宠物品种/年龄以及您尝试过的任何家庭疗法，以便我们的社区兽医提供针对性的建议。")}
                value={qBody}
                onChange={(e) => setQBody(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none"
              />
            </div>

            {/* Info Notice */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 text-[11px] text-amber-700 dark:text-amber-400 rounded-xl leading-relaxed flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>{t('Disclaimer:', '免责声明：')}</strong> {t('This academy is for general caregiver educational tips. If your pet has a medical emergency, is bleeding, or in severe distress, locate immediate local emergency clinical help rather than waiting for community replies!', '本问答板块仅提供一般性养宠科普与建议。如果您的宠物遇到医疗紧急情况、流血或严重不适，请立即寻求当地急诊兽医机构的帮助，切勿等待社区回复！')}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-all"
              >
                {t('Cancel', '取消')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                {t('Post Question', '发布提问')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collapsible Urgent Ping Form */}
      {isUrgentFormOpen && (
        <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-100 dark:border-rose-900 shadow-sm space-y-4 animate-fade-in-down">
          <h3 className="font-extrabold text-rose-900 dark:text-rose-100 text-base flex items-center gap-1.5 border-b border-rose-100 dark:border-rose-900 pb-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" /> {t('Send Urgent Ping to Nearby Experts', '向附近专家发送紧急求助')}
          </h3>

          <form onSubmit={handlePingExperts} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-500 uppercase tracking-wider">{t('Symptoms or Emergency Details', '症状或紧急情况详情')}</label>
              <textarea
                required
                rows={3}
                placeholder={t("Briefly describe the emergency to alert nearby foster volunteers and experts.", "简要描述紧急情况，以提醒附近的寄养志愿者和专家。")}
                value={urgentSymptoms}
                onChange={(e) => setUrgentSymptoms(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-rose-900 dark:text-white outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsUrgentFormOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl transition-all"
              >
                {t('Cancel', '取消')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                {t('Send Urgent Ping', '发送紧急求助')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-stone-800 p-12 text-center rounded-3xl border border-stone-100 dark:border-stone-700/60 shadow-sm">
          <HelpCircle className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2 animate-pulse" />
          <p className="font-extrabold text-stone-800 dark:text-stone-100">{t('No questions found', '暂无相关提问')}</p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
            {t("No questions matched your search criteria. Try a different filter or tap 'Ask Expert' to post a new inquiry!", '没有找到符合您筛选条件的提问。请尝试其他筛选条件，或点击“在线提问”发布新咨询！')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onUpdate={handleUpdateQuestion}
              onlyVerified={onlyVerified}
            />
          ))}
        </div>
      )}
    </div>
  );
}
