import { sortTasksByDueDate, isOverdue } from '../src/utils/taskUtils';
import type { Task } from '../src/types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    remoteId: null,
    userId: 'user-1',
    title: 'Task',
    description: null,
    dueDate: null,
    priority: 'medium',
    isCompleted: false,
    isDeleted: false,
    syncStatus: 'synced',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('sortTasksByDueDate', () => {
  it('orders tasks ascending by due date', () => {
    const later = makeTask({ id: 'a', dueDate: '2026-08-20T10:00:00Z' });
    const sooner = makeTask({ id: 'b', dueDate: '2026-08-10T10:00:00Z' });
    const result = sortTasksByDueDate([later, sooner]);
    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('pushes tasks with no due date to the end', () => {
    const noDate = makeTask({ id: 'a', dueDate: null });
    const withDate = makeTask({ id: 'b', dueDate: '2026-08-10T10:00:00Z' });
    const result = sortTasksByDueDate([noDate, withDate]);
    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('isOverdue', () => {
  it('returns true when due date is in the past and task is incomplete', () => {
    const task = makeTask({ dueDate: '2020-01-01T00:00:00Z', isCompleted: false });
    expect(isOverdue(task, new Date('2026-01-01T00:00:00Z'))).toBe(true);
  });

  it('returns false when the task is already completed', () => {
    const task = makeTask({ dueDate: '2020-01-01T00:00:00Z', isCompleted: true });
    expect(isOverdue(task, new Date('2026-01-01T00:00:00Z'))).toBe(false);
  });

  it('returns false when there is no due date', () => {
    const task = makeTask({ dueDate: null });
    expect(isOverdue(task)).toBe(false);
  });
});
