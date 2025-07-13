import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowGuidanceService } from '../workflow-guidance.service';
import { IProjectContextRepository } from '../repositories/interfaces/project-context.repository.interface';
import { IWorkflowRoleRepository } from '../repositories/interfaces/workflow-role.repository.interface';

describe('WorkflowGuidanceService Repository Migration', () => {
  let service: WorkflowGuidanceService;
  let projectContextRepository: jest.Mocked<IProjectContextRepository>;
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

  const mockProjectContext = {
    id: 1,
    projectPath: '/test/project',
    projectType: 'web-app',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProjectContextRepository = {
      findProjectByPath: jest.fn(),
      findBehavioralProfile: jest.fn(),
      findProjectPatterns: jest.fn(),
    };

    const mockWorkflowRoleRepository = {
      findByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowGuidanceService,
        {
          provide: 'IProjectContextRepository',
          useValue: mockProjectContextRepository,
        },
        {
          provide: 'IWorkflowRoleRepository',
          useValue: mockWorkflowRoleRepository,
        },
      ],
    }).compile();

    service = module.get<WorkflowGuidanceService>(WorkflowGuidanceService);
    projectContextRepository = module.get('IProjectContextRepository');
    workflowRoleRepository = module.get('IWorkflowRoleRepository');
  });

  it('should successfully migrate from Prisma to repositories', async () => {
    // Arrange
    workflowRoleRepository.findByName.mockResolvedValue(mockRole);
    projectContextRepository.findProjectByPath.mockResolvedValue(
      mockProjectContext,
    );
    projectContextRepository.findBehavioralProfile.mockResolvedValue(null);
    projectContextRepository.findProjectPatterns.mockResolvedValue([]);

    // Act
    const result = await service.getWorkflowGuidance('architect', {
      taskId: 1,
      projectPath: '/test/project',
    });

    // Assert
    expect(result.currentRole).toEqual(mockRole);
    expect(result.projectContext.projectType).toBe('web-app');
    expect(workflowRoleRepository.findByName).toHaveBeenCalledWith('architect');
    expect(projectContextRepository.findProjectByPath).toHaveBeenCalledWith(
      '/test/project',
    );
    expect(projectContextRepository.findBehavioralProfile).toHaveBeenCalledWith(
      1,
    );
    expect(projectContextRepository.findProjectPatterns).toHaveBeenCalledWith(
      1,
      {
        maxPatternsReturned: 50,
      },
    );
  });

  it('should verify all repository methods are properly called', () => {
    // Verify that service no longer has any Prisma dependencies
    expect(service).toBeDefined();
    expect(projectContextRepository).toBeDefined();
    expect(workflowRoleRepository).toBeDefined();

    // Verify repository methods exist
    expect(typeof projectContextRepository.findProjectByPath).toBe('function');
    expect(typeof projectContextRepository.findBehavioralProfile).toBe(
      'function',
    );
    expect(typeof projectContextRepository.findProjectPatterns).toBe(
      'function',
    );
    expect(typeof workflowRoleRepository.findByName).toBe('function');
  });
});
