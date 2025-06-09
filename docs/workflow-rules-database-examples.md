# Workflow Rules Database Organization

## Overview

This document shows how the 6 existing workflow rules will be structured in the new database-driven system with actionable JSON values and integrated reporting.

## Role Organization

### 1. Boomerang Role (Strategic Workflow Orchestrator)

```json
{
  "id": "role_boomerang_001",
  "name": "boomerang",
  "displayName": "Strategic Workflow Orchestrator",
  "description": "Handles efficient task intake and final delivery with minimal token usage through MCP data management",
  "priority": 1,
  "roleType": "WORKFLOW",
  "capabilities": {
    "taskCreation": true,
    "strategicDecisions": true,
    "escalationHandling": true,
    "finalDelivery": true,
    "reportGeneration": true
  }
}
```

**Key Workflow Steps:**

#### Step 1: Active Task Detection
```json
{
  "id": "step_boomerang_001",
  "name": "active_task_detection",
  "displayName": "Active Task Detection",
  "description": "Check for existing active tasks before creating new ones",
  "sequenceNumber": 1,
  "stepType": "VALIDATION",
  "triggerReport": false,
  "actionData": {
    "mcpCall": {
      "tool": "query_workflow_status",
      "parameters": {
        "queryType": "current_assignments",
        "status": "in-progress"
      }
    },
    "validation": {
      "condition": "no_active_tasks_or_user_approval",
      "errorMessage": "Active tasks exist. Please prioritize or get user guidance."
    }
  }
}
```

#### Step 2: Memory Bank Analysis
```json
{
  "id": "step_boomerang_002",
  "name": "memory_bank_analysis",
  "displayName": "Memory Bank Analysis",
  "description": "Analyze memory bank files for project context",
  "sequenceNumber": 2,
  "stepType": "ANALYSIS",
  "triggerReport": false,
  "actionData": {
    "fileOperations": [
      {
        "action": "read_files",
        "files": [
          "memory-bank/ProjectOverview.md",
          "memory-bank/TechnicalArchitecture.md", 
          "memory-bank/DeveloperGuide.md"
        ],
        "required": true,
        "errorAction": "halt_workflow"
      }
    ],
    "analysis": {
      "extractBusinessContext": true,
      "extractTechnicalPatterns": true,
      "extractQualityStandards": true
    }
  }
}
```

#### Step 3: Git Integration Verification
```json
{
  "id": "step_boomerang_003",
  "name": "git_integration_verification",
  "displayName": "Git Integration Verification",
  "description": "Verify clean git state and create feature branch",
  "sequenceNumber": 3,
  "stepType": "VALIDATION",
  "triggerReport": false,
  "actionData": {
    "commands": [
      {
        "command": "git status --porcelain",
        "expectedOutput": "",
        "errorMessage": "Git directory not clean. Please commit or stash changes."
      },
      {
        "command": "git checkout -b feature/TSK-{timestamp}-{slug}",
        "successValidation": "branch_created"
      },
      {
        "command": "git branch --show-current",
        "validation": "confirm_branch_switch"
      }
    ],
    "haltOnFailure": true
  }
}
```

#### Step 4: Current State Functional Verification
```json
{
  "id": "step_boomerang_004",
  "name": "current_state_verification",
  "displayName": "Current State Functional Verification",
  "description": "Test actual functionality before making assumptions",
  "sequenceNumber": 4,
  "stepType": "VALIDATION",
  "triggerReport": false,
  "actionData": {
    "functionalTests": [
      {
        "testType": "mcp_connectivity",
        "description": "Test MCP server connectivity and tool availability"
      },
      {
        "testType": "database_operations",
        "description": "Verify database operations and schema integrity"
      },
      {
        "testType": "existing_features",
        "description": "Execute existing features to understand current capabilities"
      }
    ],
    "evidenceCollection": {
      "required": true,
      "storeInMCP": true,
      "includeScreenshots": false,
      "includeOutputs": true
    }
  }
}
```

