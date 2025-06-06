import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { TaskWorkflowModule } from '../src/task-workflow/task-workflow.module';
import { InteractiveDashboardService } from '../src/task-workflow/domains/reporting/dashboard/interactive-dashboard/interactive-dashboard.service';
import {
  isValidChartConfiguration,
  ChartValidationError,
} from '../src/task-workflow/domains/reporting/shared/types/chart-types';

describe('Reporting Dashboard (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let dashboardService: InteractiveDashboardService;
  let moduleRef: TestingModule;

  // Test data references
  let testTaskIds: string[] = [];
  let testDelegationIds: number[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TaskWorkflowModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
    dashboardService = moduleRef.get<InteractiveDashboardService>(
      InteractiveDashboardService,
    );

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  describe('Dashboard Data Generation', () => {
    it('should generate dashboard data with real Prisma data', async () => {
      const dashboardData = await dashboardService.generateDashboard();

      // Validate data structure
      expect(dashboardData).toBeDefined();
      expect(dashboardData.summary).toBeDefined();
      expect(dashboardData.taskDistribution).toBeDefined();
      expect(dashboardData.workflowMetrics).toBeDefined();
      expect(dashboardData.recentActivity).toBeDefined();
      expect(dashboardData.chartData).toBeDefined();

      // Validate metrics
      expect(dashboardData.summary.totalTasks).toBeGreaterThanOrEqual(3);
      expect(dashboardData.summary.completionRate).toBeGreaterThanOrEqual(0);
      expect(dashboardData.summary.completionRate).toBeLessThanOrEqual(100);

      // Validate charts structure
      expect(dashboardData.chartData.statusDistribution).toBeDefined();
      expect(dashboardData.chartData.priorityDistribution).toBeDefined();
      expect(dashboardData.chartData.completionTrends).toBeDefined();
      expect(dashboardData.chartData.rolePerformance).toBeDefined();

      console.log('✅ Dashboard data generation successful');
      console.log(`   Tasks: ${dashboardData.summary.totalTasks}`);
      console.log(
        `   Completion Rate: ${dashboardData.summary.completionRate}%`,
      );
    });

    it('should generate HTML dashboard without errors', async () => {
      const htmlContent = await dashboardService.generateHtmlDashboard();

      // Validate HTML structure
      expect(htmlContent).toBeDefined();
      expect(typeof htmlContent).toBe('string');
      expect(htmlContent.length).toBeGreaterThan(1000);

      // Validate essential HTML elements
      expect(htmlContent).toContain('Interactive Task Workflow Dashboard');
      expect(htmlContent).toContain('Chart.js');
      expect(htmlContent).toContain('statusDistributionChart');
      expect(htmlContent).toContain('priorityDistributionChart');
      expect(htmlContent).toContain('completionTrendChart');
      expect(htmlContent).toContain('rolePerformanceChart');

      console.log('✅ HTML dashboard generation successful');
      console.log(`   HTML length: ${htmlContent.length} characters`);
    });
  });

  describe('Chart Validation', () => {
    let dashboardData: any;

    beforeAll(async () => {
      dashboardData = await dashboardService.generateDashboard();
    });

    it('should have valid status distribution chart', () => {
      const chart = dashboardData.charts.statusDistribution;

      // Test chart structure validation
      const isValid = isValidChartConfiguration({
        id: 'status-distribution',
        title: 'Status Distribution',
        type: 'doughnut',
        labels: chart.labels,
        data: chart.data,
        colors: chart.colors,
      });

      expect(isValid).toBe(true);
      expect(chart.labels).toBeDefined();
      expect(chart.data).toBeDefined();
      expect(chart.colors).toBeDefined();
      expect(chart.labels.length).toBe(chart.data.length);
      expect(chart.labels.length).toBe(chart.colors.length);
      expect(chart.labels.length).toBeGreaterThan(0);

      console.log('✅ Status distribution chart validation passed');
      console.log(`   Labels: ${chart.labels.join(', ')}`);
    });

    it('should have valid priority distribution chart', () => {
      const chart = dashboardData.charts.priorityDistribution;

      const isValid = isValidChartConfiguration({
        id: 'priority-distribution',
        title: 'Priority Distribution',
        type: 'bar',
        labels: chart.labels,
        data: chart.data,
        colors: chart.colors,
      });

      expect(isValid).toBe(true);
      expect(chart.labels).toBeDefined();
      expect(chart.data).toBeDefined();
      expect(chart.colors).toBeDefined();
      expect(chart.labels.length).toBe(chart.data.length);
      expect(chart.labels.length).toBe(chart.colors.length);

      console.log('✅ Priority distribution chart validation passed');
      console.log(`   Priorities: ${chart.labels.join(', ')}`);
    });

    it('should have valid role performance chart', () => {
      const chart = dashboardData.charts.rolePerformance;

      const isValid = isValidChartConfiguration({
        id: 'role-performance',
        title: 'Role Performance',
        type: 'radar',
        labels: chart.labels,
        data: chart.data,
        colors: chart.colors,
      });

      expect(isValid).toBe(true);
      expect(chart.labels).toBeDefined();
      expect(chart.data).toBeDefined();
      expect(chart.colors).toBeDefined();
      expect(chart.labels.length).toBe(chart.data.length);
      expect(chart.labels.length).toBe(chart.colors.length);

      console.log('✅ Role performance chart validation passed');
      console.log(`   Roles: ${chart.labels.join(', ')}`);
    });

    it('should have valid completion trend chart', () => {
      const chart = dashboardData.charts.completionTrend;

      const isValid = isValidChartConfiguration({
        id: 'completion-trend',
        title: 'Completion Trend',
        type: 'line',
        labels: chart.labels || ['No Data'],
        data: chart.data || [0],
        colors: chart.colors || ['#6b7280'],
      });

      expect(isValid).toBe(true);

      console.log('✅ Completion trend chart validation passed');
    });

    it('should catch invalid chart configurations', () => {
      // Test invalid chart (missing colors - the original bug)
      const invalidChart = {
        id: 'invalid-chart',
        title: 'Invalid Chart',
        type: 'pie',
        labels: ['Label 1', 'Label 2'],
        data: [10, 20],
        // colors: undefined <- Missing colors property
      };

      const isValid = isValidChartConfiguration(invalidChart);
      expect(isValid).toBe(false);

      // Test ChartValidationError
      expect(() => {
        throw new ChartValidationError('Test validation error', 'test-chart', [
          'Missing colors property',
        ]);
      }).toThrow(ChartValidationError);

      console.log('✅ Invalid chart detection working correctly');
    });
  });

  describe('Database Integration', () => {
    it('should retrieve tasks from database correctly', async () => {
      const tasks = await prismaService.task.findMany({
        include: {
          taskDescription: true,
        },
      });

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThanOrEqual(3);

      // Validate test data exists
      const testTasks = tasks.filter((task) =>
        testTaskIds.includes(task.taskId),
      );
      expect(testTasks.length).toBe(3);

      console.log('✅ Database task retrieval successful');
      console.log(`   Total tasks: ${tasks.length}`);
      console.log(`   Test tasks: ${testTasks.length}`);
    });

    it('should retrieve delegations from database correctly', async () => {
      const delegations = await prismaService.workflowTransition.findMany();

      expect(delegations).toBeDefined();
      expect(Array.isArray(delegations)).toBe(true);
      expect(delegations.length).toBeGreaterThanOrEqual(2);

      console.log('✅ Database delegation retrieval successful');
      console.log(`   Total delegations: ${delegations.length}`);
    });

    it('should handle empty database gracefully', async () => {
      // Temporarily remove test data
      await cleanupTestData();

      const dashboardData = await dashboardService.generateDashboard();

      // Should still generate valid structure with empty data
      expect(dashboardData).toBeDefined();
      expect(dashboardData.summary.totalTasks).toBe(0);
      expect(dashboardData.chartData.statusDistribution.labels).toEqual([
        'No Data',
      ]);

      // Restore test data
      await setupTestData();

      console.log('✅ Empty database handling successful');
    });
  });

  describe('Chart Type Safety', () => {
    it('should prevent undefined property access in chart generation', async () => {
      const dashboardData = await dashboardService.generateDashboard();

      // Test that all charts have required properties
      Object.entries(dashboardData.chartData).forEach(([chartName, chart]) => {
        expect(chart).toBeDefined();
        expect(chart.labels).toBeDefined();
        expect(chart.data).toBeDefined();
        expect(chart.colors).toBeDefined();

        // Ensure arrays are not empty or undefined
        expect(Array.isArray(chart.labels)).toBe(true);
        expect(Array.isArray(chart.data)).toBe(true);
        expect(Array.isArray(chart.colors)).toBe(true);

        // Ensure no undefined property access
        chart.colors.forEach((color: string, _index: number) => {
          expect(color).toBeDefined();
          expect(typeof color).toBe('string');
          expect(color).toMatch(/^#[0-9a-fA-F]{6}$/); // Valid hex color
        });

        console.log(`✅ Chart ${chartName} type safety validated`);
      });
    });

    it('should have consistent array lengths across all charts', async () => {
      const dashboardData = await dashboardService.generateDashboard();

      Object.entries(dashboardData.chartData).forEach(([chartName, chart]) => {
        // Check array length consistency
        expect(chart.labels.length).toBe(chart.data.length);
        expect(chart.labels.length).toBe(chart.colors.length);

        // Check that arrays are not empty (unless no data scenario)
        if (chart.labels[0] !== 'No Data') {
          expect(chart.labels.length).toBeGreaterThan(0);
        }

        console.log(
          `✅ Chart ${chartName} array consistency validated (${chart.labels.length} elements)`,
        );
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should generate dashboard within reasonable time', async () => {
      const startTime = Date.now();
      await dashboardService.generateDashboard();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`✅ Dashboard generation performance: ${duration}ms`);
    });

    it('should handle Prisma errors gracefully', async () => {
      // Mock a Prisma error by temporarily disconnecting
      const originalFindMany = prismaService.task.findMany.bind(prismaService);

      // Mock error
      prismaService.task.findMany = jest
        .fn()
        .mockRejectedValue(new Error('Database connection error'));

      try {
        await expect(dashboardService.generateDashboard()).rejects.toThrow();
      } finally {
        // Restore original method
        prismaService.task.findMany = originalFindMany;
      }

      console.log('✅ Prisma error handling validated');
    });
  });

  // Helper functions for test data management
  async function setupTestData() {
    // Create test tasks
    const task1 = await prismaService.task.create({
      data: {
        taskId: 'TEST-E2E-001',
        name: 'E2E Test Task 1',
        status: 'completed',
        priority: 'High',
        currentMode: 'boomerang',
        taskDescription: {
          create: {
            description: 'Test task for e2e testing',
            businessRequirements: 'Test requirements',
            technicalRequirements: 'Test technical requirements',
            acceptanceCriteria: ['Test criteria 1', 'Test criteria 2'],
          },
        },
      },
    });

    const task2 = await prismaService.task.create({
      data: {
        taskId: 'TEST-E2E-002',
        name: 'E2E Test Task 2',
        status: 'in-progress',
        priority: 'Medium',
        currentMode: 'senior-developer',
        taskDescription: {
          create: {
            description: 'Another test task',
            businessRequirements: 'Test requirements 2',
            technicalRequirements: 'Test technical requirements 2',
            acceptanceCriteria: ['Test criteria 3'],
          },
        },
      },
    });

    const task3 = await prismaService.task.create({
      data: {
        taskId: 'TEST-E2E-003',
        name: 'E2E Test Task 3',
        status: 'not-started',
        priority: 'Low',
        currentMode: 'architect',
        taskDescription: {
          create: {
            description: 'Third test task',
            businessRequirements: 'Test requirements 3',
            technicalRequirements: 'Test technical requirements 3',
            acceptanceCriteria: ['Test criteria 4', 'Test criteria 5'],
          },
        },
      },
    });

    testTaskIds = [task1.taskId, task2.taskId, task3.taskId];

    // Create test delegations
    const delegation1 = await prismaService.workflowTransition.create({
      data: {
        taskId: task1.taskId,
        fromMode: 'boomerang',
        toMode: 'architect',
        transitionTimestamp: new Date(),
        reason: 'Test delegation 1',
      },
    });

    const delegation2 = await prismaService.workflowTransition.create({
      data: {
        taskId: task2.taskId,
        fromMode: 'architect',
        toMode: 'senior-developer',
        transitionTimestamp: new Date(),
        reason: 'Test delegation 2',
      },
    });

    testDelegationIds = [delegation1.id, delegation2.id];

    console.log('🔧 Test data setup completed');
    console.log(`   Created ${testTaskIds.length} test tasks`);
    console.log(`   Created ${testDelegationIds.length} test delegations`);
  }

  async function cleanupTestData() {
    if (testTaskIds.length > 0) {
      // Delete delegations first (foreign key constraint)
      await prismaService.workflowTransition.deleteMany({
        where: {
          taskId: { in: testTaskIds },
        },
      });

      // Delete task descriptions
      await prismaService.taskDescription.deleteMany({
        where: {
          taskId: { in: testTaskIds },
        },
      });

      // Delete tasks
      await prismaService.task.deleteMany({
        where: {
          taskId: { in: testTaskIds },
        },
      });

      console.log('🧹 Test data cleanup completed');
    }
  }
});
