import { Router } from 'express';
import { authMiddleware, managerOnly } from '../middleware/auth-middleware.js';
import * as employeeController from '../controllers/employee-controller.js';

const router = Router();

// All routes require manager authentication
router.use(authMiddleware, managerOnly);

router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
