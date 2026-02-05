import twilio from 'twilio';
import { envConfig } from '../config/env-config';

const client = twilio(
  envConfig.TWILIO_ACCOUNT_SID,
  envConfig.TWILIO_AUTH_TOKEN
);

export const sendSms = async (to: string, message: string): Promise<void> => {
  await client.messages.create({
    body: message,
    from: envConfig.TWILIO_PHONE_NUMBER,
    to,
  });
};
