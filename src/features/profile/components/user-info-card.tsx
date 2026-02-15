"use client";

import React, { memo,useState } from "react";
import { FormProvider, useFormContext } from "react-hook-form";

import type { User } from "@supabase/supabase-js";
import {
  BadgeCheck,
  CalendarDays,
  Edit,
  LogOut,
  Mail,
  Save,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

type DisplayNameFormValues = {
  displayName: string;
};

/**
 * @interface UserInfoCardProps
 * @description Props for the UserInfoCard component.
 * @property {User} user - The Supabase user object.
 * @property {boolean} isEditingDisplayName - Flag indicating if the user is currently editing their display name.
 * @property {(isEditing: boolean) => void} setIsEditingDisplayName - Function to set the editing state for the display name.
 * @property {(data: DisplayNameFormValues) => Promise<void>} onSubmitDisplayName - Async function to handle the submission of the new display name.
 * @property {boolean} isSubmittingDisplayName - Flag indicating if the display name update is in progress.
 * @property {() => Promise<void>} handleLogout - Async function to handle user logout.
 * @property {(name: string | null | undefined) => string} getInitials - Function to generate initials from a user's display name for the avatar fallback.
 */
interface UserInfoCardProps {
  user: User;
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayNameForm = useFormContext<DisplayNameFormValues>();

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogout();
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || "Anonymous User";
  const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.photo_url || undefined;
  // Supabase checks email_confirmed_at for verification
  const isEmailVerified = !!user.email_confirmed_at;

  return (
    <Card className="bg-card border border-border rounded-xl mb-8 shadow-sm overflow-hidden relative">
      <div className="h-28 w-full bg-gradient-to-r from-brand-teal/10 via-brand-purple/10 to-background" />
      <CardContent className="p-6 pt-0 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-6 -mt-12">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg shrink-0 transition-transform hover:scale-105 duration-300">
            <AvatarImage
              src={photoUrl}
              alt={displayName}
              data-ai-hint="profile avatar"
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-grow space-y-3 w-full pt-12 sm:pt-14">
            <div className="flex justify-between items-start gap-4 w-full">
              {!isEditingDisplayName ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {displayName}
                    </h2>
                    {isEmailVerified && (
                      <BadgeCheck className="h-5 w-5 text-brand-teal" aria-label="Verified User" role="img" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex items-center gap-1.5 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                            tabIndex={0}
                            role="button"
                            aria-label={`Email: ${user.email}`}
                          >
                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="truncate max-w-[200px] sm:max-w-none">
                              {user.email}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {user.created_at && (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Member since {formatDate(user.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md">
                  <FormProvider {...displayNameForm}>
                    <Form {...displayNameForm}>
                      <form
                        onSubmit={displayNameForm.handleSubmit(
                          onSubmitDisplayName,
                        )}
                        className="space-y-3"
                      >
                        <FormField
                          control={displayNameForm.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    placeholder="Enter display name"
                                    aria-label="Display Name"
                                    aria-describedby="display-name-counter"
                                    className="text-lg font-medium h-10 pr-12"
                                    autoFocus
                                    autoComplete="name"
                                    autoCapitalize="words"
                                    maxLength={50}
                                    enterKeyHint="done"
                                  />
                                  <span
                                    id="display-name-counter"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none"
                                  >
                                    <span className="sr-only">
                                      Character count:{" "}
                                    </span>
                                    {field.value?.length || 0}
                                    <span className="sr-only"> out of </span>
                                    <span aria-hidden="true">/</span>
                                    50
                                  </span>
                                </div>
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
                            {!isSubmittingDisplayName && (
                              <Save className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                            )}
                            Save
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingDisplayName(false)}
                            disabled={isSubmittingDisplayName}
                          >
                            <X className="h-3.5 w-3.5 mr-2" aria-hidden="true" /> Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </FormProvider>
                </div>
              )}

              {/* Desktop Actions */}
              <div className="hidden sm:flex items-center gap-2">
                {!isEditingDisplayName && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingDisplayName(true);
                      displayNameForm.setValue(
                        "displayName",
                        user.user_metadata?.display_name || user.user_metadata?.full_name || "",
                      );
                    }}
                    className="h-9 hover:bg-secondary/50 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5 mr-2" aria-hidden="true" />
                    Edit Profile
                  </Button>
                )}
                <Button
                  onClick={handleLogoutClick}
                  variant="ghost"
                  size="sm"
                  isLoading={isLoggingOut}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  {!isLoggingOut && <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />}
                  Log Out
                </Button>
              </div>
            </div>

            {/* Mobile Actions (Visible only on small screens) */}
            <div className="sm:hidden pt-4 border-t border-border mt-4 w-full grid grid-cols-2 gap-3">
              {!isEditingDisplayName && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingDisplayName(true);
                    displayNameForm.setValue(
                      "displayName",
                      user.user_metadata?.display_name || user.user_metadata?.full_name || "",
                    );
                  }}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                  Edit Profile
                </Button>
              )}
              <Button
                onClick={handleLogoutClick}
                variant="ghost"
                isLoading={isLoggingOut}
                className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-dashed border-border"
              >
                {!isLoggingOut && <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />}
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function arePropsEqual(prevProps: UserInfoCardProps, nextProps: UserInfoCardProps) {
  return (
    prevProps.isEditingDisplayName === nextProps.isEditingDisplayName &&
    prevProps.isSubmittingDisplayName === nextProps.isSubmittingDisplayName &&
    prevProps.user.id === nextProps.user.id &&
    prevProps.user.user_metadata?.display_name === nextProps.user.user_metadata?.display_name &&
    prevProps.user.user_metadata?.avatar_url === nextProps.user.user_metadata?.avatar_url &&
    prevProps.user.email === nextProps.user.email &&
    prevProps.user.email_confirmed_at === nextProps.user.email_confirmed_at &&
    prevProps.user.created_at === nextProps.user.created_at &&
    prevProps.setIsEditingDisplayName === nextProps.setIsEditingDisplayName &&
    prevProps.onSubmitDisplayName === nextProps.onSubmitDisplayName &&
    prevProps.handleLogout === nextProps.handleLogout &&
    prevProps.getInitials === nextProps.getInitials
  );
}

export default memo(UserInfoCard, arePropsEqual);
