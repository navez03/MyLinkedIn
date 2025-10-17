import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class ConnectionService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async sendConnectionRequest(senderId: string, receiverId?: string, receiverEmail?: string) {
    const supabase = this.supabaseService.getClient();

    let targetUserId = receiverId;
    if (receiverEmail && !receiverId) {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

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

    // Create connection request without trying to join with users table
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

  async acceptConnectionRequest(requestId: number, userId: string) {
    const supabase = this.supabaseService.getClient();

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

    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      throw new Error(`Error updating connection request: ${updateError.message}`);
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
      await supabase
        .from('connection_requests')
        .update({ status: 'pending' })
        .eq('id', requestId);

      throw new Error(`Error creating connection: ${connectionError.message}`);
    }

    return connection;
  }

  async rejectConnectionRequest(requestId: string, userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'rejected' })
      .eq('id', parseInt(requestId))
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      throw new Error(`Error rejecting connection request: ${error.message}`);
    }

    if (!data) {
      throw new Error('Connection request not found or you are not authorized to reject it');
    }

    return data;
  }

  async getConnections(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get connections without JOIN
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (connectionsError) {
      throw new Error(`Error fetching connections: ${connectionsError.message}`);
    }

    // Get sent requests without JOIN
    const { data: sentRequests, error: sentError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) {
      throw new Error(`Error fetching sent requests: ${sentError.message}`);
    }

    // Get received requests without JOIN
    const { data: receivedRequests, error: receivedError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (receivedError) {
      throw new Error(`Error fetching received requests: ${receivedError.message}`);
    }

    return {
      connections: connections || [],
      pendingRequests: {
        sent: sentRequests || [],
        received: receivedRequests || []
      }
    };
  }

  async removeConnection(userId: string, connectionId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (fetchError || !connection) {
      throw new Error('Connection not found or you are not authorized to remove it');
    }

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
