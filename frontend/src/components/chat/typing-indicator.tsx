import { TypingUser } from '../../types/chat-types';

interface TypingIndicatorProps {
  typingUser: TypingUser | null;
}

export const TypingIndicator = ({ typingUser }: TypingIndicatorProps) => {
  if (!typingUser) return null;

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic flex items-center gap-1">
      <span className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span>
        {typingUser.userRole === 'employee' ? 'Employee' : 'Manager'} is typing...
      </span>
    </div>
  );
};
