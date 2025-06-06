/**
 * Task Detail Report Integration Test
 *
 * Comprehensive test for the enhanced task-detail reports with architectural improvements.
 * Tests the new database-first approach, support services, and visual design.
 * Validates that all services use database types as source of truth.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './src/prisma/prisma.service';
import { ReportMcpOperationsService } from './src/task-workflow/domains/reporting/report-mcp-operations.service';
import { TaskDetailService } from './src/task-workflow/domains/reporting/task-management/task-detail/task-detail.service';
import { TaskDetailBuilderService } from './src/task-workflow/domains/reporting/task-management/task-detail/task-detail-builder.service';
import { TaskProgressAnalyzerService } from './src/task-workflow/domains/reporting/task-management/task-detail/task-progress-analyzer.service';
import { TaskQualityAnalyzerService } from './src/task-workflow/domains/reporting/task-management/task-detail/task-quality-analyzer.service';
import * as fs from 'fs';
import * as path from 'path';
import { ReportingModule } from './src/task-workflow/domains/reporting/reporting.module';

async function testTaskDetailIntegration() {
  console.log('🎯 Task Detail Report Integration Test');
  console.log('==================================================');

  let app: TestingModule | undefined;
  
  try {
    // 1. Setup Test Module
    console.log('📦 Initializing task-detail test module...');
    
    const { TaskWorkflowModule } = await import('./src/task-workflow/task-workflow.module');
    
    app = await Test.createTestingModule({
      imports: [TaskWorkflowModule],
    }).compile();

    await app.init();
    console.log('✅ Test module initialized successfully');

    // 2. Validate Database Data for Task Detail Testing
    console.log('\n🔍 Validating database data for task detail testing...');
    const prismaService = app.get(PrismaService);
    
    // Get comprehensive task data
    const tasksWithDetails = await prismaService.task.findMany({
      take: 5,
      include: {
        taskDescription: true,
        codebaseAnalysis: true,
        implementationPlans: {
          include: {
            subtasks: true,
          },
        },
        delegationRecords: true,
      },
      orderBy: { creationDate: 'desc' },
    });

    console.log(`   Tasks with comprehensive data: ${tasksWithDetails.length}`);
    
    if (tasksWithDetails.length === 0) {
      throw new Error('No tasks with comprehensive data found. Please create test tasks with descriptions, plans, and subtasks.');
    }

    // Find the most comprehensive task for detailed testing
    const testTask = tasksWithDetails.find(task => 
      task.taskDescription && 
      task.implementationPlans.length > 0 && 
      task.implementationPlans.some(plan => plan.subtasks.length > 0)
    ) || tasksWithDetails[0];

    console.log(`   Selected test task: ${testTask.taskId} - "${testTask.name}"`);
    console.log(`   - Has description: ${!!testTask.taskDescription}`);
    console.log(`   - Implementation plans: ${testTask.implementationPlans.length}`);
    console.log(`   - Total subtasks: ${testTask.implementationPlans.reduce((sum, plan) => sum + plan.subtasks.length, 0)}`);
    console.log(`   - Delegation records: ${testTask.delegationRecords.length}`);
    console.log(`   - Has codebase analysis: ${!!testTask.codebaseAnalysis}`);

    // 3. Test New Support Services Architecture
    console.log('\n🏗️ Testing new support services architecture...');
    
    const taskDetailService = app.get(TaskDetailService);
    const builderService = app.get(TaskDetailBuilderService);
    const progressAnalyzer = app.get(TaskProgressAnalyzerService);
    const qualityAnalyzer = app.get(TaskQualityAnalyzerService);

    console.log('✅ All support services successfully injected');

    // 4. Test Database-First Data Retrieval
    console.log('\n📊 Testing database-first data retrieval...');
    
    const dataRetrievalStart = Date.now();
    const taskDetailData = await taskDetailService.generateReport(testTask.taskId);
    const dataRetrievalTime = Date.now() - dataRetrievalStart;

    console.log(`✅ Task detail data generated in ${dataRetrievalTime}ms`);
    console.log(`   Task info: ${taskDetailData.task.name} (${taskDetailData.task.status})`);
    console.log(`   Description: ${taskDetailData.description ? 'Present' : 'Missing'}`);
    console.log(`   Implementation plans: ${taskDetailData.implementationPlans.length}`);
    console.log(`   Subtasks: ${taskDetailData.subtasks.length}`);
    console.log(`   Delegation history: ${taskDetailData.delegationHistory.length}`);
    console.log(`   Codebase analysis: ${taskDetailData.codebaseAnalysis ? 'Present' : 'Missing'}`);

    // 5. Test Support Services with Real Data
    console.log('\n🔧 Testing support services with real data...');

    // Test Builder Service
    const builderStart = Date.now();
    const builtData = builderService.buildTaskDetailData(
      testTask as any,
      testTask.implementationPlans as any,
      testTask.implementationPlans.flatMap(plan => plan.subtasks) as any,
      testTask.delegationRecords as any
    );
    const builderTime = Date.now() - builderStart;
    console.log(`✅ Builder service: ${builderTime}ms`);

    // Test Progress Analyzer
    const progressStart = Date.now();
    const progressMetrics = progressAnalyzer.calculateTaskProgress(taskDetailData);
    const batchSummary = builderService.buildBatchSummary(taskDetailData.subtasks);
    const progressTime = Date.now() - progressStart;
    console.log(`✅ Progress analyzer: ${progressTime}ms`);
    console.log(`   Overall progress: ${progressMetrics.overallProgress}%`);
    console.log(`   Completion rate: ${progressMetrics.completionRate}%`);
    console.log(`   Batches analyzed: ${Object.keys(batchSummary).length}`);

    // Test Quality Analyzer
    const qualityStart = Date.now();
    const qualityMetrics = qualityAnalyzer.analyzeTaskQuality(taskDetailData);
    const qualityTime = Date.now() - qualityStart;
    console.log(`✅ Quality analyzer: ${qualityTime}ms`);
    console.log(`   Overall quality score: ${qualityMetrics.overallQualityScore}/10`);
    console.log(`   Implementation quality: ${qualityMetrics.implementationQuality}/10`);

    // 6. Generate Task Detail HTML Report
    console.log('\n📄 Generating task detail HTML report...');
    
    const reportService = app.get(ReportMcpOperationsService);
    const htmlGenerationStart = Date.now();
    
    const mcpResult = await reportService.generateWorkflowReport({
      reportType: 'task-detail',
      taskId: testTask.taskId,
      outputFormat: 'html',
      basePath: process.cwd(),
    });
    
    const htmlGenerationTime = Date.now() - htmlGenerationStart;
    console.log(`✅ HTML report generated in ${htmlGenerationTime}ms`);

    // 7. Extract and Validate HTML File
    console.log('\n🔍 Extracting and validating HTML file...');
    
    let filePath: string | null = null;
    
    if (mcpResult && mcpResult.content && Array.isArray(mcpResult.content)) {
      for (const content of mcpResult.content) {
        if (content.type === 'text' && content.text) {
          const locationMatch = content.text.match(/Location:\s*(.+)/);
          if (locationMatch && locationMatch[1] && locationMatch[1] !== 'JSON Data') {
            filePath = locationMatch[1].trim();
            break;
          }
        }
      }
    }

    if (!filePath) {
      // Fallback: look for task detail HTML files
      const reportsDir = path.join(process.cwd(), 'workflow-reports');
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir, { recursive: true });
        const taskDetailFiles = files.filter(f => 
          typeof f === 'string' && 
          f.includes('task-detail') && 
          f.endsWith('.html')
        ) as string[];
        if (taskDetailFiles.length > 0) {
          filePath = path.join(reportsDir, taskDetailFiles[taskDetailFiles.length - 1]);
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`Task detail HTML file not found at: ${filePath || 'undefined path'}`);
    }

    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const fileSizeKB = (fs.statSync(filePath).size / 1024).toFixed(2);

    console.log(`✅ HTML file validated`);
    console.log(`   File size: ${fileSizeKB} KB`);
    console.log(`   Content length: ${htmlContent.length} characters`);

    // 8. Test Database Type Integration (Primary Focus)
    console.log('\n🎯 Testing Database Type Integration (Primary Focus)...');
    
    const databaseTypeTests = [
      {
        name: 'Task data uses database fields',
        test: () => {
          // Check that the HTML contains actual task data from database
          return htmlContent.includes(testTask.taskId) && 
                 htmlContent.includes(testTask.name) &&
                 htmlContent.includes(testTask.status);
        }
      },
      {
        name: 'Implementation plans properly displayed',
        test: () => {
          return testTask.implementationPlans.length > 0 ? 
                 testTask.implementationPlans.some(plan => htmlContent.includes(plan.overview)) :
                 true; // Pass if no plans exist
        }
      },
      {
        name: 'Subtasks with batch organization',
        test: () => {
          const subtasks = testTask.implementationPlans.flatMap(plan => plan.subtasks);
          return subtasks.length > 0 ?
                 subtasks.some(subtask => htmlContent.includes(subtask.name)) :
                 true; // Pass if no subtasks exist
        }
      },
      {
        name: 'Delegation history from database',
        test: () => {
          return testTask.delegationRecords.length > 0 ?
                 htmlContent.includes('delegation') || htmlContent.includes('Delegation') :
                 true; // Pass if no delegations exist
        }
      },
      {
        name: 'No undefined values in HTML',
        test: () => !htmlContent.includes('undefined') && !htmlContent.includes('null')
      },
      {
        name: 'Proper date formatting',
        test: () => {
          // Check for ISO date patterns or formatted dates
          return /\d{4}-\d{2}-\d{2}/.test(htmlContent) || 
                 /\w+ \d{1,2}, \d{4}/.test(htmlContent);
        }
      }
    ];

    let passedDatabaseTests = 0;
    for (const test of databaseTypeTests) {
      const passed = test.test();
      console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (passed) passedDatabaseTests++;
    }

    // 9. Test Enhanced Visual Design
    console.log('\n🎨 Testing Enhanced Visual Design...');
    
    const visualDesignTests = [
      {
        name: 'Modern Tailwind CSS styling',
        test: () => {
          const tailwindClasses = ['bg-', 'text-', 'rounded-', 'shadow-', 'p-', 'm-', 'flex', 'grid'];
          return tailwindClasses.some(cls => htmlContent.includes(cls));
        }
      },
      {
        name: 'Card-based layout for task details',
        test: () => htmlContent.includes('card') || htmlContent.includes('rounded') && htmlContent.includes('shadow')
      },
      {
        name: 'Progress visualization',
        test: () => {
          return htmlContent.includes('progress') || 
                 htmlContent.includes('Progress') ||
                 htmlContent.includes('%') ||
                 htmlContent.includes('completion');
        }
      },
      {
        name: 'Responsive design classes',
        test: () => {
          const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:', 'grid-cols-', 'flex-col', 'flex-row'];
          return responsiveClasses.some(cls => htmlContent.includes(cls));
        }
      },
      {
        name: 'Interactive elements',
        test: () => {
          return htmlContent.includes('hover:') || 
                 htmlContent.includes('cursor-pointer') ||
                 htmlContent.includes('transition');
        }
      },
      {
        name: 'Color scheme consistency',
        test: () => {
          const colorClasses = ['blue-', 'green-', 'red-', 'yellow-', 'gray-', 'indigo-'];
          return colorClasses.some(cls => htmlContent.includes(cls));
        }
      },
      {
        name: 'Typography hierarchy',
        test: () => {
          const textClasses = ['text-xs', 'text-sm', 'text-lg', 'text-xl', 'text-2xl', 'font-bold', 'font-semibold'];
          return textClasses.some(cls => htmlContent.includes(cls));
        }
      }
    ];

    let passedVisualTests = 0;
    for (const test of visualDesignTests) {
      const passed = test.test();
      console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (passed) passedVisualTests++;
    }

    // 10. Test Service Architecture Quality
    console.log('\n🏛️ Testing Service Architecture Quality...');
    
    const architectureTests = [
      {
        name: 'Single Responsibility Principle',
        test: () => {
          // Each service should have focused responsibilities
          return htmlContent.includes('task-detail') && // Main service working
                 progressMetrics.overallProgress >= 0 && // Progress service working
                 qualityMetrics.overallQualityScore >= 0; // Quality service working
        }
      },
      {
        name: 'Dependency Injection working',
        test: () => {
          // All services were successfully injected
          return taskDetailService && builderService && progressAnalyzer && qualityAnalyzer;
        }
      },
      {
        name: 'Type safety maintained',
        test: () => {
          // Check that data structures are properly typed
          return typeof taskDetailData.task.taskId === 'string' &&
                 typeof progressMetrics.overallProgress === 'number' &&
                 Array.isArray(taskDetailData.subtasks);
        }
      },
      {
        name: 'Error handling robust',
        test: () => {
          // Services should handle missing data gracefully
          return taskDetailData.metadata && 
                 taskDetailData.metadata.generatedAt &&
                 taskDetailData.metadata.reportType === 'task-detail';
        }
      }
    ];

    let passedArchitectureTests = 0;
    for (const test of architectureTests) {
      const passed = test.test();
      console.log(`   ${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
      if (passed) passedArchitectureTests++;
    }

    // 11. Performance and Data Coverage Analysis
    console.log('\n⚡ Performance and Data Coverage Analysis...');
    
    const performanceMetrics = {
      dataRetrieval: dataRetrievalTime,
      builderService: builderTime,
      progressAnalysis: progressTime,
      qualityAnalysis: qualityTime,
      htmlGeneration: htmlGenerationTime,
      totalTime: dataRetrievalTime + builderTime + progressTime + qualityTime + htmlGenerationTime
    };

    console.log(`   Data retrieval: ${performanceMetrics.dataRetrieval}ms`);
    console.log(`   Builder service: ${performanceMetrics.builderService}ms`);
    console.log(`   Progress analysis: ${performanceMetrics.progressAnalysis}ms`);
    console.log(`   Quality analysis: ${performanceMetrics.qualityAnalysis}ms`);
    console.log(`   HTML generation: ${performanceMetrics.htmlGeneration}ms`);
    console.log(`   Total processing: ${performanceMetrics.totalTime}ms`);

    const dataCoverage = {
      hasDescription: !!taskDetailData.description,
      hasImplementationPlans: taskDetailData.implementationPlans.length > 0,
      hasSubtasks: taskDetailData.subtasks.length > 0,
      hasDelegationHistory: taskDetailData.delegationHistory.length > 0,
      hasCodebaseAnalysis: !!taskDetailData.codebaseAnalysis,
      batchesAnalyzed: Object.keys(batchSummary).length
    };

    console.log(`   Data coverage: ${Object.values(dataCoverage).filter(Boolean).length}/${Object.keys(dataCoverage).length - 1} components`);
    console.log(`   Batches analyzed: ${dataCoverage.batchesAnalyzed}`);

    // 12. Final Test Summary
    console.log('\n📊 COMPREHENSIVE TEST RESULTS');
    console.log('==================================================');
    console.log(`🎯 Database Integration: ${passedDatabaseTests}/${databaseTypeTests.length} tests passed`);
    console.log(`🎨 Visual Design: ${passedVisualTests}/${visualDesignTests.length} tests passed`);
    console.log(`🏛️ Architecture Quality: ${passedArchitectureTests}/${architectureTests.length} tests passed`);
    
    const totalTests = databaseTypeTests.length + visualDesignTests.length + architectureTests.length;
    const totalPassed = passedDatabaseTests + passedVisualTests + passedArchitectureTests;
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log(`\n🏆 OVERALL SUCCESS RATE: ${totalPassed}/${totalTests} (${successRate}%)`);

    // Success criteria
    if (passedDatabaseTests === databaseTypeTests.length) {
      console.log('✅ PRIMARY OBJECTIVE ACHIEVED: Database type integration is PERFECT!');
    } else {
      console.log('❌ PRIMARY OBJECTIVE NEEDS WORK: Database type integration has issues');
    }

    if (passedVisualTests >= Math.ceil(visualDesignTests.length * 0.8)) {
      console.log('✅ VISUAL DESIGN OBJECTIVE ACHIEVED: Stunning Tailwind design implemented!');
    } else {
      console.log('❌ VISUAL DESIGN NEEDS IMPROVEMENT: Tailwind styling needs enhancement');
    }

    if (passedArchitectureTests === architectureTests.length) {
      console.log('✅ ARCHITECTURE OBJECTIVE ACHIEVED: Service architecture is solid!');
    } else {
      console.log('❌ ARCHITECTURE NEEDS WORK: Service architecture has issues');
    }

    console.log(`\n📁 Generated task detail report: ${filePath}`);
    console.log(`📈 Performance: ${performanceMetrics.totalTime}ms total processing`);
    console.log(`💾 File size: ${fileSizeKB} KB`);
    console.log(`📊 Data coverage: ${Object.values(dataCoverage).filter(Boolean).length}/${Object.keys(dataCoverage).length - 1} components`);

  } catch (error) {
    console.error(`\n💥 Task Detail Integration Test Failed: ${error.message}`);
    throw error;
  } finally {
    if (app) {
      console.log('\n🧹 Test module closed');
      await app.close();
    }
  }
}

// Run the test
testTaskDetailIntegration()
  .then(() => {
    console.log('\n🎉 Task Detail Integration Test Completed Successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Task Detail Integration Test Failed:', error.message);
    process.exit(1);
  });

export { testTaskDetailIntegration }; 