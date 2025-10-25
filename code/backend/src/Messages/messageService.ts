import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class MessageService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async sendMessage(data: { senderId: string; receiverId: string; content: string }) {
    const supabase = this.supabaseService.getClient();
    const { senderId, receiverId, content } = data;

    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`);

    if (connectionError || !connection || connection.length === 0) {
      throw new Error('The users are not connected');
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (messageError) {
      throw new Error(`Error sending message: ${messageError.message}`);
    }

    return message;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string) {
    const supabase = this.supabaseService.getClient();

    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`);

    if (connectionError || !connection || connection.length === 0) {
      throw new Error('The users are not connected');
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(`Error getting messages: ${messagesError.message}`);
    }

    return messages;
  }

  async getUserConversations(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      throw new Error(`Error getting conversations: ${messagesError.message}`);
    }

    const userIds = new Set<string>();
    messages.forEach((msg) => {
      if (msg.sender_id !== userId) userIds.add(msg.sender_id);
      if (msg.receiver_id !== userId) userIds.add(msg.receiver_id);
    });

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', Array.from(userIds));

    if (usersError) {
      throw new Error(`Error getting users: ${usersError.message}`);
    }

    return users || [];
  }

  async deleteMessagesBetweenUsers(user1Id: string, user2Id: string) {
    const supabase = this.supabaseService.getClient();

    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`);

    if (deleteError) {
      throw new Error(`Error deleting messages: ${deleteError.message}`);
    }

    return { success: true, message: 'All messages deleted successfully' };
  }
}
