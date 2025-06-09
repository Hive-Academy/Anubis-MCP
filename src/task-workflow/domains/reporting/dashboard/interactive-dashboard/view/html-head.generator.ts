import { Injectable } from '@nestjs/common';

/**
 * HTML Head Generator
 * Responsible for generating HTML head section with required resources
 */
@Injectable()
export class HtmlHeadGenerator {
  /**
   * Generate complete HTML head section
   */
  generateHead(title: string): string {
    return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)} - Workflow Report</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    ${this.generateStyles()}`;
  }

  /**
   * Generate custom CSS styles
   */
  private generateStyles(): string {
    return `
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; }
        .card { @apply bg-white rounded-xl shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl; }
        .metric-card { @apply card p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-1; }
        .metric-value { @apply text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent; }
        .metric-label { @apply text-sm font-medium text-gray-600 uppercase tracking-wide; }
        .status-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium; }
        .status-completed { @apply bg-green-100 text-green-800; }
        .status-in-progress { @apply bg-blue-100 text-blue-800; }
        .status-needs-review { @apply bg-yellow-100 text-yellow-800; }
        .status-not-started { @apply bg-gray-100 text-gray-800; }
        .priority-high { @apply bg-red-100 text-red-800; }
        .priority-medium { @apply bg-yellow-100 text-yellow-800; }
        .priority-low { @apply bg-green-100 text-green-800; }
        .role-badge { @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800; }
        .btn { @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2; }
        .btn-primary { @apply btn text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500; }
        .btn-secondary { @apply btn text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500; }
    </style>`;
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
