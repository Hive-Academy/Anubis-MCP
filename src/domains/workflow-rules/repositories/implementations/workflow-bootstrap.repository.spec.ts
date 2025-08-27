// Simplified test file to focus on essential bootstrap functionality
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowBootstrapRepository } from './workflow-bootstrap.repository';
import { PrismaService } from '../../../../prisma/prisma.service';
import { BootstrapWorkflowInput } from '../types/workflow-bootstrap.types';

describe('WorkflowBootstrapRepository', () => {
  let repository: WorkflowBootstrapRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowBootstrapRepository,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<WorkflowBootstrapRepository>(
      WorkflowBootstrapRepository,
    );
    prisma = module.get<PrismaService>(
      PrismaService,
    ) as jest.Mocked<PrismaService>;
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('bootstrapWorkflow', () => {
    const mockInput: BootstrapWorkflowInput = {
      initialRole: 'product-manager' as const,
      executionMode: 'GUIDED',
      projectPath: '/test/project',
    };

    it('should successfully bootstrap workflow', async () => {
      const mockResult = {
        workflowExecution: { id: 'execution-1' },
        role: { name: 'product-manager' },
        firstStep: { name: 'Test Step' },
      };

      const mockTransaction = jest.fn().mockResolvedValue(mockResult);
      prisma.$transaction.mockImplementation(mockTransaction);

      const result = await repository.bootstrapWorkflow(mockInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors', async () => {
      const mockTransaction = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      prisma.$transaction.mockImplementation(mockTransaction);

      const result = await repository.bootstrapWorkflow(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });
});
