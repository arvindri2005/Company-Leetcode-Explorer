
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import UserInfoCard from '@/components/profile/user-info-card';
import EducationExperienceSection from '@/components/profile/education-experience-section';
import WorkExperienceSection from '@/components/profile/work-experience-section';
import ProgressStats from '@/components/profile/progress-stats';
import ProfileProblemList from '@/components/profile/profile-problem-list';
import StrategyListsSection from '@/components/profile/strategy-lists-section';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, CheckCircle2, Pencil, ListTodo, FolderKanban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { signOut, updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import type { LeetCodeProblem, ProblemStatus, BookmarkedProblemInfo, UserProblemStatusInfo, SavedStrategyTodoList, EducationExperience, WorkExperience } from '@/types';
import { EducationExperienceSchema, WorkExperienceSchema } from '@/types'; // Schemas for forms

import { 
  getUsersBookmarkedProblemsInfoAction, 
  getAllUserProblemStatusesAction, 
  updateUserDisplayNameInFirestore, 
  getUserStrategyTodoListsAction, 
  updateStrategyTodoItemStatusAction,
  addUserEducationAction,
  getUserEducationAction,
  addUserWorkExperienceAction,
  getUserWorkExperienceAction
} from '@/app/actions';
import { getProblemByCompanySlugAndProblemSlug } from '@/lib/data'; 

interface ProblemWithDetails extends LeetCodeProblem {
  currentStatus?: ProblemStatus;
  isBookmarked?: boolean;
}

const displayNameFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, {message: 'Display name cannot exceed 50 characters.'}),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

const educationClientSchema = EducationExperienceSchema.omit({ id: true });
type EducationFormValues = z.infer<typeof educationClientSchema>;

const workExperienceClientSchema = WorkExperienceSchema.omit({ id: true });
type WorkExperienceFormValues = z.infer<typeof workExperienceClientSchema>;


