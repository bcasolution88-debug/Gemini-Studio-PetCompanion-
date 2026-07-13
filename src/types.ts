export interface Pet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Small Pet';
  age: 'Puppy/Kitten' | 'Adult' | 'Senior';
  location: string;
  imageUrl: string;
  description: string;
  medicalStatus: string;
  history: string;
  shelterName: string;
  shelterPhone: string;
  birthDate?: string;
  breed?: string;
  personalityTraits?: {
    playfulness: number;
    calmness: number;
    affectionLevel: number;
    intelligence: number;
    energyLevels: number;
  };
}

export interface Post {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  timestamp: string;
  likedByUser?: boolean;
  savedByUser?: boolean;
  commentsList?: { id: string; author: string; content: string; timestamp: string }[];
}
export interface Answer {
  id: string;
  questionId: string;
  author: string;
  content: string;
  upvotes: number;
  timestamp: string;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  author: string;
  status: 'open' | 'resolved';
  timestamp: string;
  answersList?: Answer[];
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: string;
  date: string;
  details: string;
  frequency?: 'Once' | 'Monthly' | 'Annual';
}

export interface HealthJournalEntry {
  id: string;
  petId: string;
  date: string;
  activity: string;
  weight: number;
  mood: string;
  moodTags?: string[];
  photo?: string;
}

export interface Playdate {
  id: string;
  petId: string;
  requesterId: string;
  date: string;
  location: string;
  status: 'pending' | 'accepted' | 'declined';
  notes?: string;
}
