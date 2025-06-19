import { Module } from '@nestjs/common';
import { InitRulesService } from './init-rules.service';
import { CopilotRule } from './rules/copilot.rule';
import { CursorRule } from './rules/cursor.rule';
import { InitRulesMcpService } from './mcp-operations/init-rules-mcp.service';

@Module({
  providers: [InitRulesService, CopilotRule, CursorRule, InitRulesMcpService],
  exports: [InitRulesService, InitRulesMcpService],
})
export class InitRulesModule {}
