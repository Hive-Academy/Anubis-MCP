import { WorkflowExecutionService } from './workflow-execution.service';
import { WorkflowExecutionState } from '../utils/workflow-execution-state.schema';

// Simple PrismaService mock with only methods used in updateExecutionState
const createMockPrisma = () => ({
  workflowExecution: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

describe('WorkflowExecutionService.updateExecutionState', () => {
  it('merges patch, validates with Zod, and persists via Prisma', async () => {
    const prismaMock = createMockPrisma();

    prismaMock.workflowExecution.findUnique.mockResolvedValue({
      id: 'exec1',
      executionState: {
        phase: 'initialized',
      } as Partial<WorkflowExecutionState>,
    });
    prismaMock.workflowExecution.update.mockResolvedValue({ id: 'exec1' });

    const service = new WorkflowExecutionService(prismaMock as any);

    await expect(
      service.updateExecutionState('exec1', { phase: 'in-progress' }),
    ).resolves.not.toThrow();

    expect(prismaMock.workflowExecution.update).toHaveBeenCalledTimes(1);
    const updateArgs = prismaMock.workflowExecution.update.mock.calls[0][0];
    expect(updateArgs.data.executionState.phase).toBe('in-progress');
  });
});
