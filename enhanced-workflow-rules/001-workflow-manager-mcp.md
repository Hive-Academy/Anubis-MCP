# Workflow Manager MCP: Domain-Based Tools Guide

This guide provides essential patterns and examples for the new domain-based MCP operations. The 10 focused tools replace the old universal tools with clear, specific interfaces that reduce agent confusion.

## Core Workflow Domain Tools

### Task Operations - Enhanced Task lifecycle management

**Create Task with Description:**

```json
{
  "operation": "create",
  "taskData": {
    "taskId": "TSK-123",
    "name": "Implement Authentication",
    "status": "not-started",
    "priority": "High"
  },
  "description": {
    "description": "Implement JWT authentication system",
    "businessRequirements": "Users need secure login functionality",
    "technicalRequirements": "Use JWT with secure storage and validation",
    "acceptanceCriteria": ["User registration", "User login", "Password reset"]
  },
  "codebaseAnalysis": {
    "architectureFindings": {
      "moduleStructure": "Domain-driven design with feature modules",
      "techStack": [
        "NestJS 10.x",
        "TypeScript 5.x",
        "Prisma ORM",
        "PostgreSQL"
      ],
      "fileStructure": {
        "src/": "Main application source",
        "src/domains/": "Domain-specific modules",
        "prisma/": "Database schema and migrations"
      },
      "dependencies": ["@nestjs/core", "@prisma/client", "class-validator"]
    },
    "problemsIdentified": {
      "codeSmells": ["Large service classes", "Duplicate validation logic"],
      "technicalDebt": "Missing error handling in older controllers",
      "rootCauses": "Rapid development without refactoring cycles",
      "qualityIssues": "Inconsistent error response formats"
    },
    "implementationContext": {
      "patterns": [
        "Repository pattern",
        "Service layer",
        "Dependency injection"
      ],
      "codingStandards": "ESLint + Prettier, TypeScript strict mode",
      "qualityGuidelines": "Jest unit tests, E2E tests with Supertest",
      "integrationApproaches": "RESTful APIs, OpenAPI documentation"
    },
    "integrationPoints": {
      "apiBoundaries": "/api/v1/* endpoints with OpenAPI specs",
      "serviceInterfaces": "Injectable services with interface contracts",
      "dataLayer": "Prisma ORM with PostgreSQL database",
      "externalDependencies": ["Authentication service", "File storage service"]
    },
    "qualityAssessment": {
      "testingCoverage": "85% unit test coverage, E2E tests for critical paths",
      "performanceBaseline": "< 200ms API response time",
      "securityConsiderations": "JWT authentication, input validation",
      "documentationState": "OpenAPI specs up-to-date, README comprehensive"
    },
    "filesCovered": ["src/auth/", "src/users/", "src/common/"],
    "technologyStack": {
      "backend": "NestJS with TypeScript",
      "database": "PostgreSQL with Prisma ORM",
      "testing": "Jest + Supertest",
      "documentation": "OpenAPI/Swagger"
    },
    "analyzedBy": "boomerang"
  }
}
```

**Get Task with Context:**

```json
{
  "operation": "get",
  "taskId": "TSK-123",
  "includeDescription": true,
  "includeAnalysis": true
}
```

**List Tasks:**

```json
{
  "operation": "list",
  "status": "in-progress",
  "priority": "High"
}
```

### Planning Operations - Implementation planning and batch management

**Create Implementation Plan:**

```json
{
  "operation": "create_plan",
  "taskId": "TSK-123",
  "planData": {
    "overview": "Authentication implementation with JWT",
    "approach": "Using NestJS with JWT strategy",
    "technicalDecisions": {
      "authStrategy": "JWT with refresh tokens",
      "storage": "httpOnly cookies for tokens",
      "validation": "Zod schemas with custom decorators"
    },
    "filesToModify": ["src/auth/*", "src/users/*"],
    "createdBy": "architect"
  }
}
```

**Create Batch of Subtasks:**

```json
{
  "operation": "create_subtasks",
  "taskId": "TSK-123",
  "batchData": {
    "batchId": "AUTH-B001",
    "batchTitle": "Authentication Core Implementation",
    "subtasks": [
      {
        "name": "Create Auth Module",
        "description": "Set up authentication module structure",
        "sequenceNumber": 1
      },
      {
        "name": "Implement JWT Strategy",
        "description": "Configure Passport JWT strategy",
        "sequenceNumber": 2
      }
    ]
  }
}
```

**Get Implementation Plan:**

```json
{
  "operation": "get_plan",
  "taskId": "TSK-123",
  "includeBatches": true
}
```

### Individual Subtask Operations - Enhanced Subtask Management

**Purpose**: Manage individual subtasks with evidence collection, dependency tracking, and strategic guidance.

**Create Individual Subtask with Full Specifications:**

