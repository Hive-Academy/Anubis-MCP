---
description: 
globs: 
alwaysApply: true
---
# Workflow Manager MCP: Clean Rule-Based Architecture Guide

This guide provides essential patterns for the new rule-based MCP architecture. The 12 focused tools provide a clean interface that eliminates complexity and focuses on workflow-driven development.

## **🎯 CLEAN RULE-BASED ARCHITECTURE (12 Tools)**

### **Workflow-Rules Domain (8 Tools) - PRIMARY USER INTERFACE**

Users interact primarily with workflow-rules tools that provide embedded guidance and intelligent orchestration:

#### **Workflow Guidance & Execution**
- `get_workflow_guidance` - Context-aware role behavior with embedded intelligence
- `execute_workflow_step` - Step-by-step intelligent execution with validation
- `get_step_progress` - Step execution history and performance analytics
- `get_next_available_step` - AI-powered next step recommendations

#### **Role Transitions & Management**
- `get_role_transitions` - Intelligent transition recommendations and validation
- `validate_transition` - Comprehensive transition requirement checking
- `execute_transition` - Intelligent role transition execution
- `get_transition_history` - Transition analytics and optimization insights

#### **Execution Lifecycle**
- `workflow_execution_operations` - Complete execution lifecycle management

### **Reporting Domain (4 Tools) - ANALYTICS & DASHBOARDS**

Focused reporting tools for analytics and monitoring:

- `generate_workflow_report` - Interactive dashboards with Chart.js visualizations
- `get_report_status` - Report generation status and progress
- `cleanup_report` - Report file management and cleanup
- `report_system_health` - System health monitoring and diagnostics

## **🚫 REMOVED: Legacy Task-Manager Tools**

The following tools have been **removed** as they violate the rule-based workflow principles:

### **❌ Batch Operations (Obsolete)**
- ~~`batch_subtask_operations`~~ - Users shouldn't directly manage subtasks
- ~~`batch_status_updates`~~ - Status management handled by workflow rules

### **❌ Query Optimization (Obsolete)**  
- ~~`query_task_context`~~ - Context provided embedded in workflow responses
- ~~`query_workflow_status`~~ - Status managed internally by workflow rules
- ~~`query_reports`~~ - Reports handled by dedicated reporting domain

**Why Removed**: These tools were designed for the old task-manager system where users directly manipulated tasks. In the rule-based workflow, users interact with workflow rules that handle task management internally.

## **🎯 RULE-BASED WORKFLOW PRINCIPLES**

### **1. Workflow Rules Drive Everything**
```javascript
// ✅ CORRECT: Use workflow guidance for behavioral context
get_workflow_guidance({
  roleName: "architect",
  taskId: "current-task",
  stepId: "design-implementation"
})

// ❌ INCORRECT: Direct task manipulation
// query_task_context() - REMOVED
// batch_subtask_operations() - REMOVED
```

### **2. Embedded Context Instead of Explicit Queries**
```javascript
// ✅ CORRECT: Context embedded in workflow responses
const guidance = await get_workflow_guidance({...});
// guidance.data includes all necessary context

// ❌ INCORRECT: Explicit context queries
// await query_task_context() - REMOVED
```

### **3. Internal Task Management**
```javascript
// ✅ CORRECT: Workflow steps handle task operations internally
execute_workflow_step({
  id: taskId,
  roleId: "senior-developer", 
  stepId: "implement-batch",
  executionData: {...}
})
// Internally creates/updates tasks, subtasks, batches as needed

// ❌ INCORRECT: Direct batch operations
// batch_subtask_operations() - REMOVED
```
