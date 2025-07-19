import {
  WorkflowExecution,
  WorkflowRole,
  WorkflowStep,
  Prisma,
} from '../../../../../generated/prisma';

/**
 * Core entity types for Workflow Bootstrap domain
 */
export type WorkflowExecutionEntity = WorkflowExecution;
export type WorkflowRoleEntity = WorkflowRole;
export type WorkflowStepEntity = WorkflowStep;

/**
 * Bootstrap input interface
 */
export interface BootstrapWorkflowInput {
  initialRole:
    | 'product-manager'
    | 'architect'
    | 'senior-developer'
    | 'code-review';
  executionMode?: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  projectPath?: string;
}

/**
 * Enhanced result types
 */
export interface WorkflowExecutionWithRelations extends WorkflowExecution {
  task?: any;
  currentRole?: WorkflowRole;
  currentStep?: WorkflowStep | null;
}

export interface FirstStepInfo {
  id: string;
  name: string;
  description: string;
  sequenceNumber: number;
  stepType: string;
  approach: string;
}

/**
 * Repository operation results
 */
export interface BootstrapResult {
  success: boolean;
  data?: {
    workflowExecution: WorkflowExecutionWithRelations;
    role: WorkflowRoleEntity;
    firstStep: FirstStepInfo;
  };
  error?: string;
}

/**
 * Prisma transaction type for repository operations
 */
export type PrismaTransactionClient = Prisma.TransactionClient;
export type PrismaTransaction = Prisma.TransactionClient;
