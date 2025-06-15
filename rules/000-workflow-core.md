# MCP Workflow Manager: Mandatory AI Agent Rules

## **🚨 CRITICAL: MANDATORY FIRST ACTION**

**YOU MUST execute this check before ANY user request:**

```typescript
const activeCheck = await workflow_execution_operations({
  operation: 'get_active_executions',
});
```

**REQUIRED RESPONSE PATTERN:**

- IF active workflows exist: Present options (A) Continue existing B) Start new C) Quick help D) Dashboard)
- IF no active workflows: Proceed with new workflow initialization

---

## **🎯 CORE EXECUTION PRINCIPLE**

**YOU ARE THE EXECUTOR - MCP PROVIDES GUIDANCE ONLY**

### **MANDATORY BEHAVIOR:**

- ✅ **YOU EXECUTE**: All commands, file operations, git operations locally using YOUR tools
- ✅ **MCP PROVIDES**: Guidance, tracks progress, manages workflow data
- ❌ **NEVER EXPECT**: MCP to execute anything for you

### **COMMAND EXECUTION RULE:**

When MCP guidance says "run `git status`" → **YOU MUST** execute `await run_terminal_cmd({command: 'git status'})`

---

## **🚀 MANDATORY EXECUTION PATTERNS**

### **PATTERN 1: NEW WORKFLOW INITIALIZATION**

#### **STEP 1: Bootstrap Workflow**

```typescript
const bootstrap = await bootstrap_workflow({
  initialRole: 'boomerang', // ALWAYS start with boomerang
  executionMode: 'GUIDED',
  projectPath: '/full/project/path', // Use actual project path
});
```

#### **STEP 2: Execute Workflow Steps**

```typescript
while (hasMoreSteps) {
  // 1. GET STEP GUIDANCE
  const stepGuidance = await get_step_guidance({
    executionId: executionId,
    roleId: roleId,
  });

  // 2. EXECUTE GUIDANCE LOCALLY (MANDATORY)
  const result = await executeStepGuidanceLocally(stepGuidance);

  // 3. REPORT COMPLETION (MANDATORY)
  const completion = await report_step_completion({
    executionId: executionId,
    stepId: stepId,
    result: result.success ? 'success' : 'failure',
    executionData: result.data,
  });

  // 4. CHECK FOR NEXT STEP
  if (!completion.nextGuidance.hasNextStep) break;
}
```

#### **STEP 3: Handle Role Transitions**

```typescript
// When no more steps in current role:
const transitions = await get_role_transitions({
  fromRoleName: currentRole,
  taskId: taskId,
  roleId: roleId,
});

const validation = await validate_transition({
  transitionId: selectedTransitionId,
  taskId: taskId,
  roleId: roleId,
});

if (validation.isValid) {
  await execute_transition({
    transitionId: selectedTransitionId,
    taskId: taskId,
    roleId: roleId,
  });
}
```

---

## **🔄 POST-COMPLETION INTEGRATION WORKFLOWS**

### **INTEGRATION DELEGATION PATTERN**

**When code review completes with APPROVED status:**

```typescript
// Code Review Step 4: Review Decision and Workflow Action
const reviewDecision = await execute_mcp_operation({
  serviceName: "ReviewOperations",
  operation: "create_review",
  parameters: { taskId, reviewData: { status: "APPROVED", ... } }
});

// Delegate to Integration Engineer for deployment preparation
const delegation = await execute_mcp_operation({
  serviceName: "WorkflowOperations",
  operation: "delegate",
  parameters: {
    taskId: taskId,
    targetRole: "integration-engineer",
    delegationContext: "Task approved - ready for integration, documentation, and deployment"
  }
});
```

### **EXECUTION COMPLETION PATTERN**

**Integration Engineer final step uses workflow_execution_operations tool:**

```typescript
// Integration Engineer Step 5: Workflow Execution Completion
const executionCompletion = await workflow_execution_operations({
  operation: 'complete_execution',
  executionId: currentExecutionId,
});

// Validate completion success
if (executionCompletion.success) {
  // Document final status and provide closure summary
  // Entire workflow process completed successfully
}
```

### **INTELLIGENT DOCUMENTATION PATTERN**

**Integration Engineer assesses documentation needs intelligently:**

```typescript
// Step 3: Intelligent Documentation Assessment
const changeAnalysis = analyzeImplementationChanges();
const documentationNeeds = assessDocumentationRelevance(changeAnalysis);

if (documentationNeeds.requiresUpdates) {
  // Update only relevant documentation
  updateTargetedDocumentation(documentationNeeds.targets);
} else {
  // Skip unnecessary documentation updates
  proceedToPullRequestCreation();
}
```

