
import SignupForm from '@/components/auth/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Sign Up | Byte To Offer',
  description: 'Create your Byte To Offer account to access personalized interview prep, track your progress, and contribute to our community of developers.',
};

export default function SignupPage() {
  return (
    <section className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md border border-border rounded-3xl mb-8 shadow-sm">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
          <CardDescription className="text-lg">Join us and start exploring!</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </section>
  );
}
