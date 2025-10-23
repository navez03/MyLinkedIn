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
}
