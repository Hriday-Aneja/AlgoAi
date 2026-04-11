import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// ─── API Configuration ────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000; // 10 seconds

// ─── Axios Instance Setup ─────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Add any request preprocessing here
    // For example: add auth tokens, modify headers, etc.

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add any response preprocessing here

    // Log responses in development
    if (import.meta.env.DEV) {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Handle unauthorized - maybe redirect to login
        console.warn('Unauthorized request - redirecting to login');
        // window.location.href = '/login';
      } else if (status === 403) {
        console.warn('Forbidden request');
      } else if (status >= 500) {
        console.error('Server error:', data);
      }

      // Log error details in development
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          status,
          url: error.config?.url,
          message: data,
        });
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - check your connection');
    } else {
      // Other error
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  user_id?: string;
  count?: number;
}

export interface ApiError {
  status: 'error';
  message: string;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default api;

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Get health status from the server
 */
export const getHealth = async (): Promise<{ message: string }> => {
  console.log('Calling health API...');
  const response = await api.get('/health');
  console.log('Health API response:', response.data);
  return response.data;
};

/**
 * Get user progress data
 */
export const getUserProgress = async (userId: string): Promise<{
  count: number;
  data: Array<{
    id: string;
    user_id: string;
    problem_id: string;
    topic: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'solved' | 'attempted';
    time_taken: number | null;
    created_at: string;
  }>;
}> => {
  console.log('Calling user progress API for user:', userId);
  const response = await api.get(`/progress/${userId}`);
  console.log('User progress API response:', response.data);
  return response.data;
};

/**
 * Get user weak topics data
 */
export const getWeakTopics = async (userId: string): Promise<{
  user_id: string;
  count: number;
  data: Array<{
    topic: string;
    total_attempted: number;
    total_solved: number;
    accuracy: number;
    avg_time: number;
    weakness_level: 'high' | 'medium';
  }>;
}> => {
  console.log('Calling weak topics API for user:', userId);
  const response = await api.get(`/weak-topics/${userId}`);
  console.log('Weak topics API response:', response.data);
  return response.data;
};
/*
import api from '@/services/api';

// GET request
const response = await api.get('/health');
console.log(response.data);

// POST request
const result = await api.post('/progress', {
  user_id: 'user123',
  problem_id: 'two-sum',
  status: 'solved'
});

// Error handling
try {
  const data = await api.get('/some-endpoint');
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data?.message);
  }
}
*/