/**
 * @file API Client - Axios instance with interceptors
 * @description Centralized HTTP client with auth token handling and error processing
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_URL, REQUEST_TIMEOUT } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse, ApiError } from '@/types/api.types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken, deviceId } = useAuthStore.getState();

    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    console.log('[API Request] Access Token:', accessToken ? `${accessToken.substring(0, 30)}...` : 'null');

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add device fingerprint header if available
    if (deviceId && config.headers) {
      config.headers['X-Device-ID'] = deviceId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();

        if (!refreshToken) {
          await logout();
          return Promise.reject(error);
        }

        // Attempt to refresh tokens
        const response = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success && response.data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data.data;

          // Update tokens in store
          await setTokens(newAccessToken, newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        const { logout } = useAuthStore.getState();
        await logout();
        return Promise.reject(refreshError);
      }
    }

    // Debug: Log full error response
    console.log('API Error Response:', {
      status: error.response?.status,
      data: JSON.stringify(error.response?.data, null, 2),
    });
    
    // Log validation details if available
    if (error.response?.data?.error?.details) {
      console.log('Validation Details:', JSON.stringify(error.response.data.error.details, null, 2));
    }

    // Handle other errors
    const apiError: ApiResponse<never> = {
      success: false,
      error: {
        code: error.response?.data?.code || error.response?.data?.error?.code || 'NETWORK_ERROR',
        message:
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          error.message ||
          'An unexpected error occurred',
        details: error.response?.data?.details || error.response?.data?.error?.details,
      },
    };

    return Promise.reject(apiError);
  }
);

// Helper function for typed API requests
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
}

// Shorthand methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'GET', url }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

export default apiClient;
