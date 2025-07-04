import { Injectable } from '@nestjs/common';

/**
 * Quick Actions Generator
 * Responsible for generating quick actions section
 */
@Injectable()
export class QuickActionsGenerator {
  /**
   * Generate quick actions section
   */
  generateQuickActions(): string {
    return `
    <div class="card">
        <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p class="text-sm text-gray-600 mt-1">Common MCP commands and operations</p>
        </div>
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onclick="copyMcpCommand('create-task')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-plus text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Create Task</div>
                            <div class="text-sm text-gray-500">Start new workflow task</div>
                        </div>
                    </div>
                </button>
                <button onclick="copyMcpCommand('query-tasks')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-search text-green-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Query Tasks</div>
                            <div class="text-sm text-gray-500">List and filter tasks</div>
                        </div>
                    </div>
                </button>
                <button onclick="copyMcpCommand('generate-report')" class="btn-secondary text-left p-4 h-auto">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-chart-bar text-purple-600"></i>
                        </div>
                        <div>
                            <div class="font-medium text-gray-900">Generate Report</div>
                            <div class="text-sm text-gray-500">Create workflow report</div>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </div>`;
  }
}
