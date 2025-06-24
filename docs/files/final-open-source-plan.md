# 🚀 **Final Implementation Plan: Open Source Local Intelligence System**

## 🎯 **Perfect Architecture: 100% Open Source + Local**

### **Why This is Optimal**
- ✅ **Zero API Costs**: No OpenAI, no external service fees
- ✅ **Complete Privacy**: User data never leaves their machine
- ✅ **Offline Operation**: Works without internet connection
- ✅ **User Control**: Database stays in their project directory
- ✅ **Open Source**: Transparent, customizable, no vendor lock-in
- ✅ **High Performance**: Local operations are faster than API calls

### **Technology Stack**
```typescript
{
  "core": {
    "mcp_server": "NestJS + TypeScript",
    "database": "SQLite (local) + Prisma",
    "vector_db": "Chroma (embedded)",
    "embeddings": "HuggingFace Transformers (local)",
    "rag_framework": "LlamaIndex",
    "ai_models": "Optional: Ollama (local LLM)"
  },
  "deployment": "Single executable + local data",
  "cost": "$0 operational cost"
}
```

---

## 🏗️ **Enhanced Local Architecture**

### **System Design**
```
┌─────────────────────────────────────────────────┐
│                User's Project                   │
├─────────────────────────────────────────────────┤
│ /project-root/                                  │
│   ├── src/                     (user code)      │
│   ├── .anubis/                 (intelligence)   │
│   │   ├── intelligence.db      (SQLite)         │
│   │   ├── vectors/             (Chroma)         │
│   │   └── models/              (HF models)      │
│   └── anubis-config.json       (settings)       │
└─────────────────────────────────────────────────┘
                           │
           ┌───────────────▼────────────────┐
           │        Anubis MCP Server       │
           │      (Running Locally)         │
           ├────────────────────────────────┤
           │ • Project Intelligence         │
           │ • LlamaIndex RAG Engine        │
           │ • Local Embeddings             │
           │ • Chroma Vector Store          │
           └────────────────────────────────┘
                           │
           ┌───────────────▼────────────────┐
           │         AI Agent               │
           │     (Cursor, Claude, etc.)     │
           └────────────────────────────────┘
```

### **Local Database Structure**
```
/project-root/.anubis/
├── intelligence.db          # SQLite database (project-specific)
├── vectors/                 # Chroma vector storage
│   ├── project_contexts/    # Project similarity vectors
│   ├── best_practices/      # Best practice vectors
│   └── code_patterns/       # Code pattern vectors
├── models/                  # Local AI models (cached)
│   ├── embeddings/          # HuggingFace embedding models
│   └── llm/                 # Optional: Local LLM models
└── config/
    ├── anubis-config.json   # Project-specific settings
    └── vector-collections.json # Vector database schema
```

---

## 📦 **Dependencies & Setup**

### **Package.json Additions**
```json
{
  "dependencies": {
    // Existing dependencies...
    
    // 🆕 Open Source Intelligence Stack
    "llamaindex": "^0.3.15",                    // RAG framework
    "chromadb": "^1.8.1",                      // Vector database
    "@huggingface/transformers": "^2.17.2",    // Local embeddings
    "@xenova/transformers": "^2.17.2",         // Browser/Node transformers
    "ollama": "^0.5.0",                        // Optional: Local LLM
    "sentence-transformers": "^1.0.0",         // Alternative embeddings
    
    // Utilities
    "node-nlp": "^4.27.0",                     // NLP utilities
    "compromise": "^14.10.0",                  // Text processing
    "uuid": "^9.0.1",                          // ID generation
    "glob": "^10.3.10"                         // File pattern matching
  },
  "devDependencies": {
    // Model download utilities
    "@huggingface/hub": "^0.15.1"
  }
}
```

### **Environment Setup (Zero External APIs)**
```env
# .env (no API keys needed!)
ANUBIS_MODE=local
ANUBIS_DATA_DIR=.anubis
ENABLE_LOCAL_LLM=false          # Optional Ollama integration
EMBEDDING_MODEL=all-MiniLM-L6-v2 # Lightweight, fast model
VECTOR_SIMILARITY_THRESHOLD=0.7
MAX_CONTEXT_RESULTS=5
```

---

## 🧠 **Core Services Implementation**

