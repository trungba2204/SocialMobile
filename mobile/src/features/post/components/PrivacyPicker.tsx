import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, Globe, Lock, Users } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { BottomSheet } from '@/components/BottomSheet';
import { Divider } from '@/components/Divider';
import type { PostPrivacy } from '@/api/types';

type Option = { value: PostPrivacy; label: string; description: string; icon: LucideIcon };

export const PRIVACY_OPTIONS: Option[] = [
  { value: 'PUBLIC', label: 'Public', description: 'Anyone on Orbit can see this post.', icon: Globe },
  { value: 'FRIENDS', label: 'Friends', description: 'Only your friends can see this post.', icon: Users },
  { value: 'PRIVATE', label: 'Private', description: 'Only you can see this post.', icon: Lock },
];

export type PrivacyPickerProps = {
  value: PostPrivacy;
  onChange: (value: PostPrivacy) => void;
};

export function PrivacyPicker({ value, onChange }: PrivacyPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = PRIVACY_OPTIONS.find((o) => o.value === value) ?? PRIVACY_OPTIONS[0]!;

  return (
    <>
      <Chip label={current.label} leftIcon={current.icon} selected onPress={() => setOpen(true)} />
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text variant="heading">Who can see this?</Text>
        <View style={{ marginTop: theme.space.md }}>
          {PRIVACY_OPTIONS.map((option, i) => {
            const Icon = option.icon;
            const active = option.value === value;
            return (
              <View key={option.value}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.row, { paddingVertical: theme.space.md }]}
                >
                  <Icon size={22} color={theme.colors.textSecondary} />
                  <View style={styles.rowText}>
                    <Text variant="body">{option.label}</Text>
                    <Text variant="caption" color="textSecondary">
                      {option.description}
                    </Text>
                  </View>
                  {active ? <Check size={20} color={theme.colors.primary} /> : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
});
