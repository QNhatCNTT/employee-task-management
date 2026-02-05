import { envConfig } from '../../config/env-config';
import { ISmsProvider } from './sms-provider.interface';
import { TwilioSmsProvider } from './twilio-sms.provider';
import { ConsoleSmsProvider } from './console-sms.provider';
import { HttpSmsProvider } from './http-sms.provider';

let smsProviderInstance: ISmsProvider | null = null;

/**
 * Factory function to create SMS provider based on configuration
 * Uses singleton pattern to reuse provider instance
 */
export function createSmsProvider(): ISmsProvider {
    if (smsProviderInstance) {
        return smsProviderInstance;
    }

    const providerType = envConfig.SMS_PROVIDER;

    switch (providerType) {
        case 'twilio':
            smsProviderInstance = new TwilioSmsProvider();
            break;
        case 'http':
            smsProviderInstance = new HttpSmsProvider();
            break;
        case 'console':
            smsProviderInstance = new ConsoleSmsProvider();
            break;
        default:
            throw new Error(`Unknown SMS provider: ${providerType}`);
    }

    console.log(`[SmsProviderFactory] Using SMS provider: ${smsProviderInstance.getName()}`);
    return smsProviderInstance;
}

/**
 * Reset provider instance (useful for testing)
 */
export function resetSmsProvider(): void {
    smsProviderInstance = null;
}
