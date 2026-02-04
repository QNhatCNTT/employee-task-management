import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams,  } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { setupSchema, SetupFormData } from '@/lib/validation-schemas';
import { useAuth } from '@/contexts/auth-context';
import { completeSetup, validateSetupToken } from '@/services/auth-service';

export const EmployeeSetupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');

  const setupToken = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!setupToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await validateSetupToken(setupToken);
        setTokenValid(true);
        setEmail(response.data.email);
      } catch {
        setError('Invalid or expired setup link');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [setupToken]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmit = async (data: SetupFormData) => {
    if (!setupToken) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await completeSetup(setupToken, data.name, data.phoneNumber);
      login(response.data.token);
      navigate('/employee/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tokenValid || !setupToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Setup Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error || 'This setup link is invalid or has expired.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Set up your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Email: <span className="font-medium">{email}</span></p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                {...register('name')}
                placeholder="Your Full Name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input
                {...register('phoneNumber')}
                placeholder="Phone Number (optional)"
                type="tel"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
