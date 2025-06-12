# Developer Guide - Rule-Driven MCP Workflow System

## **🚀 ARCHITECTURE TRANSFORMATION COMPLETE (December 2024)**

This guide documents the **rule-driven MCP workflow system** after our major architectural transformation from task-centric to workflow-first paradigm.

### **🎯 Paradigm Shift Overview**

**Before (Task-Centric):**
- AI agents manually loaded 6+ role-specific rule files
- Complex rule management and context switching
- Tasks drove workflow execution
- Static markdown-based rules

**After (Rule-Driven - ✅ COMPLETE):**
- AI agents load single `000-workflow-core.md` file
- Database-driven rule execution through MCP
- Workflows drive task management internally
- Embedded intelligence in every MCP response

## **1. Getting Started with Rule-Driven Workflow**

### **For AI Agents (Cursor/Claude)**

**Single File Setup:**
```markdown
1. Load: enhanced-workflow-rules/000-workflow-core.md
2. Connect: MCP server running on your system
3. Execute: Workflow intelligence is now embedded in all responses
```

**Key Behavioral Changes:**
- **Automatic Context**: MCP provides comprehensive context without manual conversation parsing
- **Embedded Guidance**: Every response includes next-step recommendations
- **Quality Enforcement**: Built-in quality gates and pattern enforcement
- **Role Transitions**: Seamless delegation with context preservation

### **For Developers**

**Architecture Understanding:**
```bash
# The workflow rules are now database-driven
src/task-workflow/domains/workflow-rules/  # Rule management system
enhanced-workflow-rules/000-workflow-core.md # Single agent file
enhanced-workflow-rules/[100-600]*.md     # Migrated to database
```

## **2. MCP Tool Architecture (10 Domain-Based Tools)**

### **Core Workflow Domain (5 Tools)**

#### **task_operations** - Enhanced Task Lifecycle
```typescript
// Create task with comprehensive context
{
  operation: "create",
  taskData: { name, priority, status },
  description: { businessRequirements, technicalRequirements, acceptanceCriteria },
  codebaseAnalysis: { architectureFindings, implementationContext, qualityAssessment }
}

// Get task with smart context loading
{
  operation: "get", 
  taskId: "TSK-123",
  includeDescription: true,
  includeAnalysis: true
}
```

#### **planning_operations** - Batch-Based Implementation Planning
```typescript
// Create implementation plan
{
  operation: "create_plan",
  taskId: "TSK-123", 
  planData: { overview, approach, technicalDecisions, filesToModify }
}

// Create batch of subtasks
{
  operation: "create_subtasks",
  taskId: "TSK-123",
  batchData: { 
    batchId: "B001", 
    batchTitle: "Authentication Core",
    subtasks: [{ name, description, sequenceNumber }]
  }
}
```

#### **workflow_operations** - Role-Based Transitions
```typescript
// Delegate with context preservation
{
  operation: "delegate",
  taskId: "TSK-123",
  fromRole: "architect", 
  toRole: "senior-developer",
  message: "Implementation plan ready"
}

// Strategic escalation
{
  operation: "escalate",
  taskId: "TSK-123",
  fromRole: "senior-developer",
  toRole: "architect", 
  escalationData: { reason, severity, blockers }
}
```

#### **review_operations** - Quality Gates & Evidence
```typescript
// Create comprehensive code review
{
  operation: "create_review",
  taskId: "TSK-123",
  reviewData: { 
    status: "APPROVED|APPROVED_WITH_RESERVATIONS|NEEDS_CHANGES",
    summary, strengths, issues,
    acceptanceCriteriaVerification: {},
    manualTestingResults
  }
}
```

#### **research_operations** - Evidence-Based Research
```typescript
// Create research with evidence
{
  operation: "create_research", 
  taskId: "TSK-123",
  researchData: { 
    findings, recommendations, references,
    title, summary
  }
}
```

### **Query Optimization Domain (3 Tools)**

#### **query_task_context** - Smart Context Retrieval
```typescript
// Comprehensive context in single call
{
  taskId: "TSK-123",
  includeLevel: "comprehensive|full|basic",
  includeAnalysis: true,
  includeComments: true,
  batchId: "B001" // Optional batch filtering
}
```

#### **query_workflow_status** - Workflow Intelligence
```typescript
// Get delegation history and transitions
{
  taskId: "TSK-123", 
  queryType: "delegation_history|workflow_transitions|current_assignments",
  currentRole: "senior-developer",
  includeDelegations: true
}
```

#### **query_reports** - Evidence & Documentation
```typescript
// Get all reports with evidence
{
  taskId: "TSK-123",
  reportTypes: ["research", "code_review", "completion"],
  mode: "evidence_focused",
  includeComments: true
}
```

### **Batch Operations Domain (2 Tools)**

