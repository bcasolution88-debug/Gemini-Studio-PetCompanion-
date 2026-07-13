import React, { useState, useEffect } from 'react';
import { Bell, Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { HealthJournalEntry } from '../types';
import { useLanguage } from '../lib/LanguageContext';

type RoutineType = 'feeding' | 'grooming' | 'medication';

interface CareRoutine {
  id: string;
  name: string;
  type: RoutineType;
  frequency: 'daily' | 'weekly';
  time: string;
  lastDone: string | null;
}

export default function CareRoutinePlanner() {
  const [routines, setRoutines] = useState<CareRoutine[]>([]);
  const [newRoutine, setNewRoutine] = useState({ name: '', type: 'feeding' as RoutineType, frequency: 'daily' as 'daily' | 'weekly', time: '08:00' });
  const { t } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem('care_routines');
    if (saved) setRoutines(JSON.parse(saved));
  }, []);

  const saveRoutine = () => {
    const routine: CareRoutine = { ...newRoutine, id: Date.now().toString(), lastDone: null };
    const updated = [...routines, routine];
    setRoutines(updated);
    localStorage.setItem('care_routines', JSON.stringify(updated));
    setNewRoutine({ name: '', type: 'feeding', frequency: 'daily', time: '08:00' });
  };

  const markDone = (routine: CareRoutine) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = routines.map(r => r.id === routine.id ? { ...r, lastDone: today } : r);
    setRoutines(updated);
    localStorage.setItem('care_routines', JSON.stringify(updated));

    // Add to Journal
    const journalSaved = localStorage.getItem('pet_health_journal_entries');
    const journal: HealthJournalEntry[] = journalSaved ? JSON.parse(journalSaved) : [];
    journal.push({
        id: Date.now().toString(),
        petId: '1', // Simplified, assuming a pet
        date: today,
        activity: `${routine.type === 'feeding' ? 'Feeding' : routine.type === 'grooming' ? 'Grooming' : 'Medication'}: ${routine.name} completed`,
        weight: 0,
        mood: '',
        moodTags: []
    });
    localStorage.setItem('pet_health_journal_entries', JSON.stringify(journal));
    
    if (Notification.permission === 'granted') {
        new Notification(t('Routine Completed', '例行任务已完成'), { body: routine.name });
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-stone-900 dark:text-white">
        <Clock className="w-5 h-5 text-indigo-500" /> {t('Care Routine Planner', '例行护理计划')}
      </h2>

      <div className="space-y-3 mb-6">
        {routines.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-800 rounded-xl">
                <div>
                    <p className="font-semibold text-stone-900 dark:text-white">{r.name} ({r.type})</p>
                    <p className="text-xs text-stone-500">{r.frequency} @ {r.time}</p>
                </div>
                <button onClick={() => markDone(r)} className={`p-2 rounded-full ${r.lastDone === new Date().toISOString().split('T')[0] ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input className="col-span-2 p-2 border rounded-xl" placeholder={t('Task Name', '任务名称')} value={newRoutine.name} onChange={e => setNewRoutine({...newRoutine, name: e.target.value})} />
        <select className="p-2 border rounded-xl" value={newRoutine.type} onChange={e => setNewRoutine({...newRoutine, type: e.target.value as RoutineType})}>
            <option value="feeding">Feeding</option>
            <option value="grooming">Grooming</option>
            <option value="medication">Medication</option>
        </select>
        <select className="p-2 border rounded-xl" value={newRoutine.frequency} onChange={e => setNewRoutine({...newRoutine, frequency: e.target.value as 'daily' | 'weekly'})}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
        </select>
        <input type="time" className="col-span-2 p-2 border rounded-xl" value={newRoutine.time} onChange={e => setNewRoutine({...newRoutine, time: e.target.value})} />
        <button onClick={saveRoutine} className="col-span-2 p-3 bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> {t('Add Routine', '添加例行任务')}
        </button>
      </div>
    </div>
  );
}
