import { Injectable } from '@nestjs/common';
import { StepDataUtils } from '../utils/step-data.utils';
import {
  extractStreamlinedGuidance,
  StepNotFoundError,
} from '../utils/step-service-shared.utils';
import { StepQueryService } from './step-query.service';
import { RequiredInputExtractorService } from './required-input-extractor.service';

export interface StepGuidanceContext {
  taskId: number;
  roleId: string;
  stepId: string;
}

// Custom Error Classes - Using shared utilities
export class StepConfigNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StepConfigNotFoundError';
  }
}

@Injectable()
export class StepGuidanceService {
  constructor(
    private readonly stepQueryService: StepQueryService,
    private readonly requiredInputService: RequiredInputExtractorService,
  ) {}

  /**
   * 🔥 STREAMLINED SCHEMA: Get MCP actions and step guidance from database
   */
  async getStepGuidance(context: StepGuidanceContext) {
    const step = await this.stepQueryService.getStepWithMcpActions(
      context.stepId,
    );
    if (!step) {
      throw new StepNotFoundError(
        context.stepId,
        'StepGuidanceService',
        'getStepGuidance',
      );
    }

    // Extract MCP actions with dynamic parameter information
    const mcpActions = step.mcpActions.map((action) => {
      return {
        ...action,
        schema: this.requiredInputService.extractFromServiceSchema(
          action.serviceName,
          action.operation,
        ),
      };
    });

    // Get guidance from database step data
    const enhancedGuidance = extractStreamlinedGuidance(step);

    return {
      step: StepDataUtils.extractStepInfo(step),
      mcpActions,
      qualityChecklist: enhancedGuidance.qualityChecklist,
      stepByStep: enhancedGuidance.stepByStep,
      approach: step.approach,
      guidance: step.stepGuidance,
    };
  }
}
