import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    collapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    // Initialize from localStorage if available, default to false (expanded)
    const [collapsed, setCollapsedState] = useState(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        return stored ? JSON.parse(stored) : false;
    });

    const setCollapsed = (value: boolean) => {
        setCollapsedState(value);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(value));
    };

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <SidebarContext.Provider value={{ collapsed, toggleSidebar, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
