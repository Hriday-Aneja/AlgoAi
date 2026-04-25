import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// ─── API Configuration ────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3005/api";
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
    // Add auth token from localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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

/**
 * Get advanced recommendations for a user
 */
export const getAdvancedRecommendations = async (userId: string): Promise<{
  recommendations: Array<{
    problemId: string;
    title: string;
    difficulty: string;
    topic: string;
    reasoning: string;
    confidence: number;
  }>;
  strategy: string;
  weakTopicCount: number;
}> => {
  console.log('Calling advanced recommendations API for user:', userId);
  const response = await api.get(`/advanced-recommendations/${userId}`);
  console.log('Advanced recommendations API response:', response.data);
  return response.data.data;
};

export const updateUserStats = async (updates: {
  questionsAttempted?: number;
  questionsSolved?: number;
  xpGained?: number;
  currentStreak?: number;
  lastLoginDate?: string;
  roadmapProgress?: Record<string, any>;
  topicStrengths?: Record<string, number>;
  dailyStats?: { questionsSolved?: number; xpGained?: number; timeSpent?: number };
}): Promise<any> => {
  const response = await api.put('/user/stats', updates);
  return response.data;
};

export const getUserAnalytics = async (): Promise<any> => {
  const response = await api.get('/user/analytics');
  return response.data;
};

export const sendChatMessage = async (message: string): Promise<{ reply: string }> => {
  if (!message || message.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  try {
    const response = await api.post('/chat', {
      message: message.trim(),
      userId: 'anonymous', // userId is optional, defaults to anonymous
    });

    // Handle both response formats:
    // New format: { reply: string }
    // Legacy format: { status: 'success', data: { reply: string } }
    const reply = response.data?.reply || response.data?.data?.reply;

    if (!reply || typeof reply !== 'string') {
      throw new Error('Invalid response format from server');
    }

    return { reply };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
};

/**
 * Submit onboarding data for a user
 */
export const submitOnboarding = async (data: {
  experienceLevel: string;
  goals: string;
  preferredTopics: string[];
  timeCommitment: string;
  testScore: number;
}): Promise<any> => {
  console.log('Submitting onboarding data:', data);
  const response = await api.post('/onboarding', data);
  console.log('Onboarding submission response:', response.data);
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

// CHAT request
const chatResponse = await sendChatMessage('How do I solve the two sum problem?');
console.log(chatResponse.reply);

// Error handling
try {
  const data = await api.get('/some-endpoint');
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data?.message);
  }
}
*/