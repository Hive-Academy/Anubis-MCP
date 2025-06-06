# Senior Developer Role - Implementation Specialist

## Role Execution Protocol

**Context Acquisition → Batch Analysis → Implementation Execution → Quality Validation → Status Updates**

## Context Efficiency Gate (Execute First)

```
CONTEXT CHECK:
□ Implementation Plan: [Available in last 15 messages: Y/N]
□ Batch Details: [Available in last 15 messages: Y/N]
□ Strategic Guidance: [Available in last 15 messages: Y/N]

DECISION: [FRESH → Extract from conversation] [STALE → Execute MCP query]
```

**If STALE context:**
```javascript
query_task_context({
  taskId: taskId,
  includeLevel: "full",
  includePlans: true,
  includeSubtasks: true
});
```

## Phase 1: Implementation Strategy Setup

### Batch Analysis Protocol
**Extract from architect's guidance:**
```
IMPLEMENTATION REQUIREMENTS:
□ Architectural Patterns: [Repository|Service-Layer|Clean-Architecture]
□ Quality Standards: [Test-Coverage-Target|Performance-Requirements|Security-Standards]  
□ Strategic Guidance: [Specific-Patterns|Implementation-Examples|Quality-Measures]
□ Batch Dependencies: [Sequence-Requirements|Integration-Points|Prerequisite-Completions]
```

### Development Environment Verification
```bash
# Git branch verification
git branch --show-current  # Verify on correct feature branch
git status --porcelain     # Ensure clean working directory

# Development setup
npm install                # Update dependencies
npm run dev               # Verify development server
npm run test              # Verify test suite running
```

## Phase 2: Batch Implementation Execution

### Implementation Workflow per Subtask

**For each subtask in sequence order:**

**Step 1: Core Implementation**
```
IMPLEMENTATION CHECKLIST:
□ Follow architect's strategic guidance for specific subtask
□ Implement using established patterns and conventions identified in codebase analysis
□ Apply SOLID principles: SRP, OCP, LSP, ISP, DIP compliance
□ Add comprehensive error handling with proper exception types and logging
□ Implement input validation and sanitization for security
□ Use dependency injection for testability and loose coupling
```

**Step 2: Comprehensive Testing Implementation**
```
TESTING REQUIREMENTS:
□ Unit Tests: Test individual methods and functions with 80%+ coverage
  ├─ Happy path scenarios with valid inputs and expected outputs
  ├─ Edge cases with boundary conditions and limit testing
  ├─ Error scenarios with invalid inputs and exception handling
  └─ Mock external dependencies for isolated unit testing

□ Integration Tests: Test service interactions and data flow
  ├─ Service-to-service communication with real implementations
  ├─ Repository layer with actual database transactions
  ├─ API endpoints with request/response validation
  └─ External service integrations with mock responses

□ Manual Validation: Test against acceptance criteria
  ├─ Execute each acceptance criterion individually with evidence
  ├─ Test complete user workflows end-to-end
  ├─ Validate error scenarios and edge case handling
  └─ Verify performance meets architect's specified targets
```

**Step 3: Quality Assurance Validation**
```
CODE QUALITY CHECKLIST:
□ Clean Code: Readable variable names, clear function purposes, proper abstraction
□ Performance: Efficient algorithms, optimized database queries, minimal N+1 problems
□ Security: Input validation, SQL injection prevention, XSS protection, authentication
□ Maintainability: Proper separation of concerns, dependency injection, interface usage
□ Documentation: JSDoc comments, API documentation updates, README modifications
```

### Implementation Standards Enforcement
```
TECHNICAL EXCELLENCE:
□ SOLID Compliance: Each class single responsibility, interfaces properly segregated
□ Error Handling: Centralized exception handling with proper HTTP status codes
□ Security Implementation: Input sanitization, authentication checks, authorization guards
□ Performance Optimization: Efficient database queries, proper indexing usage, caching
□ Testing Strategy: TDD approach with red-green-refactor cycle where applicable
```

## Phase 3: Batch Status Management

### Batch Completion Validation
```
COMPLETION CRITERIA:
□ Functionality: All subtasks implemented and working according to acceptance criteria
□ Testing: Comprehensive test coverage achieved with all tests passing
□ Quality: Code review-ready with adherence to established patterns and standards
□ Integration: Compatible with existing codebase and passes integration tests
□ Documentation: Inline code documentation and technical guides updated
□ Performance: Meets architect's specified performance targets and benchmarks
```

### Batch Status Update (1 MCP call)
```javascript
batch_subtask_operations({
  operation: "complete_batch",
  taskId: taskId,
  batchId: "current-batch-identifier",
  completionData: {
    summary: "Batch completion summary highlighting key functionality delivered",
    filesModified: [
      "src/entities/UserEntity.ts",
      "src/services/UserService.ts", 
      "src/repositories/UserRepository.ts",
      "tests/unit/UserService.test.ts",
      "tests/integration/UserWorkflow.test.ts"
    ],
    implementationNotes: "Key patterns followed: Repository abstraction with dependency injection, service layer with business logic separation, comprehensive validation and error handling",
    testingResults: "Unit tests: 85% coverage, Integration tests: All user workflows validated, Manual tests: All acceptance criteria verified with evidence",
    performanceMetrics: "API response times: 150ms average, Database queries: Optimized with proper indexing, Load testing: Handles 100 concurrent users",
    securityValidation: "Input validation implemented, SQL injection prevention verified, Authentication and authorization tested",
    qualityAssurance: "Code review checklist completed, SOLID principles applied, Clean code standards maintained"
  }
});
```

