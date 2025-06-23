# Workflow Execution-Centric Refactor Implementation Plan

## 🔍 Problem Analysis

### Root Cause

The workflow system has a fundamental design issue where multiple services assume `taskId` exists from bootstrap, but the workflow creates execution with `taskId: null` initially.

### Business Flow

1. **Bootstrap** → `executionId` created, `taskId: null`
2. **Steps 1-2** → Boomerang works without task
3. **Step 3** → Task gets created, `taskId` becomes available
4. **Step 4+** → Normal workflow with task

### Service Dependency Analysis

| **File**                                 | **taskId Dependency** | **Severity** | **Fix Required**                                                      |
| ---------------------------------------- | --------------------- | ------------ | --------------------------------------------------------------------- |
| `step-execution-mcp.service.ts`          | CRITICAL              | HIGH         | Yes - Add bootstrap mode support                                      |
| `workflow-guidance-mcp.service.ts`       | CRITICAL              | HIGH         | Yes - Make taskId optional                                            |
| `role-transition-mcp.service.ts`         | REQUIRED              | MEDIUM       | No - Keep taskId dependency (boomerang can't transition without task) |
| `workflow-execution-mcp.service.ts`      | GOOD                  | LOW          | No - Already execution-centric                                        |
| `mcp-operation-execution-mcp.service.ts` | GOOD                  | NONE         | No - No taskId dependency                                             |
| `workflow-bootstrap-mcp.service.ts`      | GOOD                  | NONE         | No - Bootstrap initiator                                              |

## 🚀 Implementation Strategy

### Phase 1: Update StepGuidanceService (Priority P1)

**Target**: `src/task-workflow/domains/workflow-rules/services/step-guidance.service.ts`

**Fix**: Add bootstrap detection in `resolveStepId()` method:

```typescript
// Handle bootstrap mode where taskId is 0 or null
if (!context.taskId || context.taskId === 0) {
  this.logger.log('Bootstrap mode detected: resolving stepId without taskId');

  const firstStep = await this.stepQueryService.getFirstStepForRole(
    context.roleId,
  );

  if (firstStep) {
    this.logger.log(
      `Bootstrap: resolved to first step for role: ${firstStep.id} (${firstStep.name})`,
    );
    return firstStep.id;
  } else {
    this.logger.error(
      `Bootstrap: no first step found for role: ${context.roleId}`,
    );
    return null;
  }
}
```

### Phase 2: Update Step Execution MCP Service (Priority P2)

**Target**: `src/task-workflow/domains/workflow-rules/mcp-operations/step-execution-mcp.service.ts`

**Fix**: Handle bootstrap case in getStepGuidance method:

```typescript
// Update context from execution - HANDLE BOOTSTRAP CASE
if (currentExecution.taskId) {
  actualTaskId = actualTaskId || currentExecution.taskId;
} else {
  // Bootstrap case: execution has no task yet
  actualTaskId = 0; // Signal bootstrap mode to resolveStepId
  this.logger.log('Bootstrap execution detected: no taskId available yet');
}
```

### Phase 3: Update Workflow Guidance MCP Service (Priority P3)

**Target**: `src/task-workflow/domains/workflow-rules/mcp-operations/workflow-guidance-mcp.service.ts`

**Fix**: Make taskId optional and add executionId support:

```typescript
const GetWorkflowGuidanceInputSchema = z
  .object({
    roleName: z
      .enum([
        'boomerang',
        'researcher',
        'architect',
        'senior-developer',
        'code-review',
      ])
      .describe('Current role name for workflow guidance'),
    taskId: z
      .number()
      .optional()
      .describe('Task ID for context (optional during bootstrap)'),
    roleId: z.string().describe('Role ID for transition context'),
    executionId: z
      .string()
      .optional()
      .describe('Execution ID (alternative to taskId)'),
    projectPath: z
      .string()
      .optional()
      .describe('Project path for project-specific context'),
  })
  .refine(
    (data) => data.taskId !== undefined || data.executionId !== undefined,
    { message: 'Either taskId or executionId must be provided' },
  );
```

### Phase 4: Keep Role Transition Services Unchanged

**Decision**: Role transition services will maintain their taskId dependency because:

- Boomerang role cannot transition without having a task created
- Task is required for creating database models in transitions
- This maintains logical business flow consistency

## 🎯 Success Criteria

✅ Bootstrap workflow executes without taskId errors  
✅ Step guidance works in bootstrap mode (taskId: 0 or null)  
✅ Workflow guidance supports both taskId and executionId  
✅ Role transitions remain task-dependent (correct business logic)  
✅ Backward compatibility with existing workflows  
✅ No usage of `any` type - maintain strict typing

## 📋 Implementation Notes

### Type Safety

- All fixes must maintain strict TypeScript typing
- No usage of `any` type
- Proper schema validation with Zod

### Workflow Rules Compliance

- Follow SOLID principles
- Maintain role boundary constraints
- Preserve execution-centric design

### Testing

- Manual testing of bootstrap flow
- Verify step guidance works without taskId
- Ensure role transitions still require tasks

## 🔄 Implementation Order

1. **P1**: Fix StepGuidanceService.resolveStepId() bootstrap detection
2. **P2**: Update step-execution-mcp.service.ts bootstrap handling
3. **P3**: Update workflow-guidance-mcp.service.ts schema and logic
4. **P4**: Manual testing and validation

## 📝 Notes

- Role transition services deliberately keep taskId requirement
- Focus on execution-centric approach for step guidance
- Maintain backward compatibility throughout
- Bootstrap mode is temporary state until task creation
