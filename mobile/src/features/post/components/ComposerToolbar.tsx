import { StyleSheet, View } from 'react-native';
import { ImagePlus, MapPin, Smile, UserPlus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { PressableScale } from '@/components/PressableScale';

export type ComposerToolbarProps = {
  onAddPhoto: () => void;
  onFeeling: () => void;
  onLocation: () => void;
  photoDisabled?: boolean;
};

function ToolbarItem({
  icon: Icon,
  label,
  onPress,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={theme.hitSlop}
      onPress={onPress}
      style={[styles.item, { opacity: disabled ? 0.4 : 1, gap: theme.space.xs }]}
    >
      <Icon size={20} color={theme.colors.textSecondary} />
      <Text variant="metadata" color="textSecondary">
        {label}
      </Text>
    </PressableScale>
  );
}

export function ComposerToolbar({
  onAddPhoto,
  onFeeling,
  onLocation,
  photoDisabled,
}: ComposerToolbarProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: theme.colors.border, paddingTop: theme.space.md }]}>
      <ToolbarItem icon={ImagePlus} label="Photo" onPress={onAddPhoto} disabled={photoDisabled} />
      <ToolbarItem icon={Smile} label="Feeling" onPress={onFeeling} />
      <ToolbarItem icon={MapPin} label="Location" onPress={onLocation} />
      {/* Tag people — M2 */}
      <ToolbarItem icon={UserPlus} label="Tag people" disabled />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
