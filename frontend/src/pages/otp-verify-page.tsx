import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { otpSchema, OtpFormData } from "@/lib/validation-schemas";
import { managerVerifyCode, employeeVerifyCode } from "@/services/auth-service";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export const OtpVerifyPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const { phoneNumber, email, role } = location.state || {};

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
    });

    const onSubmit = async (data: OtpFormData) => {
        setIsLoading(true);
        setError("");

        try {
            let response;
            if (role === "manager") {
                response = await managerVerifyCode(phoneNumber, data.accessCode);
            } else {
                response = await employeeVerifyCode(email, data.accessCode);
            }

            login(response.data.token);
            navigate(role === "manager" ? "/dashboard" : "/employee/dashboard");
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || "Invalid code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!phoneNumber && !email) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Enter Access Code</CardTitle>
                    <CardDescription className="text-center">Code sent to {phoneNumber || email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                {...register("accessCode")}
                                placeholder="123456"
                                maxLength={6}
                                disabled={isLoading}
                            />
                            {errors.accessCode && <p className="text-red-500 text-sm">{errors.accessCode.message}</p>}
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify Code"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link to="/login" className="text-sm text-blue-600 hover:underline">
                            Back to login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
