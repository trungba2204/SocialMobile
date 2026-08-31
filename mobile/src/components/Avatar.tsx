import { useState } from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';

export type AvatarProps = {
  uri?: string | null;
  name: string;
  size: number;
};

export function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size }: AvatarProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  if (showImage) {
    return (
      <Image
        source={{ uri: uri! }}
        onError={() => setFailed(true)}
        accessibilityLabel={`${name} avatar`}
        accessibilityRole="image"
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.primaryMuted }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={`${name} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="button" color="primary" style={{ fontSize: size * 0.4, lineHeight: size * 0.4 }}>
        {initialsFor(name)}
      </Text>
    </View>
  );
}
