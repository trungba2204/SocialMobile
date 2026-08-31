import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SendHorizontal } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { IconButton } from '@/components/IconButton';

export type CommentComposerProps = {
  onSubmit: (text: string) => Promise<void>;
};

const MAX_LENGTH = 2000;

export function CommentComposer({ onSubmit }: CommentComposerProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setText('');
    } catch {
      setError('Could not post your comment');
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          padding: theme.space.md,
          gap: theme.space.xs,
        },
      ]}
    >
      <View style={[styles.row, { gap: theme.space.sm }]}>
        <View style={styles.flex}>
          <TextField
            label="Add a comment"
            value={text}
            onChangeText={setText}
            placeholder="Add a comment…"
            multiline
            maxLength={MAX_LENGTH}
            editable={!sending}
          />
        </View>
        <IconButton
          icon={SendHorizontal}
          accessibilityLabel="Post comment"
          onPress={() => {
            void send();
          }}
          disabled={!canSend}
          color={theme.colors.primary}
        />
      </View>
      {error ? (
        <Text variant="caption" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  flex: { flex: 1 },
});
