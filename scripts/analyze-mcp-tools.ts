/**
 * 📊 MCP TOOL SCHEMA ANALYZER
 * 
 * Purpose: Comprehensive analysis of all MCP tools and their schemas
 * Provides detailed recommendations for validation decorator configuration
 */

import * as fs from 'fs';
import * as path from 'path';

interface ToolAnalysis {
  service: string;
  toolName: string;
  schemaName: string;
  methodName: string;
  schemaLocation: string;
  workflowIds: {
    found: string[];
    required: string[];
    optional: string[];
  };
  recommendedConfig: {
    requiredIds: string[];
    allowBootstrap: boolean;
    contextSelectionStrategy: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
  };
  currentStatus: 'Complete' | 'Pending' | 'Not Found';
  integrationComplexity: 'Simple' | 'Medium' | 'Complex';
}

const MCP_SERVICES = [
  'src/domains/workflow-rules/mcp-operations/role-transition-mcp.service.ts',
  'src/domains/workflow-rules/mcp-operations/workflow-guidance-mcp.service.ts', 
  'src/domains/workflow-rules/mcp-operations/workflow-execution-mcp.service.ts',
  'src/domains/workflow-rules/mcp-operations/step-execution-mcp.service.ts',
  'src/domains/task-management/review-operations.service.ts',
  'src/domains/task-management/research-operations.service.ts',
  'src/domains/task-management/individual-subtask-operations.service.ts',
  'src/domains/init-rules/mcp-operations/init-rules-mcp.service.ts',
];

/**
 * Extract tool information from a service file
 */
function extractToolsFromService(filePath: string): ToolAnalysis[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Service not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const tools: ToolAnalysis[] = [];

  // Look for @Tool decorators
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().includes('@Tool({')) {
      const tool = analyzeToolAtLine(filePath, content, lines, i);
      if (tool) {
        tools.push(tool);
      }
    }
  }

  return tools;
}

/**
 * Analyze a specific tool at a given line
 */
