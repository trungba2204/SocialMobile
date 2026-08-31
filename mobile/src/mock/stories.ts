// M2: mock until Story API — no backend Story endpoints exist in M1.

export interface MockStory {
  id: string;
  authorName: string;
  avatarUrl: string;
  imageUrl: string;
  durationMs: number;
}

export const MOCK_STORIES: MockStory[] = [
  {
    id: 's1',
    authorName: 'Maya Okafor',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    imageUrl: 'https://picsum.photos/seed/orbit-story-1/600/1000',
    durationMs: 5000,
  },
  {
    id: 's2',
    authorName: 'Devin Park',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    imageUrl: 'https://picsum.photos/seed/orbit-story-2/600/1000',
    durationMs: 5000,
  },
  {
    id: 's3',
    authorName: 'Lena Fischer',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    imageUrl: 'https://picsum.photos/seed/orbit-story-3/600/1000',
    durationMs: 5000,
  },
  {
    id: 's4',
    authorName: 'Theo Nakamura',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    imageUrl: 'https://picsum.photos/seed/orbit-story-4/600/1000',
    durationMs: 5000,
  },
  {
    id: 's5',
    authorName: 'Priya Anand',
    avatarUrl: 'https://i.pravatar.cc/150?img=45',
    imageUrl: 'https://picsum.photos/seed/orbit-story-5/600/1000',
    durationMs: 5000,
  },
  {
    id: 's6',
    authorName: 'Sam Reyes',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    imageUrl: 'https://picsum.photos/seed/orbit-story-6/600/1000',
    durationMs: 5000,
  },
];
