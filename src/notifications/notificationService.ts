import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import type { Task } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

async function ensureAndroidChannel(): Promise<string> {
  return notifee.createChannel({
    id: 'task-reminders',
    name: 'Task Reminders',
    importance: AndroidImportance.HIGH,
  });
}

/** Schedules (or replaces) a local notification for a task's due date. */
export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!task.dueDate) return;

  const fireDate = new Date(task.dueDate).getTime();
  if (fireDate <= Date.now()) return; // don't schedule reminders in the past

  const channelId = await ensureAndroidChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate,
  };

  await notifee.createTriggerNotification(
    {
      id: task.id, // reuse the task id so re-scheduling overwrites the old one
      title: task.title,
      body: task.description || 'Task reminder',
      android: { channelId, pressAction: { id: 'default' } },
    },
    trigger,
  );
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await notifee.cancelTriggerNotification(taskId);
}

/** Call once at app startup to re-sync all scheduled reminders with current task state. */
export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  await notifee.cancelAllNotifications();
  const active = tasks.filter((t) => !t.isCompleted && !t.isDeleted && t.dueDate);
  await Promise.all(active.map(scheduleTaskReminder));
}
