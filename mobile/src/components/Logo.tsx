import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/useTheme';

export type LogoProps = {
  size?: number;
  color?: string;
  dotColor?: string;
};

export function Logo({ size = 28, color, dotColor }: LogoProps) {
  const theme = useTheme();
  const ring = color ?? theme.colors.primary;
  const dot = dotColor ?? theme.colors.accent;
  const c = size / 2;
  const ringR = size * 0.38;
  const dotR = size * 0.12;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityRole="image">
      <Circle
        cx={c}
        cy={c}
        r={ringR}
        stroke={ring}
        strokeWidth={Math.max(1, size * 0.05)}
        fill="none"
      />
      <Circle cx={c + ringR} cy={c} r={dotR} fill={dot} />
    </Svg>
  );
}
