import { apiHelpers, ApiResponse } from './api';

interface ConnectionRequest {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
}

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  connected_at: string;
}

interface SendConnectionRequestDto {
  senderId: string;
  receiverId?: string;
  receiverEmail?: string;
}

interface AcceptConnectionRequestDto {
  requestId: number;
  userId: string;
}

interface ConnectionRequestResponse {
  success: boolean;
  message: string;
  request?: ConnectionRequest;
}

interface GetConnectionsResponse {
  success: boolean;
  message: string;
  connections: Connection[];
}

interface GetPendingRequestsResponse {
  success: boolean;
  message: string;
  pendingRequests: {
    sent: ConnectionRequest[];
    received: ConnectionRequest[];
  };
}

export const connectionAPI = {
  sendConnectionRequest: async (senderId: string, data: SendConnectionRequestDto): Promise<ApiResponse<ConnectionRequestResponse>> => {
    return apiHelpers.post('/connection/request', data);
  },

  acceptConnectionRequest: async (userId: string, data: AcceptConnectionRequestDto): Promise<ApiResponse<ConnectionRequestResponse>> => {
    return apiHelpers.post('/connection/accept', { ...data, userId });
  },

  rejectConnectionRequest: async (userId: string, requestId: string): Promise<ApiResponse<ConnectionRequestResponse>> => {
    return apiHelpers.post(`/connection/reject/${requestId}`, { userId });
  },

  getConnections: async (userId: string): Promise<ApiResponse<GetConnectionsResponse>> => {
    return apiHelpers.get(`/connection/connections?userId=${userId}`);
  },

  getPendingRequests: async (userId: string): Promise<ApiResponse<GetPendingRequestsResponse>> => {
    return apiHelpers.get(`/connection/pending-requests?userId=${userId}`);
  },

  removeConnection: async (userId: string, connectionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiHelpers.delete(`/connection/connections/${connectionId}`, false, { userId });
  },
};
