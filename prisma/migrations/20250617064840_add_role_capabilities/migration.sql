-- AlterTable
ALTER TABLE "workflow_roles" ADD COLUMN "capabilities" JSONB;
ALTER TABLE "workflow_roles" ADD COLUMN "coreResponsibilities" JSONB;
ALTER TABLE "workflow_roles" ADD COLUMN "keyCapabilities" JSONB;
