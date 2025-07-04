import { Injectable } from '@nestjs/common';
import { InteractiveDashboardData } from '../../../shared/types/report-data.types';

/**
 * Enhanced Scripts Generator
 * Generates secure, efficient JavaScript with direct data interpolation
 * Eliminates window.dashboardData dependency for better security and performance
 */
@Injectable()
export class ScriptsGenerator {
  /**
   * Generate secure JavaScript with direct data interpolation
   */
  generateScripts(data: InteractiveDashboardData): string {
    return `
    <script>
        // Dashboard initialization with direct data interpolation
        document.addEventListener('DOMContentLoaded', function() {
            initializeDashboard();
        });
        
        function initializeDashboard() {
            initializeCharts();
            initializeInteractivity();
            initializeFilters();
            initializeAnimations();
        }
        
        function initializeCharts() {
            ${this.generateStatusChart(data.charts.statusDistribution)}
            ${this.generatePriorityChart(data.charts.priorityDistribution)}
            ${this.generateTrendsChart(data.charts.completionTrend)}
            ${this.generateRolePerformanceChart(data.charts.rolePerformance)}
        }
        
        function initializeInteractivity() {
            // Enhanced table filtering
            const taskSearch = document.getElementById('taskSearch');
            const statusFilter = document.getElementById('statusFilter');
            const priorityFilter = document.getElementById('priorityFilter');
            
            if (taskSearch) {
                taskSearch.addEventListener('input', filterTasks);
            }
            if (statusFilter) {
                statusFilter.addEventListener('change', filterTasks);
            }
            if (priorityFilter) {
                priorityFilter.addEventListener('change', filterTasks);
            }
            
            // Interactive card hover effects
            initializeCardHoverEffects();
            
            // Table row interactions
            initializeTableInteractions();
        }
        
        // Global filter functions for task filtering
        function filterTasks() {
            const searchTerm = document.getElementById('taskSearch')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            const priorityFilter = document.getElementById('priorityFilter')?.value || '';
            
            const tableRows = document.querySelectorAll('tbody tr[data-task-id]');
            
            tableRows.forEach(row => {
                const taskName = row.querySelector('h4')?.textContent.toLowerCase() || '';
                const statusBadge = row.querySelector('.status-badge')?.textContent || '';
                const priorityBadge = row.querySelector('.priority-badge')?.textContent || '';
                
                const matchesSearch = taskName.includes(searchTerm);
                const matchesStatus = !statusFilter || statusBadge.toLowerCase().includes(statusFilter.toLowerCase());
                const matchesPriority = !priorityFilter || priorityBadge.includes(priorityFilter);
                
                if (matchesSearch && matchesStatus && matchesPriority) {
                    row.style.display = '';
                    row.classList.add('fade-in');
                } else {
                    row.style.display = 'none';
                    row.classList.remove('fade-in');
                }
            });
            
            updateFilterStats();
        }
        
        function updateFilterStats() {
            const visibleRows = document.querySelectorAll('tbody tr[data-task-id]:not([style*="display: none"])').length;
            const totalRows = document.querySelectorAll('tbody tr[data-task-id]').length;
            
            const filterInfo = document.querySelector('.filter-info');
            if (filterInfo) {
                filterInfo.textContent = \`Showing \${visibleRows} of \${totalRows} tasks\`;
            }
        }
        
        function initializeFilters() {
            // Filters are initialized automatically through event listeners in initializeInteractivity
        }
        
        function initializeCardHoverEffects() {
            const metricCards = document.querySelectorAll('.metric-card');
            
            metricCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-4px) scale(1.02)';
                    this.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                    this.style.boxShadow = '';
                });
            });
        }
        
        function initializeTableInteractions() {
            // Enhanced row interactions with delegation flow visualization
            const delegationRows = document.querySelectorAll('tr[data-delegation-id]');
            
            delegationRows.forEach(row => {
                row.addEventListener('click', function() {
                    const delegationId = this.dataset.delegationId;
                    showDelegationDetails(delegationId);
                });
                
                // Highlight related workflow transitions
                row.addEventListener('mouseenter', function() {
                    const taskId = this.dataset.delegationId;
                    highlightRelatedDelegations(taskId);
                });
                
                row.addEventListener('mouseleave', function() {
                    clearDelegationHighlights();
                });
            });
            
            // Task row interactions
            const taskRows = document.querySelectorAll('tr[data-task-id]');
            
            taskRows.forEach(row => {
                row.addEventListener('click', function() {
                    const taskId = this.dataset.taskId;
                    showTaskDetails(taskId);
                });
            });
        }
        
        function initializeAnimations() {
            // Intersection Observer for scroll-triggered animations
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in-up');
                    }
                });
            }, observerOptions);
            
            // Observe all cards and tables
            document.querySelectorAll('.card, .metric-card, table').forEach(el => {
                observer.observe(el);
            });
            
            // Animate progress bars
            animateProgressBars();
        }
        
        function animateProgressBars() {
            const progressBars = document.querySelectorAll('.progress-bar');
            
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                
                setTimeout(() => {
                    bar.style.transition = 'width 1.5s ease-out';
                    bar.style.width = width;
                }, 200);
            });
        }
        
        // Utility functions for enhanced interactions
        function showDelegationDetails(delegationId) {
            // Enhanced delegation detail modal
            console.log('Showing delegation details for:', delegationId);
            // Implementation would connect to MCP workflow_operations
        }
        
        function showTaskDetails(taskId) {
            // Enhanced task detail modal
            console.log('Showing task details for:', taskId);
            // Implementation would connect to MCP query_task_context
        }
        
        function highlightRelatedDelegations(taskId) {
            const relatedRows = document.querySelectorAll(\`tr[data-delegation-id="\${taskId}"]\`);
            relatedRows.forEach(row => {
                row.classList.add('bg-yellow-50', 'border-yellow-200');
            });
        }
        
        function clearDelegationHighlights() {
            const highlightedRows = document.querySelectorAll('.bg-yellow-50');
            highlightedRows.forEach(row => {
                row.classList.remove('bg-yellow-50', 'border-yellow-200');
            });
        }
        
        // Enhanced MCP integration functions
        function refreshDashboard() {
            showRefreshingState();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        
        function showRefreshingState() {
            const refreshButton = document.querySelector('button[onclick="refreshDashboard()"]');
            if (refreshButton) {
                const originalText = refreshButton.innerHTML;
                refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Refreshing...';
                refreshButton.disabled = true;
                
                setTimeout(() => {
                    refreshButton.innerHTML = originalText;
                    refreshButton.disabled = false;
                }, 1000);
            }
        }
        
        function copyMcpCommand(type) {
            const commands = {
                'create-task': \`task_operations({
  operation: "create",
  taskData: {
    name: "New Task",
    priority: "Medium",
    status: "not-started"
  },
  description: {
    description: "Task description here",
    acceptanceCriteria: ["Criteria 1", "Criteria 2"]
  }
})\`,
                'query-tasks': \`query_task_context({
  includeLevel: "comprehensive",
  includePlans: true,
  includeSubtasks: true
})\`,
                'generate-report': \`generate_workflow_report({
  reportType: "interactive-dashboard",
  outputFormat: "html"
})\`,
                'delegate-task': \`workflow_operations({
  operation: "delegate",
  taskId: "TSK-ID",
  fromRole: "current-role",
  toRole: "target-role",
  message: "Delegation message"
})\`,
                'query-workflow': \`query_workflow_status({
  queryType: "current_assignments",
  currentRole: "role-name"
})\`
            };
            
            const command = commands[type];
            if (command) {
                navigator.clipboard.writeText(command).then(() => {
                    showToast('MCP command copied to clipboard!', 'success');
                }).catch(() => {
                    showToast('Failed to copy command', 'error');
                });
            }
        }
        
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            toast.className = \`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full \${
                type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
            }\`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.style.transform = 'translate-x-0';
            }, 100);
            
            // Animate out and remove
            setTimeout(() => {
                toast.style.transform = 'translate-x-full';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }
        
        // CSS animations
        const style = document.createElement('style');
        style.textContent = \`
            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }
            
            .animate-fade-in-up {
                animation: fadeInUp 0.6s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .metric-card {
                transition: all 0.3s ease;
            }
            
            .progress-bar {
                transition: width 0.3s ease;
            }
            
            .hover-scale:hover {
                transform: scale(1.05);
            }
            
            .hover-shadow:hover {
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            }
        \`;
        document.head.appendChild(style);
    </script>`;
  }

