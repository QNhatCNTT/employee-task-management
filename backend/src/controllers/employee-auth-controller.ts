import { Request, Response, NextFunction } from "express";
import { generateOtp, saveOtpByEmail, verifyOtpByEmail } from "../services/otp-service";
import { createEmailProvider } from "../providers/index";
import { generateToken } from "../utils/jwt-utils";
import { sendSuccess } from "../utils/response-utils";
import { AppError } from "../middleware/error-handler-middleware";
import { setupTokenEntity } from "../entities/setup-token.entity";
import { employeeEntity } from "../entities/employee.entity";

export const validateSetupToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            throw new AppError("Token required", 400);
        }

        // Validate using setupTokenEntity
        const result = await setupTokenEntity.verifyAndConsume(token);

        if (!result.valid || !result.data) {
            throw new AppError("Invalid or expired token", 400);
        }

        const metadata = result.data.metadata || {};
        const employee = await employeeEntity.findById(metadata.employeeId || "");

        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        sendSuccess(res, {
            name: employee.name,
            email: employee.email,
            employeeId: employee.id,
        });
    } catch (error) {
        next(error);
    }
};

export const completeSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, name } = req.body;

        if (!token) {
            throw new AppError("Token required", 400);
        }

        // Validate token
        const result = await setupTokenEntity.verifyAndConsume(token);

        if (!result.valid || !result.data) {
            throw new AppError("Invalid or expired token", 400);
        }

        const metadata = result.data.metadata || {};
        const employeeId = metadata.employeeId;

        if (!employeeId) {
            throw new AppError("Invalid token metadata", 400);
        }

        const employee = await employeeEntity.findById(employeeId);

        if (!employee) {
            throw new AppError("Employee not found", 404);
        }

        // Update employee
        await employeeEntity.updateInfo(employeeId, {
            name: name || employee.name,
        });

        sendSuccess(res, { success: true }, "Account setup complete");
    } catch (error) {
        next(error);
    }
};

export const sendCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            throw new AppError("Email required", 400);
        }

        // Verify employee exists and setup complete
        const employee = await employeeEntity.findByEmail(email);

        if (!employee || employee.status !== "active") {
            throw new AppError("Account not found or setup incomplete", 400);
        }

        const otp = generateOtp();
        await saveOtpByEmail(email, otp);

        // Use abstract Email provider
        const emailProvider = createEmailProvider();
        await emailProvider.sendOtp(email, otp);

        sendSuccess(res, { codeSent: true }, "Access code sent to email");
    } catch (error) {
        next(error);
    }
};

export const verifyCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, accessCode } = req.body;

        if (!email || !accessCode) {
            throw new AppError("Email and access code required", 400);
        }

        const result = await verifyOtpByEmail(email, accessCode);

        if (!result.valid || !result.employeeId) {
            throw new AppError("Invalid or expired access code", 401);
        }

        // Use employeeId as userId for the token
        const token = generateToken({
            userId: result.employeeId,
            role: "employee",
            email,
        });

        sendSuccess(res, { token }, "Authentication successful");
    } catch (error) {
        next(error);
    }
};
