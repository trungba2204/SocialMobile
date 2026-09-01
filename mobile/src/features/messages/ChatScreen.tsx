// M3: messaging is mock data until the Conversation/Message API + STOMP ship.
// Sending appends to local component state only — there is no network call.
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { Divider } from '@/components/Divider';
import type { MessagesStackParamList } from '@/navigation/types';
import type { MockMessage } from '@/mock/conversations';
import { getConversation, listMessages } from './messagesData';
import { MessageBubble } from './components/MessageBubble';
import { ChatComposer } from './components/ChatComposer';

type ChatRoute = RouteProp<MessagesStackParamList, 'Chat'>;

export function ChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { params } = useRoute<ChatRoute>();
  const conversationId = params.conversationId;

  const conversation = useMemo(() => getConversation(conversationId), [conversationId]);
  const seeded = useMemo(() => listMessages(conversationId), [conversationId]);
  const [messages, setMessages] = useState<MockMessage[]>(seeded);

  // Inverted list: newest first.
  const ordered = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${conversationId}-local-${prev.length + 1}-${Date.now()}`,
        conversationId,
        fromMe: true,
        text,
        at: new Date().toISOString(),
      },
    ]);
  };

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
              name={conversation.peer.name}
              size={36}
            />
            <View style={styles.flexShrink}>
              <Text variant="title" numberOfLines={1}>
                {conversation.peer.name}
              </Text>
              <Text variant="metadata" color={conversation.online ? 'success' : 'textDim'}>
                {conversation.online ? 'Online' : 'Offline'}
              </Text>
            </View>
          </>
        ) : (
          <Text variant="title">Chat</Text>
        )}
      </View>
      <Divider />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          style={styles.flex}
          data={ordered}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ paddingVertical: theme.space.md }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
        <View
          testID="typing-indicator"
          style={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.xs }}
        >
          <Text variant="metadata" color="textDim">
            {conversation ? `${conversation.peer.name.split(' ')[0]} is typing…` : 'typing…'}
          </Text>
        </View>
        <ChatComposer onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  flexShrink: { flexShrink: 1 },
});
