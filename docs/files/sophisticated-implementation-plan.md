# 🚀 **Sophisticated Implementation Plan: Project Intelligence System**

## 🎯 **Implementation Overview**

Transform your MCP server into an **intelligent, project-aware guidance system** using your collaborative intelligence architecture with enhanced database capabilities.

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agent      │    │   MCP Server    │    │  Hybrid DB      │
│   (Cursor)      │    │   (Anubis)      │    │   Storage       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Analyze Code  │───▶│ • Store Context │───▶│ • PostgreSQL    │
│ • Research      │    │ • Vector Index  │    │ • Qdrant        │
│ • Pattern Detect│◀───│ • Smart Guidance│◀───│ • Embeddings    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📋 **8-Week Implementation Roadmap**

### **🏗️ Phase 1: Foundation & Database (Week 1-2)**

#### **Week 1: Database Architecture Setup**

##### **Day 1-2: Hybrid Database Setup**
```bash
# 1. Add Qdrant to your development environment
docker run -d \
  --name anubis-qdrant \
  -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# 2. Install vector database dependencies
npm install @qdrant/js-client-rest openai dotenv
npm install --save-dev @types/node

# 3. Update environment variables
echo "QDRANT_URL=http://localhost:6333" >> .env
echo "OPENAI_API_KEY=your_openai_key" >> .env
```

##### **Day 3-4: Enhanced Database Schema**
```prisma
// Add to your existing schema.prisma

// Enhanced project intelligence storage
model ProjectIntelligence {
  id                    Int      @id @default(autoincrement())
  projectPath           String   @unique
  projectName           String?
  
  // Basic project information (from your design)
  projectOverview       Json     @default("{}")  // store_project_overview data
  architecturalAnalysis Json     @default("{}")  // store_architectural_analysis data
  codePatterns          Json     @default("{}")  // store_code_patterns data
  roleBehavioralContexts Json    @default("{}")  // store_role_behavioral_context data
  
  // 🆕 Enhanced intelligence fields
  techStackFingerprint  String?  // Unique identifier for tech stack combination
  vectorCollectionId    String?  // Reference to Qdrant collection
  embeddingVersion      String   @default("v1")
  intelligenceScore     Float    @default(0.0)   // Quality/completeness score
  
  // Research and best practices
  researchResults       Json     @default("{}")  // Research findings from AI agent
  bestPracticesLibrary  Json     @default("[]")  // Curated best practices
  optimizationSuggestions Json   @default("[]")  // Performance/quality improvements
  
  // Usage analytics
  guidanceRequestCount  Int      @default(0)     // How often guidance is requested
  lastAccessedAt        DateTime @default(now())
  
  // Metadata
  analysisVersion       String   @default("1.0")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([projectPath])
  @@index([techStackFingerprint])
  @@index([intelligenceScore])
  @@map("project_intelligence")
}

// Best practices knowledge base
model IntelligenceBestPractice {
  id                    Int      @id @default(autoincrement())
  
  // Practice identification
  name                  String
  category              String   // "architecture", "performance", "security", "testing"
  subcategory           String?  // "authentication", "caching", "validation"
  
  // Tech stack applicability
  frameworks            Json     @default("[]")  // ["NestJS", "React"]
  languages             Json     @default("[]")  // ["TypeScript", "JavaScript"]
  projectTypes          Json     @default("[]")  // ["MCP Server", "API", "SPA"]
  
  // Practice content
  description           String
  rationale             String   // Why this practice is important
  implementation        Json     // Step-by-step implementation guide
  codeExamples          Json     @default("[]")  // Code examples
  antiPatterns          Json     @default("[]")  // What to avoid
  
  // Applicability rules
  roleRelevance         Json     @default("{}")  // Which roles should know this
  complexityLevel       String   @default("medium") // "basic", "medium", "advanced"
  prerequisites         Json     @default("[]")  // Required knowledge/setup
  
  // Quality metrics
  effectivenessScore    Float    @default(0.8)
  adoptionDifficulty    String   @default("medium") // "easy", "medium", "hard"
  impactLevel           String   @default("medium") // "low", "medium", "high"
  
  // Sources and validation
  sources               Json     @default("[]")  // Research sources
  lastValidated         DateTime @default(now())
  validationStatus      String   @default("pending") // "pending", "validated", "outdated"
  
  // Vector search reference
  vectorId              String?  // Reference to vector embedding
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([category, subcategory])
  @@index([frameworks])
  @@index([effectivenessScore])
  @@map("intelligence_best_practices")
}

// Context retrieval analytics
model ContextRetrievalLog {
  id                    Int      @id @default(autoincrement())
  
  // Request context
  projectPath           String
  requestType           String   // "task_creation", "guidance_request", "best_practices"
  queryText             String   // Original query or task description
  roleContext           String?  // Which role made the request
  
  // Retrieval results
  vectorResults         Json     @default("[]")  // Similarity search results
  selectedContext       Json     @default("{}")  // Context actually used
  responseTime          Int?     // Response time in milliseconds
  
  // Quality metrics
  relevanceScore        Float?   // How relevant was the retrieved context
  userSatisfaction      Float?   // If available, user satisfaction rating
  
  createdAt             DateTime @default(now())
  
  @@index([projectPath])
  @@index([requestType])
  @@index([createdAt])
  @@map("context_retrieval_logs")
}
```

