/**
 * Test script to verify the workflow progress improvements
 */

import { Test, TestingModule } from '@nestjs/testing';
import { StepExecutionMcpService } from '../src/domains/workflow-rules/mcp-operations/step-execution-mcp.service';
import { StepExecutionService } from '../src/domains/workflow-rules/services/step-execution.service';
import { WorkflowExecutionOperationsService } from '../src/domains/workflow-rules/services/workflow-execution-operations.service';
import { StepGuidanceService } from '../src/domains/workflow-rules/services/step-guidance.service';

describe('Workflow Progress Improvements', () => {
  let service: StepExecutionMcpService;
  let stepExecutionService: StepExecutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepExecutionMcpService,
        {
          provide: StepExecutionService,
          useValue: {
            processStepCompletion: jest.fn(),
            getNextAvailableStep: jest.fn(),
          },
        },
        {
          provide: StepGuidanceService,
          useValue: {
            getStepGuidance: jest.fn(),
          },
        },
        {
          provide: WorkflowExecutionOperationsService,
          useValue: {
            getExecution: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StepExecutionMcpService>(StepExecutionMcpService);
    stepExecutionService =
      module.get<StepExecutionService>(StepExecutionService);
  });

  describe('Data Extraction Methods', () => {
    it('should extract validation results correctly', () => {
      const executionData = {
        validationResults: 'All checks passed',
        qualityChecksComplete: true,
        testingResults: { unit: 'passed', integration: 'passed' },
        unrelatedField: 'should not be included',
      };

      const result = service['extractValidationResults'](executionData);

      expect(result).toEqual({
        validationResults: 'All checks passed',
        qualityChecksComplete: true,
        testingResults: { unit: 'passed', integration: 'passed' },
      });
    });

    it('should extract report data correctly', () => {
      const executionData = {
        outputSummary: 'Task completed successfully',
        filesModified: ['file1.ts', 'file2.ts'],
        commandsExecuted: ['npm test', 'git commit'],
        unrelatedField: 'should not be included',
      };

      const result = service['extractReportData'](
        executionData,
        'step-123',
        'success',
      );

      expect(result).toEqual({
        stepId: 'step-123',
        result: 'success',
        timestamp: expect.any(String),
        outputSummary: 'Task completed successfully',
        filesModified: ['file1.ts', 'file2.ts'],
        commandsExecuted: ['npm test', 'git commit'],
      });
    });

    it('should extract key findings from completed steps', () => {
      const completedSteps = [
        {
          stepName: 'Setup',
          executionData: {
            outputSummary: 'Project initialized',
            filesModified: ['package.json'],
          },
          validationResults: { status: 'passed' },
        },
        {
          stepName: 'Implementation',
          executionData: {
            implementationSummary: 'Core features implemented',
            commandsExecuted: ['npm install', 'npm test'],
          },
        },
      ];

      const result = service['extractKeyFindings'](completedSteps);

      expect(result).toEqual([
        'Setup: Project initialized',
        'Setup: Modified 1 files',
        'Setup: Validation completed',
        'Implementation: Core features implemented',
        'Implementation: Executed 2 commands',
      ]);
    });
  });

  describe('Step Completion Processing', () => {
    it('should process step completion with validation and report data', async () => {
      const mockExecution = {
        id: 'exec-123',
        taskId: 1,
        currentRoleId: 'role-123',
      };

      const executionData = {
        outputSummary: 'Step completed successfully',
        validationResults: 'All checks passed',
        filesModified: ['file1.ts'],
        qualityChecksComplete: true,
      };

      // Mock the repository access
      const mockRepository = {
        create: jest.fn().mockResolvedValue({}),
      };

      stepExecutionService['workflowExecutionRepository'] = {
        findById: jest.fn().mockResolvedValue(mockExecution),
      };

      stepExecutionService['stepProgressRepository'] = mockRepository;

      await stepExecutionService.processStepCompletion(
        'exec-123',
        'step-123',
        'success',
        executionData,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          executionId: 'exec-123',
          stepId: 'step-123',
          status: 'COMPLETED',
          result: 'SUCCESS',
          executionData: expect.objectContaining({
            outputSummary: 'Step completed successfully',
            validationResults: 'All checks passed',
            filesModified: ['file1.ts'],
            qualityChecksComplete: true,
          }),
          validationResults: expect.objectContaining({
            validationResults: 'All checks passed',
            qualityChecksComplete: true,
          }),
          reportData: expect.objectContaining({
            stepId: 'step-123',
            result: 'success',
            outputSummary: 'Step completed successfully',
            filesModified: ['file1.ts'],
          }),
        }),
      );
    });
  });
});
