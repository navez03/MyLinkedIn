export const API_BASE_URL = 'http://localhost:3000';

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const apiHelpers = {
  request: async <T>(url: string, options: RequestInit): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro na requisição');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de ligação ao servidor',
      };
    }
  },

  getHeaders: (includeAuth: boolean = false): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  },

  post: async <T>(endpoint: string, body: any, includeAuth: boolean = false): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: apiHelpers.getHeaders(includeAuth),
      body: JSON.stringify(body),
    });
  },

  get: async <T>(endpoint: string, includeAuth: boolean = false): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: apiHelpers.getHeaders(includeAuth),
    });
  },

  put: async <T>(endpoint: string, body: any, includeAuth: boolean = false): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: apiHelpers.getHeaders(includeAuth),
      body: JSON.stringify(body),
    });
  },

  delete: async <T>(endpoint: string, includeAuth: boolean = false): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: apiHelpers.getHeaders(includeAuth),
    });
  },
};

