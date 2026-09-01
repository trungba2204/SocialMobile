import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Paperclip, Send } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/components/IconButton';
import { haptics } from '@/lib/haptics';

export type ChatComposerProps = {
  onSend: (text: string) => void;
};

export function ChatComposer({ onSend }: ChatComposerProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const canSend = trimmed.length > 0;

  const send = () => {
    if (!canSend) return;
    haptics.light();
    onSend(trimmed);
    setText('');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
          gap: theme.space.sm,
        },
      ]}
    >
      {/* M4: attachments arrive with media messages — disabled placeholder for now. */}
      <IconButton
        icon={Paperclip}
        accessibilityLabel="Attach (coming soon)"
        disabled
        color={theme.colors.textDim}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.space.md,
            fontFamily: theme.typography.body.fontFamily,
            fontSize: theme.typography.body.fontSize,
          },
        ]}
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={theme.colors.textDim}
        multiline
        accessibilityLabel="Message"
        returnKeyType="send"
        onSubmitEditing={send}
        blurOnSubmit={false}
      />
      <IconButton
        icon={Send}
        accessibilityLabel="Send message"
        onPress={send}
        disabled={!canSend}
        color={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
  },
});
