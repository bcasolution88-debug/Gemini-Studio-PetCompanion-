import { Post } from '../types';

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
    content: 'Just adopted Buddy! He is settling in so well and already loves his new bed. #AdoptionSuccess',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800',
    likes: 124,
    comments: 12,
    shares: 5,
    saves: 20,
    timestamp: '2 hours ago',
  },
  {
    id: 'p2',
    author: 'Mark Smith',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    content: 'Does anyone have tips for training a new kitten? Luna is a bit adventurous!',
    likes: 85,
    comments: 34,
    shares: 2,
    saves: 15,
    timestamp: '5 hours ago',
  },
];
