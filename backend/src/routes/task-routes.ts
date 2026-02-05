import { Router } from 'express';
import { taskController } from '../controllers/task-controller';
import { authMiddleware, managerOnly } from '../middleware/auth-middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Employee routes
router.get('/my-tasks', taskController.getMyTasks);
router.post('/:taskId/status', taskController.updateStatus);

// Manager routes
router.post('/', managerOnly, taskController.createTask);
router.get('/managed-tasks', managerOnly, taskController.getManagedTasks);
router.put('/:taskId', managerOnly, taskController.updateTask);
router.post('/:taskId/delete', managerOnly, taskController.deleteTask);

export default router;
