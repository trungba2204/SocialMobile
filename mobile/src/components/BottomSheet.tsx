import { useEffect, type ReactNode } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number;
};

export function BottomSheet({ visible, onClose, children, snapHeight }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const travel = snapHeight ?? Dimensions.get('window').height;
  const translate = useSharedValue(visible ? 0 : 1);

  useEffect(() => {
    translate.value = withTiming(visible ? 0 : 1, { duration: 220 });
  }, [visible, translate]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value * travel }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable
          accessibilityLabel="Close"
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              paddingTop: theme.space.md,
              paddingBottom: insets.bottom + theme.space.lg,
              paddingHorizontal: theme.space.lg,
              height: snapHeight,
            },
            sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  sheet: { width: '100%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
});
