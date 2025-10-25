import { io, Socket } from 'socket.io-client';
import { apiHelpers } from './api';


class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  BACKEND_URL = apiHelpers.getBackendUrl();

  connect(userId: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.userId = userId;
    this.socket = io(this.BACKEND_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.socket?.emit('user-online', { userId });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  sendMessage(senderId: string, receiverId: string, content: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('send-message', {
      senderId,
      receiverId,
      content,
    });
  }

  onNewMessage(callback: (data: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('new-message', callback);
  }

  onMessageSent(callback: (data: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('message-sent', callback);
  }

  onMessageError(callback: (data: any) => void) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.socket.on('message-error', callback);
  }


  removeListener(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
