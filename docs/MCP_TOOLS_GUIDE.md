# MCP Workflow Manager - Complete Tools Guide

This comprehensive guide documents all 10 domain-based MCP tools with enhanced subtask operations, performance monitoring, and practical usage examples.

## 🚀 Quick Reference

### Core Workflow Domain (5 tools)

- **`task_operations`** - Task lifecycle management with enhanced context
- **`planning_operations`** - Implementation planning and batch subtask management
- **`workflow_operations`** - Role-based delegation and workflow transitions
- **`review_operations`** - Code review and completion report management
- **`research_operations`** - Research reports and communication management

### Query Optimization Domain (3 tools)

- **`query_task_context`** - Comprehensive task context retrieval with performance caching
- **`query_workflow_status`** - Delegation and workflow status queries
- **`query_reports`** - Report queries with evidence relationships

### Batch Operations Domain (2 tools)

- **`batch_subtask_operations`** - Bulk subtask management with enhanced individual operations
- **`batch_status_updates`** - Cross-entity status synchronization

## 🔧 Enhanced Features (Latest Updates)

### ✅ Individual Subtask Operations

- **Enhanced subtask lifecycle management** with evidence collection
- **Dependency validation and tracking** for complex workflows
- **Strategic guidance and technical specifications** per subtask
- **Automatic dependency resolution** for next available subtasks

### ✅ Performance Monitoring & Caching

- **Two-layer caching system** (MCP response cache + database query cache)
- **STDIO-compatible file-based logging** for performance metrics
- **Token estimation and savings tracking** (25-75% token savings)
- **Automatic memory management** with LRU eviction

### ✅ Enhanced Context Management

- **Pre-configured relationship loading** based on include levels
- **Subtask batch organization** with progress tracking
- **Evidence collection and validation** throughout workflow
- **Strategic decision documentation** for role continuity

---

## 📋 Core Workflow Domain Tools

### 1. Task Operations - Enhanced Task Lifecycle Management

**Purpose**: Complete task lifecycle with enhanced context, codebase analysis, and evidence tracking.

#### Create Task with Comprehensive Analysis

```json
{
  "operation": "create",
  "taskData": {
    "name": "Implement User Authentication System",
    "priority": "High",
    "status": "not-started"
  },
  "description": {
    "description": "Implement JWT-based authentication with secure token management",
    "businessRequirements": "Users need secure login/logout functionality with session management",
    "technicalRequirements": "Use NestJS with Passport.js, JWT tokens, and secure httpOnly cookies",
    "acceptanceCriteria": [
      "User registration with email validation",
      "Secure login with JWT tokens",
      "Password reset functionality",
      "Session management and logout"
    ]
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
      }
    },
    "problemsIdentified": {
      "codeSmells": ["Large service classes", "Duplicate validation logic"],
      "technicalDebt": "Missing error handling in older controllers",
      "qualityIssues": "Inconsistent error response formats"
    },
    "implementationContext": {
      "patterns": [
        "Repository pattern",
        "Service layer",
        "Dependency injection"
      ],
      "codingStandards": "ESLint + Prettier, TypeScript strict mode",
      "qualityGuidelines": "Jest unit tests, E2E tests with Supertest"
    },
    "qualityAssessment": {
      "testingCoverage": "85% unit test coverage required",
      "performanceBaseline": "< 200ms API response time",
      "securityConsiderations": "JWT authentication, input validation, OWASP compliance"
    },
    "analyzedBy": "boomerang"
  }
}
```

#### Get Task with Full Context

```json
{
  "operation": "get",
  "taskId": "TSK-123",
  "includeDescription": true,
  "includeAnalysis": true
}
```

#### List Tasks with Filtering

```json
{
  "operation": "list",
  "status": "in-progress",
  "priority": "High"
}
```

#### Update Task with Evidence

```json
{
  "operation": "update",
  "taskId": "TSK-123",
  "taskData": {
    "status": "completed",
    "gitBranch": "feature/auth-implementation"
  }
}
```

---

