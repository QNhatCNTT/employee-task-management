import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useSocket } from '../hooks/useSocket';
import { MessageList } from '../components/chat/message-list';
import { MessageInput } from '../components/chat/message-input';
import { TypingIndicator } from '../components/chat/typing-indicator';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Circle, Wifi, WifiOff } from 'lucide-react';

export const ChatPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // For manager: get employeeId from URL, for employee: use own userId
  const employeeId = searchParams.get('employeeId');
  const chatId = user?.role === 'manager' 
    ? (employeeId ? `${user.userId}_${employeeId}` : '')
    : `${user?.userId}_manager`;

  const {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  } = useSocket({ chatId, token });

  // Debounce typing events
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const handleTyping = useCallback(() => {
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [startTyping, stopTyping]);

  // Mark messages as read when component mounts
  useEffect(() => {
    if (isConnected && messages.length > 0) {
      markAsRead();
    }
  }, [isConnected, messages.length, markAsRead]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    if (user?.role === 'manager') {
      navigate('/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  // Show empty state for manager without employee selected  
  if (user?.role === 'manager' && !employeeId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-semibold text-lg">Chat</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">Select an employee to start chatting</p>
            <Button onClick={handleBack}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentTypingUser = typingUsers.length > 0 ? typingUsers[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">
              {user?.role === 'manager' ? 'Chat with Employee' : 'Chat with Manager'}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span className="text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-500" />
                  <span className="text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Circle 
            size={10} 
            className={isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'} 
          />
        </div>
      </header>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <MessageList messages={messages} />

          {/* Typing indicator */}
          <TypingIndicator typingUser={currentTypingUser} />

          {/* Input */}
          <MessageInput
            onSend={sendMessage}
            onTyping={handleTyping}
            disabled={!isConnected}
          />
        </>
      )}
    </div>
  );
};
