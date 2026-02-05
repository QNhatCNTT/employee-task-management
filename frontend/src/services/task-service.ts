import apiClient from './api-client';
import { Task, CreateTaskData } from '../types/task';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export const taskService = {
    createTask: async (data: CreateTaskData): Promise<string> => {
        const response = await apiClient.post<ApiResponse<{ taskId: string }>>('/api/tasks', data);
        return response.data.data.taskId;
    },

    getMyTasks: async (): Promise<Task[]> => {
        const response = await apiClient.get<ApiResponse<{ tasks: Task[] }>>('/api/tasks/my-tasks');
        return response.data.data.tasks;
    },

    getManagedTasks: async (): Promise<Task[]> => {
        const response = await apiClient.get<ApiResponse<{ tasks: Task[] }>>('/api/tasks/managed-tasks');
        return response.data.data.tasks;
    },

    updateStatus: async (taskId: string, status: Task['status']): Promise<void> => {
        await apiClient.post<ApiResponse<null>>(`/api/tasks/${taskId}/status`, { status });
    },

    updateTask: async (taskId: string, data: Partial<CreateTaskData & { status: Task['status'] }>): Promise<void> => {
        await apiClient.put<ApiResponse<null>>(`/api/tasks/${taskId}`, data);
    },

    deleteTask: async (taskId: string): Promise<void> => {
        await apiClient.post<ApiResponse<null>>(`/api/tasks/${taskId}/delete`);
    },
};
