import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { Divider } from '@/components/Divider';
import { Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useResource } from '@/hooks/useResource';
import { toApiError, type ApiError } from '@/api/errors';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import * as conversations from '@/api/conversations';
import type { MessagesStackParamList } from '@/navigation/types';
import type { MessageDto } from '@/api/types';
import { MessageBubble } from './components/MessageBubble';
import { ChatComposer } from './components/ChatComposer';

type ChatRoute = RouteProp<MessagesStackParamList, 'Chat'>;

const POLL_MS = 5000;

export function ChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { params } = useRoute<ChatRoute>();
  // Deep links deliver params as strings; coerce so the API gets a number.
  const conversationId = Number(params.conversationId);
  const showToast = useUiStore((s) => s.showToast);

  const {
    data: conversation,
    error: headerError,
  } = useResource(() => conversations.get(conversationId), [conversationId]);

  // Message list — newest first (matches the API and the inverted FlatList).
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<ApiError | null>(null);
  const inFlight = useRef(false);
  const prevIds = useRef<Set<number>>(new Set());

  const sendInFlight = useRef(false);

  const loadMessages = useCallback(async () => {
    if (inFlight.current || sendInFlight.current) return;
    inFlight.current = true;
    try {
      const res = await conversations.messages(conversationId, 0);
      setListError(null);
      const me = useAuthStore.getState().user;
      setMessages((prev) => {
        const serverIds = new Set(res.content.map((m) => m.id));
        const newestServerAt =
          res.content.length > 0
            ? Math.max(...res.content.map((m) => Date.parse(m.createdAt)))
            : 0;
        // Keep un-reconciled optimistic (negative id) messages, plus any
        // just-saved (positive id) client messages that the server page hasn't
        // caught up to yet — otherwise a poll mid-send briefly drops them.
        const pending = prev.filter(
          (m) =>
            !serverIds.has(m.id) &&
            (m.id < 0 || Date.parse(m.createdAt) >= newestServerAt),
        );
        // If the poll surfaced NEW peer messages, clear the unread badge now.
        const hasNewPeerMsg = res.content.some(
          (m) => !prevIds.current.has(m.id) && m.sender.id !== me?.id,
        );
        prevIds.current = serverIds;
        if (hasNewPeerMsg) conversations.markRead(conversationId).catch(() => undefined);
        return [...pending, ...res.content];
      });
    } catch (e) {
      setListError(toApiError(e));
    } finally {
      inFlight.current = false;
      setListLoading(false);
    }
  }, [conversationId]);

  const markRead = useCallback(() => {
    conversations.markRead(conversationId).catch(() => undefined);
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      void loadMessages();
      markRead();
      const timer = setInterval(() => {
        void loadMessages();
      }, POLL_MS);
      return () => clearInterval(timer);
    }, [loadMessages, markRead]),
  );

  useEffect(() => {
    setMessages([]);
    setListLoading(true);
    setListError(null);
  }, [conversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      const me = useAuthStore.getState().user;
      const tempId = -Date.now();
      const optimistic: MessageDto = {
        id: tempId,
        conversationId,
        sender: me ?? { id: -1, username: '', displayName: '', avatarUrl: null, bio: null },
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [optimistic, ...prev]);
      sendInFlight.current = true;
      try {
        const saved = await conversations.send(conversationId, text);
        setMessages((prev) => [saved, ...prev.filter((m) => m.id !== tempId)]);
        markRead();
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showToast({ message: 'Message failed to send', tone: 'error' });
      } finally {
        sendInFlight.current = false;
      }
    },
    [conversationId, markRead, showToast],
  );

  const showListError = !!listError && messages.length === 0;
  const showListLoading = listLoading && messages.length === 0;

  return (
    <SafeAreaView
      testID="chat-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.sm, gap: theme.space.sm },
        ]}
      >
        <IconButton
          icon={ChevronLeft}
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
        />
        {conversation ? (
          <>
            <Avatar
              uri={conversation.peer.avatarUrl}
              name={conversation.peer.displayName}
              size={36}
            />
            <View style={styles.flexShrink}>
              <Text variant="title" numberOfLines={1}>
                {conversation.peer.displayName}
              </Text>
              <Text variant="metadata" color="textDim" numberOfLines={1}>
                @{conversation.peer.username}
              </Text>
            </View>
          </>
        ) : headerError ? (
          <Text variant="title">Chat</Text>
        ) : (
          <Skeleton width={140} height={16} />
        )}
      </View>
      <Divider />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {showListLoading ? (
          <View testID="chat-skeleton" style={{ padding: theme.space.lg, gap: theme.space.md }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width="70%" height={40} />
            ))}
          </View>
        ) : showListError ? (
          <ErrorState message={listError!.message} onRetry={() => void loadMessages()} />
        ) : messages.length === 0 ? (
          <EmptyState icon={MessageCircle} title="Say hello" body="No messages yet." />
        ) : (
          <FlatList
            style={styles.flex}
            data={messages}
            inverted
            keyExtractor={(m) => String(m.id)}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ paddingVertical: theme.space.md }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
        <ChatComposer onSend={(t) => void handleSend(t)} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  flexShrink: { flexShrink: 1 },
});
