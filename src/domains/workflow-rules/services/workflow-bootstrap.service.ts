import { Inject, Injectable } from '@nestjs/common';
import { WorkflowBootstrapRepository } from '../repositories/implementations/workflow-bootstrap.repository';

// Simplified bootstrap input - just execution setup
export interface BootstrapWorkflowInput {
  // Workflow execution setup only
  initialRole: 'boomerang' | 'architect' | 'senior-developer' | 'code-review';
  executionMode?: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  projectPath?: string;
}

/**
 * Workflow Bootstrap Service - Simple Execution Kickoff
 *
 * SIMPLIFIED APPROACH:
 * 1. Creates workflow execution without any task details
 * 2. Points execution to first boomerang step (git integration setup)
 * 3. Returns comprehensive execution data for immediate step execution
 * 4. Workflow steps handle all task gathering, analysis, and creation
 */
@Injectable()
export class WorkflowBootstrapService {
  constructor(
    @Inject('IWorkflowBootstrapRepository')
    private readonly bootstrapRepository: WorkflowBootstrapRepository,
  ) {}

  /**
   * Bootstrap a workflow - SIMPLE EXECUTION KICKOFF
   *
   * WHAT THIS DOES:
   * 1. Creates workflow execution without task (taskId = null)
   * 2. Points execution to first boomerang step (git integration setup)
   * 3. Returns comprehensive execution data for immediate step execution
   * 4. Workflow steps guide the agent through everything else
   *
   * WHAT THE BOOMERANG WORKFLOW WILL DO:
   * - Step 1: Git integration setup and verification
   * - Step 2: Source code analysis with functional testing
   * - Step 3: Gather task requirements and create comprehensive task
   * - Step 4: Research decision framework
   * - Step 5: Role delegation
   */
  async bootstrapWorkflow(input: BootstrapWorkflowInput): Promise<any> {
    const result = await this.bootstrapRepository.bootstrapWorkflow(input);

    if (!result.success || !result.data) {
      return {
        success: false,
        message: `Bootstrap failed: ${result.error || 'Unknown error'}`,
        resources: {
          taskId: null,
          executionId: '',
          firstStepId: null,
        },
        execution: null,
        currentStep: null,
        currentRole: null,
      };
    }

    // Return execution data for immediate workflow start
    return {
      success: true,
      message: `Workflow execution started successfully. Begin with: ${result.data.firstStep.description}`,
      resources: {
        taskId: null, // Will be created by workflow
        executionId: result.data.workflowExecution.id,
        firstStepId: result.data.firstStep.id,
      },
      task: result.data.workflowExecution.task,
      currentStep: result.data.firstStep,
      currentRole: result.data.role,
    };
  }
}
