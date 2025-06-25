import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { InitRulesService } from '../init-rules.service';

// Schema definitions for MCP operations
const InitRulesInputSchema = z.object({
  agentName: z
    .enum(['cursor', 'copilot', 'roocode', 'kilocode'])
    .describe('AI agent to deploy rules for'),
  projectRoot: z
    .string()
    .optional()
    .describe(
      'Root directory of the target project. Defaults to current working directory.',
    ),
  workflowType: z
    .enum(['turbo', 'multiRole'])
    .optional()
    .describe(
      'Workflow type to deploy: turbo for focused rapid development, multiRole for collaborative multi-role complex workflows. Defaults to multiRole.',
    ),
  templateFile: z
    .string()
    .optional()
    .describe('Optional specific template file to use instead of the default'),
});

type InitRulesInput = z.infer<typeof InitRulesInputSchema>;

@Injectable()
export class InitRulesMcpService {
  constructor(private readonly initRulesService: InitRulesService) {}

  /**
   * MCP tool to deploy Anubis workflow rules to specified AI agent
   */
  @Tool({
    name: 'init_rules',
    description:
      'Initialize Anubis workflow rules to specified AI agent with workflow type selection',
    parameters: InitRulesInputSchema as ZodSchema<InitRulesInput>,
  })
  async InitRules(input: InitRulesInput) {
    try {
      const projectRoot = input.projectRoot || process.cwd();

      const result = await this.initRulesService.InitRules(
        input.agentName,
        projectRoot,
        {
          workflowType: input.workflowType,
          templateFile: input.templateFile,
        },
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: result.success,
                message:
                  'message' in result ? result.message : 'No message available',
                data: {
                  targetFile: result.targetFile,
                  workflowType: result.workflowType,
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: false,
                error: {
                  message: error.message,
                  code: 'DEPLOY_RULES_ERROR',
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  }
}