##### **Day 5: Vector Database Service**
```typescript
// src/task-workflow/domains/intelligence/services/vector-database.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

@Injectable()
export class VectorDatabaseService {
  private readonly logger = new Logger(VectorDatabaseService.name);
  private qdrant: QdrantClient;
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.qdrant = new QdrantClient({
      url: configService.get('QDRANT_URL', 'http://localhost:6333'),
    });
    
    this.openai = new OpenAI({
      apiKey: configService.get('OPENAI_API_KEY'),
    });
    
    this.initializeCollections();
  }

  private async initializeCollections() {
    try {
      // Create collections if they don't exist
      await this.ensureCollection('project_contexts', 1536); // OpenAI embedding size
      await this.ensureCollection('best_practices', 1536);
      await this.ensureCollection('code_patterns', 1536);
      
      this.logger.log('Vector database collections initialized');
    } catch (error) {
      this.logger.error('Failed to initialize vector collections', error);
    }
  }

  private async ensureCollection(name: string, vectorSize: number) {
    try {
      await this.qdrant.getCollection(name);
    } catch (error) {
      // Collection doesn't exist, create it
      await this.qdrant.createCollection(name, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
      this.logger.log(`Created collection: ${name}`);
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Faster and cheaper
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Failed to create embedding', error);
      throw error;
    }
  }

  async storeProjectContext(data: {
    projectId: string;
    projectPath: string;
    techStack: string[];
    patterns: string[];
    projectType: string;
    description: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      // Create embedding text
      const embeddingText = [
        data.projectType,
        ...data.techStack,
        ...data.patterns,
        data.description,
      ].join(' ');
      
      const vector = await this.createEmbedding(embeddingText);
      
      await this.qdrant.upsert('project_contexts', {
        wait: true,
        points: [{
          id: data.projectId,
          vector,
          payload: {
            projectPath: data.projectPath,
            techStack: data.techStack,
            patterns: data.patterns,
            projectType: data.projectType,
            description: data.description,
            ...data.metadata,
            indexed_at: new Date().toISOString(),
          },
        }],
      });
      
      this.logger.debug(`Stored project context: ${data.projectPath}`);
    } catch (error) {
      this.logger.error('Failed to store project context', error);
      throw error;
    }
  }

  async storeBestPractice(data: {
    practiceId: string;
    name: string;
    category: string;
    description: string;
    frameworks: string[];
    implementation: string[];
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const embeddingText = [
        data.name,
        data.category,
        data.description,
        ...data.frameworks,
        ...data.implementation,
      ].join(' ');
      
      const vector = await this.createEmbedding(embeddingText);
      
      await this.qdrant.upsert('best_practices', {
        wait: true,
        points: [{
          id: data.practiceId,
          vector,
          payload: {
            name: data.name,
            category: data.category,
            description: data.description,
            frameworks: data.frameworks,
            implementation: data.implementation,
            ...data.metadata,
            indexed_at: new Date().toISOString(),
          },
        }],
      });
      
      this.logger.debug(`Stored best practice: ${data.name}`);
    } catch (error) {
      this.logger.error('Failed to store best practice', error);
      throw error;
    }
  }

  async findSimilarProjects(query: {
    techStack: string[];
    projectType: string;
    taskContext?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const searchText = [
        query.projectType,
        ...query.techStack,
        query.taskContext || '',
      ].join(' ');
      
      const queryVector = await this.createEmbedding(searchText);
      
      const searchResult = await this.qdrant.search('project_contexts', {
        vector: queryVector,
        limit: query.limit || 5,
        with_payload: true,
        score_threshold: 0.7, // Only return good matches
      });
      
      return searchResult.map(result => ({
        ...result.payload,
        similarity_score: result.score,
      }));
    } catch (error) {
      this.logger.error('Failed to find similar projects', error);
      return [];
    }
  }

  async findRelevantBestPractices(query: {
    category?: string;
    frameworks: string[];
    taskType?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const searchText = [
        query.category || '',
        ...query.frameworks,
        query.taskType || '',
      ].join(' ');
      
      const queryVector = await this.createEmbedding(searchText);
      
      const filter: any = {
        must: [],
      };
      
      // Add framework filter
      if (query.frameworks.length > 0) {
        filter.must.push({
          key: 'frameworks',
          match: { any: query.frameworks },
        });
      }
      
      // Add category filter if specified
      if (query.category) {
        filter.must.push({
          key: 'category',
          match: { value: query.category },
        });
      }
      
      const searchResult = await this.qdrant.search('best_practices', {
        vector: queryVector,
        filter: filter.must.length > 0 ? filter : undefined,
        limit: query.limit || 5,
        with_payload: true,
        score_threshold: 0.6,
      });
      
      return searchResult.map(result => ({
        ...result.payload,
        relevance_score: result.score,
      }));
    } catch (error) {
      this.logger.error('Failed to find relevant best practices', error);
      return [];
    }
  }

  async getCollectionStats(): Promise<Record<string, any>> {
    try {
      const collections = ['project_contexts', 'best_practices', 'code_patterns'];
      const stats: Record<string, any> = {};
      
      for (const collection of collections) {
        try {
          const info = await this.qdrant.getCollection(collection);
          stats[collection] = {
            vectors_count: info.vectors_count,
            indexed_vectors_count: info.indexed_vectors_count,
            points_count: info.points_count,
          };
        } catch (error) {
          stats[collection] = { error: 'Collection not found or inaccessible' };
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error('Failed to get collection stats', error);
      return {};
    }
  }
}
```

