import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, UserPlus } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { PressableScale } from '@/components/PressableScale';
import type { FriendStatus } from '@/api/types';

// Token-less geometry for the inline "Friends" dropdown menu.
const MENU_MIN_WIDTH = 160;

export type FriendActionButtonProps = {
  status: FriendStatus;
  onAdd: () => void;
  onAcceptNavigate: () => void;
  onUnfriend: () => void;
};

export function FriendActionButton({
  status,
  onAdd,
  onAcceptNavigate,
  onUnfriend,
}: FriendActionButtonProps) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (status === 'SELF') return null;

  if (status === 'NONE') {
    return <Button label="Add friend" leftIcon={UserPlus} onPress={onAdd} />;
  }

  if (status === 'PENDING_OUT') {
    return <Button label="Requested" variant="secondary" disabled onPress={() => {}} />;
  }

  if (status === 'PENDING_IN') {
    return <Button label="Accept" onPress={onAcceptNavigate} />;
  }

  // FRIENDS
  return (
    <View style={styles.friendsWrap}>
      <Button
        label="Friends"
        variant="secondary"
        leftIcon={Check}
        onPress={() => setMenuOpen((o) => !o)}
      />
      {menuOpen ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              marginTop: theme.space.xs,
            },
          ]}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Unfriend"
            onPress={() => {
              setMenuOpen(false);
              onUnfriend();
            }}
            style={[styles.menuItem, { padding: theme.space.md }]}
          >
            <Text variant="body" color="error">
              Unfriend
            </Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  friendsWrap: { alignSelf: 'flex-start' },
  menu: { borderWidth: StyleSheet.hairlineWidth, minWidth: MENU_MIN_WIDTH },
  menuItem: { alignItems: 'flex-start' },
});
