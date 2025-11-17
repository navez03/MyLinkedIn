import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { MessageService } from '../Messages/messageService';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly messageService: MessageService
  ) { }

  async sendConnectionRequest(senderId: string, token: string, receiverId?: string, receiverEmail?: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    let targetUserId = receiverId;
    if (receiverEmail && !receiverId) {
      // Admin client needed for listing users by email
      const { data: userData, error: userError } = await this.supabaseService.getAdminClient().auth.admin.listUsers();

      if (userError) {
        throw new Error('Error searching for user by email');
      }

      const user = (userData.users as Array<{ id: string; email: string }>).find(u => u.email === receiverEmail);
      if (!user) {
        throw new Error('User not found with the provided email');
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      throw new Error('Receiver ID or email must be provided');
    }

    if (senderId === targetUserId) {
      throw new Error('Cannot send connection request to yourself');
    }

    // O RLS garante que apenas o utilizador autenticado pode criar connection requests
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${senderId})`);

    if (existingConnection && existingConnection.length > 0) {
      throw new Error('You are already connected with this user');
    }

    const { data: existingRequest } = await supabase
      .from('connection_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${senderId})`);

    if (existingRequest && existingRequest.length > 0) {
      throw new Error('Connection request already exists between these users');
    }

    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: senderId,
        receiver_id: targetUserId,
        status: 'pending'
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error sending connection request: ${error.message}`);
    }

    return data;
  }

  async acceptConnectionRequest(requestId: number, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestError || !request) {
      throw new Error('Connection request not found or you are not authorized to accept it');
    }

    const user1_id = request.sender_id < request.receiver_id ? request.sender_id : request.receiver_id;
    const user2_id = request.sender_id < request.receiver_id ? request.receiver_id : request.sender_id;

    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .insert({
        user1_id,
        user2_id
      })
      .select()
      .single();

    if (connectionError) {
      throw new Error(`Error creating connection: ${connectionError.message}`);
    }

    // Remove the connection request after accepting
    const { error: deleteError } = await supabase
      .from('connection_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      throw new Error(`Connection created, but failed to remove request: ${deleteError.message}`);
    }

    return connection;
  }

  async rejectConnectionRequest(requestId: string, userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { error } = await supabase
      .from('connection_requests')
      .delete()
      .eq('id', parseInt(requestId))
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Error deleting connection request: ${error.message}`);
    }

    return { success: true };
  }

  async getConnections(userId: string, token?: string) {
    const supabase = token
      ? this.supabaseService.getClientWithToken(token)
      : this.supabaseService.getClient();

    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (connectionsError) {
      throw new Error(`Error fetching connections: ${connectionsError.message}`);
    }

    if (!connections || connections.length === 0) {
      return [];
    }

    const connectedUsers = await Promise.all(connections.map(async (conn: any) => {
      const otherUserId = conn.user1_id === userId ? conn.user2_id : conn.user1_id;
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', otherUserId)
        .single();

      return {
        id: conn.id,
        user: userData || { id: otherUserId, name: 'Unknown User', email: '', avatar_url: null },
        connected_at: conn.created_at
      };
    }));

    return connectedUsers;
  }

  async getPendingRequests(userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: sentRequests, error: sentError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) {
      throw new Error(`Error fetching sent requests: ${sentError.message}`);
    }

    const { data: receivedRequests, error: receivedError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (receivedError) {
      throw new Error(`Error fetching received requests: ${receivedError.message}`);
    }

    return {
      sent: sentRequests || [],
      received: receivedRequests || []
    };
  }

  async removeConnection(userId: string, connectionId: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (fetchError || !connection) {
      throw new Error('Connection not found or you are not authorized to remove it');
    }

    const user1Id = connection.user1_id;
    const user2Id = connection.user2_id;
    await this.messageService.deleteMessagesBetweenUsers(user1Id, user2Id, token);

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Error removing connection: ${error.message}`);
    }

    return { success: true };
  }
}