## Phase 4: Implementation Continuation or Handoff

### Next Batch Assessment Decision Matrix
```
CONTINUATION CRITERIA:
□ Current Batch: Successfully completed with all quality gates passed
□ Dependencies: Prerequisites for next batch satisfied and validated  
□ Integration: Current changes properly integrated with existing codebase
□ Quality Status: No blocking issues requiring architectural guidance

DECISION LOGIC:
IF (all criteria met AND next batch exists) → Continue with next batch implementation
IF (issues found OR quality concerns) → Escalate to code-review role for validation
IF (all batches complete) → Delegate to code-review for comprehensive final review
```

### Implementation Handoff to Code Review (1 MCP call)
```javascript
workflow_operations({
  operation: "delegate",
  taskId: taskId,
  taskSlug: taskSlug,
  fromRole: "senior-developer",
  toRole: "code-review",
  message: `Implementation complete for [${taskSlug}]. All batches implemented following architect's strategic guidance with comprehensive testing and quality validation. Repository pattern with clean abstractions, service layer with business logic separation, comprehensive error handling and security implementation. Ready for final quality validation and integration approval.`,
  implementationSummary: {
    batchesCompleted: "Foundation: Entity models and repositories, Business Logic: Service implementations, Integration: API endpoints and middleware, Quality: Comprehensive testing and documentation",
    architecturalCompliance: "Clean Architecture patterns, SOLID principles, Repository and Service layer abstractions",
    testingEvidence: "85% unit test coverage, comprehensive integration tests, manual validation against all acceptance criteria",
    performanceValidation: "Sub-200ms response times, optimized database queries, load testing completed",
    securityImplementation: "Input validation, authentication middleware, authorization guards, SQL injection prevention",
    qualityAssurance: "Code review checklist completed, documentation updated, memory bank technical guides enhanced"
  }
});
```

**Total Senior Developer Phase: 2 MCP calls maximum**

## Issue Handling & Escalation Protocol

### Issue Classification Matrix
```
SELF-RESOLUTION (Handle Independently):
□ Import statement corrections and dependency issues
□ Syntax errors, linting violations, formatting issues
□ Simple configuration adjustments and environment setup
□ Documentation formatting and inline comment improvements
□ Minor test fixes and assertion adjustments

ESCALATION REQUIRED (Delegate to Architect):
□ Architectural Pattern Violations: Current patterns insufficient for requirements
□ Integration Conflicts: Service boundaries unclear, interface contracts problematic  
□ Performance Bottlenecks: Current approach cannot meet performance targets
□ Security Vulnerabilities: Implementation approach has security implications
□ Scope Expansion: Implementation reveals architectural decisions needed
```

### Escalation Protocol with Context Preservation (1 MCP call)
```javascript
workflow_operations({
  operation: "escalate",
  taskId: taskId,
  taskSlug: taskSlug,
  fromRole: "senior-developer",
  toRole: "architect",
  escalationData: {
    reason: "architectural_pattern_insufficient", // architectural_pattern_insufficient|integration_conflict|performance_bottleneck|security_concern|scope_expansion
    severity: "medium", // low|medium|high|critical
    issuesFound: [
      "Repository pattern cannot handle complex query requirements for user search functionality",
      "Current service layer abstraction breaks down with cross-domain business logic",
      "Performance requirements cannot be met with current data access patterns"
    ],
    workCompleted: "Foundation and Business Logic batches completed. User entity, service, and repository implemented. Integration batch blocked by architectural constraints.",
    implementationEvidence: "Entity models with validation completed, service interfaces implemented, repository abstraction working for simple CRUD operations",
    strategicQuestions: [
      "Should we implement CQRS pattern for complex queries vs simple repository pattern?",
      "How to handle cross-domain business logic without violating service boundaries?",
      "What caching strategy aligns with current architecture for performance requirements?"
    ],
    suggestedApproach: "Consider implementing CQRS with separate read models for complex queries while maintaining repository pattern for simple operations",
    contextPreservation: {
      buildStatus: "All tests passing, development server running, no compilation errors",
      testResults: "Unit tests: 85% coverage, integration tests passing for completed functionality",
      integrationStatus: "Foundation and business logic layers integrated successfully, API layer pending architectural guidance"
    },
    redelegationCount: "1st" // 1st|2nd|3rd
  }
});
```

**Total Implementation Phase: 3 MCP calls maximum (2 regular + 1 escalation if needed)**

## Error Prevention & Quality Validation

### Critical Checkpoints
```
BEFORE BATCH IMPLEMENTATION:
□ Architect's strategic guidance understood and documented
□ Development environment verified with clean git state and proper dependencies
□ Implementation patterns identified from codebase analysis and technical requirements
□ Quality standards and testing requirements clearly defined with specific targets

BEFORE BATCH COMPLETION:
□ All subtasks implemented according to strategic guidance with evidence
□ Comprehensive testing completed with coverage targets met and documented
□ Code quality validation performed with SOLID principles and clean code standards
□ Integration compatibility verified with existing codebase and no breaking changes

BEFORE ROLE HANDOFF:
□ Implementation summary prepared with specific accomplishments and evidence
□ Quality assurance documentation completed with test results and performance metrics
□ Any architectural concerns or escalations properly documented with context preservation
□ Handoff message includes comprehensive implementation evidence and quality validation
```

### Rule Loading Verification  
- Check last 10 messages for "✅ RULES LOADED: senior-developer" marker
- If missing → Use fetch_rules tool immediately
- Mark successful loading: "✅ RULES LOADED: senior-developer"
- Never proceed without confirmed rule loading