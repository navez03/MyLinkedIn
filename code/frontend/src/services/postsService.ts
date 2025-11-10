import { apiHelpers, ApiResponse } from './api';

export interface CreatePostDto {
  userId: string;
  content: string;
}

export interface PostResponseDto {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
}

export interface GetPostsResponseDto {
  posts: PostResponseDto[];
  total: number;
}

export const postsAPI = {
  createPost: async (data: CreatePostDto): Promise<ApiResponse<{ success: boolean; post: PostResponseDto }>> => {
    return apiHelpers.post<{ success: boolean; post: PostResponseDto }>('/posts', data, true);
  },

  getPostById: async (id: string): Promise<ApiResponse<{ success: boolean; post: PostResponseDto }>> => {
    return apiHelpers.get<{ success: boolean; post: PostResponseDto }>(`/posts/${id}`, true);
  },

  getPostsByUserId: async (userId: string, limit = 10, offset = 0): Promise<ApiResponse<{ success: boolean; posts: PostResponseDto[]; total: number }>> => {
    return apiHelpers.get<{ success: boolean; posts: PostResponseDto[]; total: number }>(
      `/posts/user/${userId}?limit=${limit}&offset=${offset}`, true);
  },

  getPostsByUserAndConnections: async (userId: string, limit = 20, offset = 0): Promise<ApiResponse<{ success: boolean; posts: PostResponseDto[]; total: number }>> => {
    return apiHelpers.get<{ success: boolean; posts: PostResponseDto[]; total: number }>(
      `/posts/feed/${userId}?limit=${limit}&offset=${offset}`, true);
  },

  getAllPosts: async (limit = 20, offset = 0): Promise<ApiResponse<{ success: boolean; posts: PostResponseDto[]; total: number }>> => {
    return apiHelpers.get<{ success: boolean; posts: PostResponseDto[]; total: number }>(
      `/posts?limit=${limit}&offset=${offset}`, true);
  },

  deletePost: async (id: string, userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiHelpers.delete<{ success: boolean; message: string }>(`/posts/${id}`, true, { userId });
  },

  // Likes
  likePost: async (postId: string, userId: string): Promise<ApiResponse<{ liked: boolean; totalLikes: number }>> => {
    return apiHelpers.post<{ liked: boolean; totalLikes: number }>(`/posts/${postId}/likes`, { userId }, true);
  },

  unlikePost: async (postId: string, userId: string): Promise<ApiResponse<{ liked: boolean; totalLikes: number }>> => {
    return apiHelpers.delete<{ liked: boolean; totalLikes: number }>(`/posts/${postId}/likes`, true, { userId });
  },

  // Comments
  getComments: async (postId: string, limit = 20, offset = 0): Promise<ApiResponse<{ comments: any[]; total: number }>> => {
    return apiHelpers.get<{ comments: any[]; total: number }>(`/posts/${postId}/comments?limit=${limit}&offset=${offset}`, true);
  },

  addComment: async (postId: string, content: string, userId: string): Promise<ApiResponse<{ comment: any }>> => {
    // Backend espera content, user_id e post_id
    return apiHelpers.post<{ comment: any }>(`/posts/${postId}/comments`, { content, user_id: userId, post_id: postId }, true);
  },

};