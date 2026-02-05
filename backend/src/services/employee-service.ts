import crypto from 'crypto';
import { employeeEntity, EmployeeDocument } from '../entities/employee.entity';
import { userEntity } from '../entities/user.entity';

interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  role?: 'employee' | 'manager' | 'admin';
  managerId?: string;
}

interface UpdateEmployeeInput {
  name?: string;
  phone?: string;
  description?: string;
}

export const generateSetupToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const createEmployee = async (input: CreateEmployeeInput) => {
  // Create user record for employee
  const userId = await userEntity.createEmployee(input.email, input.name);

  // Create employee record
  const employeeId = await employeeEntity.createEmployee(
    input.name,
    input.email,
    input.phone,
    input.role || 'employee',
    input.managerId
  );

  const setupToken = generateSetupToken();
  
  // Store setup token (we'll need to add this to employee entity or a separate collection)
  // For now, we'll return it for the client to use
  return { employeeId, userId, setupToken };
};

export const getEmployeeById = async (employeeId: string, managerId?: string) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return null;
  
  // Security check - only allow manager to access their employees
  if (managerId && employee.managerId !== managerId) return null;
  
  return employee;
};

export const listEmployees = async (managerId?: string) => {
  if (managerId) {
    return employeeEntity.findByManager(managerId);
  }
  return employeeEntity.findByStatus('active');
};

export const updateEmployee = async (
  employeeId: string,
  managerId: string,
  updates: UpdateEmployeeInput
) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return null;
  if (employee.managerId !== managerId) return null;
  
  const success = await employeeEntity.updateInfo(employeeId, updates);
  
  if (success) {
    return employeeEntity.findById(employeeId);
  }
  
  return null;
};

export const deleteEmployee = async (employeeId: string, managerId: string) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return false;
  if (employee.managerId !== managerId) return false;
  
  // Soft delete - deactivate
  return employeeEntity.deactivate(employeeId);
};

export const updateEmployeeStatus = async (
  employeeId: string,
  managerId: string,
  status: EmployeeDocument['status']
) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return null;
  if (employee.managerId !== managerId) return null;
  
  const success = await employeeEntity.updateStatus(employeeId, status);
  
  if (success) {
    return employeeEntity.findById(employeeId);
  }
  
  return null;
};

export const updateEmployeeRole = async (
  employeeId: string,
  managerId: string,
  role: EmployeeDocument['role']
) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return null;
  if (employee.managerId !== managerId) return null;
  
  const success = await employeeEntity.updateRole(employeeId, role);
  
  if (success) {
    return employeeEntity.findById(employeeId);
  }
  
  return null;
};

export const assignManager = async (
  employeeId: string,
  managerId: string,
  newManagerId: string
) => {
  // Check if the requester is a manager
  const requesterEmployee = await employeeEntity.findById(managerId);
  if (!requesterEmployee || !['manager', 'admin'].includes(requesterEmployee.role)) {
    return false;
  }
  
  return employeeEntity.assignManager(employeeId, newManagerId);
};

export const suspendEmployee = async (employeeId: string, managerId: string) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return false;
  if (employee.managerId !== managerId) return false;
  
  return employeeEntity.suspend(employeeId);
};

export const reactivateEmployee = async (employeeId: string, managerId: string) => {
  const employee = await employeeEntity.findById(employeeId);
  
  if (!employee) return false;
  if (employee.managerId !== managerId) return false;
  
  return employeeEntity.reactivate(employeeId);
};

export const getEmployeeByEmail = async (email: string) => {
  return employeeEntity.findByEmail(email);
};
