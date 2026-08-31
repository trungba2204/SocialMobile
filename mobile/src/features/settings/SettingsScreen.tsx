import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function SettingsScreen() {
  return (
    <ScreenContainer testID="settings-screen" padded>
      <Text variant="heading">Settings</Text>
    </ScreenContainer>
  );
}
