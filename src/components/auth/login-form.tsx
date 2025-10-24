
/**
 * @fileoverview Defines the user login form component.
 *
 * This client-side component provides a form for users to sign in with their
 * email and password. It uses `react-hook-form` for form management, `zod` for
 * validation, and Firebase Authentication for the sign-in process. It also
 * handles loading states, error messages, and redirection upon successful login.
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, LogInIcon } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Zod schema for validating the login form fields.
 */
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Renders an interactive login form.
 *
 * This component handles the entire user login flow:
 * - Displays email and password input fields.
 * - Validates user input using the `loginFormSchema`.
 * - On submission, it attempts to sign the user in via Firebase Authentication.
 * - Shows a loading indicator during the submission process.
 * - Displays success or error notifications (toasts) based on the outcome.
 * - Redirects the user to their profile or a specified `redirectUrl` on successful login.
 *
 * @returns {JSX.Element} The rendered login form component.
 */
export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login Successful! 🎉',
        description: 'Welcome back!',
      });
      const redirectUrl = searchParams.get('redirectUrl');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/profile');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogInIcon className="mr-2 h-4 w-4" />
          )}
          Login
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  );
}