### 2. Planning Operations - Enhanced Implementation Planning

**Purpose**: Create comprehensive implementation plans with batch-based subtask organization and strategic guidance.

#### Create Implementation Plan with Strategic Context

```json
{
  "operation": "create_plan",
  "taskId": "TSK-123",
  "planData": {
    "overview": "JWT Authentication Implementation with Security Best Practices",
    "approach": "Incremental implementation using NestJS Guards and Passport strategies",
    "technicalDecisions": {
      "authStrategy": "JWT with refresh tokens",
      "storage": "httpOnly cookies for tokens",
      "validation": "Zod schemas with custom decorators"
    },
    "strategicGuidance": {
      "architecturalPattern": "Clean Architecture with domain separation",
      "qualityGates": "Unit tests, integration tests, security audit",
      "performanceTargets": "< 100ms auth validation, < 200ms login"
    },
    "filesToModify": [
      "src/auth/auth.module.ts",
      "src/auth/strategies/jwt.strategy.ts",
      "src/users/users.service.ts",
      "prisma/schema.prisma"
    ],
    "createdBy": "architect"
  }
}
```

#### Create Batch of Enhanced Subtasks

```json
{
  "operation": "create_subtasks",
  "taskId": "TSK-123",
  "batchData": {
    "batchId": "AUTH-B001",
    "batchTitle": "Authentication Core Implementation",
    "subtasks": [
      {
        "name": "Create Auth Module Structure",
        "description": "Set up authentication module with proper dependency injection and exports",
        "sequenceNumber": 1,
        "strategicGuidance": {
          "architecturalPattern": "NestJS module pattern with clear boundaries",
          "implementationApproach": "Start with module definition, add providers incrementally",
          "qualityRequirements": "Follow NestJS best practices, proper TypeScript typing"
        },
        "acceptanceCriteria": [
          "Auth module properly configured",
          "Dependencies correctly injected",
          "Module exports defined"
        ]
      },
      {
        "name": "Implement JWT Strategy",
        "description": "Configure Passport JWT strategy with secure token validation",
        "sequenceNumber": 2,
        "strategicGuidance": {
          "architecturalPattern": "Passport strategy pattern with custom validation",
          "implementationApproach": "Use @nestjs/passport with JWT strategy",
          "performanceConsiderations": "Cache user lookups, optimize token validation"
        },
        "acceptanceCriteria": [
          "JWT strategy properly configured",
          "Token validation working",
          "User extraction from token"
        ]
      }
    ]
  }
}
```

#### Get Implementation Plan with Batches

```json
{
  "operation": "get_plan",
  "taskId": "TSK-123",
  "includeBatches": true
}
```

---

### 3. Individual Subtask Operations - Enhanced Subtask Management

**Purpose**: Manage individual subtasks with evidence collection, dependency tracking, and strategic guidance.

#### Create Individual Subtask with Full Specifications

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

#### Update Subtask with Completion Evidence

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

#### Get Next Available Subtask

```json
{
  "operation": "get_next_subtask",
  "taskId": "TSK-123",
  "status": "not-started"
}
```

#### Get Specific Subtask with Evidence

```json
{
  "operation": "get_subtask",
  "taskId": "TSK-123",
  "subtaskId": 45,
  "includeEvidence": true
}
```

---

### 4. Workflow Operations - Enhanced Role-Based Transitions

**Purpose**: Manage role-based workflow transitions with enhanced context preservation and strategic escalation.

#### Delegate with Strategic Context

```json
{
  "operation": "delegate",
  "taskId": "TSK-123",
  "fromRole": "architect",
  "toRole": "senior-developer",
  "message": "Implementation plan complete with 3 batches. All dependencies mapped and strategic guidance provided for each subtask."
}
```

#### Complete with Comprehensive Evidence

