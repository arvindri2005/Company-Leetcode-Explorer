
import SignupForm from '@/components/auth/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Sign Up',
  description: 'Create a new account.',
};

export default function SignupPage() {
  return (
    <section className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-lg">Join us and start exploring!</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </section>
  );
}
