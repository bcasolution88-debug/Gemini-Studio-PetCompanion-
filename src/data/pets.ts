import { Pet } from '../types';

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Buddy',
    species: 'Dog',
    age: 'Puppy/Kitten',
    location: 'New York',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400',
    description: 'Energetic and playful Golden Retriever puppy looking for a loving home.',
    medicalStatus: 'Fully vaccinated, microchipped.',
    history: 'Rescued from a local shelter, has been in foster care for 2 weeks.',
    shelterName: 'Happy Paws Rescue',
    shelterPhone: '555-0101',
    birthDate: '2025-05-01',
    personalityTraits: { playfulness: 95, calmness: 30, affectionLevel: 80, intelligence: 85, energyLevels: 90 }
  },
  {
    id: '2',
    name: 'Luna',
    species: 'Cat',
    age: 'Adult',
    location: 'Los Angeles',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
    description: 'Calm and affectionate Siamese cat who loves sunny spots.',
    medicalStatus: 'Up to date on shots, spayed.',
    history: 'Surrendered by previous owner due to lifestyle change.',
    shelterName: 'City Cats Sanctuary',
    shelterPhone: '555-0202',
    birthDate: '2023-01-01',
    personalityTraits: { playfulness: 40, calmness: 85, affectionLevel: 90, intelligence: 70, energyLevels: 40 }
  },
  {
    id: '3',
    name: 'Charlie',
    species: 'Dog',
    age: 'Senior',
    location: 'Chicago',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400',
    description: 'Gentle soul seeking a quiet home to spend golden years.',
    medicalStatus: 'Needs regular joint supplements, otherwise healthy.',
    history: 'Abandoned, then found by a Good Samaritan.',
    shelterName: 'Senior Pet Home',
    shelterPhone: '555-0303',
    birthDate: '2016-01-01',
    personalityTraits: { playfulness: 20, calmness: 95, affectionLevel: 95, intelligence: 60, energyLevels: 20 }
  },
];
