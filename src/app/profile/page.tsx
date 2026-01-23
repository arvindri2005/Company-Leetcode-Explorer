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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  signOut,
  updateProfile as updateFirebaseAuthProfile,
} from "firebase/auth";
import {
  Bookmark,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Pencil,
} from "lucide-react";
import { z } from "zod";

import {
  getProblemByCompanySlugAndProblemSlugAction,
} from "@/app/actions/problem.actions"; // Import from specific file
import { ProfilePageSkeleton } from "@/components/skeletons/profile-skeletons";
import { StrategyListSkeleton } from "@/components/skeletons/strategy-skeleton";
import { Card, CardContent,CardHeader, CardTitle } from "@/components/ui/card";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EducationExperienceSection from "@/features/profile/components/education-experience-section";
import ProfileProblemList from "@/features/profile/components/profile-problem-list";
import ProfileTabErrorFallback from "@/features/profile/components/profile-tab-error-fallback";
import ProgressStats from "@/features/profile/components/progress-stats";
import UserInfoCard from "@/features/profile/components/user-info-card";
import WorkExperienceSection from "@/features/profile/components/work-experience-section";
import { userService } from "@/features/profile/services/user.service";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";
import { useAuth } from "@/providers";
import type {
  EducationExperience,
  LeetCodeProblem,
  ProblemStatus,
  SavedStrategyTodoList,
  UserProblemStatusInfo,
  WorkExperience,
} from "@/types";
import { EducationExperienceSchema, WorkExperienceSchema } from "@/types"; // Schemas for forms

const StrategyListsSection = dynamic(
  () => import("@/features/profile/components/strategy-lists-section"),
  {
    loading: () => <StrategyListSkeleton />,
  },
);

