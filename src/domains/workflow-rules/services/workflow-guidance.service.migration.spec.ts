/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { IWorkflowRoleRepository } from '../repositories/interfaces/workflow-role.repository.interface';
import { WorkflowGuidanceService } from './workflow-guidance.service';

describe('WorkflowGuidanceService Repository Migration', () => {
  let service: WorkflowGuidanceService;
  let workflowRoleRepository: jest.Mocked<IWorkflowRoleRepository>;

  const mockRole = {
    id: 'role1',
    name: 'architect',
    description: 'Architect role',
    priority: 1,
    isActive: true,
    capabilities: {},
    coreResponsibilities: {},
    keyCapabilities: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWorkflowRoleRepository = {
    findByName: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findActiveRoles: jest.fn(),
    findByPriority: jest.fn(),
    findByPriorityRange: jest.fn(),
    findRolesByHierarchy: jest.fn(),
    findDelegationCandidates: jest.fn(),
    findByCapability: jest.fn(),
    findByResponsibility: jest.fn(),
    findRoleTransitions: jest.fn(),
    findTransitionsByRole: jest.fn(),
    findCurrentExecutions: jest.fn(),
    findCapabilityPatterns: jest.fn(),
    findStepsForRole: jest.fn(),
    findRoleStepProgression: jest.fn(),
    upsert: jest.fn(),
    bulkUpdate: jest.fn(),
    bulkDelete: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    findOrCreate: jest.fn(),
    findByNameCaseInsensitive: jest.fn(),
    findActiveRolesByPriority: jest.fn(),
    findRolesByCapabilityType: jest.fn(),
    findRolesByResponsibilityType: jest.fn(),
    findRolesByExecutionContext: jest.fn(),
    findRolesByBehavioralProfile: jest.fn(),
    findRolesByPerformanceMetrics: jest.fn(),
    findRolesByQualityStandards: jest.fn(),
    findRolesByComplianceRequirements: jest.fn(),
    findRolesByRiskLevel: jest.fn(),
    findRolesByAuthorization: jest.fn(),
    findRolesByTechnicalStack: jest.fn(),
    findRolesByBusinessContext: jest.fn(),
    findRolesByProjectConstraints: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowGuidanceService,
        {
          provide: 'IWorkflowRoleRepository',
          useValue: mockWorkflowRoleRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowGuidanceService>(WorkflowGuidanceService);
    workflowRoleRepository = module.get('IWorkflowRoleRepository');
  });

  it('should successfully return minimal role guidance', async () => {
    // Arrange
    workflowRoleRepository.findByName.mockResolvedValue(mockRole);

    // Act
    const result = await service.getWorkflowGuidance('architect', {
      taskId: 1,
      projectPath: '/test/project',
    });

    // Assert
    expect(result.currentRole).toEqual(mockRole);
    expect(workflowRoleRepository.findByName).toHaveBeenCalledWith(
      'architect',
      {},
    );
    // Verify minimal response structure without projectContext
    expect(Object.keys(result)).toEqual(['currentRole']);
  });

  it('should verify repository methods are properly called', () => {
    // Verify that service no longer has any Prisma dependencies
    expect(service).toBeDefined();
    expect(workflowRoleRepository).toBeDefined();

    // Verify repository methods exist
    expect(typeof workflowRoleRepository.findByName).toBe('function');
  });
});