#### Step 5: Task Creation with Comprehensive Analysis
```json
{
  "id": "step_boomerang_005",
  "name": "task_creation_comprehensive",
  "displayName": "Task Creation with Comprehensive Analysis",
  "description": "Create task with description and codebase analysis",
  "sequenceNumber": 5,
  "stepType": "ACTION",
  "triggerReport": true,
  "reportType": "task_creation",
  "reportTemplate": "task_creation_report",
  "actionData": {
    "mcpCall": {
      "tool": "task_operations",
      "parameters": {
        "operation": "create",
        "taskData": {
          "name": "{user_provided}",
          "priority": "{determined_priority}",
          "gitBranch": "{created_branch}"
        },
        "description": {
          "description": "{comprehensive_analysis}",
          "businessRequirements": "{extracted_from_memory_bank}",
          "technicalRequirements": "{technical_constraints}",
          "acceptanceCriteria": "{testable_requirements}"
        },
        "codebaseAnalysis": {
          "architectureFindings": "{memory_bank_analysis}",
          "problemsIdentified": "{functional_verification_results}",
          "implementationContext": "{existing_patterns}",
          "integrationPoints": "{system_boundaries}",
          "qualityAssessment": "{current_quality_metrics}",
          "functionalVerification": "{verification_evidence}"
        }
      }
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "task_creation",
      "includeAnalysis": true,
      "includeEvidence": true
    }
  }
}
```

### 2. Researcher Role (Research Specialist)

```json
{
  "id": "role_researcher_001",
  "name": "researcher",
  "displayName": "Research Specialist",
  "description": "Conducts comprehensive research to fill knowledge gaps and provide evidence-based recommendations",
  "priority": 2,
  "roleType": "SPECIALIST",
  "capabilities": {
    "technicalResearch": true,
    "evidenceCollection": true,
    "recommendationGeneration": true,
    "riskAssessment": true
  }
}
```

**Key Steps with Reporting Integration:**

#### Research Completion with Report Generation
```json
{
  "id": "step_researcher_final",
  "name": "research_completion",
  "displayName": "Research Completion with Report",
  "description": "Complete research and generate comprehensive report",
  "sequenceNumber": 5,
  "stepType": "REPORTING",
  "triggerReport": true,
  "reportType": "research_completion",
  "reportTemplate": "research_findings_report",
  "actionData": {
    "mcpCall": {
      "tool": "research_operations",
      "parameters": {
        "operation": "create_research",
        "researchData": {
          "title": "{research_title}",
          "findings": "{comprehensive_findings}",
          "recommendations": "{actionable_recommendations}",
          "references": "{validated_sources}"
        }
      }
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "research_completion",
      "includeFindings": true,
      "includeRecommendations": true,
      "includeRiskAssessment": true
    }
  }
}
```

### 3. Architect Role (Solution Architect)

```json
{
  "id": "role_architect_001", 
  "name": "architect",
  "displayName": "Solution Architect",
  "description": "Designs comprehensive implementation plans using batch-based organization",
  "priority": 3,
  "roleType": "WORKFLOW",
  "capabilities": {
    "implementationPlanning": true,
    "technicalDecisions": true,
    "batchOrganization": true,
    "qualityStandards": true
  }
}
```

**Key Steps with Implementation Plan Reporting:**

#### Implementation Plan Creation with Report
```json
{
  "id": "step_architect_plan_creation",
  "name": "implementation_plan_creation",
  "displayName": "Implementation Plan Creation",
  "description": "Create comprehensive implementation plan with batch organization",
  "sequenceNumber": 3,
  "stepType": "ACTION",
  "triggerReport": true,
  "reportType": "implementation_plan",
  "reportTemplate": "implementation_plan_report",
  "actionData": {
    "mcpCall": {
      "tool": "planning_operations",
      "parameters": {
        "operation": "create_plan",
        "planData": {
          "overview": "{strategic_overview}",
          "approach": "{technical_approach}",
          "technicalDecisions": "{structured_decisions}",
          "strategicGuidance": "{quality_patterns}"
        }
      }
    },
    "batchCreation": {
      "tool": "planning_operations",
      "operation": "create_subtasks",
      "batchOrganization": "logical_3_to_8_batches",
      "includeStrategicGuidance": true
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "implementation_plan",
      "includeBatches": true,
      "includeStrategicContext": true,
      "includeQualityGates": true
    }
  }
}
```

### 4. Senior Developer Role (Implementation Specialist)

