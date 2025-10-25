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
};

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) { }

  async list(userId: string, unreadOnly = false, limit = 20, offset = 0) {
    const client = this.supabase.getClient();

    // Devolve todos os campos relevantes
    let query = client
      .from("notifications")
      .select("id, user_id, kind, source_table, source_id, created_at, is_read")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) throw error;
    return data as Notification[];
  }

  async markRead(notificationId: string, read = true) {
    console.log('markRead called with:', { notificationId, read });

    const { data, error } = await this.supabase
      .getClient()
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

  async markAllRead(userId: string) {
    const { error } = await this.supabase
      .getClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return { ok: true };
  }

  async delete(notificationId: string) {
    const { error } = await this.supabase
      .getClient()
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    if (error) throw error;
    return { ok: true };
  }
}
