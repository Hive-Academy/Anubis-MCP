import { Injectable, Logger } from '@nestjs/common';

/**
 * Implementation Plan Styles View Service
 *
 * Focused service for generating CSS styles for implementation plan reports.
 * Provides custom styling on top of Tailwind CSS for enhanced visual presentation,
 * animations, and print-friendly formatting specific to implementation plans.
 */
@Injectable()
export class ImplementationPlanStylesViewService {
  private readonly logger = new Logger(
    ImplementationPlanStylesViewService.name,
  );

  /**
   * Generate enhanced CSS styles for implementation plan reports
   */
  generateStyles(): string {
    return `
    <style>
        /* Implementation Plan Report Enhanced Styles */
        
        /* Base Typography and Layout */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Enhanced Gradient Backgrounds */
        .gradient-bg {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            position: relative;
            overflow: hidden;
        }

        .gradient-bg::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%);
            background-size: 20px 20px;
            opacity: 0.3;
        }

        /* Enhanced Card Styling */
        .card-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* Progress Bar Enhancements */
        .progress-bar {
            background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
            position: relative;
            overflow: hidden;
        }

        .progress-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        /* Plan-specific Glows and Effects */
        .plan-glow {
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
            transition: box-shadow 0.3s ease;
        }

        .plan-glow:hover {
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        /* Batch Container Enhancements */
        .batch-container {
            position: relative;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-left: 4px solid #8b5cf6;
        }

        .batch-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%);
            transition: width 0.3s ease;
        }

        .batch-container:hover::before {
            width: 8px;
        }

        /* Subtask Status Indicators */
        .subtask-status-not-started {
            background-color: #f3f4f6;
            color: #6b7280;
            border: 1px solid #d1d5db;
        }

        .subtask-status-in-progress {
            background-color: #dbeafe;
            color: #1d4ed8;
            border: 1px solid #93c5fd;
            animation: pulse 2s infinite;
        }

        .subtask-status-completed {
            background-color: #d1fae5;
            color: #059669;
            border: 1px solid #86efac;
        }

        .subtask-status-needs-changes {
            background-color: #fee2e2;
            color: #dc2626;
            border: 1px solid #fca5a5;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* Technical Decision Code Blocks */
        .tech-decision-block {
            background: linear-gradient(145deg, #1f2937 0%, #111827 100%);
            border-radius: 0.75rem;
            border: 1px solid #374151;
            position: relative;
            overflow: hidden;
        }

        .tech-decision-block::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
        }

        .tech-decision-block pre {
            color: #f9fafb;
            margin: 0;
            padding: 1.5rem;
            overflow-x: auto;
            font-size: 0.875rem;
            line-height: 1.6;
        }

        /* Strategic Guidance Styling */
        .strategic-guidance {
            background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%);
            border-left: 4px solid #10b981;
            position: relative;
        }

        .strategic-guidance::before {
            content: '💡';
            position: absolute;
            top: 1rem;
            right: 1rem;
            font-size: 1.5rem;
            opacity: 0.6;
        }

        /* File Path Styling */
        .file-path {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
        }

        .file-path:hover {
            background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
            border-color: #8b5cf6;
        }

        /* Chart Container Enhancements */
        .chart-container {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 1rem;
            padding: 1.5rem;
            border: 1px solid #e5e7eb;
            position: relative;
            overflow: hidden;
        }

        .chart-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
        }

        /* Filter Controls Styling */
        #filterControls {
            background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e5e7eb;
            backdrop-filter: blur(10px);
        }

        #filterControls select {
            background: white;
            border: 1px solid #d1d5db;
            transition: all 0.2s ease;
        }

        #filterControls select:focus {
            border-color: #8b5cf6;
            ring-color: rgba(139, 92, 246, 0.2);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        /* Button Enhancements */
        .btn-primary {
            background: linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%);
            border: 1px solid #7c3aed;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
        }

        .btn-primary::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
        }

        .btn-primary:hover::before {
            left: 100%;
        }

        /* Responsive Enhancements */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }

            .gradient-bg {
                padding: 1.5rem !important;
            }

            .grid {
                grid-template-columns: 1fr !important;
            }

            .flex {
                flex-direction: column !important;
                gap: 1rem !important;
            }

            .card-hover:hover {
                transform: none;
            }
        }

        /* Print Styles */
        @media print {
            body {
                background: white !important;
                font-size: 12px !important;
            }

            .container {
                max-width: none !important;
                padding: 0 !important;
            }

            .gradient-bg {
                background: #8b5cf6 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .card-shadow, .card-hover {
                box-shadow: none !important;
                border: 1px solid #e5e7eb !important;
            }

            .progress-bar::after {
                display: none !important;
            }

            #filterControls {
                display: none !important;
            }

            .batch-container {
                page-break-inside: avoid;
                margin-bottom: 1rem !important;
            }

            .chart-container {
                page-break-inside: avoid;
            }

            .no-print {
                display: none !important;
            }

            /* Ensure colors print correctly */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }

        /* Accessibility Enhancements */
        @media (prefers-reduced-motion: reduce) {
            .card-hover {
                transition: none !important;
            }

            .progress-bar::after {
                animation: none !important;
            }

            @keyframes shimmer {
                0%, 100% { opacity: 1; }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
            }
        }

        /* Dark mode support (optional) */
        @media (prefers-color-scheme: dark) {
            .tech-decision-block {
                background: linear-gradient(145deg, #0f172a 0%, #020617 100%);
                border-color: #1e293b;
            }

            .file-path {
                background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
                color: #f1f5f9;
                border-color: #334155;
            }
        }

        /* Focus styles for accessibility */
        button:focus, select:focus, input:focus {
            outline: 2px solid #8b5cf6 !important;
            outline-offset: 2px !important;
        }

        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(145deg, #7c3aed 0%, #6d28d9 100%);
        }
    </style>`;
  }
}