  /**
   * Generate status chart with direct data interpolation
   */
  private generateStatusChart(chartConfig: any): string {
    const labels = JSON.stringify(chartConfig.labels || []);
    const data = JSON.stringify(chartConfig.data || []);
    const colors = JSON.stringify(
      chartConfig.colors || [
        '#10B981',
        '#3B82F6',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
      ],
    );

    return `
            // Status Distribution Chart
            const statusChartEl = document.getElementById('statusChart');
            if (statusChartEl) {
                new Chart(statusChartEl, {
                    type: 'doughnut',
                    data: {
                        labels: ${labels},
                        datasets: [{
                            data: ${data},
                            backgroundColor: ${colors},
                            borderWidth: 3,
                            borderColor: '#ffffff',
                            hoverBorderWidth: 4,
                            hoverOffset: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#374151',
                                borderWidth: 1,
                                cornerRadius: 8,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                        return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                    }
                                }
                            }
                        },
                        animation: {
                            animateRotate: true,
                            duration: 1500,
                            easing: 'easeOutCubic'
                        }
                    }
                });
            }`;
  }

  /**
   * Generate priority chart with direct data interpolation
   */
  private generatePriorityChart(chartConfig: any): string {
    const labels = JSON.stringify(chartConfig.labels || []);
    const data = JSON.stringify(chartConfig.data || []);
    const colors = JSON.stringify(
      chartConfig.colors || ['#EF4444', '#F59E0B', '#10B981', '#6B7280'],
    );

    return `
            // Priority Distribution Chart
            const priorityChartEl = document.getElementById('priorityChart');
            if (priorityChartEl) {
                new Chart(priorityChartEl, {
                    type: 'polarArea',
                    data: {
                        labels: ${labels},
                        datasets: [{
                            data: ${data},
                            backgroundColor: ${colors},
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#374151',
                                borderWidth: 1,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            r: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                pointLabels: {
                                    color: '#6B7280',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 1500,
                            easing: 'easeOutCubic'
                        }
                    }
                });
            }`;
  }

