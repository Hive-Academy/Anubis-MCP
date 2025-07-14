
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
    CONSTRAINT "workflow_executions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workflow_executions_currentRoleId_fkey" FOREIGN KEY ("currentRoleId") REFERENCES "workflow_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workflow_executions_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "workflow_steps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
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
CREATE TABLE "task_descriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "businessRequirements" TEXT NOT NULL,
    "technicalRequirements" TEXT NOT NULL,
    "acceptanceCriteria" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskDescription_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtasks" (
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
    CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtask_dependencies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dependentSubtaskId" INTEGER NOT NULL,
    "requiredSubtaskId" INTEGER NOT NULL,
    "dependencyType" TEXT NOT NULL DEFAULT 'sequential',
    CONSTRAINT "SubtaskDependency_dependentSubtaskId_fkey" FOREIGN KEY ("dependentSubtaskId") REFERENCES "subtasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubtaskDependency_requiredSubtaskId_fkey" FOREIGN KEY ("requiredSubtaskId") REFERENCES "subtasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delegation_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "fromMode" TEXT NOT NULL,
    "toMode" TEXT NOT NULL,
    "delegationTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    CONSTRAINT "DelegationRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "research_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "references" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "code_reviews" (
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
    CONSTRAINT "CodeReview_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "completion_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "filesModified" JSONB NOT NULL,
    "delegationSummary" TEXT NOT NULL,
    "acceptanceCriteriaVerification" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompletionReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "CodebaseAnalysis_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);


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
CREATE UNIQUE INDEX "Task_slug_key" ON "tasks"("slug");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "Task_owner_idx" ON "tasks"("owner");

-- CreateIndex
CREATE INDEX "Task_currentMode_idx" ON "tasks"("currentMode");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "tasks"("priority");

-- CreateIndex
CREATE INDEX "Task_slug_idx" ON "tasks"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDescription_taskId_key" ON "task_descriptions"("taskId");

-- CreateIndex
CREATE INDEX "Subtask_taskId_idx" ON "subtasks"("taskId");

-- CreateIndex
CREATE INDEX "Subtask_status_idx" ON "subtasks"("status");

-- CreateIndex
CREATE INDEX "Subtask_batchId_idx" ON "subtasks"("batchId");

-- CreateIndex
CREATE INDEX "Subtask_sequenceNumber_idx" ON "subtasks"("sequenceNumber");

-- CreateIndex
CREATE INDEX "SubtaskDependency_dependentSubtaskId_idx" ON "subtask_dependencies"("dependentSubtaskId");

-- CreateIndex
CREATE INDEX "SubtaskDependency_requiredSubtaskId_idx" ON "subtask_dependencies"("requiredSubtaskId");

-- CreateIndex
CREATE UNIQUE INDEX "SubtaskDependency_dependentSubtaskId_requiredSubtaskId_key" ON "subtask_dependencies"("dependentSubtaskId", "requiredSubtaskId");

-- CreateIndex
CREATE INDEX "DelegationRecord_taskId_idx" ON "delegation_records"("taskId");

-- CreateIndex
CREATE INDEX "DelegationRecord_fromMode_idx" ON "delegation_records"("fromMode");

-- CreateIndex
CREATE INDEX "DelegationRecord_toMode_idx" ON "delegation_records"("toMode");

-- CreateIndex
CREATE UNIQUE INDEX "CodebaseAnalysis_taskId_key" ON "codebase_analysis"("taskId");

-- CreateIndex
CREATE INDEX "CodebaseAnalysis_taskId_idx" ON "codebase_analysis"("taskId");

-- CreateIndex
CREATE INDEX "CodebaseAnalysis_analyzedBy_idx" ON "codebase_analysis"("analyzedBy");
