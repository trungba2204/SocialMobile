import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export type DividerProps = {
  spacing?: keyof ReturnType<typeof useTheme>['space'];
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

export function Divider({ spacing, inset = 0, style }: DividerProps) {
  const theme = useTheme();
  const marginVertical = spacing ? theme.space[spacing] : 0;
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: theme.colors.border, marginVertical, marginHorizontal: inset },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
