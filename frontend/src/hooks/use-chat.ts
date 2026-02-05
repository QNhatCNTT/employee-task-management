import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/socket-context';
import { Message, TypingUser } from '../types/chat-types';

export const useChat = (chatId: string | null) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !chatId) return;

    // Join chat room
    socket.emit('join-chat', { chatId });

    // Listen for message history
    socket.on('message-history', (history: Message[]) => {
      setMessages(history);
    });

    // Listen for new messages
    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socket.on('user-typing', (user: TypingUser) => {
      setIsTyping(user);
    });

    socket.on('user-stop-typing', () => {
      setIsTyping(null);
    });

    // Listen for read receipts
    socket.on('messages-read', () => {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, read: true }))
      );
    });

    // Listen for more messages
    socket.on('more-messages', (moreMessages: Message[]) => {
      setMessages((prev) => [...moreMessages, ...prev]);
    });

    return () => {
      socket.emit('leave-chat', { chatId });
      socket.off('message-history');
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('messages-read');
    };
  }, [socket, chatId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !chatId || !content.trim()) return;
      socket.emit('send-message', { chatId, content: content.trim() });
    },
    [socket, chatId]
  );

  const sendTyping = useCallback(() => {
    if (!socket || !chatId) return;

    socket.emit('typing', { chatId });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { chatId });
    }, 2000);
  }, [socket, chatId]);

  const markAsRead = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit('message-read', { chatId });
  }, [socket, chatId]);

  return {
    messages,
    isTyping,
    sendMessage,
    sendTyping,
    markAsRead,
    loadMore: useCallback((beforeTimestamp: string) => {
      if (socket && chatId) {
        socket.emit('load-more', { chatId, beforeTimestamp });
      }
    }, [socket, chatId])
  };
};
