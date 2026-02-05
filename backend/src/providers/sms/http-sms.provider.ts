import { ISmsProvider } from './sms-provider.interface';
import { envConfig } from '../../config/env-config';

/**
 * Generic HTTP SMS Provider
 * 
 * Flexible provider that can work with multiple SMS APIs through configuration.
 * Supports template variables: {{to}}, {{message}}, {{from}}
 * 
 * Example configurations:
 * 
 * Textbelt (free testing):
 *   HTTP_SMS_URL=https://textbelt.com/text
 *   HTTP_SMS_METHOD=POST
 *   HTTP_SMS_BODY={"phone":"{{to}}","message":"{{message}}","key":"textbelt"}
 *   HTTP_SMS_HEADERS={"Content-Type":"application/json"}
 * 
 * Vonage:
 *   HTTP_SMS_URL=https://rest.nexmo.com/sms/json
 *   HTTP_SMS_METHOD=POST
 *   HTTP_SMS_BODY={"from":"{{from}}","to":"{{to}}","text":"{{message}}","api_key":"YOUR_KEY","api_secret":"YOUR_SECRET"}
 *   HTTP_SMS_HEADERS={"Content-Type":"application/json"}
 * 
 * MessageBird:
 *   HTTP_SMS_URL=https://rest.messagebird.com/messages
 *   HTTP_SMS_METHOD=POST
 *   HTTP_SMS_BODY={"originator":"{{from}}","recipients":["{{to}}"],"body":"{{message}}"}
 *   HTTP_SMS_HEADERS={"Authorization":"AccessKey YOUR_KEY","Content-Type":"application/json"}
 */
export class HttpSmsProvider implements ISmsProvider {
    private url: string;
    private method: string;
    private bodyTemplate: string;
    private headers: Record<string, string>;
    private fromNumber: string;

    constructor() {
        this.url = envConfig.HTTP_SMS_URL || '';
        this.method = envConfig.HTTP_SMS_METHOD || 'POST';
        this.bodyTemplate = envConfig.HTTP_SMS_BODY || '';
        this.headers = this.parseHeaders(envConfig.HTTP_SMS_HEADERS || '{}');
        this.fromNumber = envConfig.HTTP_SMS_FROM || '';

        if (!this.url) {
            throw new Error('HTTP_SMS_URL is required for HttpSmsProvider');
        }
    }

    private parseHeaders(headersJson: string): Record<string, string> {
        try {
            return JSON.parse(headersJson);
        } catch {
            console.warn('[HttpSmsProvider] Invalid HTTP_SMS_HEADERS JSON, using empty headers');
            return {};
        }
    }

    private replaceTemplateVars(template: string, to: string, message: string): string {
        return template
            .replace(/\{\{to\}\}/g, to)
            .replace(/\{\{message\}\}/g, message)
            .replace(/\{\{from\}\}/g, this.fromNumber);
    }

    async send(to: string, message: string): Promise<void> {
        const body = this.replaceTemplateVars(this.bodyTemplate, to, message);

        console.log(`[HttpSmsProvider] Sending SMS to ${to} via ${this.url}`);

        const response = await fetch(this.url, {
            method: this.method,
            headers: this.headers,
            body: this.method !== 'GET' ? body : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP SMS failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json().catch(() => ({}));
        console.log(`[HttpSmsProvider] SMS sent successfully:`, result);
    }

    getName(): string {
        return 'http';
    }
}
