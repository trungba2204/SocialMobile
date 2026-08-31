import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export const fontsToLoad = {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export type TypographyVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'bodyMed'
  | 'button'
  | 'caption'
  | 'metadata';

export type TypographyStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
};

export const typography: Record<TypographyVariant, TypographyStyle> = {
  display: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, lineHeight: 26 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 24 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  bodyMed: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 21 },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  metadata: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
};

export type Typography = typeof typography;
