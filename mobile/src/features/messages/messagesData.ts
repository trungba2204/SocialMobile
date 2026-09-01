// M3: messaging is mock data until the Conversation/Message API + STOMP ship.
// This thin accessor layer is the only file that changes when the real
// @/api/conversations endpoints land — screens depend on these functions, not the mock.

import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  type MockConversation,
  type MockMessage,
} from '@/mock/conversations';

export function listConversations(): MockConversation[] {
  return [...MOCK_CONVERSATIONS].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );
}

export function getConversation(id: string): MockConversation | undefined {
  return MOCK_CONVERSATIONS.find((c) => c.id === id);
}

export function listMessages(conversationId: string): MockMessage[] {
  return [...(MOCK_MESSAGES[conversationId] ?? [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
}
