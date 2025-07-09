-- CreateTable
CREATE TABLE "project_onboarding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectPath" TEXT NOT NULL,
    "onboardingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "lastAnalyzed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisTriggeredBy" TEXT,
    "projectName" TEXT,
    "projectType" TEXT,
    "detectedFrameworks" JSONB,
    "analysisDepth" TEXT NOT NULL DEFAULT 'comprehensive',
    "customAnalysisRules" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "project_analysis_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "analysisType" TEXT NOT NULL,
    "projectStructure" JSONB NOT NULL,
    "technologyStack" JSONB NOT NULL,
    "architecturalPatterns" JSONB NOT NULL,
    "codeQualityMetrics" JSONB NOT NULL,
    "aiInsights" JSONB NOT NULL,
    "complexityAssessment" JSONB NOT NULL,
    "riskAssessment" JSONB NOT NULL,
    "roleRecommendations" JSONB NOT NULL,
    "workflowSuggestions" JSONB NOT NULL,
    "analysisConfidence" REAL NOT NULL DEFAULT 0.0,
    "analysisEvidence" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_analysis_results_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "codebase_insights" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "moduleStructure" JSONB NOT NULL,
    "dependencyGraph" JSONB NOT NULL,
    "serviceInterfaces" JSONB NOT NULL,
    "dataFlowPatterns" JSONB NOT NULL,
    "codeStylePatterns" JSONB NOT NULL,
    "testingPatterns" JSONB NOT NULL,
    "errorHandlingPatterns" JSONB NOT NULL,
    "securityPatterns" JSONB NOT NULL,
    "externalIntegrations" JSONB NOT NULL,
    "deploymentPatterns" JSONB NOT NULL,
    "configurationPatterns" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "codebase_insights_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "architectural_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "architecturalStyle" TEXT NOT NULL,
    "designPatterns" JSONB NOT NULL,
    "architecturalDecisions" JSONB NOT NULL,
    "performanceProfile" JSONB NOT NULL,
    "scalabilityProfile" JSONB NOT NULL,
    "securityProfile" JSONB NOT NULL,
    "maintainabilityProfile" JSONB NOT NULL,
    "technicalConstraints" JSONB NOT NULL,
    "integrationConstraints" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "architectural_profiles_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role_project_contexts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleSpecificGuidance" JSONB NOT NULL,
    "behavioralContext" JSONB NOT NULL,
    "qualityStandards" JSONB NOT NULL,
    "toolingGuidance" JSONB NOT NULL,
    "codePatterns" JSONB NOT NULL,
    "testingApproach" JSONB NOT NULL,
    "documentationStyle" JSONB NOT NULL,
    "reviewCriteria" JSONB NOT NULL,
    "workflowAdaptations" JSONB NOT NULL,
    "priorityAdjustments" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "role_project_contexts_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_patterns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "patternName" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "patternDescription" TEXT NOT NULL,
    "patternImplementation" JSONB NOT NULL,
    "patternExamples" JSONB NOT NULL,
    "applicableScenarios" JSONB NOT NULL,
    "antiPatterns" JSONB NOT NULL,
    "qualityImpact" JSONB NOT NULL,
    "validationRules" JSONB NOT NULL,
    "complianceChecks" JSONB NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.0,
    "usage" TEXT NOT NULL DEFAULT 'recommended',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_patterns_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "onboardingId" INTEGER NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestPrompt" TEXT NOT NULL,
    "requestContext" JSONB NOT NULL,
    "targetFiles" JSONB,
    "analysisScope" TEXT NOT NULL DEFAULT 'project',
    "aiResponse" TEXT,
    "processedInsights" JSONB,
    "confidence" REAL,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "processingTime" INTEGER,
    "errorDetails" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "analysis_requests_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "project_onboarding" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_contexts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectPath" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "complexity" TEXT NOT NULL DEFAULT 'medium',
    "teamSize" TEXT,
    "developmentStage" TEXT,
    "primaryLanguage" TEXT,
    "frameworkStack" JSONB NOT NULL,
    "architecturalStyle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "project_behavioral_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectContextId" INTEGER NOT NULL,
    "roleId" TEXT NOT NULL,
    "approachMethodology" JSONB NOT NULL,
    "qualityStandards" JSONB NOT NULL,
    "toolingPreferences" JSONB NOT NULL,
    "communicationStyle" JSONB NOT NULL,
    "workflowAdaptations" JSONB NOT NULL,
    "priorityMatrix" JSONB NOT NULL,
    "riskConsiderations" JSONB NOT NULL,
    "deliveryExpectations" JSONB NOT NULL,
    "qualityGates" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_behavioral_profiles_projectContextId_fkey" FOREIGN KEY ("projectContextId") REFERENCES "project_contexts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "project_behavioral_profiles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_patterns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectContextId" INTEGER NOT NULL,
    "patternName" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "implementation" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "enforcementLevel" TEXT NOT NULL DEFAULT 'recommended',
    "validationRules" JSONB NOT NULL,
    "antiPatterns" JSONB NOT NULL,
    "applicableRoles" JSONB NOT NULL,
    "applicableScenarios" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_patterns_projectContextId_fkey" FOREIGN KEY ("projectContextId") REFERENCES "project_contexts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" JSONB,
    "coreResponsibilities" JSONB,
    "keyCapabilities" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "stepType" TEXT NOT NULL,
    "approach" TEXT NOT NULL DEFAULT 'Execute step according to guidance',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_steps_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "step_guidance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepByStep" JSONB NOT NULL,
    "stepId" TEXT NOT NULL,
    CONSTRAINT "step_guidance_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterion" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL,
    "stepId" TEXT NOT NULL,
    CONSTRAINT "quality_checks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "step_dependencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dependsOnStep" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "stepId" TEXT NOT NULL,
    CONSTRAINT "step_dependencies_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role_transitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromRoleId" TEXT NOT NULL,
    "toRoleId" TEXT NOT NULL,
    "transitionName" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT 'Role transition',
    "handoffMessage" TEXT NOT NULL DEFAULT 'Transitioning to next role',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "requirements" JSONB,
    "validationCriteria" JSONB,
    "contextElements" JSONB,
    "deliverables" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "role_transitions_fromRoleId_fkey" FOREIGN KEY ("fromRoleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "role_transitions_toRoleId_fkey" FOREIGN KEY ("toRoleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_step_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "taskId" TEXT,
    "roleId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "failedAt" DATETIME,
    "duration" INTEGER,
    "executionData" JSONB,
    "validationResults" JSONB,
    "errorDetails" JSONB,
    "result" TEXT,
    "reportGenerated" BOOLEAN NOT NULL DEFAULT false,
    "reportId" TEXT,
    "reportData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_step_progress_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "workflow_executions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_progress_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflow_step_progress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" INTEGER,
    "currentRoleId" TEXT NOT NULL,
    "currentStepId" TEXT,
    "executionState" JSONB NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "autoCreatedTask" BOOLEAN NOT NULL DEFAULT false,
    "taskCreationData" JSONB,
    "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER,
    "progressPercentage" REAL NOT NULL DEFAULT 0,
    "executionMode" TEXT NOT NULL DEFAULT 'GUIDED',
    "executionContext" JSONB,
    "lastError" JSONB,
    "recoveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "maxRecoveryAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflow_executions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workflow_executions_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflow_executions_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "workflow_steps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "completionDate" DATETIME,
    "owner" TEXT NOT NULL DEFAULT 'boomerang',
    "currentMode" TEXT NOT NULL DEFAULT 'boomerang',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dependencies" JSONB NOT NULL DEFAULT [],
    "redelegationCount" INTEGER NOT NULL DEFAULT 0,
    "gitBranch" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "task_description" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "businessRequirements" TEXT NOT NULL,
    "technicalRequirements" TEXT NOT NULL,
    "acceptanceCriteria" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskDescription_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "batchId" TEXT,
    "batchTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "implementationApproach" TEXT,
    "acceptanceCriteria" JSONB,
    "dependencies" JSONB,
    "completionEvidence" JSONB,
    CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtask_dependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dependentSubtaskId" INTEGER NOT NULL,
    "requiredSubtaskId" INTEGER NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'sequential',
    CONSTRAINT "SubtaskDependency_dependentSubtaskId_fkey" FOREIGN KEY ("dependentSubtaskId") REFERENCES "subtask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubtaskDependency_requiredSubtaskId_fkey" FOREIGN KEY ("requiredSubtaskId") REFERENCES "subtask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delegation_record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "fromMode" TEXT NOT NULL,
    "toMode" TEXT NOT NULL,
    "delegationTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    CONSTRAINT "DelegationRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "references" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "code_review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "issues" TEXT NOT NULL,
    "acceptanceCriteriaVerification" JSONB NOT NULL,
    "manualTestingResults" TEXT NOT NULL,
    "requiredChanges" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CodeReview_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "completion_report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "filesModified" JSONB NOT NULL,
    "delegationSummary" TEXT NOT NULL,
    "acceptanceCriteriaVerification" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompletionReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_transition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "fromMode" TEXT NOT NULL,
    "toMode" TEXT NOT NULL,
    "transitionTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowTransition_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "codebase_analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "architectureFindings" JSONB NOT NULL,
    "problemsIdentified" JSONB NOT NULL,
    "implementationContext" JSONB NOT NULL,
    "qualityAssessment" JSONB NOT NULL,
    "filesCovered" JSONB NOT NULL,
    "technologyStack" JSONB NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "analyzedBy" TEXT NOT NULL,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    CONSTRAINT "CodebaseAnalysis_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "project_onboarding_projectPath_key" ON "project_onboarding"("projectPath");

-- CreateIndex
CREATE INDEX "project_onboarding_projectPath_idx" ON "project_onboarding"("projectPath");

-- CreateIndex
CREATE INDEX "project_onboarding_onboardingStatus_idx" ON "project_onboarding"("onboardingStatus");

-- CreateIndex
CREATE INDEX "project_onboarding_projectType_idx" ON "project_onboarding"("projectType");

-- CreateIndex
CREATE INDEX "project_analysis_results_onboardingId_idx" ON "project_analysis_results"("onboardingId");

-- CreateIndex
CREATE INDEX "project_analysis_results_analysisType_idx" ON "project_analysis_results"("analysisType");

-- CreateIndex
CREATE INDEX "codebase_insights_onboardingId_idx" ON "codebase_insights"("onboardingId");

-- CreateIndex
CREATE INDEX "architectural_profiles_onboardingId_idx" ON "architectural_profiles"("onboardingId");

-- CreateIndex
CREATE INDEX "role_project_contexts_onboardingId_idx" ON "role_project_contexts"("onboardingId");

-- CreateIndex
CREATE INDEX "role_project_contexts_roleName_idx" ON "role_project_contexts"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "role_project_contexts_onboardingId_roleName_key" ON "role_project_contexts"("onboardingId", "roleName");

-- CreateIndex
CREATE INDEX "generated_patterns_onboardingId_idx" ON "generated_patterns"("onboardingId");

-- CreateIndex
CREATE INDEX "generated_patterns_patternType_idx" ON "generated_patterns"("patternType");

-- CreateIndex
CREATE INDEX "generated_patterns_usage_idx" ON "generated_patterns"("usage");

-- CreateIndex
CREATE INDEX "analysis_requests_onboardingId_idx" ON "analysis_requests"("onboardingId");

-- CreateIndex
CREATE INDEX "analysis_requests_requestType_idx" ON "analysis_requests"("requestType");

-- CreateIndex
CREATE INDEX "analysis_requests_processingStatus_idx" ON "analysis_requests"("processingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "project_contexts_projectPath_key" ON "project_contexts"("projectPath");

-- CreateIndex
CREATE INDEX "project_contexts_projectType_idx" ON "project_contexts"("projectType");

-- CreateIndex
CREATE INDEX "project_contexts_complexity_idx" ON "project_contexts"("complexity");

-- CreateIndex
CREATE INDEX "project_behavioral_profiles_projectContextId_idx" ON "project_behavioral_profiles"("projectContextId");

-- CreateIndex
CREATE INDEX "project_behavioral_profiles_roleId_idx" ON "project_behavioral_profiles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "project_behavioral_profiles_projectContextId_roleId_key" ON "project_behavioral_profiles"("projectContextId", "roleId");

-- CreateIndex
CREATE INDEX "project_patterns_projectContextId_idx" ON "project_patterns"("projectContextId");

-- CreateIndex
CREATE INDEX "project_patterns_patternType_idx" ON "project_patterns"("patternType");

-- CreateIndex
CREATE INDEX "project_patterns_enforcementLevel_idx" ON "project_patterns"("enforcementLevel");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_roles_name_key" ON "workflow_roles"("name");

-- CreateIndex
CREATE INDEX "workflow_roles_name_idx" ON "workflow_roles"("name");

-- CreateIndex
CREATE INDEX "workflow_roles_priority_idx" ON "workflow_roles"("priority");

-- CreateIndex
CREATE INDEX "workflow_steps_roleId_sequenceNumber_idx" ON "workflow_steps"("roleId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "workflow_steps_stepType_idx" ON "workflow_steps"("stepType");

-- CreateIndex
CREATE UNIQUE INDEX "step_guidance_stepId_key" ON "step_guidance"("stepId");

-- CreateIndex
CREATE INDEX "quality_checks_stepId_sequenceOrder_idx" ON "quality_checks"("stepId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "step_dependencies_stepId_idx" ON "step_dependencies"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "role_transitions_transitionName_key" ON "role_transitions"("transitionName");

-- CreateIndex
CREATE INDEX "role_transitions_fromRoleId_idx" ON "role_transitions"("fromRoleId");

-- CreateIndex
CREATE INDEX "role_transitions_toRoleId_idx" ON "role_transitions"("toRoleId");

-- CreateIndex
CREATE INDEX "workflow_step_progress_executionId_idx" ON "workflow_step_progress"("executionId");

-- CreateIndex
CREATE INDEX "workflow_step_progress_taskId_idx" ON "workflow_step_progress"("taskId");

-- CreateIndex
CREATE INDEX "workflow_step_progress_roleId_idx" ON "workflow_step_progress"("roleId");

-- CreateIndex
CREATE INDEX "workflow_step_progress_stepId_idx" ON "workflow_step_progress"("stepId");

-- CreateIndex
CREATE INDEX "workflow_step_progress_status_idx" ON "workflow_step_progress"("status");

-- CreateIndex
CREATE INDEX "workflow_step_progress_reportGenerated_idx" ON "workflow_step_progress"("reportGenerated");

-- CreateIndex
CREATE INDEX "workflow_executions_taskId_idx" ON "workflow_executions"("taskId");

-- CreateIndex
CREATE INDEX "workflow_executions_currentRoleId_idx" ON "workflow_executions"("currentRoleId");

-- CreateIndex
CREATE INDEX "workflow_executions_currentStepId_idx" ON "workflow_executions"("currentStepId");

-- CreateIndex
CREATE INDEX "workflow_executions_progressPercentage_idx" ON "workflow_executions"("progressPercentage");

-- CreateIndex
CREATE UNIQUE INDEX "Task_slug_key" ON "task"("slug");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "task"("status");

-- CreateIndex
CREATE INDEX "Task_owner_idx" ON "task"("owner");

-- CreateIndex
CREATE INDEX "Task_currentMode_idx" ON "task"("currentMode");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "task"("priority");

-- CreateIndex
CREATE INDEX "Task_slug_idx" ON "task"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDescription_taskId_key" ON "task_description"("taskId");

-- CreateIndex
CREATE INDEX "Subtask_taskId_idx" ON "subtask"("taskId");

-- CreateIndex
CREATE INDEX "Subtask_status_idx" ON "subtask"("status");

-- CreateIndex
CREATE INDEX "Subtask_batchId_idx" ON "subtask"("batchId");

-- CreateIndex
CREATE INDEX "Subtask_sequenceNumber_idx" ON "subtask"("sequenceNumber");

-- CreateIndex
CREATE INDEX "SubtaskDependency_dependentSubtaskId_idx" ON "subtask_dependency"("dependentSubtaskId");

-- CreateIndex
CREATE INDEX "SubtaskDependency_requiredSubtaskId_idx" ON "subtask_dependency"("requiredSubtaskId");

-- CreateIndex
CREATE UNIQUE INDEX "SubtaskDependency_dependentSubtaskId_requiredSubtaskId_key" ON "subtask_dependency"("dependentSubtaskId", "requiredSubtaskId");

-- CreateIndex
CREATE INDEX "DelegationRecord_taskId_idx" ON "delegation_record"("taskId");

-- CreateIndex
CREATE INDEX "DelegationRecord_fromMode_idx" ON "delegation_record"("fromMode");

-- CreateIndex
CREATE INDEX "DelegationRecord_toMode_idx" ON "delegation_record"("toMode");

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseAnalysis_taskId_key" ON "codebase_analysis"("taskId");

-- CreateIndex
CREATE INDEX "CodebaseAnalysis_taskId_idx" ON "codebase_analysis"("taskId");

-- CreateIndex
CREATE INDEX "CodebaseAnalysis_analyzedBy_idx" ON "codebase_analysis"("analyzedBy");
