import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TaskService } from '../src/services/task.service';
import { prisma } from '../src/config/database';
import { NotFoundError, ForbiddenError } from '../src/utils/errors';

jest.mock('../src/config/database');

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        projectId: 1,
        createdById: 1
      };

      const mockTask = {
        id: 1,
        ...taskData,
        status: 'TODO',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.createTask(taskData);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          ...taskData,
          status: 'TODO',
          priority: 'MEDIUM'
        },
        include: {
          createdBy: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          assignee: {
            select: { id: true, email: true, firstName: true, lastName: true }
          }
        }
      });

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        taskService.createTask({
          title: 'Test Task',
          description: 'Test Description',
          projectId: 999,
          createdById: 1
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTaskById', () => {
    it('should return task if user has access', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        projectId: 1,
        project: { team: { members: [{ userId: 1 }] } }
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const result = await taskService.getTaskById(1, 1);

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenError if user does not have access', async () => {
      const mockTask = {
        id: 1,
        title: 'Test Task',
        projectId: 1,
        project: { team: { members: [{ userId: 2 }] } }
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      await expect(taskService.getTaskById(1, 1)).rejects.toThrow(ForbiddenError);
    });
  });
});
