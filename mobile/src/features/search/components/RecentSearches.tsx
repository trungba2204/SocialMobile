import { Pressable, StyleSheet, View } from 'react-native';
import { Clock, Search } from 'lucide-react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from '@/components/Text';
import { EmptyState } from '@/components/EmptyState';

export type RecentSearchesProps = {
  terms: string[];
  onPick: (term: string) => void;
  onClear: () => void;
};

export function RecentSearches({ terms, onPick, onClear }: RecentSearchesProps) {
  const theme = useTheme();

  if (terms.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Search Orbit"
        body="Find people and posts. Your recent searches will show up here."
      />
    );
  }

  return (
    <View style={{ paddingVertical: theme.space.sm }}>
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm },
        ]}
      >
        <Text variant="metadata" color="textSecondary">
          Recent
        </Text>
        <Pressable accessibilityRole="button" onPress={onClear} hitSlop={theme.hitSlop}>
          <Text variant="metadata" color="primary">
            Clear
          </Text>
        </Pressable>
      </View>
      {terms.map((term) => (
        <Pressable
          key={term}
          accessibilityRole="button"
          onPress={() => onPick(term)}
          style={[
            styles.row,
            {
              paddingHorizontal: theme.space.lg,
              paddingVertical: theme.space.md,
              gap: theme.space.md,
            },
          ]}
        >
          <Clock size={18} color={theme.colors.textDim} />
          <Text variant="body" numberOfLines={1}>
            {term}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
