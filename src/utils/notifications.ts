export async function setupHandler() {}
export async function requestPermissions(): Promise<boolean> { return false; }
export async function scheduleDailyReminders() {}
export async function scheduleHabitReminder(_habitId: string, _habitName: string, _time: string) {}
export async function cancelHabitReminder(_habitId: string) {}
export async function cancelAll() {}
