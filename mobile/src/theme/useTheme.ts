import { createContext, useContext } from 'react';
import { colorsFor, space, radius, shadow, hitSlop, type ColorTokens, type Scheme } from './tokens';
import { typography, type Typography } from './typography';

export type Theme = {
  colors: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  hitSlop: typeof hitSlop;
  typography: Typography;
  scheme: Scheme;
  shadow: (scheme: Scheme) => ReturnType<typeof shadow>;
};

export function buildTheme(scheme: Scheme): Theme {
  return {
    colors: colorsFor(scheme),
    space,
    radius,
    hitSlop,
    typography,
    scheme,
    shadow,
  };
}

export const ThemeContext = createContext<Theme>(buildTheme('light'));

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
