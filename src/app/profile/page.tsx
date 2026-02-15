/**
 * @fileoverview Defines the user profile page, which serves as a personal dashboard.
 *
 * This is a comprehensive client-side component that handles the display and management
 * of all user-specific data. It fetches and renders information such as user details,
 * progress statistics, bookmarked problems, problem statuses, saved AI strategies,
 * and educational/work background. It uses various sub-components to organize the UI
 * and server actions to interact with the backend.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  signOut,
  updateProfile as updateFirebaseAuthProfile,
} from "firebase/auth";
import { z } from "zod";

import { ProfileContent } from "@/features/profile/components/profile-page/profile-content";
import { ProfileHeader } from "@/features/profile/components/profile-page/profile-header";
import { BookmarksTab } from "@/features/profile/components/tabs/bookmarks-tab";
import { EducationTab } from "@/features/profile/components/tabs/education-tab";
import { ProgressTab } from "@/features/profile/components/tabs/progress-tab";
import { StrategiesTab } from "@/features/profile/components/tabs/strategies-tab";
import { useBookmarks } from "@/features/profile/hooks/use-bookmarks";
import { useEducation } from "@/features/profile/hooks/use-education";
import { useProblemStatuses } from "@/features/profile/hooks/use-problem-statuses";
import { useProfileData } from "@/features/profile/hooks/use-profile-data";
import { useStrategies } from "@/features/profile/hooks/use-strategies";
import { useWorkExperience } from "@/features/profile/hooks/use-work-experience";
import { useAuth } from "@/providers";
import { ProfilePageSkeleton } from "@/shared/components/skeletons/profile-skeletons";
import { useToast } from "@/shared/hooks/use-toast";
import { auth } from "@/shared/lib/api/firebase";
import {
  EducationExperienceSchema,
  WorkExperienceSchema,
  WorkExperienceBaseSchema,
  validateWorkExperienceDates,
} from "@/shared/types"; // Schemas for forms

/**
 * Zod schema for validating the display name update form.
 */
const displayNameFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50, { message: "Display name cannot exceed 50 characters." }),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

/**
 * Zod schema for validating the education form (client-side).
 */
const educationClientSchema = EducationExperienceSchema.omit({ id: true });
type EducationFormValues = z.infer<typeof educationClientSchema>;

/**
 * Zod schema for validating the work experience form (client-side).
 */
const workExperienceClientSchema = WorkExperienceBaseSchema.omit({
  id: true,
}).refine(validateWorkExperienceDates, {
  message: "End date must be after start date.",
  path: ["endDate"],
});
type WorkExperienceFormValues = z.infer<typeof workExperienceClientSchema>;

/**
 * Renders the user profile page, a comprehensive dashboard for user-specific information.
 *
 * This component acts as a central hub for all user interactions and data. It manages:
 * - Authentication state, redirecting to login if the user is not authenticated.
 * - Fetching and displaying user info, education, and work history.
 * - Fetching and displaying lists of problems (bookmarked, solved, attempted, to-do).
 * - Displaying and managing saved AI-generated study strategies and their to-do lists.
 * - Handling updates to user data, such as changing a display name, adding background info,
 *   or toggling to-do items, through various server actions.
 * - State management for loading, editing, and form submissions across multiple sections.
 *
 * It is composed of several smaller, focused components to keep the UI organized.
 *
 * @returns {JSX.Element | null} The rendered profile page, a loading skeleton, or `null` if redirecting.
 */