#### **batch_subtask_operations** - Bulk Management
```typescript
// Complete entire batch with evidence
{
  operation: "complete_batch",
  taskId: "TSK-123", 
  batchId: "B001",
  completionData: { 
    summary, filesModified, implementationNotes 
  }
}

// Get batch progress summary
{
  operation: "get_batch_summary",
  taskId: "TSK-123",
  batchId: "B001"
}
```

#### **batch_status_updates** - Cross-Entity Sync
```typescript
// Sync task status based on subtask completion
{
  operation: "sync_task_status",
  taskId: "TSK-123",
  checkConsistency: true,
  autoRepair: false
}

// Validate consistency across entities
{
  operation: "validate_consistency", 
  taskId: "TSK-123",
  includeDetails: true
}
```

## **3. Workflow Role Implementation**

### **Role-Specific Behavioral Patterns**

Each role now receives **embedded guidance** through MCP responses:

#### **🎯 Boomerang Role**
- **Focus**: Efficient task intake and final delivery
- **MCP Integration**: Comprehensive initial analysis storage
- **Quality Gates**: Memory bank validation, current state verification
- **Next Steps**: Automatic research necessity evaluation

#### **🔍 Researcher Role** 
- **Focus**: Evidence-based investigation and recommendations
- **MCP Integration**: Research findings with evidence tracking
- **Quality Gates**: Systematic investigation validation
- **Next Steps**: Actionable insights for architecture decisions

#### **🏗️ Architect Role**
- **Focus**: Technical design and implementation planning
- **MCP Integration**: Batch-based organization with strategic guidance
- **Quality Gates**: Technical excellence and pattern consistency
- **Next Steps**: Detailed executable plans for development

#### **👨‍💻 Senior Developer Role**
- **Focus**: Implementation with technical excellence
- **MCP Integration**: Complete batch implementation with evidence
- **Quality Gates**: SOLID principles, testing, integration validation
- **Next Steps**: Production-ready code delivery

#### **✅ Code Review Role**
- **Focus**: Quality assurance through comprehensive validation
- **MCP Integration**: Manual testing, security, performance assessment
- **Quality Gates**: Acceptance criteria verification
- **Next Steps**: Implementation approval or strategic redelegation

### **Strategic Redelegation Framework**

**CRITICAL**: Complex issues flow through architect analysis:

```
Code Review Finds Complex Issue
        ↓
Architect Analysis & Strategic Solution Design  
        ↓
Enhanced Implementation Plan with Specific Guidance
        ↓
Senior Developer Implements Strategic Solution
        ↓
Code Review Validates Strategic Implementation
```

**Simple vs Complex Fix Decision Matrix:**
- **Simple**: Missing imports, typos, linting → Direct fix
- **Complex**: Missing methods, architecture violations → Strategic redelegation

## **4. Database Schema & Business Logic**

### **Core Entities**

```typescript
// Task with comprehensive context
model Task {
  id: Int
  name: String
  status: TaskStatus
  priority: TaskPriority
  
  // Enhanced relationships
  description?: TaskDescription
  codebaseAnalysis?: CodebaseAnalysis
  implementationPlans: ImplementationPlan[]
  subtasks: Subtask[]
  delegations: WorkflowDelegation[]
  reviews: CodeReview[]
  research: ResearchReport[]
}

// Batch-organized subtasks
model Subtask {
  id: Int
  name: String
  description: String
  batchId: String          // Batch organization
  sequenceNumber: Int      // Order within batch
  status: SubtaskStatus
  
  // Evidence tracking
  completionEvidence?: Json
  strategicGuidance?: Json
  acceptanceCriteria: String[]
}

// Workflow intelligence
model WorkflowDelegation {
  id: Int
  taskId: Int
  fromRole: WorkflowRole
  toRole: WorkflowRole
  message?: String
  
  // Enhanced context preservation
  delegationContext?: Json
  strategicGuidance?: Json
  escalationData?: Json
}
```

### **Status Values & Workflow States**

```typescript
// Task/Subtask Status Flow
"not-started" → "in-progress" → "needs-review" → "completed"
                              ↘ "needs-changes" ↗
                              ↘ "paused" 
                              ↘ "cancelled"

// Review Status Flow  
"APPROVED" | "APPROVED_WITH_RESERVATIONS" | "NEEDS_CHANGES"

// Role Flow
"boomerang" → "researcher" → "architect" → "senior-developer" → "code-review"
```

## **5. Quality Standards & Evidence Tracking**

### **Mandatory Quality Gates**

**Memory Bank Analysis (All Roles):**
- Verify ProjectOverview.md, TechnicalArchitecture.md, DeveloperGuide.md
- Extract relevant context for current task
- Store analysis in MCP for downstream access

**Current State Verification (All Roles):**
- Identify key assumptions about implementation state
- Test current functionality using available tools
- Verify claims through hands-on investigation
- Document evidence with concrete findings

**Technical Excellence (Development Roles):**
- SOLID Principles compliance
- Design pattern application
- Clean code practices
- Comprehensive error handling
- Security validation

