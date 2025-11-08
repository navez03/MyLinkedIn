import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './messageService';

@WebSocketGateway({
  cors: {
    origin: '*'
  },
})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(private readonly messageService: MessageService) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove o usuário do mapa
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('user-online')
  handleUserOnline(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`User ${data.userId} is online with socket ${client.id}`);
    this.userSockets.set(data.userId, client.id);
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    data: {
      senderId: string;
      receiverId: string;
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Extrai o token do handshake do socket
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization || '';
      if (!token) {
        client.emit('message-error', {
          success: false,
          error: 'Token de autenticação não fornecido',
        });
        return { success: false, error: 'Token de autenticação não fornecido' };
      }

      const message = await this.messageService.sendMessage(data, token);

      client.emit('message-sent', {
        success: true,
        message,
      });

      const receiverSocketId = this.userSockets.get(data.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('new-message', {
          message,
        });
      }

      return { success: true, message };
    } catch (error: any) {
      console.error('Error sending message:', error);
      client.emit('message-error', {
        success: false,
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  }
}