```json
{
  "operation": "create_subtask",
  "taskId": "TSK-123",
  "subtaskData": {
    "name": "Implement Password Reset Flow",
    "description": "Create secure password reset functionality with email verification",
    "batchId": "AUTH-B002",
    "sequenceNumber": 3,
    "acceptanceCriteria": [
      "Password reset email sent securely",
      "Reset token validation working",
      "New password update successful",
      "Security audit passed"
    ],
    "strategicGuidance": {
      "architecturalPattern": "Command pattern for password operations",
      "implementationApproach": "Use email service with secure token generation",
      "performanceConsiderations": "Async email sending, token expiration",
      "qualityRequirements": "Security testing, rate limiting"
    },
    "technicalSpecifications": {
      "frameworks": ["@nestjs/mailer", "crypto"],
      "patterns": ["Command pattern", "Repository pattern"],
      "testingRequirements": "Unit tests for token generation, integration tests for email flow"
    },
    "dependencies": ["AUTH-B001-1", "AUTH-B001-2"],
    "estimatedDuration": "4 hours"
  }
}
```

**Update Subtask with Completion Evidence:**

```json
{
  "operation": "update_subtask",
  "taskId": "TSK-123",
  "subtaskId": 45,
  "updateData": {
    "status": "completed",
    "completionEvidence": {
      "implementationSummary": "Password reset flow implemented with secure token generation and email verification",
      "filesModified": [
        "src/auth/services/password-reset.service.ts",
        "src/auth/controllers/auth.controller.ts",
        "src/auth/dto/password-reset.dto.ts"
      ],
      "duration": "3.5 hours",
      "acceptanceCriteriaVerification": {
        "Password reset email sent securely": "Implemented with rate limiting and secure token generation",
        "Reset token validation working": "Token validation with expiration and single-use enforcement",
        "New password update successful": "Password hashing and database update working",
        "Security audit passed": "No vulnerabilities found in security review"
      },
      "testingResults": {
        "unitTests": "12 unit tests added, 100% coverage for password reset service",
        "integrationTests": "E2E tests for complete password reset flow",
        "manualTesting": "Manual testing completed for all user scenarios"
      },
      "qualityAssurance": {
        "codeQuality": "ESLint passed, TypeScript strict mode compliant",
        "performance": "Password reset completes in < 500ms",
        "security": "Security review passed, no OWASP violations"
      },
      "strategicGuidanceFollowed": "Command pattern implemented, proper error handling, async email sending"
    }
  }
}
```

**Get Next Available Subtask:**

```json
{
  "operation": "get_next_subtask",
  "taskId": "TSK-123",
  "status": "not-started"
}
```

**Get Specific Subtask with Evidence:**

```json
{
  "operation": "get_subtask",
  "taskId": "TSK-123",
  "subtaskId": 45,
  "includeEvidence": true
}
```

### Workflow Operations - Role-based transitions

**Delegate Task:**

```json
{
  "operation": "delegate",
  "taskId": "TSK-123",
  "fromRole": "architect",
  "toRole": "senior-developer",
  "message": "Implementation plan ready. All batches defined with clear dependencies."
}
```

**Complete Task:**

```json
{
  "operation": "complete",
  "taskId": "TSK-123",
  "fromRole": "senior-developer",
  "completionData": {
    "summary": "Authentication implementation complete",
    "filesModified": ["src/auth/auth.module.ts", "src/auth/jwt.strategy.ts"],
    "acceptanceCriteriaVerification": {
      "User registration": "implemented with validation",
      "User login": "implemented with JWT tokens"
    }
  }
}
```

**Escalate Task:**

```json
{
  "operation": "escalate",
  "taskId": "TSK-123",
  "fromRole": "senior-developer",
  "toRole": "architect",
  "escalationData": {
    "reason": "Technical blocker encountered",
    "severity": "high",
    "blockers": ["Library compatibility issue"]
  }
}
```

### Review Operations - Code review and quality gates

**Create Code Review:**

```json
{
  "operation": "create_review",
  "taskId": "TSK-123",
  "reviewData": {
    "status": "APPROVED",
    "summary": "High quality implementation following patterns",
    "strengths": "Good error handling, comprehensive tests",
    "issues": "Minor: Consider extracting validation logic",
    "acceptanceCriteriaVerification": {
      "User registration": "verified and working",
      "User login": "verified with JWT tokens"
    },
    "manualTestingResults": "All acceptance criteria verified manually"
  }
}
```

**Create Completion Report:**

```json
{
  "operation": "create_completion",
  "taskId": "TSK-123",
  "completionData": {
    "summary": "Authentication implementation fully complete",
    "filesModified": ["src/auth/auth.module.ts", "src/auth/jwt.strategy.ts"],
    "acceptanceCriteriaVerification": {
      "User registration": "implemented and tested",
      "User login": "implemented and tested"
    },
    "delegationSummary": "Successful role transitions through full workflow",
    "qualityValidation": "All quality gates passed"
  }
}
```

### Research Operations - Research and communication

**Create Research Report:**

```json
{
  "operation": "create_research",
  "taskId": "TSK-123",
  "researchData": {
    "title": "Authentication Strategy Analysis",
    "summary": "Comprehensive analysis of JWT vs session-based auth",
    "findings": "JWT with refresh tokens is optimal for our architecture",
    "recommendations": "Use @nestjs/jwt with secure httpOnly cookies",
    "references": ["https://docs.nestjs.com/security/authentication"]
  }
}
```

