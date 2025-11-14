import { apiHelpers, ApiResponse } from "./api";

export type NotificationKind =
  | "message"
  | "connection_request"
  | "event_invitation";

export interface Notification {
  id: string;
  user_id: string;
  kind: NotificationKind;
  source_table: "messages" | "connection_requests" | "event_invitations";
  source_id: string; // guardado como string (uuid ou int)
  created_at: string; // ISO
  is_read: boolean;
  sender_name?: string;
  sender_id?: string;
  sender_avatar_url?: string | null;
  event_name?: string; // Nome do evento associado (se aplicável)
}

export interface ListNotificationsParams {
  userId: string;
  unreadOnly?: boolean; // default: false
  limit?: number; // default: 20
  offset?: number; // default: 0
}

export interface ListNotificationsResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
}

export interface MarkReadDto {
  notificationId: string;
  read?: boolean; // default: true
}

export interface MarkAllReadDto {
  userId: string;
}

// --- API ---

export const notificationAPI = {
  list: async (
    userId: string
  ): Promise<ApiResponse<ListNotificationsResponse>> => {
    return apiHelpers.get(
      `/notifications/list?userId=${userId}&unreadOnly=false&limit=20&offset=0`,
      true
    );
  },

  /**
   * Marca uma notificação como lida (ou por ler se read=false)
   */
  markRead: async (
    data: MarkReadDto
  ): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      notification: Notification;
    }>
  > => {
    const body = { ...data, read: data.read ?? true };
    // usar POST para manter consistência com o teu exemplo
    return apiHelpers.post("/notifications/read", body, true);
  },

  /**
   * Marca todas as notificações como lidas para um utilizador
   */
  markAllRead: async (
    data: MarkAllReadDto
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiHelpers.post("/notifications/read/all", data, true);
  },
  /**
   * Apaga uma notificação pelo id
   */
  delete: async (
    notificationId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiHelpers.delete(`/notifications/${notificationId}`, true);
  },
};