// Constants for empty state icons to prevent re-creation on render
const BOOKMARK_ICON = <Bookmark className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
const SOLVED_ICON = <CheckCircle2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
const ATTEMPTED_ICON = <Pencil className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
const TODO_ICON = <ListTodo className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;

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

  const [activeTab, setActiveTab] = useState("bookmarks");

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
  const [hasFetchedStatusMap, setHasFetchedStatusMap] = useState(false);
  // Track which statuses we have already hydrated to prevent re-fetching
  const hydratedStatusesRef = useRef<Set<ProblemStatus>>(new Set());
  // Track which statuses are currently being fetched to prevent race conditions
  const fetchingStatusesRef = useRef<Set<ProblemStatus>>(new Set());

  const [strategyTodoLists, setStrategyTodoLists] = useState<
    SavedStrategyTodoList[]
  >([]);
  const [isLoadingStrategyTodoLists, setIsLoadingStrategyTodoLists] =
    useState(false);
  const [hasFetchedStrategyLists, setHasFetchedStrategyLists] = useState(false);
  const [updatingTodoItemId, setUpdatingTodoItemId] = useState<string | null>(
    null,
  );

  const [educationHistory, setEducationHistory] = useState<
    EducationExperience[]
  >([]);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);
  const [hasFetchedEducation, setHasFetchedEducation] = useState(false);

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [isLoadingWorkExperience, setIsLoadingWorkExperience] = useState(false);
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);
  const [hasFetchedWorkExperience, setHasFetchedWorkExperience] = useState(false);

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
      {displayNameForm.reset({ displayName: user.displayName });}
  }, [user?.displayName, displayNameForm]);

  const fetchEducation = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingEducation(true);
      try {
        const result = await userService.getUserEducation(user.uid);
        if (result.isSuccess) {
          setEducationHistory(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch education history.",
            variant: "destructive",
          });
          setEducationHistory([]);
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch education history.",
          variant: "destructive",
        });
        setEducationHistory([]);
      }
      setIsLoadingEducation(false);
      setHasFetchedEducation(true);
    } else {setEducationHistory([]);}
  }, [user, toast]);

  const fetchWorkExperience = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingWorkExperience(true);
      try {
        const result = await userService.getUserWorkExperience(user.uid);
        if (result.isSuccess) {
          setWorkExperience(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch work experience.",
            variant: "destructive",
          });
          setWorkExperience([]);
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch work experience.",
          variant: "destructive",
        });
        setWorkExperience([]);
      }
      setIsLoadingWorkExperience(false);
      setHasFetchedWorkExperience(true);
    } else {setWorkExperience([]);}
  }, [user, toast]);

  const fetchBookmarkedData = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingBookmarks(true);
      try {
        const bookmarkInfosResult = await userService.getBookmarkedProblemsInfo(
          user.uid,
        );
        if (!bookmarkInfosResult.isSuccess) {
          toast({
            title: "Error",
            description: "Could not fetch bookmarked problems.",
            variant: "destructive",
          });
          setBookmarkedProblemDetails([]);
          setIsLoadingBookmarks(false);
          return;
        }
        const detailedProblemsPromises = bookmarkInfosResult.value.map(
          async (info) => {
            if (!info.companySlug || !info.problemSlug) {return null;}
            try {
              const result = await getProblemByCompanySlugAndProblemSlugAction(
                info.companySlug,
                info.problemSlug,
              );
              if (result.success && result.data?.problem) {
                return {
                  ...result.data.problem,
                  isBookmarked: true,
                } as ProblemWithDetails;
              }
              return null;
            } catch {
              return null;
            }
          },
        );
        setBookmarkedProblemDetails(
          (await Promise.all(detailedProblemsPromises)).filter(
            Boolean,
          ) as ProblemWithDetails[],
        );
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch bookmarked problems.",
          variant: "destructive",
        });
        setBookmarkedProblemDetails([]);
      }
      setIsLoadingBookmarks(false);
    } else {setBookmarkedProblemDetails([]);}
  }, [user, toast]);

  // Fetches only the status map (ID -> Status), lightweight
  const fetchStatusMap = useCallback(async () => {
    if (user?.uid) {
      // We don't set global loading here because this is background/initial fetch for stats
      try {
        const statusResult = await userService.getAllUserProblemStatuses(
          user.uid,
        );
        if (statusResult.isSuccess) {
          setProblemStatuses(statusResult.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch problem statuses.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch problem statuses.",
          variant: "destructive",
        });
      }
      setHasFetchedStatusMap(true);
    } else {
      setProblemStatuses({});
      setHasFetchedStatusMap(true);
    }
  }, [user, toast]);

  // Hydrates problem details for a specific status (Solved, Attempted, etc.)
  const hydrateProblemsForStatus = useCallback(async (status: ProblemStatus) => {
     if (!user?.uid) {return;}
     
     // Wait for the map to be fetched
     if (!hasFetchedStatusMap) {
       return; 
     }

     // Prevent duplicate hydration or concurrent fetches
     if (hydratedStatusesRef.current.has(status) || fetchingStatusesRef.current.has(status)) {
       return;
     }

     fetchingStatusesRef.current.add(status);
     setIsLoadingStatuses(true);
     try {
        // Use current problemStatuses map to find items needing hydration
        // We use functional update or ref logic if problemStatuses might be stale, 
        // but here we rely on the state being up to date from initial mount.
        const itemsToHydrate = Object.values(problemStatuses).filter(
          (info) => 
            info && 
            info.status === status && 
            info.companySlug && 
            info.problemSlug
        );

        // Filter out items that are ALREADY in problemsWithStatusDetails
        // (Though with strict status segregation, overlap should be minimal unless status changed)
        const existingIds = new Set(problemsWithStatusDetails.map(p => p.id));
        const uniqueItems = itemsToHydrate.filter(info => !existingIds.has(info.problemId));

        if (uniqueItems.length === 0) {
           hydratedStatusesRef.current.add(status);
           setIsLoadingStatuses(false);
           return;
        }

        const detailedProblemsPromises = uniqueItems.map(
          async (info) => {
            try {
              const result = await getProblemByCompanySlugAndProblemSlugAction(
                info.companySlug,
                info.problemSlug,
              );
              if (result.success && result.data?.problem) {
                return {
                  ...result.data.problem,
                  currentStatus: info.status,
                } as ProblemWithDetails;
              }
              return null;
            } catch {
              return null;
            }
          },
        );
        
        const newDetails = (await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithDetails[];
        
        setProblemsWithStatusDetails(prev => [...prev, ...newDetails]);
        hydratedStatusesRef.current.add(status);

     } catch (error) {
       console.error("Failed to hydrate problems", error);
       toast({
         title: "Error",
         description: `Could not load ${status} problems details.`,
         variant: "destructive"
       });
     } finally {
       fetchingStatusesRef.current.delete(status);
       setIsLoadingStatuses(false);
     }
  }, [user, hasFetchedStatusMap, problemStatuses, problemsWithStatusDetails, toast]);

  const fetchStrategyTodoLists = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingStrategyTodoLists(true);
      try {
        const result = await userService.getUserStrategyTodoLists(user.uid);
        if (result.isSuccess) {
          setStrategyTodoLists(result.value);
        } else {
          toast({
            title: "Error",
            description: "Could not fetch saved strategy todo lists.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Could not fetch saved strategy todo lists.",
          variant: "destructive",
        });
      }
      setIsLoadingStrategyTodoLists(false);
      setHasFetchedStrategyLists(true);
    } else {
      setStrategyTodoLists([]);
    }
  }, [user, toast]);

  // Initial Fetch: Status Map (for counts) and Bookmarks (default tab)
  useEffect(() => {
    if (user && !authLoading) {
      fetchStatusMap();
      fetchBookmarkedData(); // Fetch immediately as it is the default active tab
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Lazy Load Effect
  useEffect(() => {
    if (!user || authLoading) {return;}

    switch (activeTab) {
      case "solved":
        hydrateProblemsForStatus("solved");
        break;
      case "attempted":
        hydrateProblemsForStatus("attempted");
        break;
      case "todo":
        hydrateProblemsForStatus("todo");
        break;
      case "strategyLists":
        if (!hasFetchedStrategyLists && !isLoadingStrategyTodoLists) {
          fetchStrategyTodoLists();
        }
        break;
      case "background":
        if (!hasFetchedEducation && !isLoadingEducation) {
          fetchEducation();
        }
        if (!hasFetchedWorkExperience && !isLoadingWorkExperience) {
          fetchWorkExperience();
        }
        break;
      default:
        break;
    }
  }, [
    activeTab, 
    user, 
    authLoading, 
    hydrateProblemsForStatus, 
    fetchStrategyTodoLists, 
    hasFetchedStrategyLists, 
    isLoadingStrategyTodoLists,
    fetchEducation, 
    hasFetchedEducation, 
    isLoadingEducation,
    fetchWorkExperience, 
    hasFetchedWorkExperience, 
    isLoadingWorkExperience
  ]);

  const handleAddEducation = useCallback(async (data: EducationFormValues) => {
    if (!user) {return;}
    educationForm.clearErrors(); // Clear previous errors
    const result = await userService.addUserEducation(user.uid, data);
    if (result.isSuccess && result.value.id) {
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
        description: result.isFailure ? result.error.message : "Could not add education.",
        variant: "destructive",
      });
    }
  }, [user, educationForm, fetchEducation, toast]);

  const handleAddWorkExperience = useCallback(async (data: WorkExperienceFormValues) => {
    if (!user) {return;}
    workForm.clearErrors(); // Clear previous errors
    const result = await userService.addUserWorkExperience(user.uid, data);
    if (result.isSuccess && result.value.id) {
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
        description: result.isFailure ? result.error.message : "Could not add work experience.",
        variant: "destructive",
      });
    }
  }, [user, workForm, fetchWorkExperience, toast]);

  const handleToggleTodoItem = useCallback(
    async (companyId: string, itemIndex: number, newStatus: boolean) => {
      if (!user) {
        return;
      }
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

      if (!result.isSuccess) {
        toast({
          title: "Update Failed",
          description: result.error.message || "Could not update item status.",
          variant: "destructive",
        });
        setStrategyTodoLists(originalLists); // Rollback UI on failure
      } else {
        // In this case, we don't need to re-fetch full lists if we trust our optimistic update
        // But for consistency we can
        // fetchStrategyTodoLists(); 
      }
    },
    [user, strategyTodoLists, toast],
  );

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

  const handleProblemBookmarkChangeOnProfile = useCallback(
    (problemId: string, newStatus: boolean) => {
      setBookmarkedProblemDetails(
        (prev) =>
          newStatus
            ? prev.map((p) =>
                p.id === problemId ? { ...p, isBookmarked: true } : p,
              )
            : prev.filter((p) => p.id !== problemId), // If unbookmarked, remove from list
      );
      // We don't need to re-fetch status map for bookmark changes usually, but if needed:
      // fetchStatusMap();
    },
    [],
  );

  const handleProblemStatusChangeOnProfile = useCallback(
    (problemId: string, newStatus: ProblemStatus) => {
      setProblemsWithStatusDetails((prev) => {
        if (newStatus === "none") {
          return prev.filter((p) => p.id !== problemId);
        }
        return prev.map((p) =>
          p.id === problemId ? { ...p, currentStatus: newStatus } : p,
        );
      });
      // Re-fetch status map to ensure counts are accurate
      fetchStatusMap();
      
      // We might need to mark the new status as needing hydration if it wasn't before?
      // But simpler is to assume we might be inconsistent until refresh, or just rely on the map update.
      // Since we updated local state 'problemsWithStatusDetails', the list should be correct.
    },
    [fetchStatusMap],
  );

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

  // Optimized stats calculation: iterate once instead of 3 times
  const stats = useMemo(() => {
    let solved = 0;
    let attempted = 0;
    let todo = 0;
    Object.values(problemStatuses).forEach((p) => {
      if (p?.status === "solved") {
        solved++;
      } else if (p?.status === "attempted") {
        attempted++;
      } else if (p?.status === "todo") {
        todo++;
      }
    });
    return { solved, attempted, todo };
  }, [problemStatuses]);

  // Memoize filtered lists to prevent unnecessary re-renders of ProfileProblemList
  const solvedProblems = useMemo(
    () => problemsWithStatusDetails.filter((p) => p.currentStatus === "solved"),
    [problemsWithStatusDetails]
  );

  const attemptedProblems = useMemo(
    () =>
      problemsWithStatusDetails.filter((p) => p.currentStatus === "attempted"),
    [problemsWithStatusDetails]
  );

  const todoProblems = useMemo(
    () => problemsWithStatusDetails.filter((p) => p.currentStatus === "todo"),
    [problemsWithStatusDetails]
  );

  if (authLoading) {return <ProfilePageSkeleton />;}
  if (!user) {
    router.push("/login");
    return null;
  }

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      emptyStateMessage="No bookmarks yet"
                      emptyStateDescription="Save interesting problems to your bookmarks to easily find them later."
                      emptyStateIcon={BOOKMARK_ICON}
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
                      problems={solvedProblems}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                      emptyStateMessage="No solved problems"
                      emptyStateDescription="You haven't solved any problems yet. Start your journey today!"
                      emptyStateIcon={SOLVED_ICON}
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
                      problems={attemptedProblems}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                      emptyStateMessage="No attempted problems"
                      emptyStateDescription="Problems you've started but haven't finished will appear here."
                      emptyStateIcon={ATTEMPTED_ICON}
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
                      problems={todoProblems}
                      isLoading={isLoadingStatuses}
                      listType="status"
                      onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                      onProblemStatusChange={handleProblemStatusChangeOnProfile}
                      emptyStateMessage="Your to-do list is empty"
                      emptyStateDescription="Plan your practice by adding problems to your to-do list."
                      emptyStateIcon={TODO_ICON}
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