### **WORKFLOW COMPLETION SEQUENCE**

**Complete workflow execution sequence:**

1. **Code Review** → Delegate to Integration Engineer (if APPROVED)
2. **Integration Engineer** → Complete task AND execution
3. **Execution Completion** → Use `workflow_execution_operations` tool directly

**CRITICAL: Integration Engineer handles BOTH task completion AND execution completion**

---

## **📋 STEP EXECUTION REQUIREMENTS**

### **FOR EVERY STEP YOU MUST:**

1. **READ** step guidance completely (behavioralContext, approachGuidance, qualityChecklist)
2. **EXECUTE** all guidance commands locally using YOUR available tools
3. **VALIDATE** results against the qualityChecklist requirements
4. **REPORT** completion with comprehensive execution data
5. **HANDLE** role transitions when steps complete

### **🔍 STEP GUIDANCE RESPONSE STRUCTURE - MANDATORY READING**

**YOU MUST READ THE ENTIRE STEP GUIDANCE RESPONSE - ALL SECTIONS:**

#### **1. stepInfo** - Basic Step Identification

```json
{
  "stepId": "unique-step-id",
  "name": "step-name",
  "description": "what this step accomplishes"
}
```

#### **2. behavioralContext** - Strategic Context

- **approach**: Overall strategy for the step
- **principles**: Core principles to follow (CRITICAL RULES)
- **methodology**: How to approach the work
- **Additional Context**: Domain-specific guidance (gitProtocol, delegationEvidence, etc.)

#### **3. approachGuidance** - Tactical Instructions

- **stepByStep**: Exact sequence of actions to perform
- **Specialized Steps**: Domain-specific step sequences
- **Implementation Details**: How to execute each action

#### **4. localExecution** - Your Commands

- **commands**: List of commands YOU must execute locally
- **description**: What these commands accomplish

#### **5. successCriteria** - Success Definition

- Clear criteria for step completion

#### **6. qualityChecklist** - Validation Requirements

- **MANDATORY**: Every item must be verified before reporting completion
- **FAILURE TO VALIDATE = STEP FAILURE**

#### **7. mcpOperations** - CRITICAL SECTION (MOST IMPORTANT!)

**🚨 THIS IS THE SECTION YOU MISSED - ALWAYS READ THIS COMPLETELY:**

```json
{
  "mcpOperations": [
    {
      "serviceName": "ServiceName",
      "operation": "operationName",
      "requiredParameters": ["param1", "param2"],
      "optionalParameters": ["param3"],
      "schemaStructure": {
        "type": "object",
        "properties": {
          // COMPLETE PARAMETER STRUCTURE PROVIDED
          // USE THIS EXACTLY - NO GUESSING!
        }
      },
      "usage": "How to use this operation"
    }
  ]
}
```

**MANDATORY mcpOperations USAGE RULES:**

- ✅ **READ COMPLETELY**: Never skip this section
- ✅ **USE EXACT SCHEMA**: Copy parameter structure exactly
- ✅ **NO GUESSING**: All parameters are provided - use them
- ✅ **VALIDATE PARAMETERS**: Check required vs optional
- ✅ **FOLLOW USAGE NOTES**: Pay attention to usage instructions

**COMMON mcpOperations MISTAKES TO AVOID:**

- ❌ **Skipping mcpOperations section** (like you did with delegation)
- ❌ **Guessing parameter names** (targetRole vs toRole)
- ❌ **Missing required parameters** (operation, fromRole, etc.)
- ❌ **Wrong parameter structure** (not following schema)
- ❌ **Ignoring optional parameters** (completionData, etc.)

### **📖 STEP GUIDANCE READING PROTOCOL**

**MANDATORY READING SEQUENCE:**

1. **Read stepInfo** - Understand what you're doing
2. **Read behavioralContext** - Understand the approach and principles
3. **Read approachGuidance** - Understand the step-by-step process
4. **Read localExecution** - Understand what commands to run
5. **Read qualityChecklist** - Understand validation requirements
6. **🚨 READ mcpOperations COMPLETELY** - Get exact parameter structures
7. **Read successCriteria** - Understand completion definition

**EXECUTION SEQUENCE:**

1. **Plan** based on approachGuidance
2. **Execute** localExecution commands using YOUR tools
3. **Use** mcpOperations with EXACT schemas provided
4. **Validate** against qualityChecklist
5. **Report** completion with comprehensive executionData

### **🔧 CRITICAL MCP OPERATIONS REFERENCE**

**ALWAYS use mcpOperations schemas from step guidance. Key patterns:**

