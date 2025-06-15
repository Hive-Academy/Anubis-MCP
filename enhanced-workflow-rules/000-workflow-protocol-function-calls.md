# MCP Workflow Manager: Universal AI Agent Protocol

**Transform chaotic development into organized, quality-driven workflows**

_Follow these rules precisely to ensure successful workflow execution_

---

## **Core Principles**

### The MCP Contract

> **You Execute, MCP Guides** - The MCP server provides intelligent guidance only; YOU execute all commands locally using your own tools.

| Principle                    | Description                                          | Your Responsibility                  |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------ |
| **Protocol Compliance**      | Follow MCP guidance exactly, never skip steps        | Execute each guided step completely  |
| **Validation Required**      | Verify all quality checklist items before proceeding | Check every item in qualityChecklist |
| **Evidence-Based Reporting** | Always report completion with comprehensive data     | Provide detailed executionData       |
| **Local Execution**          | Use YOUR tools for all commands and operations       | Never expect MCP to execute for you  |

---

## **MANDATORY STARTUP PROTOCOL**

### Before ANY user request, execute this sequence:

Execute the `workflow_execution_operations` MCP tool with the `operation` parameter set to `get_active_executions`. The MCP server will return an array of currently active workflow executions.

```typescript
const activeCheck = await workflow_execution_operations({
  operation: 'get_active_executions',
});
```

**Interpreting the Response:**

When you receive the response, examine the returned array carefully:

- **If the array is empty**: No active workflows exist. Proceed directly to workflow initialization for the user's request.

- **If the array contains one or more execution objects**: Active workflows exist. Each execution object contains important information you must extract and present to the user.

**For each active execution in the response, extract these key details:**

- **Execution ID**: The unique identifier for the workflow session
- **Task information**: Look for task name, description, and current status
- **Current role**: Which role the workflow is currently assigned to
- **Current step**: What step is currently being executed or next to execute
- **Progress indicators**: Any status or progress information available

**Present the user with these specific options:**

"**Active Workflow Detected**

I found an active workflow in progress:

- **Workflow**: [Extract and display the task name or workflow description]
- **Status**: [Display current status and role information]
- **Progress**: [Show current step or progress indicators]

**Your Options:**
A) **Continue existing workflow** - Resume from the current step
B) **Start new workflow** - Archive current workflow and begin fresh
C) **Get quick help** - View current step guidance and assistance
D) **View dashboard** - See detailed analytics and progress

Please select an option (A/B/C/D) to proceed."

**Important**: Wait for the user's choice before proceeding. Do not make assumptions about what they want to do with the existing workflow.

---

## **Workflow Execution Phases**

### **Phase 1: Workflow Initialization**

Execute the `bootstrap_workflow` MCP tool with these exact parameters:

```typescript
const initResult = await bootstrap_workflow({
  initialRole: 'boomerang', // Start with strategic role
  executionMode: 'GUIDED', // Use MCP guidance mode
  projectPath: '/full/project/path', // Your actual project path
});
```

**Interpreting the Bootstrap Response:**

The MCP server will return an object containing several critical identifiers that you must store and use throughout the workflow:

- **executionId**: This is your workflow session identifier. Include this in ALL subsequent MCP operations.
- **roleId**: The identifier for your current role in the workflow.
- **taskId**: The identifier for the main task being executed.
- **Additional context**: The response may include role-specific context and initial capabilities.

**Store these values immediately** - you will need them for every subsequent operation. Consider these as your "session tokens" for the workflow.

---

### **Phase 2: Step Execution Cycle**

#### 2.1 Request Intelligent Guidance

Execute the `get_step_guidance` MCP tool with the `executionId` and `roleId` you received from bootstrap:

```typescript
const guidance = await get_step_guidance({
  executionId: executionId,
  roleId: roleId,
});
```

#### 2.2 Parse and Understand the Guidance Response

The MCP server returns a structured guidance object with **seven critical sections**. You must read and understand ALL sections before proceeding:

**stepInfo Section:**

- Contains the step identifier (`stepId`) which you'll need for reporting completion
- Provides the step name and basic description
- This tells you what specific step you're executing

**behavioralContext Section:**

- Describes the overall approach and strategy for this step
- Contains core principles you must follow (these are CRITICAL RULES)
- Provides methodology and domain-specific guidance
- This section tells you HOW to think about the step

**approachGuidance Section:**

- Contains step-by-step tactical instructions
- Provides specialized sequences for different domains
- Includes implementation details for each action
- This section tells you WHAT to do and in what order

**localExecution Section:**

- Describes commands and operations YOU must execute using YOUR tools
- Explains what these commands accomplish
- Provides context for why these operations are needed
- This section clarifies that YOU do the work, not the MCP server

