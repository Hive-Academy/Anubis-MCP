import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateTaskData, UpdateTaskData } from '../types/task.types';
import { TaskRepository } from './task.repository';

describe('TaskRepository', () => {
  let repository: TaskRepository;
  let _prismaService: PrismaService;

  const mockTaskMethods = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };

  const mockPrismaService = {
    task: mockTaskMethods,
    $transaction: jest
      .fn()
      .mockImplementation(<T>(callback: (prisma: any) => Promise<T>) => {
        // Mock transaction by calling the callback with the mock prisma service
        return callback({ task: mockTaskMethods });
      }),
  } as any;

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
    Object.values(mockTaskMethods).forEach((mock) => mock.mockClear());
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
        slug: 'test-task',
        createdAt: new Date(),
        updatedAt: new Date(),
        taskDescription: null,
        codebaseAnalysis: null,
        researchReports: [],
        subtasks: [],
      };

      // Mock the slug check to return false (slug not taken)
      mockTaskMethods.findFirst.mockResolvedValue(null);
      mockTaskMethods.create.mockResolvedValue(expectedTask);

      const result = await repository.create(createData);

      expect(mockTaskMethods.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          slug: 'test-task',
          taskDescription: undefined,
          codebaseAnalysis: undefined,
        },
        include: {
          taskDescription: true,
          codebaseAnalysis: true,
          researchReports: true,
          subtasks: true,
        },
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

      mockTaskMethods.findUnique.mockResolvedValue(expectedTask);

      const result = await repository.findById(taskId);

      expect(mockTaskMethods.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });
      expect(result).toEqual(expectedTask);
    });

    it('should return null when task not found', async () => {
      const taskId = 999;
      mockTaskMethods.findUnique.mockResolvedValue(null);

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
        slug: 'updated-task',
        createdAt: new Date(),
        updatedAt: new Date(),
        taskDescription: null,
        codebaseAnalysis: null,
        researchReports: [],
        subtasks: [],
      };

      mockTaskMethods.update.mockResolvedValue(expectedTask);

      const result = await repository.update(taskId, updateData);

      expect(mockTaskMethods.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: {
          ...updateData,
          taskDescription: undefined,
          codebaseAnalysis: undefined,
        },
        include: {
          taskDescription: true,
          codebaseAnalysis: true,
          researchReports: true,
          subtasks: true,
        },
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

      mockTaskMethods.delete.mockResolvedValue(expectedTask);

      const result = await repository.delete(taskId);

      expect(mockTaskMethods.delete).toHaveBeenCalledWith({
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

      mockTaskMethods.findMany.mockResolvedValue(expectedTasks);

      const result = await repository.findMany();

      expect(mockTaskMethods.findMany).toHaveBeenCalled();
      expect(result).toEqual(expectedTasks);
    });
  });
});
