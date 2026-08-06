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
  try {
    console.log('Calling user progress API for user:', userId);
    const response = await api.get(`/progress/${userId}`);
    console.log('User progress API response:', response.data);
    
    // Handle new API format { success: true, progress: {...} }
    if (response.data?.success && response.data?.progress) {
      return {
        count: Array.isArray(response.data.progress) ? response.data.progress.length : 0,
        data: Array.isArray(response.data.progress) ? response.data.progress : []
      };
    }
    
    // Handle legacy format { data: [...] }
    if (response.data?.data) {
      return {
        count: Array.isArray(response.data.data) ? response.data.data.length : 0,
        data: Array.isArray(response.data.data) ? response.data.data : []
      };
    }
    
    // Fallback to empty data
    return { count: 0, data: [] };
  } catch (error) {
    console.error('User progress API error:', error);
    // Return empty data instead of crashing
    return { count: 0, data: [] };
  }
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
  try {
    console.log('Calling weak topics API for user:', userId);
    const response = await api.get(`/weak-topics/${userId}`);
    console.log('Weak topics API response:', response.data);
    
    // Ensure data is always an array
    if (!response.data?.data) {
      return { user_id: userId, count: 0, data: [] };
    }
    
    return {
      ...response.data,
      data: Array.isArray(response.data.data) ? response.data.data : []
    };
  } catch (error) {
    console.error('Weak topics API error:', error);
    // Return empty data instead of crashing
    return { user_id: userId, count: 0, data: [] };
  }
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
  try {
    console.log('Calling advanced recommendations API for user:', userId);
    const response = await api.get(`/advanced-recommendations/${userId}`);
    console.log('Advanced recommendations API response:', response.data);
    
    // Handle nested data structure
    const data = response.data?.data || response.data;
    
    return {
      recommendations: Array.isArray(data?.recommendations) ? data.recommendations : [],
      strategy: data?.strategy || 'default',
      weakTopicCount: data?.weakTopicCount || 0
    };
  } catch (error) {
    console.error('Advanced recommendations API error:', error);
    // Return empty recommendations instead of crashing
    return {
      recommendations: [],
      strategy: 'default',
      weakTopicCount: 0
    };
  }
};

export interface ProblemRecord {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'Easy' | 'Medium' | 'Hard';
  topic: string;
  url?: string;
  tags?: string[];
  status?: 'solved' | 'attempted' | 'unsolved' | 'bookmarked';
  acceptance?: number;
  submissions?: number;
  description?: string;
  testCases?: { input: string; output: string }[];
  examples?: { input: string; output: string; explanation?: string }[];
  constraints?: string[];
  hints?: string[];
  starterCode?: string;
  solution?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  videoUrl?: string;
  likes?: number;
  dislikes?: number;
}

export interface RoadmapDay {
  day: number;
  topic: string;
  difficulty: string;
  tasks: string[];
  completed?: boolean;
  isLocked?: boolean;
}

export interface RoadmapMeta {
  startDate?: string;
  daysSinceStart?: number;
  currentRoadmapDay?: number;
  roadmapLength?: number;
  unlockedDays?: number;
  lockedDays?: number;
  unlockedDayNumbers?: number[];
  lockedDayNumbers?: number[];
}

export interface WeeklyActivityDay {
  day: string;
  solved: number;
}

export interface ProgressRecord {
  id: string;
  user_id: string;
  problem_id: string;
  topic: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted';
  time_taken: number | null;
  created_at: string;
}

export const getAllProblems = async (): Promise<{
  status: string;
  count: number;
  data: ProblemRecord[];
}> => {
  try {
    console.log('Calling problems API...');
    const response = await api.get('/problems');
    console.log('Problems API response:', response.data);
    
    // Ensure data is always an array
    if (!response.data?.data) {
      return {
        status: 'error',
        count: 0,
        data: []
      };
    }
    
    return {
      status: response.data?.status || 'success',
      count: Array.isArray(response.data.data) ? response.data.data.length : 0,
      data: Array.isArray(response.data.data) ? response.data.data : []
    };
  } catch (error) {
    console.error('Problems API error:', error);
    // Return empty array instead of crashing
    return {
      status: 'error',
      count: 0,
      data: []
    };
  }
};

export const getProblemById = async (
  id: string
): Promise<{
  status: string;
  data: ProblemRecord;
}> => {
  try {
    console.log("Calling problem by id API...", id);

    const response = await api.get(`/problems/${id}`);

    console.log("Problem API response:", response.data);

    return response.data;
  } catch (error) {
    console.error("Problem API error:", error);
    throw error;
  }
};

export const postProgressRecord = async (
  payload: {
    user_id: string;
    problem_id: string;
    topic: string | string[];
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'solved' | 'attempted';
    time_taken?: number | null;
  }
): Promise<{ status: string; data: ProgressRecord }> => {
  console.log('Saving progress record...', payload);
  const response = await api.post('/progress', payload);
  console.log('Progress save response:', response.data);
  return response.data;
};

