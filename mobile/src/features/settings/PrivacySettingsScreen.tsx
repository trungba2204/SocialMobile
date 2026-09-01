// M5: real privacy controls (audience defaults, discoverability).
import { Lock } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function PrivacySettingsScreen() {
  return (
    <ScreenContainer testID="privacy-settings-screen">
      <EmptyState
        icon={Lock}
        title="Coming soon"
        body="Privacy controls arrive in a future update."
      />
    </ScreenContainer>
  );
}