**qualityChecklist Section:**

- Contains MANDATORY validation requirements
- Every item in this list must be verified before reporting completion
- Failure to validate ANY item means the step has failed
- This section defines success criteria

**mcpOperations Section (CRITICAL):**

- Provides exact parameter schemas for any MCP operations needed
- Contains service names, operation names, and required parameters
- You MUST use these schemas exactly as provided
- Never guess parameter names or structures - use the exact format given

**successCriteria Section:**

- Defines clear completion requirements for the step
- Explains what constitutes successful step execution
- Provides measurable outcomes to verify

#### 2.3 Execute All Required Actions Locally

Based on the guidance received, use YOUR tools to execute all required operations:

**For file operations**, use your file management tools:

- Read files when guidance indicates you need to examine existing code or content
- Edit files when guidance specifies modifications needed
- Create directories when guidance indicates new structure is required

**For terminal commands**, use your command execution tools:

- Run installation commands when guidance specifies dependencies needed
- Execute build or test commands when guidance requires verification
- Perform git operations when guidance indicates version control actions

**For project analysis**, use your codebase tools:

- Search code when guidance requires understanding existing implementations
- Analyze project structure when guidance needs architectural context

**Critical**: The MCP server provides guidance only. YOU must execute every command and operation using your own capabilities.

#### 2.4 Validate Against Quality Checklist

Before reporting step completion, you must validate every item in the `qualityChecklist` section:

**For each checklist item:**

1. **Understand the requirement**: Read the checklist item carefully to understand what is being validated
2. **Gather evidence**: Collect specific proof that the requirement has been met
3. **Verify completion**: Confirm that your evidence clearly demonstrates requirement fulfillment
4. **Document the validation**: Prepare clear evidence statements for your completion report

**Validation Examples:**

- If checklist requires "Files created successfully", verify the files exist and contain expected content
- If checklist requires "Tests passing", run the tests and confirm zero failures
- If checklist requires "Code follows patterns", compare your implementation against provided examples

**Critical Rule**: ALL checklist items must pass before you can report step completion. If any item fails, you must address the failure before proceeding.

#### 2.5 Report Step Completion with Evidence

Execute the `report_step_completion` MCP tool with these required parameters:

```typescript
const completionReport = await report_step_completion({
  executionId: executionId,
  stepId: guidance.stepInfo.stepId,
  result: 'success', // or 'failure' with error details
  executionData: {
    // Comprehensive evidence of what you accomplished
    filesModified: ['/path1', '/path2'],
    commandsExecuted: ['npm test', 'git commit'],
    validationResults: validationResults,
    outputSummary: 'Detailed description of results',
    qualityChecksComplete: true,
  },
});
```

**Structure your executionData object to include:**

- **filesModified**: Array of file paths that were changed or created
- **commandsExecuted**: Array of terminal commands that were run
- **validationResults**: Summary of quality checklist validation outcomes
- **outputSummary**: Detailed description of what was accomplished
- **evidenceDetails**: Specific proof for each requirement that was met
- **qualityChecksComplete**: Boolean confirming all quality checks passed

**The MCP server uses this information to:**

- Track workflow progress and maintain state
- Provide context for subsequent steps
- Generate analytics and reports
- Ensure quality standards are maintained

---

### **Phase 3: Role Transitions**

#### 3.1 Check Available Transitions

When you complete all steps for a role, execute the `get_role_transitions` MCP tool with:

```typescript
const transitions = await get_role_transitions({
  fromRoleName: 'current_role_name',
  taskId: taskId,
  roleId: roleId,
});
```

**Interpreting the Transitions Response:**

The MCP server returns an array of available transition options. For each transition, examine:

- **Transition ID**: Unique identifier for this transition option
- **Target role**: Which role you would transition to
- **Purpose**: Why this transition exists and what the target role accomplishes
- **Requirements**: Any prerequisites that must be met before transition

#### 3.2 Validate Transition Requirements

Before attempting a transition, execute the `validate_transition` MCP tool with:

```typescript
const validation = await validate_transition({
  transitionId: selectedTransition.id,
  taskId: taskId,
  roleId: roleId,
});
```

**Interpreting the Validation Response:**

The MCP server returns a validation result object:

- **isValid**: Boolean indicating whether transition is allowed
- **missingRequirements**: Array of requirements not yet met (if validation fails)
- **readinessStatus**: Information about transition readiness

**If validation fails**: Address the missing requirements before attempting the transition. The response will tell you specifically what needs to be completed.

#### 3.3 Execute the Transition

If validation succeeds, execute the `execute_transition` MCP tool with the same parameters used for validation:

```typescript
const transitionResult = await execute_transition({
  transitionId: selectedTransition.id,
  taskId: taskId,
  roleId: roleId,
});
```

