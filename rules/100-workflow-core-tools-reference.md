---
description:
globs:
alwaysApply: true
---

# MCP Workflow Tools: Technical Reference Guide

## **🎯 TOOL INVENTORY: 8 FOCUSED TOOLS**

Your MCP Workflow Manager provides exactly 8 tools organized by domain:

### **🚀 INITIALIZATION**

- `bootstrap_workflow` - Start new workflows with task and execution setup

### **🧭 WORKFLOW EXECUTION**

- `get_workflow_guidance` - Get role-specific behavioral context
- `execute_workflow_step` - Execute steps with validation and tracking
- `get_next_available_step` - Get AI-powered next step recommendations
- `get_step_progress` - Get step execution history and analytics

### **⚙️ LIFECYCLE MANAGEMENT**

- `workflow_execution_operations` - Create, get, update, complete executions

### **📊 REPORTING**

- `generate_workflow_report` - Generate interactive HTML dashboards
- `get_report_status` - Monitor report generation
- `cleanup_report` - Clean up report files

---

## **🔧 DETAILED TOOL SPECIFICATIONS**

### **🚀 `bootstrap_workflow`**

**Purpose:** Initialize new workflows with minimal task creation and execution setup

**Required Parameters:**

```typescript
{
  taskName: string,           // Clear, descriptive name
  initialRole: 'boomerang',   // ALWAYS start with boomerang
  executionMode: 'GUIDED'     // GUIDED, AUTOMATED, or HYBRID
}
```

**Optional Parameters:**

```typescript
{
  taskDescription?: string,
  businessRequirements?: string,
  technicalRequirements?: string,
  acceptanceCriteria?: string[],
  priority?: 'Low' | 'Medium' | 'High' | 'Critical',
  projectPath?: string,       // IMPORTANT: Use actual project path
  executionContext?: Record<string, any>
}
```

**Response Structure:**

```json
{
  "success": true,
  "taskName": "Task Name",
  "executionMode": "GUIDED",
  "resources": {
    "taskId": 123,
    "taskSlug": "task-slug",
    "executionId": "exec-uuid",
    "currentRole": "boomerang"
  },
  "instructions": {
    "nextAction": "get-guidance",
    "guidance": "Get workflow guidance for boomerang role"
  }
}
```

---

### **🧭 `get_workflow_guidance`**

**Purpose:** Get intelligent, context-aware role behavior with embedded guidance

**Parameters:**

```typescript
{
  roleName: 'boomerang' | 'researcher' | 'architect' | 'senior-developer' | 'code-review',
  taskId: string,             // Task ID as string
  stepId?: string,            // Optional specific step
  projectPath?: string,       // For project-specific context
  executionData?: any         // Additional context data
}
```

**Response Structure:**

```json
{
  "taskId": 123,
  "roleName": "boomerang",
  "roleContext": {
    "displayName": "Boomerang Role",
    "description": "Strategic workflow orchestrator",
    "capabilities": ["analysis", "coordination"]
  },
  "currentStep": {
    "stepId": "step-1",
    "name": "Context Acquisition",
    "stepType": "analysis",
    "description": "Gather project context"
  },
  "nextActions": ["execute-step"],
  "instructions": {
    "nextAction": "execute-step",
    "guidance": "Execute the context acquisition step"
  }
}
```

---

### **⚡ `execute_workflow_step`**

**Purpose:** Execute workflow steps with intelligent validation and progress tracking

**Parameters:**

```typescript
{
  id: number,                 // Task ID as number
  roleId: string,             // Current role
  stepId: string,             // Step to execute
  executionData?: any         // Step-specific data
}
```

**Response Structure:**

```json
{
  "taskId": 123,
  "stepId": "step-1",
  "roleId": "boomerang",
  "success": true,
  "executionResult": {
    "status": "completed",
    "duration": 1500,
    "nextStep": {
      "stepId": "step-2",
      "name": "Git Verification"
    }
  },
  "instructions": {
    "nextAction": "get-next-step",
    "guidance": "Step completed successfully"
  }
}
```

---

### **🎯 `get_next_available_step`**

**Purpose:** Get AI-powered next step recommendations with dependency validation

**Parameters:**

```typescript
{
  roleId: string,             // Current role
  id: number                  // Task ID as number
}
```

**Response Structure:**

```json
{
  "taskId": 123,
  "roleId": "boomerang",
  "nextStep": {
    "stepId": "step-2",
    "name": "Git Integration Verification",
    "stepType": "verification",
    "description": "Verify git state and branch setup",
    "estimatedTime": "10 minutes",
    "sequenceNumber": 2
  },
  "status": "step_available",
  "instructions": {
    "nextAction": "execute-step",
    "guidance": "Ready to execute step: Git Integration Verification"
  }
}
```

---

### **📊 `get_step_progress`**

**Purpose:** Get step execution history and performance analytics

**Parameters:**

```typescript
{
  id: number,                 // Task ID as number
  roleId?: string             // Optional role filter
}
```

**Response Structure:**