**Testing Requirements (All Implementation):**
- Unit testing with 80%+ coverage
- Integration testing for component interactions
- Manual testing against acceptance criteria
- Performance and security validation

### **Evidence-Based Completion**

Every completion requires:
```typescript
{
  acceptanceCriteriaVerification: {
    "Criterion 1": "Evidence of completion with specifics",
    "Criterion 2": "Evidence of completion with specifics"
  },
  implementationEvidence: {
    filesModified: ["file1.ts", "file2.ts"],
    testResults: "Comprehensive test suite results",
    qualityMetrics: "Code quality and performance metrics"
  }
}
```

## **6. Advanced Patterns & Best Practices**

### **Context Efficiency with MCP**

**Use MCP for Reliable Context:**
```typescript
// ALWAYS use MCP - no conversation parsing needed
const context = await query_task_context({
  taskId: "TSK-123",
  includeLevel: "full"  // Default for most operations
});

// Comprehensive analysis when needed
const fullContext = await query_task_context({
  taskId: "TSK-123", 
  includeLevel: "comprehensive",
  includeAnalysis: true,
  includeComments: true
});
```

**Strategic Context Preservation:**
```typescript
// Enhanced escalation with context
await workflow_operations({
  operation: "escalate",
  escalationData: {
    reason: "architecture_violation",
    severity: "high", 
    contextPreservation: {
      mcpContext: "Reference to comprehensive context",
      functionalVerification: "Current state testing evidence",
      workCompleted: "Implementation status with evidence"
    }
  }
});
```

### **Error Handling & Recovery**

**Rule Loading (Legacy Check):**
- Verify `✅ RULES LOADED: [role-name]` markers only for legacy compatibility
- New system: Rules are database-driven through MCP

**MCP Call Failures:**
- Verify taskId format (TSK-timestamp) and parameter structure
- Use exact status values and schema parameters
- Retry with corrected parameters or escalate

**Git Operation Integration:**
- Document specific errors with recovery procedures
- Automated resolution for authentication/conflict issues
- HALT workflow until git operations successful

## **7. Migration Guide (For Reference)**

### **Old → New Architecture Mapping**

**Rule Management:**
```bash
# Before: Manual file loading
enhanced-workflow-rules/100-boomerang-role.md     → Database-driven
enhanced-workflow-rules/200-researcher-role.md    → Database-driven  
enhanced-workflow-rules/300-architect-role.md     → Database-driven
enhanced-workflow-rules/400-senior-developer-role.md → Database-driven
enhanced-workflow-rules/500-code-review-role.md   → Database-driven

# After: Single agent file
enhanced-workflow-rules/000-workflow-core.md      → AI Agent Context
```

**Tool Evolution:**
```bash
# Before: 3 universal tools with complex parameters
query_data(complexParams) → 3 focused query tools
mutate_data(complexParams) → 5 focused domain tools  
workflow_operations(basic) → 2 enhanced workflow tools
```

**Context Management:**
```bash
# Before: Manual conversation parsing
"Parse previous messages for context" → query_task_context()

# After: Direct MCP access
"Comprehensive context in single call" → Embedded intelligence
```

## **8. Performance & Optimization**

### **Token Efficiency**
- **MCP-Optimized Communication**: Comprehensive queries vs multiple calls
- **Automatic Batch Organization**: Efficient relationship loading
- **Context Storage**: MCP storage vs conversation repetition
- **Quality Assurance**: Evidence tracking with audit trails

### **Query Optimization**
- Default `includeLevel: "full"` for most operations
- Use `includeLevel: "comprehensive"` only when full analysis needed
- Leverage pre-configured relationship loading
- Focus on completion-driven workflow with evidence tracking

## **9. Testing & Validation**

### **MCP Integration Testing**
```bash
# Start MCP server
npm run start:mcp

# Test with AI agent
# 1. Load 000-workflow-core.md into agent context
# 2. Connect to MCP server  
# 3. Execute workflow commands
# 4. Verify embedded guidance in responses
```

### **Database Testing**
```bash
# Unit tests for MCP operations
npm run test

# Integration tests for workflow flows
npm run test:e2e

# Database consistency tests
npx prisma studio  # Visual validation
```

## **🎯 Success Validation Checkpoints**

**Before Any Workflow:**
□ Memory bank analysis completed with MCP storage
□ Current state verification with functional testing
□ Git setup verified with feature branch created
□ Rule-driven workflow guidance active

**During Implementation:**
□ Implementation plan created with batch organization
□ Technical decisions documented in MCP
□ Quality standards applied with evidence tracking
□ Strategic guidance followed with pattern compliance

**Before Completion:**
□ All acceptance criteria verified with MCP evidence
□ Code review approval with comprehensive validation
□ System integration validated through testing
□ Strategic decisions documented for continuous improvement

---

**🚀 This developer guide represents the completion of our rule-driven architectural transformation. The MCP workflow system now provides embedded intelligence that guides AI agents through complex development workflows with minimal configuration and maximum efficiency.**