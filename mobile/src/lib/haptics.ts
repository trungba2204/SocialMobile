import * as Haptics from 'expo-haptics';

type Runner = () => void;

function safe(run: Runner): void {
  try {
    run();
  } catch {
    // Haptics unavailable (web, simulator, missing native module) — no-op.
  }
}

export const haptics = {
  light: () => safe(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => safe(() => void Haptics.selectionAsync()),
  success: () => safe(() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
