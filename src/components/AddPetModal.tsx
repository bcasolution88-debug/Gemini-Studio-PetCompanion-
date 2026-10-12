import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CameraCapture from './CameraCapture';
import { Pet } from '../types';
import { MOCK_PETS } from '../data/pets';
import { useLanguage } from '../lib/LanguageContext';
import { isSoundEnabled } from '../lib/utils';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPetAdded?: (newPet: Pet) => void;
}

export default function AddPetModal({ isOpen, onClose, onPetAdded }: AddPetModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'Dog' | 'Cat' | 'Bird' | 'Small Pet'>('Dog');
  const [age, setAge] = useState<'Puppy/Kitten' | 'Adult' | 'Senior'>('Adult');
  const [location, setLocation] = useState('New York');
  const [description, setDescription] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const { t } = useLanguage();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let imageUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';
    const newPetId = `pet-${Date.now()}`;

    try {
      if (photoBlob && storage && db) {
        const storageRef = ref(storage, `pets/${Date.now()}.jpg`);
        await uploadBytes(storageRef, photoBlob);
        imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'pets'), {
          id: newPetId,
          name,
          species,
          age,
          location,
          imageUrl,
          description,
          medicalStatus: 'Fully vaccinated, microchipped.',
          history: 'Foster care',
          shelterName: 'Happy Paws Rescue',
          shelterPhone: '555-0101',
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.warn('Firebase save failed or database not fully provisioned. Falling back to local storage:', err);
    }

    const newPet: Pet = {
      id: newPetId,
      name: name.trim() || 'Unnamed Companion',
      species,
      age,
      location: location.trim() || 'New York',
      imageUrl,
      description: description.trim() || 'A lovable companion waiting for a cozy home.',
      medicalStatus: 'Up to date on all shots, healthy.',
      history: 'Rescued locally, friendly and ready for adoption.',
      shelterName: 'Happy Paws Rescue',
      shelterPhone: '555-0101',
      createdAt: Date.now()
    } as any;

    // Save locally
    try {
      const saved = localStorage.getItem('pet_community_pets');
      const currentPets = saved ? JSON.parse(saved) : MOCK_PETS;
      localStorage.setItem('pet_community_pets', JSON.stringify([newPet, ...currentPets]));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }

    // Trigger local audio effect for success
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && isSoundEnabled()) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (_) {}

    if (onPetAdded) {
      onPetAdded(newPet);
    }

    // Reset states
    setName('');
    setSpecies('Dog');
    setAge('Adult');
    setLocation('New York');
    setDescription('');
    setPhotoBlob(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 max-w-md w-full relative border border-orange-50 dark:border-stone-700/60 shadow-xl overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black mb-5 text-stone-900 dark:text-white border-b pb-2">{t('Add New Companion', '登记发布待领养宠物')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Companion Photo', '上传或拍摄宠物照片')}</label>
            <CameraCapture onCapture={setPhotoBlob} />
            <p className="text-[10px] text-stone-400 italic mt-0.5">{t('Note: If no camera photo is captured, a cute fallback placeholder will be set.', '提示：若未通过相机拍照上传，系统将自动分配一张可爱的插图作为头像。')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Pet Name', '宠物姓名')}</label>
              <input 
                type="text" 
                required
                placeholder={t('Buddy', '例如：小白')} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Location', '所在城市')}</label>
              <input 
                type="text" 
                placeholder={t('New York', '纽约 / 北京')} 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Species', '宠物类别')}</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
              >
                <option value="Dog">{t('Dog', '狗狗 🐶')}</option>
                <option value="Cat">{t('Cat', '猫咪 🐱')}</option>
                <option value="Bird">{t('Bird', '鸟类 🐦')}</option>
                <option value="Small Pet">{t('Small Pet', '小型萌宠 🐹')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Age Group', '年龄阶段')}</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none font-bold"
              >
                <option value="Puppy/Kitten">{t('Puppy / Kitten', '幼年期 (幼犬/幼猫)')}</option>
                <option value="Adult">{t('Adult', '成年期')}</option>
                <option value="Senior">{t('Senior', '老年期')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Description', '宠物情况及特点描述')}</label>
            <textarea 
              rows={2}
              placeholder={t('Friendly, loves kids and other cats...', '例：性格亲切温顺，黏人，已驱虫接种疫苗...')} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-white outline-none resize-none" 
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 shadow-md mt-2"
          >
            {t('Publish Companion profile', '立即登记发布宠物档案')}
          </button>
        </form>
      </div>
    </div>
  );
}
