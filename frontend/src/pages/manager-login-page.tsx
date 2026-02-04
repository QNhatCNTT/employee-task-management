import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { phoneSchema,  } from '@/lib/validation-schemas';
import { managerSendCode } from '@/services/auth-service';
import { PhoneFormData } from '@/lib/validation-schemas';

export const ManagerLoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: PhoneFormData) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Manager Login</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to receive an access code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                {...register('phoneNumber')}
                placeholder="+1234567890"
                type="tel"
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Access Code'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link to="/login/employee" className="text-blue-600 hover:underline">
              Are you an employee? Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
