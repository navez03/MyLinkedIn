import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../config/supabaseClient";

export type Notification = {
  id: string;
  user_id: string;
  kind: "message" | "connection_request";
  source_table: string;
  source_id: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
  sender_id?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) { }

  async list(userId: string, token: string, unreadOnly = false, limit = 20, offset = 0) {
    const client = this.supabase.getClientWithToken(token);

    let query = client
      .from("notifications")
      .select("id, user_id, kind, source_table, source_id, created_at, is_read")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) throw error;

    const notifications = data as Notification[];

    // Enrich notifications with sender information
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        try {
          let senderId: string | null = null;

          if (notification.kind === "message" && notification.source_table === "messages") {
            // Get sender from messages table using source_id
            const { data: message } = await client
              .from("messages")
              .select("sender_id")
              .eq("id", notification.source_id)
              .single();
            senderId = message?.sender_id;
          } else if (notification.kind === "connection_request" && notification.source_table === "connection_requests") {
            // Get sender from connection_requests table using source_id
            const { data: request } = await client
              .from("connection_requests")
              .select("sender_id")
              .eq("id", notification.source_id)
              .single();
            senderId = request?.sender_id;
          }

          if (senderId) {
            // Get user details from users table
            const { data: user } = await client
              .from("users")
              .select("id, name")
              .eq("id", senderId)
              .single();

            if (user) {
              notification.sender_name = user.name;
              notification.sender_id = user.id;
            }
          }
        } catch (err) {
          console.error("Error enriching notification:", err);
        }

        return notification;
      })
    );

    return enrichedNotifications;
  }

  async markRead(notificationId: string, token: string, read = true) {
    console.log('markRead called with:', { notificationId, read });

    const client = this.supabase.getClientWithToken(token);

    const { data, error } = await client
      .from("notifications")
      .update({ is_read: read })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error in markRead:', error);
      throw error;
    }

    console.log('markRead result:', data);
    return data as Notification;
  }

  async markAllRead(userId: string, token: string) {
    const client = this.supabase.getClientWithToken(token);

    const { error } = await client
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return { ok: true };
  }

  async delete(notificationId: string, token: string) {
    const client = this.supabase.getClientWithToken(token);

    const { error } = await client
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    if (error) throw error;
    return { ok: true };
  }
}
