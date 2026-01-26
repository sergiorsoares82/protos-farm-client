// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// API Service
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Attempting login to:', `${this.baseUrl}/api/auth/login`);
      
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Login failed. Please check your credentials.',
        }));
        throw {
          message: error.message || 'Login failed',
          statusCode: response.status,
        } as ApiError;
      }

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      // If it's already an ApiError, throw it
      if ((error as ApiError).statusCode) {
        throw error;
      }
      
      // Network error (CORS, connection refused, etc.)
      console.error('Network error:', error);
      throw {
        message: `Failed to connect to backend at ${this.baseUrl}. Please ensure:\n1. Backend is running\n2. CORS is enabled\n3. URL is correct`,
        statusCode: 0,
      } as ApiError;
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);
