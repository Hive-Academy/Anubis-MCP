#!/usr/bin/env tsx

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function completelyResetDatabase() {
  console.log('🗑️  COMPLETE DATABASE RESET - Deleting ALL data...');
  console.log('⚠️  This will delete EVERYTHING in the database!');

  try {
    // Delete in correct order to handle foreign key constraints

    // 1. Delete all workflow execution and progress tracking
    console.log('🔄 Deleting workflow execution data...');
    await prisma.workflowStepProgress.deleteMany();
    await prisma.workflowExecution.deleteMany();

    // 2. Delete all project onboarding and analysis data
    console.log('📊 Deleting project analysis data...');
    await prisma.analysisRequest.deleteMany();
    await prisma.projectAnalysisResult.deleteMany();
    await prisma.codebaseInsights.deleteMany();
    await prisma.architecturalProfile.deleteMany();
    await prisma.roleProjectContext.deleteMany();
    await prisma.generatedPattern.deleteMany();
    await prisma.projectOnboarding.deleteMany();

    // 3. Delete project behavioral profiles
    console.log('🎭 Deleting behavioral profiles...');
    await prisma.projectBehavioralProfile.deleteMany();
    await prisma.projectPattern.deleteMany();
    await prisma.projectContext.deleteMany();

    // 4. Delete all task-related data
    console.log('📋 Deleting task management data...');
    await prisma.comment.deleteMany();
    await prisma.workflowTransition.deleteMany();
    await prisma.completionReport.deleteMany();
    await prisma.codeReview.deleteMany();
    await prisma.researchReport.deleteMany();
    await prisma.delegationRecord.deleteMany();
    await prisma.subtaskDependency.deleteMany();
    await prisma.subtask.deleteMany();
    await prisma.codebaseAnalysis.deleteMany();
    await prisma.implementationPlan.deleteMany();
    await prisma.taskDescription.deleteMany();
    await prisma.task.deleteMany();

    // 5. Delete workflow rules system
    console.log('⚙️ Deleting workflow rules...');
    await prisma.ruleVersion.deleteMany();
    await prisma.stepAction.deleteMany();
    await prisma.stepCondition.deleteMany();
    await prisma.workflowStep.deleteMany();
    await prisma.roleTransition.deleteMany();
    await prisma.workflowRole.deleteMany();

    console.log('✅ COMPLETE DATABASE RESET SUCCESSFUL!');
    console.log('🎉 Database is now completely clean and ready for fresh data');

    // Verify the reset
    const counts = await Promise.all([
      prisma.workflowRole.count(),
      prisma.workflowStep.count(),
      prisma.task.count(),
      prisma.projectOnboarding.count(),
    ]);

    console.log('📊 Verification - Record counts after reset:');
    console.log(`   - Workflow Roles: ${counts[0]}`);
    console.log(`   - Workflow Steps: ${counts[1]}`);
    console.log(`   - Tasks: ${counts[2]}`);
    console.log(`   - Project Onboarding: ${counts[3]}`);

    if (counts.every((count) => count === 0)) {
      console.log('✅ Database is completely clean!');
    } else {
      console.log('⚠️  Some records may still exist');
    }
  } catch (error) {
    console.error('❌ Error during complete database reset:', error);
    throw error;
  }
}

async function main() {
  try {
    await completelyResetDatabase();
  } catch (error) {
    console.error('💥 Complete database reset failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
