import { IEmailProvider } from './email-provider.interface';

/**
 * Console Email Provider - for development/testing
 * Logs email content to console instead of sending
 */
export class ConsoleEmailProvider implements IEmailProvider {
    async sendOtp(to: string, otp: string): Promise<void> {
        console.log(`[ConsoleEmailProvider] OTP Email to ${to}: ${otp}`);
    }

    async sendInvitation(to: string, employeeName: string, setupToken: string): Promise<void> {
        console.log(`[ConsoleEmailProvider] Invitation Email to ${to}:`);
        console.log(`  Employee: ${employeeName}`);
        console.log(`  Setup Token: ${setupToken}`);
    }

    getName(): string {
        return 'console';
    }
}
