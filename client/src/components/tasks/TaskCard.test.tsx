import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import TaskCard from './TaskCard';
import { Task, Priority } from '../../types/task';

const mockStore = configureStore([]);

describe('TaskCard', () => {
  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO',
    priority: 'HIGH' as Priority,
    projectId: 1,
    createdById: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: {
      id: 1,
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe'
    }
  };

  const store = mockStore({
    tasks: {
      loading: false,
      error: null
    }
  });

  it('renders task information correctly', () => {
    render(
      <Provider store={store}>
        <TaskCard task={mockTask} />
      </Provider>
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows edit dialog when edit button is clicked', () => {
    render(
      <Provider store={store}>
        <TaskCard task={mockTask} />
      </Provider>
    );

    const menuButton = screen.getByRole('button', { name: /task options/i });
    fireEvent.click(menuButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });
});
