import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/tokens';
import type { TypographyVariant } from '@/theme/typography';

type TextColor = {
  [K in keyof ColorTokens]: ColorTokens[K] extends string ? K : never;
}[keyof ColorTokens];

export type TextProps = {
  variant?: TypographyVariant;
  color?: TextColor;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  numberOfLines,
  style,
  children,
}: TextProps) {
  const theme = useTheme();
  const v = theme.typography[variant];
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: v.fontFamily, fontSize: v.fontSize, lineHeight: v.lineHeight, color: theme.colors[color] },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
