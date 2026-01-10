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

import { useAuth } from "@/providers";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import UserInfoCard from "@/features/profile/components/user-info-card";
import EducationExperienceSection from "@/features/profile/components/education-experience-section";
import WorkExperienceSection from "@/features/profile/components/work-experience-section";
import ProgressStats from "@/features/profile/components/progress-stats";
import ProfileProblemList from "@/features/profile/components/profile-problem-list";

import { ProfilePageSkeleton } from "@/components/skeletons/profile-skeletons";
import { StrategyListSkeleton } from "@/components/skeletons/strategy-skeleton";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ErrorBoundary from "@/components/ui/error-boundary";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import {
  Bookmark,
  CheckCircle2,
  Pencil,
  ListTodo,
  FolderKanban,
  Briefcase,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  signOut,
  updateProfile as updateFirebaseAuthProfile,
} from "firebase/auth";
import { auth } from "@/lib/api/firebase";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/user.service";

import type {
  LeetCodeProblem,
  ProblemStatus,
  BookmarkedProblemInfo,
  UserProblemStatusInfo,
  SavedStrategyTodoList,
  EducationExperience,
  WorkExperience,
} from "@/types";
import { EducationExperienceSchema, WorkExperienceSchema } from "@/types"; // Schemas for forms

import {
  getProblemByCompanySlugAndProblemSlugAction,
} from "@/app/actions/problem.actions"; // Import from specific file

const StrategyListsSection = dynamic(
  () => import("@/features/profile/components/strategy-lists-section"),
  {
    loading: () => <StrategyListSkeleton />,
  },
);

/**
 * Extends the LeetCodeProblem type to include user-specific status information.
 */
interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

/**
 * Zod schema for validating the display name update form.
 */