**Add Comment:**

```json
{
  "operation": "add_comment",
  "taskId": "TSK-123",
  "commentData": {
    "content": "Consider performance implications of token validation",
    "author": "researcher"
  }
}
```

## Query Optimization Domain Tools

### Query Task Context - Pre-configured comprehensive queries

**Get Full Task Context:**

```json
{
  "taskId": "TSK-123",
  "includeLevel": "comprehensive",
  "includePlans": true,
  "includeSubtasks": true,
  "includeAnalysis": true,
  "includeComments": true
}
```

**Get Specific Batch Context:**

```json
{
  "taskId": "TSK-123",
  "includeLevel": "full",
  "batchId": "AUTH-B001",
  "subtaskStatus": "completed"
}
```

### Query Workflow Status - Delegation and workflow queries

**Get Delegation History:**

```json
{
  "taskId": "TSK-123",
  "queryType": "delegation_history",
  "includeDelegations": true,
  "includeTransitions": true
}
```

**Get Current Role Assignments:**

```json
{
  "queryType": "current_assignments",
  "currentRole": "senior-developer",
  "status": "in-progress"
}
```

### Query Reports - Evidence and report queries

**Get All Reports for Task:**

```json
{
  "taskId": "TSK-123",
  "reportTypes": ["research", "code_review", "completion"],
  "mode": "detailed",
  "includeEvidence": true
}
```

## Batch Operations Domain Tools

### Batch Subtask Operations - Bulk subtask management

**Get Batch Summary:**

```json
{
  "operation": "get_batch_summary",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001"
}
```

**Update Entire Batch Status:**

```json
{
  "operation": "update_batch_status",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001",
  "newStatus": "completed"
}
```

**Complete Batch with Evidence:**

```json
{
  "operation": "complete_batch",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001",
  "completionData": {
    "summary": "Authentication core implementation complete",
    "filesModified": ["src/auth/auth.module.ts", "src/auth/jwt.strategy.ts"],
    "implementationNotes": "Followed established patterns, added comprehensive tests"
  }
}
```

**Create Batch Subtasks:**

```json
{
  "operation": "create_batch_subtasks",
  "taskId": "TSK-123",
  "batchId": "AUTH-B002",
  "subtasks": [
    {
      "name": "Implement Login Controller",
      "description": "Create login endpoint with validation",
      "sequenceNumber": 1,
      "estimatedDuration": "2 hours"
    },
    {
      "name": "Add User Registration",
      "description": "Create registration endpoint",
      "sequenceNumber": 2,
      "estimatedDuration": "3 hours"
    }
  ]
}
```

### Batch Status Updates - Cross-entity synchronization

**Sync Task Status:**

```json
{
  "operation": "sync_task_status",
  "taskId": "TSK-123",
  "checkConsistency": true,
  "autoRepair": false
}
```

**Validate Cross-Entity Consistency:**

```json
{
  "operation": "validate_consistency",
  "taskId": "TSK-123",
  "includeDetails": true,
  "includeHistory": false
}
```

## Migration from Universal Tools

### Old → New Tool Mapping

**Old `query_data` patterns:**

- Task queries → `task_operations` (get/list operations)
- Complex context → `query_task_context`
- Workflow status → `query_workflow_status`
- Reports → `query_reports`

**Old `mutate_data` patterns:**

- Task CRUD → `task_operations` (create/update operations)
- Planning → `planning_operations`
- Reviews → `review_operations`
- Research → `research_operations`
- Batch operations → `batch_subtask_operations`

**Old `workflow_operations` patterns:**

- Delegation → `workflow_operations` (same tool, focused interface)
- Status sync → `batch_status_updates`

## Common Workflow Sequences

### 1. Task Creation → Research → Architecture

```
task_operations(create) → workflow_operations(delegate to researcher) →
research_operations(create_research) → workflow_operations(delegate to architect)
```

### 2. Architecture → Implementation → Review

```
planning_operations(create_plan + create_subtasks) →
workflow_operations(delegate to senior-developer) →
batch_subtask_operations(update_batch_status) →
workflow_operations(delegate to code-review)
```

### 3. Quality Gates → Completion

```
review_operations(create_review) → workflow_operations(complete) →
query_reports(validation) → batch_status_updates(sync_task_status)
```

## Status and Role Values

**Task/Subtask Status:**

- "not-started", "in-progress", "needs-review", "completed", "needs-changes", "paused", "cancelled"

**Review Status:**

- "APPROVED", "APPROVED_WITH_RESERVATIONS", "NEEDS_CHANGES"

**Role Values:**

- "boomerang", "researcher", "architect", "senior-developer", "code-review"

## Key Benefits

✅ **Clear parameter requirements** - No more guessing what fields are needed
✅ **Domain-specific focus** - Tools have obvious, specific purposes  
✅ **Pre-configured patterns** - Complex includes/selects handled automatically
✅ **Business rule validation** - Built-in workflow transition validation
✅ **Efficient batch operations** - Bulk updates with consistency checks
✅ **Reduced agent confusion** - 10 focused tools vs 3 complex universal tools
