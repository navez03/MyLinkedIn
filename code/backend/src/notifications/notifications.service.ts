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
  constructor(private readonly supabase: SupabaseService) {}

  async list(userId: string, unreadOnly = false, limit = 20, offset = 0) {
    const client = this.supabase.getClient();

    // 👉 só estas colunas (adiciona 'created_at' se quiseres o tempo no futuro)
    let query = client
      .from("notifications")
      .select("user_id, kind")
      .eq("user_id", userId)
      .order("user_id", { ascending: true }) // ordenação indiferente aqui
      .range(offset, offset + limit - 1);

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) throw error;
    // data aqui é { user_id, kind }[]
    return data as Pick<Notification, "user_id" | "kind">[];
  }

  async markRead(notificationId: string, read = true) {
    const { data, error } = await this.supabase
      .getClient()
      .from("notifications")
      .update({ is_read: read })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw error;
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
}
