import apiClient from './api-client';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../types/employee-types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get<ApiResponse<Employee[]>>('/api/employees');
  return response.data.data;
};

export const getEmployee = async (id: string): Promise<Employee> => {
  const response = await apiClient.get<ApiResponse<Employee>>(`/api/employees/${id}`);
  return response.data.data;
};

export const createEmployee = async (input: CreateEmployeeInput): Promise<{ employeeId: string }> => {
  const response = await apiClient.post<ApiResponse<{ employeeId: string }>>('/api/employees', input);
  return response.data.data;
};

export const updateEmployee = async (id: string, input: UpdateEmployeeInput): Promise<Employee> => {
  const response = await apiClient.put<ApiResponse<Employee>>(`/api/employees/${id}`, input);
  return response.data.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/employees/${id}`);
};
