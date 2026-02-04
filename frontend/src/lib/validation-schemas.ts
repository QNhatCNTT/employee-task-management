import { z } from 'zod';

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format'),
});

export const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const otpSchema = z.object({
  accessCode: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numbers only'),
});

export const setupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type EmailFormData = z.infer<typeof emailSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type SetupFormData = z.infer<typeof setupSchema>;
