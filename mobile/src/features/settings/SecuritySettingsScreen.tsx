// M5: real security settings (sessions, 2FA).
import { ShieldCheck } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function SecuritySettingsScreen() {
  return (
    <ScreenContainer testID="security-settings-screen">
      <EmptyState
        icon={ShieldCheck}
        title="Coming soon"
        body="Security settings arrive in a future update."
      />
    </ScreenContainer>
  );
}
