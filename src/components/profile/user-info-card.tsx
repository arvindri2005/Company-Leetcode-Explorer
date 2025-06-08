
'use client';

import React from 'react';
import { useFormContext, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, CalendarDays, ShieldCheck, Loader2, Edit, Save, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User as FirebaseUser } from 'firebase/auth';

const displayNameFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, {message: 'Display name cannot exceed 50 characters.'}),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

interface UserInfoCardProps {
  user: FirebaseUser;
  isEditingDisplayName: boolean;
  setIsEditingDisplayName: (isEditing: boolean) => void;
  onSubmitDisplayName: (data: DisplayNameFormValues) => Promise<void>;
  isSubmittingDisplayName: boolean;
  handleLogout: () => Promise<void>;
  getInitials: (name: string | null | undefined) => string;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({
  user,
  isEditingDisplayName,
  setIsEditingDisplayName,
  onSubmitDisplayName,
  isSubmittingDisplayName,
  handleLogout,
  getInitials,
}) => {
  const displayNameForm = useFormContext<DisplayNameFormValues>();

  return (
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/30 p-6 border-b">
        <CardTitle className="text-3xl font-bold tracking-tight">Your Profile</CardTitle>
        <CardDescription className="text-lg">Account details, progress, and professional background.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.photoURL || undefined} data-ai-hint="profile avatar" />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            {!isEditingDisplayName ? (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">{user.displayName || 'Anonymous User'}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditingDisplayName(true);
                    displayNameForm.setValue("displayName", user.displayName || "");
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity"
                  aria-label="Edit display name"
                >
                  <Edit size={16} />
                </Button>
              </div>
            ) : (
              <FormProvider {...displayNameForm}>
                <Form {...displayNameForm}>
                  <form onSubmit={displayNameForm.handleSubmit(onSubmitDisplayName)} className="space-y-2">
                    <FormField
                      control={displayNameForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Enter display name" className="text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isSubmittingDisplayName}>
                        {isSubmittingDisplayName ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />} Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingDisplayName(false)}
                        disabled={isSubmittingDisplayName}
                      >
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </FormProvider>
            )}
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Information</h3>
          <div className="flex items-center text-sm"><User className="mr-3 h-5 w-5 text-primary" /><span>UID: {user.uid}</span></div>
          {user.emailVerified && <div className="flex items-center text-sm text-green-600"><ShieldCheck className="mr-3 h-5 w-5" /><span>Email Verified</span></div>}
          {user.metadata.creationTime && <div className="flex items-center text-sm"><CalendarDays className="mr-3 h-5 w-5 text-primary" /><span>Joined: {new Date(user.metadata.creationTime).toLocaleDateString()}</span></div>}
          {user.metadata.lastSignInTime && <div className="flex items-center text-sm"><CalendarDays className="mr-3 h-5 w-5 text-primary" /><span>Last Login: {new Date(user.metadata.lastSignInTime).toLocaleString()}</span></div>}
        </div>
        <Card className="mt-6 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Info size={18}/> Why Share Your Background?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 dark:text-blue-400">
            <p>Providing your educational and work experience helps us tailor AI-generated advice, like interview strategies and mock interview questions, more effectively to your experience level. This information is optional and used solely to enhance your preparation.</p>
          </CardContent>
        </Card>
        <Button onClick={handleLogout} variant="outline" className="mt-6">Log Out</Button>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
