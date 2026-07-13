import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PersonalityRadarProps {
  traits: {
    playfulness: number;
    affectionLevel: number;
    intelligence: number;
    energyLevels: number;
  };
}

export default function PersonalityRadar({ traits }: PersonalityRadarProps) {
  const data = [
    { subject: 'Playfulness', A: traits.playfulness },
    { subject: 'Cuddle Intensity', A: traits.affectionLevel },
    { subject: 'Intelligence', A: traits.intelligence },
    { subject: 'Energy Levels', A: traits.energyLevels },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar name="Traits" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
