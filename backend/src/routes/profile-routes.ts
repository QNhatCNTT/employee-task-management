import { Router } from "express";
import { authMiddleware } from "../middleware/auth-middleware";
import { sendSuccess, sendError } from "../utils/response-utils";
import { AuthenticatedRequest } from "../types/express-types";
import { employeeEntity } from "../entities/employee.entity";

const router = Router();

router.use(authMiddleware);

// Get my profile (employee)
router.get("/", async (req: AuthenticatedRequest, res, next) => {
    try {
        const employee = await employeeEntity.findById(req.userId!);

        if (!employee) {
            return sendError(res, "Profile not found", 404);
        }

        sendSuccess(res, employee);
    } catch (error) {
        next(error);
    }
});

// Update my profile
router.post("/update", async (req: AuthenticatedRequest, res, next) => {
    try {
        const { name, phone } = req.body;

        const updates: Parameters<typeof employeeEntity.updateInfo>[1] = {};
        if (name) updates.name = name;
        if (phone !== undefined) updates.phone = phone;

        const success = await employeeEntity.updateInfo(req.userId!, updates);

        if (!success) {
            return sendError(res, "Profile not found", 404);
        }

        const employee = await employeeEntity.findById(req.userId!);
        sendSuccess(res, employee);
    } catch (error) {
        next(error);
    }
});

export default router;
