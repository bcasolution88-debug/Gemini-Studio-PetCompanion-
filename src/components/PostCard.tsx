import React, { useState } from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Send, CheckCircle, Twitter, Facebook, Mail, Link } from 'lucide-react';
import { Post } from '../types';
import { useLanguage } from '../lib/LanguageContext';

export interface PostCardProps {
  post: Post;
  onUpdate: (updatedPost: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { t } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showShareToast, setShowShareToast] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const comments = post.commentsList || [
    { id: 'c1', author: 'Emily Davis', content: 'This is the sweetest thing! So happy for you!', timestamp: '1 hour ago' },
    { id: 'c2', author: 'Alex Reed', content: 'Those ears! Welcome home, Buddy! ❤️', timestamp: '45 mins ago' }
  ].filter(() => post.id === 'p1'); // Only attach mock comments to post p1 initially

  const handleLike = () => {
    const isLiked = !post.likedByUser;
    onUpdate({
      ...post,
      likedByUser: isLiked,
      likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1)
    });
  };

  const handleSave = () => {
    const isSaved = !post.savedByUser;
    onUpdate({
      ...post,
      savedByUser: isSaved,
      saves: isSaved ? post.saves + 1 : Math.max(0, post.saves - 1)
    });
  };

  const handleSharePlatform = (platform: 'copy' | 'twitter' | 'facebook' | 'email') => {
    const shareUrl = `${window.location.origin}/community#post-${post.id}`;
    const shareText = `Check out this wonderful pet adoption success story or QA thread: "${post.content.substring(0, 75)}..."`;

    onUpdate({
      ...post,
      shares: post.shares + 1
    });

    if (platform === 'copy') {
      try {
        navigator.clipboard.writeText(shareUrl);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2500);
      } catch (e) {
        console.warn('Clipboard writing failed, iframe restriction:', e);
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent("Inspiring Pet Success Story")}&body=${encodeURIComponent(shareText + "\n\nRead the full conversation here: " + shareUrl)}`, '_blank');
    }

    setIsShareMenuOpen(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const author = commentAuthor.trim() || 'Anonymous Companion';
    const newComment = {
      id: Date.now().toString(),
      author,
      content: commentText.trim(),
      timestamp: 'Just now'
    };

    const updatedComments = [...comments, newComment];

    onUpdate({
      ...post,
      comments: updatedComments.length,
      commentsList: updatedComments
    });

    setCommentText('');
    setCommentAuthor('');
  };

  return (
    <div id={`post-${post.id}`} className="bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-orange-100 dark:border-stone-700/60 overflow-hidden hover:shadow-lg transition-all duration-300">
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post content"
          className="w-full h-72 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center mb-5">
          <div className="w-12 h-12 rounded-full bg-orange-100 mr-4 flex-shrink-0 overflow-hidden border-2 border-white dark:border-stone-700 shadow-sm">
            {post.avatarUrl ? (
              <img src={post.avatarUrl} alt={post.author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-orange-500 bg-orange-50 dark:bg-stone-900">
                {post.author.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-stone-900 dark:text-stone-50">{post.author}</h4>
            <p className="text-xs text-stone-400 font-semibold">{post.timestamp}</p>
          </div>
        </div>
        <p className="text-stone-700 dark:text-stone-300 mb-6 leading-relaxed text-base whitespace-pre-line">
          {post.content.includes('Just adopted Buddy!') 
            ? t(post.content, '刚刚领养了 Buddy！它适应得非常好，现在就已经爱上了它的新窝啦。# 领养成功') 
            : post.content.includes('Does anyone have tips for training a new kitten?') 
            ? t(post.content, '有人有训练刚出生猫咪的小建议吗？Luna 实在是有点太爱冒险了！') 
            : post.content}
        </p>
        
        <div className="flex items-center justify-between pt-5 border-t border-orange-50 dark:border-stone-700/60">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLike}
              className={`flex items-center transition-colors font-bold text-xs ${
                post.likedByUser 
                  ? 'text-rose-500 hover:text-rose-600' 
                  : 'text-stone-500 hover:text-rose-500 dark:text-stone-400'
              }`}
            >
              <Heart className={`w-5 h-5 mr-1.5 transition-transform active:scale-125 ${post.likedByUser ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likes}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center transition-colors font-bold text-xs ${
                showComments 
                  ? 'text-orange-500 hover:text-orange-600' 
                  : 'text-stone-500 hover:text-orange-500 dark:text-stone-400'
              }`}
            >
              <MessageCircle className="w-5 h-5 mr-1.5" />
              <span className="text-sm">{post.comments}</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className="flex items-center text-stone-500 hover:text-amber-600 dark:text-stone-400 transition-colors font-bold text-xs"
              >
                <Share2 className="w-5 h-5 mr-1.5" />
                <span className="text-sm">{post.shares}</span>
              </button>
 
              {isShareMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsShareMenuOpen(false)} />
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 p-2 z-20 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 px-2.5 py-1.5 uppercase tracking-wider">{t('Share story', '分享故事')}</p>
                    
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
                      <span>{t('Email Link', '通过邮件分享')}</span>
                    </button>
                  </div>
                </>
              )}
 
              {showShareToast && (
                <span className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-md flex items-center gap-1.5 font-bold whitespace-nowrap z-30 animate-fade-in-up">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> {t('Link copied!', '链接已复制！')}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={handleSave}
            className={`flex items-center transition-colors font-bold text-xs ${
              post.savedByUser 
                ? 'text-amber-500 hover:text-amber-600' 
                : 'text-stone-500 hover:text-amber-500 dark:text-stone-400'
            }`}
          >
            <Bookmark className={`w-5 h-5 transition-transform active:scale-125 ${post.savedByUser ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.saves}</span>
          </button>
        </div>
 
        {/* Comments section */}
        {showComments && (
          <div className="mt-5 pt-5 border-t border-stone-100 dark:border-stone-700/40 space-y-4">
            <h5 className="text-xs font-black text-stone-400 uppercase tracking-wider mb-2">
              {t('Discussion', '深度讨论')} ({comments.length})
            </h5>
            
            {/* Comment List */}
            {comments.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">{t('No comments yet. Start the conversation!', '暂无评论。快来发表您的看法吧！')}</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100/60 dark:border-stone-800 flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-stone-800 flex items-center justify-center font-bold text-xs text-orange-500 flex-shrink-0">
                      {comment.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">{comment.author}</span>
                        <span className="text-[9px] text-stone-400">
                          {comment.timestamp === 'Just now' ? t('Just now', '刚刚') : comment.timestamp === '1 hour ago' ? t('1 hour ago', '1 小时前') : comment.timestamp === '45 mins ago' ? t('45 mins ago', '45 分钟前') : comment.timestamp}
                        </span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 text-xs mt-0.5 leading-relaxed">
                        {comment.content === 'This is the sweetest thing! So happy for you!' 
                          ? t(comment.content, '这真是最暖心的事了！真为你感到高兴！')
                          : comment.content === 'Those ears! Welcome home, Buddy! ❤️'
                          ? t(comment.content, '大大的耳朵好可爱！欢迎来到新家，Buddy！❤️')
                          : comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('Your Name...', '您的名字...')}
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-1/3 px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                />
                <input
                  type="text"
                  placeholder={t('Write a comment...', '写下您的评论...')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                />
                <button 
                  type="submit" 
                  className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

