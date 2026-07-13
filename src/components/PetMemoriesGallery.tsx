import React, { useState, useMemo } from 'react';
import { Camera, Sparkles, Plus, Trash2, Image as ImageIcon, Calendar, Search, Expand, X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string; // ISO String
  tags?: string[];
  isFavorite?: boolean;
}

export default function PetMemoriesGallery() {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSlideshowIndex, setActiveSlideshowIndex] = useState<number | null>(null);

  const filteredMemories = useMemo(() => {
    if (!searchTerm) return memories;
    const lowerTerm = searchTerm.toLowerCase();
    return memories.filter(m => 
      m.caption.toLowerCase().includes(lowerTerm) ||
      m.tags?.some(tag => tag.toLowerCase().includes(lowerTerm)) ||
      new Date(m.createdAt).toLocaleDateString().includes(lowerTerm)
    );
  }, [memories, searchTerm]);

  const sortedMemories = useMemo(() => {
    return [...filteredMemories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredMemories]);

  const groupedMemories = useMemo(() => {
    return sortedMemories.reduce((acc, memory) => {
      const date = new Date(memory.createdAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(memory);
      return acc;
    }, {} as Record<string, Memory[]>);
  }, [sortedMemories]);

  const handleGeneratePortrait = async () => {
    setLoadingAI(true);
    try {
      const imageUrl = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300'; // Mock AI image
      
      // Call caption generation API
      const res = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ imageUrl })
      });
      const data = await res.json();
      
      const newMemory: Memory = {
        id: Date.now().toString(),
        imageUrl: imageUrl,
        caption: data.caption || t('AI Stylized Portrait', 'AI 风格化肖像'),
        createdAt: new Date().toISOString(),
        isFavorite: false,
      };
      setMemories([newMemory, ...memories]);
    } catch (error) {
      console.error(t('Failed to generate portrait', '生成肖像失败'), error);
    } finally {
      setLoadingAI(false);
    }
  };

  const deleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
    setActiveSlideshowIndex(null);
  };

  const toggleFavorite = (id: string) => {
    setMemories(memories.map(m => m.id === id ? { ...m, isFavorite: !m.isFavorite } : m));
  };

  const openSlideshow = (memoryId: string) => {
    const index = sortedMemories.findIndex(m => m.id === memoryId);
    if (index !== -1) setActiveSlideshowIndex(index);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSlideshowIndex === null) return;
      
      if (e.key === 'Escape') setActiveSlideshowIndex(null);
      if (e.key === 'ArrowLeft' && activeSlideshowIndex > 0) setActiveSlideshowIndex(activeSlideshowIndex - 1);
      if (e.key === 'ArrowRight' && activeSlideshowIndex < sortedMemories.length - 1) setActiveSlideshowIndex(activeSlideshowIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideshowIndex, sortedMemories.length]);

  return (
    <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-rose-500" /> {t('Pet Memories', '宠物记忆相册')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleGeneratePortrait}
            disabled={loadingAI}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loadingAI ? t('Generating...', '正在生成...') : <><Sparkles className="w-4 h-4" /> {t('AI Portrait', 'AI 肖像')}</>}
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm rounded-2xl transition-all shadow-sm active:scale-95">
            <Plus className="w-4 h-4" /> {t('Capture', '记录')}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder={t('Search memories by date or tag...', '按日期或标签搜索记忆...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
        />
      </div>

      {filteredMemories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-3xl">
          <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">
            {memories.length === 0 
              ? t('No memories yet', '还没有记忆瞬间')
              : t('No results found', '未找到匹配结果')}
          </p>
          {memories.length === 0 && (
            <p className="text-sm text-stone-400">{t('Capture a moment or generate an AI portrait!', '捕捉一个瞬间或生成一张 AI 肖像吧！')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMemories).map(([date, groupMemories]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-widest">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(groupMemories as Memory[]).map((memory) => (
                  <div key={memory.id} className="relative group rounded-2xl overflow-hidden aspect-square">
                    <img src={memory.imageUrl} alt={memory.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-xs font-bold truncate">{memory.caption}</p>
                    </div>
                    <button 
                      onClick={() => deleteMemory(memory.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openSlideshow(memory.id)}
                      className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Expand className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleFavorite(memory.id)}
                      className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all ${memory.isFavorite ? 'bg-rose-500 text-white' : 'bg-white/20 text-white opacity-0 group-hover:opacity-100'}`}
                    >
                      <Heart className="w-4 h-4" fill={memory.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slideshow Overlay */}
      {activeSlideshowIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setActiveSlideshowIndex(null)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"><X /></button>
          
          <button 
            disabled={activeSlideshowIndex === 0}
            onClick={() => setActiveSlideshowIndex(activeSlideshowIndex - 1)}
            className="absolute left-4 text-white p-4 disabled:opacity-30"
          >
            <ChevronLeft size={48} />
          </button>
          
          <div className="max-w-4xl w-full">
            <img 
              src={sortedMemories[activeSlideshowIndex].imageUrl} 
              alt={sortedMemories[activeSlideshowIndex].caption} 
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg" 
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-white font-bold">{sortedMemories[activeSlideshowIndex].caption}</p>
              <button 
                onClick={() => toggleFavorite(sortedMemories[activeSlideshowIndex].id)}
                className={`p-2 rounded-full ${sortedMemories[activeSlideshowIndex].isFavorite ? 'text-rose-500' : 'text-white'}`}
              >
                <Heart className="w-6 h-6" fill={sortedMemories[activeSlideshowIndex].isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <button 
            disabled={activeSlideshowIndex === sortedMemories.length - 1}
            onClick={() => setActiveSlideshowIndex(activeSlideshowIndex + 1)}
            className="absolute right-4 text-white p-4 disabled:opacity-30"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}
