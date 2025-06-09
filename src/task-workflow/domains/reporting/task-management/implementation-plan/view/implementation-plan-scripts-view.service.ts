import { Injectable, Logger } from '@nestjs/common';

/**
 * Implementation Plan Scripts View Service
 *
 * Focused service for generating JavaScript functionality for implementation plan reports.
 * Handles interactive features like filtering, progress tracking, and batch management
 * using vanilla JavaScript with Chart.js for visualizations.
 */
@Injectable()
export class ImplementationPlanScriptsViewService {
  private readonly logger = new Logger(
    ImplementationPlanScriptsViewService.name,
  );

  /**
   * Generate all JavaScript functionality for implementation plan reports
   */
  generateScripts(): string {
    return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Implementation Plan Report JavaScript Functionality
        document.addEventListener('DOMContentLoaded', function() {
            initializeImplementationPlanFeatures();
        });

        function initializeImplementationPlanFeatures() {
            initializeProgressChart();
            initializeBatchFiltering();
            initializeSubtaskToggle();
            initializePrintFunctionality();
            initializeTooltips();
        }

        /**
         * Initialize progress visualization chart
         */
        function initializeProgressChart() {
            const progressChartElement = document.getElementById('progressChart');
            if (!progressChartElement) return;

            const batches = document.querySelectorAll('[data-batch-id]');
            const batchData = Array.from(batches).map(batch => {
                const batchId = batch.getAttribute('data-batch-id');
                const subtasks = batch.querySelectorAll('[data-subtask-status]');
                const completed = batch.querySelectorAll('[data-subtask-status="completed"]').length;
                const total = subtasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return {
                    batchId: batchId,
                    progress: progress,
                    completed: completed,
                    total: total
                };
            });

            new Chart(progressChartElement, {
                type: 'bar',
                data: {
                    labels: batchData.map(b => b.batchId),
                    datasets: [{
                        label: 'Completion %',
                        data: batchData.map(b => b.progress),
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Batch Progress Overview'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }

        /**
         * Initialize batch filtering functionality
         */
        function initializeBatchFiltering() {
            const statusFilter = document.getElementById('statusFilter');
            if (!statusFilter) return;

            statusFilter.addEventListener('change', function() {
                const selectedStatus = this.value;
                filterBatchesByStatus(selectedStatus);
            });

            // Add filter controls if not present
            addFilterControls();
        }

        function addFilterControls() {
            const reportContainer = document.querySelector('.container');
            if (!reportContainer || document.getElementById('filterControls')) return;

            const filterHTML = \`
            <div id="filterControls" class="bg-white rounded-xl card-shadow p-4 mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Filter & Controls</h3>
                <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-48">
                        <label for="statusFilter" class="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                        <select id="statusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="all">All Statuses</option>
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="needs-changes">Needs Changes</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="toggleAllBatches()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-expand-arrows-alt mr-2"></i>
                            Toggle All
                        </button>
                    </div>
                    <div class="flex items-end">
                        <button onclick="window.print()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            <i class="fas fa-print mr-2"></i>
                            Print
                        </button>
                    </div>
                </div>
            </div>
            \`;

            const firstSection = reportContainer.querySelector('.bg-white');
            if (firstSection) {
                firstSection.insertAdjacentHTML('beforebegin', filterHTML);
                initializeBatchFiltering(); // Re-initialize after adding controls
            }
        }

        function filterBatchesByStatus(status) {
            const batches = document.querySelectorAll('[data-batch-id]');
            
            batches.forEach(batch => {
                if (status === 'all') {
                    batch.style.display = 'block';
                    return;
                }

                const subtasks = batch.querySelectorAll('[data-subtask-status]');
                const hasMatchingStatus = Array.from(subtasks).some(subtask => 
                    subtask.getAttribute('data-subtask-status') === status
                );

                batch.style.display = hasMatchingStatus ? 'block' : 'none';
            });

            updateFilterSummary(status);
        }

        function updateFilterSummary(status) {
            const visibleBatches = document.querySelectorAll('[data-batch-id]:not([style*="display: none"])');
            const totalBatches = document.querySelectorAll('[data-batch-id]');
            
            let summaryElement = document.getElementById('filterSummary');
            if (!summaryElement) {
                summaryElement = document.createElement('div');
                summaryElement.id = 'filterSummary';
                summaryElement.className = 'text-sm text-gray-600 mt-2';
                document.getElementById('filterControls').appendChild(summaryElement);
            }

            const statusText = status === 'all' ? 'all statuses' : status.replace('_', ' ');
            summaryElement.innerHTML = \`
                <i class="fas fa-info-circle mr-1"></i>
                Showing \${visibleBatches.length} of \${totalBatches.length} batches (filtered by: \${statusText})
            \`;
        }

        /**
         * Initialize subtask toggle functionality
         */
        function initializeSubtaskToggle() {
            const batchHeaders = document.querySelectorAll('[data-batch-id] h3');
            
            batchHeaders.forEach(header => {
                header.style.cursor = 'pointer';
                header.classList.add('hover:text-purple-600', 'transition-colors');
                
                header.addEventListener('click', function() {
                    const batch = this.closest('[data-batch-id]');
                    const subtaskContainer = batch.querySelector('.space-y-3');
                    
                    if (subtaskContainer) {
                        const isHidden = subtaskContainer.style.display === 'none';
                        subtaskContainer.style.display = isHidden ? 'block' : 'none';
                        
                        // Update toggle icon
                        const icon = this.querySelector('i');
                        if (icon) {
                            icon.className = isHidden ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                        } else {
                            // Add toggle icon if not present
                            this.innerHTML += \` <i class="fas fa-chevron-up text-sm ml-2"></i>\`;
                        }
                    }
                });
            });
        }

        function toggleAllBatches() {
            const subtaskContainers = document.querySelectorAll('[data-batch-id] .space-y-3');
            const anyVisible = Array.from(subtaskContainers).some(container => 
                container.style.display !== 'none'
            );

            subtaskContainers.forEach(container => {
                container.style.display = anyVisible ? 'none' : 'block';
            });

            // Update all toggle icons
            const icons = document.querySelectorAll('[data-batch-id] h3 i.fa-chevron-up, [data-batch-id] h3 i.fa-chevron-down');
            icons.forEach(icon => {
                icon.className = anyVisible ? 'fas fa-chevron-down text-sm ml-2' : 'fas fa-chevron-up text-sm ml-2';
            });
        }

        /**
         * Initialize print functionality with clean formatting
         */
        function initializePrintFunctionality() {
            const style = document.createElement('style');
            style.textContent = \`
                @media print {
                    #filterControls { display: none !important; }
                    .card-hover:hover { transform: none !important; box-shadow: none !important; }
                    .no-print { display: none !important; }
                    body { print-color-adjust: exact; }
                    .page-break { page-break-before: always; }
                }
            \`;
            document.head.appendChild(style);
        }

        /**
         * Initialize tooltips for enhanced UX
         */
        function initializeTooltips() {
            const tooltipElements = document.querySelectorAll('[data-tooltip]');
            
            tooltipElements.forEach(element => {
                element.addEventListener('mouseenter', function(e) {
                    showTooltip(e.target, e.target.getAttribute('data-tooltip'));
                });
                
                element.addEventListener('mouseleave', function() {
                    hideTooltip();
                });
            });
        }

        function showTooltip(element, text) {
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg';
            tooltip.textContent = text;
            
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
        }

        function hideTooltip() {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        }

        /**
         * Utility function to add data attributes to existing elements
         */
        function addDataAttributes() {
            // Add batch data attributes
            const batchContainers = document.querySelectorAll('.border.border-gray-200.rounded-xl');
            batchContainers.forEach((container, index) => {
                const batchTitle = container.querySelector('h3');
                if (batchTitle) {
                    const batchId = batchTitle.textContent.includes('Batch') 
                        ? \`batch-\${index + 1}\`
                        : \`batch-\${index + 1}\`;
                    container.setAttribute('data-batch-id', batchId);
                }
            });

            // Add subtask data attributes
            const subtaskContainers = document.querySelectorAll('.bg-gray-50.rounded-lg');
            subtaskContainers.forEach(container => {
                const statusSpan = container.querySelector('.inline-flex.items-center.px-2.py-1');
                if (statusSpan) {
                    const statusText = statusSpan.textContent.trim().toLowerCase().replace(' ', '-');
                    container.setAttribute('data-subtask-status', statusText);
                }
            });
        }

        // Initialize data attributes after DOM is ready
        setTimeout(addDataAttributes, 100);
    </script>`;
  }
}
