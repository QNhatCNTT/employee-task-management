import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express-types';
import { taskService } from '../services/task-service';
import { sendSuccess, sendError } from '../utils/response-utils';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    assigneeId: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    assigneeId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dueDate: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

export class TaskController {
    async createTask(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId) {
                return sendError(res, 'Unauthorized', 401);
            }

            const validation = createTaskSchema.safeParse(req.body);
            if (!validation.success) {
                return sendError(res, `Invalid input: ${validation.error.message}`, 400);
            }

            const taskId = await taskService.createTask(req.userId, validation.data);
            return sendSuccess(res, { taskId }, 'Task created successfully', 201);
        } catch (error: any) {
            // Handle specific errors like 'Assignee not found' with 400
            if (error.message === 'Assignee not found') {
                return sendError(res, error.message, 400);
            }
            return sendError(res, 'Failed to create task', 500);
        }
    }

    async getMyTasks(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId) {
                return sendError(res, 'Unauthorized', 401);
            }
            const tasks = await taskService.getTasksByAssignee(req.userId);
            return sendSuccess(res, { tasks });
        } catch (error) {
            return sendError(res, 'Failed to fetch tasks', 500);
        }
    }

    async getManagedTasks(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId) {
                return sendError(res, 'Unauthorized', 401);
            }
            const tasks = await taskService.getTasksByManager(req.userId);
            return sendSuccess(res, { tasks });
        } catch (error) {
            return sendError(res, 'Failed to fetch managed tasks', 500);
        }
    }

    async updateStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId || !req.userRole) {
                return sendError(res, 'Unauthorized', 401);
            }

            const { taskId } = req.params;
            const validation = updateStatusSchema.safeParse(req.body);

            if (!validation.success) {
                return sendError(res, 'Invalid status', 400);
            }

            await taskService.updateTaskStatus(
                taskId,
                validation.data.status,
                req.userId,
                req.userRole
            );

            return sendSuccess(res, null, 'Task updated successfully');
        } catch (error: any) {
            if (error.message === 'Task not found') return sendError(res, error.message, 404);
            if (error.message === 'Unauthorized') return sendError(res, error.message, 403);
            return sendError(res, 'Failed to update task', 500);
        }
    }

    async updateTask(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId) {
                return sendError(res, 'Unauthorized', 401);
            }

            const { taskId } = req.params;
            const validation = updateTaskSchema.safeParse(req.body);

            if (!validation.success) {
                return sendError(res, `Invalid input: ${validation.error.message}`, 400);
            }

            await taskService.updateTask(taskId, req.userId, validation.data);
            return sendSuccess(res, null, 'Task updated successfully');
        } catch (error: any) {
            if (error.message === 'Task not found') return sendError(res, error.message, 404);
            if (error.message === 'Unauthorized') return sendError(res, error.message, 403);
            if (error.message === 'Assignee not found') return sendError(res, error.message, 400);
            return sendError(res, 'Failed to update task', 500);
        }
    }

    async deleteTask(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.userId) {
                return sendError(res, 'Unauthorized', 401);
            }
            const { taskId } = req.params;
            await taskService.deleteTask(taskId, req.userId);
            return sendSuccess(res, null, 'Task deleted successfully');
        } catch (error: any) {
            if (error.message === 'Task not found') return sendError(res, error.message, 404);
            if (error.message === 'Unauthorized') return sendError(res, error.message, 403);
            return sendError(res, 'Failed to delete task', 500);
        }
    }
}

export const taskController = new TaskController();