```json
{
  "operation": "complete",
  "taskId": "TSK-123",
  "fromRole": "senior-developer",
  "completionData": {
    "summary": "Authentication system fully implemented with JWT, password reset, and security features",
    "filesModified": [
      "src/auth/auth.module.ts",
      "src/auth/strategies/jwt.strategy.ts",
      "src/auth/services/auth.service.ts",
      "src/auth/services/password-reset.service.ts",
      "src/auth/controllers/auth.controller.ts",
      "src/auth/guards/jwt-auth.guard.ts"
    ],
    "acceptanceCriteriaVerification": {
      "User registration with email validation": "Implemented with Zod validation and email verification",
      "Secure login with JWT tokens": "JWT strategy with httpOnly cookies and refresh tokens",
      "Password reset functionality": "Secure password reset with email verification and token expiration",
      "Session management and logout": "Proper token invalidation and session cleanup"
    }
  }
}
```

#### Strategic Escalation with Context

```json
{
  "operation": "escalate",
  "taskId": "TSK-123",
  "fromRole": "senior-developer",
  "toRole": "architect",
  "escalationData": {
    "reason": "Architecture decision needed for OAuth integration",
    "severity": "medium",
    "blockers": [
      "OAuth provider selection requires architectural decision",
      "Token storage strategy needs clarification for OAuth flow"
    ]
  }
}
```

---

### 5. Review Operations - Enhanced Quality Assurance

**Purpose**: Comprehensive code review and completion reporting with evidence tracking.

#### Create Comprehensive Code Review

```json
{
  "operation": "create_review",
  "taskId": "TSK-123",
  "reviewData": {
    "status": "APPROVED",
    "summary": "High-quality authentication implementation following security best practices",
    "strengths": "Excellent error handling, comprehensive test coverage, proper security measures",
    "issues": "Minor: Consider extracting email templates to separate service",
    "requiredChanges": "None - approved as implemented",
    "acceptanceCriteriaVerification": {
      "User registration with email validation": "Verified working with proper validation",
      "Secure login with JWT tokens": "Security tested, tokens properly secured",
      "Password reset functionality": "Manual testing completed successfully",
      "Session management and logout": "Token invalidation verified"
    },
    "manualTestingResults": "All acceptance criteria manually verified. Security testing passed. Performance benchmarks met."
  }
}
```

#### Create Completion Report

```json
{
  "operation": "create_completion",
  "taskId": "TSK-123",
  "completionData": {
    "summary": "Authentication system implementation completed successfully with all quality gates passed",
    "filesModified": [
      "src/auth/auth.module.ts",
      "src/auth/strategies/jwt.strategy.ts",
      "src/auth/services/auth.service.ts"
    ],
    "acceptanceCriteriaVerification": {
      "User registration": "Implemented and tested",
      "Secure login": "JWT implementation verified",
      "Password reset": "Security tested and approved",
      "Session management": "Token lifecycle verified"
    },
    "delegationSummary": "Successful workflow: Boomerang → Researcher → Architect → Senior Developer → Code Review",
    "qualityValidation": "All quality gates passed: unit tests (95% coverage), integration tests, security audit, performance benchmarks"
  }
}
```

---

### 6. Research Operations - Enhanced Research and Communication

**Purpose**: Comprehensive research reports with evidence-based findings and strategic recommendations.

#### Create Research Report with Evidence

```json
{
  "operation": "create_research",
  "taskId": "TSK-123",
  "researchData": {
    "title": "Authentication Strategy Analysis for NestJS Application",
    "summary": "Comprehensive analysis of JWT vs session-based authentication with security considerations",
    "findings": "JWT with refresh tokens provides optimal balance of security, performance, and scalability for our NestJS architecture. httpOnly cookies recommended for token storage.",
    "recommendations": "Implement JWT with @nestjs/jwt, use httpOnly cookies, implement refresh token rotation, add rate limiting for auth endpoints",
    "references": [
      "https://docs.nestjs.com/security/authentication",
      "https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/",
      "https://owasp.org/www-project-cheat-sheets/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html"
    ]
  }
}
```

#### Add Strategic Comment

