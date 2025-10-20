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
  }
};
