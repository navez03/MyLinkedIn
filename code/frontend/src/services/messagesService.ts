import { apiHelpers, ApiResponse } from './api';

export const messagesAPI = {

  sendMessage: async (senderId: string, receiverId: string, content?: string, postId?: string, eventId?: string): Promise<ApiResponse<{ message: string }>> => {
    return apiHelpers.post<{ message: string }>('/messages', { senderId, receiverId, content, postId, eventId }, true);
  },

  getMessagesBetweenUsers: async (user1Id: string, user2Id: string): Promise<ApiResponse<{ messages: any[] }>> => {
    return apiHelpers.get<{ messages: any[] }>(`/messages/${user1Id}/${user2Id}`, true);
  },

  getUserConversations: async (userId: string): Promise<ApiResponse<{ users: any[] }>> => {
    return apiHelpers.get<{ users: any[] }>(`/messages/conversations/${userId}`, true);
  }
};
