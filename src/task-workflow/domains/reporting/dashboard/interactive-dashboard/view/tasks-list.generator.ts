import { Injectable } from '@nestjs/common';
import { TaskSummary } from '../../../shared/types/report-data.types';

/**
 * Enhanced Task Cards Generator
 * Creates modern card-based UI focusing on task details with subtasks
 * Moves away from table design to a more visual, hierarchical approach
 */
@Injectable()
export class TasksListGenerator {
  /**
   * Generate enhanced task cards grid with subtask details
   */
  generateTaskCards(tasks: TaskSummary[]): string {
    if (!tasks || tasks.length === 0) {
      return this.generateEmptyState();
    }

    return `
    <div class="space-y-6">
      <!-- Tasks Grid Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Active Tasks</h2>
          <p class="text-gray-600">Track progress and manage task workflows</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            ${tasks.length} Total Tasks
          </div>
          <div class="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            ${tasks.filter((t) => t.status === 'completed').length} Completed
          </div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Status:</label>
            <select id="statusFilter" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="needs-review">Needs Review</option>
              <option value="completed">Completed</option>
              <option value="needs-changes">Needs Changes</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Priority:</label>
            <select id="priorityFilter" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Search:</label>
            <input 
              type="text" 
              id="taskSearch" 
              placeholder="Search tasks..." 
              class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
        </div>
      </div>

      <!-- Task Cards Grid -->
      <div id="tasksGrid" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        ${tasks.map((task) => this.generateTaskCard(task)).join('')}
      </div>
    </div>`;
  }

  /**
   * Generate individual task card with rich details and subtasks
   */
  private generateTaskCard(task: TaskSummary): string {
    const statusConfig = this.getStatusConfig(task.status);
    const priorityConfig = this.getPriorityConfig(task.priority);
    const progressPercentage = this.calculateTaskProgress(task);

    return `
    <div class="task-card group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300" 
         data-status="${task.status}" 
         data-priority="${task.priority || ''}"
         data-task-name="${task.name.toLowerCase()}">
      
      <!-- Card Header -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                ${task.taskId}
              </span>
              ${priorityConfig.badge}
            </div>
            <h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              ${task.name}
            </h3>

          </div>
          ${statusConfig.badge}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="px-6 py-3 bg-gray-50">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="font-medium text-gray-700">Progress</span>
          <span class="text-gray-600">${progressPercentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-gradient-to-r ${statusConfig.progressColor} h-2 rounded-full transition-all duration-500" 
               style="width: ${progressPercentage}%"></div>
        </div>
      </div>

      <!-- Task Details -->
      <div class="p-6 space-y-4">
        
        <!-- Key Information -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Owner:</span>
            <div class="font-medium text-gray-900 mt-1">
              ${task.owner || 'Unassigned'}
            </div>
          </div>
          <div>
            <span class="text-gray-500">Created:</span>
            <div class="font-medium text-gray-900 mt-1">
              ${this.formatDate(task.createdAt)}
            </div>
          </div>
        </div>


        <!-- Subtasks Section -->
        ${this.generateSubtasksSection(task)}

        <!-- Task Actions -->
        <div class="pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between">
            <div class="flex space-x-2">
              ${this.generateMCPActions(task)}
            </div>
            <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  /**
   * Generate subtasks section with progress tracking
   */
  private generateSubtasksSection(task: TaskSummary): string {
    // Mock subtasks data - in real implementation, this would come from task relations
    const mockSubtasks = this.generateMockSubtasks(task);

    if (mockSubtasks.length === 0) {
      return `
      <div class="bg-blue-50 rounded-lg p-3">
        <div class="flex items-center text-sm text-blue-700">
          <i class="fas fa-info-circle mr-2"></i>
          No subtasks defined for this task
        </div>
      </div>`;
    }

    const completedSubtasks = mockSubtasks.filter((st) => st.completed).length;

    return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-900">Subtasks</h4>
        <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          ${completedSubtasks}/${mockSubtasks.length} completed
        </span>
      </div>
      
      <div class="space-y-2 max-h-32 overflow-y-auto">
        ${mockSubtasks.map((subtask) => this.generateSubtaskItem(subtask)).join('')}
      </div>
      
      ${
        mockSubtasks.length > 3
          ? `
      <button class="text-xs text-blue-600 hover:text-blue-800 w-full text-center py-1">
        View all ${mockSubtasks.length} subtasks
      </button>
      `
          : ''
      }
    </div>`;
  }

