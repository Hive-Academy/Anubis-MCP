import {
  BootstrapResult,
  BootstrapWorkflowInput,
  PrismaTransaction,
} from '../types/workflow-bootstrap.types';

/**
 * Repository interface for Workflow Bootstrap domain operations
 * Handles workflow execution creation, role initialization, and bootstrap state management
 * Used by workflow-bootstrap.service.ts for bootstrap operations
 */
export interface IWorkflowBootstrapRepository {
  /**
   * Bootstrap a complete workflow execution with role and step setup
   * @param input - Bootstrap workflow input data
   * @param tx - Optional transaction client
   * @returns Promise<BootstrapResult>
   */
  bootstrapWorkflow(
    input: BootstrapWorkflowInput,
    tx?: PrismaTransaction,
  ): Promise<BootstrapResult>;
}
