import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { ZodSchema, z } from 'zod';
import { InitRulesService } from '../init-rules.service';

// Schema definitions for MCP operations
const InitRulesInputSchema = z.object({
  agentName: z
    .enum(['cursor', 'copilot'])
    .describe('AI agent to deploy rules for (cursor or copilot)'),
  projectRoot: z
    .string()
    .optional()
    .describe(
      'Root directory of the target project. Defaults to current working directory.',
    ),
});

type InitRulesInput = z.infer<typeof InitRulesInputSchema>;

@Injectable()
export class InitRulesMcpService {
  private readonly logger = new Logger(InitRulesMcpService.name);

  constructor(private readonly initRulesService: InitRulesService) {}

  /**
   * MCP tool to deploy Anubis workflow rules to specified AI agent
   */
  @Tool({
    name: 'init_rules',
    description:
      'Initialize Anubis workflow rules to specified AI agent (cursor or copilot)',
    parameters: InitRulesInputSchema as ZodSchema<InitRulesInput>,
  })
  async InitRules(input: InitRulesInput) {
    try {
      this.logger.log(`Deploying rules for agent: ${input.agentName}`);

      const projectRoot = input.projectRoot || process.cwd();

      // Choose template based on agent
      const templateFile =
        input.agentName === 'cursor'
          ? 'workflow-protocol-function-calls.md'
          : 'workflow-protocol-xml.md';

      const result = await this.initRulesService.InitRules(
        input.agentName,
        projectRoot,
        templateFile,
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
                data: { targetFile: result.targetFile },
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to deploy rules: ${error.message}`);
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
