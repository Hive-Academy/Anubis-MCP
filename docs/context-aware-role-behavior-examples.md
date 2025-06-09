# Context-Aware Role Behavior Examples

## Overview

This document demonstrates how behavioral context, methodological guidance, and quality standards are embedded directly into workflow steps to ensure roles consistently follow established patterns and principles.

## Senior Developer Role - Context-Aware Implementation

### Step: Code Implementation with SOLID Principles

```json
{
  "id": "step_senior_dev_implementation",
  "name": "code_implementation_solid",
  "displayName": "Code Implementation Following SOLID Principles",
  "description": "Implement code following established patterns and quality standards",
  "sequenceNumber": 2,
  "stepType": "ACTION",
  "behavioralContext": {
    "corePhilosophy": "Write clean, maintainable, testable code that follows established architectural patterns",
    "principlesRequired": [
      {
        "principle": "SOLID",
        "details": {
          "S": "Single Responsibility - Each class/function has one reason to change",
          "O": "Open/Closed - Open for extension, closed for modification", 
          "L": "Liskov Substitution - Derived classes must be substitutable for base classes",
          "I": "Interface Segregation - Many client-specific interfaces better than one general-purpose interface",
          "D": "Dependency Inversion - Depend on abstractions, not concretions"
        }
      },
      {
        "principle": "KISS",
        "details": "Keep It Simple, Stupid - Prefer simple solutions over complex ones"
      },
      {
        "principle": "DRY", 
        "details": "Don't Repeat Yourself - Extract common functionality into reusable components"
      }
    ],
    "codeQualityStandards": {
      "naming": "Use descriptive, intention-revealing names",
      "functions": "Small functions that do one thing well",
      "classes": "Cohesive classes with clear responsibilities",
      "comments": "Code should be self-documenting, comments explain WHY not WHAT"
    }
  },
  "approachGuidance": {
    "step1_analysis": {
      "description": "Analyze existing codebase patterns before implementing",
      "actions": [
        "Examine current file structure and naming conventions",
        "Identify existing design patterns in use",
        "Review similar implementations for consistency",
        "Check for established service/repository patterns"
      ],
      "validation": "Must understand existing patterns before proceeding"
    },
    "step2_design": {
      "description": "Design implementation following identified patterns",
      "actions": [
        "Apply SOLID principles to class design",
        "Use dependency injection for loose coupling",
        "Design interfaces before implementations",
        "Plan for testability from the start"
      ],
      "validation": "Design must pass SOLID principles checklist"
    },
    "step3_implementation": {
      "description": "Implement code following design and patterns",
      "actions": [
        "Write tests first (TDD approach when possible)",
        "Implement smallest working increment",
        "Follow established naming conventions",
        "Use TypeScript strict mode features"
      ],
      "validation": "Code must pass quality checklist before proceeding"
    },
    "step4_integration": {
      "description": "Integrate with existing system",
      "actions": [
        "Ensure proper error handling and logging",
        "Validate integration points work correctly",
        "Update related documentation",
        "Run full test suite to ensure no regressions"
      ],
      "validation": "Integration must not break existing functionality"
    }
  },
  "qualityChecklist": {
    "codeQuality": [
      "Functions are small and focused (< 20 lines preferred)",
      "Classes have single responsibility",
      "No code duplication (DRY principle)",
      "Descriptive variable and function names",
      "Proper error handling implemented",
      "TypeScript types are properly defined"
    ],
    "solidCompliance": [
      "Single Responsibility: Each class has one reason to change",
      "Open/Closed: New functionality added via extension, not modification",
      "Liskov Substitution: Inheritance used correctly",
      "Interface Segregation: Interfaces are focused and specific",
      "Dependency Inversion: Dependencies injected, not hardcoded"
    ],
    "testingRequirements": [
      "Unit tests written for all new functions",
      "Integration tests for service interactions",
      "Test coverage > 80% for new code",
      "Tests are readable and maintainable",
      "Edge cases and error conditions tested"
    ],
    "integrationChecks": [
      "Follows existing architectural patterns",
      "Proper logging and monitoring implemented",
      "Error responses follow established format",
      "API contracts maintained (no breaking changes)",
      "Performance impact assessed and acceptable"
    ]
  },
  "patternEnforcement": {
    "requiredPatterns": [
      {
        "pattern": "Dependency Injection",
        "description": "Use NestJS dependency injection for all services",
        "example": "@Injectable() decorator and constructor injection"
      },
      {
        "pattern": "Repository Pattern",
        "description": "Data access through repository interfaces",
        "example": "PrismaService injected into repositories, not used directly in controllers"
      },
      {
        "pattern": "DTO Validation",
        "description": "Use class-validator for input validation",
        "example": "DTOs with validation decorators for all API inputs"
      },
      {
        "pattern": "Error Handling",
        "description": "Consistent error handling and logging",
        "example": "Use NestJS exception filters and proper HTTP status codes"
      }
    ],
    "antiPatterns": [
      {
        "antiPattern": "God Classes",
        "description": "Classes that do too many things",
        "detection": "Classes > 200 lines or > 10 methods",
        "solution": "Break into smaller, focused classes"
      },
      {
        "antiPattern": "Tight Coupling",
        "description": "Direct dependencies between unrelated modules",
        "detection": "Direct imports of concrete classes instead of interfaces",
        "solution": "Use dependency injection and interfaces"
      },
      {
        "antiPattern": "Magic Numbers/Strings",
        "description": "Hardcoded values without explanation",
        "detection": "Unexplained numeric or string literals",
        "solution": "Extract to named constants with clear purpose"
      },
      {
        "antiPattern": "Copy-Paste Programming",
        "description": "Duplicated code blocks",
        "detection": "Similar code in multiple locations",
        "solution": "Extract common functionality to shared utilities"
      }
    ]
  },
  "contextValidation": {
    "preImplementation": [
      {
        "check": "pattern_analysis_completed",
        "description": "Must analyze existing patterns before implementing",
        "validation": "Evidence of pattern analysis in MCP context"
      },
      {
        "check": "design_follows_solid",
        "description": "Design must demonstrate SOLID principles",
        "validation": "Design documentation shows SOLID compliance"
      }
    ],
    "duringImplementation": [
      {
        "check": "incremental_progress",
        "description": "Implementation should be incremental with tests",
        "validation": "Regular commits with working tests"
      },
      {
        "check": "quality_gates_passed",
        "description": "Each increment must pass quality checklist",
        "validation": "Quality checklist items verified and documented"
      }
    ],
    "postImplementation": [
      {
        "check": "integration_validated",
        "description": "Integration must not break existing functionality",
        "validation": "Full test suite passes, no regressions detected"
      },
      {
        "check": "documentation_updated",
        "description": "Related documentation must be updated",
        "validation": "Documentation changes committed with code"
      }
    ]
  },
  "actionData": {
    "mcpCalls": [
      {
        "tool": "codebase_search",
        "purpose": "Analyze existing patterns",
        "parameters": {
          "query": "similar implementations and patterns"
        }
      },
      {
        "tool": "read_file",
        "purpose": "Examine existing code structure",
        "parameters": {
          "target_files": "related_service_files"
        }
      }
    ],
    "qualityValidation": {
      "linting": "npm run lint",
      "testing": "npm run test",
      "typeCheck": "npm run type-check",
      "coverage": "npm run test:coverage"
    },
    "evidenceCollection": {
      "required": true,
      "items": [
        "Code analysis findings",
        "Design decisions and rationale",
        "Test results and coverage",
        "Integration validation results",
        "Quality checklist completion"
      ]
    }
  }
}
```