export const getUserRoadmap = async (guestUserId?: string): Promise<{
  success: boolean;
  roadmap: RoadmapDay[];
  roadmapMeta?: RoadmapMeta;
}> => {
  try {
    console.log('Fetching user roadmap...');
    const headers: Record<string, string> = {};
    const userId = guestUserId ?? localStorage.getItem('guestUserId');
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await api.get('/onboarding', { headers });
    console.log('User roadmap response:', response.data);
    
    // Ensure roadmap is always an array
    if (!response.data?.roadmap) {
      return {
        success: false,
        roadmap: [],
      };
    }
    
    return {
      success: response.data?.success !== false,
      roadmap: Array.isArray(response.data.roadmap) ? response.data.roadmap : [],
      roadmapMeta: response.data?.roadmapMeta,
    };
  } catch (error) {
    console.error('User roadmap API error:', error);
    // Return empty roadmap instead of crashing
    return {
      success: false,
      roadmap: [],
    };
  }
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
  return response.data?.analytics || response.data || {};
};

export const getWeeklyActivity = async (): Promise<WeeklyActivityDay[]> => {
  try {
    const response = await api.get('/weekly-activity');
    if (response.data?.success && Array.isArray(response.data.activity)) {
      return response.data.activity as WeeklyActivityDay[];
    }
    return [];
  } catch (error) {
    console.error('Weekly activity API error:', error);
    return [];
  }
};
export interface HintResult {
  success: boolean;
  hintLevel?: number;
  hint?: string;
  message?: string;
}

/**
 * Request a progressive AI hint for a problem.
 * Backend gates this: only unlocks after enough failed attempts / time stuck.
 */
export const getHint = async (payload: {
  problemId: string;
  problemTitle: string;
  problemDescription: string;
  language: string;
  code: string;
}): Promise<HintResult> => {
  const response = await api.post('/hints', payload);
  return response.data;
};

/**
 * Record a run/submit attempt so the hint feature's stuck-detection
 * has real data to work with. Fire-and-forget from the caller's perspective.
 */
export const recordSubmission = async (payload: {
  problemId: string;
  status: 'passed' | 'failed';
}): Promise<void> => {
  try {
    await api.post('/submissions', payload);
  } catch (error) {
    console.error('Submission record API error:', error);
  }
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
const EXPERIENCE_LEVEL_ALIASES: Record<string, string> = {
  beginner: 'beginner',
  basic: 'intermediate',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

const TOPIC_NORMALIZATION_MAP: Record<string, string[]> = {
  arrays: ['arrays'],
  strings: ['strings'],
  'linked list': ['linked-list'],
  'linked-list': ['linked-list'],
  stack: ['stack'],
  queue: ['queue'],
  hashing: ['hashing'],
  'two pointers': ['two-pointers'],
  'two-pointers': ['two-pointers'],
  'sliding window': ['sliding-window'],
  'sliding-window': ['sliding-window'],
  'binary search': ['binary-search'],
  'binary-search': ['binary-search'],
  recursion: ['recursion'],
  backtracking: ['backtracking'],
  trees: ['trees'],
  bst: ['bst'],
  heaps: ['heaps'],
  greedy: ['greedy'],
  graphs: ['graphs'],
  dp: ['dp'],
  'dynamic programming': ['dp'],
  trie: ['trie'],
  'bit manipulation': ['bit-manipulation'],
  'bit-manipulation': ['bit-manipulation'],
  'stack & queue': ['stack', 'queue'],
};

const normalizeExperienceLevel = (level: string): string => {
  return EXPERIENCE_LEVEL_ALIASES[level.toLowerCase().trim()] ?? level.toLowerCase().trim();
};

const normalizePreferredTopics = (topics: string[]): string[] => {
  return Array.from(
    new Set(
      topics.flatMap((topic) => {
        const normalized = topic.toLowerCase().trim();
        return TOPIC_NORMALIZATION_MAP[normalized] ?? [];
      }),
    ),
  );
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
// ... existing code ...
export const submitOnboarding = async (data: {
  experienceLevel: string;
  goals: string;
  preferredTopics: string[];
  timeCommitment: string;
  testScore: number;
}): Promise<any> => {
  const normalizedData = {
    ...data,
    experienceLevel: normalizeExperienceLevel(data.experienceLevel),
    preferredTopics: normalizePreferredTopics(data.preferredTopics),
  };

  const response = await api.post('/onboarding', normalizedData);
  return response.data;
};

/**
 * Execute code using backend Judge0 proxy
 */
export const runCode = async (sourceCode: string, language: string, stdin: string = ""): Promise<any> => {
  try {
    const response = await api.post('/execute', {
      language: language,
      version: "*",
      files: [{ content: sourceCode }],
      stdin: stdin
    });
    return response.data;
  } catch (error) {
    console.error('Execution API error:', error);
    throw error;
  }
};

