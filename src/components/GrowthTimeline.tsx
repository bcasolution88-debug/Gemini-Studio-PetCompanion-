import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { HealthJournalEntry } from '../types';
import { TrendingUp } from 'lucide-react';

interface GrowthTimelineProps {
  entries: HealthJournalEntry[];
}

export default function GrowthTimeline({ entries }: GrowthTimelineProps) {
  const chartData = useMemo(() => {
    return [...entries]
      .filter(e => e.weight && e.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        date: e.date,
        weight: e.weight
      }));
  }, [entries]);

  if (chartData.length < 2) {
    return (
      <div className="p-4 text-center text-sm text-stone-500 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
        Need at least 2 weight records to show growth timeline.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-500" />
        <h3 className="font-bold text-stone-900 dark:text-stone-100">Growth Timeline</h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" stroke="#a8a29e" fontSize={10} />
            <YAxis stroke="#a8a29e" fontSize={10} />
            <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e7e5e4' }} />
            <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
