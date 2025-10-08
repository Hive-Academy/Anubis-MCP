import { Injectable, Logger } from '@nestjs/common';
import { WorkflowEventsGateway } from './workflow-events.gateway';

export interface WorkflowBootstrappedEvent {
  executionId: string;
  firstStepId: string | null;
  role: { id: string; name: string } | null;
  message: string;
  projectPath?: string;
  executionMode?: 'GUIDED' | 'AUTOMATED' | 'HYBRID';
  timestamp: string;
}

@Injectable()
export class WorkflowEventsService {
  private readonly logger = new Logger(WorkflowEventsService.name);

  constructor(private readonly gateway: WorkflowEventsGateway) {}

  emitWorkflowBootstrapped(event: WorkflowBootstrappedEvent): void {
    this.logger.log(
      `Emitting workflow.bootstrapped for execution ${event.executionId}`,
    );
    this.gateway.emit('workflow.bootstrapped', event);
  }
}
