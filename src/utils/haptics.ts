import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

let _H: typeof import('expo-haptics') | null = null;

async function H() {
  if (!isNative) return null;
  if (!_H) _H = await import('expo-haptics');
  return _H;
}

export async function rewardHaptic() {
  const Haptics = await H();
  if (!Haptics) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function lightTap() {
  const Haptics = await H();
  if (!Haptics) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function mediumTap() {
  const Haptics = await H();
  if (!Haptics) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function heavyTap() {
  const Haptics = await H();
  if (!Haptics) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function victoryHaptic() {
  const Haptics = await H();
  if (!Haptics) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 120);
  setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 240);
}
