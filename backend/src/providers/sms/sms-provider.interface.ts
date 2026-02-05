/**
 * SMS Provider Interface
 * Abstract interface for SMS providers to enable flexible provider switching
 */
export interface ISmsProvider {
  /**
   * Send an SMS message
   * @param to - Recipient phone number (E.164 format recommended)
   * @param message - Message content
   */
  send(to: string, message: string): Promise<void>;

  /**
   * Get the provider name for logging/debugging
   */
  getName(): string;
}

// Export a type guard function to ensure this file is treated as a module
export function isSmsProvider(obj: unknown): obj is ISmsProvider {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'send' in obj &&
    typeof (obj as Record<string, unknown>).send === 'function' &&
    'getName' in obj &&
    typeof (obj as Record<string, unknown>).getName === 'function'
  );
}
