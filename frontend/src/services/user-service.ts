import apiClient from './api-client';

export interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'manager' | 'employee' | 'admin';
    department?: string;
    avatar?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const getUserDirectory = async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users/directory');
    return response.data.data;
};
