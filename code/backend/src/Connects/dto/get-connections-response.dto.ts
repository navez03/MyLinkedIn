export interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  connectedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    name: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    email: string;
  };
}

export class GetConnectionsResponseDto {
  success: boolean;
  message: string;
  connections: Connection[];
  pendingRequests: {
    sent: ConnectionRequest[];
    received: ConnectionRequest[];
  };
  error?: string;
}
