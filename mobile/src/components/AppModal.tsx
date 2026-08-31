import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function AppModal({ visible, onClose, children }: AppModalProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable
          accessibilityLabel="Close"
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.card,
            theme.shadow(theme.scheme),
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.lg,
              padding: theme.space.xl,
            },
          ]}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  card: { width: '100%', maxWidth: 400 },
});
