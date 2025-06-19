// src/task-workflow/task-workflow.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Reporting Module - Contains all reporting services and chart generation
import { ReportingModule } from './domains/reporting/reporting.module';

// Domain-Based Tool Modules - Rule-based workflow architecture
import { CoreWorkflowModule } from './domains/core-workflow/core-workflow.module';
import { WorkflowRulesModule } from './domains/workflow-rules/workflow-rules.module';
import { InitRulesModule } from './domains/init-rules/init-rules.module';

@Module({
  imports: [
    PrismaModule,
    ReportingModule, // All reporting services and MCP tools

    // Rule-based workflow architecture - clean and focused
    CoreWorkflowModule, // Internal task management services (NOT MCP tools)
    WorkflowRulesModule, // Rule-driven workflow MCP interface (8 tools)
    InitRulesModule, // Tool initialization for different AI agents
  ],

  exports: [
    // Export modules for potential external use
    ReportingModule,
    CoreWorkflowModule,
    WorkflowRulesModule,
    InitRulesModule,
  ],
})
export class TaskWorkflowModule {}
