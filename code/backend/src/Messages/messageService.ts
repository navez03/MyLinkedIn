import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class MessageService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async sendMessage(data: { senderId: string; receiverId: string; content?: string; postId?: string; eventId?: string }, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);
    const { senderId, receiverId, content } = data;

    // O RLS garante que apenas utilizadores autenticados e conectados podem enviar mensagens
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`);

    if (connectionError || !connection || connection.length === 0) {
      throw new Error('The users are not connected');
    }

    // support optional post_id and allow empty content when sharing a post
    const insertObj: any = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: content || '',
      created_at: new Date().toISOString(),
    };

    if ((data as any).postId) {
      insertObj.post_id = (data as any).postId;
    }

    if ((data as any).eventId) {
      insertObj.event_id = (data as any).eventId;
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert(insertObj)
      .select('*')
      .single();

    if (messageError) {
      throw new Error(`Error sending message: ${messageError.message}`);
    }

    return message;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

    // Verificar se os utilizadores estão conectados
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`);

    // Se não estiverem conectados ou houver erro na verificação, retornar array vazio
    if (connectionError) {
      console.warn('Error checking connection:', connectionError.message);
      return [];
    }

    if (!connection || connection.length === 0) {
      console.log('Users are not connected, returning empty messages array');
      return [];
    }

    // Se estiverem conectados, buscar mensagens
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user1Id},receiver_id.eq.${user2Id}),and(sender_id.eq.${user2Id},receiver_id.eq.${user1Id})`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(`Error getting messages: ${messagesError.message}`);
    }

    // If some messages reference posts, fetch those posts and attach a small preview
    const postIds = Array.from(new Set((messages || []).filter((m: any) => m.post_id).map((m: any) => m.post_id)));

    let postsMap: Record<string, any> = {};
    if (postIds.length > 0) {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`id, content, user_id, created_at, image_url, repost_id, users:user_id (name, email, avatar_url)`)
        .in('id', postIds as any[]);

      if (!postsError && posts) {
        // Fetch original posts for reposts
        const repostIds = (posts as any[]).filter(p => p.repost_id).map(p => p.repost_id);
        let originalPostsMap: Record<string, any> = {};

        if (repostIds.length > 0) {
          const { data: originalPosts, error: originalError } = await supabase
            .from('posts')
            .select(`id, content, user_id, created_at, image_url, users:user_id (name, email, avatar_url)`)
            .in('id', repostIds);

          if (!originalError && originalPosts) {
            originalPostsMap = (originalPosts as any[]).reduce((acc, op) => {
              acc[op.id] = {
                content: op.content,
                authorName: op.users?.name,
                authorAvatar: op.users?.avatar_url,
                imageUrl: op.image_url,
                userId: op.user_id,
                createdAt: op.created_at,
              };
              return acc;
            }, {} as Record<string, any>);
          }
        }

        postsMap = (posts as any[]).reduce((acc, p) => {
          const postData: any = {
            id: p.id,
            content: p.content,
            user_id: p.user_id,
            created_at: p.created_at,
            authorName: p.users?.name,
            authorAvatar: p.users?.avatar_url,
            imageUrl: p.image_url,
          };

          // Add repost data if this is a repost
          if (p.repost_id && originalPostsMap[p.repost_id]) {
            postData.isRepost = true;
            postData.repostComment = p.content;
            postData.repostedByName = p.users?.name;
            postData.repostedByAvatar = p.users?.avatar_url;
            postData.originalPost = originalPostsMap[p.repost_id];
          }

          acc[p.id] = postData;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // attach post preview when available
    const messagesWithPost = (messages || []).map((m: any) => ({
      ...m,
      post: m.post_id ? postsMap[m.post_id] || null : null,
    }));

    // If some messages reference events, fetch those events and attach a small preview
    const eventIds = Array.from(new Set((messages || []).filter((m: any) => m.event_id).map((m: any) => m.event_id)));

    let eventsMap: Record<string, any> = {};
    if (eventIds.length > 0) {
      console.log('[Messages] Fetching events for IDs:', eventIds);
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, name, date, time, location_type, organizer_id, banner_url')
        .in('id', eventIds as any[]);

      if (eventsError) {
        console.error('[Messages] Error fetching events:', eventsError);
      } else {
        console.log('[Messages] Events fetched:', events);
      }

      if (!eventsError && events) {
        eventsMap = (events as any[]).reduce((acc, e) => {
          acc[e.id] = {
            id: e.id,
            name: e.name,
            date: e.date,
            time: e.time,
            locationType: e.location_type,
            organizerId: e.organizer_id,
            bannerUrl: e.banner_url,
          };
          return acc;
        }, {} as Record<string, any>);
        console.log('[Messages] Events map created:', eventsMap);
      }
    }

    // attach both post and event previews when available
    const messagesWithExtras = (messages || []).map((m: any) => ({
      ...m,
      post: m.post_id ? postsMap[m.post_id] || null : null,
      event: m.event_id ? eventsMap[m.event_id] || null : null,
    }));

    console.log('[Messages] Final messages with extras:', messagesWithExtras.filter((m: any) => m.event_id));

    return messagesWithExtras || [];
  }

  async getUserConversations(userId: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

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
      .select('id, email, name, avatar_url')
      .in('id', Array.from(userIds));

    if (usersError) {
      throw new Error(`Error getting users: ${usersError.message}`);
    }

    return users || [];
  }

  async deleteMessagesBetweenUsers(user1Id: string, user2Id: string, token: string) {
    const supabase = this.supabaseService.getClientWithToken(token);

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
