export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserPayload {
  userId: string;
  role: 'manager' | 'employee';
  phoneNumber?: string;
  email?: string;
}
