// M3: messaging is mock data until the Conversation/Message API + STOMP ship.
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import type { MockMessage } from '@/mock/conversations';

export type MessageBubbleProps = {
  message: MockMessage;
};

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const theme = useTheme();
  const mine = message.fromMe;

  return (
    <View
      style={[
        styles.wrap,
        { paddingHorizontal: theme.space.lg, alignItems: mine ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? theme.colors.primary : theme.colors.card,
            borderColor: mine ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
          },
        ]}
      >
        <Text variant="body" color={mine ? 'onPrimary' : 'textPrimary'}>
          {message.text}
        </Text>
      </View>
      <Text variant="metadata" color="textDim" style={styles.time}>
        {clockTime(message.at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 4 },
  bubble: { maxWidth: '80%', borderWidth: StyleSheet.hairlineWidth },
  time: { marginTop: 2 },
});
