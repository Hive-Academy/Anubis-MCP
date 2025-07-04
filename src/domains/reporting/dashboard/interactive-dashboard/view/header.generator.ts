import { Injectable } from '@nestjs/common';

/**
 * Header Generator
 * Responsible for generating dashboard header section
 */
@Injectable()
export class HeaderGenerator {
  /**
   * Generate header section
   */
  generateHeader(title: string, subtitle?: string): string {
    return `
    <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-chart-line text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">${this.escapeHtml(title)}</h1>
                        <p class="text-sm text-gray-600">${subtitle ? this.escapeHtml(subtitle) : 'Real-time workflow analytics and insights'}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <button onclick="window.print()" class="btn-secondary">
                        <i class="fas fa-print mr-2"></i>
                        Print Report
                    </button>
                    <button onclick="refreshDashboard()" class="btn-primary">
                        <i class="fas fa-refresh mr-2"></i>
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    </header>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
