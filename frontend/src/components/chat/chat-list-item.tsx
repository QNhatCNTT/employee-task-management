import { Employee } from '@/types/employee-types';

interface ChatListItemProps {
    employee: Employee;
    isSelected: boolean;
    onClick: () => void;
}

export const ChatListItem = ({ employee, isSelected, onClick }: ChatListItemProps) => {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                }`}
        >
            <div className="font-medium text-gray-900">{employee.name}</div>
            <div className="text-sm text-gray-500">{employee.department}</div>
        </button>
    );
};
