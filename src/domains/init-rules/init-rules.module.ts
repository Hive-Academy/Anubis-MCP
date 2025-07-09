import { Module } from '@nestjs/common';
import { InitRulesService } from './init-rules.service';
import { InitRulesMcpService } from './mcp-operations/init-rules-mcp.service';

@Module({
  providers: [InitRulesService, InitRulesMcpService],
  exports: [InitRulesService, InitRulesMcpService],
})
export class InitRulesModule {}
