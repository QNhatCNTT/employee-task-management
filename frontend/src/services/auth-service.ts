import apiClient from './api-client';

export interface SendCodeResponse {
  success: boolean;
  data: { codeSent: boolean };
  message: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  data: { token: string };
  message: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  data: { name: string; email: string };
}

// Manager Auth
export const managerSendCode = async (phoneNumber: string): Promise<SendCodeResponse> => {
  const response = await apiClient.post<SendCodeResponse>(
    '/api/auth/manager/send-code',
    { phoneNumber }
  );
  return response.data;
};

export const managerVerifyCode = async (
  phoneNumber: string,
  accessCode: string
): Promise<VerifyCodeResponse> => {
  const response = await apiClient.post<VerifyCodeResponse>(
    '/api/auth/manager/verify-code',
    { phoneNumber, accessCode }
  );
  return response.data;
};

// Employee Auth
export const employeeSendCode = async (email: string): Promise<SendCodeResponse> => {
  const response = await apiClient.post<SendCodeResponse>(
    '/api/auth/employee/send-code',
    { email }
  );
  return response.data;
};

export const employeeVerifyCode = async (
  email: string,
  accessCode: string
): Promise<VerifyCodeResponse> => {
  const response = await apiClient.post<VerifyCodeResponse>(
    '/api/auth/employee/verify-code',
    { email, accessCode }
  );
  return response.data;
};

// Employee Setup
export const validateSetupToken = async (token: string): Promise<ValidateTokenResponse> => {
  const response = await apiClient.get<ValidateTokenResponse>(
    `/api/auth/employee/validate-token?token=${token}`
  );
  return response.data;
};

export const completeSetup = async (
  token: string,
  name: string,
  phoneNumber?: string
): Promise<{ success: boolean; data: { token: string } }> => {
  const response = await apiClient.post('/api/auth/employee/setup', {
    token,
    name,
    phoneNumber,
  });
  return response.data;
};
