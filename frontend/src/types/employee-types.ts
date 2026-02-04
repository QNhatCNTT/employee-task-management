export interface Employee {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  managerId: string;
  isActive: boolean;
  setupCompleted: boolean;
  schedule?: Schedule;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  workDays: string[];
  startTime: string;
  endTime: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  department: string;
  role?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  schedule?: Schedule;
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee;
  message?: string;
}

export interface EmployeesResponse {
  success: boolean;
  data: Employee[];
  message?: string;
}
