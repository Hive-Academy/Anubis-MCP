# MCP Workflow Manager: AI Agent Instructions

## **🚨 MANDATORY FIRST ACTION**

**⚠️ BEFORE ANY USER REQUEST:**

```typescript
// 🔍 CHECK ACTIVE WORKFLOWS FIRST
const activeCheck = await workflow_execution_operations({
  operation: 'get_active_executions',
  taskId: 0,
});

// Present options based on results
if (activeCheck.data.length > 0) {
  // Show: A) Continue existing B) Start new C) Quick help D) Dashboard
} else {
  // Ready for new workflow
}
```

---

## **🎯 CORE PRINCIPLE**

**MCP SERVER = GUIDANCE ONLY | AI AGENT = EXECUTOR**

- ✅ **MCP**: Provides guidance, tracks progress, manages data
- ✅ **YOU**: Execute commands locally, modify files, run git operations
- ❌ **NEVER**: Expect MCP to execute anything for you

When MCP says "run `git status`" → **YOU** execute `await run_terminal_cmd({command: 'git', args: ['status']})`

---

## **🚀 EXECUTION PATTERNS**

### **🆕 PATTERN 1: NEW WORKFLOW (OPTIMIZED)**

#### **STEP 1: Bootstrap - Returns Comprehensive Data**

```typescript
// 🚀 BOOTSTRAP RETURNS EVERYTHING NEEDED
const bootstrap = await bootstrap_workflow({
  taskName: 'Clear task name',
  taskDescription: 'Detailed requirements',
  businessRequirements: 'Business context',
  technicalRequirements: 'Technical specs',
  acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
  priority: 'High', // Low, Medium, High, Critical
  initialRole: 'boomerang', // ALWAYS start with boomerang
  executionMode: 'GUIDED',
  projectPath: '/full/project/path',
});

// ✅ BOOTSTRAP NOW INCLUDES COMPREHENSIVE DATA:
// - execution: Full execution state with current step
// - currentRole: Role context and behavioral profile
// - currentStep: Step details with commands and validation
// - resources: {taskId, executionId, firstStepId}
```

#### **STEP 2: Direct Execution (NO REDUNDANT CALLS)**

```typescript
// 🔄 START EXECUTION IMMEDIATELY - Bootstrap has everything needed
while (true) {
  // Use step data from bootstrap (first iteration) or get new step
  const currentStep =
    bootstrap.currentStep ||
    (await get_step_guidance({
      taskId: parseInt(bootstrap.resources.taskId),
      roleId: bootstrap.currentRole.name,
    }));

  // 🚨 YOU EXECUTE LOCALLY
  const executionResult = await executeCommandsLocally(
    currentStep.localExecution.commands,
  );

  // Report results back to MCP
  const completion = await report_step_completion({
    taskId: parseInt(bootstrap.resources.taskId),
    stepId: currentStep.stepId,
    result: executionResult.success ? 'success' : 'failure',
    executionData: executionResult.data,
  });

  // Check if role has more steps
  if (!completion.nextGuidance.hasNextStep) break;
}
```

#### **STEP 3: Role Transitions (When Needed)**

```typescript
// When hasNextStep: false, check for role transitions
const transitions = await get_role_transitions({
  fromRoleName: currentRole,
  taskId,
  roleId,
});
const validation = await validate_transition({
  transitionId: selectedId,
  taskId,
  roleId,
});
const result = await execute_transition({
  transitionId: selectedId,
  taskId,
  roleId,
});

// Get new role context ONLY after transition
const newRoleContext = await get_workflow_guidance({
  roleName: result.newRole,
  taskId: taskId.toString(),
});
```

### **🔄 PATTERN 2: CONTINUE EXISTING**

```typescript
// Get current execution state
const execution = await workflow_execution_operations({
  operation: 'get_execution',
  taskId: existingTaskId,
});

// Resume from current step using existing role context
// Continue with execution loop from Pattern 1, Step 2
```

---

## **🎭 ROLES**

- **🎯 Boomerang**: Git setup, codebase analysis, task creation, delegation
- **🔍 Researcher**: Technology research, feasibility analysis, recommendations
- **🏗️ Architect**: Implementation planning, technical design, quality gates
- **👨‍💻 Senior Developer**: Code implementation, SOLID principles, testing
- **✅ Code Review**: Quality validation, acceptance criteria verification

---

## **🔧 KEY TOOLS**

### **Workflow Initiation**

- `bootstrap_workflow` - **NEW: Returns comprehensive execution data**

### **Execution & Guidance**

- `get_workflow_guidance` - **ONLY when role transitions occur**
- `get_step_guidance` - Get current step execution details
- `report_step_completion` - Report execution results
- `execute_mcp_operation` - Execute internal MCP operations

### **Role Transitions**

- `get_role_transitions` - Available transitions when role complete
- `validate_transition` - Check transition readiness
- `execute_transition` - Perform role transition

### **Workflow State**

- `workflow_execution_operations` - State management (get_execution, update, etc.)

---

## **📋 EXECUTION CHECKLIST**

**For Each Step:**

1. ✅ Execute guidance commands locally using YOUR tools
2. ✅ Validate results against success criteria
3. ✅ Report completion with execution data
4. ✅ Handle role transitions when steps complete

**Common Commands:**

- Git: `await run_terminal_cmd({command: 'git', args: ['status']})`
- Files: `await read_file({target_file: 'path'})`
- Search: `await codebase_search({query: 'search term'})`

---

## **❌ DON'TS | ✅ DO'S**

**❌ DON'T:**

- Expect MCP to execute commands
- Use bootstrap for existing tasks
- Skip execution guidance validation
- Loop indefinitely on errors (3-try rule)

**✅ DO:**

- Execute all commands locally
- Report results back to MCP
- Handle role transitions properly
- Use semantic search first
- Follow clean coding practices

---

## **🔧 TROUBLESHOOTING**

- **"Command didn't execute"** → YOU must run it locally with your tools
- **"Step execution failed"** → Check if you executed guidance, report failure details
- **"Role transition needed"** → Use 4-tool transition pattern
- **"Getting repeated data"** → Avoid redundant context calls

---

**Remember: MCP provides the roadmap, YOU drive the execution. Trust the guidance, execute locally, report back.**
