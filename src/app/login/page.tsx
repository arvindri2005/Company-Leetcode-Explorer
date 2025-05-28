
import LoginForm from '@/components/auth/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Login',
  description: 'Login to your account.',
};

export default function LoginPage() {
  return (
    <section className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back!</CardTitle>
          <CardDescription className="text-lg">Sign in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </section>
  );
}
