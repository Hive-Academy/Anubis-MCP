# Execution-State Refactor Plan

_This document captures the agreed-upon enhancements for reliable bootstrap-phase step progression and overall execution-state safety. It replaces the ad-hoc JSON blob with a validated schema and simplifies `StepGuidanceService` in line with SOLID / KISS / DRY._

---

## 1 Formal `WorkflowExecutionState` schema (TypeScript + Zod)

```ts
export interface WorkflowExecutionState {
  phase:
    | 'initialized'
    | 'in-progress'
    | 'role_transitioned'
    | 'completed'
    | string;
  currentContext?: Record<string, unknown>;
  currentStep?: {
    id: string;
    name: string;
    sequenceNumber: number;
    assignedAt: string; // ISO-8601
  };
  lastCompletedStep?: {
    id: string;
    completedAt: string;
    result: 'success' | 'failure';
  };
  lastTransition?: {
    newRoleId: string;
    timestamp: string;
  };
  progressMarkers?: string[];
  lastProgressUpdate?: string;
}

export const WorkflowExecutionStateSchema = z.object({
  phase: z.string(),
  currentContext: z.record(z.unknown()).optional(),
  currentStep: z
    .object({
      id: z.string(),
      name: z.string(),
      sequenceNumber: z.number().int(),
      assignedAt: z.string(),
    })
    .optional(),
  lastCompletedStep: z
    .object({
      id: z.string(),
      completedAt: z.string(),
      result: z.enum(['success', 'failure']),
    })
    .optional(),
  lastTransition: z
    .object({
      newRoleId: z.string(),
      timestamp: z.string(),
    })
    .optional(),
  progressMarkers: z.array(z.string()).optional(),
  lastProgressUpdate: z.string().optional(),
});
```

### Helper for validated writes

```ts
async function updateExecutionState(
  executionId: string,
  patch: Partial<WorkflowExecutionState>,
) {
  const exec = await this.getExecutionById(executionId);
  const newState: WorkflowExecutionState = {
    ...(exec.executionState as WorkflowExecutionState),
    ...patch,
  };
  WorkflowExecutionStateSchema.parse(newState); // runtime guard
  await this.prisma.workflowExecution.update({
    where: { id: executionId },
    data: { executionState: newState },
  });
}
```

All services (`StepExecutionService`, `RoleTransitionService`, etc.) should rely
on this helper instead of manual `prisma.workflowExecution.update({ … executionState })` calls.

---

## 2 `StepGuidanceService` refactor

### New structure

```
StepGuidanceService
 ├─ getStepGuidance()            // public – unchanged signature
 └─ resolveStepId()              // orchestration only
     ├─ handleBootstrap()
     ├─ resolveFromExecution()
     └─ findFallbackStep()
```

- **handleBootstrap** – uses `executionId`-based logic to read
  `stepsCompleted`, compare `lastCompletedStep.id === currentStepId`, and fetch
  `getNextStepAfterCompletion()` accordingly.
- **resolveFromExecution** – current task-bound path (uses existing
  `validateAndSyncExecutionState`).
- **findFallbackStep** – returns first step for role as ultimate fallback.

### Why this is DRY / KISS / SOLID

- Single-purpose helpers make behaviour explicit and individually testable.
- No deep/nested conditionals in `resolveStepId`.
- Execution reading & next-step logic lives in `StepQueryService` → maintains
  SRP and reuse.

---

## 3 Unit-test matrix (for later)

| Case | taskId | stepsCompleted | lastCompleted == currentStep | Expected           |
| ---- | ------ | -------------- | ---------------------------- | ------------------ |
| 1    | 0      | 0              | N/A                          | first step         |
| 2    | 0      | 1              | true                         | second step        |
| 3    | 0      | 1              | false                        | stay on current    |
| 4    | >0     | any            | N/A                          | standard execution |

---

## 4 Migration steps

1.  Add interface + Zod schema in new file `workflow-execution-state.schema.ts`.
2.  Implement `updateExecutionState` helper in `WorkflowExecutionService`.
3.  Refactor all services that write `executionState` to use the helper.
4.  Split `StepGuidanceService` per structure above; inject `WorkflowExecutionService` where needed.
5.  Ensure `StepExecutionMcpService` passes `executionId` to guidance call.
6.  Manual E2E test:

- Bootstrap → complete step #1 → get guidance → should return step #2.

---

## 5 Notes

- **No Prisma schema change** required – JSON column remains, but runtime
  validation adds safety.
- Follows KISS: clear helpers, minimal branches, no hidden side-effects.
- Follows DRY: execution-state write logic centralised.
- Follows SOLID: services keep single responsibilities; helpers injected.

---

_Authored automatically by Boomerang agent at user's request._