### **1. Local Embeddings Service**
```typescript
// src/task-workflow/domains/intelligence/services/local-embeddings.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pipeline, Pipeline } from '@xenova/transformers';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class LocalEmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(LocalEmbeddingsService.name);
  private embeddingPipeline: Pipeline | null = null;
  private modelPath: string;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.modelPath = this.configService.get('ANUBIS_DATA_DIR', '.anubis');
  }

  async onModuleInit() {
    try {
      await this.initializeEmbeddingModel();
      this.isInitialized = true;
      this.logger.log('Local embeddings service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize local embeddings', error);
    }
  }

  private async initializeEmbeddingModel() {
    const modelName = this.configService.get('EMBEDDING_MODEL', 'Xenova/all-MiniLM-L6-v2');
    
    // Models are cached locally automatically by transformers.js
    this.embeddingPipeline = await pipeline('feature-extraction', modelName, {
      quantized: true, // Use quantized model for speed
    });
    
    this.logger.log(`Loaded embedding model: ${modelName}`);
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized || !this.embeddingPipeline) {
      throw new Error('Embeddings service not initialized');
    }

    try {
      // Clean and normalize text
      const cleanText = this.preprocessText(text);
      
      // Generate embedding
      const output = await this.embeddingPipeline(cleanText, {
        pooling: 'mean',
        normalize: true,
      });
      
      // Convert to regular number array
      return Array.from(output.data as Float32Array);
    } catch (error) {
      this.logger.error('Failed to create embedding', error);
      throw error;
    }
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isInitialized || !this.embeddingPipeline) {
      throw new Error('Embeddings service not initialized');
    }

    try {
      const cleanTexts = texts.map(text => this.preprocessText(text));
      
      // Process in parallel for speed
      const embeddings = await Promise.all(
        cleanTexts.map(text => this.createEmbedding(text))
      );
      
      return embeddings;
    } catch (error) {
      this.logger.error('Failed to create batch embeddings', error);
      throw error;
    }
  }

  private preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\w\s\-\.]/g, '')    // Remove special chars except basic punctuation
      .trim()
      .substring(0, 512);             // Limit length for performance
  }

  async getModelInfo(): Promise<{
    modelName: string;
    isInitialized: boolean;
    vectorDimension: number;
  }> {
    return {
      modelName: this.configService.get('EMBEDDING_MODEL', 'Xenova/all-MiniLM-L6-v2'),
      isInitialized: this.isInitialized,
      vectorDimension: 384, // all-MiniLM-L6-v2 dimension
    };
  }
}
```

