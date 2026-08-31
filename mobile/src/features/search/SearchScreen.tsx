import { ScreenContainer } from '@/components/ScreenContainer';
import { Text } from '@/components/Text';

export function SearchScreen() {
  return (
    <ScreenContainer testID="search-screen" padded>
      <Text variant="heading">Search</Text>
    </ScreenContainer>
  );
}
