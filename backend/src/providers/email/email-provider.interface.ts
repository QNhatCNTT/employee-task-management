/**
 * Email Provider Interface
 * Abstract interface for Email providers to enable flexible provider switching
 */
export interface IEmailProvider {
    /**
     * Send an OTP email
     * @param to - Recipient email address
     * @param otp - One-time password code
     */
    sendOtp(to: string, otp: string): Promise<void>;

    /**
   * Send an invitation email for account setup
   * @param to - Recipient email address
   * @param employeeName - Name of the employee
   * @param setupToken - Token for account setup (provider will construct full URL)
   */
    sendInvitation(to: string, employeeName: string, setupToken: string): Promise<void>;

    /**
     * Get the provider name for logging/debugging
     */
    getName(): string;
}
