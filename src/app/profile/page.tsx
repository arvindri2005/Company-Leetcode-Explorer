
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, CalendarDays, ShieldCheck, Bookmark, Loader2, CheckCircle2, Pencil, ListTodo, MoreVertical, Edit, Save, X, BarChart3, Brain, FolderKanban } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { LeetCodeProblem, ProblemStatus, BookmarkedProblemInfo, UserProblemStatusInfo, SavedStrategyTodoList, StrategyTodoItem } from '@/types';
import { PROBLEM_STATUS_DISPLAY } from '@/types';
import { getUsersBookmarkedProblemsInfoAction, getAllUserProblemStatusesAction, updateUserDisplayNameInFirestore, getUserStrategyTodoListsAction, updateStrategyTodoItemStatusAction } from '@/app/actions';
import { getProblemByCompanySlugAndProblemSlug } from '@/lib/data';
import ProblemCard from '@/components/problem/problem-card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ProblemWithStatus extends LeetCodeProblem {
  status?: ProblemStatus;
}

const displayNameFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, { message: 'Display name cannot exceed 50 characters.' }),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<ProblemWithStatus[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [problemStatuses, setProblemStatuses] = useState<Record<string, UserProblemStatusInfo>>({}); // Keep this for raw status data
  const [problemsWithStatusDetails, setProblemsWithStatusDetails] = useState<ProblemWithStatus[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  const [strategyTodoLists, setStrategyTodoLists] = useState<SavedStrategyTodoList[]>([]);
  const [isLoadingStrategyTodoLists, setIsLoadingStrategyTodoLists] = useState(false);
  const [updatingTodoItemId, setUpdatingTodoItemId] = useState<string | null>(null);


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


  // Fetch Bookmarks with full details
  useEffect(() => {
    const fetchBookmarkedData = async () => {
      if (user?.uid) {
        setIsLoadingBookmarks(true);
        const bookmarkInfosResult = await getUsersBookmarkedProblemsInfoAction(user.uid);

        if (Array.isArray(bookmarkInfosResult)) {
          const detailedProblemsPromises = bookmarkInfosResult.map(async (info) => {
            if (!info.companySlug || !info.problemSlug) {
              console.warn(`Skipping bookmark with missing slug data: problemId ${info.problemId}`);
              return null;
            }
            const result = await getProblemByCompanySlugAndProblemSlug(info.companySlug, info.problemSlug);
            if (result.problem) {
              return { ...result.problem, isBookmarked: true } as ProblemWithStatus; // Mark as bookmarked
            }
            console.warn(`Could not fetch full details for bookmarked problem: company ${info.companySlug}, problem ${info.problemSlug}`);
            return null;
          });
          const detailedProblems = (await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithStatus[];
          setBookmarkedProblemDetails(detailedProblems);
        } else {
          console.error("Error fetching bookmarked info:", bookmarkInfosResult.error);
          toast({ title: 'Error', description: 'Could not fetch bookmarked problems.', variant: 'destructive' });
          setBookmarkedProblemDetails([]);
        }
        setIsLoadingBookmarks(false);
      } else {
        setBookmarkedProblemDetails([]);
      }
    };
    if (user && !authLoading) fetchBookmarkedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, toast]);

  // Fetch Problem Statuses with full details
  useEffect(() => {
    const fetchStatusData = async () => {
      if (user?.uid) {
        setIsLoadingStatuses(true);
        const statusResult = await getAllUserProblemStatusesAction(user.uid);

        if (typeof statusResult === 'object' && statusResult !== null && !('error' in statusResult)) {
          setProblemStatuses(statusResult as Record<string, UserProblemStatusInfo>); // Keep raw statuses
          const problemRefsWithStatus = Object.values(statusResult as Record<string, UserProblemStatusInfo>)
            .filter(info => info && info.status !== 'none' && info.companySlug && info.problemSlug);

          const detailedProblemsPromises = problemRefsWithStatus.map(async (info) => {
            const result = await getProblemByCompanySlugAndProblemSlug(info.companySlug, info.problemSlug);
            if (result.problem) {
              return { ...result.problem, currentStatus: info.status } as ProblemWithStatus;
            }
            console.warn(`Could not fetch full details for problem with status: company ${info.companySlug}, problem ${info.problemSlug}`);
            return null;
          });
          const detailedProblems = (await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithStatus[];
          setProblemsWithStatusDetails(detailedProblems);

        } else {
          console.error("Error fetching problem statuses:", (statusResult as { error: string }).error);
          toast({ title: 'Error', description: 'Could not fetch problem statuses.', variant: 'destructive' });
          setProblemsWithStatusDetails([]);
        }
        setIsLoadingStatuses(false);
      } else {
        setProblemStatuses({});
        setProblemsWithStatusDetails([]);
      }
    };
    if (user && !authLoading) fetchStatusData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, toast]);

  // Fetch Strategy Todo Lists
  useEffect(() => {
    const fetchStrategyTodoLists = async () => {
      if (user?.uid) {
        setIsLoadingStrategyTodoLists(true);
        const result = await getUserStrategyTodoListsAction(user.uid);
        if (Array.isArray(result)) {
          setStrategyTodoLists(result);
        } else {
          console.error("Error fetching strategy todo lists:", result.error);
          toast({ title: 'Error', description: 'Could not fetch saved strategy todo lists.', variant: 'destructive' });
          setStrategyTodoLists([]);
        }
        setIsLoadingStrategyTodoLists(false);
      } else {
        setStrategyTodoLists([]);
      }
    };
    if (user && !authLoading) fetchStrategyTodoLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, toast]);

  const handleToggleTodoItem = async (companyId: string, itemIndex: number, newStatus: boolean) => {
    if (!user) return;
    const todoItemId = `${companyId}-${itemIndex}`;
    setUpdatingTodoItemId(todoItemId);

    const originalLists = [...strategyTodoLists];
    setStrategyTodoLists(prevLists =>
      prevLists.map(list =>
        list.companyId === companyId
          ? {
            ...list,
            items: list.items.map((item, index) =>
              index === itemIndex ? { ...item, isCompleted: newStatus } : item
            ),
          }
          : list
      )
    );

    const result = await updateStrategyTodoItemStatusAction(user.uid, companyId, itemIndex, newStatus);
    setUpdatingTodoItemId(null);

    if (result.success) {
      toast({ title: "To-Do Item Updated", description: `Item status changed for ${originalLists.find(l => l.companyId === companyId)?.companyName} strategy.` });
    } else {
      toast({ title: "Update Failed", description: result.error || "Could not update item status.", variant: "destructive" });
      setStrategyTodoLists(originalLists);
    }
  };


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
    if (!newStatus) {
      setBookmarkedProblemDetails(prev => prev.filter(p => p.id !== problemId));
    } else {
      setBookmarkedProblemDetails(prev => prev.map(p => p.id === problemId ? { ...p, isBookmarked: true } : p));
    }
    setProblemsWithStatusDetails(prev => prev.map(p => p.id === problemId ? { ...p, isBookmarked: newStatus } : p));
  };

  const handleProblemStatusChangeOnProfile = (problemId: string, newStatus: ProblemStatus) => {
    if (newStatus === 'none') {
      setProblemsWithStatusDetails(prev => prev.filter(p => p.id !== problemId));
    } else {
      const problemExists = problemsWithStatusDetails.some(p => p.id === problemId);
      if (problemExists) {
        setProblemsWithStatusDetails(prev =>
          prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p)
        );
      } else {
        // If problem not in list, it implies it was 'none' and now has a status.
        // Need to fetch its details and add it. This is complex here.
        // The current approach of refetching if the lists are empty in useEffect will handle this indirectly.
        // For immediate UI update, one might need to add it optimistically (with partial data) or trigger specific refetch.
        // For now, relying on statusResult fetch for completeness.
        const problemFromBookmarks = bookmarkedProblemDetails.find(p => p.id === problemId);
        if (problemFromBookmarks) {
          setProblemsWithStatusDetails(prev => [...prev, { ...problemFromBookmarks, currentStatus: newStatus }])
        }
      }
    }
    setBookmarkedProblemDetails(prev => prev.map(p => p.id === problemId ? { ...p, currentStatus: newStatus } : p));

    setProblemStatuses(prev => {
      const updated = { ...prev };
      if (newStatus === 'none') {
        delete updated[problemId];
      } else {
        const problemInfo = bookmarkedProblemDetails.find(p => p.id === problemId) || problemsWithStatusDetails.find(p => p.id === problemId);
        if (problemInfo) {
          updated[problemId] = {
            problemId: problemId,
            status: newStatus,
            companySlug: problemInfo.companySlug,
            problemSlug: problemInfo.slug,
            updatedAt: new Date()
          };
        }
      }
      return updated;
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names[0][0].toUpperCase() + (names.length > 1 ? names[names.length - 1][0].toUpperCase() : '');
  };

  const onSubmitDisplayName = async (data: DisplayNameFormValues) => {
    if (!user || !auth.currentUser) {
      toast({ title: 'Error', description: 'User not authenticated.', variant: 'destructive' });
      return;
    }
    setIsSubmittingDisplayName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
      const firestoreResult = await updateUserDisplayNameInFirestore(user.uid, data.displayName);
      if (firestoreResult.success) {
        toast({ title: 'Display Name Updated!', description: 'Your display name has been successfully updated.' });
        setIsEditingDisplayName(false);
        setUser(prev => prev ? { ...prev, displayName: data.displayName } as any : null);
      } else {
        toast({ title: 'Firestore Update Failed', description: firestoreResult.error || 'Could not update display name in our records.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Error updating display name:", error);
      toast({ title: 'Update Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmittingDisplayName(false);
    }
  };

  if (authLoading) {
    return (
      <section className="space-y-8 max-w-4xl mx-auto">
        <Card className="shadow-lg"><CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></CardHeader>
          <CardContent className="space-y-6"><div className="flex items-center space-x-4"><Skeleton className="h-20 w-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-52" /></div></div>
            <Skeleton className="h-10 w-28 mt-4" />
          </CardContent></Card><Separator />
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-8 w-1/4 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-60 rounded-lg" />)}</div>
      </section>
    );
  }
  if (!user) {
    router.push('/login'); // Redirect if not logged in and not loading
    return <div className="text-center py-10"><p>Redirecting to login...</p><Button onClick={() => router.push('/login')} className="mt-4">Go to Login</Button></div>;
  }

  // Recalculate stats based on the problemStatuses map
  const stats = {
    solved: Object.values(problemStatuses).filter(p => p?.status === 'solved').length,
    attempted: Object.values(problemStatuses).filter(p => p?.status === 'attempted').length,
    todo: Object.values(problemStatuses).filter(p => p?.status === 'todo').length,
  };

  const renderProblemList = (list: ProblemWithStatus[], listTitle: string, isLoading: boolean, type: 'bookmarks' | 'status') => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading {listTitle.toLowerCase()}...</p></div>;
    }
    if (list.length === 0) {
      return <p className="text-muted-foreground text-center py-6">No problems {type === 'bookmarks' ? 'bookmarked' : `with status "${listTitle.toLowerCase()}"`} yet.</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map(problem => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            companySlug={problem.companySlug}
            initialIsBookmarked={bookmarkedProblemDetails.some(bp => bp.id === problem.id)}
            onBookmarkChanged={handleProblemBookmarkChangeOnProfile}
            problemStatus={problemStatuses[problem.id]?.status || 'none'}
            onProblemStatusChange={handleProblemStatusChangeOnProfile}
          />
        ))}
      </div>
    );
  };

  const renderStrategyTodoLists = () => {
    if (isLoadingStrategyTodoLists) {
      return <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3">Loading strategy lists...</p></div>;
    }
    if (strategyTodoLists.length === 0) {
      return <p className="text-muted-foreground text-center py-6">No saved strategy To-Do lists found. Generate some from company pages!</p>;
    }
    return (
      <Accordion type="multiple" className="w-full space-y-3">
        {strategyTodoLists.map((list) => (
          <AccordionItem value={list.companyId} key={list.companyId} className="border bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <AccordionTrigger className="p-4 hover:no-underline">
              <div className="flex flex-col text-left">
                <span className="text-lg font-semibold text-primary">{list.companyName}</span>
                <span className="text-xs text-muted-foreground">
                  Saved on: {new Date(list.savedAt).toLocaleDateString()} - {list.items.length} item(s)
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <ul className="space-y-3 bg-muted/30 p-4 rounded-md mt-2">
                {list.items.map((item, index) => {
                  const itemId = `${list.companyId}-item-${index}`;
                  const isItemUpdating = updatingTodoItemId === itemId;
                  return (
                    <li key={itemId} className={cn(
                      "flex items-start gap-3 p-2 rounded-md transition-colors",
                      item.isCompleted ? "bg-green-500/10" : "hover:bg-primary/5"
                    )}>
                      <Checkbox
                        id={itemId}
                        checked={item.isCompleted}
                        onCheckedChange={(checked) => handleToggleTodoItem(list.companyId, index, !!checked)}
                        disabled={isItemUpdating}
                        className="mt-1 flex-shrink-0"
                        aria-label={`Mark as ${item.isCompleted ? 'not ' : ''}completed`}
                      />
                      <label
                        htmlFor={itemId}
                        className={cn(
                          "flex-grow prose prose-sm dark:prose-invert max-w-full cursor-pointer",
                          item.isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                          {item.text}
                        </ReactMarkdown>
                      </label>
                      {isItemUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0 ml-auto" />}
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };


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
              {renderProblemList(bookmarkedProblemDetails, "Bookmarked", isLoadingBookmarks, "bookmarks")}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="solved">
          <Card><CardHeader><CardTitle>Solved Problems</CardTitle></CardHeader>
            <CardContent>
              {renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'solved'), "Solved", isLoadingStatuses, "status")}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="attempted">
          <Card><CardHeader><CardTitle>Attempted Problems</CardTitle></CardHeader>
            <CardContent>
              {renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'attempted'), "Attempted", isLoadingStatuses, "status")}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="todo">
          <Card><CardHeader><CardTitle>To-Do Problems</CardTitle></CardHeader>
            <CardContent>
              {renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'todo'), "To-Do", isLoadingStatuses, "status")}
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="strategyLists">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                Saved Strategy To-Do Lists
              </CardTitle>
              <CardDescription>
                Actionable AI-generated To-Do lists for company-specific interview preparation. Check off items as you complete them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStrategyTodoLists()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

