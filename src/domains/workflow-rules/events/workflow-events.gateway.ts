import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/workflow' })
export class WorkflowEventsGateway implements OnModuleInit {
  private readonly logger = new Logger(WorkflowEventsGateway.name);

  @WebSocketServer()
  server!: Server;

  onModuleInit() {
    this.logger.log('Workflow WebSocket gateway initialized at /workflow');
  }

  emit(event: string, payload: unknown) {
    if (!this.server) {
      this.logger.warn(`Attempted to emit ${event} before gateway init`);
      return;
    }
    this.server.emit(event, payload);
  }
}