**Interpreting the Transition Response:**

The MCP server returns your new role context:

- **newRoleId**: Your identifier in the new role
- **newRoleContext**: Capabilities and responsibilities for the new role
- **nextSteps**: Guidance on what to do first in the new role

**Update your workflow context** with the new role information and continue with the new role's responsibilities.

---

### **Phase 4: Workflow Completion**

When you reach the final role (typically Integration Engineer), execute the `workflow_execution_operations` MCP tool with:

```typescript
await workflow_execution_operations({
  operation: 'complete_execution',
  executionId: executionId,
  completionData: {
    finalStatus: 'success',
    deliverables: ['list', 'of', 'completed', 'items'],
    qualityMetrics: {
      /* comprehensive metrics */
    },
    documentation: 'links to updated docs',
  },
});
```

**Structure your completionData to include:**

- **finalStatus**: `'success'` or `'failure'` with detailed explanation
- **deliverables**: Array of completed items and their locations
- **qualityMetrics**: Summary of quality achievements and validations
- **documentation**: References to updated documentation or deliverables

---

## **Understanding MCP Operations**

### Critical: Schema Compliance

The `mcpOperations` section in step guidance provides exact schemas for any MCP operations needed. **You must follow these schemas precisely**.

**When guidance provides an mcpOperation schema:**

1. **Use the exact service name** specified in the schema
2. **Use the exact operation name** specified in the schema
3. **Include all required parameters** with correct names and types
4. **Include the executionId** when specified as required (this links operations to your workflow)

**Schema Example Interpretation:**

If guidance provides:

```
serviceName: "TaskOperations"
operation: "create"
parameters: {
  executionId: "required",
  taskData: { title: "string", status: "string" },
  description: { objective: "string" }
}
```

You must execute the `execute_mcp_operation` MCP tool with exactly these parameters:

```typescript
await execute_mcp_operation({
  serviceName: 'TaskOperations',
  operation: 'create',
  parameters: {
    executionId: executionId, // MANDATORY
    taskData: {
      title: 'Clear, descriptive title',
      status: 'pending',
    },
    description: {
      objective: 'What needs to be accomplished',
    },
  },
});
```

---

## **Tool Operation Reference**

### Workflow Management Functions

| Function                 | Purpose                       | Required Parameters                                | Response Information                        |
| ------------------------ | ----------------------------- | -------------------------------------------------- | ------------------------------------------- |
| `bootstrap_workflow`     | Initialize new workflow       | `initialRole`, `executionMode`, `projectPath`      | Returns `executionId`, `roleId`, `taskId`   |
| `get_step_guidance`      | Get current step instructions | `executionId`, `roleId`                            | Returns structured guidance with 7 sections |
| `report_step_completion` | Report step results           | `executionId`, `stepId`, `result`, `executionData` | Returns next step information               |
| `execute_mcp_operation`  | Execute service operations    | `serviceName`, `operation`, `parameters`           | Returns operation-specific results          |

### Role Transition Functions

| Function               | Purpose                       | Required Parameters                | Response Information                               |
| ---------------------- | ----------------------------- | ---------------------------------- | -------------------------------------------------- |
| `get_role_transitions` | Get available transitions     | `fromRoleName`, `taskId`, `roleId` | Returns array of transition options                |
| `validate_transition`  | Check transition requirements | `transitionId`, `taskId`, `roleId` | Returns validation status and missing requirements |
| `execute_transition`   | Perform role transition       | `transitionId`, `taskId`, `roleId` | Returns new role context and next steps            |

### State Management Functions

| Function                        | Purpose                      | Common Operations                                              | Response Information                |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `workflow_execution_operations` | Query/update execution state | `get_active_executions`, `get_execution`, `complete_execution` | Returns execution state and history |

---

## **Critical Success Patterns**

### **REQUIRED Actions**

1. **Always check for active workflows before starting new work**
2. **Execute ALL commands locally using YOUR tools - never expect MCP to execute**
3. **Read and follow ALL sections of step guidance completely**
4. **Validate against EVERY quality checklist item before reporting completion**
5. **Include executionId in all MCP operations that require it**
6. **Report completion with comprehensive evidence and validation results**
7. **Use exact schemas from mcpOperations section - never modify parameter structures**

### **PROHIBITED Actions**

1. **Never skip quality checklist validation**
2. **Never expect MCP server to execute commands for you**
3. **Never proceed without reporting step completion**
4. **Never ignore or modify mcpOperations schemas**
5. **Never skip step guidance requests for complex tasks**
6. **Never proceed to next step without completing current step validation**

---

## **Special Workflow Patterns**

### Task Creation Pattern

When creating tasks through MCP operations, you must **always include the executionId** parameter to link the task to your workflow session.

