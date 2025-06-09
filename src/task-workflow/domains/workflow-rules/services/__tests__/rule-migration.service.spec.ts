import { Test, TestingModule } from '@nestjs/testing';
import { RuleMigrationService } from '../rule-migration.service';
import { PrismaService } from '../../../../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('RuleMigrationService', () => {
  let service: RuleMigrationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    ruleVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    workflowRole: {
      upsert: jest.fn(),
    },
    workflowStep: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleMigrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RuleMigrationService>(RuleMigrationService);
    prismaService = module.get(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('migrateMarkdownRules', () => {
    it('should successfully migrate markdown rules to database', async () => {
      // Mock file system operations
      mockFs.readdir.mockResolvedValue([
        { name: '100-boomerang-role.md', isFile: () => true } as any,
        { name: '300-architect-role.md', isFile: () => true } as any,
      ]);

      mockFs.readFile.mockImplementation((filePath: string) => {
        if (filePath.includes('boomerang')) {
          return Promise.resolve(`
# Boomerang Role

## Task Intake and Analysis
Comprehensive initial analysis and task setup.

## Quality Validation
Ensure all deliverables meet standards.
          `);
        }
        return Promise.resolve(`
# Architect Role

## System Design
Create comprehensive architecture plans.

## Technical Decision Making
Make informed technical choices.
        `);
      });

      // Mock database operations
      mockPrismaService.ruleVersion.create.mockResolvedValue({
        id: 'version-1',
        version: 'v1.0.0',
        description: 'Test migration',
        isActive: false,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        changeLog: {},
        testGroup: null,
        testPercentage: null,
        createdBy: 'migration-service',
      });

      mockPrismaService.workflowRole.upsert.mockResolvedValue({
        id: 'role-1',
        name: 'boomerang',
        displayName: 'Boomerang Role',
        description: '',
        priority: 100,
        roleType: 'WORKFLOW',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaService.workflowStep.create.mockResolvedValue({
        id: 'step-1',
        roleId: 'role-1',
        name: 'task_intake_and_analysis',
        displayName: 'Task Intake and Analysis',
        description: 'Comprehensive initial analysis and task setup.',
        sequenceNumber: 1,
        stepType: 'ANALYSIS',
        behavioralContext: null,
        qualityChecklist: null,
        actionData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Execute migration
      const result = await service.migrateMarkdownRules('/test/path', {
        version: 'v1.0.0',
        description: 'Test migration',
      });

      // Assertions
      expect(result.success).toBe(true);
      expect(result.migratedRules).toBe(2);
      expect(result.version).toBe('v1.0.0');
      expect(mockPrismaService.ruleVersion.create).toHaveBeenCalledWith({
        data: {
          version: 'v1.0.0',
          description: 'Test migration',
          changeLog: {},
          testGroup: undefined,
          testPercentage: undefined,
          isActive: false,
          isDefault: true,
          createdBy: 'migration-service',
        },
      });
    });

    it('should handle migration errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await service.migrateMarkdownRules('/invalid/path', {
        version: 'v1.0.0',
        description: 'Test migration',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Migration failed');
    });
  });

  describe('rollbackToVersion', () => {
    it('should successfully rollback to a previous version', async () => {
      const mockVersion = {
        id: 'version-1',
        version: 'v1.0.0',
        description: 'Previous version',
        isActive: false,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        changeLog: {},
        testGroup: null,
        testPercentage: null,
        createdBy: 'migration-service',
      };

      mockPrismaService.ruleVersion.findFirst.mockResolvedValue(mockVersion);
      mockPrismaService.ruleVersion.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.ruleVersion.update.mockResolvedValue({
        ...mockVersion,
        isActive: true,
        isDefault: true,
      });

      const result = await service.rollbackToVersion('v1.0.0');

      expect(result.success).toBe(true);
      expect(result.version).toBe('v1.0.0');
      expect(mockPrismaService.ruleVersion.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false, isDefault: false },
      });
      expect(mockPrismaService.ruleVersion.update).toHaveBeenCalledWith({
        where: { id: 'version-1' },
        data: { isActive: true, isDefault: true },
      });
    });

    it('should handle rollback to non-existent version', async () => {
      mockPrismaService.ruleVersion.findFirst.mockResolvedValue(null);

      const result = await service.rollbackToVersion('v999.0.0');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Version v999.0.0 not found');
    });
  });

  describe('getMigrationHistory', () => {
    it('should return migration history ordered by creation date', async () => {
      const mockHistory = [
        {
          id: 'version-2',
          version: 'v2.0.0',
          description: 'Latest version',
          isActive: true,
          isDefault: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date(),
          changeLog: {},
          testGroup: null,
          testPercentage: null,
          createdBy: 'migration-service',
        },
        {
          id: 'version-1',
          version: 'v1.0.0',
          description: 'Previous version',
          isActive: false,
          isDefault: false,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          changeLog: {},
          testGroup: null,
          testPercentage: null,
          createdBy: 'migration-service',
        },
      ];

      mockPrismaService.ruleVersion.findMany.mockResolvedValue(mockHistory);

      const result = await service.getMigrationHistory();

      expect(result).toEqual(mockHistory);
      expect(mockPrismaService.ruleVersion.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cleanupOldVersions', () => {
    it('should clean up old versions keeping specified count', async () => {
      const oldVersions = [
        {
          id: 'version-old-1',
          version: 'v0.1.0',
          description: 'Very old version',
          isActive: false,
          isDefault: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date(),
          changeLog: {},
          testGroup: null,
          testPercentage: null,
          createdBy: 'migration-service',
        },
      ];

      mockPrismaService.ruleVersion.findMany.mockResolvedValue(oldVersions);
      mockPrismaService.ruleVersion.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.cleanupOldVersions(5);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Cleaned up 1 old versions');
      expect(mockPrismaService.ruleVersion.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 5,
      });
      expect(mockPrismaService.ruleVersion.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['version-old-1'] } },
      });
    });

    it('should handle case when no old versions exist', async () => {
      mockPrismaService.ruleVersion.findMany.mockResolvedValue([]);

      const result = await service.cleanupOldVersions(5);

      expect(result.success).toBe(true);
      expect(result.message).toBe('No old versions to clean up');
      expect(mockPrismaService.ruleVersion.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('parseMarkdownContent', () => {
    it('should correctly parse role priority', () => {
      const priorities = [
        { roleType: 'boomerang', expected: 100 },
        { roleType: 'researcher', expected: 200 },
        { roleType: 'architect', expected: 300 },
        { roleType: 'senior_developer', expected: 400 },
        { roleType: 'code_review', expected: 500 },
        { roleType: 'integration_engineer', expected: 600 },
        { roleType: 'unknown_role', expected: 999 },
      ];

      priorities.forEach(({ roleType, expected }) => {
        const priority = (service as any).getRolePriority(roleType);
        expect(priority).toBe(expected);
      });
    });

    it('should correctly infer step types', () => {
      const stepTypes = [
        { content: 'validate the input', expected: 'VALIDATION' },
        { content: 'check requirements', expected: 'VALIDATION' },
        { content: 'analyze the code', expected: 'ANALYSIS' },
        { content: 'review the design', expected: 'ANALYSIS' },
        { content: 'create new service', expected: 'ACTION' },
        { content: 'implement feature', expected: 'ACTION' },
        { content: 'delegate to architect', expected: 'DELEGATION' },
        { content: 'handoff to developer', expected: 'DELEGATION' },
        { content: 'generate report', expected: 'REPORTING' },
        { content: 'document findings', expected: 'REPORTING' },
        { content: 'some other action', expected: 'ACTION' },
      ];

      stepTypes.forEach(({ content, expected }) => {
        const stepType = (service as any).inferStepType(content);
        expect(stepType).toBe(expected);
      });
    });
  });
});
