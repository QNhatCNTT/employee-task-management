import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatThread } from '@/components/chat/chat-thread';
import { getUserDirectory, User } from '@/services/user-service';
import { useAuth } from '@/contexts/auth-context';

export const ChatPage = () => {
    const { isConnected } = useSocket();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDirectory = async () => {
            try {
                const data = await getUserDirectory();
                // Filter out current user from the list
                setUsers(data.filter(u => u.id !== currentUser?.userId));
            } catch (error) {
                console.error('Failed to fetch user directory:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUser) {
            fetchDirectory();
        }
    }, [currentUser]);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {!isConnected && (
                <div className="bg-yellow-100 text-yellow-800 text-center py-1 text-sm flex-shrink-0">
                    Connecting to chat server...
                </div>
            )}

            <div className="flex-1 flex overflow-hidden border rounded-lg m-4 shadow-sm bg-white">
                <ChatSidebar
                    users={users}
                    selectedId={selectedUser?.id || null}
                    onSelect={setSelectedUser}
                    isLoading={isLoading}
                />
                <ChatThread participant={selectedUser} />
            </div>
        </div>
    );
};
