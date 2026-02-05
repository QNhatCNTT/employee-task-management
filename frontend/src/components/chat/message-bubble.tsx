/**
 * Message Bubble
 * Displays a chat message with timestamp and delivery status indicator
 */

import { Message } from '../../types/chat-types';
import { useAuth } from '../../contexts/auth-context';
import { MessageStatusIndicator } from './message-status-indicator';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isOwn = message.senderId === user?.userId;

  // Determine status for display (backward compatibility)
  const status = message.status || (message.read ? 'read' : 'sent');

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <div
          className={`text-xs mt-1 flex items-center justify-end gap-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwn && <MessageStatusIndicator status={status} />}
        </div>
      </div>
    </div>
  );
};
