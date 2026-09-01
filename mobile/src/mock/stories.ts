// M2: stories are mock data until the Story API ships — no backend Story endpoints exist in M1.

export interface MockStory {
  id: string;
  imageUrl: string;
  durationMs: number;
}

export interface MockStoryAuthor {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface MockStoryReel {
  author: MockStoryAuthor;
  stories: MockStory[];
}

function reel(
  id: string,
  name: string,
  img: number,
  seeds: string[],
): MockStoryReel {
  return {
    author: { id, name, avatarUrl: `https://i.pravatar.cc/150?img=${img}` },
    stories: seeds.map((seed, i) => ({
      id: `${id}-${i + 1}`,
      imageUrl: `https://picsum.photos/seed/${seed}/600/1000`,
      durationMs: 4000,
    })),
  };
}

export const MOCK_STORIES: MockStoryReel[] = [
  reel('maya', 'Maya Okafor', 47, ['orbit-maya-1', 'orbit-maya-2', 'orbit-maya-3']),
  reel('devin', 'Devin Park', 12, ['orbit-devin-1', 'orbit-devin-2']),
  reel('lena', 'Lena Fischer', 32, ['orbit-lena-1', 'orbit-lena-2', 'orbit-lena-3']),
  reel('theo', 'Theo Nakamura', 15, ['orbit-theo-1', 'orbit-theo-2']),
  reel('priya', 'Priya Anand', 45, ['orbit-priya-1', 'orbit-priya-2', 'orbit-priya-3']),
  reel('sam', 'Sam Reyes', 8, ['orbit-sam-1', 'orbit-sam-2']),
];