### **2. Local Vector Database Service**
```typescript
// src/task-workflow/domains/intelligence/services/local-vector-db.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { LocalEmbeddingsService } from './local-embeddings.service';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class LocalVectorDBService implements OnModuleInit {
  private readonly logger = new Logger(LocalVectorDBService.name);
  private chromaClient: ChromaClient;
  private dbPath: string;
  private collections: Map<string, any> = new Map();

  constructor(
    private configService: ConfigService,
    private embeddingsService: LocalEmbeddingsService,
  ) {
    this.dbPath = path.join(
      process.cwd(),
      this.configService.get('ANUBIS_DATA_DIR', '.anubis'),
      'vectors'
    );
  }

  async onModuleInit() {
    try {
      await this.initializeChroma();
      await this.ensureCollections();
      this.logger.log('Local vector database initialized');
    } catch (error) {
      this.logger.error('Failed to initialize vector database', error);
    }
  }

  private async initializeChroma() {
    // Ensure vector storage directory exists
    await fs.mkdir(this.dbPath, { recursive: true });
    
    // Initialize Chroma with local storage
    this.chromaClient = new ChromaClient({
      path: this.dbPath,
    });
    
    // Create custom embedding function using our local embeddings
    const customEmbeddingFunction = {
      generate: async (texts: string[]) => {
        return await this.embeddingsService.createBatchEmbeddings(texts);
      },
    };
  }

  private async ensureCollections() {
    const collectionConfigs = [
      { name: 'project_contexts', metadata: { description: 'Project technology stacks and contexts' } },
      { name: 'best_practices', metadata: { description: 'Best practices and recommendations' } },
      { name: 'code_patterns', metadata: { description: 'Code patterns and architectural decisions' } },
      { name: 'role_guidance', metadata: { description: 'Role-specific guidance and standards' } },
    ];

    for (const config of collectionConfigs) {
      try {
        const collection = await this.chromaClient.getOrCreateCollection({
          name: config.name,
          metadata: config.metadata,
        });
        this.collections.set(config.name, collection);
        this.logger.debug(`Collection ready: ${config.name}`);
      } catch (error) {
        this.logger.error(`Failed to create collection ${config.name}`, error);
      }
    }
  }

  async storeProjectContext(data: {
    id: string;
    projectPath: string;
    techStack: string[];
    patterns: string[];
    projectType: string;
    description: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const collection = this.collections.get('project_contexts');
      if (!collection) throw new Error('Project contexts collection not found');

      // Create embedding text
      const embeddingText = [
        data.projectType,
        ...data.techStack,
        ...data.patterns,
        data.description,
      ].join(' ');

      // Generate embedding
      const embedding = await this.embeddingsService.createEmbedding(embeddingText);

      // Store in Chroma
      await collection.add({
        ids: [data.id],
        embeddings: [embedding],
        documents: [embeddingText],
        metadatas: [{
          projectPath: data.projectPath,
          techStack: JSON.stringify(data.techStack),
          patterns: JSON.stringify(data.patterns),
          projectType: data.projectType,
          description: data.description,
          ...data.metadata,
          indexed_at: new Date().toISOString(),
        }],
      });

      this.logger.debug(`Stored project context: ${data.projectPath}`);
    } catch (error) {
      this.logger.error('Failed to store project context', error);
      throw error;
    }
  }

  async storeBestPractice(data: {
    id: string;
    name: string;
    category: string;
    description: string;
    frameworks: string[];
    implementation: string[];
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      const collection = this.collections.get('best_practices');
      if (!collection) throw new Error('Best practices collection not found');

      const embeddingText = [
        data.name,
        data.category,
        data.description,
        ...data.frameworks,
        ...data.implementation,
      ].join(' ');

      const embedding = await this.embeddingsService.createEmbedding(embeddingText);

      await collection.add({
        ids: [data.id],
        embeddings: [embedding],
        documents: [embeddingText],
        metadatas: [{
          name: data.name,
          category: data.category,
          description: data.description,
          frameworks: JSON.stringify(data.frameworks),
          implementation: JSON.stringify(data.implementation),
          ...data.metadata,
          indexed_at: new Date().toISOString(),
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
      const collection = this.collections.get('project_contexts');
      if (!collection) return [];

      const searchText = [
        query.projectType,
        ...query.techStack,
        query.taskContext || '',
      ].join(' ');

      const queryEmbedding = await this.embeddingsService.createEmbedding(searchText);

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: query.limit || 5,
        include: ['documents', 'metadatas', 'distances'],
      });

      // Process and return results
      return this.processQueryResults(results);
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
      const collection = this.collections.get('best_practices');
      if (!collection) return [];

      const searchText = [
        query.category || '',
        ...query.frameworks,
        query.taskType || '',
      ].join(' ');

      const queryEmbedding = await this.embeddingsService.createEmbedding(searchText);

      // Create filter for frameworks if specified
      let whereFilter = undefined;
      if (query.frameworks.length > 0) {
        // Note: Chroma filtering syntax
        whereFilter = {
          $or: query.frameworks.map(framework => ({
            frameworks: { $contains: framework },
          })),
        };
      }

      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: query.limit || 5,
        where: whereFilter,
        include: ['documents', 'metadatas', 'distances'],
      });

      return this.processQueryResults(results);
    } catch (error) {
      this.logger.error('Failed to find relevant best practices', error);
      return [];
    }
  }

  private processQueryResults(results: any): any[] {
    if (!results.ids || !results.ids[0]) return [];

    const processed = [];
    const ids = results.ids[0];
    const metadatas = results.metadatas[0];
    const distances = results.distances[0];
    const documents = results.documents[0];

    for (let i = 0; i < ids.length; i++) {
      const metadata = metadatas[i];
      
      // Parse JSON fields back to objects
      if (metadata.techStack) {
        try {
          metadata.techStack = JSON.parse(metadata.techStack);
        } catch (e) {
          metadata.techStack = [];
        }
      }
      
      if (metadata.frameworks) {
        try {
          metadata.frameworks = JSON.parse(metadata.frameworks);
        } catch (e) {
          metadata.frameworks = [];
        }
      }

      processed.push({
        id: ids[i],
        ...metadata,
        similarity_score: 1 - distances[i], // Convert distance to similarity
        document: documents[i],
      });
    }

    // Filter by similarity threshold
    const threshold = this.configService.get('VECTOR_SIMILARITY_THRESHOLD', 0.7);
    return processed.filter(item => item.similarity_score >= threshold);
  }

  async getCollectionStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    
    for (const [name, collection] of this.collections) {
      try {
        const count = await collection.count();
        stats[name] = {
          count,
          status: 'active',
        };
      } catch (error) {
        stats[name] = {
          status: 'error',
          error: error.message,
        };
      }
    }
    
    return stats;
  }

  async clearCollection(collectionName: string): Promise<void> {
    const collection = this.collections.get(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    
    // Delete and recreate collection
    await this.chromaClient.deleteCollection({ name: collectionName });
    await this.ensureCollections();
  }
}
```

