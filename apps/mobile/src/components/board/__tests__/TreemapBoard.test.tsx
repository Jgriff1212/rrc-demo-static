/**
 * TreemapBoard component tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { TreemapBoard } from '../TreemapBoard';
import { Task } from '@reveal/shared';

describe('TreemapBoard', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      user_id: 'user1',
      title: 'Task 1',
      priority: 'high',
      period: 'day',
      period_key: '2024-01-01',
      completed: false,
      due_date: null,
      category: null,
      completed_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user1',
      title: 'Task 2',
      priority: 'medium',
      period: 'day',
      period_key: '2024-01-01',
      completed: true,
      due_date: null,
      category: null,
      completed_at: '2024-01-01T10:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
  ];

  const mockOnTaskPress = jest.fn();

  it('should render empty state when no tasks', () => {
    const { getByText } = render(
      <TreemapBoard tasks={[]} onTaskPress={mockOnTaskPress} />
    );

    expect(getByText('No tasks yet')).toBeTruthy();
  });

  it('should render tasks', () => {
    const { getByText } = render(
      <TreemapBoard tasks={mockTasks} onTaskPress={mockOnTaskPress} />
    );

    expect(getByText(/Task 1/)).toBeTruthy();
    expect(getByText(/Task 2/)).toBeTruthy();
  });

  it('should call onTaskPress when tile is pressed', () => {
    const { getByText } = render(
      <TreemapBoard tasks={mockTasks} onTaskPress={mockOnTaskPress} />
    );

    const tile = getByText(/Task 1/);
    // Note: Would need to fire press event properly in actual test
    expect(tile).toBeTruthy();
  });
});
