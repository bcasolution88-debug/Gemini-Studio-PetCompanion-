import React, { useState } from 'react';
import { ThumbsUp, CheckCircle, Send, Plus, Award, User, HelpCircle, Share2, Twitter, Facebook, Mail, Link, Check } from 'lucide-react';
import { Question, Answer } from '../types';
import { useLanguage } from '../lib/LanguageContext';

interface QuestionCardProps {
  question: Question;
  onUpdate: (updatedQuestion: Question) => void;
  onlyVerified: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onUpdate, onlyVerified }) => {
  const { t } = useLanguage();
  const [answerAuthor, setAnswerAuthor] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const baseAnswers = question.answersList || [
    { id: 'ans-1', questionId: '1', author: 'Dr. Evelyn Carter (DVM)', content: 'Try mixing it with warm water for a few days to soften it. You can also mix in a spoonful of wet puppy food to make the scent more appealing and stimulate their appetite!', upvotes: 12, timestamp: '30m ago' }
  ].filter(a => a.questionId === question.id);

  const answers = onlyVerified
    ? baseAnswers.filter(a => a.author.toLowerCase().includes('dvm') || a.author.toLowerCase().includes('expert'))
    : baseAnswers;

  const toggleStatus = () => {
    const nextStatus = question.status === 'open' ? 'resolved' : 'open';
    onUpdate({
      ...question,
      status: nextStatus
    });
  };

  const handleUpvote = (answerId: string) => {
    const updatedAnswers = answers.map(a => 
      a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a
    );
    onUpdate({
      ...question,
      answersList: updatedAnswers
    });
  };

  const handleAddAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    const author = answerAuthor.trim() || 'Expert Vet Parent';
    const newAnswer: Answer = {
      id: `ans-${Date.now()}`,
      questionId: question.id,
      author,
      content: answerContent.trim(),
      upvotes: 0,
      timestamp: 'Just now'
    };

    const updatedAnswers = [...baseAnswers, newAnswer];
    onUpdate({
      ...question,
      answersList: updatedAnswers
    });

    setAnswerContent('');
    setAnswerAuthor('');
    setShowAnswerForm(false);
  };

  const handleSharePlatform = (platform: 'copy' | 'twitter' | 'facebook' | 'email') => {
    const shareUrl = `${window.location.origin}/community#question-${question.id}`;
    const shareText = `Check out this Q&A discussion on our Pet Community: "${question.title}"`;

    if (platform === 'copy') {
      try {
        navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch (e) {
        console.warn('Clipboard write failed:', e);
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent("Pet Community Q&A Thread")}&body=${encodeURIComponent(shareText + "\n\nJoin the discussion here: " + shareUrl)}`, '_blank');
    }

    setIsShareMenuOpen(false);
  };

  return (
    <div id={`question-${question.id}`} className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700/60 hover:shadow-md transition-all">
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              question.status === 'resolved' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
            }`}>
              {question.status === 'resolved' ? t('✅ Resolved', '✅ 已解决') : t('❓ Open', '❓ 待解决')}
            </span>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
              {t('Asked by ', '提问者：')}{question.author === 'Mark Jenkins' ? t('Mark Jenkins', '马克·詹金斯') : question.author === 'Sarah Wood' ? t('Sarah Wood', '莎拉·伍德') : question.author} • {question.timestamp === '2 hours ago' ? t('2 hours ago', '2 小时前') : question.timestamp === '1 day ago' ? t('1 day ago', '1 天前') : question.timestamp === 'Just now' ? t('Just now', '刚刚') : question.timestamp}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5 pt-1">
            <HelpCircle className="w-5 h-5 text-orange-500 shrink-0" />{' '}
            {question.title === 'How to transition a new puppy to dry food?' 
              ? t(question.title, '如何让刚到家的小狗过渡到干粮？')
              : question.title === 'How often should a house cat get a grooming session?'
              ? t(question.title, '家猫多久应该做一次美容护理？')
              : question.title}
          </h3>
        </div>

        {/* Actions layout */}
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Share Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
              className="p-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 hover:text-rose-500 dark:text-stone-400 transition-all active:scale-95 cursor-pointer"
              title={t("Share Discussion", "分享讨论")}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isShareMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsShareMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 p-2 z-20 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 px-2.5 py-1.5 uppercase tracking-wider">{t('Share QA', '分享问答')}</p>
                  
                  <button
                    onClick={() => handleSharePlatform('copy')}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <Link className="w-4 h-4 text-rose-500" />
                    <span>{t('Copy Link', '复制链接')}</span>
                  </button>

                  <button
                    onClick={() => handleSharePlatform('twitter')}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <Twitter className="w-4 h-4 text-sky-500 fill-current" />
                    <span>{t('Share on X', '分享到 X')}</span>
                  </button>

                  <button
                    onClick={() => handleSharePlatform('facebook')}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <Facebook className="w-4 h-4 text-blue-600 fill-current" />
                    <span>{t('Facebook', '分享到 Facebook')}</span>
                  </button>

                  <button
                    onClick={() => handleSharePlatform('email')}
                    className="flex items-center gap-2.5 w-full px-2.5 py-2 text-xs rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span>{t('Email QA', '通过邮件分享')}</span>
                  </button>
                </div>
              </>
            )}

            {showShareToast && (
              <span className="absolute bottom-10 right-0 bg-stone-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-md flex items-center gap-1.5 font-bold whitespace-nowrap z-30 animate-fade-in-up">
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> {t('Link copied!', '链接已复制！')}
              </span>
            )}
          </div>

          {/* Toggle Status */}
          <button 
            onClick={toggleStatus}
            className={`flex items-center text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all shrink-0 active:scale-95 cursor-pointer ${
              question.status === 'resolved'
                ? 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500'
                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            {question.status === 'resolved' ? t('Reopen', '重新打开') : t('Resolve', '标记解决')}
          </button>
        </div>
      </div>

      <p className="text-stone-700 dark:text-stone-300 text-sm mb-6 leading-relaxed bg-stone-50/50 dark:bg-stone-950/30 p-4 rounded-2xl border border-stone-100/60 dark:border-stone-800 font-medium whitespace-pre-line">
        {question.body.includes('3-month-old golden retriever') 
          ? t(question.body, '我刚刚领养了一只3个月大的金毛幼犬，它吃新的干粮很费劲。它总是忽略食盆，而且嚼干颗粒似乎也很吃力。')
          : question.body.includes('Siamese cat is mostly indoors')
          ? t(question.body, '我的暹罗猫基本在室内生活。我每周都会给它刷毛，但想了解是否需要专业的美容、洗澡或剪指甲，以及频率是怎样的。')
          : question.body}
      </p>
      
      {/* Answers Section */}
      <div className="space-y-4 border-t border-stone-100 dark:border-stone-700/60 pt-5">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest">{t('Expert Advice', '专家建议')} ({answers.length})</h4>
          <button
            onClick={() => setShowAnswerForm(!showAnswerForm)}
            className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
          >
            <Plus className="w-3.5 h-3.5" /> {t('Post Answer', '发表回答')}
          </button>
        </div>

        {/* Answers List */}
        {answers.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-2">{t("No suggestions logged yet. Click 'Post Answer' to help this parent!", '暂无建议。点击“发表回答”来提供帮助吧！')}</p>
        ) : (
          <div className="space-y-3">
            {answers.map(answer => (
              <div 
                key={answer.id} 
                className="bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-2xl border border-stone-100 dark:border-stone-800 flex justify-between items-start gap-4 hover:border-orange-100 dark:hover:border-stone-700 transition-all"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-stone-800 flex items-center justify-center font-bold text-[10px] text-rose-500">
                      {answer.author.charAt(0)}
                    </span>
                    <span className="text-xs font-extrabold text-stone-900 dark:text-white flex items-center gap-1">
                      {answer.author.includes('Evelyn Carter') 
                        ? t(answer.author, 'Evelyn Carter 博士 (执业兽医)') 
                        : answer.author.includes('Groomer Pro')
                        ? t(answer.author, '专业美容师 (专家)')
                        : answer.author === 'Expert Vet Parent'
                        ? t(answer.author, '资深兽医家长')
                        : answer.author}
                      {answer.author.toLowerCase().includes('dvm') || answer.author.toLowerCase().includes('expert') ? (
                        <Award className="w-3.5 h-3.5 text-rose-500" title={t("Verified Professional", "已认证专业人士")} />
                      ) : null}
                    </span>
                    <span className="text-[10px] text-stone-400 font-semibold">
                      {answer.timestamp === '1 hour ago' ? t('1 hour ago', '1 小时前') : answer.timestamp === '18 hours ago' ? t('18 hours ago', '18 小时前') : answer.timestamp === 'Just now' ? t('Just now', '刚刚') : answer.timestamp === '30m ago' ? t('30m ago', '30 分钟前') : answer.timestamp}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 text-xs leading-relaxed pl-7">
                    {answer.content.includes('mixing it with warm water') 
                      ? t(answer.content, '尝试用温水泡软几天。也可以拌入一勺幼犬湿粮（罐头），增加香气以刺激食欲！')
                      : answer.content.includes('Indoor cats are generally very good')
                      ? t(answer.content, '室内猫通常非常擅长自我清洁。每周彻底刷毛一次非常有助于预防毛球。如果它们无法自然磨损指甲，建议每 3-4 周进行一次专业修剪。除非特别脏，否则很少需要洗澡！')
                      : answer.content}
                  </p>
                </div>

                <button 
                  onClick={() => handleUpvote(answer.id)}
                  className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 hover:text-rose-500 transition-all active:scale-90 shadow-sm"
                  title={t("Upvote Answer", "赞同回答")}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{answer.upvotes}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Answer Addition Form */}
        {showAnswerForm && (
          <form onSubmit={handleAddAnswer} className="p-4 bg-orange-50/30 dark:bg-stone-900/60 rounded-2xl border border-orange-100/40 dark:border-stone-800 space-y-3 animate-fade-in-up">
            <h5 className="text-xs font-bold text-stone-900 dark:text-white">{t('Provide Your Recommendation', '提供您的建议')}</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t("Your Name (e.g., Dr. Jenkins DVM)", "您的姓名 (例如: 詹金斯医生)")}
                value={answerAuthor}
                onChange={(e) => setAnswerAuthor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
              />
            </div>
            <textarea
              required
              rows={2}
              placeholder={t("What solutions do you propose? Provide detailed, actionable guidelines...", "您建议如何解决？请提供详细且可操作的指导建议...")}
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAnswerForm(false)}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold rounded-lg transition-all"
              >
                {t('Cancel', '取消')}
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> {t('Submit Answer', '提交回答')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;

