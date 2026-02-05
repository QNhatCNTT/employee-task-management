import { taskEntity, TaskDocument } from '../entities/task.entity';
import { userEntity } from '../entities/user.entity';
import { employeeEntity } from '../entities/employee.entity';

export class TaskService {
    async createTask(
        managerId: string,
        data: {
            title: string;
            description: string;
            assigneeId: string;
            priority: TaskDocument['priority'];
            dueDate?: string; // ISO date string
        }
    ) {
        // Verify assignee exists in Employees collection
        const assignee = await employeeEntity.findById(data.assigneeId);
        if (!assignee) {
            throw new Error('Assignee not found');
        }

        // Verify manager (User) exists
        const manager = await userEntity.findById(managerId);
        if (!manager) {
            throw new Error('Manager not found');
        }

        const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

        return taskEntity.createNew(
            data.title,
            data.description,
            data.assigneeId, // This is EmployeeID
            managerId,       // This is UserID (Manager)
            data.priority,
            dueDate
        );
    }

    async getTasksByAssignee(userId: string) {
        // Convert UserID to EmployeeID via email
        const user = await userEntity.findById(userId);
        if (!user || !user.email) {
            throw new Error('User not found or missing email');
        }

        const employee = await employeeEntity.findByEmail(user.email);
        if (!employee) {
            // If no employee profile, maybe they have no tasks or generic error
            return [];
        }

        const tasks = await taskEntity.findByAssignee(employee.id!);
        return tasks;
    }

    async getTasksByManager(managerId: string) {
        const tasks = await taskEntity.findByManager(managerId);

        // Enrich with assignee name from Employee collection
        const enrichedTasks = await Promise.all(tasks.map(async (task) => {
            const assignee = await employeeEntity.findById(task.assigneeId);
            return {
                ...task,
                assigneeName: assignee ? assignee.name : 'Unknown',
                assigneeEmail: assignee ? assignee.email : 'Unknown'
            };
        }));
        return enrichedTasks;
    }

    async updateTaskStatus(
        taskId: string,
        status: TaskDocument['status'],
        userId: string,
        userRole: string
    ) {
        const task = await taskEntity.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (userRole === 'employee') {
            // Check if task is assigned to this employee
            // userId is UserID -> need EmployeeID
            const user = await userEntity.findById(userId);
            const userEmail = user?.email;

            // We need to fetch the assignee (Employee) and check email match
            // OR fetch employee by user email
            if (!userEmail) throw new Error('User email not found');

            const employee = await employeeEntity.findByEmail(userEmail);
            if (!employee || task.assigneeId !== employee.id) {
                throw new Error('Unauthorized');
            }
        }

        if (userRole === 'manager' && task.managerId !== userId) {
            throw new Error('Unauthorized');
        }

        return taskEntity.updateStatus(taskId, status);
    }

    async updateTask(
        taskId: string,
        managerId: string,
        data: {
            title?: string;
            description?: string;
            assigneeId?: string;
            priority?: TaskDocument['priority'];
            dueDate?: string;
            status?: TaskDocument['status'];
        }
    ) {
        const task = await taskEntity.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.managerId !== managerId) {
            throw new Error('Unauthorized');
        }

        // If assignee changed, verify new assignee exists
        if (data.assigneeId && data.assigneeId !== task.assigneeId) {
            const assignee = await employeeEntity.findById(data.assigneeId);
            if (!assignee) {
                throw new Error('Assignee not found');
            }
        }

        const updateData: Partial<TaskDocument> = {};
        if (data.title) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.assigneeId) updateData.assigneeId = data.assigneeId;
        if (data.priority) updateData.priority = data.priority;
        if (data.status) updateData.status = data.status;
        if (data.dueDate) {
            const { Timestamp } = require('firebase-admin/firestore');
            updateData.dueDate = Timestamp.fromDate(new Date(data.dueDate));
        }

        return taskEntity.update(taskId, updateData);
    }

    async deleteTask(taskId: string, managerId: string) {
        const task = await taskEntity.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (task.managerId !== managerId) {
            throw new Error('Unauthorized');
        }

        return taskEntity.delete(taskId);
    }
}

export const taskService = new TaskService();