```json
{
  "operation": "add_comment",
  "taskId": "TSK-123",
  "commentData": {
    "content": "Consider implementing OAuth 2.0 integration for future social login requirements. Current JWT implementation provides solid foundation for OAuth flow.",
    "author": "researcher"
  }
}
```

---

## 🔍 Query Optimization Domain Tools

### 7. Query Task Context - Enhanced Context Retrieval

**Purpose**: Retrieve comprehensive task context with performance caching and pre-configured relationships.

#### Get Comprehensive Task Context

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

#### Get Specific Batch Context

```json
{
  "taskId": "TSK-123",
  "includeLevel": "full",
  "batchId": "AUTH-B001",
  "subtaskStatus": "completed"
}
```

#### Get Basic Context (Performance Optimized)

```json
{
  "taskId": "TSK-123",
  "includeLevel": "basic"
}
```

**Include Levels:**

- **`basic`**: Task + description only (fastest)
- **`full`**: Task + description + plans + subtasks (default, cached)
- **`comprehensive`**: Everything including analysis, comments, reports (complete context)

---

### 8. Query Workflow Status - Enhanced Workflow Queries

**Purpose**: Query delegation history, workflow transitions, and role assignments with performance optimization.

#### Get Complete Delegation History

```json
{
  "taskId": "TSK-123",
  "queryType": "delegation_history",
  "includeDelegations": true,
  "includeTransitions": true
}
```

#### Get Current Role Assignments

```json
{
  "queryType": "current_assignments",
  "currentRole": "senior-developer",
  "status": "in-progress"
}
```

#### Get Workflow Transitions

```json
{
  "taskId": "TSK-123",
  "queryType": "workflow_transitions",
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31"
}
```

---

### 9. Query Reports - Enhanced Report Queries

**Purpose**: Query research, code review, and completion reports with evidence relationships.

#### Get All Reports with Evidence

```json
{
  "taskId": "TSK-123",
  "reportTypes": ["research", "code_review", "completion"],
  "mode": "evidence_focused",
  "includeEvidence": true,
  "includeComments": true
}
```

#### Get Specific Report Type

```json
{
  "taskId": "TSK-123",
  "reportTypes": ["code_review"],
  "mode": "detailed",
  "reviewStatus": "APPROVED"
}
```

---

## 🔄 Batch Operations Domain Tools

### 10. Batch Subtask Operations - Enhanced Bulk Management

**Purpose**: Efficient bulk subtask management with enhanced individual operations and progress tracking.

#### Get Batch Summary with Progress

```json
{
  "operation": "get_batch_summary",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001"
}
```

#### Update Entire Batch Status

```json
{
  "operation": "update_batch_status",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001",
  "newStatus": "completed"
}
```

#### Complete Batch with Evidence

```json
{
  "operation": "complete_batch",
  "taskId": "TSK-123",
  "batchId": "AUTH-B001",
  "completionData": {
    "summary": "Authentication core implementation completed successfully",
    "filesModified": [
      "src/auth/auth.module.ts",
      "src/auth/strategies/jwt.strategy.ts",
      "src/auth/services/auth.service.ts"
    ],
    "implementationNotes": "All subtasks completed following architectural patterns. Performance targets met. Security review passed."
  }
}
```

#### Create Batch with Enhanced Subtasks

```json
{
  "operation": "create_batch_subtasks",
  "taskId": "TSK-123",
  "batchId": "AUTH-B002",
  "subtasks": [
    {
      "name": "Implement OAuth Integration",
      "description": "Add OAuth 2.0 support for social login providers",
      "sequenceNumber": 1,
      "estimatedDuration": "6 hours",
      "status": "not-started"
    },
    {
      "name": "Add Rate Limiting",
      "description": "Implement rate limiting for authentication endpoints",
      "sequenceNumber": 2,
      "estimatedDuration": "3 hours",
      "status": "not-started"
    }
  ]
}
```

---

### 11. Batch Status Updates - Enhanced Cross-Entity Synchronization

**Purpose**: Synchronize status across entities with data consistency validation and automatic repair.

#### Sync Task Status

