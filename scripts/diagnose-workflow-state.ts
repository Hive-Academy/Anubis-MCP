#!/usr/bin/env tsx

/**
 * Workflow State Diagnostic Script
 *
 * This script exports all task and execution data to JSON files
 * to diagnose workflow state synchronization issues.
 */

import { PrismaClient } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DiagnosticData {
  timestamp: string;
  taskId: number;
  taskData: any;
  executionData: any;
  stepProgressData: any;
  roleTransitionData: any;
  implementationPlanData: any;
  subtaskData: any;
  batchData: any;
  inconsistencies: string[];
}

async function main() {
  const taskId = 5; // Our current task
  const timestamp = new Date().toISOString();

  console.log('🔍 Starting Workflow State Diagnostic...');
  console.log(`📊 Analyzing Task ID: ${taskId}`);

  try {
    // 1. Get Task Data with all relations
    console.log('📋 Fetching task data...');
    const taskData = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subtasks: {
          include: {
            implementationPlan: true,
            dependencies_from: true,
            dependencies_to: true,
            comments: true,
          },
        },
        delegationRecords: true,
        codebaseAnalysis: true,
        implementationPlans: {
          include: {
            subtasks: true,
          },
        },
        workflowExecutions: {
          include: {
            currentRole: true,
            currentStep: true,
          },
        },
        taskDescription: true,
        researchReports: true,
        codeReviews: true,
        completionReports: true,
        comments: true,
        workflowTransitions: true,
      },
    });

    // 2. Get Step Progress Data
    console.log('📈 Fetching step progress data...');
    const stepProgressData = await prisma.workflowStepProgress.findMany({
      where: { taskId: taskId.toString() },
      include: {
        step: true,
        role: true,
      },
      orderBy: { completedAt: 'asc' },
    });

    // 3. Get Role Transition Data
    console.log('🔄 Fetching role transition data...');
    const roleTransitionData = await prisma.roleTransition.findMany({
      include: {
        fromRole: true,
        toRole: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Get Workflow Execution Data (separate query for detailed analysis)
    console.log('⚙️ Fetching workflow execution data...');
    const executionData = await prisma.workflowExecution.findMany({
      where: { taskId: taskId },
      include: {
        task: true,
        currentRole: true,
        currentStep: true,
      },
    });

    // 5. Get Implementation Plan Data
    console.log('📋 Fetching implementation plan data...');
    const implementationPlanData = await prisma.implementationPlan.findMany({
      where: { taskId: taskId },
      include: {
        subtasks: true,
      },
    });

    // 6. Get Subtask Data
    console.log('📝 Fetching subtask data...');
    const subtaskData = await prisma.subtask.findMany({
      where: { taskId: taskId },
      include: {
        implementationPlan: true,
        dependencies_from: true,
        dependencies_to: true,
        comments: true,
      },
    });

    // 7. Get Batch Data (removed - not in schema)
    console.log('📦 Skipping batch data - not in current schema...');
    const batchData: any[] = [];

    // 8. Analyze Inconsistencies
    console.log('🔍 Analyzing inconsistencies...');
    const inconsistencies: string[] = [];

    // Check task vs execution status
    if (taskData?.status !== executionData[0]?.task?.status) {
      inconsistencies.push(
        `Task status (${taskData?.status}) != Execution task status (${executionData[0]?.task?.status})`,
      );
    }

    // Check step progress vs current step
    const completedSteps = stepProgressData.length;
    const currentStepId = executionData[0]?.currentStepId;
    if (completedSteps > 0 && currentStepId === stepProgressData[0]?.stepId) {
      inconsistencies.push(
        `Current step ID still points to first step despite ${completedSteps} completed steps`,
      );
    }

    // Check role transitions vs current role
    const lastTransition = roleTransitionData[roleTransitionData.length - 1];
    const currentRoleId = executionData[0]?.currentRoleId;
    if (lastTransition && lastTransition.toRoleId !== currentRoleId) {
      inconsistencies.push(
        `Last transition to role ${lastTransition.toRoleId} != Current role ${currentRoleId}`,
      );
    }

    // Check progress percentage vs completed steps
    const progressPercentage = executionData[0]?.progressPercentage || 0;
    const expectedProgress = Math.round((completedSteps / 10) * 100); // Assuming ~10 total steps
    if (Math.abs(progressPercentage - expectedProgress) > 20) {
      inconsistencies.push(
        `Progress percentage (${progressPercentage}%) doesn't match completed steps (${completedSteps})`,
      );
    }

    // 9. Compile Diagnostic Data
    const diagnosticData: DiagnosticData = {
      timestamp,
      taskId,
      taskData,
      executionData,
      stepProgressData,
      roleTransitionData,
      implementationPlanData,
      subtaskData,
      batchData,
      inconsistencies,
    };

    // 10. Create output directory
    const outputDir = path.join(process.cwd(), 'workflow-diagnostics');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 11. Save diagnostic data to files
    const baseFilename = `task-${taskId}-diagnostic-${Date.now()}`;

    // Save complete diagnostic data
    const diagnosticFile = path.join(
      outputDir,
      `${baseFilename}-complete.json`,
    );
    fs.writeFileSync(diagnosticFile, JSON.stringify(diagnosticData, null, 2));

    // Save individual data files for easier analysis
    const taskFile = path.join(outputDir, `${baseFilename}-task.json`);
    fs.writeFileSync(taskFile, JSON.stringify(taskData, null, 2));

    const executionFile = path.join(
      outputDir,
      `${baseFilename}-execution.json`,
    );
    fs.writeFileSync(executionFile, JSON.stringify(executionData, null, 2));

    const stepProgressFile = path.join(
      outputDir,
      `${baseFilename}-step-progress.json`,
    );
    fs.writeFileSync(
      stepProgressFile,
      JSON.stringify(stepProgressData, null, 2),
    );

    const inconsistenciesFile = path.join(
      outputDir,
      `${baseFilename}-inconsistencies.json`,
    );
    fs.writeFileSync(
      inconsistenciesFile,
      JSON.stringify(
        {
          timestamp,
          taskId,
          inconsistencies,
          summary: {
            totalInconsistencies: inconsistencies.length,
            completedSteps: completedSteps,
            currentStepId: currentStepId,
            currentRoleId: currentRoleId,
            lastTransitionToRole: lastTransition?.toRoleId,
            progressPercentage: progressPercentage,
          },
        },
        null,
        2,
      ),
    );

    // 12. Generate Summary Report
    console.log('\n🎯 DIAGNOSTIC SUMMARY:');
    console.log('='.repeat(50));
    console.log(`📊 Task ID: ${taskId}`);
    console.log(`📋 Task Status: ${taskData?.status}`);
    console.log(
      `⚙️ Execution Progress: ${executionData[0]?.progressPercentage}%`,
    );
    console.log(`📈 Completed Steps: ${completedSteps}`);
    console.log(`🔄 Role Transitions: ${roleTransitionData.length}`);
    console.log(`📦 Implementation Plans: ${implementationPlanData.length}`);
    console.log(`📝 Subtasks: ${subtaskData.length}`);
    console.log(`🚨 Inconsistencies Found: ${inconsistencies.length}`);

    if (inconsistencies.length > 0) {
      console.log('\n🚨 INCONSISTENCIES:');
      inconsistencies.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    console.log('\n📁 FILES GENERATED:');
    console.log(`📊 Complete Diagnostic: ${diagnosticFile}`);
    console.log(`📋 Task Data: ${taskFile}`);
    console.log(`⚙️ Execution Data: ${executionFile}`);
    console.log(`📈 Step Progress: ${stepProgressFile}`);
    console.log(`🚨 Inconsistencies: ${inconsistenciesFile}`);

    console.log(
      '\n✅ Diagnostic complete! Review the JSON files to identify database sync issues.',
    );
  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Diagnostic failed:', e);
  process.exit(1);
});
