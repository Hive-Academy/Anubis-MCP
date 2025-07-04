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

    // 5. Delete streamlined workflow rules system (NEW STRUCTURE)
    console.log('⚙️ Deleting streamlined workflow rules...');

    // Delete structured transition data
    await prisma.transitionDeliverable.deleteMany();
    await prisma.transitionContext.deleteMany();
    await prisma.transitionValidation.deleteMany();
    await prisma.transitionRequirement.deleteMany();
    await prisma.transitionCondition.deleteMany();

    // Delete structured step data
    await prisma.stepDependency.deleteMany();
    await prisma.mcpAction.deleteMany();
    await prisma.qualityCheck.deleteMany();
    await prisma.stepGuidance.deleteMany();

    // Delete main workflow entities
    await prisma.workflowStep.deleteMany();
    await prisma.roleTransition.deleteMany();
    await prisma.workflowRole.deleteMany();

    console.log('✅ COMPLETE DATABASE RESET SUCCESSFUL!');
    console.log('🎉 Database is now completely clean and ready for fresh data');

    // Verify the reset
    const counts = await Promise.all([
      prisma.workflowRole.count(),
      prisma.workflowStep.count(),
      prisma.stepGuidance.count(),
      prisma.qualityCheck.count(),
      prisma.mcpAction.count(),
      prisma.stepDependency.count(),
      prisma.roleTransition.count(),
      prisma.transitionCondition.count(),
      prisma.task.count(),
      prisma.projectOnboarding.count(),
    ]);

    console.log('📊 Verification - Record counts after reset:');
    console.log(`   - Workflow Roles: ${counts[0]}`);
    console.log(`   - Workflow Steps: ${counts[1]}`);
    console.log(`   - Step Guidance: ${counts[2]}`);
    console.log(`   - Quality Checks: ${counts[3]}`);
    console.log(`   - MCP Actions: ${counts[4]}`);
    console.log(`   - Step Dependencies: ${counts[5]}`);
    console.log(`   - Role Transitions: ${counts[6]}`);
    console.log(`   - Transition Conditions: ${counts[7]}`);
    console.log(`   - Tasks: ${counts[8]}`);
    console.log(`   - Project Onboarding: ${counts[9]}`);

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
