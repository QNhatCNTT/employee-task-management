import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { phoneSchema, emailSchema, PhoneFormData, EmailFormData } from '@/lib/validation-schemas';
import { managerSendCode, employeeSendCode } from '@/services/auth-service';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState("manager");

    const {
        register: registerManager,
        handleSubmit: handleSubmitManager,
        formState: { errors: errorsManager },
    } = useForm<PhoneFormData>({
        resolver: zodResolver(phoneSchema),
    });

    const {
        register: registerEmployee,
        handleSubmit: handleSubmitEmployee,
        formState: { errors: errorsEmployee },
    } = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });

    const onManagerSubmit = async (data: PhoneFormData) => {
        setIsLoading(true);
        setError('');
        try {
            await managerSendCode(data.phoneNumber);
            navigate('/verify', {
                state: { phoneNumber: data.phoneNumber, role: 'manager' },
            });
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Failed to send code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onEmployeeSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        setError('');
        try {
            await employeeSendCode(data.email);
            navigate('/verify', {
                state: { email: data.email, role: 'employee' },
            });
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Failed to send code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to access your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="manager" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="manager">Manager</TabsTrigger>
                            <TabsTrigger value="employee">Employee</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manager">
                            <form onSubmit={handleSubmitManager(onManagerSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        {...registerManager('phoneNumber')}
                                        placeholder="+1234567890"
                                        type="tel"
                                        disabled={isLoading}
                                    />
                                    {errorsManager.phoneNumber && (
                                        <p className="text-red-500 text-sm">{errorsManager.phoneNumber.message}</p>
                                    )}
                                </div>
                                {error && activeTab === 'manager' && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                    {isLoading ? 'Sending Code...' : 'Send Access Code'}
                                </Button>
                            </form>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                Use your registered phone number to log in.
                            </p>
                        </TabsContent>

                        <TabsContent value="employee">
                            <form onSubmit={handleSubmitEmployee(onEmployeeSubmit)} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        {...registerEmployee('email')}
                                        placeholder="employee@company.com"
                                        type="email"
                                        disabled={isLoading}
                                    />
                                    {errorsEmployee.email && (
                                        <p className="text-red-500 text-sm">{errorsEmployee.email.message}</p>
                                    )}
                                </div>
                                {error && activeTab === 'employee' && <p className="text-red-500 text-sm text-center">{error}</p>}
                                <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900" disabled={isLoading}>
                                    {isLoading ? 'Sending Code...' : 'Send Access Code'}
                                </Button>
                            </form>
                            <p className="text-xs text-center text-gray-500 mt-4">
                                Use your work email to log in.
                            </p>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};