  /**
   * Generate completion trends chart with direct data interpolation
   */
  private generateTrendsChart(chartConfig: any): string {
    const labels = JSON.stringify(chartConfig.labels || []);
    const data = JSON.stringify(chartConfig.data || []);

    return `
            // Completion Trends Chart
            const trendsChartEl = document.getElementById('completionTrendChart');
            if (trendsChartEl) {
                new Chart(trendsChartEl, {
                    type: 'line',
                    data: {
                        labels: ${labels},
                        datasets: [{
                            label: 'Tasks Completed',
                            data: ${data},
                            borderColor: '#3B82F6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#3B82F6',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 6,
                            pointHoverRadius: 8,
                            pointHoverBackgroundColor: '#1D4ED8',
                            pointHoverBorderColor: '#ffffff',
                            pointHoverBorderWidth: 3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#3B82F6',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    borderColor: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    borderColor: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 2000,
                            easing: 'easeOutCubic'
                        }
                    }
                });
            }`;
  }

  /**
   * Generate role performance chart with direct data interpolation
   */
  private generateRolePerformanceChart(chartConfig: any): string {
    const labels = JSON.stringify(chartConfig.labels || []);
    const data = JSON.stringify(chartConfig.data || []);
    const colors = JSON.stringify([
      '#8B5CF6',
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
    ]);

    return `
            // Role Performance Chart
            const roleChartEl = document.getElementById('rolePerformanceChart');
            if (roleChartEl) {
                new Chart(roleChartEl, {
                    type: 'bar',
                    data: {
                        labels: ${labels},
                        datasets: [{
                            label: 'Performance Score',
                            data: ${data},
                            backgroundColor: ${colors},
                            borderColor: ${colors},
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                            hoverBackgroundColor: ${colors}
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#8B5CF6',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11,
                                        weight: 'bold'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)',
                                    borderColor: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: '#6B7280',
                                    font: {
                                        size: 11
                                    },
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        },
                        animation: {
                            duration: 1500,
                            easing: 'easeOutCubic'
                        }
                    }
                });
            }`;
  }
}