#### **Week 2: Core Intelligence Services**

##### **Day 1-2: Project Intelligence Service**
```typescript
// src/task-workflow/domains/intelligence/services/project-intelligence.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { VectorDatabaseService } from './vector-database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectIntelligenceService {
  private readonly logger = new Logger(ProjectIntelligenceService.name);

  constructor(
    private prisma: PrismaService,
    private vectorDB: VectorDatabaseService,
  ) {}

  async storeProjectOverview(data: {
    projectPath: string;
    projectType: string;
    frameworks: string[];
    languages: string[];
    architecturalStyle: string;
    summary: string;
    buildSystem: string[];
    testingFrameworks: string[];
  }): Promise<{ success: boolean; projectId?: string; message: string }> {
    try {
      const techStackFingerprint = this.generateTechStackFingerprint({
        frameworks: data.frameworks,
        languages: data.languages,
        projectType: data.projectType,
      });

      // Store in PostgreSQL
      const project = await this.prisma.projectIntelligence.upsert({
        where: { projectPath: data.projectPath },
        update: {
          projectOverview: data,
          techStackFingerprint,
          updatedAt: new Date(),
        },
        create: {
          projectPath: data.projectPath,
          projectName: this.extractProjectName(data.projectPath),
          projectOverview: data,
          techStackFingerprint,
          vectorCollectionId: uuidv4(),
        },
      });

      // Store in vector database
      await this.vectorDB.storeProjectContext({
        projectId: project.id.toString(),
        projectPath: data.projectPath,
        techStack: [...data.frameworks, ...data.languages],
        patterns: [data.architecturalStyle],
        projectType: data.projectType,
        description: data.summary,
        metadata: {
          buildSystem: data.buildSystem,
          testingFrameworks: data.testingFrameworks,
          stored_at: new Date().toISOString(),
        },
      });

      this.logger.log(`Stored project overview for: ${data.projectPath}`);
      
      return {
        success: true,
        projectId: project.id.toString(),
        message: 'Project overview stored successfully',
      };
    } catch (error) {
      this.logger.error('Failed to store project overview', error);
      return {
        success: false,
        message: `Failed to store project overview: ${error.message}`,
      };
    }
  }

  async storeArchitecturalAnalysis(data: {
    projectPath: string;
    patterns: string[];
    moduleStructure: Record<string, string>;
    dataAccessStrategy: string;
    apiDesign: string;
    dependencyInjection: Record<string, any>;
    serviceInterfaces: Record<string, any>;
    integrationPoints: Record<string, any>;
  }): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.projectIntelligence.update({
        where: { projectPath: data.projectPath },
        data: {
          architecturalAnalysis: data,
          updatedAt: new Date(),
        },
      });

      // Update vector representation with architectural patterns
      const project = await this.prisma.projectIntelligence.findUnique({
        where: { projectPath: data.projectPath },
      });

      if (project) {
        const overview = project.projectOverview as any;
        await this.vectorDB.storeProjectContext({
          projectId: project.id.toString(),
          projectPath: data.projectPath,
          techStack: [...(overview.frameworks || []), ...(overview.languages || [])],
          patterns: [...data.patterns, overview.architecturalStyle].filter(Boolean),
          projectType: overview.projectType || 'Unknown',
          description: `${overview.summary || ''} ${data.dataAccessStrategy} ${data.apiDesign}`,
          metadata: {
            moduleStructure: data.moduleStructure,
            dataAccessStrategy: data.dataAccessStrategy,
            apiDesign: data.apiDesign,
            updated_at: new Date().toISOString(),
          },
        });
      }

      this.logger.log(`Stored architectural analysis for: ${data.projectPath}`);
      
      return {
        success: true,
        message: 'Architectural analysis stored successfully',
      };
    } catch (error) {
      this.logger.error('Failed to store architectural analysis', error);
      return {
        success: false,
        message: `Failed to store architectural analysis: ${error.message}`,
      };
    }
  }

  async getIntelligentGuidance(request: {
    projectPath: string;
    taskType: string;
    roleContext: string;
    taskDescription?: string;
  }): Promise<{
    contextualGuidance: any[];
    relevantPractices: any[];
    similarProjects: any[];
    confidenceScore: number;
  }> {
    try {
      // Get project context
      const project = await this.prisma.projectIntelligence.findUnique({
        where: { projectPath: request.projectPath },
      });

      if (!project) {
        return {
          contextualGuidance: [],
          relevantPractices: [],
          similarProjects: [],
          confidenceScore: 0,
        };
      }

      const overview = project.projectOverview as any;
      const architecture = project.architecturalAnalysis as any;

      // Find similar projects
      const similarProjects = await this.vectorDB.findSimilarProjects({
        techStack: [...(overview.frameworks || []), ...(overview.languages || [])],
        projectType: overview.projectType,
        taskContext: `${request.taskType} ${request.taskDescription || ''}`,
        limit: 3,
      });

      // Find relevant best practices
      const relevantPractices = await this.vectorDB.findRelevantBestPractices({
        category: this.inferCategoryFromTask(request.taskType),
        frameworks: overview.frameworks || [],
        taskType: request.taskType,
        limit: 5,
      });

      // Generate contextual guidance
      const contextualGuidance = this.generateContextualGuidance({
        project: overview,
        architecture,
        taskType: request.taskType,
        roleContext: request.roleContext,
        similarProjects,
        relevantPractices,
      });

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore({
        projectMaturity: project.intelligenceScore,
        similarProjectsCount: similarProjects.length,
        practicesRelevance: relevantPractices.length,
      });

      // Log the retrieval for analytics
      await this.logContextRetrieval({
        projectPath: request.projectPath,
        requestType: 'intelligent_guidance',
        queryText: `${request.taskType} ${request.taskDescription || ''}`,
        roleContext: request.roleContext,
        vectorResults: [...similarProjects, ...relevantPractices],
        responseTime: Date.now(), // You'd measure this properly
      });

      return {
        contextualGuidance,
        relevantPractices,
        similarProjects,
        confidenceScore,
      };
    } catch (error) {
      this.logger.error('Failed to get intelligent guidance', error);
      return {
        contextualGuidance: [],
        relevantPractices: [],
        similarProjects: [],
        confidenceScore: 0,
      };
    }
  }

  private generateTechStackFingerprint(data: {
    frameworks: string[];
    languages: string[];
    projectType: string;
  }): string {
    const components = [
      data.projectType,
      ...data.frameworks.sort(),
      ...data.languages.sort(),
    ];
    return components.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  private extractProjectName(projectPath: string): string {
    return projectPath.split('/').pop() || 'Unknown Project';
  }

  private inferCategoryFromTask(taskType: string): string {
    const taskLower = taskType.toLowerCase();
    
    if (taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('security')) {
      return 'security';
    }
    if (taskLower.includes('test') || taskLower.includes('spec')) {
      return 'testing';
    }
    if (taskLower.includes('performance') || taskLower.includes('optimization') || taskLower.includes('cache')) {
      return 'performance';
    }
    if (taskLower.includes('api') || taskLower.includes('endpoint') || taskLower.includes('service')) {
      return 'architecture';
    }
    
    return 'general';
  }

  private generateContextualGuidance(params: {
    project: any;
    architecture: any;
    taskType: string;
    roleContext: string;
    similarProjects: any[];
    relevantPractices: any[];
  }): any[] {
    const guidance = [];

    // Tech stack specific guidance
    if (params.project.frameworks?.includes('NestJS')) {
      guidance.push({
        type: 'tech_stack_guidance',
        title: 'NestJS Best Practices',
        content: this.getNestJSGuidance(params.taskType, params.roleContext),
        confidence: 0.9,
      });
    }

    // Similar project insights
    if (params.similarProjects.length > 0) {
      guidance.push({
        type: 'similar_project_insights',
        title: 'Insights from Similar Projects',
        content: params.similarProjects.map(p => ({
          projectType: p.projectType,
          approach: p.metadata?.approach || 'Standard implementation',
          lessons: p.metadata?.lessons || [],
        })),
        confidence: 0.8,
      });
    }

    // Best practices recommendations
    if (params.relevantPractices.length > 0) {
      guidance.push({
        type: 'best_practices',
        title: 'Recommended Best Practices',
        content: params.relevantPractices.slice(0, 3).map(p => ({
          name: p.name,
          description: p.description,
          implementation: p.implementation,
          relevance: p.relevance_score,
        })),
        confidence: 0.85,
      });
    }

    return guidance;
  }

  private getNestJSGuidance(taskType: string, roleContext: string): any {
    // This would be expanded with comprehensive NestJS guidance
    const baseGuidance = {
      modules: 'Organize by feature, use barrel exports',
      services: 'Use dependency injection, implement interfaces',
      controllers: 'Keep thin, delegate to services',
      testing: 'Unit tests for services, e2e for controllers',
    };

    if (taskType.toLowerCase().includes('auth')) {
      return {
        ...baseGuidance,
        authentication: {
          strategy: 'Use @nestjs/passport with JWT strategy',
          guards: 'Implement AuthGuard for route protection',
          validation: 'Use class-validator for DTOs',
        },
      };
    }

    return baseGuidance;
  }

  private calculateConfidenceScore(params: {
    projectMaturity: number;
    similarProjectsCount: number;
    practicesRelevance: number;
  }): number {
    const maturityWeight = 0.4;
    const similarityWeight = 0.3;
    const practicesWeight = 0.3;

    const maturityScore = Math.min(params.projectMaturity / 10, 1);
    const similarityScore = Math.min(params.similarProjectsCount / 5, 1);
    const practicesScore = Math.min(params.practicesRelevance / 10, 1);

    return (
      maturityScore * maturityWeight +
      similarityScore * similarityWeight +
      practicesScore * practicesWeight
    );
  }

  private async logContextRetrieval(data: {
    projectPath: string;
    requestType: string;
    queryText: string;
    roleContext: string;
    vectorResults: any[];
    responseTime: number;
  }): Promise<void> {
    try {
      await this.prisma.contextRetrievalLog.create({
        data: {
          projectPath: data.projectPath,
          requestType: data.requestType,
          queryText: data.queryText,
          roleContext: data.roleContext,
          vectorResults: data.vectorResults,
          responseTime: data.responseTime,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log context retrieval', error);
    }
  }
}
```

