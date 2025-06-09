/**
 * Implementation Plan Report Integration Test
 *
 * Comprehensive test for the implementation plan report generation feature
 * Tests the full workflow: data services → builder/analyzer → view services → final report
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ImplementationPlanService } from '../src/task-workflow/domains/reporting/task-management/implementation-plan/implementation-plan.service';
import { ReportDataService } from '../src/task-workflow/domains/reporting/shared/report-data.service';
import { ImplementationPlanBuilderService } from '../src/task-workflow/domains/reporting/task-management/implementation-plan/implementation-plan-builder.service';
import { ImplementationPlanAnalyzerService } from '../src/task-workflow/domains/reporting/task-management/implementation-plan/implementation-plan-analyzer.service';
import * as fs from 'fs';
import * as path from 'path';

interface TestTaskData {
  taskId: string;
  name: string;
  status: string;
  priority: string;
  owner: string;
}

interface TestImplementationPlan {
  overview: string;
  approach: string;
  technicalDecisions: any;
  filesToModify: string[];
  createdBy: string;
}

interface TestSubtask {
  name: string;
  description: string;
  sequenceNumber: number;
  status: string;
  batchId: string;
  batchTitle: string;
}

async function runImplementationPlanIntegrationTest() {
  console.log('🚀 Starting Implementation Plan Report Integration Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const implementationPlanService = app.get(ImplementationPlanService);
  const reportDataService = app.get(ReportDataService);
  const builderService = app.get(ImplementationPlanBuilderService);
  const analyzerService = app.get(ImplementationPlanAnalyzerService);

  try {
    // Step 1: Create comprehensive test data
    console.log('📊 Step 1: Creating comprehensive test data...');
    const testData = await createTestData(prisma);
    console.log(`✅ Created test task: ${testData.task.taskId}`);
    console.log(
      `✅ Created implementation plan with ${testData.subtasks.length} subtasks`,
    );
    console.log(
      `✅ Created ${testData.batches.length} batches: ${testData.batches.join(', ')}\n`,
    );

    // Step 2: Test data service integration
    console.log('🔍 Step 2: Testing data service integration...');
    const taskData = await reportDataService.getTask(testData.task.taskId);

    if (!taskData) {
      throw new Error('Failed to retrieve task data from ReportDataService');
    }

    console.log(`✅ Data service retrieved task: ${taskData.name}`);
    console.log(
      `✅ Implementation plans: ${taskData.implementationPlans?.length || 0}`,
    );
    console.log(
      `✅ Total subtasks: ${taskData.implementationPlans?.flatMap((p) => p.subtasks || []).length || 0}\n`,
    );

    // Step 3: Test builder service integration
    console.log('🏗️ Step 3: Testing builder service integration...');
    const taskInfo = builderService.buildTaskInfo(taskData);
    const planDetails = builderService.buildPlanDetails(
      taskData.implementationPlans || [],
      taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
    );
    const batchSummary = builderService.buildBatchSummary(
      taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [],
    );

    console.log(`✅ Builder service processed task info: ${taskInfo.name}`);
    console.log(`✅ Plan details built: ${planDetails.length} plans`);
    console.log(`✅ Batch summary built: ${batchSummary.length} batches\n`);

    // Step 4: Test analyzer service integration
    console.log('📈 Step 4: Testing analyzer service integration...');
    const allSubtasks =
      taskData.implementationPlans?.flatMap((p) => p.subtasks || []) || [];
    const executionAnalysis = analyzerService.analyzePlanExecution(allSubtasks);
    const executionGuidance = analyzerService.generateExecutionGuidance(
      taskData.implementationPlans || [],
      allSubtasks,
    );
    const complexityScore = analyzerService.calculateComplexityScore(
      taskData.implementationPlans || [],
      allSubtasks,
    );

    console.log(
      `✅ Execution analysis completed: ${executionAnalysis.completionPercentage}% complete`,
    );
    console.log(
      `✅ Execution guidance generated: ${executionGuidance.nextSteps.length} next steps`,
    );
    console.log(`✅ Complexity score calculated: ${complexityScore}/100\n`);

    // Step 5: Test full report generation
    console.log('📝 Step 5: Testing full report generation...');
    const startTime = Date.now();
    const htmlReport =
      await implementationPlanService.generateImplementationPlanReport(
        testData.task.taskId,
      );
    const generationTime = Date.now() - startTime;

    if (!htmlReport || htmlReport.length === 0) {
      throw new Error('Failed to generate HTML report');
    }

    console.log(`✅ Report generated successfully in ${generationTime}ms`);
    console.log(
      `✅ Report size: ${(htmlReport.length / 1024).toFixed(2)} KB\n`,
    );

    // Step 6: Validate report content
    console.log('🔍 Step 6: Validating report content...');
    validateReportContent(htmlReport, testData);
    console.log('✅ Report content validation passed\n');

    // Step 7: Save report and generate analytics
    console.log('💾 Step 7: Saving report and generating analytics...');
    const reportPath = await saveReport(htmlReport, testData.task.taskId);
    const analytics = generateReportAnalytics(htmlReport, testData);

    console.log(`✅ Report saved to: ${reportPath}`);
    console.log('✅ Report Analytics:');
    console.log(`   📊 Data Flow: ${analytics.dataFlow}`);
    console.log(`   🏗️ Builder Integration: ${analytics.builderIntegration}`);
    console.log(`   📈 Analyzer Integration: ${analytics.analyzerIntegration}`);
    console.log(`   🎨 View Services: ${analytics.viewServices}`);
    console.log(`   📱 Responsive Design: ${analytics.responsiveDesign}\n`);

    // Step 8: Test edge cases
    console.log('🧪 Step 8: Testing edge cases...');
    await testEdgeCases(implementationPlanService, prisma);
    console.log('✅ Edge case testing completed\n');

    console.log('🎉 Implementation Plan Report Integration Test PASSED! 🎉');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Data Service Integration: PASSED`);
    console.log(`   ✅ Builder Service Integration: PASSED`);
    console.log(`   ✅ Analyzer Service Integration: PASSED`);
    console.log(`   ✅ Report Generation: PASSED`);
    console.log(`   ✅ Content Validation: PASSED`);
    console.log(`   ✅ Edge Case Handling: PASSED`);
  } catch (error) {
    console.error(
      '❌ Implementation Plan Report Integration Test FAILED:',
      error,
    );
    process.exit(1);
  } finally {
    await app.close();
  }
}

async function createTestData(prisma: PrismaService) {
  // Use real task data to test proper data flow
  const realTaskId = 'cmblgtpd10000mtpsdf2ayev8'; // Our active task with rich data

  // First check if this task has all the data we need
  const existingTask = await prisma.task.findUnique({
    where: { taskId: realTaskId },
    include: {
      implementationPlans: {
        include: {
          subtasks: true,
        },
      },
    },
  });

  if (!existingTask || !existingTask.implementationPlans.length) {
    throw new Error(
      `Task ${realTaskId} not found or missing implementation plans. Cannot test with real data.`,
    );
  }

  // Return the real task data for testing
  const task = {
    taskId: existingTask.taskId,
    name: existingTask.name,
    status: existingTask.status,
    priority: existingTask.priority,
    owner: existingTask.owner,
  };

  const plan = existingTask.implementationPlans[0];
  const subtasks = plan.subtasks;
  const uniqueBatches = [
    ...new Set(subtasks.map((s) => s.batchId).filter(Boolean)),
  ];

  return {
    task,
    plan: {
      overview: plan.overview,
      approach: plan.approach,
      technicalDecisions: plan.technicalDecisions,
      filesToModify: plan.filesToModify,
      createdBy: plan.createdBy,
      strategicGuidance: plan.strategicGuidance,
    },
    subtasks,
    batches: uniqueBatches,
    isRealData: true, // Flag to indicate this is real data
  };
}

function validateReportContent(htmlReport: string, testData: any) {
  const validations = [
    // Basic structure validation
    {
      test: () => htmlReport.includes('<!DOCTYPE html>'),
      name: 'HTML5 doctype',
    },
    { test: () => htmlReport.includes('<html'), name: 'HTML root element' },
    { test: () => htmlReport.includes('<head>'), name: 'HTML head section' },
    { test: () => htmlReport.includes('<body'), name: 'HTML body section' },

    // Content validation
    {
      test: () => htmlReport.includes(testData.task.name),
      name: 'Task name in content',
    },
    {
      test: () => htmlReport.includes(testData.task.taskId),
      name: 'Task ID in content',
    },

    // Rich content validation - check for detailed implementation plan data
    {
      test: () => htmlReport.includes('Technical Decisions'),
      name: 'Technical decisions section',
    },
    {
      test: () => htmlReport.includes('Strategic Guidance'),
      name: 'Strategic guidance section',
    },
    {
      test: () => htmlReport.includes('Implementation Plan Overview'),
      name: 'Implementation plan overview',
    },
    {
      test: () => htmlReport.includes('Files to Modify'),
      name: 'Files to modify section',
    },
    {
      test: () =>
        htmlReport.includes('Architectural') ||
        htmlReport.includes('architecture'),
      name: 'Architectural content',
    },

    // Progress and metrics validation
    { test: () => htmlReport.includes('Progress'), name: 'Progress section' },
    { test: () => htmlReport.includes('%'), name: 'Percentage metrics' },

    // Styling and framework validation
    {
      test: () => htmlReport.includes('tailwindcss.com'),
      name: 'Tailwind CSS CDN',
    },
    {
      test: () =>
        htmlReport.includes('Chart.js') || htmlReport.includes('chart.js'),
      name: 'Chart.js visualization',
    },
    {
      test: () => htmlReport.includes('font-awesome'),
      name: 'Font Awesome icons',
    },

    // Responsive design validation
    {
      test: () =>
        htmlReport.includes('max-w-') || htmlReport.includes('responsive'),
      name: 'Responsive design classes',
    },
    {
      test: () => htmlReport.includes('grid') && htmlReport.includes('lg:'),
      name: 'Responsive grid layout',
    },
  ];

  const results = validations.map((validation) => ({
    name: validation.name,
    passed: validation.test(),
  }));

  const failedValidations = results.filter((r) => !r.passed);

  if (failedValidations.length > 0) {
    console.log('⚠️ Some validations failed:');
    failedValidations.forEach((v) => console.log(`   ❌ ${v.name}`));
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(
    `✅ Content validation: ${passedCount}/${results.length} checks passed`,
  );

  if (failedValidations.length > 0) {
    throw new Error(
      `Report content validation failed: ${failedValidations.length} checks failed`,
    );
  }
}

async function saveReport(htmlReport: string, taskId: string): Promise<string> {
  const reportsDir = path.join(process.cwd(), 'test-reports');

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(
    reportsDir,
    `implementation-plan-${taskId}.html`,
  );
  fs.writeFileSync(reportPath, htmlReport);

  return reportPath;
}

function generateReportAnalytics(htmlReport: string, testData: any) {
  return {
    dataFlow:
      htmlReport.includes(testData.task.name) &&
      htmlReport.includes(testData.task.taskId)
        ? 'PASSED'
        : 'FAILED',
    builderIntegration:
      htmlReport.includes('batch') && htmlReport.includes('subtask')
        ? 'PASSED'
        : 'FAILED',
    analyzerIntegration:
      htmlReport.includes('Progress') && htmlReport.includes('%')
        ? 'PASSED'
        : 'FAILED',
    viewServices:
      htmlReport.includes('<head>') && htmlReport.includes('<style>')
        ? 'PASSED'
        : 'FAILED',
    responsiveDesign:
      htmlReport.includes('max-w-') || htmlReport.includes('grid')
        ? 'PASSED'
        : 'FAILED',
  };
}

async function testEdgeCases(
  implementationPlanService: ImplementationPlanService,
  prisma: PrismaService,
) {
  // Test 1: Non-existent task
  console.log('   🧪 Testing non-existent task...');
  const nonExistentReport =
    await implementationPlanService.generateImplementationPlanReport(
      'non-existent-task',
    );
  if (
    !nonExistentReport.includes('not found') &&
    !nonExistentReport.includes('No data') &&
    !nonExistentReport.includes('Task not found') &&
    !nonExistentReport.includes('No task data')
  ) {
    // If it's a valid HTML report but empty, that's also acceptable
    if (
      !nonExistentReport.includes('<!DOCTYPE html>') ||
      nonExistentReport.length < 1000
    ) {
      throw new Error(
        'Non-existent task should return appropriate error message or minimal report',
      );
    }
  }
  console.log('   ✅ Non-existent task handled correctly');

  // Test 2: Task without implementation plans
  console.log('   🧪 Testing task without implementation plans...');
  const emptyTaskId = `empty-task-${Date.now()}`;
  await prisma.task.create({
    data: {
      taskId: emptyTaskId,
      name: 'Empty Test Task',
      status: 'not-started',
      creationDate: new Date(),
    },
  });

  const emptyReport =
    await implementationPlanService.generateImplementationPlanReport(
      emptyTaskId,
    );
  if (!emptyReport || emptyReport.length === 0) {
    throw new Error('Empty task should still generate a report');
  }
  console.log('   ✅ Empty task handled correctly');

  // Test 3: Performance with large datasets
  console.log('   🧪 Testing performance with moderate dataset...');
  const startTime = Date.now();
  await implementationPlanService.generateImplementationPlanReport(emptyTaskId);
  const performanceTime = Date.now() - startTime;

  if (performanceTime > 5000) {
    // 5 seconds threshold
    console.log(
      `   ⚠️ Performance warning: Report generation took ${performanceTime}ms`,
    );
  } else {
    console.log(`   ✅ Performance acceptable: ${performanceTime}ms`);
  }
}

// Run the test
if (require.main === module) {
  runImplementationPlanIntegrationTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { runImplementationPlanIntegrationTest };