```json
{
  "operation": "sync_task_status",
  "taskId": "TSK-123",
  "checkConsistency": true,
  "autoRepair": false
}
```

#### Validate Cross-Entity Consistency

```json
{
  "operation": "validate_consistency",
  "taskId": "TSK-123",
  "includeDetails": true,
  "includeHistory": false
}
```

#### Update Multiple Entities

```json
{
  "operation": "update_cross_entity",
  "taskId": "TSK-123",
  "entityUpdates": [
    {
      "entity": "task",
      "entityId": "TSK-123",
      "newStatus": "completed"
    },
    {
      "entity": "implementationPlan",
      "entityId": 9,
      "newStatus": "completed"
    }
  ]
}
```

---

## 🚀 Performance Features

### Caching System

- **Two-layer caching**: MCP response cache + database query cache
- **Token savings**: 25-75% reduction in token usage
- **Response times**: Sub-50ms for cached operations
- **Memory management**: LRU eviction with configurable limits

### Monitoring

- **File-based logging**: STDIO-compatible performance metrics
- **Cache analytics**: Hit rates, token savings, response times
- **Automatic cleanup**: Memory management and log rotation

### Usage Example with Caching

```json
{
  "taskId": "TSK-123",
  "includeLevel": "full"
}
```

_First call: 150ms, 500 tokens_
_Cached call: 25ms, 125 tokens (75% savings)_

---

## 📊 Status and Role Values

### Task/Subtask Status Values

- `"not-started"` - Initial state
- `"in-progress"` - Active work
- `"needs-review"` - Ready for review
- `"completed"` - Finished successfully
- `"needs-changes"` - Requires modifications
- `"paused"` - Temporarily stopped
- `"cancelled"` - Terminated

### Review Status Values

- `"APPROVED"` - Passed review
- `"APPROVED_WITH_RESERVATIONS"` - Passed with minor issues
- `"NEEDS_CHANGES"` - Requires modifications

### Role Values

- `"boomerang"` - Task intake and delivery
- `"researcher"` - Information gathering
- `"architect"` - Technical planning
- `"senior-developer"` - Implementation
- `"code-review"` - Quality assurance

---

## 🔄 Common Workflow Sequences

### 1. Complete Task Creation → Research → Architecture

```
task_operations(create) →
workflow_operations(delegate to researcher) →
research_operations(create_research) →
workflow_operations(delegate to architect)
```

### 2. Architecture → Implementation → Review

```
planning_operations(create_plan + create_subtasks) →
workflow_operations(delegate to senior-developer) →
individual_subtask_operations(update_subtask with evidence) →
batch_subtask_operations(complete_batch) →
workflow_operations(delegate to code-review)
```

### 3. Quality Gates → Completion

```
review_operations(create_review) →
workflow_operations(complete) →
query_reports(validation) →
batch_status_updates(sync_task_status)
```

---

## 🎯 Migration from Legacy Tools

### Old Universal Tools → New Domain Tools

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

**Enhanced Features:**

- Individual subtask operations with evidence collection
- Performance monitoring and caching
- Strategic guidance and technical specifications
- Dependency tracking and validation
- Cross-entity synchronization

---

## ✅ Key Benefits

✅ **Clear parameter requirements** - No more guessing what fields are needed  
✅ **Domain-specific focus** - Tools have obvious, specific purposes  
✅ **Pre-configured patterns** - Complex includes/selects handled automatically  
✅ **Business rule validation** - Built-in workflow transition validation  
✅ **Efficient batch operations** - Bulk updates with consistency checks  
✅ **Enhanced individual subtask management** - Evidence collection and dependency tracking  
✅ **Performance optimization** - Two-layer caching with 25-75% token savings  
✅ **Strategic guidance integration** - Architectural patterns and quality constraints  
✅ **Evidence-based completion** - Comprehensive tracking and validation  
✅ **Reduced agent confusion** - 10 focused tools vs 3 complex universal tools

---

_This guide covers all enhanced MCP operations with practical examples for efficient AI workflow automation._
