export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
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

export interface MessageWithPost extends Message {
  post_id?: string | null;
  post?: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    authorName?: string;
  } | null;
}