function analyzeToolAtLine(filePath: string, content: string, lines: string[], lineIndex: number): ToolAnalysis | null {
  // Extract tool name
  const toolNameMatch = lines[lineIndex].match(/name:\s*['"`]([^'"`]+)['"`]/);
  if (!toolNameMatch) {
    // Tool name might be on next lines
    for (let j = lineIndex + 1; j < Math.min(lineIndex + 5, lines.length); j++) {
      const nameMatch = lines[j].match(/name:\s*['"`]([^'"`]+)['"`]/);
      if (nameMatch) {
        return analyzeToolAtLine(filePath, content, lines, j);
      }
    }
    return null;
  }

  const toolName = toolNameMatch[1];
  
  // Extract schema name from parameters field
  let schemaName = '';
  for (let j = lineIndex; j < Math.min(lineIndex + 10, lines.length); j++) {
    const paramMatch = lines[j].match(/parameters:\s*([A-Za-z][A-Za-z0-9]*(?:Schema|Input))/);
    if (paramMatch) {
      schemaName = paramMatch[1];
      break;
    }
  }

  // Find method name
  let methodName = '';
  for (let j = lineIndex + 1; j < Math.min(lineIndex + 15, lines.length); j++) {
    const methodMatch = lines[j].match(/(?:async\s+)?([A-Za-z][A-Za-z0-9]*)\s*\(/);
    if (methodMatch && !methodMatch[1].includes('Tool')) {
      methodName = methodMatch[1];
      break;
    }
  }

  // Analyze schema for workflow IDs
  const schemaAnalysis = analyzeSchemaInFile(content, schemaName);
  
  // Check current integration status
  const hasValidation = content.includes('AutoWorkflowValidation') && 
                       content.includes(`@AutoWorkflowValidation(${schemaName}`);
  
  const currentStatus: 'Complete' | 'Pending' | 'Not Found' = 
    hasValidation ? 'Complete' : (schemaName ? 'Pending' : 'Not Found');

  // Generate recommendations
  const recommendations = generateRecommendations(toolName, schemaAnalysis);

  return {
    service: path.basename(filePath),
    toolName,
    schemaName,
    methodName,
    schemaLocation: `Found in ${filePath}`,
    workflowIds: schemaAnalysis,
    recommendedConfig: recommendations,
    currentStatus,
    integrationComplexity: determineComplexity(schemaAnalysis, toolName),
  };
}

/**
 * Analyze schema content for workflow IDs
 */
function analyzeSchemaInFile(content: string, schemaName: string) {
  const workflowIds = {
    found: [] as string[],
    required: [] as string[],
    optional: [] as string[],
  };

  if (!schemaName) return workflowIds;

  // Find schema definition
  const schemaRegex = new RegExp(`const\\s+${schemaName}\\s*=([\\s\\S]*?)(?=;|const|export|\\n\\n)`, 'g');
  const schemaMatch = schemaRegex.exec(content);
  
  if (schemaMatch) {
    const schemaContent = schemaMatch[1];
    
    // Look for workflow ID fields
    const idPatterns = ['executionId', 'taskId', 'currentRoleId', 'currentStepId', 'roleId', 'stepId'];
    
    for (const idPattern of idPatterns) {
      if (schemaContent.includes(idPattern)) {
        workflowIds.found.push(idPattern);
        
        // Check if it's optional
        const fieldRegex = new RegExp(`${idPattern}:\\s*z\\.[^,}]*\\.optional\\(\\)|${idPattern}:\\s*z\\.[^,}]*\\?`);
        if (fieldRegex.test(schemaContent)) {
          workflowIds.optional.push(idPattern);
        } else {
          workflowIds.required.push(idPattern);
        }
      }
    }
  }

  return workflowIds;
}

/**
 * Generate validation configuration recommendations
 */
function generateRecommendations(toolName: string, workflowIds: any) {
  const config = {
    requiredIds: [] as string[],
    allowBootstrap: false,
    contextSelectionStrategy: 'mostRecent',
    priority: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
  };

  // Map found IDs to standard names
  const idMapping: Record<string, string> = {
    'roleId': 'currentRoleId',
    'stepId': 'currentStepId',
  };

  config.requiredIds = workflowIds.required.map((id: string) => idMapping[id] || id);

  // Tool-specific configurations
  switch (toolName) {
    case 'bootstrap_workflow':
    case 'init_rules':
      config.allowBootstrap = true;
      config.requiredIds = [];
      config.priority = 'Low';
      break;
      
    case 'get_step_guidance':
    case 'report_step_completion':
    case 'get_role_transitions':
    case 'execute_transition':
      config.priority = 'Critical';
      if (workflowIds.found.includes('taskId')) {
        config.contextSelectionStrategy = 'byTaskId';
      } else if (workflowIds.found.includes('executionId')) {
        config.contextSelectionStrategy = 'byExecutionId';
      }
      break;
      
    case 'task_operations':
    case 'individual_subtask_operations':
      config.priority = 'High';
      config.contextSelectionStrategy = 'byTaskId';
      break;
      
    default:
      config.priority = 'Medium';
  }

  return config;
}

/**
 * Determine integration complexity
 */
function determineComplexity(workflowIds: any, toolName: string): 'Simple' | 'Medium' | 'Complex' {
  if (workflowIds.found.length === 0) return 'Simple';
  if (workflowIds.found.length <= 2) return 'Medium';
  return 'Complex';
}

/**
 * Generate integration report
 */
function generateReport(allTools: ToolAnalysis[]): void {
  console.log('🔍 MCP TOOL SCHEMA ANALYSIS REPORT\n');
  
  const byStatus = {
    Complete: allTools.filter(t => t.currentStatus === 'Complete'),
    Pending: allTools.filter(t => t.currentStatus === 'Pending'),
    NotFound: allTools.filter(t => t.currentStatus === 'Not Found'),
  };

  console.log(`📊 SUMMARY:`);
  console.log(`  ✅ Complete: ${byStatus.Complete.length}`);
  console.log(`  🟡 Pending: ${byStatus.Pending.length}`);
  console.log(`  ❌ Schema Not Found: ${byStatus.NotFound.length}`);
  console.log(`  📋 Total Tools: ${allTools.length}\n`);

  // Detailed analysis for pending tools
  console.log('🔧 PENDING INTEGRATIONS:\n');
  
  const byPriority = {
    Critical: byStatus.Pending.filter(t => t.recommendedConfig.priority === 'Critical'),
    High: byStatus.Pending.filter(t => t.recommendedConfig.priority === 'High'),
    Medium: byStatus.Pending.filter(t => t.recommendedConfig.priority === 'Medium'),
    Low: byStatus.Pending.filter(t => t.recommendedConfig.priority === 'Low'),
  };

  ['Critical', 'High', 'Medium', 'Low'].forEach(priority => {
    const tools = (byPriority as any)[priority] as ToolAnalysis[];
    if (tools.length > 0) {
      console.log(`🔴 ${priority.toUpperCase()} PRIORITY (${tools.length} tools):`);
      tools.forEach(tool => {
        console.log(`   - ${tool.toolName} (${tool.service})`);
        console.log(`     Schema: ${tool.schemaName || 'NOT FOUND'}`);
        console.log(`     IDs Found: [${tool.workflowIds.found.join(', ')}]`);
        console.log(`     Required: [${tool.workflowIds.required.join(', ')}]`);
        console.log(`     Config: ${JSON.stringify(tool.recommendedConfig, null, 8)}`);
        console.log();
      });
    }
  });

  // Generate integration commands
  console.log('🚀 RECOMMENDED INTEGRATION ORDER:\n');
  ['Critical', 'High', 'Medium', 'Low'].forEach(priority => {
    const tools = (byPriority as any)[priority] as ToolAnalysis[];
    if (tools.length > 0) {
      console.log(`${priority.toUpperCase()} Priority:`);
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. Integrate ${tool.toolName} in ${tool.service}`);
        console.log(`   @AutoWorkflowValidation(${tool.schemaName}, '${tool.toolName}', ${JSON.stringify(tool.recommendedConfig).replace(/"/g, "'")})`);
      });
      console.log();
    }
  });
}

/**
 * Main analysis function
 */
async function analyzeMcpTools(): Promise<void> {
  console.log('🔍 Starting comprehensive MCP tool analysis...\n');

  const allTools: ToolAnalysis[] = [];

  for (const servicePath of MCP_SERVICES) {
    console.log(`📝 Analyzing ${servicePath}...`);
    const tools = extractToolsFromService(servicePath);
    allTools.push(...tools);
  }

  // Generate comprehensive report
  generateReport(allTools);

  // Save detailed analysis to file
  const reportPath = 'docs/MCP_TOOL_ANALYSIS_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(allTools, null, 2));
  console.log(`💾 Detailed analysis saved to: ${reportPath}\n`);

  console.log('🎯 NEXT STEPS:');
  console.log('1. Review the analysis above');
  console.log('2. Start with CRITICAL priority tools');
  console.log('3. Use the generated @AutoWorkflowValidation decorators');
  console.log('4. Test each integration with npm run build');
  console.log('5. Move to next priority level');
}

// Run the analysis
analyzeMcpTools().catch(console.error);
