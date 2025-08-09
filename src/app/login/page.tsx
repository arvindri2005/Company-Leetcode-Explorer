
import LoginForm from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Login | Byte To Offer',
  description: 'Log in to your Byte To Offer account to continue your personalized interview preparation, access saved problems, and track your progress.',
};

export default function LoginPage() {
  return (
    <section className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md border border-border rounded-3xl mb-8 shadow-sm">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <CardDescription className="text-lg">Sign in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </section>
  );
}
