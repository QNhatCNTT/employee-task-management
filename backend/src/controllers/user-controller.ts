import { Request, Response, NextFunction } from 'express';
import { userEntity } from '../entities/user.entity';
import { employeeEntity } from '../entities/employee.entity';
import { sendSuccess, sendError } from '../utils/response-utils';

export const getDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch all users from auth collection (managers mostly)
        const users = await userEntity.findAll();

        // Fetch all employees (profiles)
        const employees = await employeeEntity.findAll();

        // Map to a common directory format
        const directory = [];

        // Process employees first as they have more details
        for (const emp of employees) {
            if (emp.status !== 'active') continue;

            directory.push({
                id: emp.id!,
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                role: emp.role || 'employee',
                department: 'Operations', // Default for now
                avatar: undefined
            });
        }

        // Add managers that might not be in employees table yet (if any)
        for (const user of users) {
            if (user.role === 'manager') {
                // Check if already added via employee profile
                const exists = directory.find(d => d.id === user.id);
                if (!exists) {
                    // Ideally managers should have a profile too, but if just in auth:
                    directory.push({
                        id: user.id!,
                        name: 'Manager', // Fallback name
                        email: user.email,
                        phone: user.phoneNumber,
                        role: 'manager',
                        department: 'Management',
                        avatar: undefined
                    });
                }
            }
        }

        sendSuccess(res, directory);
    } catch (error) {
        next(error);
    }
};
