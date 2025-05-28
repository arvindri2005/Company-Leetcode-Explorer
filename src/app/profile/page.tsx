
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, CalendarDays, ShieldCheck, Bookmark, Loader2, CheckCircle2, Pencil, ListTodo, BarChart3, Edit, Save, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { LeetCodeProblem, ProblemStatus } from '@/types';
import { PROBLEM_STATUS_DISPLAY } from '@/types';
import { getUsersBookmarkedProblemIdsAction, getProblemDetailsBatchAction, getAllUserProblemStatusesAction, updateUserDisplayNameInFirestore } from '@/app/actions';
import ProblemCard from '@/components/problem/problem-card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProblemWithStatus extends LeetCodeProblem {
  status?: ProblemStatus;
}

const displayNameFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, {message: 'Display name cannot exceed 50 characters.'}),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarkedProblemIds, setBookmarkedProblemIds] = useState<Set<string>>(new Set());
  const [bookmarkedProblems, setBookmarkedProblems] = useState<ProblemWithStatus[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [problemStatuses, setProblemStatuses] = useState<Record<string, ProblemStatus>>({});
  const [problemsWithStatus, setProblemsWithStatus] = useState<ProblemWithStatus[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isSubmittingDisplayName, setIsSubmittingDisplayName] = useState(false);
  
  const displayNameForm = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameFormSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  useEffect(() => {
    if (user?.displayName) {
      displayNameForm.reset({ displayName: user.displayName });
    }
  }, [user?.displayName, displayNameForm]);


  // Fetch Bookmarks
  useEffect(() => {
    const fetchBookmarkedData = async () => {
      if (user?.uid) {
        setIsLoadingBookmarks(true);
        const result = await getUsersBookmarkedProblemIdsAction(user.uid);
        let ids: string[] = [];
        if (Array.isArray(result)) {
          ids = result;
          setBookmarkedProblemIds(new Set(ids));
        } else {
          console.error("Error fetching bookmarked IDs:", result.error);
          toast({ title: 'Error', description: 'Could not fetch bookmarked problems.', variant: 'destructive' });
        }
        if (ids.length > 0) {
          const problems = await getProblemDetailsBatchAction(ids);
          setBookmarkedProblems(problems);
        } else {
          setBookmarkedProblems([]);
        }
        setIsLoadingBookmarks(false);
      } else {
         setBookmarkedProblemIds(new Set());
         setBookmarkedProblems([]);
      }
    };
    if (user) fetchBookmarkedData();
  }, [user, toast]);

  // Fetch Problem Statuses
  useEffect(() => {
    const fetchStatusData = async () => {
      if (user?.uid) {
        setIsLoadingStatuses(true);
        const statusResult = await getAllUserProblemStatusesAction(user.uid);
        let currentStatuses: Record<string, ProblemStatus> = {};
        if (typeof statusResult === 'object' && statusResult !== null && !('error' in statusResult)) {
          currentStatuses = statusResult;
          setProblemStatuses(currentStatuses);
        } else {
          console.error("Error fetching problem statuses:", (statusResult as {error:string}).error);
          toast({ title: 'Error', description: 'Could not fetch problem statuses.', variant: 'destructive' });
        }
        
        const problemIdsWithStatus = Object.keys(currentStatuses).filter(id => currentStatuses[id] !== 'none');
        if (problemIdsWithStatus.length > 0) {
            const problems = await getProblemDetailsBatchAction(problemIdsWithStatus);
            setProblemsWithStatus(problems.map(p => ({...p, status: currentStatuses[p.id]})));
        } else {
            setProblemsWithStatus([]);
        }
        setIsLoadingStatuses(false);
      } else {
        setProblemStatuses({});
        setProblemsWithStatus([]);
      }
    };
     if (user) fetchStatusData();
  }, [user, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
    } catch (error) {
      toast({ title: 'Logout Failed', description: 'Could not log you out.', variant: 'destructive' });
    }
  };
  
  const handleProblemBookmarkChangeOnProfile = (problemId: string, newStatus: boolean) => {
    setBookmarkedProblemIds(prev => { const newSet = new Set(prev); if(newStatus) newSet.add(problemId); else newSet.delete(problemId); return newSet; });
    if (!newStatus) setBookmarkedProblems(prev => prev.filter(p => p.id !== problemId));
  };

  const handleProblemStatusChangeOnProfile = (problemId: string, newStatus: ProblemStatus) => {
    setProblemStatuses(prev => ({ ...prev, [problemId]: newStatus === 'none' ? undefined : newStatus }));
    setProblemsWithStatus(prev => {
        if (newStatus === 'none') return prev.filter(p => p.id !== problemId);
        const existingProblem = prev.find(p => p.id === problemId);
        if (existingProblem) {
            return prev.map(p => p.id === problemId ? { ...p, status: newStatus } : p);
        } else {
             // If problem not in current list (e.g. just changed from none), fetch its details to add it.
             // This requires async operation, might be better to just filter and let a full re-fetch add it if needed.
             // For now, keeping it simple: it will show up correctly on next full status fetch or page load.
        }
        return prev;
    });
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : '');
  };

  const onSubmitDisplayName = async (data: DisplayNameFormValues) => {
    if (!user || !auth.currentUser) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive'});
      return;
    }
    setIsSubmittingDisplayName(true);
    try {
      // 1. Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: data.displayName });

      // 2. Update Firestore profile
      const firestoreResult = await updateUserDisplayNameInFirestore(user.uid, data.displayName);
      if (firestoreResult.success) {
        toast({ title: 'Display Name Updated!', description: 'Your display name has been successfully updated.' });
        setIsEditingDisplayName(false);
        // AuthContext will update user.displayName reactively via onAuthStateChanged
      } else {
        toast({ title: 'Firestore Update Failed', description: firestoreResult.error || 'Could not update display name in our records.', variant: 'destructive'});
        // Optionally revert Firebase Auth profile update here if desired, though usually not critical.
      }
    } catch (error: any) {
      console.error("Error updating display name:", error);
      let errorMessage = 'An unknown error occurred.';
      if (error.code) { // Firebase Auth errors
        errorMessage = error.message;
      }
      toast({ title: 'Update Failed', description: errorMessage, variant: 'destructive'});
    } finally {
      setIsSubmittingDisplayName(false);
    }
  };

  if (authLoading) {
    return ( /* Skeleton Loading UI */
      <section className="space-y-8 max-w-4xl mx-auto">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader>
          <CardContent className="space-y-6"><div className="flex items-center space-x-4"><Skeleton className="h-20 w-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-52" /></div></div>
            <Skeleton className="h-10 w-28 mt-4" />
          </CardContent></Card><Separator />
        <Skeleton className="h-10 w-1/3 mb-4" /> {/* Tabs skeleton */}
        <Skeleton className="h-8 w-1/4 mb-2" /> {/* Section title skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <Skeleton key={i} className="h-60 rounded-lg" />)}</div>
      </section>
    );
  }
  if (!user) { /* Redirect or show login prompt */
    return <div className="text-center py-10"><p>Please log in to view your profile.</p><Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button></div>;
  }

  const stats = {
    solved: problemsWithStatus.filter(p => p.status === 'solved').length,
    attempted: problemsWithStatus.filter(p => p.status === 'attempted').length,
    todo: problemsWithStatus.filter(p => p.status === 'todo').length,
  };

  const renderProblemList = (list: ProblemWithStatus[], listTitle: string) => (
    list.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map(problem => (
          <ProblemCard 
            key={problem.id} 
            problem={problem}
            initialIsBookmarked={bookmarkedProblemIds.has(problem.id)}
            onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
            problemStatus={problemStatuses[problem.id] || 'none'}
            onProblemStatusChange={handleProblemStatusChangeOnProfile}
          />
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground text-center py-6">No problems {listTitle.toLowerCase()} yet.</p>
    )
  );

  return (
    <section className="space-y-8 max-w-5xl mx-auto">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 border-b"><CardTitle className="text-3xl font-bold tracking-tight">Your Profile</CardTitle><CardDescription className="text-lg">Account details, progress, and bookmarks.</CardDescription></CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20"><AvatarImage src={user.photoURL || undefined} data-ai-hint="profile avatar" /><AvatarFallback className="text-2xl bg-primary text-primary-foreground">{getInitials(user.displayName)}</AvatarFallback></Avatar>
            <div className="flex-grow">
              {!isEditingDisplayName ? (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{user.displayName || 'Anonymous User'}</h2>
                  <Button variant="ghost" size="icon" onClick={() => { setIsEditingDisplayName(true); displayNameForm.setValue("displayName", user.displayName || ""); }} className="h-7 w-7 text-muted-foreground hover:text-foreground transition-opacity">
                    <Edit size={16} />
                  </Button>
                </div>
              ) : (
                <Form {...displayNameForm}>
                  <form onSubmit={displayNameForm.handleSubmit(onSubmitDisplayName)} className="space-y-2">
                    <FormField
                      control={displayNameForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                           {/* <FormLabel className="sr-only">Display Name</FormLabel> */}
                          <FormControl>
                            <Input {...field} placeholder="Enter your display name" className="text-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isSubmittingDisplayName}>
                        {isSubmittingDisplayName ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDisplayName(false)} disabled={isSubmittingDisplayName}>
                        <X size={16} /> Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
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
          <Button onClick={handleLogout} variant="outline" className="mt-6">Log Out</Button>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-3 text-primary" />Your Progress</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/30 rounded-lg">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{stats.solved}</p><p className="text-sm text-muted-foreground">Solved</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <Pencil className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-3xl font-bold">{stats.attempted}</p><p className="text-sm text-muted-foreground">Attempted</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <ListTodo className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold">{stats.todo}</p><p className="text-sm text-muted-foreground">To-Do</p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <TabsTrigger value="bookmarks"><Bookmark className="mr-2 h-4 w-4" />Bookmarks ({bookmarkedProblems.length})</TabsTrigger>
          <TabsTrigger value="solved"><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Solved ({stats.solved})</TabsTrigger>
          <TabsTrigger value="attempted"><Pencil className="mr-2 h-4 w-4 text-yellow-500" />Attempted ({stats.attempted})</TabsTrigger>
          <TabsTrigger value="todo"><ListTodo className="mr-2 h-4 w-4 text-blue-500" />To-Do ({stats.todo})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks">
          <Card><CardHeader><CardTitle>Your Bookmarked Problems</CardTitle></CardHeader>
            <CardContent>
              {isLoadingBookmarks ? <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading bookmarks...</p></div> : renderProblemList(bookmarkedProblems, "bookmarked")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="solved">
            <Card><CardHeader><CardTitle>Solved Problems</CardTitle></CardHeader>
            <CardContent>
                {isLoadingStatuses ? <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading solved problems...</p></div> : renderProblemList(problemsWithStatus.filter(p => p.status === 'solved'), "solved")}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="attempted">
            <Card><CardHeader><CardTitle>Attempted Problems</CardTitle></CardHeader>
            <CardContent>
                {isLoadingStatuses ? <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading attempted problems...</p></div> : renderProblemList(problemsWithStatus.filter(p => p.status === 'attempted'), "attempted")}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="todo">
            <Card><CardHeader><CardTitle>To-Do Problems</CardTitle></CardHeader>
            <CardContent>
                {isLoadingStatuses ? <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading to-do problems...</p></div> : renderProblemList(problemsWithStatus.filter(p => p.status === 'todo'), "to-do")}
            </CardContent></Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

    
