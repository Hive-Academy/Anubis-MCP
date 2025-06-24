import { WorkflowExecutionService } from '../src/task-workflow/domains/workflow-rules/services/workflow-execution.service';
import { WorkflowExecutionState } from '../src/task-workflow/domains/workflow-rules/utils/workflow-execution-state.schema';

describe('WorkflowExecutionService.updateExecutionState', () => {
  const createMockPrisma = () => ({
    workflowExecution: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  });

  it('merges patch and validates successfully', async () => {
    const prisma = createMockPrisma();
    prisma.workflowExecution.findUnique.mockResolvedValue({
      id: 'exec',
      executionState: {
        phase: 'initialized',
      } as Partial<WorkflowExecutionState>,
    });
    const svc = new WorkflowExecutionService(prisma as any);
    await expect(
      svc.updateExecutionState('exec', { phase: 'in-progress' }),
    ).resolves.not.toThrow();
    expect(prisma.workflowExecution.update).toHaveBeenCalled();
  });

  it('throws on invalid patch (missing required enum)', async () => {
    const prisma = createMockPrisma();
    prisma.workflowExecution.findUnique.mockResolvedValue({
      id: 'exec',
      executionState: {
        phase: 'initialized',
      } as Partial<WorkflowExecutionState>,
    });
    const svc = new WorkflowExecutionService(prisma as any);
    await expect(
      svc.updateExecutionState('exec', { phase: 'unknown' as any }),
    ).rejects.toBeTruthy();
  });
});
