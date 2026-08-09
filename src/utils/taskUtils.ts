import type { Task } from '../types';

/** Sorts tasks by due date ascending; tasks with no due date go last. */
export function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate || task.isCompleted) return false;
  return new Date(task.dueDate).getTime() < now.getTime();
}
