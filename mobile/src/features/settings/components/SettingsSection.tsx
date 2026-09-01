import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';

export type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.space.xl }}>
      <Text
        variant="metadata"
        color="textSecondary"
        style={[styles.title, { marginBottom: theme.space.sm, marginLeft: theme.space.xs }]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { letterSpacing: 0.5 },
  group: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
