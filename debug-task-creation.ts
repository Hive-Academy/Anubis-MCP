import { PrismaClient } from '@prisma/client';
import { TaskOperationsService } from './src/domains/core-workflow/task-operations.service';
import { PrismaService } from './src/prisma/prisma.service';

// Debug script to test task creation with exact payload
async function debugTaskCreation() {
  const prisma = new PrismaService();
  const taskService = new TaskOperationsService(prisma);

  // Exact payload that was being sent to MCP
  const testPayload = {
    operation: 'create_task',
    executionId: 'cmcvoerok0001mtkc7l6o9m9y',
    taskData: {
      name: 'Implement Prisma Repository Pattern Enhancements',
      status: 'not-started',
      priority: 'High',
      gitBranch: 'feature/prisma-repository-pattern-enhancements',
    },
    description: {
      description:
        'Enhance the existing Prisma-based data access layer by implementing a comprehensive Repository Pattern with advanced features including generic base repositories, transaction management, caching strategies, and improved error handling to increase code maintainability and testability.',
      businessRequirements:
        'Improve code maintainability and testability of data access layer while maintaining existing functionality and performance standards.',
      technicalRequirements:
        'Implement Repository Pattern with generic base classes, transaction support, caching mechanisms, and comprehensive error handling using existing Prisma ORM infrastructure.',
      acceptanceCriteria: [
        'Generic BaseRepository class implemented with CRUD operations',
        'Transaction management integrated across repository methods',
        'Caching strategy implemented for frequently accessed data',
        'Comprehensive error handling with custom exceptions',
        'Unit tests covering all repository methods with 80%+ coverage',
        'Integration tests validating database operations',
        'Documentation updated with usage examples and patterns',
        'Existing functionality preserved without breaking changes',
      ],
    },
    codebaseAnalysis: {
      architectureFindings: {
        patterns: [
          'Domain-Driven Design',
          'MCP-compliant guidance architecture',
          'Database-driven workflow intelligence',
          'Clean Architecture with dependency injection',
        ],
        techStack: {
          backend: 'NestJS v11.0.1 with TypeScript',
          database: 'Prisma ORM v6.9.0 with SQLite/PostgreSQL',
          validation: 'Zod v3.24.4',
          mcpIntegration: '@rekog/mcp-nest v1.5.2',
          package: '@hive-academy/anubis v1.0.15',
        },
        fileStructure: {
          domains:
            'workflow-rules (MCP interface), core-workflow (business logic), reporting (analytics)',
          architecture:
            'Three-domain structure with clear separation of concerns',
        },
        dependencies: [
          'NestJS framework',
          'Prisma ORM',
          'Zod validation',
          'MCP protocol compliance',
        ],
        designPrinciples: [
          'Domain-driven design',
          'Clean Architecture',
          'Dependency injection',
          'MCP guidance-only architecture',
        ],
      },
      implementationContext: {
        existingPatterns: [
          'Service Layer Pattern',
          'Dependency Injection',
          'Database-driven intelligence',
          'MCP tool implementations',
        ],
        codingStandards: [
          'TypeScript strict mode',
          'ESLint + Prettier',
          'Comprehensive type checking',
          'Zod parameter validation',
        ],
        qualityGuidelines: [
          '75% test coverage requirement',
          'Enterprise-grade scalability',
          'Protocol compliance',
          'Proper error handling',
        ],
        testingApproach: 'Jest testing with unit and integration tests',
      },
      qualityAssessment: {
        codeQuality: {
          score: 8,
          metrics: {
            typescript: 'Strict mode enabled',
            validation: 'Comprehensive Zod schemas',
            architecture: 'Well-structured domains',
          },
        },
        testCoverage: {
          percentage: 75,
          areas: ['MCP operations', 'Service layer', 'Database operations'],
          gaps: ['Repository pattern implementation needed'],
        },
        documentation: {
          quality: 'good',
          coverage: [
            'Technical architecture',
            'Developer guide',
            'Project overview',
          ],
          missing: ['Repository pattern documentation'],
        },
      },
      filesCovered: [
        'src/domains/workflow-rules',
        'src/domains/core-workflow',
        'src/domains/reporting',
        'prisma/schema.prisma',
        'memory-bank documentation',
      ],
      technologyStack: {
        backend: {
          NestJS: 'v11.0.1',
          TypeScript: 'Latest',
          Prisma: 'v6.9.0',
        },
        validation: {
          Zod: 'v3.24.4',
        },
        integration: {
          MCP: '@rekog/mcp-nest v1.5.2',
        },
        database: {
          SQLite: 'Default',
          PostgreSQL: 'Production support',
        },
      },
      analyzedBy: 'Anubis Workflow System',
    },
  };

  try {
    console.log('🔍 Testing task creation with payload:');
    console.log(JSON.stringify(testPayload, null, 2));

    console.log('\n📝 Calling executeTaskOperation...');
    const result = await taskService.executeTaskOperation(testPayload as any);

    console.log('✅ Task created successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error creating task:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.code) {
      console.error('Error code:', error.code);
    }

    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugTaskCreation().catch(console.error);
