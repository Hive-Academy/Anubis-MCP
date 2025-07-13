# 🚨 Critical Error Fix Implementation Guide

## IMMEDIATE ACTION REQUIRED: Fix 55 TypeScript Compilation Errors

This guide provides step-by-step instructions to resolve the blocking compilation errors identified in the build process.

---

## 🔥 PHASE 1: Repository Type Import Fixes

### 1.1 workflow-execution.repository.ts Fixes

#### Issue: Missing Enum Imports
**Error**: `Module '"../../../../../generated/prisma"' has no exported member 'ExecutionPhase'`

**Root Cause**: These enums don't exist in the generated Prisma schema

**Solution**:
```typescript
// REMOVE these imports (they don't exist)
// ExecutionPhase,
// ExecutionMode,

// ADD these type definitions instead
type ExecutionPhase = 'initialized' | 'in-progress' | 'completed' | 'failed' | 'paused';
type ExecutionMode = 'GUIDED' | 'AUTOMATED' | 'HYBRID';
```

#### Issue: Interface Method Signature Mismatches
**Error**: `Property 'delete' in type 'WorkflowExecutionRepository' is not assignable`

**Root Cause**: Interface expects `WorkflowExecution` return, implementation returns `void`

**Solution Options**:
1. **Option A**: Update interface to match implementation (RECOMMENDED)
2. **Option B**: Update implementation to match interface

**Option A Implementation**:
```typescript
// In IWorkflowExecutionRepository interface
async delete(id: string): Promise<void> // Change from Promise<WorkflowExecution>
```

#### Issue: JSON Path Query Syntax
**Error**: `Type 'string[]' is not assignable to type 'string'`

**Root Cause**: Prisma JSON path queries use string, not array

**Solution**:
```typescript
// CHANGE from:
executionState: { path: ['phase'], equals: 'completed' }

// TO:
executionState: { path: 'phase', equals: 'completed' }
```

#### Issue: Missing Properties in Data Types
**Error**: `Property 'recoveryAttempts' does not exist on type 'CreateWorkflowExecutionData'`

**Solution**:
```typescript
// In CreateWorkflowExecutionData interface, ADD:
recoveryAttempts?: number;

// Or UPDATE the implementation to use correct property:
maxRecoveryAttempts: data.maxRecoveryAttempts || 3,
// Remove the recoveryAttempts line
```

### 1.2 workflow-role.repository.ts Fixes

#### Issue: Type Mismatch in Return Types
**Error**: `Types of property 'steps' are incompatible`

**Root Cause**: Repository returns different step structure than interface expects

**Solution**:
```typescript
// Update the include structure to match interface expectations
include: {
  steps: {
    include: {
      stepGuidance: true,
      qualityChecks: true,
      stepDependencies: true,
    }
  },
  fromTransitions: {
    include: {
      toRole: true,
    }
  },
  toTransitions: {
    include: {
      fromRole: true,
    }
  }
}
```

#### Issue: Missing Type Definitions
**Error**: `Module '"../types/workflow-execution.types"' has no exported member 'ExecutionStatistics'`

**Solution**:
```typescript
// In workflow-execution.types.ts, ADD:
export interface ExecutionStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
}

export interface ExecutionProgressSummary {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
}
```

### 1.3 step-guidance.service.ts Fixes

#### Issue: Type 'never' from getStepWithDetails
**Error**: `Property 'roleId' does not exist on type 'never'`

**Root Cause**: `getStepWithDetails` method return type is incorrectly inferred as `never`

**Solution**:
```typescript
// In step-query.service.ts, ensure getStepWithDetails has proper return type
async getStepWithDetails(stepId: string): Promise<StepWithExecutionData | null> {
  // Implementation here
}

// Update StepWithExecutionData interface to include missing properties
export interface StepWithExecutionData {
  id: string;
  name: string;
  description: string;
  stepType: string;
  roleId: string; // ADD this
  approach: string; // ADD this
  stepGuidance: StepGuidanceData | null; // ADD this
  stepDependencies: StepDependencyData[];
  stepProgress: WorkflowStepProgress[];
  qualityChecks: QualityCheckData[];
}
```

