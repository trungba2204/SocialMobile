// M5: real help center (articles, contact support).
import { LifeBuoy } from 'lucide-react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EmptyState } from '@/components/EmptyState';

export function HelpCenterScreen() {
  return (
    <ScreenContainer testID="help-center-screen">
      <EmptyState
        icon={LifeBuoy}
        title="Coming soon"
        body="Help center arrives in a future update."
      />
    </ScreenContainer>
  );
}
