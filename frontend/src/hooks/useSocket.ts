import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, TypingUser } from '../types/chat-types';
import { envConfig } from '../config/env-config';

const SOCKET_URL = envConfig.API_URL;

interface UseSocketOptions {
  chatId: string;
  token: string | null;
}

interface UseSocketReturn {
  messages: Message[];
  typingUsers: TypingUser[];
  isConnected: boolean;
  isLoading: boolean;
  sendMessage: (content: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  markAsRead: () => void;
  loadMore: (beforeTimestamp: string) => void;
}

export const useSocket = ({ chatId, token }: UseSocketOptions): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !chatId) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-chat', { chatId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Message events
    socket.on('message-history', (history: Message[]) => {
      setMessages(history);
      setIsLoading(false);
    });

    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('more-messages', (moreMessages: Message[]) => {
      setMessages((prev) => [...moreMessages, ...prev]);
    });

    // Typing events
    socket.on('user-typing', (user: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === user.userId)) return prev;
        return [...prev, user];
      });
    });

    socket.on('user-stop-typing', ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Messages read
    socket.on('messages-read', () => {
      setMessages((prev) =>
        prev.map((m) => ({ ...m, read: true }))
      );
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave-chat', { chatId });
        socket.disconnect();
      }
    };
  }, [chatId, token]);

  const sendMessage = useCallback((content: string) => {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit('send-message', { chatId, content });
    }
  }, [chatId]);

  const startTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { chatId });
    }
  }, [chatId]);

  const stopTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop-typing', { chatId });
    }
  }, [chatId]);

  const markAsRead = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('message-read', { chatId });
    }
  }, [chatId]);

  const loadMore = useCallback((beforeTimestamp: string) => {
    if (socketRef.current) {
      socketRef.current.emit('load-more', { chatId, beforeTimestamp });
    }
  }, [chatId]);

  return {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    loadMore,
  };
};