---

## 🔧 PHASE 2: Implementation Steps

### Step 1: Update workflow-execution.repository.ts

```typescript
// 1. Fix imports
import {
  WorkflowExecution,
  // Remove ExecutionPhase, ExecutionMode
  Prisma,
} from '../../../../../generated/prisma';

// 2. Add type definitions
type ExecutionPhase = 'initialized' | 'in-progress' | 'completed' | 'failed' | 'paused';
type ExecutionMode = 'GUIDED' | 'AUTOMATED' | 'HYBRID';

// 3. Fix JSON path queries (lines 214, 281, 287, etc.)
executionState: {
  path: 'phase', // Change from ['phase']
  equals: phase,
}

// 4. Fix method signatures
async delete(id: string): Promise<void> {
  // Implementation
}

// 5. Fix recoveryAttempts property
maxRecoveryAttempts: data.maxRecoveryAttempts || 3,
// Remove recoveryAttempts line
```

### Step 2: Update workflow-role.repository.ts

```typescript
// 1. Fix include patterns
include: {
  steps: {
    include: {
      stepGuidance: true,
      qualityChecks: true,
      stepDependencies: true,
    }
  },
  fromTransitions: {
    include: {
      toRole: true,
    }
  },
  toTransitions: {
    include: {
      fromRole: true,
    }
  }
}

// 2. Fix delegation candidates method
async findDelegationCandidates(
  fromRoleId: string,
  include?: WorkflowRoleIncludeOptions,
): Promise<WorkflowRoleWithRelations[]> { // Change return type
  // Implementation
}
```

### Step 3: Update step-guidance.service.ts

```typescript
// 1. Fix StepWithExecutionData interface
export interface StepWithExecutionData {
  id: string;
  name: string;
  description: string;
  stepType: string;
  roleId: string;
  approach: string;
  stepGuidance: StepGuidanceData | null;
  stepDependencies: StepDependencyData[];
  stepProgress: WorkflowStepProgress[];
  qualityChecks: QualityCheckData[];
}

// 2. Update getStepWithDetails method signature
async getStepWithDetails(stepId: string): Promise<StepWithExecutionData | null> {
  // Implementation
}
```

### Step 4: Add Missing Type Definitions

```typescript
// In workflow-execution.types.ts
export interface ExecutionStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
}

export interface ExecutionProgressSummary {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
}

// In workflow-role.types.ts
export interface DelegationCandidate {
  id: string;
  name: string;
  priority: number;
  description: string;
  isActive: boolean;
  capabilities: any;
  coreResponsibilities: any;
  keyCapabilities: any;
  // Add other required properties
}
```

---

## 🧪 VALIDATION STEPS

### Step 1: Test Compilation
```bash
cd /d/projects/anubis
npm run build
```

### Step 2: Verify Type Safety
```bash
npm run type-check
```

### Step 3: Run Tests
```bash
npm test
```

### Step 4: Validate Core Functionality
```bash
# Test basic MCP server startup
npm run start:dev
```

---

## 🎯 SUCCESS CRITERIA

- [ ] `npm run build` passes without errors
- [ ] All TypeScript strict mode checks pass
- [ ] No regression in existing functionality
- [ ] Core workflow operations continue to work

---

## 🚨 ROLLBACK PLAN

If fixes introduce new issues:

1. **Immediate Rollback**: `git checkout HEAD~1`
2. **Selective Rollback**: `git checkout HEAD~1 -- <specific-file>`
3. **Incremental Fix**: Fix one file at a time and test

---

## 📞 ESCALATION

If any fix is unclear or causes additional issues:

1. **Document the specific error**
2. **Include the attempted fix**
3. **Provide context about the failure**
4. **Request specific guidance**

---

*This implementation guide provides the exact changes needed to resolve the 55 TypeScript compilation errors and restore the build to a working state.*