---

## 🛠️ **Phase 2: MCP Tools Implementation (Week 3-4)**

### **Week 3: Storage MCP Tools**

```typescript
// src/task-workflow/domains/intelligence/mcp-operations/project-intelligence-mcp.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { McpTool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ProjectIntelligenceService } from '../services/project-intelligence.service';

@Injectable()
export class ProjectIntelligenceMcpService {
  private readonly logger = new Logger(ProjectIntelligenceMcpService.name);

  constructor(
    private projectIntelligenceService: ProjectIntelligenceService,
  ) {}

  @McpTool({
    name: 'store_project_overview',
    description: 'Store comprehensive project overview and tech stack information',
    inputSchema: z.object({
      projectPath: z.string().describe('Absolute path to the project root'),
      projectType: z.string().describe('Type of project (e.g., "NestJS MCP Server", "React SPA")'),
      frameworks: z.array(z.string()).describe('Frameworks used in the project'),
      languages: z.array(z.string()).describe('Programming languages used'),
      architecturalStyle: z.string().describe('Architectural pattern (e.g., "Domain-Driven Design")'),
      summary: z.string().describe('High-level project description'),
      buildSystem: z.array(z.string()).describe('Build tools and systems'),
      testingFrameworks: z.array(z.string()).describe('Testing frameworks and tools'),
    }),
  })
  async storeProjectOverview(input: {
    projectPath: string;
    projectType: string;
    frameworks: string[];
    languages: string[];
    architecturalStyle: string;
    summary: string;
    buildSystem: string[];
    testingFrameworks: string[];
  }) {
    try {
      const result = await this.projectIntelligenceService.storeProjectOverview(input);
      
      this.logger.log(`Project overview stored for: ${input.projectPath}`);
      
      return {
        ...result,
        nextSteps: [
          'Call store_architectural_analysis to add architectural details',
          'Call store_code_patterns to capture coding conventions',
          'Call store_role_behavioral_context for each role to establish behavioral guidelines',
        ],
        intelligenceLevel: 'basic',
      };
    } catch (error) {
      this.logger.error('Failed to store project overview', error);
      return {
        success: false,
        error: error.message,
        guidance: 'Check project path and ensure all required fields are provided',
      };
    }
  }

  @McpTool({
    name: 'store_architectural_analysis',
    description: 'Store detailed architectural analysis and patterns',
    inputSchema: z.object({
      projectPath: z.string(),
      patterns: z.array(z.string()).describe('Architectural patterns detected'),
      moduleStructure: z.record(z.string()).describe('Module organization and purpose'),
      dataAccessStrategy: z.string().describe('Data access approach (e.g., "Prisma ORM with Repository Pattern")'),
      apiDesign: z.string().describe('API design approach'),
      dependencyInjection: z.record(z.any()).describe('DI patterns and configuration'),
      serviceInterfaces: z.record(z.any()).describe('Service contracts and boundaries'),
      integrationPoints: z.record(z.any()).describe('External integrations and interfaces'),
    }),
  })
  async storeArchitecturalAnalysis(input: {
    projectPath: string;
    patterns: string[];
    moduleStructure: Record<string, string>;
    dataAccessStrategy: string;
    apiDesign: string;
    dependencyInjection: Record<string, any>;
    serviceInterfaces: Record<string, any>;
    integrationPoints: Record<string, any>;
  }) {
    try {
      const result = await this.projectIntelligenceService.storeArchitecturalAnalysis(input);
      
      return {
        ...result,
        intelligenceLevel: 'enhanced',
        analysisComplete: {
          patterns: input.patterns.length,
          modules: Object.keys(input.moduleStructure).length,
          integrations: Object.keys(input.integrationPoints).length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to store architectural analysis', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @McpTool({
    name: 'store_code_patterns',
    description: 'Store coding patterns, conventions, and standards',
    inputSchema: z.object({
      projectPath: z.string(),
      designPatterns: z.record(z.object({
        description: z.string(),
        examples: z.array(z.string()),
        usage: z.string(),
      })).describe('Design patterns with examples'),
      codingConventions: z.record(z.string()).describe('Coding style and conventions'),
      errorHandling: z.record(z.any()).describe('Error handling patterns'),
      validation: z.record(z.any()).describe('Input validation approaches'),
      testing: z.record(z.any()).describe('Testing patterns and strategies'),
      security: z.record(z.any()).describe('Security implementation patterns'),
    }),
  })
  async storeCodePatterns(input: {
    projectPath: string;
    designPatterns: Record<string, any>;
    codingConventions: Record<string, string>;
    errorHandling: Record<string, any>;
    validation: Record<string, any>;
    testing: Record<string, any>;
    security: Record<string, any>;
  }) {
    try {
      // Store in PostgreSQL
      const project = await this.projectIntelligenceService.updateCodePatterns(input);
      
      return {
        success: true,
        message: 'Code patterns stored successfully',
        patternsStored: {
          designPatterns: Object.keys(input.designPatterns).length,
          conventions: Object.keys(input.codingConventions).length,
          testingPatterns: Object.keys(input.testing).length,
        },
        intelligenceLevel: 'comprehensive',
      };
    } catch (error) {
      this.logger.error('Failed to store code patterns', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @McpTool({
    name: 'store_role_behavioral_context',
    description: 'Store role-specific behavioral context and standards',
    inputSchema: z.object({
      projectPath: z.string(),
      roleType: z.string().describe('Role identifier (e.g., "architect", "senior-developer")'),
      codeQualityStandards: z.record(z.any()).describe('Quality standards for this role'),
      testingApproach: z.record(z.any()).describe('Testing expectations and patterns'),
      patterns: z.array(z.string()).describe('Patterns this role should follow'),
      bestPractices: z.record(z.any()).describe('Role-specific best practices'),
      commonPitfalls: z.record(z.any()).describe('What this role should avoid'),
      toolsAndFrameworks: z.record(z.any()).describe('Relevant tools for this role'),
      qualityChecklist: z.record(z.any()).describe('Quality validation items'),
    }),
  })
  async storeRoleBehavioralContext(input: {
    projectPath: string;
    roleType: string;
    codeQualityStandards: Record<string, any>;
    testingApproach: Record<string, any>;
    patterns: string[];
    bestPractices: Record<string, any>;
    commonPitfalls: Record<string, any>;
    toolsAndFrameworks: Record<string, any>;
    qualityChecklist: Record<string, any>;
  }) {
    try {
      // Store role-specific context
      const result = await this.projectIntelligenceService.storeRoleBehavioralContext(input);
      
      return {
        success: true,
        message: `Role behavioral context stored for: ${input.roleType}`,
        roleConfiguration: {
          role: input.roleType,
          practicesCount: Object.keys(input.bestPractices).length,
          qualityCheckpoints: Object.keys(input.qualityChecklist).length,
          patterns: input.patterns.length,
        },
        intelligenceLevel: 'expert',
      };
    } catch (error) {
      this.logger.error('Failed to store role behavioral context', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @McpTool({
    name: 'get_project_intelligence_status',
    description: 'Get current intelligence status and completeness for a project',
    inputSchema: z.object({
      projectPath: z.string(),
    }),
  })
  async getProjectIntelligenceStatus(input: { projectPath: string }) {
    try {
      const status = await this.projectIntelligenceService.getIntelligenceStatus(input.projectPath);
      
      return {
        success: true,
        status,
        recommendations: this.generateCompletionRecommendations(status),
      };
    } catch (error) {
      this.logger.error('Failed to get project intelligence status', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private generateCompletionRecommendations(status: any): string[] {
    const recommendations = [];
    
    if (!status.hasOverview) {
      recommendations.push('Call store_project_overview to establish project foundation');
    }
    
    if (!status.hasArchitecture) {
      recommendations.push('Call store_architectural_analysis to add architectural context');
    }
    
    if (!status.hasCodePatterns) {
      recommendations.push('Call store_code_patterns to capture coding standards');
    }
    
    if (status.rolesConfigured < 3) {
      recommendations.push('Configure more roles with store_role_behavioral_context');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Project intelligence is complete! Ready for intelligent guidance.');
    }
    
    return recommendations;
  }
}
```

