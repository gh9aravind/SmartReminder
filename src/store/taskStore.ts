import { create } from 'zustand';
import type { Task, Priority } from '../types';
import * as taskService from '../services/taskService';
import { rescheduleAllReminders, scheduleTaskReminder, cancelTaskReminder } from '../notifications/notificationService';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  loadTasks: (userId: string) => Promise<void>;
  addTask: (
    userId: string,
    input: { title: string; description?: string; dueDate?: string; priority?: Priority },
  ) => Promise<void>;
  editTask: (task: Task) => Promise<void>;
  toggleComplete: (task: Task) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,

  loadTasks: async (userId) => {
    set({ loading: true });
    const tasks = await taskService.listTasks(userId);
    set({ tasks, loading: false });
    await rescheduleAllReminders(tasks);
  },

  addTask: async (userId, input) => {
    const task = await taskService.createTask(userId, input);
    set({ tasks: [...get().tasks, task] });
    await scheduleTaskReminder(task);
  },

  editTask: async (task) => {
    await taskService.updateTask(task);
    set({ tasks: get().tasks.map((t) => (t.id === task.id ? task : t)) });
    await scheduleTaskReminder(task);
  },

  toggleComplete: async (task) => {
    await taskService.toggleTaskComplete(task);
    const updated = { ...task, isCompleted: !task.isCompleted };
    set({ tasks: get().tasks.map((t) => (t.id === task.id ? updated : t)) });
    if (updated.isCompleted) await cancelTaskReminder(task.id);
  },

  removeTask: async (taskId) => {
    await taskService.deleteTask(taskId);
    set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
    await cancelTaskReminder(taskId);
  },
}));
