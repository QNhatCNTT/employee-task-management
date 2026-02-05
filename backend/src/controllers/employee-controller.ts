import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express-types';
import * as employeeService from '../services/employee-service';
import { createEmailProvider } from '../providers/index';
import { setupTokenEntity } from '../entities/setup-token.entity';
import { sendSuccess } from '../utils/response-utils';
import { AppError } from '../middleware/error-handler-middleware';

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, role } = req.body;
    const managerId = req.userId!;

    if (!name || !email) {
      throw new AppError('Name and email are required', 400);
    }

    // Create setup token
    const employeeId = await employeeService.createEmployee({
      name,
      email,
      phone,
      role: role as 'employee' | 'manager' | 'admin',
      managerId,
    });

    // Get the employee record to create a setup token
    const employee = await employeeService.getEmployeeById(employeeId.employeeId);
    if (employee) {
      const setupToken = await setupTokenEntity.createToken(
        employeeId.userId,
        'employee_setup',
        {
          metadata: {
            employeeId: employeeId.employeeId,
            email,
          },
        }
      );

      // Send invitation email
      const emailProvider = createEmailProvider();
      await emailProvider.sendInvitation(email, name, setupToken);
    }

    sendSuccess(
      res,
      { employeeId: employeeId.employeeId },
      'Employee created, invitation sent',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const employee = await employeeService.getEmployeeById(id, managerId);

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

export const listEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const managerId = req.userId!;
    const employees = await employeeService.listEmployees(managerId);

    sendSuccess(res, employees);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;
    const { name, phone, description } = req.body;

    const updates: Parameters<typeof employeeService.updateEmployee>[2] = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (description) updates.description = description;

    const employee = await employeeService.updateEmployee(id, managerId, updates);

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, employee, 'Employee updated');
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const deleted = await employeeService.deleteEmployee(id, managerId);

    if (!deleted) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, null, 'Employee deleted');
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const employee = await employeeService.updateEmployeeStatus(
      id,
      managerId,
      status as 'active' | 'inactive' | 'suspended'
    );

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, employee, 'Employee status updated');
  } catch (error) {
    next(error);
  }
};

export const suspendEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const success = await employeeService.suspendEmployee(id, managerId);

    if (!success) {
      throw new AppError('Employee not found or unauthorized', 404);
    }

    sendSuccess(res, null, 'Employee suspended');
  } catch (error) {
    next(error);
  }
};

export const reactivateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const success = await employeeService.reactivateEmployee(id, managerId);

    if (!success) {
      throw new AppError('Employee not found or unauthorized', 404);
    }

    sendSuccess(res, null, 'Employee reactivated');
  } catch (error) {
    next(error);
  }
};
