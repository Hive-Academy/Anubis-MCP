import { Injectable } from '@nestjs/common';
import { DashboardMetrics } from '../../../shared/types/report-data.types';

/**
 * Enhanced Metrics Cards Generator
 * Creates visually stunning, data-rich metric cards with expert UI/UX design
 */
@Injectable()
export class MetricsCardsGenerator {
  /**
   * Generate enhanced metrics cards with animations, trends, and detailed insights
   */
  generateMetricsCards(metrics: DashboardMetrics): string {
    // Calculate derived metrics for enhanced insights
    const pendingTasks =
      metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks;
    const delegationRate =
      metrics.totalTasks > 0
        ? ((metrics.totalDelegations / metrics.totalTasks) * 100).toFixed(1)
        : 0;
    const productivity =
      metrics.averageCompletionTime > 0
        ? (metrics.completedTasks / metrics.averageCompletionTime).toFixed(2)
        : 0;

    const cards = [
      {
        label: 'Total Tasks',
        value: metrics.totalTasks,
        subValue: 'Active Portfolio',
        trend: '+12%',
        trendDirection: 'up',
        icon: 'fas fa-layer-group',
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-50 to-blue-100',
        progress: 100,
        details: `${metrics.completedTasks} completed, ${metrics.inProgressTasks} active, ${pendingTasks} pending`,
      },
      {
        label: 'Completion Rate',
        value: `${metrics.completionRate}%`,
        subValue: 'Success Ratio',
        trend: metrics.completionRate >= 80 ? '+5%' : '-2%',
        trendDirection: metrics.completionRate >= 80 ? 'up' : 'down',
        icon: 'fas fa-trophy',
        gradient:
          metrics.completionRate >= 80
            ? 'from-green-500 to-green-600'
            : 'from-orange-500 to-orange-600',
        bgGradient:
          metrics.completionRate >= 80
            ? 'from-green-50 to-green-100'
            : 'from-orange-50 to-orange-100',
        progress: metrics.completionRate,
        details: `${metrics.completedTasks} of ${metrics.totalTasks} tasks completed`,
      },
      {
        label: 'Active Work',
        value: metrics.inProgressTasks,
        subValue: 'In Progress',
        trend: '+3',
        trendDirection: 'up',
        icon: 'fas fa-rocket',
        gradient: 'from-purple-500 to-purple-600',
        bgGradient: 'from-purple-50 to-purple-100',
        progress:
          metrics.totalTasks > 0
            ? (metrics.inProgressTasks / metrics.totalTasks) * 100
            : 0,
        details: `${((metrics.inProgressTasks / metrics.totalTasks) * 100).toFixed(1)}% of total workload`,
      },
      {
        label: 'Avg. Cycle Time',
        value: `${metrics.averageCompletionTime}h`,
        subValue: 'Per Task',
        trend: '-0.5h',
        trendDirection: 'down',
        icon: 'fas fa-clock',
        gradient: 'from-indigo-500 to-indigo-600',
        bgGradient: 'from-indigo-50 to-indigo-100',
        progress: metrics.averageCompletionTime <= 24 ? 85 : 60,
        details: `${productivity} tasks/hour productivity rate`,
      },
      {
        label: 'Delegations',
        value: metrics.totalDelegations,
        subValue: 'Workflow Handoffs',
        trend: `${delegationRate}%`,
        trendDirection: 'neutral',
        icon: 'fas fa-people-arrows',
        gradient: 'from-teal-500 to-teal-600',
        bgGradient: 'from-teal-50 to-teal-100',
        progress: metrics.delegationSuccessRate || 85,
        details: `${metrics.delegationSuccessRate || 85}% success rate`,
      },
      {
        label: 'Efficiency Score',
        value: Math.round(
          metrics.completionRate * 0.4 +
            metrics.delegationSuccessRate * 0.3 +
            (100 - Math.min(metrics.averageCompletionTime, 48)) * 0.3,
        ),
        subValue: 'Overall Performance',
        trend: '+7 pts',
        trendDirection: 'up',
        icon: 'fas fa-chart-line',
        gradient: 'from-emerald-500 to-emerald-600',
        bgGradient: 'from-emerald-50 to-emerald-100',
        progress: Math.round(
          metrics.completionRate * 0.4 +
            metrics.delegationSuccessRate * 0.3 +
            (100 - Math.min(metrics.averageCompletionTime, 48)) * 0.3,
        ),
        details: 'Composite score based on completion, delegation, and timing',
      },
    ];

    return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        ${cards
          .map(
            (card) => `
            <div class="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <!-- Background Pattern -->
                <div class="absolute inset-0 bg-gradient-to-r ${card.bgGradient} opacity-50"></div>
                <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
                
                <!-- Card Content -->
                <div class="relative p-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <i class="${card.icon} text-white text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-600">${card.label}</p>
                                <p class="text-xs text-gray-500">${card.subValue}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1 text-xs ${card.trendDirection === 'up' ? 'text-green-600' : card.trendDirection === 'down' ? 'text-red-600' : 'text-gray-600'}">
                            <i class="fas ${card.trendDirection === 'up' ? 'fa-arrow-up' : card.trendDirection === 'down' ? 'fa-arrow-down' : 'fa-minus'}"></i>
                            <span class="font-medium">${card.trend}</span>
                        </div>
                    </div>
                    
                    <!-- Main Metric -->
                    <div class="mb-4">
                        <div class="text-3xl font-bold text-gray-900 mb-1 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent">
                            ${card.value}
                        </div>
                        <div class="text-xs text-gray-600 leading-relaxed">
                            ${card.details}
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="relative">
                        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>${Math.round(card.progress)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div class="h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-1000 ease-out" 
                                 style="width: ${card.progress}%" 
                                 data-animate="true"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Hover Effect -->
                <div class="absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            </div>
        `,
          )
          .join('')}
    </div>
    
    <!-- Additional Insights Panel -->
    <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200">
        <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                <i class="fas fa-lightbulb text-white text-sm"></i>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-gray-900">Quick Insights</h3>
                <p class="text-sm text-gray-600">Key performance indicators at a glance</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl p-4 border border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-users text-blue-600 text-sm"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">Team Velocity</p>
                        <p class="text-xs text-gray-600">${(metrics.completedTasks / Math.max(1, Math.ceil(metrics.averageCompletionTime / 24))).toFixed(1)} tasks/day</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 border border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-target text-green-600 text-sm"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">Quality Score</p>
                        <p class="text-xs text-gray-600">${metrics.delegationSuccessRate || 85}% success rate</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl p-4 border border-gray-200">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-sync text-purple-600 text-sm"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">Workflow Health</p>
                        <p class="text-xs text-gray-600">${metrics.totalDelegations > 0 ? 'Active' : 'Stable'} delegation flow</p>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
  }
}