  /**
   * Generate individual subtask item
   */
  private generateSubtaskItem(subtask: any): string {
    return `
    <div class="flex items-center space-x-2 text-sm">
      <div class="flex-shrink-0">
        ${
          subtask.completed
            ? '<i class="fas fa-check-circle text-green-500"></i>'
            : '<i class="far fa-circle text-gray-400"></i>'
        }
      </div>
      <span class="flex-1 ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700'}">
        ${subtask.name}
      </span>
      ${
        subtask.duration
          ? `
      <span class="text-xs text-gray-400">${subtask.duration}</span>
      `
          : ''
      }
    </div>`;
  }

  /**
   * Generate MCP action buttons for task management
   */
  private generateMCPActions(task: TaskSummary): string {
    return `
    <div class="flex space-x-1">
      <button class="mcp-action px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              data-action="delegate" data-task-id="${task.taskId}">
        Delegate
      </button>
      <button class="mcp-action px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              data-action="update" data-task-id="${task.taskId}">
        Update
      </button>
      <button class="mcp-action px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
              data-action="plan" data-task-id="${task.taskId}">
        Plan
      </button>
    </div>`;
  }

  /**
   * Generate empty state when no tasks are available
   */
  private generateEmptyState(): string {
    return `
    <div class="text-center py-16">
      <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fas fa-tasks text-gray-400 text-2xl"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
      <p class="text-gray-600 mb-6 max-w-sm mx-auto">
        There are no tasks in the system yet. Create your first task to get started with workflow management.
      </p>
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
        Create First Task
      </button>
    </div>`;
  }

  /**
   * Calculate task progress based on subtasks or status
   */
  private calculateTaskProgress(task: TaskSummary): number {
    // Simple progress calculation based on status
    switch (task.status) {
      case 'not-started':
        return 0;
      case 'in-progress':
        return 40;
      case 'needs-review':
        return 75;
      case 'completed':
        return 100;
      case 'needs-changes':
        return 60;
      case 'paused':
        return 25;
      default:
        return 0;
    }
  }

  /**
   * Get status configuration with colors and badges
   */
  private getStatusConfig(status: string): {
    badge: string;
    progressColor: string;
  } {
    const configs = {
      'not-started': {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">Not Started</span>',
        progressColor: 'from-gray-400 to-gray-500',
      },
      'in-progress': {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">In Progress</span>',
        progressColor: 'from-blue-400 to-blue-500',
      },
      'needs-review': {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Needs Review</span>',
        progressColor: 'from-orange-400 to-orange-500',
      },
      completed: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Completed</span>',
        progressColor: 'from-green-400 to-green-500',
      },
      'needs-changes': {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Needs Changes</span>',
        progressColor: 'from-red-400 to-red-500',
      },
      paused: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">Paused</span>',
        progressColor: 'from-purple-400 to-purple-500',
      },
    };

    return configs[status as keyof typeof configs] || configs['not-started'];
  }

  /**
   * Get priority configuration with colors and badges
   */
  private getPriorityConfig(priority: string | null): { badge: string } {
    if (!priority) {
      return {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">Normal</span>',
      };
    }

    const configs = {
      Critical: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded flex items-center"><i class="fas fa-exclamation-triangle mr-1"></i>Critical</span>',
      },
      High: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">High</span>',
      },
      Medium: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Medium</span>',
      },
      Low: {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">Low</span>',
      },
    };

    return (
      configs[priority as keyof typeof configs] || {
        badge:
          '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">Normal</span>',
      }
    );
  }

  /**
   * Format date for display
   */
  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Generate mock subtasks for demonstration
   * In real implementation, this would come from actual subtask relations
   */
  private generateMockSubtasks(task: TaskSummary): any[] {
    // Generate mock subtasks based on task status and complexity
    const subtaskTemplates = [
      { name: 'Setup development environment', duration: '2h' },
      { name: 'Create database schema', duration: '4h' },
      { name: 'Implement core functionality', duration: '8h' },
      { name: 'Write unit tests', duration: '3h' },
      { name: 'Integration testing', duration: '2h' },
      { name: 'Code review', duration: '1h' },
      { name: 'Documentation update', duration: '1h' },
    ];

    // Simulate different numbers of subtasks based on task status
    let numSubtasks = 3;
    if (task.status === 'completed') numSubtasks = 5;
    if (task.status === 'in-progress') numSubtasks = 4;
    if (task.status === 'not-started') numSubtasks = 2;

    return subtaskTemplates.slice(0, numSubtasks).map((template, index) => ({
      ...template,
      completed:
        task.status === 'completed' ||
        (task.status === 'in-progress' && index < 2) ||
        (task.status === 'needs-review' && index < 3),
    }));
  }
}
