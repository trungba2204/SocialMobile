// M3: messaging is mock data until the Conversation/Message API + STOMP ship.
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Divider } from '@/components/Divider';
import { EmptyState } from '@/components/EmptyState';
import { listConversations } from './messagesData';
import { ConversationRow } from './components/ConversationRow';

export function ConversationListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const conversations = useMemo(() => listConversations(), []);

  return (
    <SafeAreaView
      testID="conversation-list-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md }}>
        <Text variant="heading">Messages</Text>
      </View>
      <FlatList
        style={styles.flex}
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <Divider inset={theme.space.lg + 52 + theme.space.md} />}
        ListEmptyComponent={
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            body="Message a friend to start a conversation."
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.grow : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1, justifyContent: 'center' },
});