### **3. LlamaIndex RAG Service**
```typescript
// src/task-workflow/domains/intelligence/services/llamaindex-rag.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VectorStoreIndex,
  Document,
  Settings,
  SimpleDirectoryReader,
  ChromaVectorStore,
} from 'llamaindex';
import { LocalVectorDBService } from './local-vector-db.service';
import { LocalEmbeddingsService } from './local-embeddings.service';

@Injectable()
export class LlamaIndexRAGService implements OnModuleInit {
  private readonly logger = new Logger(LlamaIndexRAGService.name);
  private indexes: Map<string, VectorStoreIndex> = new Map();
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private vectorDBService: LocalVectorDBService,
    private embeddingsService: LocalEmbeddingsService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeLlamaIndex();
      this.isInitialized = true;
      this.logger.log('LlamaIndex RAG service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize LlamaIndex RAG', error);
    }
  }

  private async initializeLlamaIndex() {
    // Configure LlamaIndex to use our local embeddings
    Settings.embedModel = {
      getTextEmbedding: async (text: string) => {
        return await this.embeddingsService.createEmbedding(text);
      },
      getQueryEmbedding: async (text: string) => {
        return await this.embeddingsService.createEmbedding(text);
      },
    };

    // No LLM needed for our use case - we only need retrieval
    Settings.llm = null;
  }

  async buildProjectKnowledgeIndex(data: {
    projectPath: string;
    documents: Array<{
      content: string;
      metadata: Record<string, any>;
    }>;
  }): Promise<void> {
    try {
      // Convert to LlamaIndex documents
      const documents = data.documents.map(doc => 
        new Document({
          text: doc.content,
          metadata: {
            projectPath: data.projectPath,
            ...doc.metadata,
          },
        })
      );

      // Create vector store index
      const vectorStore = new ChromaVectorStore({
        collectionName: `project_${this.sanitizeProjectName(data.projectPath)}`,
      });

      const index = await VectorStoreIndex.fromVectorStore(vectorStore);

      // Add documents to index
      for (const document of documents) {
        await index.insertNodes([document]);
      }

      this.indexes.set(data.projectPath, index);
      this.logger.debug(`Built knowledge index for: ${data.projectPath}`);
    } catch (error) {
      this.logger.error('Failed to build project knowledge index', error);
      throw error;
    }
  }

  async queryProjectKnowledge(params: {
    projectPath: string;
    query: string;
    maxResults?: number;
  }): Promise<{
    results: Array<{
      content: string;
      metadata: Record<string, any>;
      score: number;
    }>;
    summary: string;
  }> {
    try {
      const index = this.indexes.get(params.projectPath);
      if (!index) {
        return {
          results: [],
          summary: 'No knowledge index found for this project',
        };
      }

      // Create retriever
      const retriever = index.asRetriever({
        similarityTopK: params.maxResults || 5,
      });

      // Query the index
      const nodes = await retriever.retrieve(params.query);

      // Process results
      const results = nodes.map(node => ({
        content: node.node.text || '',
        metadata: node.node.metadata || {},
        score: node.score || 0,
      }));

      // Generate summary of findings
      const summary = this.generateQuerySummary(params.query, results);

      return { results, summary };
    } catch (error) {
      this.logger.error('Failed to query project knowledge', error);
      return {
        results: [],
        summary: 'Error querying project knowledge',
      };
    }
  }

  async enhanceTaskGuidance(params: {
    taskDescription: string;
    projectContext: any;
    existingGuidance: any[];
    roleContext: string;
  }): Promise<{
    enhancedGuidance: string[];
    relevantContext: any[];
    confidence: number;
  }> {
    if (!this.isInitialized) {
      return {
        enhancedGuidance: params.existingGuidance.map(g => g.content || g),
        relevantContext: [],
        confidence: 0.5,
      };
    }

    try {
      // Query for relevant context
      const relevantContext = await this.queryProjectKnowledge({
        projectPath: params.projectContext.projectPath,
        query: `${params.taskDescription} ${params.roleContext}`,
        maxResults: 3,
      });

      // Enhance guidance based on context
      const enhancedGuidance = this.synthesizeGuidance({
        taskDescription: params.taskDescription,
        existingGuidance: params.existingGuidance,
        relevantContext: relevantContext.results,
        roleContext: params.roleContext,
        projectContext: params.projectContext,
      });

      // Calculate confidence based on context quality
      const confidence = this.calculateGuidanceConfidence(relevantContext.results);

      return {
        enhancedGuidance,
        relevantContext: relevantContext.results,
        confidence,
      };
    } catch (error) {
      this.logger.error('Failed to enhance task guidance', error);
      
      // Fallback to existing guidance
      return {
        enhancedGuidance: params.existingGuidance.map(g => g.content || g),
        relevantContext: [],
        confidence: 0.3,
      };
    }
  }

  private sanitizeProjectName(projectPath: string): string {
    return projectPath
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  private generateQuerySummary(query: string, results: any[]): string {
    if (results.length === 0) {
      return `No relevant information found for: ${query}`;
    }

    const highScoreResults = results.filter(r => r.score > 0.8);
    const mediumScoreResults = results.filter(r => r.score > 0.6 && r.score <= 0.8);

    let summary = `Found ${results.length} relevant pieces of information for: ${query}. `;
    
    if (highScoreResults.length > 0) {
      summary += `${highScoreResults.length} highly relevant matches. `;
    }
    
    if (mediumScoreResults.length > 0) {
      summary += `${mediumScoreResults.length} moderately relevant matches.`;
    }

    return summary;
  }

  private synthesizeGuidance(params: {
    taskDescription: string;
    existingGuidance: any[];
    relevantContext: any[];
    roleContext: string;
    projectContext: any;
  }): string[] {
    const guidance = [...params.existingGuidance.map(g => g.content || g)];

    // Add context-specific guidance
    params.relevantContext.forEach(context => {
      if (context.score > 0.7) {
        const contextGuidance = this.extractGuidanceFromContext(context, params.roleContext);
        if (contextGuidance) {
          guidance.push(`📚 Context insight: ${contextGuidance}`);
        }
      }
    });

    // Add role-specific enhancement
    const roleEnhancement = this.generateRoleSpecificEnhancement(params);
    if (roleEnhancement.length > 0) {
      guidance.push(...roleEnhancement);
    }

    return guidance;
  }

  private extractGuidanceFromContext(context: any, roleContext: string): string | null {
    // Simple extraction - could be enhanced with more sophisticated NLP
    const content = context.content.toLowerCase();
    const role = roleContext.toLowerCase();

    if (content.includes(role) || content.includes('best practice') || content.includes('recommendation')) {
      // Extract the most relevant sentence
      const sentences = context.content.split(/[.!?]+/);
      const relevantSentence = sentences.find(s => 
        s.toLowerCase().includes(role) || 
        s.toLowerCase().includes('should') || 
        s.toLowerCase().includes('recommend')
      );
      
      return relevantSentence?.trim() || null;
    }

    return null;
  }

  private generateRoleSpecificEnhancement(params: any): string[] {
    const enhancements = [];
    
    // Role-specific guidance based on project context
    if (params.roleContext === 'architect' && params.projectContext.frameworks?.includes('NestJS')) {
      enhancements.push('🏗️ Consider NestJS module boundaries and dependency injection patterns');
    }
    
    if (params.roleContext === 'senior-developer' && params.taskDescription.toLowerCase().includes('test')) {
      enhancements.push('🧪 Implement comprehensive unit tests with Jest and integration tests');
    }

    return enhancements;
  }

  private calculateGuidanceConfidence(context: any[]): number {
    if (context.length === 0) return 0.3;
    
    const avgScore = context.reduce((sum, c) => sum + (c.score || 0), 0) / context.length;
    const contextBonus = Math.min(context.length / 5, 0.2); // Bonus for having multiple contexts
    
    return Math.min(0.95, avgScore + contextBonus);
  }

  async getRAGStats(): Promise<{
    isInitialized: boolean;
    indexCount: number;
    totalDocuments: number;
  }> {
    return {
      isInitialized: this.isInitialized,
      indexCount: this.indexes.size,
      totalDocuments: 0, // Could be enhanced to count documents across indexes
    };
  }
}
```

