import React, { useState } from 'react';
import { Heart, Share2, Check, Plus, Camera, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import CameraCapture from './CameraCapture';

interface Story {
  id: string;
  petName: string;
  adopterName: string;
  testimonial: string;
  imageUrl: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Small Pet';
  type: 'Puppy/Kitten' | 'Adult' | 'Senior';
}

const MOCK_STORIES: Story[] = [
  {
    id: '1',
    petName: 'Luna',
    adopterName: 'Sarah J.',
    testimonial: 'Adopting Luna was the best decision! She brings so much joy to our home.',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300&h=300',
    species: 'Cat',
    type: 'Adult'
  },
  {
    id: '2',
    petName: 'Max',
    adopterName: 'David M.',
    testimonial: 'Max has settled in perfectly. He loves his long walks and cuddles.',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=300&h=300',
    species: 'Dog',
    type: 'Puppy/Kitten'
  },
  {
    id: '3',
    petName: 'Bella',
    adopterName: 'Elena K.',
    testimonial: 'Bella is the sweetest senior dog. Adopting an older pet is so rewarding.',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=300&h=300',
    species: 'Dog',
    type: 'Senior'
  }
];

export default function SuccessStories() {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Dog' | 'Cat' | 'Senior' | 'Puppy/Kitten'>('All');

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('pet_companion_success_stories');
      return saved ? JSON.parse(saved) : MOCK_STORIES;
    } catch {
      return MOCK_STORIES;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newAdopterName, setNewAdopterName] = useState('');
  const [newTestimonial, setNewTestimonial] = useState('');
  const [newSpecies, setNewSpecies] = useState<'Dog' | 'Cat' | 'Bird' | 'Small Pet'>('Dog');
  const [newType, setNewType] = useState<'Puppy/Kitten' | 'Adult' | 'Senior'>('Adult');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = (imageBlob: Blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
      setShowCamera(false);
    };
    reader.readAsDataURL(imageBlob);
  };

  const handleCreateStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !newAdopterName.trim() || !newTestimonial.trim()) return;

    const newStory: Story = {
      id: `story-${Date.now()}`,
      petName: newPetName.trim(),
      adopterName: newAdopterName.trim(),
      testimonial: newTestimonial.trim(),
      imageUrl: capturedImage || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300&h=300',
      species: newSpecies,
      type: newType,
    };

    const updatedStories = [newStory, ...stories];
    setStories(updatedStories);
    try {
      localStorage.setItem('pet_companion_success_stories', JSON.stringify(updatedStories));
    } catch (e) {
      console.error('Failed to save story to localStorage:', e);
    }

    // Reset Form
    setNewPetName('');
    setNewAdopterName('');
    setNewTestimonial('');
    setCapturedImage(null);
    setShowCamera(false);
    setIsModalOpen(false);
  };

  const filteredStories = stories.filter(s => {
    if (filter === 'All') return true;
    return s.species === filter || s.type === filter;
  });

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/adoption?story=${id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-stone-900 dark:text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 animate-pulse" /> {t('Success Stories', '领养成功故事')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('Share Your Story', '分享领养故事')}
          </button>
          
          <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(['All', 'Dog', 'Cat', 'Senior', 'Puppy/Kitten'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-rose-500 text-white' : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStories.map(story => (
          <div key={story.id} className="bg-stone-50 dark:bg-stone-900 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 flex gap-4 relative animate-fade-in">
            <img src={story.imageUrl} alt={story.petName} className="w-20 h-20 rounded-xl object-cover border border-stone-200 dark:border-stone-800" />
            <div className="flex-1 pr-6">
              <p className="font-bold text-stone-900 dark:text-white">{story.petName} & {story.adopterName}</p>
              <div className="flex gap-1.5 mt-1">
                <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold">{story.species}</span>
                <span className="text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-md font-bold">{story.type}</span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 italic mt-2 leading-relaxed">"{story.testimonial}"</p>
            </div>
            <button 
              onClick={() => handleShare(story.id)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={t('Share Story', '分享故事')}
            >
              {copiedId === story.id ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Share2 className="w-4 h-4 text-stone-400" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Share Story Modal with Camera Capture */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                {t('Share Your Adoption Journey', '分享您的领养喜悦')}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCapturedImage(null);
                  setShowCamera(false);
                }}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateStorySubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    {t("Pet's Name", '宠物名字')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    placeholder={t("e.g. Luna", "例如：露娜")}
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    {t("Adopter's Name", '领养人姓名')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdopterName}
                    onChange={(e) => setNewAdopterName(e.target.value)}
                    placeholder={t("e.g. Sarah J.", "例如：杰克")}
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    {t('Species', '宠物品类')}
                  </label>
                  <select
                    value={newSpecies}
                    onChange={(e) => setNewSpecies(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white outline-none font-bold animate-fade-in"
                  >
                    <option value="Dog">{t('Dog', '狗狗')}</option>
                    <option value="Cat">{t('Cat', '猫咪')}</option>
                    <option value="Bird">{t('Bird', '鸟儿')}</option>
                    <option value="Small Pet">{t('Small Pet', '小型萌宠')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                    {t('Life Stage', '成长阶段')}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white outline-none font-bold animate-fade-in"
                  >
                    <option value="Puppy/Kitten">{t('Puppy / Kitten', '幼宠')}</option>
                    <option value="Adult">{t('Adult', '成宠')}</option>
                    <option value="Senior">{t('Senior', '老年宠')}</option>
                  </select>
                </div>
              </div>

              {/* Journey details / caption */}
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                  {t('Adoption Story & Caption', '领养旅程与感言')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTestimonial}
                  onChange={(e) => setNewTestimonial(e.target.value)}
                  placeholder={t("Tell us a bit about how they settled in and what makes them special!", "分享宠物入住后发生的小故事，或是任何有趣温暖的细节！")}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Photo Upload or Capture Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">
                  {t('Pet Photo', '宠物照片')}
                </label>
                
                {capturedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-rose-200 dark:border-rose-900">
                    <img src={capturedImage} alt="Captured Pet" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedImage(null);
                        setShowCamera(true);
                      }}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-950 text-white text-xs font-bold rounded-xl backdrop-blur-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-pulse" /> {t('Retake Photo', '重新拍摄')}
                    </button>
                  </div>
                ) : showCamera ? (
                  <div className="border border-stone-200 dark:border-stone-800 p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 animate-fade-in">
                    <CameraCapture onCapture={handleCapture} />
                    <button
                      type="button"
                      onClick={() => setShowCamera(false)}
                      className="w-full mt-2 py-2 text-stone-500 dark:text-stone-400 text-xs font-bold hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    >
                      {t('Cancel Camera', '关闭相机')}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 dark:border-stone-800 p-8 rounded-2xl bg-stone-50/50 dark:bg-stone-950/40 text-center animate-fade-in">
                    <Camera className="w-8 h-8 text-stone-400 mb-2" />
                    <p className="text-xs font-bold text-stone-600 dark:text-stone-400">{t('Capture a beautiful photo of your pet', '实时拍摄您的萌宠相片')}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5 mb-4">{t('Use your web camera to take a snap instantly', '使用摄像头即可一键拍摄并发表')}</p>
                    
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95"
                    >
                      <Camera className="w-4 h-4" /> {t('Activate Camera', '开启摄像头')}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-stone-100 dark:border-stone-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCapturedImage(null);
                    setShowCamera(false);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-all"
                >
                  {t('Cancel', '取消')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                >
                  {t('Publish Journey', '发布喜悦')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
