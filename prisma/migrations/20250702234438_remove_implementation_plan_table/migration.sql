/*
  Warnings:

  - You are about to drop the `ImplementationPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "ImplementationPlan_createdBy_idx";

-- DropIndex
DROP INDEX "ImplementationPlan_taskId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ImplementationPlan";
PRAGMA foreign_keys=on;

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
    CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subtask" ("acceptanceCriteria", "actualDuration", "architecturalContext", "architecturalRationale", "assignedTo", "batchId", "batchTitle", "codeExamples", "completedAt", "completionEvidence", "createdAt", "dependencies", "description", "errorHandlingStrategy", "estimatedDuration", "externalDependencies", "filesToModify", "id", "implementationApproach", "implementationOverview", "integrationPoints", "name", "performanceTargets", "planId", "qualityConstraints", "qualityGates", "securityConsiderations", "sequenceNumber", "startedAt", "status", "strategicGuidance", "successCriteria", "taskId", "technicalDecisions", "technicalSpecifications", "testingRequirements", "updatedAt", "validationSteps") SELECT "acceptanceCriteria", "actualDuration", "architecturalContext", "architecturalRationale", "assignedTo", "batchId", "batchTitle", "codeExamples", "completedAt", "completionEvidence", "createdAt", "dependencies", "description", "errorHandlingStrategy", "estimatedDuration", "externalDependencies", "filesToModify", "id", "implementationApproach", "implementationOverview", "integrationPoints", "name", "performanceTargets", "planId", "qualityConstraints", "qualityGates", "securityConsiderations", "sequenceNumber", "startedAt", "status", "strategicGuidance", "successCriteria", "taskId", "technicalDecisions", "technicalSpecifications", "testingRequirements", "updatedAt", "validationSteps" FROM "Subtask";
DROP TABLE "Subtask";
ALTER TABLE "new_Subtask" RENAME TO "Subtask";
CREATE INDEX "Subtask_taskId_idx" ON "Subtask"("taskId");
CREATE INDEX "Subtask_planId_idx" ON "Subtask"("planId");
CREATE INDEX "Subtask_status_idx" ON "Subtask"("status");
CREATE INDEX "Subtask_batchId_idx" ON "Subtask"("batchId");
CREATE INDEX "Subtask_sequenceNumber_idx" ON "Subtask"("sequenceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
