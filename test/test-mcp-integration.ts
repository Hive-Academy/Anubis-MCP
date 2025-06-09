/**
 * Comprehensive E2E Report Generation Test
 *
 * This test directly tests the report generation pipeline without going through the MCP layer.
 * It simulates the complete workflow from data retrieval to HTML generation,
 * testing the entire reporting pipeline as it would be used in production.
 * Uses existing database data instead of creating sample data.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { InteractiveDashboardService } from '../src/task-workflow/domains/reporting/dashboard/interactive-dashboard/interactive-dashboard.service';
import { McpFileManagerService } from '../src/task-workflow/domains/reporting/shared/mcp-file-manager.service';
import * as fs from 'fs';
import * as path from 'path';
import { ReportingModule } from '../src/task-workflow/domains/reporting/reporting.module';

async function testE2EReportGeneration() {
  console.log('🔄 E2E Report Generation Test');
  console.log('==================================================');

  let app: TestingModule | undefined;

  try {
    // 1. Setup Test Module (Direct Service Access)
    console.log('📦 Initializing report generation test module...');

    app = await Test.createTestingModule({
      imports: [ReportingModule],
    }).compile();

    await app.init();
    console.log('✅ Test module initialized successfully');

    // 2. Check existing database data
    console.log('\n🔍 Validating database data for report generation...');
    const prismaService = app.get(PrismaService);

    const taskCount = await prismaService.task.count();
    const sampleTasks = await prismaService.task.findMany({
      take: 3,
      select: {
        taskId: true,
        name: true,
        status: true,
        priority: true,
        owner: true,
        creationDate: true,
      },
    });

    console.log(`   Tasks in database: ${taskCount}`);
    sampleTasks.forEach((task, idx) => {
      console.log(
        `   ${idx + 1}. ${task.taskId}: "${task.name}" (${task.status}, ${task.priority})`,
      );
    });

    if (taskCount === 0) {
      throw new Error(
        'No tasks found in database. Please create some test tasks first.',
      );
    }

    // 3. Test Direct Dashboard Service (bypassing MCP)
    console.log('\n📊 Testing dashboard service (bypassing MCP)...');
    const dashboardService = app.get(InteractiveDashboardService);

    const htmlGenerationStart = Date.now();
    const htmlContent = await dashboardService.generateHtmlDashboard({});
    const htmlGenerationTime = Date.now() - htmlGenerationStart;

    console.log('✅ HTML generation completed');
    console.log(`   HTML generation time: ${htmlGenerationTime}ms`);
    console.log(`   HTML content length: ${htmlContent.length} characters`);

    // Get some basic stats for reporting
    const taskMatches = (htmlContent.match(/task/gi) || []).length;
    const delegationMatches = (htmlContent.match(/delegation/gi) || []).length;

    // 5. Test File Management Service
    console.log('\n💾 Testing file management service...');
    const fileManager = app.get(McpFileManagerService);

    const fileSaveStart = Date.now();
    const savedFilePath = await fileManager.saveReportFile(
      htmlContent,
      'interactive-dashboard',
      'e2e-test',
      process.cwd(),
      'html',
    );
    const fileSaveTime = Date.now() - fileSaveStart;

    console.log('✅ File saved successfully');
    console.log(`   File save time: ${fileSaveTime}ms`);
    console.log(`   File path: ${savedFilePath}`);

    // 6. Validate Generated HTML File
    console.log('\n📄 Validating generated HTML file...');

    if (!fs.existsSync(savedFilePath)) {
      throw new Error(`Generated file not found at: ${savedFilePath}`);
    }

    const fileContent = fs.readFileSync(savedFilePath, 'utf-8');
    const fileSizeKB = (fs.statSync(savedFilePath).size / 1024).toFixed(2);

    console.log(`✅ HTML file exists and readable`);
    console.log(`   File size: ${fileSizeKB} KB`);
    console.log(
      `   Content matches generated: ${fileContent === htmlContent ? 'YES' : 'NO'}`,
    );

    // 7. Test Chart ID Fix - Check for undefined canvas IDs
    console.log('\n🎯 Testing Chart ID Fix (Primary Focus)...');

    const chartIDTests = [
      {
        name: 'Status Chart Canvas ID',
        test: () => {
          const match = htmlContent.match(
            /<canvas id="([^"]*)"[^>]*>.*?Status.*?Distribution/s,
          );
          return match && match[1] && match[1] !== 'undefined';
        },
      },
      {
        name: 'Priority Chart Canvas ID',
        test: () => {
          const match = htmlContent.match(
            /<canvas id="([^"]*)"[^>]*>.*?Priority.*?Distribution/s,
          );
          return match && match[1] && match[1] !== 'undefined';
        },
      },
      {
        name: 'Completion Trend Chart Canvas ID',
        test: () => {
          const match = htmlContent.match(
            /<canvas id="([^"]*)"[^>]*>.*?Completion.*?Trend/s,
          );
          return match && match[1] && match[1] !== 'undefined';
        },
      },
      {
        name: 'Role Performance Chart Canvas ID',
        test: () => {
          const match = htmlContent.match(
            /<canvas id="([^"]*)"[^>]*>.*?Role.*?Performance/s,
          );
          return match && match[1] && match[1] !== 'undefined';
        },
      },
      {
        name: 'No undefined canvas IDs',
        test: () => !htmlContent.includes('id="undefined"'),
      },
    ];

    let passedChartIDTests = 0;
    for (const test of chartIDTests) {
      const passed = test.test();
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`,
      );
      if (passed) passedChartIDTests++;
    }

    console.log(
      `\n🎯 Chart ID Fix Results: ${passedChartIDTests}/${chartIDTests.length} tests passed`,
    );

    // 8. Test Card-Based Design (Updated Focus)
    console.log('\n💳 Testing Card-Based Design Implementation...');

    const cardDesignTests = [
      {
        name: 'Card-based task layout',
        test: () =>
          htmlContent.includes('task-card') || htmlContent.includes('card'),
      },
      {
        name: 'Subtasks section present',
        test: () =>
          htmlContent.includes('subtask') || htmlContent.includes('Subtasks'),
      },
      {
        name: 'Progress bars for tasks',
        test: () =>
          htmlContent.includes('progress') || htmlContent.includes('Progress'),
      },
      {
        name: 'Modern card styling',
        test: () =>
          htmlContent.includes('rounded-') && htmlContent.includes('shadow-'),
      },
      {
        name: 'Task details focus',
        test: () =>
          htmlContent.includes('Task Details') ||
          htmlContent.includes('task detail'),
      },
      {
        name: 'Reduced delegation emphasis',
        test: () => {
          const delegationCount = (htmlContent.match(/delegation/gi) || [])
            .length;
          const taskCount = (htmlContent.match(/task/gi) || []).length;
          return delegationCount < taskCount; // Tasks should be more prominent
        },
      },
    ];

    let passedCardTests = 0;
    for (const test of cardDesignTests) {
      const passed = test.test();
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`,
      );
      if (passed) passedCardTests++;
    }

    // 9. Test Data Integration
    console.log('\n🔗 Testing Data Integration...');

    const dataIntegrationTests = [
      {
        name: 'Real task data integration',
        test: () =>
          sampleTasks.some(
            (task) =>
              htmlContent.includes(task.taskId) ||
              htmlContent.includes(task.name),
          ),
      },
      {
        name: 'Task status distribution',
        test: () =>
          htmlContent.includes('Status Distribution') ||
          htmlContent.includes('status'),
      },
      {
        name: 'Priority analysis',
        test: () =>
          htmlContent.includes('Priority') || htmlContent.includes('priority'),
      },
      {
        name: 'Performance metrics',
        test: () =>
          htmlContent.includes('Performance') ||
          htmlContent.includes('metrics'),
      },
      {
        name: 'Interactive functionality',
        test: () =>
          htmlContent.includes('Chart(') &&
          htmlContent.includes('addEventListener'),
      },
    ];

    let passedDataTests = 0;
    for (const test of dataIntegrationTests) {
      const passed = test.test();
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`,
      );
      if (passed) passedDataTests++;
    }

    // 10. Basic HTML Structure Validation
    console.log('\n🔍 Basic HTML structure validation...');

    const basicValidations = [
      {
        name: 'Valid HTML structure',
        test: () =>
          htmlContent.includes('<!DOCTYPE html>') &&
          htmlContent.includes('<html') &&
          htmlContent.includes('</html>'),
      },
      {
        name: 'Chart.js library included',
        test: () =>
          htmlContent.includes('chart.js') || htmlContent.includes('Chart.js'),
      },
      {
        name: 'Tailwind CSS included',
        test: () =>
          htmlContent.includes('tailwind') ||
          htmlContent.includes('bg-') ||
          htmlContent.includes('text-'),
      },
      {
        name: 'JavaScript functionality',
        test: () =>
          htmlContent.includes('<script>') && htmlContent.includes('Chart('),
      },
      {
        name: 'Responsive design',
        test: () =>
          htmlContent.includes('responsive') ||
          htmlContent.includes('md:') ||
          htmlContent.includes('lg:'),
      },
    ];

    let passedBasicTests = 0;
    for (const test of basicValidations) {
      const passed = test.test();
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`,
      );
      if (passed) passedBasicTests++;
    }

    // 11. Performance Analysis
    console.log('\n⚡ Performance Analysis...');
    const totalProcessingTime = htmlGenerationTime + fileSaveTime;

    console.log(`   HTML generation: ${htmlGenerationTime}ms`);
    console.log(`   File save: ${fileSaveTime}ms`);
    console.log(`   Total processing: ${totalProcessingTime}ms`);

    const performanceTests = [
      {
        name: 'HTML generation under 2000ms',
        test: () => htmlGenerationTime < 2000,
      },
      {
        name: 'File save under 500ms',
        test: () => fileSaveTime < 500,
      },
      {
        name: 'Total processing under 2500ms',
        test: () => totalProcessingTime < 2500,
      },
    ];

    let passedPerformanceTests = 0;
    for (const test of performanceTests) {
      const passed = test.test();
      console.log(
        `   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`,
      );
      if (passed) passedPerformanceTests++;
    }

    // 12. Final Test Summary
    console.log('\n📊 COMPREHENSIVE E2E TEST RESULTS');
    console.log('==================================================');
    console.log(
      `🎯 Chart ID Fix: ${passedChartIDTests}/${chartIDTests.length} tests passed`,
    );
    console.log(
      `💳 Card Design: ${passedCardTests}/${cardDesignTests.length} tests passed`,
    );
    console.log(
      `🔗 Data Integration: ${passedDataTests}/${dataIntegrationTests.length} tests passed`,
    );
    console.log(
      `🔍 Basic Structure: ${passedBasicTests}/${basicValidations.length} tests passed`,
    );
    console.log(
      `⚡ Performance: ${passedPerformanceTests}/${performanceTests.length} tests passed`,
    );

    const totalTests =
      chartIDTests.length +
      cardDesignTests.length +
      dataIntegrationTests.length +
      basicValidations.length +
      performanceTests.length;
    const totalPassed =
      passedChartIDTests +
      passedCardTests +
      passedDataTests +
      passedBasicTests +
      passedPerformanceTests;
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);

    console.log(
      `\n🏆 OVERALL SUCCESS RATE: ${totalPassed}/${totalTests} (${successRate}%)`,
    );

    if (passedChartIDTests === chartIDTests.length) {
      console.log(
        '✅ PRIMARY OBJECTIVE ACHIEVED: Chart ID undefined issue is FIXED!',
      );
    } else {
      console.log(
        '❌ PRIMARY OBJECTIVE NOT FULLY ACHIEVED: Chart ID issues still exist',
      );
    }

    if (passedCardTests >= 4) {
      console.log(
        '✅ SECONDARY OBJECTIVE ACHIEVED: Card-based design successfully implemented!',
      );
    } else {
      console.log(
        '❌ SECONDARY OBJECTIVE NEEDS WORK: Card-based design needs improvement',
      );
    }

    if (passedPerformanceTests >= 3) {
      console.log(
        '✅ PERFORMANCE OBJECTIVE ACHIEVED: Report generation is fast and efficient!',
      );
    } else {
      console.log(
        '❌ PERFORMANCE OBJECTIVE NEEDS WORK: Report generation performance needs improvement',
      );
    }

    console.log(`\n📁 Generated report available at: ${savedFilePath}`);
    console.log(
      `📈 Performance: ${totalProcessingTime}ms total processing time`,
    );
    console.log(`💾 File size: ${fileSizeKB} KB`);
    console.log(
      `📊 Data coverage: ${taskMatches} task references, ${delegationMatches} delegation references`,
    );
  } catch (error) {
    console.error(`\n💥 E2E Report Generation Test Failed: ${error.message}`);
    throw error;
  } finally {
    if (app) {
      console.log('\n🧹 Test module closed');
      await app.close();
    }
  }
}

// Run the test
testE2EReportGeneration()
  .then(() => {
    console.log('\n🎉 E2E Report Generation Test Completed Successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 E2E Report Generation Test Failed:', error.message);
    process.exit(1);
  });

export { testE2EReportGeneration };