```json
{
  "id": "role_senior_developer_001",
  "name": "senior-developer", 
  "displayName": "Implementation Specialist",
  "description": "Implements complete batches following technical excellence standards",
  "priority": 4,
  "roleType": "WORKFLOW",
  "capabilities": {
    "batchImplementation": true,
    "codeQuality": true,
    "testing": true,
    "systemIntegration": true
  }
}
```

**Key Steps with Batch Completion Reporting:**

#### Batch Completion with Progress Report
```json
{
  "id": "step_senior_dev_batch_completion",
  "name": "batch_completion",
  "displayName": "Batch Completion with Report",
  "description": "Complete batch implementation and generate progress report",
  "sequenceNumber": 4,
  "stepType": "REPORTING",
  "triggerReport": true,
  "reportType": "batch_completion",
  "reportTemplate": "batch_progress_report",
  "actionData": {
    "mcpCall": {
      "tool": "batch_subtask_operations",
      "parameters": {
        "operation": "complete_batch",
        "batchId": "{current_batch}",
        "completionData": {
          "summary": "{implementation_summary}",
          "filesModified": "{modified_files}",
          "implementationNotes": "{technical_notes}"
        }
      }
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "batch_completion",
      "includeTesting": true,
      "includeQualityMetrics": true,
      "includeNextSteps": true
    }
  }
}
```

### 5. Code Review Role (Quality Gate)

```json
{
  "id": "role_code_review_001",
  "name": "code-review",
  "displayName": "Quality Assurance Specialist", 
  "description": "Conducts comprehensive quality assurance through mandatory testing and validation",
  "priority": 5,
  "roleType": "QUALITY_GATE",
  "capabilities": {
    "qualityAssurance": true,
    "manualTesting": true,
    "securityValidation": true,
    "performanceAssessment": true
  }
}
```

**Key Steps with Quality Report:**

#### Quality Review Completion with Report
```json
{
  "id": "step_code_review_completion",
  "name": "quality_review_completion",
  "displayName": "Quality Review Completion",
  "description": "Complete quality review and generate comprehensive quality report",
  "sequenceNumber": 5,
  "stepType": "REPORTING",
  "triggerReport": true,
  "reportType": "quality_review",
  "reportTemplate": "quality_assessment_report",
  "actionData": {
    "mcpCall": {
      "tool": "review_operations",
      "parameters": {
        "operation": "create_review",
        "reviewData": {
          "status": "{review_status}",
          "summary": "{quality_summary}",
          "acceptanceCriteriaVerification": "{criteria_validation}",
          "manualTestingResults": "{testing_evidence}"
        }
      }
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "quality_review",
      "includeTestingResults": true,
      "includeSecurityAssessment": true,
      "includePerformanceMetrics": true
    }
  }
}
```

### 6. Integration Engineer Role (Final Delivery)

```json
{
  "id": "role_integration_engineer_001",
  "name": "integration-engineer",
  "displayName": "Integration & Delivery Specialist",
  "description": "Handles comprehensive final delivery integration including git operations and documentation",
  "priority": 6,
  "roleType": "WORKFLOW",
  "capabilities": {
    "finalIntegration": true,
    "gitOperations": true,
    "documentationUpdates": true,
    "deliveryValidation": true
  }
}
```

**Key Steps with Final Delivery Report:**

#### Final Delivery with Completion Report
```json
{
  "id": "step_integration_final_delivery",
  "name": "final_delivery_completion",
  "displayName": "Final Delivery Completion",
  "description": "Complete final delivery and generate comprehensive completion report",
  "sequenceNumber": 6,
  "stepType": "REPORTING",
  "triggerReport": true,
  "reportType": "task_completion",
  "reportTemplate": "final_delivery_report",
  "actionData": {
    "mcpCall": {
      "tool": "review_operations",
      "parameters": {
        "operation": "create_completion",
        "completionData": {
          "summary": "{final_summary}",
          "filesModified": "{all_modified_files}",
          "qualityValidation": "{final_quality_check}"
        }
      }
    },
    "gitOperations": {
      "commitChanges": true,
      "createPullRequest": true,
      "updateDocumentation": true
    },
    "reportGeneration": {
      "enabled": true,
      "reportType": "task_completion",
      "includeFullWorkflow": true,
      "includeQualityMetrics": true,
      "includeDeliveryEvidence": true
    }
  }
}
```

