import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express-types.js';
import * as employeeService from '../services/employee-service.js';
import { sendInvitationEmail } from '../services/email-service.js';
import { sendSuccess } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, department } = req.body;
    const managerId = req.userId!;

    if (!name || !email || !department) {
      throw new AppError('Name, email, and department required', 400);
    }

    const result = await employeeService.createEmployee({
      name,
      email,
      department,
      managerId,
    });

    await sendInvitationEmail(email, name, result.setupToken);

    sendSuccess(
      res,
      { employeeId: result.employeeId },
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
    const updates = req.body;

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
