import { StepGuidanceService } from './step-guidance.service';
import { StepQueryService } from './step-query.service';
import { RequiredInputExtractorService } from './required-input-extractor.service';
import { WorkflowExecutionService } from './workflow-execution.service';

const createMocks = () => {
  const stepQuery = {
    getFirstStepForRole: jest.fn(),
    validateAndSyncExecutionState: jest.fn(),
    getNextAvailableStep: jest.fn(),
    getNextStepAfterCompletion: jest.fn(),
  } as unknown as StepQueryService;

  const reqInput = {} as RequiredInputExtractorService;

  const workflowExec = {
    getExecutionById: jest.fn(),
  } as unknown as WorkflowExecutionService;

  return { stepQuery, reqInput, workflowExec };
};

describe('StepGuidanceService.resolveStepId', () => {
  it('returns first step in bootstrap mode when no execution progress', async () => {
    const { stepQuery, reqInput, workflowExec } = createMocks();

    stepQuery.getFirstStepForRole = jest
      .fn()
      .mockResolvedValue({ id: 'step1', name: 'first', sequenceNumber: 1 });

    const service = new StepGuidanceService(stepQuery, reqInput, workflowExec);

    const resolved = await (service as any).resolveStepId({
      taskId: 0,
      roleId: 'roleX',
      executionId: undefined,
    });

    expect(resolved).toBe('step1');
  });

  it('returns step from execution state when valid', async () => {
    const { stepQuery, reqInput, workflowExec } = createMocks();

    stepQuery.validateAndSyncExecutionState = jest.fn().mockResolvedValue({
      isValid: true,
      corrected: false,
      currentStep: { id: 'step2' },
    });

    const service = new StepGuidanceService(stepQuery, reqInput, workflowExec);

    const resolved = await (service as any).resolveStepId({
      taskId: 1,
      roleId: 'roleX',
    });

    expect(resolved).toBe('step2');
  });

  it('bootstrap progression returns next step after first completed', async () => {
    const { stepQuery, reqInput, workflowExec } = createMocks();

    // Mock execution with one completed step and currentStepId being lastCompleted
    workflowExec.getExecutionById = jest.fn().mockResolvedValue({
      stepsCompleted: 1,
      currentStepId: 'step1',
      executionState: { lastCompletedStep: { id: 'step1' } },
    });
    stepQuery.getNextStepAfterCompletion = jest
      .fn()
      .mockResolvedValue({ id: 'step2', name: 'next' });

    const svc = new StepGuidanceService(stepQuery, reqInput, workflowExec);
    const resolved = await (svc as any).resolveStepId({
      taskId: 0,
      roleId: 'roleX',
      executionId: 'exec',
    });
    expect(resolved).toBe('step2');
  });

  it('falls back to next available step when execution state invalid', async () => {
    const { stepQuery, reqInput, workflowExec } = createMocks();

    stepQuery.validateAndSyncExecutionState = jest
      .fn()
      .mockResolvedValue({ isValid: false });
    stepQuery.getNextAvailableStep = jest
      .fn()
      .mockResolvedValue({ id: 'step3', name: 'available', roleId: 'roleX' });

    const svc = new StepGuidanceService(stepQuery, reqInput, workflowExec);
    const resolved = await (svc as any).resolveStepId({
      taskId: 1,
      roleId: 'roleX',
    });
    expect(resolved).toBe('step3');
  });

  it('ultimate fallback returns first step when no other resolution', async () => {
    const { stepQuery, reqInput, workflowExec } = createMocks();

    stepQuery.validateAndSyncExecutionState = jest
      .fn()
      .mockResolvedValue({ isValid: false });
    stepQuery.getNextAvailableStep = jest.fn().mockResolvedValue(null);
    stepQuery.getFirstStepForRole = jest
      .fn()
      .mockResolvedValue({ id: 'stepFirst', name: 'first' });

    const svc = new StepGuidanceService(stepQuery, reqInput, workflowExec);
    const resolved = await (svc as any).resolveStepId({
      taskId: 1,
      roleId: 'roleX',
    });
    expect(resolved).toBe('stepFirst');
  });
});