```json
{
  "taskId": 123,
  "roleId": "boomerang",
  "progressSummary": {
    "totalSteps": 6,
    "completed": 2,
    "inProgress": 1,
    "failed": 0
  },
  "recentSteps": [
    {
      "name": "Context Acquisition",
      "stepType": "analysis",
      "status": "COMPLETED",
      "role": "Boomerang"
    }
  ],
  "instructions": {
    "nextAction": "analyze-progress",
    "guidance": "Use this data for workflow optimization"
  }
}
```

---

### **⚙️ `workflow_execution_operations`**

**Purpose:** Complete execution lifecycle management (create, get, update, complete)

**Operations Available:**

- `create_execution` - Create new execution for existing task
- `get_execution` - Get execution with relations and progress
- `update_execution` - Update execution state and progress
- `complete_execution` - Mark execution as completed
- `get_active_executions` - List all active executions
- `execute_step_with_services` - Execute step with associated services

**Example - Get Active Executions:**

```typescript
{
  operation: 'get_active_executions',
  taskId: 0  // 0 means get all active executions
}
```

**Example - Get Specific Execution:**

```typescript
{
  operation: 'get_execution',
  taskId: 123
}
```

---

### **📊 `generate_workflow_report`**

**Purpose:** Generate interactive HTML dashboards with Chart.js visualizations

**Parameters:**

```typescript
{
  reportType: 'interactive-dashboard' | 'summary' | 'task-detail' | 'delegation-flow' | 'implementation-plan' | 'workflow-analytics' | 'role-performance',
  outputFormat: 'html' | 'json',     // Default: 'html'
  basePath?: string,                  // IMPORTANT: Project root path
  taskId?: number,                    // For task-specific reports
  startDate?: string,                 // ISO date format
  endDate?: string,                   // ISO date format
  owner?: string,                     // Filter by owner
  priority?: string                   // Filter by priority
}
```

**Recommended Report Types:**

- `interactive-dashboard` - Main dashboard (RECOMMENDED)
- `task-detail` - Individual task analysis
- `workflow-analytics` - Cross-task analytics

---

## **🔄 TYPICAL WORKFLOW PATTERNS**

### **Pattern A: New Workflow**

```
1. bootstrap_workflow()
2. get_workflow_guidance()
3. Loop:
   - get_next_available_step()
   - execute_workflow_step()
   - get_workflow_guidance() (updated)
```

### **Pattern B: Continue Existing**

```
1. workflow_execution_operations('get_active_executions')
2. workflow_execution_operations('get_execution', taskId)
3. get_workflow_guidance()
4. Continue with Pattern A loop
```

### **Pattern C: Monitoring & Analytics**

```
1. generate_workflow_report('interactive-dashboard')
2. get_report_status(reportId)
3. View generated HTML dashboard
```

---

## **🎯 RESPONSE FORMAT EXPECTATIONS**

**ALL responses are structured JSON envelopes, not verbose text:**

### **Success Response Pattern:**

```json
{
  "taskId": number,
  "success": true,
  "data": { /* operation-specific data */ },
  "instructions": {
    "nextAction": string,
    "guidance": string
  },
  "meta": {
    "timestamp": string,
    "responseTime": number
  }
}
```

### **Error Response Pattern:**

```json
{
  "taskId": number,
  "success": false,
  "error": {
    "message": string,
    "code": string
  },
  "meta": {
    "timestamp": string
  }
}
```

---

## **⚠️ CRITICAL PARAMETER NOTES**

### **Data Type Requirements:**

- `taskId` in tool names: **string**
- `id` in parameters: **number**
- `roleName`: **enum** (exact values required)
- `operation`: **enum** (exact values required)

### **Common Pitfalls:**

```typescript
// ❌ WRONG
{
  taskId: 123;
} // Should be string
{
  id: '123';
} // Should be number
{
  roleName: 'developer';
} // Should be "senior-developer"

// ✅ CORRECT
{
  taskId: '123';
}
{
  id: 123;
}
{
  roleName: 'senior-developer';
}
```

### **Required vs Optional:**

- `bootstrap_workflow`: taskName, initialRole, executionMode are **REQUIRED**
- `get_workflow_guidance`: roleName, taskId are **REQUIRED**
- `execute_workflow_step`: id, roleId, stepId are **REQUIRED**

---

## **🔧 DEBUG & TROUBLESHOOTING**

### **Enable Debug Mode:**

The system has configurable debug output. In debug mode, responses include additional `debug` object with raw data.

### **Common Error Codes:**

- `VALIDATION_ERROR` - Invalid parameters
- `WORKFLOW_GUIDANCE_ERROR` - Guidance generation failed
- `STEP_EXECUTION_ERROR` - Step execution failed
- `BOOTSTRAP_ERROR` - Workflow initialization failed

### **Health Check:**

```typescript
// Quick system health check
await workflow_execution_operations({
  operation: 'get_active_executions',
  taskId: 0,
});
```

---

## **🎯 BEST PRACTICES**

1. **Always validate responses:** Check `success` field before proceeding
2. **Use structured data:** Parse JSON responses, don't rely on text parsing
3. **Follow the patterns:** Use the established workflow patterns
4. **Check prerequisites:** Ensure required data is available before tool calls
5. **Handle errors gracefully:** Use error codes and messages for troubleshooting
6. **Maintain context:** Keep track of taskId, roleId, and stepId throughout workflow

**Your tools are powerful and intelligent. Trust the system, follow the patterns, and focus on quality-driven development.**
