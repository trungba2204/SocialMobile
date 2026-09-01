// M5: real blocked-users list with unblock.
import { UserX } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function BlockedUsersScreen() {
  return (
    <ScreenContainer testID="blocked-users-screen">
      <EmptyState
        icon={UserX}
        title="Coming soon"
        body="Blocked users management arrives in a future update."
      />
    </ScreenContainer>
  );
}
