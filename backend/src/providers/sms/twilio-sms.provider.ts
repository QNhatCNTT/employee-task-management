import twilio from 'twilio';
import { envConfig } from '../../config/env-config';
import { ISmsProvider } from './sms-provider.interface';

/**
 * Twilio SMS Provider Implementation
 */
export class TwilioSmsProvider implements ISmsProvider {
    private client: twilio.Twilio;

    constructor() {
        this.client = twilio(
            envConfig.TWILIO_ACCOUNT_SID,
            envConfig.TWILIO_AUTH_TOKEN
        );
    }

    async send(to: string, message: string): Promise<void> {
        await this.client.messages.create({
            body: message,
            from: envConfig.TWILIO_PHONE_NUMBER,
            to,
        });
    }

    getName(): string {
        return 'twilio';
    }
}
