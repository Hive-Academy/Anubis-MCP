import { Injectable } from '@nestjs/common';
import {
  InteractiveDashboardData,
  ChartConfiguration,
} from '../../../shared/types/report-data.types';

/**
 * Enhanced Charts Generator
 * Creates visually stunning, interactive charts with modern design and comprehensive data insights
 */
@Injectable()
export class ChartsGenerator {
  /**
   * Generate enhanced charts section with modern UI and comprehensive data visualization
   */
  generateChartsGrid(charts: InteractiveDashboardData['charts']): string {
    return `
    <div class="space-y-8 mb-8">
        <!-- Charts Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
            ${this.generateStatusChart(charts.statusDistribution)}
            ${this.generatePriorityChart(charts.priorityDistribution)}
        </div>

        <!-- Full-width Charts -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
            ${this.generateCompletionTrendChart(charts.completionTrend)}
            ${this.generateRolePerformanceChart(charts.rolePerformance)}
        </div>

        ${this.generateInsightsSummaryPanel(charts)}
    </div>`;
  }

  /**
   * Generate status distribution chart with enhanced UI
   */
  private generateStatusChart(chart: ChartConfiguration): string {
    return `
    <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-chart-pie text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Task Status Distribution</h3>
                        <p class="text-sm text-gray-600">Current workflow status breakdown</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span class="text-xs text-gray-500">Live Data</span>
                </div>
            </div>
        </div>
        <div class="p-6">
            <div class="relative h-64">
                <canvas id="${chart.id}" class="w-full h-full"></canvas>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-3">
                ${chart.labels
                  .map(
                    (label, index) =>
                      `<div class="flex items-center space-x-2 text-sm">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${chart.colors[index]}"></div>
                        <span class="text-gray-700">${label}: ${chart.data[index]}</span>
                      </div>`,
                  )
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate priority distribution chart with enhanced UI
   */
  private generatePriorityChart(chart: ChartConfiguration): string {
    const total = chart.data.reduce((a, b) => a + b, 0);

    return `
    <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Priority Distribution</h3>
                        <p class="text-sm text-gray-600">Task priority breakdown analysis</p>
                    </div>
                </div>
                <div class="text-xs text-gray-500 bg-white rounded-full px-3 py-1 border">
                    ${total} Total
                </div>
            </div>
        </div>
        <div class="p-6">
            <div class="relative h-64">
                <canvas id="${chart.id}" class="w-full h-full"></canvas>
            </div>
            <div class="mt-4 space-y-2">
                ${chart.labels
                  .map((label, index) => {
                    const percentage =
                      total > 0
                        ? ((chart.data[index] / total) * 100).toFixed(1)
                        : '0';
                    return `<div class="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div class="flex items-center space-x-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${chart.colors[index]}"></div>
                        <span class="text-sm font-medium text-gray-700">${label}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-900">${chart.data[index]}</span>
                        <span class="text-xs text-gray-500">(${percentage}%)</span>
                      </div>
                    </div>`;
                  })
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate completion trend chart with enhanced UI
   */
  private generateCompletionTrendChart(chart: ChartConfiguration): string {
    const maxValue = Math.max(...chart.data);
    const avgValue =
      chart.data.length > 0
        ? (chart.data.reduce((a, b) => a + b, 0) / chart.data.length).toFixed(1)
        : '0';
    const totalValue = chart.data.reduce((a, b) => a + b, 0);

    return `
    <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-chart-line text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Completion Trend</h3>
                        <p class="text-sm text-gray-600">Task completion velocity over time</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 text-xs text-emerald-600 bg-emerald-100 rounded-full px-3 py-1">
                    <i class="fas fa-arrow-up"></i>
                    <span>Trending Up</span>
                </div>
            </div>
        </div>
        <div class="p-6">
            <div class="relative h-64">
                <canvas id="${chart.id}" class="w-full h-full"></canvas>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4">
                <div class="text-center p-3 bg-emerald-50 rounded-lg">
                    <div class="text-lg font-bold text-emerald-700">${maxValue}</div>
                    <div class="text-xs text-emerald-600">Peak Velocity</div>
                </div>
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-lg font-bold text-blue-700">${avgValue}</div>
                    <div class="text-xs text-blue-600">Average Rate</div>
                </div>
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                    <div class="text-lg font-bold text-purple-700">${totalValue}</div>
                    <div class="text-xs text-purple-600">Total Completed</div>
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate role performance chart with enhanced UI
   */
  private generateRolePerformanceChart(chart: ChartConfiguration): string {
    const maxScore = Math.max(...chart.data);

    return `
    <div class="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-users text-white text-sm"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Role Performance</h3>
                        <p class="text-sm text-gray-600">Team efficiency and workload distribution</p>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${chart.labels.length} Active Roles
                </div>
            </div>
        </div>
        <div class="p-6">
            <div class="relative h-64">
                <canvas id="${chart.id}" class="w-full h-full"></canvas>
            </div>
            <div class="mt-4 space-y-2">
                ${chart.labels
                  .map((label, index) => {
                    const score = chart.data[index];
                    const percentage =
                      maxScore > 0
                        ? ((score / maxScore) * 100).toFixed(0)
                        : '0';
                    return `<div class="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style="background-color: ${chart.colors[index]}">
                          ${label.charAt(0).toUpperCase()}
                        </div>
                        <span class="text-sm font-medium text-gray-700 capitalize">${label.replace('-', ' ')}</span>
                      </div>
                      <div class="flex items-center space-x-3">
                        <div class="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-1000" style="width: ${percentage}%; background-color: ${chart.colors[index]}"></div>
                        </div>
                        <span class="text-sm font-bold text-gray-900 w-8 text-right">${score}</span>
                      </div>
                    </div>`;
                  })
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate insights summary panel
   */
  private generateInsightsSummaryPanel(
    charts: InteractiveDashboardData['charts'],
  ): string {
    // Extract insights from data
    const maxPriorityIndex = charts.priorityDistribution.data.indexOf(
      Math.max(...charts.priorityDistribution.data),
    );
    const maxRoleIndex = charts.rolePerformance.data.indexOf(
      Math.max(...charts.rolePerformance.data),
    );

    const completedIndex = charts.statusDistribution.labels.findIndex((label) =>
      label.toLowerCase().includes('completed'),
    );
    const inProgressIndex = charts.statusDistribution.labels.findIndex(
      (label) => label.toLowerCase().includes('progress'),
    );

    const completedTasks =
      completedIndex >= 0 ? charts.statusDistribution.data[completedIndex] : 0;
    const inProgressTasks =
      inProgressIndex >= 0
        ? charts.statusDistribution.data[inProgressIndex]
        : 0;

    const trendData = charts.completionTrend.data;
    const isIncreasing =
      trendData.length >= 2 &&
      trendData[trendData.length - 1] > trendData[trendData.length - 2];

    return `
    <div class="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-bar text-gray-900 text-sm"></i>
            </div>
            <div>
                <h3 class="text-lg font-semibold">Data Insights Summary</h3>
                <p class="text-sm text-gray-300">Key patterns and recommendations from your workflow data</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                <div class="flex items-center space-x-2 mb-2">
                    <i class="fas fa-bullseye text-yellow-400"></i>
                    <span class="text-sm font-medium">Focus Area</span>
                </div>
                <p class="text-xs text-gray-300">
                    ${charts.priorityDistribution.labels[maxPriorityIndex]} priority tasks dominate workload
                </p>
            </div>
            
            <div class="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                <div class="flex items-center space-x-2 mb-2">
                    <i class="fas fa-trending-up text-green-400"></i>
                    <span class="text-sm font-medium">Trend</span>
                </div>
                <p class="text-xs text-gray-300">
                    Completion velocity ${isIncreasing ? 'increasing' : 'stable'}
                </p>
            </div>
            
            <div class="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                <div class="flex items-center space-x-2 mb-2">
                    <i class="fas fa-crown text-purple-400"></i>
                    <span class="text-sm font-medium">Top Performer</span>
                </div>
                <p class="text-xs text-gray-300">
                    ${charts.rolePerformance.labels[maxRoleIndex].replace('-', ' ')} role leading efficiency
                </p>
            </div>
            
            <div class="bg-white bg-opacity-10 rounded-xl p-4 backdrop-blur-sm">
                <div class="flex items-center space-x-2 mb-2">
                    <i class="fas fa-balance-scale text-blue-400"></i>
                    <span class="text-sm font-medium">Balance</span>
                </div>
                <p class="text-xs text-gray-300">
                    ${completedTasks > inProgressTasks ? 'Healthy completion ratio' : 'High work in progress'}
                </p>
            </div>
        </div>
    </div>`;
  }
}
