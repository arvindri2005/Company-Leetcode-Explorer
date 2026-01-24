/**
 * @fileoverview Profile header component that displays user info and edit actions
 */
"use client";

import { FormProvider, type UseFormReturn } from "react-hook-form";

import type { User as FirebaseUser } from "firebase/auth";

import ProgressStats from "@/features/profile/components/progress-stats";
import UserInfoCard from "@/features/profile/components/user-info-card";

type DisplayNameFormValues = {
  displayName: string;
};

export interface ProfileHeaderProps {
  user: FirebaseUser;
  isEditingDisplayName: boolean;
  setIsEditingDisplayName: (isEditing: boolean) => void;
  onSubmitDisplayName: (data: DisplayNameFormValues) => Promise<void>;
  isSubmittingDisplayName: boolean;
  handleLogout: () => Promise<void>;
  getInitials: (name: string | null | undefined) => string;
  displayNameForm: UseFormReturn<DisplayNameFormValues>;
  stats: {
    solved: number;
    attempted: number;
    todo: number;
  };
}

/**
 * ProfileHeader component displays user information and progress statistics
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export function ProfileHeader({
  user,
  isEditingDisplayName,
  setIsEditingDisplayName,
  onSubmitDisplayName,
  isSubmittingDisplayName,
  handleLogout,
  getInitials,
  displayNameForm,
  stats,
}: ProfileHeaderProps) {
  return (
    <div className="lg:col-span-4 xl:col-span-3 space-y-8">
      <div className="sticky top-24 space-y-8">
        <FormProvider {...displayNameForm}>
          <UserInfoCard
            user={user}
            isEditingDisplayName={isEditingDisplayName}
            setIsEditingDisplayName={setIsEditingDisplayName}
            onSubmitDisplayName={onSubmitDisplayName}
            isSubmittingDisplayName={isSubmittingDisplayName}
            handleLogout={handleLogout}
            getInitials={getInitials}
          />
        </FormProvider>
        <ProgressStats stats={stats} />
      </div>
    </div>
  );
}
