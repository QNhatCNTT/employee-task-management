import { ISmsProvider } from './sms-provider.interface';

/**
 * Console SMS Provider - for development/testing
 * Logs SMS messages to console instead of sending them
 */
export class ConsoleSmsProvider implements ISmsProvider {
    async send(to: string, message: string): Promise<void> {
        console.log(`[ConsoleSmsProvider] SMS to ${to}: ${message}`);
    }

    getName(): string {
        return 'console';
    }
}
