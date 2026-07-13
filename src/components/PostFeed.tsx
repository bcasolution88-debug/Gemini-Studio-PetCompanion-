import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_POSTS } from '../data/posts';
import { PostCard } from './PostCard';
import { Post } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import { 
  Plus, Search, SlidersHorizontal, Image, Tag, 
  Sparkles, CheckCircle2, MessageSquare, Heart, Bookmark 
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Happy Golden', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600' },
  { label: 'Playful Kitten', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600' },
  { label: 'Cuddly Bunny', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600' },
  { label: 'Colorful Parrot', url: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=600' }
];

export default function PostFeed() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('pet_community_posts');
      return saved ? JSON.parse(saved) : MOCK_POSTS;
    } catch {
      return MOCK_POSTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  
  // Create Post States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [customTag, setCustomTag] = useState('#Tips');
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    localStorage.setItem('pet_community_posts', JSON.stringify(posts));
  }, [posts]);

  // Available tags in the community feed
  const tags = ['All', '#AdoptionSuccess', '#Tips', '#DailyPet', '#Saved'];

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Search matches author or content
      const matchesSearch = 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Filter by tags
      if (selectedTag === 'All') return true;
      if (selectedTag === '#Saved') return !!post.savedByUser;
      
      return post.content.toLowerCase().includes(selectedTag.toLowerCase());
    });
  }, [posts, searchQuery, selectedTag]);

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const author = authorName.trim() || 'Proud Pet Parent';
    
    // Auto-generate tag if not explicitly added in content
    let finalContent = postContent;
    if (customTag && !postContent.toLowerCase().includes(customTag.toLowerCase())) {
      finalContent = `${postContent}\n\n${customTag}`;
    }

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author,
      content: finalContent,
      imageUrl: selectedImageUrl || undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      timestamp: 'Just now',
      commentsList: []
    };

    setPosts([newPost, ...posts]);
    
    // Play sound feedback
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chord vibe
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (_) {}

    // Reset Form
    setPostContent('');
    setAuthorName('');
    setSelectedImageUrl('');
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-orange-100 dark:border-stone-700/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={t("Search discussions...", "搜索社区讨论...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
        </div>

        {/* Filter tags buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                selectedTag === tag
                  ? 'bg-rose-500 text-white shadow-sm scale-105'
                  : 'bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-100 dark:border-stone-800'
              }`}
            >
              {tag === 'All' ? t('All', '全部') : tag === '#AdoptionSuccess' ? t('#AdoptionSuccess', '# 领养成功') : tag === '#Tips' ? t('#Tips', '# 养宠贴士') : tag === '#DailyPet' ? t('#DailyPet', '# 日常爱宠') : tag === '#Saved' ? t('#Saved', '# 我的收藏') : tag}
            </button>
          ))}
        </div>

        {/* Create Post Button */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> {t('Tell a Story', '发布动态')}
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {t('Community post shared successfully! Check the feed below.', '社区动态分享成功！已展示在下方动态中。')}
        </div>
      )}

      {/* Collapsible Create Post Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl border border-orange-100 dark:border-stone-700/60 shadow-sm space-y-4 animate-fade-in-down">
          <h3 className="font-extrabold text-stone-950 dark:text-white text-base flex items-center gap-1.5 border-b border-stone-100 dark:border-stone-700/40 pb-2.5">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" /> {t('Post to Community', '发布动态到社区')}
          </h3>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Author name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Your Name', '您的姓名')}</label>
                <input
                  type="text"
                  placeholder={t("e.g. Jessica Thompson", "例如：张伟")}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none"
                />
              </div>

              {/* Tag choice */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Topic Tag', '话题标签')}</label>
                <select
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
                >
                  <option value="#Tips">{t('#Tips (Training & Care)', '# 养宠贴士 (训练与护理)')}</option>
                  <option value="#AdoptionSuccess">{t('#AdoptionSuccess (Pet story)', '# 领养成功 (宠物故事)')}</option>
                  <option value="#DailyPet">{t('#DailyPet (Fun moments)', '# 日常爱宠 (趣味瞬间)')}</option>
                  <option value="#Help">{t('#Help (Questions & support)', '# 寻求帮助 (提问与互助)')}</option>
                </select>
              </div>
            </div>

            {/* Post content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t('Story / Thoughts', '故事 / 想法')}</label>
              <textarea
                required
                rows={3}
                placeholder={t("What is on your mind? Share tips, adoption updates, or milestones!", "分享一下您和宠物的故事、心得或近期动态吧！")}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none"
              />
            </div>

            {/* Photo preset picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                <Image className="w-3.5 h-3.5" /> {t('Select Preset Image (Optional)', '选择预设配图 (可选)')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setSelectedImageUrl(selectedImageUrl === img.url ? '' : img.url)}
                    className={`p-1 bg-stone-50 dark:bg-stone-900 border rounded-xl overflow-hidden text-center transition-all ${
                      selectedImageUrl === img.url
                        ? 'border-rose-500 ring-2 ring-rose-500/20 scale-[1.02]'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-16 object-cover rounded-lg" />
                    <span className="text-[10px] font-bold text-stone-500 mt-1 block truncate px-1">
                      {img.label === 'Happy Golden' ? t('Happy Golden', '开心的金毛') : img.label === 'Playful Kitten' ? t('Playful Kitten', '调皮的猫咪') : img.label === 'Cuddly Bunny' ? t('Cuddly Bunny', '软萌的小兔') : img.label === 'Colorful Parrot' ? t('Colorful Parrot', '斑斓的鹦鹉') : img.label}
                    </span>
                  </button>
                ))}
              </div>
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
                {t('Share Post', '发布动态')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-stone-800 p-12 text-center rounded-3xl border border-orange-100 dark:border-stone-700/60 shadow-sm">
          <MessageSquare className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600 mb-2 animate-pulse" />
          <p className="font-extrabold text-stone-800 dark:text-stone-100">{t('No posts found', '暂无相关动态')}</p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
            {t("We couldn't find any posts matching your filters. Create the first one yourself by clicking 'Tell a Story'!", '未找到匹配您筛选条件的动态。点击“发布动态”分享您的第一个精彩瞬间吧！')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdate={handleUpdatePost} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