## Architect Role - Context-Aware Planning

### Step: Implementation Plan Creation with Architectural Patterns

```json
{
  "id": "step_architect_planning",
  "name": "implementation_plan_creation",
  "displayName": "Implementation Plan Creation with Architectural Guidance",
  "description": "Create comprehensive implementation plan following architectural best practices",
  "sequenceNumber": 3,
  "stepType": "ACTION",
  "behavioralContext": {
    "corePhilosophy": "Design for maintainability, scalability, and testability while following established architectural patterns",
    "architecturalPrinciples": [
      {
        "principle": "Clean Architecture",
        "description": "Separate concerns with clear boundaries between layers"
      },
      {
        "principle": "Domain-Driven Design",
        "description": "Organize code around business domains and concepts"
      },
      {
        "principle": "SOLID Principles",
        "description": "Apply SOLID principles at the architectural level"
      }
    ],
    "planningApproach": {
      "batchOrganization": "Logical grouping of 3-8 subtasks per batch",
      "dependencyManagement": "Clear dependencies between batches and subtasks",
      "riskMitigation": "Identify and plan for technical risks",
      "qualityGates": "Define quality checkpoints throughout implementation"
    }
  },
  "approachGuidance": {
    "step1_analysis": {
      "description": "Analyze requirements and existing architecture",
      "methodology": [
        "Review task requirements and acceptance criteria",
        "Analyze existing codebase architecture and patterns",
        "Identify integration points and dependencies",
        "Assess technical risks and complexity"
      ]
    },
    "step2_design": {
      "description": "Design solution architecture",
      "methodology": [
        "Apply Clean Architecture principles",
        "Design for testability and maintainability",
        "Plan database schema changes if needed",
        "Define service interfaces and contracts"
      ]
    },
    "step3_planning": {
      "description": "Create detailed implementation plan",
      "methodology": [
        "Break down into logical batches (3-8 subtasks each)",
        "Define clear dependencies between batches",
        "Include quality gates and validation points",
        "Provide strategic guidance for each subtask"
      ]
    }
  },
  "qualityChecklist": [
    "Plan follows established architectural patterns",
    "Batches are logically organized with clear dependencies",
    "Quality gates defined for each major milestone",
    "Technical risks identified and mitigation planned",
    "Strategic guidance provided for complex subtasks",
    "Integration points clearly defined",
    "Testing strategy included in plan"
  ],
  "patternEnforcement": {
    "requiredPatterns": [
      "Clean Architecture with clear layer separation",
      "Domain-driven design for business logic organization",
      "Dependency injection for loose coupling",
      "Repository pattern for data access"
    ],
    "planningPatterns": [
      "Batch organization by logical functionality",
      "Progressive complexity (simple to complex)",
      "Quality gates at batch boundaries",
      "Strategic guidance for implementation approach"
    ]
  }
}
```

