import { Module } from '@nestjs/common';
import { InitRulesService } from './init-rules.service';

@Module({
  providers: [InitRulesService],
  exports: [InitRulesService],
})
export class InitRulesModule {}
