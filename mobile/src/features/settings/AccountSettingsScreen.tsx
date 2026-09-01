// M5: real account management (email, password, deactivate).
import { UserCog } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function AccountSettingsScreen() {
  return (
    <ScreenContainer testID="account-settings-screen">
      <EmptyState
        icon={UserCog}
        title="Coming soon"
        body="Account management arrives in a future update."
      />
    </ScreenContainer>
  );
}
