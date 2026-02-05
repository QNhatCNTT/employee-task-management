/**
 * Message Status Indicator
 * Displays message delivery status with icons: sending, sent, delivered, read
 */

import { MessageStatus } from '../../types/chat-types';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  className?: string;
}

export const MessageStatusIndicator = ({
  status,
  className = '',
}: MessageStatusIndicatorProps) => {
  const baseClass = `inline-flex items-center ${className}`;

  switch (status) {
    case 'sending':
      // Clock icon for sending
      return (
        <span className={baseClass} title="Sending...">
          <svg
            className="w-4 h-4 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeWidth="2" d="M12 6v6l4 2" />
          </svg>
        </span>
      );

    case 'sent':
      // Single checkmark for sent
      return (
        <span className={baseClass} title="Sent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );

    case 'delivered':
      // Double checkmark for delivered (gray)
      return (
        <span className={baseClass} title="Delivered">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 13l4 4L23 7"
              transform="translate(-4, 0)"
            />
          </svg>
        </span>
      );

    case 'read':
      // Double checkmark for read (blue)
      return (
        <span className={`${baseClass} text-blue-400`} title="Read">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 13l4 4L23 7"
              transform="translate(-4, 0)"
            />
          </svg>
        </span>
      );

    default:
      return null;
  }
};
