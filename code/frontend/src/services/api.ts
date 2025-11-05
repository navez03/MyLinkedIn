export const API_BASE_URL = "http://localhost:3000";

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

  getBackendUrl() {
    return API_BASE_URL;
  },

  request: async <T>(url: string, options: RequestInit, retryCount = 0): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, options);

      if (response.status === 401 && retryCount === 0 && !url.includes('/user/refresh') && !url.includes('/user/login')) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/user/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();

              if (refreshData.success && refreshData.data) {
                // Atualizar tokens
                localStorage.setItem('token', refreshData.data.access_token);
                localStorage.setItem('refreshToken', refreshData.data.refresh_token);

                if (options.headers) {
                  const headers = options.headers as Record<string, string>;
                  headers['Authorization'] = `Bearer ${refreshData.data.access_token}`;
                }

                return apiHelpers.request<T>(url, options, retryCount + 1);
              }
            }
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            window.location.href = '/';
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          window.location.href = '/';
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro na requisição");
      }

      if (data.success !== undefined && data.data !== undefined) {
        return data;
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro de ligação ao servidor",
      };
    }
  },

  getHeaders: (
    includeAuth: boolean = false,
    customHeaders?: Record<string, string>
  ): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    return headers;
  },

  post: async <T>(
    endpoint: string,
    body: any,
    includeAuth: boolean = false,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: apiHelpers.getHeaders(includeAuth, customHeaders),
      body: JSON.stringify(body),
    });
  },

  get: async <T>(
    endpoint: string,
    includeAuth: boolean = false,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: apiHelpers.getHeaders(includeAuth, customHeaders),
    });
  },

  put: async <T>(
    endpoint: string,
    body: any,
    includeAuth: boolean = false,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> => {
    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: apiHelpers.getHeaders(includeAuth, customHeaders),
      body: JSON.stringify(body),
    });
  },

  delete: async <T>(
    endpoint: string,
    includeAuth: boolean = false,
    body?: any
  ): Promise<ApiResponse<T>> => {
    const options: RequestInit = {
      method: "DELETE",
      headers: apiHelpers.getHeaders(includeAuth),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return apiHelpers.request<T>(`${API_BASE_URL}${endpoint}`, options);
  },
};
