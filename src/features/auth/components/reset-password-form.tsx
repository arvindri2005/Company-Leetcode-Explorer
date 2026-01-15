"use client";

import { useEffect,useState } from "react";
import { useForm } from "react-hook-form";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { CheckCircle2,Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .max(128, { message: "Password must be less than 128 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  oobCode: string | null;
}

export default function ResetPasswordForm({ oobCode }: ResetPasswordFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  // searchParams removed as oobCode is passed as prop
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // oobCode extraction removed


  useEffect(() => {
    if (!oobCode) {
      setError("Invalid password reset link. The code is missing.");
      setIsVerifying(false);
      return;
    }

    // Verify the code
    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        setEmail(email);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error("Invalid code:", error);
        setError("This password reset link is invalid or has expired.");
        setIsVerifying(false);
      });
  }, [oobCode]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordValues) {
    if (!oobCode) {return;}

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful! 🎉",
        description: "You can now login with your new password.",
      });
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying secure link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <LockKeyhole className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-destructive">Link Expired or Invalid</h3>
            <p className="text-muted-foreground">{error}</p>
        </div>
        <Button asChild className="w-full">
            <Link href="/forgot-password">
                Request New Link
            </Link>
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
         <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green-600">Password Reset Complete</h3>
            <p className="text-muted-foreground">
                Your password has been successfully updated. Redirecting you to login...
            </p>
        </div>
         <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href="/login">
                Login Now
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="text-center mb-6">
             <p className="text-sm text-muted-foreground">Reset password for</p>
             <p className="font-medium text-foreground">{email}</p>
        </div>

        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                         autoComplete="new-password"
                         className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50 pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                         className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                         <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                        </span>
                    </Button>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                         autoComplete="new-password"
                         className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50 pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                         className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                            {showConfirmPassword ? "Hide password" : "Show password"}
                        </span>
                    </Button>
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-base transition-all duration-200 hover:scale-102 shadow-lg hover:shadow-primary/25 mt-2"
            >
            {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <LockKeyhole className="mr-2 h-4 w-4" />
            )}
            Update Password
            </Button>
        </form>
        </Form>
    </div>
  );
}