## Code Review Role - Context-Aware Quality Assurance

### Step: Comprehensive Quality Review

```json
{
  "id": "step_code_review_quality",
  "name": "comprehensive_quality_review",
  "displayName": "Comprehensive Quality Review with Standards Enforcement",
  "description": "Conduct thorough quality review ensuring all standards are met",
  "sequenceNumber": 3,
  "stepType": "VALIDATION",
  "behavioralContext": {
    "corePhilosophy": "Ensure code quality, security, and maintainability through comprehensive review",
    "reviewApproach": {
      "methodology": "Systematic review of code, tests, documentation, and integration",
      "standards": "Enforce established coding standards and architectural patterns",
      "evidence": "Require evidence of manual testing and quality validation"
    }
  },
  "approachGuidance": {
    "step1_code_review": {
      "description": "Review code quality and patterns",
      "checklist": [
        "SOLID principles applied correctly",
        "No code duplication or anti-patterns",
        "Proper error handling and logging",
        "TypeScript types properly defined",
        "Naming conventions followed"
      ]
    },
    "step2_testing_review": {
      "description": "Validate testing completeness",
      "checklist": [
        "Unit tests cover all new functionality",
        "Integration tests validate service interactions",
        "Test coverage meets minimum requirements (80%)",
        "Edge cases and error conditions tested",
        "Manual testing evidence provided"
      ]
    },
    "step3_integration_review": {
      "description": "Validate system integration",
      "checklist": [
        "No breaking changes to existing APIs",
        "Database migrations are safe and reversible",
        "Performance impact assessed",
        "Security considerations addressed",
        "Documentation updated appropriately"
      ]
    }
  },
  "qualityChecklist": {
    "mandatory": [
      "All acceptance criteria verified through manual testing",
      "Code follows established patterns and principles",
      "Test coverage > 80% with meaningful tests",
      "No security vulnerabilities introduced",
      "Performance impact within acceptable limits",
      "Documentation updated and accurate"
    ],
    "blocking": [
      "Any security vulnerability",
      "Breaking changes without proper migration",
      "Test coverage below 80%",
      "Manual testing not completed",
      "Anti-patterns or SOLID violations"
    ]
  }
}
```

## Enhanced MCP Response with Behavioral Context

```json
{
  "success": true,
  "data": {
    // ... existing response data
  },
  "workflowGuidance": {
    "currentRole": "senior-developer",
    "currentStep": {
      "id": "step_senior_dev_implementation",
      "name": "code_implementation_solid",
      "displayName": "Code Implementation Following SOLID Principles",
      "status": "in_progress"
    },
    "behavioralContext": {
      "approach": "Analyze existing patterns, design following SOLID principles, implement incrementally with tests",
      "principles": ["SOLID", "KISS", "DRY"],
      "qualityStandards": {
        "codeQuality": "Functions < 20 lines, descriptive names, proper error handling",
        "testing": "Unit tests for all functions, >80% coverage",
        "patterns": "Use dependency injection, repository pattern, DTO validation"
      }
    },
    "nextActions": [
      {
        "action": "analyze_existing_patterns",
        "description": "Examine current codebase patterns before implementing",
        "methodology": "Use codebase_search to find similar implementations",
        "validation": "Must document pattern analysis before proceeding"
      },
      {
        "action": "design_implementation",
        "description": "Design following SOLID principles",
        "methodology": "Apply single responsibility, dependency injection, interface segregation",
        "validation": "Design must pass SOLID principles checklist"
      }
    ],
    "qualityReminders": [
      "Write tests first when possible (TDD approach)",
      "Keep functions small and focused (< 20 lines)",
      "Use TypeScript strict mode features",
      "Follow established naming conventions",
      "Implement proper error handling and logging"
    ],
    "patternEnforcement": {
      "required": ["Dependency Injection", "Repository Pattern", "DTO Validation"],
      "avoid": ["God Classes", "Tight Coupling", "Magic Numbers", "Copy-Paste Programming"]
    },
    "contextValidation": {
      "current": "pattern_analysis_required",
      "next": "design_solid_compliance",
      "evidence": "Must provide analysis findings and design rationale"
    }
  }
}
```

## Implementation Strategy

### 1. **Rule Engine Enhancement**
- Add behavioral context evaluation to rule queries
- Include methodology validation in step progression
- Provide context-aware guidance in MCP responses

### 2. **Quality Enforcement**
- Validate approach methodology before allowing step completion
- Require evidence of pattern compliance
- Block progression if quality standards not met

### 3. **Continuous Improvement**
- Track pattern compliance metrics
- Identify common quality issues
- Refine behavioral context based on real usage

This approach ensures that roles don't just follow steps mechanically, but understand and apply the underlying principles and methodologies that make the work high-quality and maintainable.