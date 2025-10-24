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
  token?: string;
}

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
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
}

export interface SearchUsersResponse {
  success: boolean;
  message: string;
  users: UserSearchResult[];
}

export const authAPI = {

  register: async (email: string, password: string): Promise<ApiResponse<RegisterResponse>> => {
    return apiHelpers.post<RegisterResponse>('/user/register', { email, password });
  },

  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return apiHelpers.post<LoginResponse>('/user/login', { email, password });
  },

  createProfile: async (userId: string, name: string, email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiHelpers.post<{ message: string }>('/user/create-profile', { userId, name, email });
  },

  checkEmailVerified: async (userId: string): Promise<ApiResponse<{ isVerified: boolean }>> => {
    return apiHelpers.post<{ isVerified: boolean }>('/user/check-email-verified', { userId });
  },

  getUserProfile: async (userId: string): Promise<ApiResponse<UserProfileDto>> => {
    return apiHelpers.get<UserProfileDto>(`/user/profile?userId=${userId}`, false);
  },

  getAllUsers: async (userId: string): Promise<ApiResponse<GetAllUsersResponse>> => {
    return apiHelpers.get(`/user/all?userId=${userId}`);
  },

  searchUsers: async (query: string, userId: string): Promise<ApiResponse<SearchUsersResponse>> => {
    return apiHelpers.get<SearchUsersResponse>(`/user/search?query=${encodeURIComponent(query)}&userId=${userId}`, true);
  }
};
