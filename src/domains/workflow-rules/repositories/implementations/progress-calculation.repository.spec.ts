import { Test, TestingModule } from '@nestjs/testing';
import { ProgressCalculationRepository } from './progress-calculation.repository';
import { PrismaService } from '../../../../prisma/prisma.service';

describe('ProgressCalculationRepository', () => {
  let repository: ProgressCalculationRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressCalculationRepository,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findUnique: jest.fn(),
            },
            workflowRole: {
              findUnique: jest.fn(),
            },
            workflowStepProgress: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<ProgressCalculationRepository>(
      ProgressCalculationRepository,
    );
    prisma = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findTaskBasicInfo', () => {
    it('should find task basic info successfully', async () => {
      const mockTask = {
        id: 1,
        name: 'Test Task',
        status: 'in-progress',
        createdAt: new Date(),
      };

      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const result = await repository.findTaskBasicInfo(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
    });

    it('should handle task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findTaskBasicInfo(999);

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle database errors', async () => {
      (prisma.task.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await repository.findTaskBasicInfo(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('findRoleWithSteps', () => {
    it('should find role with steps successfully', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'boomerang',
        steps: [
          {
            id: 'step-1',
            name: 'Test Step',
            sequenceNumber: 1,
            description: 'Test step description',
            approach: 'Test approach',
            roleId: 'role-1',
            isRequired: true,
            stepType: 'ANALYSIS',
          },
        ],
      };

      (prisma.workflowRole.findUnique as jest.Mock).mockResolvedValue(mockRole);

      const result = await repository.findRoleWithSteps('boomerang');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRole);
    });

    it('should handle role not found', async () => {
      (prisma.workflowRole.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findRoleWithSteps('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle database errors', async () => {
      (prisma.workflowRole.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await repository.findRoleWithSteps('boomerang');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('findStepProgressByTaskId', () => {
    it('should find step progress successfully', async () => {
      const mockStepProgress = [
        {
          id: 'progress-1',
          taskId: '1',
          stepId: 'step-1',
          roleId: 'role-1',
          status: 'completed',
          result: null,
          startedAt: new Date(),
          completedAt: new Date(),
          failedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          step: {
            id: 'step-1',
            name: 'Test Step',
            sequenceNumber: 1,
            description: 'Test step',
            approach: 'Test approach',
            roleId: 'role-1',
            isRequired: true,
            stepType: 'ANALYSIS',
          },
          role: {
            id: 'role-1',
            name: 'boomerang',
            description: 'Test role',
            priority: 1,
            isActive: true,
            capabilities: {},
            coreResponsibilities: [],
            keyCapabilities: [],
          },
        },
      ];

      (prisma.workflowStepProgress.findMany as jest.Mock).mockResolvedValue(
        mockStepProgress as any,
      );

      const result = await repository.findStepProgressByTaskId(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStepProgress);
    });

    it('should handle database errors', async () => {
      (prisma.workflowStepProgress.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await repository.findStepProgressByTaskId(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });
});