export default function ProfilePage() {
  const {
    user,
    loading: authLoading,
    setUser,
    syncUserProfileIfNeeded,
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("bookmarks");
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isSubmittingDisplayName, setIsSubmittingDisplayName] = useState(false);

  // Use extracted hooks
  const profileData = useProfileData(user, authLoading);
  const bookmarksData = useBookmarks(user, authLoading);
  const problemStatusesData = useProblemStatuses(
    user,
    authLoading,
    profileData.problemStatuses,
    profileData.hasFetchedStatusMap,
    profileData.fetchStatusMap,
    profileData.updateProblemStatusLocally
  );
  const educationData = useEducation(user);
  const workExperienceData = useWorkExperience(user);
  const strategiesData = useStrategies(user);

  // Forms
  const displayNameForm = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameFormSchema),
    defaultValues: { displayName: user?.displayName || "" },
  });
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationClientSchema),
    defaultValues: {
      degree: "",
      major: "",
      school: "",
      graduationYear: "",
      gpa: "",
    },
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceClientSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      startDate: "",
      endDate: "",
      responsibilities: "",
    },
  });

  useEffect(() => {
    if (user?.displayName) {
      displayNameForm.reset({ displayName: user.displayName });
    }
  }, [user?.displayName, displayNameForm]);

  // Lazy Load Effect
  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    switch (activeTab) {
      case "solved":
        problemStatusesData.hydrateProblemsForStatus("solved");
        break;
      case "attempted":
        problemStatusesData.hydrateProblemsForStatus("attempted");
        break;
      case "todo":
        problemStatusesData.hydrateProblemsForStatus("todo");
        break;
      case "strategyLists":
        if (!strategiesData.hasFetchedStrategyLists && !strategiesData.isLoadingStrategyTodoLists) {
          strategiesData.fetchStrategyTodoLists();
        }
        break;
      case "background":
        if (!educationData.hasFetchedEducation && !educationData.isLoadingEducation) {
          educationData.fetchEducation();
        }
        if (!workExperienceData.hasFetchedWorkExperience && !workExperienceData.isLoadingWorkExperience) {
          workExperienceData.fetchWorkExperience();
        }
        break;
      default:
        break;
    }
  }, [
    activeTab, 
    user, 
    authLoading, 
    problemStatusesData, 
    strategiesData,
    educationData,
    workExperienceData
  ]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, router]);

  const getInitials = useCallback((name: string | null | undefined) => {
    if (!name) {
      return "AU";
    } // Anonymous User
    const names = name.split(" ");
    const initials = names.map((n) => n[0]).join("");
    return initials.toUpperCase().slice(0, 2);
  }, []);

  const onSubmitDisplayName = useCallback(
    async (data: DisplayNameFormValues) => {
      if (!user) {
        return;
      }
      setIsSubmittingDisplayName(true);
      try {
        // Update Firebase Auth profile
        await updateFirebaseAuthProfile(user, {
          displayName: data.displayName,
        });
        // Update Firestore profile
        const { userService } = await import("@/features/profile/services/user.service");
        const firestoreResult = await userService.updateUserDisplayName(
          user.uid,
          data.displayName.trim(),
        );

        if (firestoreResult.isSuccess) {
          // Manually update user object in AuthContext for immediate UI reflection
          // Create a new user object to trigger re-renders
          const updatedUser = {
            ...user,
            displayName: data.displayName,
          } as typeof user;
          if (setUser) {
            setUser(updatedUser); // Update context
          }
          await syncUserProfileIfNeeded(updatedUser); // Re-sync with potentially new displayName from Auth

          toast({
            title: "Success",
            description: "Display name updated successfully!",
          });
          setIsEditingDisplayName(false);
        } else {
          toast({
            title: "Error",
            description:
              firestoreResult.error.message ||
              "Failed to update display name in database.",
            variant: "destructive",
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update display name.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsSubmittingDisplayName(false);
      }
    },
    [user, setUser, syncUserProfileIfNeeded, toast],
  );

  if (authLoading) {
    return <ProfilePageSkeleton />;
  }
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Profile Header */}
        <ProfileHeader
          user={user}
          isEditingDisplayName={isEditingDisplayName}
          setIsEditingDisplayName={setIsEditingDisplayName}
          onSubmitDisplayName={onSubmitDisplayName}
          isSubmittingDisplayName={isSubmittingDisplayName}
          handleLogout={handleLogout}
          getInitials={getInitials}
          displayNameForm={displayNameForm}
          stats={profileData.stats}
        />

        {/* Right Column - Profile Content */}
        <ProfileContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          bookmarksCount={bookmarksData.bookmarkedProblemDetails.length}
          solvedCount={profileData.stats.solved}
          attemptedCount={profileData.stats.attempted}
          todoCount={profileData.stats.todo}
          strategiesCount={strategiesData.strategyTodoLists.length}
        >
          <BookmarksTab
            problems={bookmarksData.bookmarkedProblemDetails}
            isLoading={bookmarksData.isLoadingBookmarks}
            onBookmarkChanged={bookmarksData.handleProblemBookmarkChange}
            onProblemStatusChange={problemStatusesData.handleProblemStatusChange}
          />

          <ProgressTab
            tabValue="solved"
            problems={problemStatusesData.solvedProblems}
            isLoading={problemStatusesData.isLoadingStatuses}
            onBookmarkChanged={bookmarksData.handleProblemBookmarkChange}
            onProblemStatusChange={problemStatusesData.handleProblemStatusChange}
          />

          <ProgressTab
            tabValue="attempted"
            problems={problemStatusesData.attemptedProblems}
            isLoading={problemStatusesData.isLoadingStatuses}
            onBookmarkChanged={bookmarksData.handleProblemBookmarkChange}
            onProblemStatusChange={problemStatusesData.handleProblemStatusChange}
          />

          <ProgressTab
            tabValue="todo"
            problems={problemStatusesData.todoProblems}
            isLoading={problemStatusesData.isLoadingStatuses}
            onBookmarkChanged={bookmarksData.handleProblemBookmarkChange}
            onProblemStatusChange={problemStatusesData.handleProblemStatusChange}
          />

          <StrategiesTab
            strategyTodoLists={strategiesData.strategyTodoLists}
            isLoadingStrategyTodoLists={strategiesData.isLoadingStrategyTodoLists}
            updatingTodoItemId={strategiesData.updatingTodoItemId}
            handleToggleTodoItem={strategiesData.handleToggleTodoItem}
          />

          <EducationTab
            userId={user.uid}
            educationHistory={educationData.educationHistory}
            isLoadingEducation={educationData.isLoadingEducation}
            handleAddEducation={educationData.handleAddEducation}
            isEducationDialogOpen={educationData.isEducationDialogOpen}
            setIsEducationDialogOpen={educationData.setIsEducationDialogOpen}
            educationForm={educationForm}
            workExperience={workExperienceData.workExperience}
            isLoadingWorkExperience={workExperienceData.isLoadingWorkExperience}
            handleAddWorkExperience={workExperienceData.handleAddWorkExperience}
            isWorkDialogOpen={workExperienceData.isWorkDialogOpen}
            setIsWorkDialogOpen={workExperienceData.setIsWorkDialogOpen}
            workForm={workForm}
          />
        </ProfileContent>
      </div>
    </div>
  );
}
