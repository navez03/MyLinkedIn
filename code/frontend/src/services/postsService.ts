import { apiHelpers, ApiResponse } from './api';

export interface CreatePostDto {
  userId: string;
  content: string;
  imageUrl?: string;
}

export interface PostResponseDto {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
  authorAvatarUrl?: string;
  imageUrl?: string;
}

export interface GetPostsResponseDto {
  posts: PostResponseDto[];
  total: number;
}

export const postsAPI = {

  uploadImage: async (file: File): Promise<ApiResponse<{ success: boolean; imageUrl: string }>> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${apiHelpers.getBackendUrl()}/posts/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to upload image',
      };
    }

    return {
      success: true,
      data: data,
    };
  },

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
};