---

## 📊 **Complete MCP Tools Implementation**

### **Enhanced Storage Tools**
```typescript
// All your existing store_* tools + enhancements
@McpTool({
  name: 'store_project_overview',
  description: 'Store comprehensive project overview with local intelligence indexing',
  inputSchema: z.object({
    projectPath: z.string(),
    projectType: z.string(),
    frameworks: z.array(z.string()),
    languages: z.array(z.string()),
    architecturalStyle: z.string(),
    summary: z.string(),
    buildSystem: z.array(z.string()),
    testingFrameworks: z.array(z.string()),
  }),
})
async storeProjectOverview(input: ProjectOverviewInput) {
  try {
    // Store in local SQLite
    const result = await this.projectIntelligenceService.storeProjectOverview(input);
    
    // Index in local vector database
    await this.vectorDBService.storeProjectContext({
      id: result.projectId,
      projectPath: input.projectPath,
      techStack: [...input.frameworks, ...input.languages],
      patterns: [input.architecturalStyle],
      projectType: input.projectType,
      description: input.summary,
      metadata: {
        buildSystem: input.buildSystem,
        testingFrameworks: input.testingFrameworks,
        stored_at: new Date().toISOString(),
      },
    });

    // Build LlamaIndex knowledge base
    await this.ragService.buildProjectKnowledgeIndex({
      projectPath: input.projectPath,
      documents: [{
        content: `${input.projectType} project using ${input.frameworks.join(', ')} with ${input.architecturalStyle} architecture. ${input.summary}`,
        metadata: {
          type: 'project_overview',
          frameworks: input.frameworks,
          languages: input.languages,
        },
      }],
    });

    return {
      success: true,
      projectId: result.projectId,
      message: 'Project overview stored and indexed locally',
      intelligence: {
        vectorIndexed: true,
        ragIndexed: true,
        localDataPath: path.join(input.projectPath, '.anubis'),
      },
      nextSteps: [
        'Call store_architectural_analysis for architectural details',
        'Call store_code_patterns for coding conventions',
        'Call store_role_behavioral_context for each role',
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### **Enhanced Guidance Tools**
```typescript
@McpTool({
  name: 'get_intelligent_task_guidance',
  description: 'Get sophisticated task guidance using local intelligence and RAG',
  inputSchema: z.object({
    projectPath: z.string(),
    taskName: z.string(),
    taskDescription: z.string(),
    roleContext: z.string(),
    includeExamples: z.boolean().default(true),
    includeRisks: z.boolean().default(true),
  }),
})
async getIntelligentTaskGuidance(input: {
  projectPath: string;
  taskName: string;
  taskDescription: string;
  roleContext: string;
  includeExamples: boolean;
  includeRisks: boolean;
}) {
  try {
    // Get project context
    const projectContext = await this.projectIntelligenceService.getProjectContext(input.projectPath);
    
    if (!projectContext) {
      return {
        success: false,
        error: 'Project not found. Please run store_project_overview first.',
      };
    }

    // Find similar projects using vector search
    const similarProjects = await this.vectorDBService.findSimilarProjects({
      techStack: projectContext.techStack || [],
      projectType: projectContext.projectType || '',
      taskContext: `${input.taskName} ${input.taskDescription}`,
      limit: 3,
    });

    // Find relevant best practices
    const bestPractices = await this.vectorDBService.findRelevantBestPractices({
      category: this.inferCategoryFromTask(input.taskName),
      frameworks: projectContext.frameworks || [],
      taskType: input.taskName,
      limit: 5,
    });

    // Enhance with RAG
    const ragEnhancement = await this.ragService.enhanceTaskGuidance({
      taskDescription: input.taskDescription,
      projectContext,
      existingGuidance: bestPractices,
      roleContext: input.roleContext,
    });

    // Generate comprehensive guidance
    const guidance = {
      taskSpecific: this.generateTaskSpecificGuidance(input, projectContext),
      techStackGuidance: this.generateTechStackGuidance(projectContext, input.taskName),
      roleSpecificStandards: this.generateRoleStandards(input.roleContext, projectContext),
      bestPractices: ragEnhancement.enhancedGuidance,
      qualityChecklist: this.generateQualityChecklist(input, projectContext),
      similarProjectInsights: similarProjects.map(p => ({
        projectType: p.projectType,
        approach: p.description,
        similarity: p.similarity_score,
      })),
      riskAlerts: input.includeRisks ? this.generateRiskAlerts(input, projectContext) : [],
      codeExamples: input.includeExamples ? this.generateCodeExamples(input, projectContext) : [],
    };

    return {
      success: true,
      guidance,
      intelligence: {
        confidenceScore: ragEnhancement.confidence,
        sourcesUsed: {
          similarProjects: similarProjects.length,
          bestPractices: bestPractices.length,
          ragContexts: ragEnhancement.relevantContext.length,
        },
        dataSource: 'local_intelligence',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        projectPath: input.projectPath,
        taskContext: input.taskName,
        roleContext: input.roleContext,
      },
    };
  } catch (error) {
    this.logger.error('Failed to get intelligent task guidance', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

private generateTaskSpecificGuidance(input: any, projectContext: any): any {
  const taskLower = input.taskName.toLowerCase();
  const frameworks = projectContext.frameworks || [];
  
  if (taskLower.includes('auth') && frameworks.includes('NestJS')) {
    return {
      approach: 'JWT-based authentication with NestJS Guards',
      steps: [
        'Install @nestjs/passport, @nestjs/jwt, and passport-jwt',
        'Create AuthModule with JWT strategy configuration',
        'Implement User entity and AuthService',
        'Create AuthGuard and apply to protected routes',
        'Add login/register endpoints with proper validation',
        'Implement refresh token mechanism',
      ],
      keyFiles: [
        'src/auth/auth.module.ts',
        'src/auth/auth.service.ts',
        'src/auth/jwt.strategy.ts',
        'src/auth/auth.guard.ts',
      ],
    };
  }
  
  if (taskLower.includes('test') && frameworks.includes('Jest')) {
    return {
      approach: 'Comprehensive testing strategy with Jest',
      steps: [
        'Set up test environment configuration',
        'Create unit tests for services and utilities',
        'Implement integration tests for controllers',
        'Add e2e tests for critical user journeys',
        'Configure test coverage reporting',
        'Set up CI/CD test automation',
      ],
      keyFiles: [
        'src/**/*.spec.ts',
        'test/app.e2e-spec.ts',
        'jest.config.js',
      ],
    };
  }

  // Generic guidance for unknown tasks
  return {
    approach: `Implement ${input.taskName} following ${frameworks.join(' + ')} best practices`,
    steps: [
      'Analyze requirements and define acceptance criteria',
      'Design solution architecture following project patterns',
      'Implement core functionality with proper error handling',
      'Add comprehensive tests (unit, integration, e2e)',
      'Document implementation and usage',
      'Review and refine based on quality standards',
    ],
    keyFiles: ['To be determined based on specific implementation'],
  };
}

private generateTechStackGuidance(projectContext: any, taskName: string): any {
  const frameworks = projectContext.frameworks || [];
  const languages = projectContext.languages || [];
  
  const guidance: any = {};

  // NestJS specific guidance
  if (frameworks.includes('NestJS')) {
    guidance.nestjs = {
      moduleOrganization: 'Create feature-based modules with clear boundaries',
      dependencyInjection: 'Use constructor injection with proper interfaces',
      errorHandling: 'Implement exception filters for consistent error responses',
      validation: 'Use class-validator with DTOs for input validation',
      testing: 'Unit test services, integration test controllers',
    };
  }

  // Prisma specific guidance
  if (frameworks.includes('Prisma')) {
    guidance.prisma = {
      schemaDesign: 'Use proper relationships and indexing',
      queryOptimization: 'Use include/select to optimize database queries',
      migrations: 'Create incremental migrations with proper rollback strategy',
      dataValidation: 'Validate data at application layer before database operations',
    };
  }

  // TypeScript specific guidance
  if (languages.includes('TypeScript')) {
    guidance.typescript = {
      typing: 'Use strict mode with comprehensive type definitions',
      interfaces: 'Define clear interfaces for all data structures',
      generics: 'Use generics for reusable type-safe components',
      utilities: 'Leverage TypeScript utility types for type transformations',
    };
  }

  return guidance;
}
```

---

## 🚀 **Installation & Setup Instructions**

### **1. Installation Script**
```bash
#!/bin/bash
# install-anubis-intelligence.sh

echo "🚀 Installing Anubis Intelligence System..."

# Install dependencies
npm install llamaindex chromadb @huggingface/transformers @xenova/transformers

# Create intelligence directory structure
mkdir -p .anubis/{vectors,models,config}

# Download default embedding model (automatic on first use)
echo "📦 Models will be downloaded automatically on first use"

# Initialize configuration
cat > .anubis/config/anubis-config.json << EOF
{
  "version": "1.0.0",
  "intelligence": {
    "enabled": true,
    "embeddingModel": "Xenova/all-MiniLM-L6-v2",
    "vectorSimilarityThreshold": 0.7,
    "maxContextResults": 5
  },
  "storage": {
    "vectorDatabase": "chroma",
    "localDatabase": "sqlite"
  },
  "features": {
    "ragEnhancement": true,
    "crossProjectLearning": true,
    "bestPracticesLibrary": true
  }
}
EOF

echo "✅ Anubis Intelligence System installed successfully!"
echo "📍 Data will be stored in: $(pwd)/.anubis/"
echo "🔧 Run your MCP server to start using intelligent guidance"
```

### **2. Usage Workflow**
```typescript
// AI Agent workflow example:

// 1. Initial project setup
await store_project_overview({
  projectPath: '/workspace/my-app',
  projectType: 'NestJS MCP Server',
  frameworks: ['NestJS', 'Prisma', 'TypeScript'],
  languages: ['TypeScript'],
  architecturalStyle: 'Domain-Driven Design',
  summary: 'Intelligent workflow management system with MCP integration',
  buildSystem: ['npm', 'webpack'],
  testingFrameworks: ['Jest', 'Supertest'],
});

// 2. Add architectural details
await store_architectural_analysis({
  projectPath: '/workspace/my-app',
  patterns: ['Repository Pattern', 'Service Layer', 'Dependency Injection'],
  moduleStructure: {
    'src/domains/': 'Feature-based domain modules',
    'src/task-workflow/': 'Core workflow functionality',
  },
  dataAccessStrategy: 'Prisma ORM with Repository Pattern',
  // ... other architectural details
});

// 3. Get intelligent guidance for any task
const guidance = await get_intelligent_task_guidance({
  projectPath: '/workspace/my-app',
  taskName: 'Implement Authentication',
  taskDescription: 'Add JWT-based user authentication with role-based access control',
  roleContext: 'senior-developer',
  includeExamples: true,
  includeRisks: true,
});

// Returns sophisticated, context-aware guidance:
{
  success: true,
  guidance: {
    taskSpecific: {
      approach: 'JWT-based authentication with NestJS Guards',
      steps: ['Install @nestjs/passport...', 'Create AuthModule...'],
      keyFiles: ['src/auth/auth.module.ts', ...]
    },
    techStackGuidance: {
      nestjs: { moduleOrganization: '...', dependencyInjection: '...' },
      typescript: { typing: '...', interfaces: '...' }
    },
    bestPractices: ['Use environment variables for JWT secrets', ...],
    qualityChecklist: ['✅ AuthGuard implemented', '✅ Unit tests written'],
    codeExamples: { authModule: '...', jwtStrategy: '...' }
  },
  intelligence: {
    confidenceScore: 0.92,
    sourcesUsed: { similarProjects: 3, bestPractices: 8 },
    dataSource: 'local_intelligence'
  }
}
```

---

## 📊 **Performance & Benefits**

### **Performance Targets (All Local)**
- **Basic MCP Operations**: <20ms (unchanged)
- **Intelligence-Enhanced Operations**: <100ms 
- **Vector Similarity Search**: <50ms
- **RAG Enhancement**: <80ms
- **Complete Enhanced Response**: <150ms

### **Resource Usage**
- **Disk Space**: ~500MB (models + data)
- **Memory**: ~200MB additional
- **CPU**: Minimal impact (embeddings cached)
- **Network**: Zero (completely offline)

### **Expected Benefits**
- 🚀 **Expert-Level Guidance**: Every role gets sophisticated, tech-stack-specific guidance
- 💰 **Zero Operational Costs**: No API fees, no external dependencies
- 🔒 **Complete Privacy**: User data never leaves their machine
- ⚡ **High Performance**: Local operations faster than API calls
- 📚 **Growing Intelligence**: Knowledge base improves with each project
- 🎯 **Context-Aware**: Guidance tailored to exact tech stack and project type

This open source, local intelligence system gives you **enterprise-level intelligent guidance** with zero ongoing costs and complete data control! 🎉