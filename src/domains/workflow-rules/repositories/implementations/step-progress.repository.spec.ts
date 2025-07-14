import { Test, TestingModule } from '@nestjs/testing';
import { StepProgressRepository } from '../implementations/step-progress.repository';
import { PrismaService } from '../../../../prisma/prisma.service';
import { StepProgressStatus } from '../../../../../generated/prisma';

describe('StepProgressRepository', () => {
  let repository: StepProgressRepository;
  let _prismaService: PrismaService;

  const mockStepProgressMethods = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  };

  const mockPrismaService = {
    workflowStepProgress: mockStepProgressMethods,
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepProgressRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<StepProgressRepository>(StepProgressRepository);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find step progress by ID', async () => {
      const mockStepProgress = {
        id: 'step-1',
        stepId: 'step-id',
        executionId: 'execution-id',
        roleId: 'role-id',
        status: 'IN_PROGRESS' as StepProgressStatus,
      };

      mockStepProgressMethods.findUnique.mockResolvedValue(mockStepProgress);

      const result = await repository.findById('step-1');

      expect(result).toEqual(mockStepProgress);
      expect(mockStepProgressMethods.findUnique).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        include: expect.any(Object),
      });
    });

    it('should return null when step progress not found', async () => {
      mockStepProgressMethods.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create step progress record', async () => {
      const createData = {
        stepId: 'step-id',
        executionId: 'execution-id',
        roleId: 'role-id',
        status: 'IN_PROGRESS' as StepProgressStatus,
      };

      const mockCreatedStepProgress = {
        id: 'new-step-progress-id',
        ...createData,
      };

      mockStepProgressMethods.create.mockResolvedValue(mockCreatedStepProgress);

      const result = await repository.create(createData);

      expect(result).toEqual(mockCreatedStepProgress);
      expect(mockStepProgressMethods.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createData),
        include: expect.any(Object),
      });
    });
  });

  describe('startStep', () => {
    it('should start step with correct initial data', async () => {
      const stepId = 'step-id';
      const executionId = 'execution-id';
      const roleId = 'role-id';
      const taskId = 'task-id';

      const mockCreatedStepProgress = {
        id: 'new-step-progress-id',
        stepId,
        executionId,
        roleId,
        taskId,
        status: 'IN_PROGRESS' as StepProgressStatus,
        startedAt: new Date(),
        executionData: {
          executionType: 'MCP_ONLY',
          phase: 'GUIDANCE_PREPARED',
        },
      };

      mockStepProgressMethods.create.mockResolvedValue(mockCreatedStepProgress);

      const result = await repository.startStep(
        stepId,
        executionId,
        roleId,
        taskId,
      );

      expect(result).toEqual(mockCreatedStepProgress);
      expect(mockStepProgressMethods.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stepId,
          executionId,
          roleId,
          taskId,
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date),
          executionData: {
            executionType: 'MCP_ONLY',
            phase: 'GUIDANCE_PREPARED',
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('getProgressSummary', () => {
    it('should calculate progress summary correctly', async () => {
      const roleId = 'role-id';
      const mockProgressRecords = [
        { status: 'COMPLETED', duration: 1000 },
        { status: 'COMPLETED', duration: 2000 },
        { status: 'IN_PROGRESS', duration: null },
        { status: 'FAILED', duration: null },
      ];

      mockStepProgressMethods.findMany.mockResolvedValue(mockProgressRecords);

      const result = await repository.getProgressSummary(roleId);

      expect(result).toEqual({
        roleId,
        totalSteps: 4,
        completedSteps: 2,
        failedSteps: 1,
        inProgressSteps: 1,
        averageExecutionTime: 1500,
        successRate: 50,
      });
    });
  });
});