Execute the `execute_mcp_operation` MCP tool with the structure specified in guidance:

```typescript
await execute_mcp_operation({
  serviceName: 'TaskOperations',
  operation: 'create',
  parameters: {
    executionId: executionId, // MANDATORY
    taskData: {
      title: 'Clear, descriptive task name',
      status: 'pending',
    },
    description: {
      objective: 'What needs to be accomplished',
      requirements: ['req1', 'req2'],
      acceptanceCriteria: ['criteria1', 'criteria2'],
    },
    codebaseAnalysis: {
      // Structured analysis of current project state
      fileStructure: {},
      dependencies: [],
      patterns: {},
    },
  },
});
```

### Code Review Delegation Pattern

When code review is completed with APPROVED status:

1. **Create the review record** using the `execute_mcp_operation` MCP tool:

```typescript
await execute_mcp_operation({
  serviceName: 'ReviewOperations',
  operation: 'create_review',
  parameters: {
    /* review parameters from guidance */
  },
});
```

2. **Delegate to Integration Engineer** using the `execute_mcp_operation` MCP tool:

```typescript
await execute_mcp_operation({
  serviceName: 'WorkflowOperations',
  operation: 'delegate',
  parameters: {
    /* delegation parameters from guidance */
  },
});
```

### Integration Engineer Completion Pattern

Integration Engineer responsibilities include:

1. **Assess documentation needs** based on the changes made during the workflow
2. **Update relevant documentation** if modifications are needed for user understanding
3. **Create and validate pull request** with proper review and testing
4. **Complete BOTH task AND workflow execution** using the completion operations

**Critical**: Integration Engineer must complete both the task itself AND the workflow execution to properly close the workflow session.

---

## **Response Templates**

### Active Workflow Response

```
**Active Workflow Detected**

I found an active workflow: "[workflow name from response]"
Status: [current status] | Progress: [progress information]

**Your Options:**
A) **Continue existing workflow** - Resume from step "[current step name]"
B) **Start new workflow** - Archive current and begin fresh
C) **Get quick help** - View current step guidance
D) **View dashboard** - See detailed analytics

Please select A, B, C, or D to proceed.
```

### Step Execution Response

```
**Executing: [step name from guidance]**

Following MCP guidance, I will:
1. [first action from approachGuidance]
2. [second action from approachGuidance]
3. [third action from approachGuidance]

Executing locally with my tools and validating against quality checklist...

**Results:**
- [result 1 with evidence]
- [result 2 with evidence]
- [any failures or issues]

Quality validation: [summary of checklist validation]
Next: [what happens next]
```

### Validation Report

```
**Quality Validation Complete**

**All Checks Passed:**
• [checklist item 1] - Evidence: [specific evidence]
• [checklist item 2] - Evidence: [specific evidence]
• [checklist item 3] - Evidence: [specific evidence]

**Reporting completion to MCP server...**
```

### Role Transition Response

```
**Role Transition Available**

Current role work is complete. Available transitions:

1. [transition option 1] - [purpose and description]
2. [transition option 2] - [purpose and description]

Would you like to proceed with option 1, or select a different option?
```

---

## **Troubleshooting Guide**

| Issue                             | Diagnostic Steps                                     | Solution                                                                                |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------- |
| "No step guidance available"      | Verify `executionId` and `roleId` are correct        | Call `get_step_guidance` with valid parameters from your workflow session               |
| "Command execution failed"        | Check command syntax and environment requirements    | Retry up to 3 times with error handling, report failure with detailed error information |
| "Quality check validation failed" | Review specific checklist items that failed          | Address the failing requirements, re-validate, only proceed when ALL items pass         |
| "ExecutionId parameter missing"   | Check if operation requires workflow linking         | Always include `executionId` parameter in MCP operations that specify it as required    |
| "Schema parameter mismatch"       | Compare your parameters against mcpOperations schema | Use exact parameter names and structures from the `mcpOperations` section               |
| "Role transition blocked"         | Check transition validation response                 | Review `missingRequirements` in validation response and complete prerequisite work      |

---

## **Success Metrics**

**You're succeeding when:**

- Every step includes comprehensive quality validation with evidence
- All MCP operations use exact schemas from guidance mcpOperations sections
- Step completion reports include detailed executionData with proof of work
- Role transitions follow proper validation before execution
- Workflow completion delivers quality results that meet all requirements
- User receives clear progress updates and options throughout the process

**Remember**: You are the EXECUTOR. MCP provides GUIDANCE. Execute locally using your tools, validate thoroughly against all requirements, report accurately with comprehensive evidence.

---

**MCP WORKFLOW SUCCESS FORMULA**

**Get Guidance → Execute Locally → Validate Thoroughly → Report Accurately**
