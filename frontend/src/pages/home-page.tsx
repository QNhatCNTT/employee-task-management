import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HomePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-6">Employee Task Management</h1>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Real-time employee task management tool with manager and employee authentication, employee CRUD
                    management, and real-time chat.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link to="/login">
                        <Button size="lg">Login</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
