import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';
let _Notifications: typeof import('expo-notifications') | null = null;

async function N() {
  if (!isNative) return null;
  if (!_Notifications) _Notifications = await import('expo-notifications');
  return _Notifications;
}

export async function setupHandler() {
  const Notifs = await N();
  if (!Notifs) return;
  Notifs.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestPermissions(): Promise<boolean> {
  const Notifs = await N();
  if (!Notifs) return false;
  if (Platform.OS === 'android') {
    await Notifs.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifs.AndroidImportance.MAX,
    });
  }
  const { status } = await Notifs.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminders() {
  const Notifs = await N();
  if (!Notifs) return;
  await Notifs.cancelScheduledNotificationAsync('morning').catch(() => {});
  await Notifs.cancelScheduledNotificationAsync('evening').catch(() => {});
  await Notifs.scheduleNotificationAsync({
    identifier: 'morning',
    content: { title: 'Good morning! 🌅', body: 'Your habits are waiting. Small steps, big results.' },
    trigger: { hour: 9, minute: 0, repeats: true, type: Notifs.SchedulableTriggerInputTypes.DAILY },
  });
  await Notifs.scheduleNotificationAsync({
    identifier: 'evening',
    content: { title: 'Evening check-in 🌙', body: "Don't let the streak die. You're so close! 🔥" },
    trigger: { hour: 20, minute: 0, repeats: true, type: Notifs.SchedulableTriggerInputTypes.DAILY },
  });
}

export async function scheduleHabitReminder(habitId: string, habitName: string, time: string) {
  const Notifs = await N();
  if (!Notifs) return;
  const parts = time.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);
  if (isNaN(hour) || isNaN(minute)) return;
  await Notifs.cancelScheduledNotificationAsync(`habit-${habitId}`).catch(() => {});
  await Notifs.scheduleNotificationAsync({
    identifier: `habit-${habitId}`,
    content: { title: `🎯 ${habitName}`, body: "Time to check off your habit!" },
    trigger: { hour, minute, repeats: true, type: Notifs.SchedulableTriggerInputTypes.DAILY },
  });
}

export async function cancelHabitReminder(habitId: string) {
  const Notifs = await N();
  if (!Notifs) return;
  await Notifs.cancelScheduledNotificationAsync(`habit-${habitId}`).catch(() => {});
}

export async function cancelAll() {
  const Notifs = await N();
  if (!Notifs) return;
  await Notifs.cancelAllScheduledNotificationsAsync();
}