#### **execute_mcp_operation** - Core Business Logic

```typescript
// ALWAYS check step guidance mcpOperations for exact parameters
await execute_mcp_operation({
  serviceName:
    'TaskOperations|PlanningOperations|WorkflowOperations|ReviewOperations|ResearchOperations|SubtaskOperations',
  operation: 'operation_name', // From step guidance
  parameters: {
    /* Use EXACT schema from step guidance */
  },
});
```

#### **workflow_execution_operations** - State Management

```typescript
// Common operations: get_active_executions, get_execution, update_execution, complete_execution
await workflow_execution_operations({
  operation:
    'get_active_executions|get_execution|update_execution|complete_execution',
  executionId: 'exec-id', // When required
  updateData: {
    /* From step guidance schema */
  },
});
```

#### **Role Transitions** - When No More Steps

```typescript
// 1. Check transitions
const transitions = await get_role_transitions({
  fromRoleName: 'current-role',
  taskId: taskId,
  roleId: roleId,
});

// 2. Validate selected transition
const validation = await validate_transition({
  transitionId: 'selected-id',
  taskId: taskId,
  roleId: roleId,
});

// 3. Execute if valid
if (validation.isValid) {
  await execute_transition({
    transitionId: 'selected-id',
    taskId: taskId,
    roleId: roleId,
  });
}
```

**🚨 CRITICAL RULES:**

- ✅ **ALWAYS** use step guidance mcpOperations schemas
- ✅ **NEVER** guess parameter names or structures
- ✅ **CHECK** required vs optional parameters
- ❌ **DON'T** skip mcpOperations section reading

### **QUALITY CHECKLIST COMPLIANCE**

**YOU MUST verify EVERY item in the qualityChecklist before reporting step completion.**

**Example for Task Creation step:**

- ✅ "Task created with comprehensive description and requirements" → VERIFY task exists with complete data
- ✅ "CRITICAL: executionId included in TaskOperations.create call" → VERIFY executionId was provided
- ✅ "Task successfully linked to current workflow execution" → VERIFY linkage exists

**FAILURE TO FOLLOW QUALITY CHECKLIST = STEP FAILURE**

---

## **🔧 MANDATORY TOOL USAGE**

### **Workflow Management**

- `bootstrap_workflow` - Initialize new workflow
- `get_step_guidance` - Get current step instructions
- `report_step_completion` - Report step results (MANDATORY after each step)
- `execute_mcp_operation` - Execute MCP operations with proper parameters

### **Role Transitions**

- `get_role_transitions` - Get available transitions
- `validate_transition` - Validate transition requirements
- `execute_transition` - Perform role transition

### **State Management**

- `workflow_execution_operations` - Query/update execution state

---

## **⚠️ CRITICAL REQUIREMENTS**

### **TASK CREATION REQUIREMENTS**

When creating tasks, YOU MUST:

- Include `executionId` parameter (MANDATORY)
- Provide comprehensive `description` object
- Include structured `codebaseAnalysis` data
- Verify task creation success before proceeding

### **STEP GUIDANCE COMPLIANCE**

- Follow `approachGuidance` step-by-step instructions exactly
- Execute ALL commands listed in guidance locally
- Meet ALL `qualityChecklist` requirements
- Report accurate `executionData` with evidence

### **ERROR HANDLING**

- Maximum 3 retry attempts per operation
- Report failures with detailed error information
- NEVER proceed if critical steps fail (e.g., git operations)

---

## **❌ PROHIBITED ACTIONS**

**YOU MUST NOT:**

- Skip quality checklist validation
- Expect MCP to execute commands for you
- Proceed without reporting step completion
- Ignore step guidance instructions
- Create tasks without executionId
- Continue after critical failures

---

## **✅ REQUIRED ACTIONS**

**YOU MUST:**

- Execute ALL commands locally using your tools
- Follow step guidance instructions precisely
- Validate against quality checklists
- Report step completion with execution data
- Include executionId in all task operations
- Handle role transitions properly
- Stop workflow on critical failures

---

## **🔧 TROUBLESHOOTING RESPONSES**

**WHEN encountering these issues, RESPOND as follows:**

- **"No step guidance"** → Call `get_step_guidance` with correct parameters
- **"Command failed"** → Retry up to 3 times, then report failure
- **"Quality check failed"** → Fix issues and re-validate before proceeding
- **"Role transition needed"** → Use transition pattern above
- **"ExecutionId missing"** → Update execution context with proper linking

---

**REMEMBER: You are the executor. MCP provides guidance. Follow guidance exactly, execute locally, validate thoroughly, report accurately.**
