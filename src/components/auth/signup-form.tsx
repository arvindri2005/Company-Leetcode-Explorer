
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
import { Loader2, UserPlusIcon } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth

const signupFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.'}).max(50),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { syncUserProfileIfNeeded } = useAuth(); // Get sync function

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update Firebase Auth profile display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName,
        });
      }
      
      // Sync profile to Firestore (this now happens in AuthContext on auth state change)
      // but we can trigger it explicitly here too if desired, or rely on the context's effect.
      // For robustness, call it explicitly after user creation and profile update.
      if (userCredential.user) {
        // It's important that userCredential.user reflects the updated displayName
        // or pass the data.displayName explicitly to syncUserProfileIfNeeded if needed.
        await syncUserProfileIfNeeded(userCredential.user);
      }

      toast({
        title: 'Account Created! 🎉',
        description: 'Welcome! You have been successfully signed up.',
      });
      router.push('/profile'); // Redirect to profile or dashboard
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'An unknown error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      }
      toast({
        title: 'Signup Failed',
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
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
            <UserPlusIcon className="mr-2 h-4 w-4" />
          )}
          Sign Up
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </Form>
  );
}
