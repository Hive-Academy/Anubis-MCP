/*
  Warnings:

  - You are about to drop the `subtask_dependencies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subtask_dependencies";
PRAGMA foreign_keys=on;

-- RedefineIndex
DROP INDEX "CodebaseAnalysis_analyzedBy_idx";
CREATE INDEX "codebase_analysis_analyzedBy_idx" ON "codebase_analysis"("analyzedBy");

-- RedefineIndex
DROP INDEX "CodebaseAnalysis_taskId_idx";
CREATE INDEX "codebase_analysis_taskId_idx" ON "codebase_analysis"("taskId");

-- RedefineIndex
DROP INDEX "CodebaseAnalysis_taskId_key";
CREATE UNIQUE INDEX "codebase_analysis_taskId_key" ON "codebase_analysis"("taskId");

-- RedefineIndex
DROP INDEX "DelegationRecord_toMode_idx";
CREATE INDEX "delegation_records_toMode_idx" ON "delegation_records"("toMode");

-- RedefineIndex
DROP INDEX "DelegationRecord_fromMode_idx";
CREATE INDEX "delegation_records_fromMode_idx" ON "delegation_records"("fromMode");

-- RedefineIndex
DROP INDEX "DelegationRecord_taskId_idx";
CREATE INDEX "delegation_records_taskId_idx" ON "delegation_records"("taskId");

-- RedefineIndex
DROP INDEX "Subtask_sequenceNumber_idx";
CREATE INDEX "subtasks_sequenceNumber_idx" ON "subtasks"("sequenceNumber");

-- RedefineIndex
DROP INDEX "Subtask_batchId_idx";
CREATE INDEX "subtasks_batchId_idx" ON "subtasks"("batchId");

-- RedefineIndex
DROP INDEX "Subtask_status_idx";
CREATE INDEX "subtasks_status_idx" ON "subtasks"("status");

-- RedefineIndex
DROP INDEX "Subtask_taskId_idx";
CREATE INDEX "subtasks_taskId_idx" ON "subtasks"("taskId");

-- RedefineIndex
DROP INDEX "TaskDescription_taskId_key";
CREATE UNIQUE INDEX "task_descriptions_taskId_key" ON "task_descriptions"("taskId");

-- RedefineIndex
DROP INDEX "Task_slug_idx";
CREATE INDEX "tasks_slug_idx" ON "tasks"("slug");

-- RedefineIndex
DROP INDEX "Task_priority_idx";
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");

-- RedefineIndex
DROP INDEX "Task_currentMode_idx";
CREATE INDEX "tasks_currentMode_idx" ON "tasks"("currentMode");

-- RedefineIndex
DROP INDEX "Task_owner_idx";
CREATE INDEX "tasks_owner_idx" ON "tasks"("owner");

-- RedefineIndex
DROP INDEX "Task_status_idx";
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- RedefineIndex
DROP INDEX "Task_slug_key";
CREATE UNIQUE INDEX "tasks_slug_key" ON "tasks"("slug");
