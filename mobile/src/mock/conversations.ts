// M3: messaging is mock data until the Conversation/Message API + STOMP ship

export interface MockConversation {
  id: string;
  peer: { id: number; name: string; avatarUrl: string };
  lastMessage: string;
  lastAt: string; // ISO
  unread: number;
  online: boolean;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  fromMe: boolean;
  text: string;
  at: string; // ISO
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: 'c-maya',
    peer: { id: 47, name: 'Maya Okafor', avatarUrl: 'https://i.pravatar.cc/150?img=47' },
    lastMessage: 'See you at the studio tomorrow!',
    lastAt: iso(4 * MIN),
    unread: 2,
    online: true,
  },
  {
    id: 'c-devin',
    peer: { id: 12, name: 'Devin Park', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
    lastMessage: 'Sent you the deck, take a look when you can.',
    lastAt: iso(2 * HOUR),
    unread: 0,
    online: false,
  },
  {
    id: 'c-lena',
    peer: { id: 32, name: 'Lena Fischer', avatarUrl: 'https://i.pravatar.cc/150?img=32' },
    lastMessage: 'haha that trail was brutal',
    lastAt: iso(DAY + 3 * HOUR),
    unread: 0,
    online: true,
  },
  {
    id: 'c-theo',
    peer: { id: 15, name: 'Theo Nakamura', avatarUrl: 'https://i.pravatar.cc/150?img=15' },
    lastMessage: 'Can you cover the standup?',
    lastAt: iso(3 * DAY),
    unread: 1,
    online: false,
  },
  {
    id: 'c-priya',
    peer: { id: 45, name: 'Priya Anand', avatarUrl: 'https://i.pravatar.cc/150?img=45' },
    lastMessage: 'Thanks again 🙏',
    lastAt: iso(9 * DAY),
    unread: 0,
    online: false,
  },
];

function thread(
  conversationId: string,
  lines: Array<[fromMe: boolean, text: string]>,
  startMsAgo: number,
): MockMessage[] {
  const step = Math.floor(startMsAgo / (lines.length + 1));
  return lines.map(([fromMe, text], i) => ({
    id: `${conversationId}-m${i + 1}`,
    conversationId,
    fromMe,
    text,
    at: iso(startMsAgo - step * (i + 1)),
  }));
}

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  'c-maya': thread(
    'c-maya',
    [
      [false, 'Hey! Are we still on for the studio session?'],
      [true, 'Yes definitely, what time works for you?'],
      [false, 'Around 10 would be perfect'],
      [true, "10 it is. I'll bring the new mic."],
      [false, 'Amazing, I have the reference tracks ready'],
      [true, 'Perfect. Should we book the big room?'],
      [false, 'Already did — booked for 3 hours'],
      [false, 'See you at the studio tomorrow!'],
    ],
    2 * HOUR,
  ),
  'c-devin': thread(
    'c-devin',
    [
      [true, 'Did the client send feedback yet?'],
      [false, 'Just got off the call with them'],
      [false, 'They want the pricing section reworked'],
      [true, 'Okay, I can take a pass tonight'],
      [false, 'Great. I updated the intro slides too'],
      [true, 'Nice, send them over'],
      [false, 'Sent you the deck, take a look when you can.'],
    ],
    5 * HOUR,
  ),
  'c-lena': thread(
    'c-lena',
    [
      [true, 'That hike almost killed me'],
      [false, 'You survived though!'],
      [true, 'Barely. My legs are done'],
      [false, 'Same. Worth it for that view'],
      [true, 'The photos came out incredible'],
      [false, 'Send me the sunrise one?'],
      [true, 'Just airdropped it'],
      [false, 'haha that trail was brutal'],
    ],
    DAY + 5 * HOUR,
  ),
  'c-theo': thread(
    'c-theo',
    [
      [false, 'Morning! Quick favor'],
      [true, "What's up?"],
      [false, "I've got a dentist appointment at 9"],
      [false, 'Can you cover the standup?'],
      [true, 'Sure, no problem'],
      [false, 'Legend, thank you'],
      [true, 'Anything specific to flag?'],
      [false, 'Just the deploy is still blocked on review'],
    ],
    3 * DAY + 2 * HOUR,
  ),
  'c-priya': thread(
    'c-priya',
    [
      [false, 'Your intro to the design team really helped'],
      [true, 'Glad it worked out!'],
      [false, 'We start the pilot next week'],
      [true, "That's exciting, congrats"],
      [false, "Couldn't have done it without the push"],
      [true, 'You did the hard part'],
      [false, 'Thanks again 🙏'],
    ],
    9 * DAY + 4 * HOUR,
  ),
};
