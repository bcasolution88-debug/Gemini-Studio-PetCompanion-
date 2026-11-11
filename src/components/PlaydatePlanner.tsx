import React, { useState } from 'react';
import { Pet } from '../types';
import { createPlaydate } from '../lib/firestoreData';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface PlaydatePlannerProps {
  pet: Pet;
  onClose: () => void;
}

export default function PlaydatePlanner({ pet, onClose }: PlaydatePlannerProps) {
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSchedule = async () => {
    if (!date || !location) return;
    setLoading(true);
    setError(null);
    try {
      const createdId = await createPlaydate({
        petId: pet.id,
        petName: pet.name,
        date,
        location,
        notes: notes.trim() || undefined,
      });
      if (!createdId) {
        setError('Please sign in to request a playdate.');
        return;
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-4">
      <h3 className="text-lg font-bold">Schedule a Playdate with {pet.name}</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2 border p-2 rounded">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent" />
        </div>
        <div className="flex items-center gap-2 border p-2 rounded">
          <MapPin className="w-5 h-5 text-indigo-500" />
          <input type="text" placeholder="Meeting Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent" />
        </div>
        <textarea placeholder="Notes for the owner" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSchedule} disabled={loading} className="flex-1 bg-indigo-600 text-white p-2 rounded">
          {loading ? 'Scheduling...' : 'Request Playdate'}
        </button>
        <button onClick={onClose} className="flex-1 bg-stone-100 p-2 rounded">Cancel</button>
      </div>
      {error && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}
