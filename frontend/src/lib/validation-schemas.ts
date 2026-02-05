import { z } from 'zod';

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format'),
});

export const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const otpSchema = z.object({
  accessCode: z
    .string()
    .min(1, 'Code is required')
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must be numbers only'),
});

export const setupSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;
export type EmailFormData = z.infer<typeof emailSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type SetupFormData = z.infer<typeof setupSchema>;
