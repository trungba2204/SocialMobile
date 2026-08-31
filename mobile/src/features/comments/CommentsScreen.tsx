import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { IconButton } from '@/components/IconButton';
import type { HomeStackParamList } from '@/navigation/types';
import { CommentsThread } from './components/CommentsThread';

export function CommentsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Comments'>>();
  const { postId } = route.params;

  return (
    <SafeAreaView
      testID="comments-screen"
      edges={['top']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.sm, borderBottomColor: theme.colors.border },
        ]}
      >
        <IconButton
          icon={ChevronLeft}
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        />
        <Text variant="title">Comments</Text>
        <View style={styles.spacer} />
      </View>
      <CommentsThread postId={postId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: { width: 44, height: 44 },
});
