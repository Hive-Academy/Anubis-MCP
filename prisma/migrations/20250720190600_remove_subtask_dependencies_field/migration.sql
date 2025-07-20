/*
  Warnings:

  - You are about to drop the column `dependencies` on the `subtasks` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_subtasks" (
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
    "completionEvidence" JSONB,
    CONSTRAINT "subtasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_subtasks" ("acceptanceCriteria", "batchId", "batchTitle", "completionEvidence", "createdAt", "description", "id", "implementationApproach", "name", "sequenceNumber", "status", "taskId", "updatedAt") SELECT "acceptanceCriteria", "batchId", "batchTitle", "completionEvidence", "createdAt", "description", "id", "implementationApproach", "name", "sequenceNumber", "status", "taskId", "updatedAt" FROM "subtasks";
DROP TABLE "subtasks";
ALTER TABLE "new_subtasks" RENAME TO "subtasks";
CREATE INDEX "subtasks_taskId_idx" ON "subtasks"("taskId");
CREATE INDEX "subtasks_status_idx" ON "subtasks"("status");
CREATE INDEX "subtasks_batchId_idx" ON "subtasks"("batchId");
CREATE INDEX "subtasks_sequenceNumber_idx" ON "subtasks"("sequenceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
