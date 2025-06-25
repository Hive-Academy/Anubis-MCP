-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subtask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "planId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not-started',
    "assignedTo" TEXT,
    "estimatedDuration" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "batchId" TEXT,
    "batchTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "implementationOverview" TEXT,
    "implementationApproach" TEXT,
    "technicalDecisions" JSONB,
    "filesToModify" JSONB,
    "codeExamples" JSONB,
    "strategicGuidance" JSONB,
    "architecturalContext" TEXT,
    "architecturalRationale" JSONB,
    "qualityConstraints" JSONB,
    "qualityGates" JSONB,
    "acceptanceCriteria" JSONB,
    "successCriteria" JSONB,
    "testingRequirements" JSONB,
    "technicalSpecifications" JSONB,
    "performanceTargets" JSONB,
    "securityConsiderations" JSONB,
    "errorHandlingStrategy" TEXT,
    "dependencies" JSONB,
    "integrationPoints" JSONB,
    "externalDependencies" JSONB,
    "completionEvidence" JSONB,
    "validationSteps" JSONB,
    "actualDuration" TEXT,
    CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subtask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ImplementationPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subtask" ("acceptanceCriteria", "actualDuration", "architecturalRationale", "assignedTo", "batchId", "batchTitle", "completedAt", "completionEvidence", "createdAt", "dependencies", "description", "estimatedDuration", "id", "name", "planId", "qualityConstraints", "sequenceNumber", "startedAt", "status", "strategicGuidance", "successCriteria", "taskId", "technicalSpecifications", "updatedAt") SELECT "acceptanceCriteria", "actualDuration", "architecturalRationale", "assignedTo", "batchId", "batchTitle", "completedAt", "completionEvidence", "createdAt", "dependencies", "description", "estimatedDuration", "id", "name", "planId", "qualityConstraints", "sequenceNumber", "startedAt", "status", "strategicGuidance", "successCriteria", "taskId", "technicalSpecifications", "updatedAt" FROM "Subtask";
DROP TABLE "Subtask";
ALTER TABLE "new_Subtask" RENAME TO "Subtask";
CREATE INDEX "Subtask_taskId_idx" ON "Subtask"("taskId");
CREATE INDEX "Subtask_planId_idx" ON "Subtask"("planId");
CREATE INDEX "Subtask_status_idx" ON "Subtask"("status");
CREATE INDEX "Subtask_batchId_idx" ON "Subtask"("batchId");
CREATE INDEX "Subtask_sequenceNumber_idx" ON "Subtask"("sequenceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
