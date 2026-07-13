import { useState, useEffect } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { HealthRecord, Pet } from '../types';
import { useLanguage } from '../lib/LanguageContext';

export default function ReminderService() {
  const [reminders, setReminders] = useState<HealthRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ petId: '', type: '', date: '', details: '', frequency: 'Once' as 'Once' | 'Monthly' | 'Annual' });
  const [pets, setPets] = useState<Pet[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('health_reminders');
    setReminders(saved ? JSON.parse(saved) : []);
    
    const savedPets = localStorage.getItem('pet_community_pets');
    setPets(savedPets ? JSON.parse(savedPets) : []);
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const today = new Date().toISOString().split('T')[0];
      reminders.forEach(r => {
        if (r.date === today && Notification.permission === 'granted') {
          new Notification(t('Health Task', '健康任务'), { body: `${r.type}: ${r.details}` });
        }
      });
    };
    
    checkReminders();
    const timer = setInterval(checkReminders, 60000);
    return () => clearInterval(timer);
  }, [reminders, t]);

  const addReminder = () => {
    const reminder: HealthRecord = {
      ...newReminder,
      id: Date.now().toString(),
    };
    const updated = [...reminders, reminder];
    setReminders(updated);
    localStorage.setItem('health_reminders', JSON.stringify(updated));
    setIsOpen(false);
  };

  return (
    <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-rose-500" /> {t('Upcoming Reminders', '重要日程提醒')}
        </h2>
        <button onClick={() => setIsOpen(true)} className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full hover:bg-rose-200">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {reminders.map(reminder => (
          <div key={reminder.id} className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl">
            <p className="font-semibold text-stone-900 dark:text-white">
              {reminder.type}: {reminder.details}
            </p>
            <p className="text-sm text-stone-500">{reminder.date} ({reminder.frequency})</p>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-stone-800 p-6 rounded-3xl w-full max-w-sm space-y-4">
            <h3 className="font-bold flex justify-between">
              {t('New Reminder', '新建提醒')}
              <button onClick={() => setIsOpen(false)}><X className="w-5 h-5"/></button>
            </h3>
            <select className="w-full p-2 border rounded-xl" onChange={(e) => setNewReminder({...newReminder, petId: e.target.value})}>
              <option value="">{t('Select Pet', '选择宠物')}</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="w-full p-2 border rounded-xl" placeholder={t('Task Type', '任务类型')} onChange={(e) => setNewReminder({...newReminder, type: e.target.value})} />
            <input className="w-full p-2 border rounded-xl" placeholder={t('Details', '详细说明')} onChange={(e) => setNewReminder({...newReminder, details: e.target.value})} />
            <input className="w-full p-2 border rounded-xl" type="date" onChange={(e) => setNewReminder({...newReminder, date: e.target.value})} />
            <select className="w-full p-2 border rounded-xl" onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value as any})}>
              <option value="Once">{t('Once', '单次')}</option>
              <option value="Monthly">{t('Monthly', '每月')}</option>
              <option value="Annual">{t('Annual', '每年')}</option>
            </select>
            <button onClick={addReminder} className="w-full p-3 bg-rose-500 text-white rounded-xl">{t('Save', '保存')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

