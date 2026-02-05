import { useState } from 'react';
import { User } from '@/services/user-service';
import { ChatListItem } from './chat-list-item';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ChatSidebarProps {
    users: User[] | null; // Allow null to show loading state if desired, but array is better
    selectedId: string | null;
    onSelect: (user: User) => void;
    isLoading?: boolean;
}

export const ChatSidebar = ({ users, selectedId, onSelect, isLoading }: ChatSidebarProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = (users || []).filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="w-80 border-r bg-white flex flex-col h-full">
            <div className="p-4 border-b space-y-3">
                <h2 className="font-semibold text-lg">Chat Directory</h2>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Search people..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading directory...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        {searchQuery ? 'No matching users found.' : 'No users available.'}
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <ChatListItem
                            key={user.id}
                            employee={user as any} /* Casting to any/Employee because ChatListItem expects Employee but User is compatible */
                            isSelected={selectedId === user.id}
                            onClick={() => onSelect(user)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
