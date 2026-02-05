import { Router } from 'express';
import { authMiddleware, managerOnly } from '../middleware/auth-middleware';
import * as employeeController from '../controllers/employee-controller';

const router = Router();

// All routes require manager authentication
router.use(authMiddleware, managerOnly);

router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.post('/:id/update', employeeController.updateEmployee);
router.post('/:id/status', employeeController.updateEmployeeStatus);
router.post('/:id/suspend', employeeController.suspendEmployee);
router.post('/:id/reactivate', employeeController.reactivateEmployee);
router.post('/:id/delete', employeeController.deleteEmployee);

export default router;
