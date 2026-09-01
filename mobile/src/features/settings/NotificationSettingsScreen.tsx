// M5: real notification preferences (per-type toggles, push).
import { Bell } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function NotificationSettingsScreen() {
  return (
    <ScreenContainer testID="notification-settings-screen">
      <EmptyState
        icon={Bell}
        title="Coming soon"
        body="Notification preferences arrive in a future update."
      />
    </ScreenContainer>
  );
}
