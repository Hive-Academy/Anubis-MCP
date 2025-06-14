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

When MCP says "run `git status`" → **YOU** execute `await run_terminal_cmd({command: 'git status'})`

---

## **🚀 EXECUTION PATTERNS**

### **🆕 PATTERN 1: NEW WORKFLOW (SIMPLIFIED)**

#### **STEP 1: Bootstrap - Simple Workflow Kickoff**

```typescript
// 🚀 SIMPLE BOOTSTRAP - NO TASK DETAILS NEEDED
const bootstrap = await bootstrap_workflow({
  initialRole: 'boomerang', // ALWAYS start with boomerang
  executionMode: 'GUIDED',
  projectPath: '/full/project/path', // Optional
});

// ✅ BOOTSTRAP RETURNS:
// - execution: Workflow execution state WITHOUT task
// - currentRole: Role context and behavioral profile
// - currentStep: Step 1 - Git Integration Setup (comprehensive guidance)
// - resources: {taskId: null, executionId, firstStepId}
// - Workflow steps contain ALL guidance for agent execution
```

#### **STEP 2: Execute Boomerang Workflow (Complete Workflow)**

```typescript
// 🔄 BOOMERANG WORKFLOW: Comprehensive step-by-step execution
// The workflow steps contain ALL guidance and instructions
while (true) {
  // Current step contains comprehensive guidance
  const currentStep =
    bootstrap.currentStep ||
    (await get_step_guidance({
      executionId: bootstrap.resources.executionId,
      stepId: currentStepId,
    }));

  // 🚨 EXECUTE STEP GUIDANCE LOCALLY
  // Step guidance includes:
  // - behavioralContext: How to approach the step
  // - approachGuidance: Detailed step-by-step instructions
  // - qualityChecklist: Success criteria
  // - actionData: Specific commands and operations

  const executionResult = await executeStepGuidance(currentStep);

  // Report results back to MCP
  const completion = await report_step_completion({
    executionId: bootstrap.resources.executionId,
    stepId: currentStep.id,
    result: executionResult.success ? 'success' : 'failure',
    executionData: executionResult.data,
  });

  // Check if role has more steps
  if (!completion.nextGuidance.hasNextStep) break;
}

// ✅ AFTER BOOMERANG COMPLETES:
// - Step 1: Git integration setup completed
// - Step 2: Comprehensive codebase analysis with functional testing completed
// - Step 3: Task requirements gathered and comprehensive task created
// - Step 4: Research decision made based on evidence
// - Step 5: Delegated to next role (researcher/architect)
```

#### **STEP 3: Role Transitions (When Needed)**

```typescript
// When hasNextStep: false, check for role transitions
const transitions = await get_role_transitions({
  fromRoleName: currentRole,
  executionId: bootstrap.resources.executionId,
});
const validation = await validate_transition({
  transitionId: selectedId,
  executionId: bootstrap.resources.executionId,
});
const result = await execute_transition({
  transitionId: selectedId,
  executionId: bootstrap.resources.executionId,
});

// Continue with new role context
```

### **🔄 PATTERN 2: CONTINUE EXISTING**

```typescript
// Get current execution state
const execution = await workflow_execution_operations({
  operation: 'get_execution',
  executionId: existingExecutionId,
});

// Resume from current step using existing role context
// Continue with execution loop from Pattern 1, Step 2
```

---

## **🎭 BOOMERANG WORKFLOW STEPS (DATABASE-DRIVEN)**

The boomerang role has 5 comprehensive steps stored in the database:

### **Step 1: MANDATORY Git Integration Setup**

- **Purpose**: Complete git operations before task creation
- **Guidance**: Verify clean state, create feature branch, handle git errors
- **Commands**: `git status --porcelain`, `git checkout -b feature/...`
- **Critical**: STOP workflow if any git operation fails

### **Step 2: MANDATORY Source Code Analysis with Functional Verification**

- **Purpose**: Systematic codebase examination WITH functional testing
- **Approach**: Multi-phase analysis (structural, functional, quality)
- **Methods**: Pattern identification, technology mapping, capability verification
- **Output**: Evidence-based findings with testing results

### **Step 3: MANDATORY Comprehensive Task Creation**

- **Purpose**: Create task with comprehensive data after analysis
- **Process**: Gather requirements, integrate analysis, create structured task
- **Data**: Link to execution, store codebase analysis, set git context
- **Result**: Task created and linked to workflow execution

### **Step 4: Research Decision Framework with Validation**

- **Purpose**: Evidence-based research necessity evaluation
- **Criteria**: Based on verified current state testing
- **Decision**: Research needed vs. direct to implementation
- **Output**: Specific research questions if research required

### **Step 5: Role Delegation with Task Context**

- **Purpose**: Delegate to appropriate next role
- **Target**: Researcher (if research needed) or Architect (direct implementation)
- **Context**: Comprehensive handoff with all analysis and decisions
- **Reference**: Include task-slug for human-readable identification

---

## **🔧 KEY TOOLS**

### **Workflow Initiation**

- `bootstrap_workflow` - **Simple kickoff without task details**

### **Execution & Guidance**

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

1. ✅ Read step guidance (behavioralContext, approachGuidance, qualityChecklist)
2. ✅ Execute guidance commands locally using YOUR tools
3. ✅ Validate results against success criteria
4. ✅ Report completion with execution data
5. ✅ Handle role transitions when steps complete

**Common Commands:**

- Git: `await run_terminal_cmd({command: 'git status'})`
- Files: `await read_file({target_file: 'path'})`
- Search: `await codebase_search({query: 'search term'})`

---

## **❌ DON'TS | ✅ DO'S**

**❌ DON'T:**

- Provide task details to bootstrap (not needed)
- Expect MCP to execute commands
- Skip step guidance validation
- Loop indefinitely on errors (3-try rule)
- Expect task to exist immediately after bootstrap

**✅ DO:**

- Use simple bootstrap with just role and execution mode
- Execute all commands locally per step guidance
- Follow step-by-step approach guidance
- Report results back to MCP
- Let workflow steps guide everything
- Trust database-driven step guidance

---

## **🔧 TROUBLESHOOTING**

- **"No task details provided"** → Normal! Workflow steps will gather task requirements
- **"Command didn't execute"** → YOU must run it locally with your tools
- **"Step execution failed"** → Check step guidance, report failure details
- **"Role transition needed"** → Use transition pattern
- **"No taskId after bootstrap"** → Normal! Task created by boomerang step 3
- **"Step guidance unclear"** → Follow behavioralContext and approachGuidance

---

**Remember: Bootstrap is just a simple kickoff. The database-driven workflow steps contain ALL the intelligence and guidance needed for complete execution.**
