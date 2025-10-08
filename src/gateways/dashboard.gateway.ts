import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  ExecutionOverview,
  TaskDetail,
  TimelineEvent,
  WebSocketMessage,
} from '../types/dashboard.types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.DASHBOARD_CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  afterInit(_server: Server) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Basic authentication - can be enhanced with JWT validation
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!this.validateToken(token)) {
        this.logger.warn(`Unauthorized connection attempt from ${client.id}`);
        client.disconnect(true);
        return;
      }

      // Extract user info from token (simplified for now)
      client.userId = this.extractUserIdFromToken(token);
      client.userRole = this.extractUserRoleFromToken(token);

      this.connectedClients.set(client.id, client);

      this.logger.log(
        `Client connected: ${client.id} (User: ${client.userId}, Role: ${client.userRole})`,
      );

      // Join user to appropriate rooms based on role
      await this.assignClientToRooms(client);

      // Send initial data
      this.sendInitialData(client);
    } catch (error) {
      this.logger.error(
        `Error handling connection for client ${client.id}:`,
        error,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(
      `Client disconnected: ${client.id} (User: ${client.userId})`,
    );
  }

  @SubscribeMessage('subscribe_executions')
  async handleSubscribeExecutions(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() _data: { filters?: any },
  ) {
    try {
      await client.join('executions');
      this.logger.log(`Client ${client.id} subscribed to executions`);

      client.emit('subscription_confirmed', {
        type: 'executions',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error subscribing client ${client.id} to executions:`,
        error,
      );
      client.emit('subscription_error', {
        type: 'executions',
        error: 'Failed to subscribe',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('subscribe_task')
  async handleSubscribeTask(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { taskId: number },
  ) {
    try {
      const taskRoom = `task_${data.taskId}`;
      await client.join(taskRoom);
      this.logger.log(`Client ${client.id} subscribed to task ${data.taskId}`);

      client.emit('subscription_confirmed', {
        type: 'task',
        taskId: data.taskId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(
        `Error subscribing client ${client.id} to task ${data.taskId}:`,
        error,
      );
      client.emit('subscription_error', {
        type: 'task',
        taskId: data.taskId,
        error: 'Failed to subscribe',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { type: string; taskId?: number },
  ) {
    try {
      if (data.type === 'executions') {
        await client.leave('executions');
      } else if (data.type === 'task' && data.taskId) {
        await client.leave(`task_${data.taskId}`);
      }

      client.emit('unsubscription_confirmed', {
        type: data.type,
        taskId: data.taskId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error unsubscribing client ${client.id}:`, error);
    }
  }

  // Public methods for broadcasting updates
  broadcastExecutionUpdate(execution: ExecutionOverview) {
    const message: WebSocketMessage = {
      type: 'execution.updated',
      data: execution,
      timestamp: new Date(),
    };

    this.server.to('executions').emit('execution_updated', message);
    this.logger.debug(`Broadcasted execution update for ${execution.id}`);
  }

  broadcastTaskUpdate(task: TaskDetail) {
    const message: WebSocketMessage = {
      type: 'task.updated',
      data: task,
      timestamp: new Date(),
    };

    this.server.to(`task_${task.id}`).emit('task_updated', message);
    this.logger.debug(`Broadcasted task update for ${task.id}`);
  }

  broadcastTimelineEvent(event: TimelineEvent) {
    const message: WebSocketMessage = {
      type: 'timeline.event',
      data: event,
      timestamp: new Date(),
    };

    // Broadcast to all connected clients for timeline events
    this.server.emit('timeline_event', message);
    this.logger.debug(`Broadcasted timeline event: ${event.type}`);
  }

  // Private helper methods
  private validateToken(token: string): boolean {
    // Simplified validation - in production, validate JWT properly
    if (!token) return false;

    // For now, accept any non-empty token
    // TODO: Implement proper JWT validation
    return token.length > 0;
  }

  private extractUserIdFromToken(token: string): string {
    // Simplified extraction - in production, decode JWT
    // For now, return a default user ID
    return token.substring(0, 8) || 'anonymous';
  }

  private extractUserRoleFromToken(_token: string): string {
    // Simplified extraction - in production, decode JWT
    // For now, return a default role
    return 'user';
  }

  private async assignClientToRooms(client: AuthenticatedSocket) {
    // Assign clients to rooms based on their role
    switch (client.userRole) {
      case 'admin':
        await client.join('admin');
        await client.join('executions');
        break;
      case 'developer':
        await client.join('developer');
        await client.join('executions');
        break;
      default:
        await client.join('user');
        break;
    }
  }

  private sendInitialData(client: AuthenticatedSocket) {
    try {
      // Send welcome message with client info
      client.emit('connected', {
        clientId: client.id,
        userId: client.userId,
        userRole: client.userRole,
        timestamp: new Date(),
        message: 'Connected to dashboard updates',
      });
    } catch (error) {
      this.logger.error(`Error sending initial data to ${client.id}:`, error);
    }
  }

  // Health check method
  getConnectionStats() {
    return {
      totalConnections: this.connectedClients.size,
      clients: Array.from(this.connectedClients.values()).map((client) => ({
        id: client.id,
        userId: client.userId,
        userRole: client.userRole,
        rooms: Array.from(client.rooms),
      })),
    };
  }
}
