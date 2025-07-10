import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateTaskData, UpdateTaskData } from '../types/task.types';
import { TaskRepository } from './task.repository';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<TaskRepository>(TaskRepository);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createData: CreateTaskData = {
        name: 'Test Task',
        status: 'not-started',
        priority: 'Medium',
        gitBranch: 'feature/test',
      };

      const expectedTask = {
        id: 1,
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.create.mockResolvedValue(expectedTask);

      const result = await repository.create(createData);

      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(expectedTask);
    });
  });

  describe('findById', () => {
    it('should find a task by id', async () => {
      const taskId = 1;
      const expectedTask = {
        id: taskId,
        name: 'Test Task',
        status: 'not-started',
        priority: 'Medium',
        gitBranch: 'feature/test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(expectedTask);

      const result = await repository.findById(taskId);

      expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(result).toEqual(expectedTask);
    });

    it('should return null when task not found', async () => {
      const taskId = 999;
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      const result = await repository.findById(taskId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const taskId = 1;
      const updateData: UpdateTaskData = {
        name: 'Updated Task',
        status: 'in-progress',
      };

      const expectedTask = {
        id: taskId,
        name: 'Updated Task',
        status: 'in-progress',
        priority: 'Medium',
        gitBranch: 'feature/test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.update.mockResolvedValue(expectedTask);

      const result = await repository.update(taskId, updateData);

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: updateData,
      });
      expect(result).toEqual(expectedTask);
    });
  });

  describe('delete', () => {
    it('should delete a task successfully', async () => {
      const taskId = 1;
      const expectedTask = {
        id: taskId,
        name: 'Test Task',
        status: 'not-started',
        priority: 'Medium',
        gitBranch: 'feature/test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.task.delete.mockResolvedValue(expectedTask);

      const result = await repository.delete(taskId);

      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(result).toEqual(expectedTask);
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const expectedTasks = [
        {
          id: 1,
          name: 'Task 1',
          status: 'not-started',
          priority: 'High',
          gitBranch: 'feature/task1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Task 2',
          status: 'in-progress',
          priority: 'Medium',
          gitBranch: 'feature/task2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(expectedTasks);

      const result = await repository.findMany();

      expect(mockPrismaService.task.findMany).toHaveBeenCalled();
      expect(result).toEqual(expectedTasks);
    });
  });
});