## Role Transitions with Reporting

### Transition Rules with Report Triggers

```json
{
  "id": "transition_boomerang_to_researcher",
  "fromRoleId": "role_boomerang_001",
  "toRoleId": "role_researcher_001", 
  "name": "boomerang_to_researcher",
  "conditions": {
    "researchRequired": true,
    "complexityLevel": "high",
    "unknownTechnologies": true
  },
  "requirements": {
    "completedSteps": ["task_creation_comprehensive"],
    "reportGenerated": true,
    "evidenceCollected": true
  },
  "isAutomatic": false,
  "requiresApproval": false
}
```

## Enhanced MCP Response Structure

All MCP tools will now include a `workflowGuidance` object:

```json
{
  "success": true,
  "data": {
    // ... existing response data
  },
  "workflowGuidance": {
    "currentRole": "boomerang",
    "currentStep": {
      "id": "step_boomerang_005",
      "name": "task_creation_comprehensive",
      "displayName": "Task Creation with Comprehensive Analysis",
      "status": "completed",
      "nextAction": "delegate_to_researcher"
    },
    "requiredSteps": [
      {
        "id": "step_boomerang_006",
        "name": "strategic_delegation",
        "displayName": "Strategic Role Delegation",
        "status": "pending",
        "estimatedTime": "2 minutes",
        "actions": [
          {
            "type": "mcp_call",
            "tool": "workflow_operations",
            "description": "Delegate to researcher with comprehensive context"
          }
        ]
      }
    ],
    "nextAction": {
      "description": "Delegate task to researcher role with evidence-based rationale",
      "priority": "high",
      "estimatedTime": "2 minutes",
      "mcpCall": {
        "tool": "workflow_operations",
        "operation": "delegate"
      }
    },
    "delegationOptions": {
      "availableRoles": ["researcher", "architect"],
      "recommendedRole": "researcher",
      "rationale": "Complex technical decisions require research validation"
    },
    "ruleReminders": [
      "Always include strategic context in delegation messages",
      "Ensure all evidence is stored in MCP before delegation",
      "Verify git branch creation before proceeding"
    ],
    "reportingStatus": {
      "lastReportGenerated": "task_creation_report",
      "nextReportTrigger": "research_completion",
      "reportsAvailable": ["task_creation_report"]
    }
  }
}
```

## Rule Enhancement and Editing System

### Rule Versioning for Continuous Improvement

```json
{
  "id": "rule_version_v2_0",
  "version": "v2.0",
  "description": "Enhanced boomerang role with integrated reporting and evidence collection",
  "isActive": true,
  "isDefault": true,
  "changeLog": {
    "added": [
      "Integrated reporting system",
      "Evidence collection requirements",
      "Enhanced git verification"
    ],
    "modified": [
      "Task creation step now includes comprehensive analysis",
      "Delegation logic enhanced with evidence requirements"
    ],
    "removed": [
      "Manual memory bank parsing steps"
    ]
  },
  "performanceMetrics": {
    "tokenReduction": "75%",
    "stepCompletionRate": "95%",
    "errorReduction": "60%"
  },
  "testGroup": "production",
  "testPercentage": 100.0
}
```

### Rule Editing Interface (Future Enhancement)

The system will support:

1. **Web-based Rule Editor**: Visual interface for editing workflow steps
2. **A/B Testing**: Test rule variations with different user groups
3. **Performance Monitoring**: Track rule effectiveness and optimization opportunities
4. **Rollback Capabilities**: Quickly revert to previous rule versions
5. **Rule Analytics**: Understand which steps are most/least effective

## Integration with Current Task

**Recommendation**: **Add reporting integration to the current task** as it's a natural extension of the rule-aware system. The reporting integration is essential for:

1. **User Visibility**: Users need to see progress and results at each major workflow milestone
2. **Quality Assurance**: Reports provide evidence of work completion and quality
3. **Workflow Optimization**: Report data helps improve rule effectiveness over time
4. **Stakeholder Communication**: Automated reports keep stakeholders informed

This integration fits perfectly within the current task scope and enhances the value proposition significantly.