export default function ProfilePage() {
  const { user, loading: authLoading, setUser, syncUserProfileIfNeeded } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<ProblemWithDetails[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [problemStatuses, setProblemStatuses] = useState<Record<string, UserProblemStatusInfo>>({});
  const [problemsWithStatusDetails, setProblemsWithStatusDetails] = useState<ProblemWithDetails[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  const [strategyTodoLists, setStrategyTodoLists] = useState<SavedStrategyTodoList[]>([]);
  const [isLoadingStrategyTodoLists, setIsLoadingStrategyTodoLists] = useState(false);
  const [updatingTodoItemId, setUpdatingTodoItemId] = useState<string | null>(null);

  const [educationHistory, setEducationHistory] = useState<EducationExperience[]>([]);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [isLoadingWorkExperience, setIsLoadingWorkExperience] = useState(false);
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isSubmittingDisplayName, setIsSubmittingDisplayName] = useState(false);

  const displayNameForm = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameFormSchema),
    defaultValues: { displayName: user?.displayName || '' },
  });
  const educationForm = useForm<EducationFormValues>({
    resolver: zodResolver(educationClientSchema),
    defaultValues: { degree: '', major: '', school: '', graduationYear: '', gpa: '' },
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceClientSchema),
    defaultValues: { jobTitle: '', companyName: '', startDate: '', endDate: '', responsibilities: '' },
  });

  useEffect(() => {
    if (user?.displayName) displayNameForm.reset({ displayName: user.displayName });
  }, [user?.displayName, displayNameForm]);

  const fetchEducation = async () => {
    if (user?.uid) {
      setIsLoadingEducation(true);
      const result = await getUserEducationAction(user.uid);
      if (Array.isArray(result)) setEducationHistory(result);
      else toast({ title: 'Error', description: 'Could not fetch education history.', variant: 'destructive' });
      setIsLoadingEducation(false);
    } else setEducationHistory([]);
  };

  const fetchWorkExperience = async () => {
    if (user?.uid) {
      setIsLoadingWorkExperience(true);
      const result = await getUserWorkExperienceAction(user.uid);
      if (Array.isArray(result)) setWorkExperience(result);
      else toast({ title: 'Error', description: 'Could not fetch work experience.', variant: 'destructive' });
      setIsLoadingWorkExperience(false);
    } else setWorkExperience([]);
  };
  
  const fetchBookmarkedData = async () => {
    if (user?.uid) {
      setIsLoadingBookmarks(true);
      const bookmarkInfosResult = await getUsersBookmarkedProblemsInfoAction(user.uid);
      if (Array.isArray(bookmarkInfosResult)) {
        const detailedProblemsPromises = bookmarkInfosResult.map(async (info) => {
          if (!info.companySlug || !info.problemSlug) return null;
          try {
            const result = await getProblemByCompanySlugAndProblemSlug(info.companySlug, info.problemSlug);
            return result.problem ? { ...result.problem, isBookmarked: true } as ProblemWithDetails : null;
          } catch (e) { return null; }
        });
        setBookmarkedProblemDetails((await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithDetails[]);
      } else {
        toast({ title: 'Error', description: 'Could not fetch bookmarked problems.', variant: 'destructive' });
        setBookmarkedProblemDetails([]);
      }
      setIsLoadingBookmarks(false);
    } else setBookmarkedProblemDetails([]);
  };

  const fetchStatusData = async () => {
    if (user?.uid) {
      setIsLoadingStatuses(true);
      const statusResult = await getAllUserProblemStatusesAction(user.uid);
      if (typeof statusResult === 'object' && statusResult !== null && !('error' in statusResult)) {
        setProblemStatuses(statusResult as Record<string, UserProblemStatusInfo>);
        const problemRefsWithStatus = Object.values(statusResult as Record<string, UserProblemStatusInfo>)
            .filter(info => info && info.status !== 'none' && info.companySlug && info.problemSlug);
        const detailedProblemsPromises = problemRefsWithStatus.map(async (info) => {
          try {
            const result = await getProblemByCompanySlugAndProblemSlug(info.companySlug, info.problemSlug);
            return result.problem ? { ...result.problem, currentStatus: info.status } as ProblemWithDetails : null;
          } catch (e) { return null; }
        });
        setProblemsWithStatusDetails((await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithDetails[]);
      } else {
        toast({ title: 'Error', description: 'Could not fetch problem statuses.', variant: 'destructive' });
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
      const result = await getUserStrategyTodoListsAction(user.uid);
      if (Array.isArray(result)) setStrategyTodoLists(result);
      else toast({ title: 'Error', description: 'Could not fetch saved strategy todo lists.', variant: 'destructive' });
      setIsLoadingStrategyTodoLists(false);
    } else setStrategyTodoLists([]);
  };

  useEffect(() => {
    if(user && !authLoading) {
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
    const result = await addUserEducationAction(user.uid, data);
    if (result.id) {
      toast({ title: "Education Added", description: "Your educational background has been updated." });
      fetchEducation(); // Re-fetch to get the latest list including the new ID
      educationForm.reset();
      setIsEducationDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Could not add education.", variant: "destructive" });
    }
  };

  const handleAddWorkExperience = async (data: WorkExperienceFormValues) => {
    if (!user) return;
    workForm.clearErrors(); // Clear previous errors
    const result = await addUserWorkExperienceAction(user.uid, data);
    if (result.id) {
      toast({ title: "Work Experience Added", description: "Your work history has been updated." });
      fetchWorkExperience(); // Re-fetch
      workForm.reset();
      setIsWorkDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Could not add work experience.", variant: "destructive" });
    }
  };
  
  const handleToggleTodoItem = async (companyId: string, itemIndex: number, newStatus: boolean) => {
    if (!user) return;
    const todoItemId = `${companyId}-${itemIndex}`;
    setUpdatingTodoItemId(todoItemId);
    const originalLists = [...strategyTodoLists]; // Keep a copy for optimistic update rollback
    
    // Optimistic UI update
    setStrategyTodoLists(prevLists =>
      prevLists.map(list =>
        list.companyId === companyId
          ? { ...list, items: list.items.map((item, index) => (index === itemIndex ? { ...item, isCompleted: newStatus } : item)) }
          : list
      )
    );

    const result = await updateStrategyTodoItemStatusAction(user.uid, companyId, itemIndex, newStatus);
    setUpdatingTodoItemId(null);

    if (!result.success) {
      toast({ title: "Update Failed", description: result.error || "Could not update item status.", variant: "destructive" });
      setStrategyTodoLists(originalLists); // Rollback UI on failure
    } else {
       fetchStrategyTodoLists(); // Re-fetch on success to ensure data consistency (e.g. savedAt timestamp)
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); 
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  };
  
  const handleProblemBookmarkChangeOnProfile = (problemId: string, newStatus: boolean) => {
    setBookmarkedProblemDetails(prev => 
      newStatus 
        ? prev.map(p => p.id === problemId ? { ...p, isBookmarked: true } : p)
        : prev.filter(p => p.id !== problemId) // If unbookmarked, remove from list
    );
    // Optionally, re-fetch problem statuses if bookmarking could affect any lists based on problem status
    fetchStatusData();
  };

  const handleProblemStatusChangeOnProfile = (problemId: string, newStatus: ProblemStatus) => {
     setProblemsWithStatusDetails(prev => {
        if (newStatus === 'none') return prev.filter(p => p.id !== problemId);
        return prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p);
     });
     // Re-fetch all status data to accurately update counts and lists
     fetchStatusData();
     // Bookmarks are independent, no need to re-fetch them here unless logic changes
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'AU'; // Anonymous User
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  };

  const onSubmitDisplayName = async (data: DisplayNameFormValues) => {
    if (!user) return;
    setIsSubmittingDisplayName(true);
    try {
      // Update Firebase Auth profile
      await updateFirebaseAuthProfile(user, { displayName: data.displayName });
      // Update Firestore profile
      const firestoreResult = await updateUserDisplayNameInFirestore(user.uid, data.displayName);

      if (firestoreResult.success) {
        // Manually update user object in AuthContext for immediate UI reflection
        // Create a new user object to trigger re-renders
        const updatedUser = { ...user, displayName: data.displayName } as typeof user;
        setUser(updatedUser); // Update context
        await syncUserProfileIfNeeded(updatedUser); // Re-sync with potentially new displayName from Auth

        toast({ title: 'Success', description: 'Display name updated successfully!' });
        setIsEditingDisplayName(false);
      } else {
        toast({ title: 'Error', description: firestoreResult.error || 'Failed to update display name in database.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update display name.', variant: 'destructive' });
    } finally {
      setIsSubmittingDisplayName(false);
    }
  };

  if (authLoading) return <Skeleton className="h-screen w-full" />;
  if (!user) { router.push('/login'); return null; }

  const stats = {
    solved: Object.values(problemStatuses).filter(p => p?.status === 'solved').length,
    attempted: Object.values(problemStatuses).filter(p => p?.status === 'attempted').length,
    todo: Object.values(problemStatuses).filter(p => p?.status === 'todo').length,
  };
  
  return (
    <section className="space-y-8 max-w-5xl mx-auto">
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

      <ProgressStats stats={stats} />
      
      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
          <TabsTrigger value="bookmarks"><Bookmark className="mr-2 h-4 w-4" />Bookmarks ({bookmarkedProblemDetails.length})</TabsTrigger>
          <TabsTrigger value="solved"><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Solved ({stats.solved})</TabsTrigger>
          <TabsTrigger value="attempted"><Pencil className="mr-2 h-4 w-4 text-yellow-500" />Attempted ({stats.attempted})</TabsTrigger>
          <TabsTrigger value="todo"><ListTodo className="mr-2 h-4 w-4 text-blue-500" />To-Do ({stats.todo})</TabsTrigger>
          <TabsTrigger value="strategyLists"><FolderKanban className="mr-2 h-4 w-4" />Strategy Lists ({strategyTodoLists.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookmarks">
          <Card><CardHeader><CardTitle>Your Bookmarked Problems</CardTitle></CardHeader>
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
        </TabsContent>

        <TabsContent value="solved">
          <Card><CardHeader><CardTitle>Solved Problems</CardTitle></CardHeader>
            <CardContent>
              <ProfileProblemList 
                title="Solved Problems"
                problems={problemsWithStatusDetails.filter(p => p.currentStatus === 'solved')}
                isLoading={isLoadingStatuses}
                listType="status"
                onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                onProblemStatusChange={handleProblemStatusChangeOnProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempted">
          <Card><CardHeader><CardTitle>Attempted Problems</CardTitle></CardHeader>
            <CardContent>
              <ProfileProblemList 
                title="Attempted Problems"
                problems={problemsWithStatusDetails.filter(p => p.currentStatus === 'attempted')}
                isLoading={isLoadingStatuses}
                listType="status"
                onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                onProblemStatusChange={handleProblemStatusChangeOnProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="todo">
          <Card><CardHeader><CardTitle>To-Do Problems</CardTitle></CardHeader>
            <CardContent>
              <ProfileProblemList 
                title="To-Do Problems"
                problems={problemsWithStatusDetails.filter(p => p.currentStatus === 'todo')}
                isLoading={isLoadingStatuses}
                listType="status"
                onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
                onProblemStatusChange={handleProblemStatusChangeOnProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategyLists">
            <StrategyListsSection
                strategyTodoLists={strategyTodoLists}
                isLoadingStrategyTodoLists={isLoadingStrategyTodoLists}
                updatingTodoItemId={updatingTodoItemId}
                handleToggleTodoItem={handleToggleTodoItem}
            />
        </TabsContent>
      </Tabs>
    </section>
  );
}