### **Week 4: Enhanced Workflow Tools**

```typescript
// Enhanced existing task operations with intelligence
@McpTool({
  name: 'task_operations',
  description: 'Enhanced task operations with intelligent project-aware guidance',
  // ... existing schema
})
async taskOperations(input: any) {
  // Execute existing task operations
  const baseResult = await this.executeBaseTaskOperations(input);
  
  // Add intelligent enhancement if project has intelligence data
  if (input.operation === 'create' && input.projectPath) {
    const intelligentGuidance = await this.projectIntelligenceService.getIntelligentGuidance({
      projectPath: input.projectPath,
      taskType: input.taskData.name || 'general',
      roleContext: input.roleContext || 'general',
      taskDescription: input.taskData.description,
    });
    
    // Enhanced response with intelligence
    return {
      ...baseResult,
      intelligentGuidance: {
        contextualGuidance: intelligentGuidance.contextualGuidance,
        recommendedApproach: this.generateRecommendedApproach(intelligentGuidance),
        bestPractices: intelligentGuidance.relevantPractices.slice(0, 3),
        qualityChecklist: this.generateQualityChecklist(intelligentGuidance),
        similarProjectInsights: intelligentGuidance.similarProjects,
        confidenceLevel: intelligentGuidance.confidenceScore,
      },
      metadata: {
        enhancedWithIntelligence: true,
        intelligenceVersion: '1.0',
        generatedAt: new Date().toISOString(),
      },
    };
  }
  
  return baseResult;
}
```

---

## 🚀 **Phase 3: Intelligence & Optimization (Week 5-8)**

### **Week 5-6: Intelligence Integration**
- Integrate intelligence into all existing MCP tools
- Add performance monitoring and optimization
- Implement caching for frequent queries
- Add intelligence quality scoring

### **Week 7-8: Advanced Features**
- Best practices research automation
- Cross-project learning capabilities
- Intelligence analytics dashboard
- Performance optimization and scaling

---

## 📊 **Performance & Focus Analysis**

### **Response Time Targets**
- **Basic MCP Operations**: <50ms (unchanged)
- **Intelligence-Enhanced Operations**: <150ms (with context)
- **Vector Similarity Search**: <100ms
- **Complete Enhanced Response**: <200ms

### **Focus Preservation Strategy**
✅ **Core MCP Mission Maintained**: All existing tools work exactly as before
✅ **Intelligence as Enhancement**: Intelligence is additive, not replacement
✅ **Graceful Degradation**: System works without intelligence layer
✅ **Performance Priority**: Fast responses remain the top priority

This implementation plan gives you a **sophisticated, intelligent MCP server** that maintains your core mission while adding powerful project-aware capabilities!