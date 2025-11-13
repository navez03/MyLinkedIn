import { apiHelpers, ApiResponse } from './api';

interface RegisterResponse {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface LoginResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
}

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export interface UserProfileResponseDto {
  success: boolean;
  data?: UserProfileDto;
  message?: string;
}

export interface UserRecommendation {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

interface GetAllUsersResponse {
  success: boolean;
  message: string;
  users: UserRecommendation[];
}

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export interface SearchUsersResponse {
  success: boolean;
  message: string;
  users: UserSearchResult[];
}

export interface PostSearchResult {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
}

export interface SearchPostsResponse {
  success: boolean;
  posts: PostSearchResult[];
  total: number;
}

export interface PostSearchResult {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
}

export interface SearchPostsResponse {
  success: boolean;
  posts: PostSearchResult[];
  total: number;
}

export const userAPI = {

  register: async (email: string, password: string): Promise<ApiResponse<RegisterResponse>> => {
    return apiHelpers.post<RegisterResponse>('/user/register', { email, password });
  },

  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiHelpers.post<LoginResponse>('/user/login', { email, password });

    // Guardar tokens no localStorage após login bem-sucedido
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      localStorage.setItem('userId', response.data.userId);
    }

    return response;
  },

  createProfile: async (userId: string, name: string, email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiHelpers.post<{ message: string }>('/user/create-profile', { userId, name, email });
  },

  checkEmailVerified: async (userId: string): Promise<ApiResponse<{ isVerified: boolean }>> => {
    return apiHelpers.post<{ isVerified: boolean }>('/user/check-email-verified', { userId });
  },

  getUserProfile: async (): Promise<ApiResponse<UserProfileDto>> => {
    const response = await apiHelpers.get<any>(`/user/profile`, true);

    if (response.success && response.data) {
      if (response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      if (response.data.id && response.data.name && response.data.email) {
        return {
          success: true,
          data: response.data
        };
      }
    }

    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  },

  getUserProfileById: async (userId: string): Promise<ApiResponse<UserProfileDto>> => {
    const response = await apiHelpers.get<any>(`/user/profile/${userId}`, true);

    if (response.success && response.data) {
      if (response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      if (response.data.id && response.data.name && response.data.email) {
        return {
          success: true,
          data: response.data
        };
      }
    }

    return {
      success: false,
      error: 'Failed to fetch user profile'
    };
  },

  getAllUsers: async (): Promise<ApiResponse<GetAllUsersResponse>> => {
    return apiHelpers.get(`/user/all`, true);
  },

  searchUsers: async (query: string): Promise<ApiResponse<SearchUsersResponse>> => {
    return apiHelpers.get<SearchUsersResponse>(`/user/search?query=${encodeURIComponent(query)}`, true);
  },


  searchPosts: async (query: string): Promise<ApiResponse<SearchPostsResponse>> => {
    return apiHelpers.get<SearchPostsResponse>(`/posts/search?query=${encodeURIComponent(query)}`, true);
  },

  logout: async (): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await apiHelpers.post<{ success: boolean; message: string }>('/user/logout', {}, true);

    if (response.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
    }

    return response;
  },

  refreshToken: async (): Promise<ApiResponse<{ access_token: string; refresh_token: string; expires_in: number; expires_at: number }>> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    const response = await apiHelpers.post<{ access_token: string; refresh_token: string; expires_in: number; expires_at: number }>(
      '/user/refresh',
      { refresh_token: refreshToken }
    );

    // Atualizar tokens no localStorage
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
    }

    return response;
  },

  updateProfile: async (name?: string, avatar_url?: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const updateData: any = {};

    if (name !== undefined && name.trim() !== '') {
      updateData.name = name;
    }

    // Only send avatar_url if it's a valid non-empty string or null
    if (avatar_url !== undefined) {
      // If it's an empty string, don't send it (backend will reject it)
      if (avatar_url === null || avatar_url.trim() !== '') {
        updateData.avatar_url = avatar_url;
      }
    }

    // Don't send empty objects
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: 'No data to update'
      };
    }

    return apiHelpers.put<{ success: boolean; message: string }>('/user/profile', updateData, true);
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const response = await fetch(`${apiHelpers.getBackendUrl()}/user/upload-avatar`, {
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
          error: data.message || 'Failed to upload avatar'
        };
      }

      return {
        success: true,
        data: { url: data.data.url }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload avatar'
      };
    }
  }
};
