import { useEffect } from 'react';
import { User } from '@/services/user-service';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/contexts/auth-context';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';

interface ChatThreadProps {
    participant: User | null;
}

export const ChatThread = ({ participant }: ChatThreadProps) => {
    const { user } = useAuth();

    const chatId = participant && user
        ? [user.userId, participant.id].sort().join('_')
        : null;

    const { messages, isTyping, sendMessage, sendTyping, markAsRead } = useChat(chatId);

    useEffect(() => {
        if (messages.length > 0) {
            markAsRead();
        }
    }, [messages, markAsRead]);

    if (!participant) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                <div className="text-center">
                    <p className="text-lg mb-2">Select a colleague to start chatting</p>
                    <p className="text-sm">You can chat with anyone in the directory</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-white shadow-sm flex-shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-lg">{participant.name}</h2>
                    <p className="text-sm text-gray-500">
                        {participant.department ? `${participant.department} • ` : ''}
                        <span className="capitalize">{participant.role}</span>
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <MessageList messages={messages} />
            </div>

            {/* Typing indicator */}
            <div className="bg-white px-4 pt-2">
                <TypingIndicator typingUser={isTyping} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0">
                <MessageInput onSend={sendMessage} onTyping={sendTyping} />
            </div>
        </div>
    );
};
