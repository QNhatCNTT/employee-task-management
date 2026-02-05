import { envConfig } from '../../config/env-config';
import { IEmailProvider } from './email-provider.interface';
import { NodemailerEmailProvider } from './nodemailer-email.provider';
import { ConsoleEmailProvider } from './console-email.provider';

let emailProviderInstance: IEmailProvider | null = null;

/**
 * Factory function to create Email provider based on configuration
 * Uses singleton pattern to reuse provider instance
 */
export function createEmailProvider(): IEmailProvider {
    if (emailProviderInstance) {
        return emailProviderInstance;
    }

    const providerType = envConfig.EMAIL_PROVIDER;

    switch (providerType) {
        case 'nodemailer':
            emailProviderInstance = new NodemailerEmailProvider();
            break;
        case 'console':
            emailProviderInstance = new ConsoleEmailProvider();
            break;
        default:
            throw new Error(`Unknown Email provider: ${providerType}`);
    }

    console.log(`[EmailProviderFactory] Using Email provider: ${emailProviderInstance.getName()}`);
    return emailProviderInstance;
}

/**
 * Reset provider instance (useful for testing)
 */
export function resetEmailProvider(): void {
    emailProviderInstance = null;
}
