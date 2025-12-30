"use client";

import React from "react";
import { useFormContext, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  CalendarDays,
  Edit,
  Save,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { User as FirebaseUser } from "firebase/auth";

const displayNameFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name cannot exceed 50 characters." }),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

/**
 * @interface UserInfoCardProps
 * @description Props for the UserInfoCard component.
 * @property {FirebaseUser} user - The Firebase user object.
 * @property {boolean} isEditingDisplayName - Flag indicating if the user is currently editing their display name.
 * @property {(isEditing: boolean) => void} setIsEditingDisplayName - Function to set the editing state for the display name.
 * @property {(data: DisplayNameFormValues) => Promise<void>} onSubmitDisplayName - Async function to handle the submission of the new display name.
 * @property {boolean} isSubmittingDisplayName - Flag indicating if the display name update is in progress.
 * @property {() => Promise<void>} handleLogout - Async function to handle user logout.
 * @property {(name: string | null | undefined) => string} getInitials - Function to generate initials from a user's display name for the avatar fallback.
 */
interface UserInfoCardProps {
  user: FirebaseUser;
  isEditingDisplayName: boolean;
  setIsEditingDisplayName: (isEditing: boolean) => void;
  onSubmitDisplayName: (data: DisplayNameFormValues) => Promise<void>;
  isSubmittingDisplayName: boolean;
  handleLogout: () => Promise<void>;
  getInitials: (name: string | null | undefined) => string;
}

/**
 * @function UserInfoCard
 * @description A component that displays key user information, allows for editing the display name, and provides a logout button.
 * @param {UserInfoCardProps} props - The props for the component.
 * @returns {JSX.Element} The rendered user info card.
 */
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card className="bg-card border border-border rounded-xl mb-8 shadow-sm overflow-hidden relative">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/10 ring-offset-4 ring-offset-background shadow-lg shrink-0">
            <AvatarImage
              src={user.photoURL || undefined}
              data-ai-hint="profile avatar"
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-grow space-y-3 w-full pt-1">
            <div className="flex justify-between items-start gap-4">
              {!isEditingDisplayName ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                      {user.displayName || "Anonymous User"}
                    </h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsEditingDisplayName(true);
                        displayNameForm.setValue(
                          "displayName",
                          user.displayName || "",
                        );
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-full"
                      aria-label="Edit display name"
                    >
                      <Edit size={15} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md">
                  <FormProvider {...displayNameForm}>
                    <Form {...displayNameForm}>
                      <form
                        onSubmit={displayNameForm.handleSubmit(onSubmitDisplayName)}
                        className="space-y-3"
                      >
                        <FormField
                          control={displayNameForm.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter display name"
                                  className="text-lg font-medium h-10"
                                  autoFocus
                                  autoComplete="name"
                                  maxLength={50}
                                  enterKeyHint="done"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            isLoading={isSubmittingDisplayName}
                          >
                            {!isSubmittingDisplayName && <Save className="h-3.5 w-3.5 mr-2" />}
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDisplayName(false)}
                            disabled={isSubmittingDisplayName}
                          >
                            <X className="h-3.5 w-3.5 mr-2" /> Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </FormProvider>
                </div>
              )}

              {/* Desktop Logout Button */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {user.emailVerified && (
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                  Verified
                </div>
              )}

              {user.metadata.creationTime && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/20">
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  Member since {formatDate(user.metadata.creationTime)}
                </div>
              )}
            </div>

            {/* Mobile Logout Button (Visible only on small screens) */}
            <div className="sm:hidden pt-4 border-t border-border mt-4 w-full">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-dashed"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default UserInfoCard;