const displayNameFormSchema = z.object({
  displayName: z
    .string()
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
const workExperienceClientSchema = WorkExperienceSchema.omit({ id: true });
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

  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<
    ProblemWithDetails[]
  >([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [problemStatuses, setProblemStatuses] = useState<
    Record<string, UserProblemStatusInfo>
  >({});
  const [problemsWithStatusDetails, setProblemsWithStatusDetails] = useState<
    ProblemWithDetails[]
  >([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  const [strategyTodoLists, setStrategyTodoLists] = useState<
    SavedStrategyTodoList[]
  >([]);
  const [isLoadingStrategyTodoLists, setIsLoadingStrategyTodoLists] =
    useState(false);
  const [updatingTodoItemId, setUpdatingTodoItemId] = useState<string | null>(
    null,
  );

  const [educationHistory, setEducationHistory] = useState<
    EducationExperience[]
  >([]);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [isLoadingWorkExperience, setIsLoadingWorkExperience] = useState(false);
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isSubmittingDisplayName, setIsSubmittingDisplayName] = useState(false);

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
    if (user?.displayName)
      displayNameForm.reset({ displayName: user.displayName });
  }, [user?.displayName, displayNameForm]);

  const fetchEducation = async () => {
    if (user?.uid) {
      setIsLoadingEducation(true);
      try {
        const result = await userService.getUserEducation(user.uid);
        setEducationHistory(result);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch education history.",
          variant: "destructive",
        });
        setEducationHistory([]);
      }
      setIsLoadingEducation(false);
    } else setEducationHistory([]);
  };

  const fetchWorkExperience = async () => {
    if (user?.uid) {
      setIsLoadingWorkExperience(true);
      try {
        const result = await userService.getUserWorkExperience(user.uid);
        setWorkExperience(result);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch work experience.",
          variant: "destructive",
        });
        setWorkExperience([]);
      }
      setIsLoadingWorkExperience(false);
    } else setWorkExperience([]);
  };

  const fetchBookmarkedData = async () => {
    if (user?.uid) {
      setIsLoadingBookmarks(true);
      try {
        const bookmarkInfosResult = await userService.getBookmarkedProblemsInfo(
          user.uid,
        );
        const detailedProblemsPromises = bookmarkInfosResult.map(
          async (info) => {
            if (!info.companySlug || !info.problemSlug) return null;
            try {
              const result = await getProblemByCompanySlugAndProblemSlugAction(
                info.companySlug,
                info.problemSlug,
              );
              return result.problem
                ? ({
                    ...result.problem,
                    isBookmarked: true,
                  } as ProblemWithDetails)
                : null;
            } catch (e) {
              return null;
            }
          },
        );
        setBookmarkedProblemDetails(
          (await Promise.all(detailedProblemsPromises)).filter(
            Boolean,
          ) as ProblemWithDetails[],
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch bookmarked problems.",
          variant: "destructive",
        });
        setBookmarkedProblemDetails([]);
      }
      setIsLoadingBookmarks(false);
    } else setBookmarkedProblemDetails([]);
  };

  const fetchStatusData = async () => {
    if (user?.uid) {
      setIsLoadingStatuses(true);
      try {
        const statusResult = await userService.getAllUserProblemStatuses(user.uid);
        setProblemStatuses(statusResult);
        const problemRefsWithStatus = Object.values(statusResult).filter(
          (info) =>
            info &&
            info.status !== "none" &&
            info.companySlug &&
            info.problemSlug,
        );
        const detailedProblemsPromises = problemRefsWithStatus.map(
          async (info) => {
            try {
              const result = await getProblemByCompanySlugAndProblemSlugAction(
                info.companySlug,
                info.problemSlug,
              );
              return result.problem
                ? ({
                    ...result.problem,
                    currentStatus: info.status,
                  } as ProblemWithDetails)
                : null;
            } catch (e) {
              return null;
            }
          },
        );
        setProblemsWithStatusDetails(
          (await Promise.all(detailedProblemsPromises)).filter(
            Boolean,
          ) as ProblemWithDetails[],
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch problem statuses.",
          variant: "destructive",
        });
        setProblemsWithStatusDetails([]);
      }
      setIsLoadingStatuses(false);
    } else {
      setProblemStatuses({});
      setProblemsWithStatusDetails([]);
    }
  };

  const fetchStrategyTodoLists = async () => {
    if (user?.uid) {
      setIsLoadingStrategyTodoLists(true);
      try {
        const result = await userService.getUserStrategyTodoLists(user.uid);
        setStrategyTodoLists(result);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch saved strategy todo lists.",
          variant: "destructive",
        });
      }
      setIsLoadingStrategyTodoLists(false);
    } else setStrategyTodoLists([]);
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchEducation();
      fetchWorkExperience();
      fetchBookmarkedData();
      fetchStatusData();
      fetchStrategyTodoLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleAddEducation = async (data: EducationFormValues) => {
    if (!user) return;
    educationForm.clearErrors(); // Clear previous errors
    const result = await userService.addUserEducation(user.uid, data);
    if (result.id) {
      toast({
        title: "Education Added",
        description: "Your educational background has been updated.",
      });
      fetchEducation(); // Re-fetch to get the latest list including the new ID
      educationForm.reset();
      setIsEducationDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not add education.",
        variant: "destructive",
      });
    }
  };

  const handleAddWorkExperience = async (data: WorkExperienceFormValues) => {
    if (!user) return;
    workForm.clearErrors(); // Clear previous errors
    const result = await userService.addUserWorkExperience(user.uid, data);
    if (result.id) {
      toast({
        title: "Work Experience Added",
        description: "Your work history has been updated.",
      });
      fetchWorkExperience(); // Re-fetch
      workForm.reset();
      setIsWorkDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not add work experience.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTodoItem = async (
    companyId: string,
    itemIndex: number,
    newStatus: boolean,
  ) => {
    if (!user) return;
    const todoItemId = `${companyId}-${itemIndex}`;
    setUpdatingTodoItemId(todoItemId);
    const originalLists = [...strategyTodoLists]; // Keep a copy for optimistic update rollback

    // Optimistic UI update
    setStrategyTodoLists((prevLists) =>
      prevLists.map((list) =>
        list.companyId === companyId
          ? {
              ...list,
              items: list.items.map((item, index) =>
                index === itemIndex
                  ? { ...item, isCompleted: newStatus }
                  : item,
              ),
            }
          : list,
      ),
    );

    const result = await userService.updateStrategyTodoItemStatus(
      user.uid,
      companyId,
      itemIndex,
      newStatus,
    );
    setUpdatingTodoItemId(null);

    if (!result.success) {
      toast({
        title: "Update Failed",
        description: result.error || "Could not update item status.",
        variant: "destructive",
      });
      setStrategyTodoLists(originalLists); // Rollback UI on failure
    } else {
      fetchStrategyTodoLists(); // Re-fetch on success to ensure data consistency
    }
  };

  const handleLogout = async () => {
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
  };

  const handleProblemBookmarkChangeOnProfile = (
    problemId: string,
    newStatus: boolean,
  ) => {
    setBookmarkedProblemDetails(
      (prev) =>
        newStatus
          ? prev.map((p) =>
              p.id === problemId ? { ...p, isBookmarked: true } : p,
            )
          : prev.filter((p) => p.id !== problemId), // If unbookmarked, remove from list
    );
    // Optionally, re-fetch problem statuses if bookmarking could affect any lists based on problem status
    fetchStatusData();
  };

  const handleProblemStatusChangeOnProfile = (
    problemId: string,
    newStatus: ProblemStatus,
  ) => {
    setProblemsWithStatusDetails((prev) => {
      if (newStatus === "none") return prev.filter((p) => p.id !== problemId);
      return prev.map((p) =>
        p.id === problemId ? { ...p, currentStatus: newStatus } : p,
      );
    });
    // Re-fetch all status data to accurately update counts and lists
    fetchStatusData();
    // Bookmarks are independent, no need to re-fetch them here unless logic changes
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AU"; // Anonymous User
    const names = name.split(" ");
    const initials = names.map((n) => n[0]).join("");
    return initials.toUpperCase().slice(0, 2);
  };

  const onSubmitDisplayName = async (data: DisplayNameFormValues) => {
    if (!user) return;
    setIsSubmittingDisplayName(true);
    try {
      // Update Firebase Auth profile
      await updateFirebaseAuthProfile(user, {
        displayName: data.displayName,
      });
      // Update Firestore profile
      const firestoreResult = await userService.updateUserDisplayName(
        user.uid,
        data.displayName.trim(),
      );

      if (firestoreResult.success) {
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
            firestoreResult.error ||
            "Failed to update display name in database.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update display name.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDisplayName(false);
    }
  };

  if (authLoading) return <ProfilePageSkeleton />;
  if (!user) {
    router.push("/login");
    return null;
  }

  const stats = {
    solved: Object.values(problemStatuses).filter((p) => p?.status === "solved")
      .length,
    attempted: Object.values(problemStatuses).filter(
      (p) => p?.status === "attempted",
    ).length,
    todo: Object.values(problemStatuses).filter((p) => p?.status === "todo")
      .length,
  };

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
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

        {/* Right Column */}
        <div className="lg:col-span-8 xl:col-span-9">
          <Tabs defaultValue="bookmarks" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 mb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              <TabsTrigger value="bookmarks">
                <Bookmark className="mr-2 h-4 w-4" />
                Bookmarks ({bookmarkedProblemDetails.length})
              </TabsTrigger>
              <TabsTrigger value="solved">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Solved ({stats.solved})
              </TabsTrigger>
              <TabsTrigger value="attempted">
                <Pencil className="mr-2 h-4 w-4 text-yellow-500" />
                Attempted ({stats.attempted})
              </TabsTrigger>
              <TabsTrigger value="todo">
                <ListTodo className="mr-2 h-4 w-4 text-blue-500" />
                To-Do ({stats.todo})
              </TabsTrigger>
              <TabsTrigger value="strategyLists">
                <FolderKanban className="mr-2 h-4 w-4" />
                Strategies ({strategyTodoLists.length})
              </TabsTrigger>
              <TabsTrigger value="background">
                <Briefcase className="mr-2 h-4 w-4" />
                Background
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookmarks">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback
                    {...props}
                    tabName="Bookmarked Problems"
                  />
                )}
              >
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Your Bookmarked Problems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileProblemList
                      title="Bookmarked Problems"
                      problems={bookmarkedProblemDetails}
                      isLoading={isLoadingBookmarks}
                      listType="bookmarks"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="solved">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback {...props} tabName="Solved Problems" />
                )}
              >
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Solved Problems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileProblemList
                      title="Solved Problems"
                      problems={problemsWithStatusDetails.filter(
                        (p) => p.currentStatus === "solved",
                      )}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="attempted">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback
                    {...props}
                    tabName="Attempted Problems"
                  />
                )}
              >
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Attempted Problems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileProblemList
                      title="Attempted Problems"
                      problems={problemsWithStatusDetails.filter(
                        (p) => p.currentStatus === "attempted",
                      )}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="todo">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback {...props} tabName="To-Do Problems" />
                )}
              >
                <Card className="bg-card border border-border rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle>To-Do Problems</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfileProblemList
                      title="To-Do Problems"
                      problems={problemsWithStatusDetails.filter(
                        (p) => p.currentStatus === "todo",
                      )}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="strategyLists">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback {...props} tabName="Strategies" />
                )}
              >
                <StrategyListsSection
                  strategyTodoLists={strategyTodoLists}
                  isLoadingStrategyTodoLists={isLoadingStrategyTodoLists}
                  updatingTodoItemId={updatingTodoItemId}
                  handleToggleTodoItem={handleToggleTodoItem}
                />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="background">
              <ErrorBoundary
                fallbackRender={(props) => (
                  <ProfileTabErrorFallback {...props} tabName="Background" />
                )}
              >
                <div className="space-y-8 bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
                  <FormProvider {...educationForm}>
                    <EducationExperienceSection
                      userId={user.uid}
                      educationHistory={educationHistory}
                      isLoadingEducation={isLoadingEducation}
                      handleAddEducation={handleAddEducation}
                      isEducationDialogOpen={isEducationDialogOpen}
                      setIsEducationDialogOpen={setIsEducationDialogOpen}
                    />
                  </FormProvider>
                  <FormProvider {...workForm}>
                    <WorkExperienceSection
                      userId={user.uid}
                      workExperience={workExperience}
                      isLoadingWorkExperience={isLoadingWorkExperience}
                      handleAddWorkExperience={handleAddWorkExperience}
                      isWorkDialogOpen={isWorkDialogOpen}
                      setIsWorkDialogOpen={setIsWorkDialogOpen}
                    />
                  </FormProvider>
                </div>
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}






