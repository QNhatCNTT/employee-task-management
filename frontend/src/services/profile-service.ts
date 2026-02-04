import apiClient from './api-client';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  managerId: string;
  schedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
  };
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getMyProfile = async (): Promise<Profile> => {
  const response = await apiClient.get<ApiResponse<Profile>>('/api/profile');
  return response.data.data;
};

export const updateMyProfile = async (input: UpdateProfileInput): Promise<Profile> => {
  const response = await apiClient.put<ApiResponse<Profile>>('/api/profile', input);
  return response.data.data;
};
