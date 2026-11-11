import { useState, useEffect } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { HealthRecord, Pet } from '../types';
import { useLanguage } from '../lib/LanguageContext';
import Modal from './ui/Modal';
import { IconButton } from './ui/IconButton';

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
            <p className="text-body text-stone-500">{reminder.date} ({reminder.frequency})</p>
          </div>
        ))}
      </div>

      {isOpen && (
        <Modal
          open
          onClose={() => setIsOpen(false)}
          labelledBy="new-reminder-title"
          size="sm"
          panelClassName="p-6 space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="new-reminder-title" className="font-bold text-title text-stone-900 dark:text-white">
              {t('New Reminder', '新建提醒')}
            </h3>
            <IconButton
              aria-label={t('Close new reminder', '关闭新建提醒')}
              icon={<X className="w-5 h-5" />}
              onClick={() => setIsOpen(false)}
            />
          </div>
          <select aria-label={t('Select pet', '选择宠物')} className="w-full p-2 border rounded-control bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" onChange={(e) => setNewReminder({...newReminder, petId: e.target.value})}>
            <option value="">{t('Select Pet', '选择宠物')}</option>
            {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input aria-label={t('Task type', '任务类型')} className="w-full p-2 border rounded-control bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" placeholder={t('Task Type', '任务类型')} onChange={(e) => setNewReminder({...newReminder, type: e.target.value})} />
          <input aria-label={t('Details', '详细说明')} className="w-full p-2 border rounded-control bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" placeholder={t('Details', '详细说明')} onChange={(e) => setNewReminder({...newReminder, details: e.target.value})} />
          <input aria-label={t('Reminder date', '提醒日期')} className="w-full p-2 border rounded-control bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" type="date" onChange={(e) => setNewReminder({...newReminder, date: e.target.value})} />
          <select aria-label={t('Frequency', '重复频率')} className="w-full p-2 border rounded-control bg-white dark:bg-stone-900 dark:border-stone-700 text-stone-900 dark:text-white" onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value as any})}>
            <option value="Once">{t('Once', '单次')}</option>
            <option value="Monthly">{t('Monthly', '每月')}</option>
            <option value="Annual">{t('Annual', '每年')}</option>
          </select>
          <button onClick={addReminder} className="w-full p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-control font-semibold transition-colors">
            {t('Save', '保存')}
          </button>
        </Modal>
      )}
    </div>
  );
}

