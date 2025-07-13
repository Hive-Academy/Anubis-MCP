import { Test, TestingModule } from '@nestjs/testing';
import { ProjectContextRepository } from './project-context.repository';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ProjectType, PatternType } from '../../../../../generated/prisma';
import {
  CreateProjectContextDTO,
  CreateProjectBehavioralProfileDTO,
  CreateProjectPatternDTO,
} from '../types/project-context.types';

describe('ProjectContextRepository', () => {
  let repository: ProjectContextRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    projectContext: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    projectBehavioralProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    projectPattern: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectContextRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ProjectContextRepository>(ProjectContextRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findProjectByPath', () => {
    it('should find project by path successfully', async () => {
      const projectPath = '/test/project/path';
      const expectedProject = {
        id: 1,
        projectPath,
        projectName: 'Test Project',
        projectType: ProjectType.SINGLE_APP,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.projectContext.findFirst.mockResolvedValue(
        expectedProject,
      );

      const result = await repository.findProjectByPath(projectPath);

      expect(result).toEqual(expectedProject);
      expect(mockPrismaService.projectContext.findFirst).toHaveBeenCalledWith({
        where: { projectPath },
      });
    });

    it('should return null when project not found', async () => {
      const projectPath = '/nonexistent/path';

      mockPrismaService.projectContext.findFirst.mockResolvedValue(null);

      const result = await repository.findProjectByPath(projectPath);

      expect(result).toBeNull();
      expect(mockPrismaService.projectContext.findFirst).toHaveBeenCalledWith({
        where: { projectPath },
      });
    });

    it('should handle database errors gracefully', async () => {
      const projectPath = '/test/project/path';
      const error = new Error('Database connection failed');

      mockPrismaService.projectContext.findFirst.mockRejectedValue(error);

      await expect(repository.findProjectByPath(projectPath)).rejects.toThrow(
        'Failed to find project by path: Database connection failed',
      );
    });
  });

  describe('createProjectContext', () => {
    it('should create project context successfully', async () => {
      const createData: CreateProjectContextDTO = {
        projectPath: '/test/project',
        projectName: 'Test Project',
        projectType: ProjectType.SINGLE_APP,
        complexity: 'medium',
        primaryLanguage: 'typescript',
      };

      const expectedProject = {
        id: 1,
        ...createData,
        frameworkStack: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.projectContext.create.mockResolvedValue(
        expectedProject,
      );

      const result = await repository.createProjectContext(createData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedProject);
      expect(mockPrismaService.projectContext.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectPath: createData.projectPath,
          projectName: createData.projectName,
          projectType: createData.projectType,
          frameworkStack: {},
        }),
      });
    });

    it('should handle creation errors gracefully', async () => {
      const createData: CreateProjectContextDTO = {
        projectPath: '/test/project',
        projectName: 'Test Project',
        projectType: ProjectType.SINGLE_APP,
      };

      const error = new Error('Unique constraint violation');
      mockPrismaService.projectContext.create.mockRejectedValue(error);

      const result = await repository.createProjectContext(createData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Failed to create project context: Unique constraint violation',
      );
    });
  });

  describe('findBehavioralProfile', () => {
    it('should find behavioral profile by project and role', async () => {
      const projectContextId = 1;
      const roleId = 'test-role-id';
      const expectedProfile = {
        id: 1,
        projectContextId,
        roleId,
        qualityStandards: { testCoverage: 80 },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.projectBehavioralProfile.findFirst.mockResolvedValue(
        expectedProfile,
      );

      const result = await repository.findBehavioralProfile(
        projectContextId,
        roleId,
      );

      expect(result).toEqual(expectedProfile);
      expect(
        mockPrismaService.projectBehavioralProfile.findFirst,
      ).toHaveBeenCalledWith({
        where: { projectContextId, roleId },
      });
    });

    it('should find behavioral profile without role filter', async () => {
      const projectContextId = 1;
      const expectedProfile = {
        id: 1,
        projectContextId,
        roleId: 'any-role',
        qualityStandards: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.projectBehavioralProfile.findFirst.mockResolvedValue(
        expectedProfile,
      );

      const result = await repository.findBehavioralProfile(projectContextId);

      expect(result).toEqual(expectedProfile);
      expect(
        mockPrismaService.projectBehavioralProfile.findFirst,
      ).toHaveBeenCalledWith({
        where: { projectContextId },
      });
    });
  });

  describe('findProjectPatterns', () => {
    it('should find and transform project patterns', async () => {
      const projectContextId = 1;
      const mockPatterns = [
        {
          id: 1,
          patternName: 'Repository Pattern',
          patternType: PatternType.ARCHITECTURAL,
          description: 'Data access pattern',
          projectContextId,
        },
        {
          id: 2,
          patternName: 'Error Handling',
          patternType: PatternType.ERROR_HANDLING,
          description: 'Standard error handling approach',
          projectContextId,
        },
      ];

      mockPrismaService.projectPattern.findMany.mockResolvedValue(mockPatterns);

      const result = await repository.findProjectPatterns(projectContextId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Repository Pattern',
        type: PatternType.ARCHITECTURAL,
        description: 'Data access pattern',
        usage: 'general',
        confidence: 0.8,
      });
      expect(result[1]).toEqual({
        name: 'Error Handling',
        type: PatternType.ERROR_HANDLING,
        description: 'Standard error handling approach',
        usage: 'general',
        confidence: 0.8,
      });
      expect(mockPrismaService.projectPattern.findMany).toHaveBeenCalledWith({
        where: { projectContextId },
        take: 50,
      });
    });

    it('should apply filters and limits correctly', async () => {
      const projectContextId = 1;
      const filters = {
        patternType: PatternType.TESTING,
        maxPatternsReturned: 10,
      };

      mockPrismaService.projectPattern.findMany.mockResolvedValue([]);

      await repository.findProjectPatterns(projectContextId, filters);

      expect(mockPrismaService.projectPattern.findMany).toHaveBeenCalledWith({
        where: { projectContextId, patternType: PatternType.TESTING },
        take: 10,
      });
    });
  });

  describe('getRoleProjectContext', () => {
    it('should get complete role project context', async () => {
      const projectPath = '/test/project';
      const roleId = 'test-role-id';
      const maxPatterns = 25;

      const mockProjectContext = {
        id: 1,
        projectPath,
        projectName: 'Test Project',
        projectType: ProjectType.SINGLE_APP,
      };

      const mockBehavioralProfile = {
        id: 1,
        projectContextId: 1,
        roleId,
        qualityStandards: { testCoverage: 80 },
      };

      const mockPatterns = [
        {
          name: 'Repository Pattern',
          type: PatternType.ARCHITECTURAL,
          description: 'Data access pattern',
          usage: 'general',
          confidence: 0.8,
        },
      ];

      // Mock the individual method calls
      jest
        .spyOn(repository, 'findProjectByPath')
        .mockResolvedValue(mockProjectContext as any);
      jest
        .spyOn(repository, 'findBehavioralProfile')
        .mockResolvedValue(mockBehavioralProfile as any);
      jest
        .spyOn(repository, 'findProjectPatterns')
        .mockResolvedValue(mockPatterns);

      const result = await repository.getRoleProjectContext(
        projectPath,
        roleId,
        maxPatterns,
      );

      expect(result).toEqual({
        projectContext: mockProjectContext,
        behavioralProfile: mockBehavioralProfile,
        patterns: mockPatterns,
      });

      expect(repository.findProjectByPath).toHaveBeenCalledWith(
        projectPath,
        undefined,
      );
      expect(repository.findBehavioralProfile).toHaveBeenCalledWith(
        1,
        roleId,
        undefined,
      );
      expect(repository.findProjectPatterns).toHaveBeenCalledWith(
        1,
        { maxPatternsReturned: maxPatterns },
        undefined,
      );
    });

    it('should handle case when project context not found', async () => {
      const projectPath = '/nonexistent/project';
      const roleId = 'test-role-id';

      jest.spyOn(repository, 'findProjectByPath').mockResolvedValue(null);

      const result = await repository.getRoleProjectContext(
        projectPath,
        roleId,
      );

      expect(result).toEqual({
        projectContext: null,
        behavioralProfile: null,
        patterns: [],
      });

      expect(repository.findProjectByPath).toHaveBeenCalledWith(
        projectPath,
        undefined,
      );
    });
  });
});
