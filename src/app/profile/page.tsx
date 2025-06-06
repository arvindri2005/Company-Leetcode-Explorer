
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, CalendarDays, ShieldCheck, Bookmark, Loader2, CheckCircle2, Pencil, ListTodo, MoreVertical, Edit, Save, X, BarChart3, Brain, FolderKanban, GraduationCap, Briefcase, PlusCircle, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { LeetCodeProblem, ProblemStatus, BookmarkedProblemInfo, UserProblemStatusInfo, SavedStrategyTodoList, StrategyTodoItem, EducationExperience, WorkExperience } from '@/types';
import { PROBLEM_STATUS_DISPLAY, EducationExperienceSchema, WorkExperienceSchema } from '@/types';
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
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, {message: 'Display name cannot exceed 50 characters.'}),
});
type DisplayNameFormValues = z.infer<typeof displayNameFormSchema>;

// Zod schemas for the forms
const educationFormSchema = EducationExperienceSchema.omit({ id: true });
type EducationFormValues = z.infer<typeof educationFormSchema>;

const workExperienceFormSchema = WorkExperienceSchema.omit({ id: true });
type WorkExperienceFormValues = z.infer<typeof workExperienceFormSchema>;


export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [bookmarkedProblemDetails, setBookmarkedProblemDetails] = useState<ProblemWithStatus[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);

  const [problemStatuses, setProblemStatuses] = useState<Record<string, UserProblemStatusInfo>>({});
  const [problemsWithStatusDetails, setProblemsWithStatusDetails] = useState<ProblemWithStatus[]>([]);
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
    resolver: zodResolver(educationFormSchema),
    defaultValues: { degree: '', major: '', school: '', graduationYear: '', gpa: '' },
  });
  const workForm = useForm<WorkExperienceFormValues>({
    resolver: zodResolver(workExperienceFormSchema),
    defaultValues: { jobTitle: '', companyName: '', startDate: '', endDate: '', responsibilities: '' },
  });

  useEffect(() => {
    if (user?.displayName) displayNameForm.reset({ displayName: user.displayName });
  }, [user?.displayName, displayNameForm]);

  // Fetch Education History
  useEffect(() => {
    const fetchEducation = async () => {
      if (user?.uid) {
        setIsLoadingEducation(true);
        const result = await getUserEducationAction(user.uid);
        if (Array.isArray(result)) setEducationHistory(result);
        else toast({ title: 'Error', description: 'Could not fetch education history.', variant: 'destructive' });
        setIsLoadingEducation(false);
      } else setEducationHistory([]);
    };
    if(user && !authLoading) fetchEducation();
  }, [user, authLoading, toast]);

  // Fetch Work Experience
  useEffect(() => {
    const fetchWorkExperience = async () => {
      if (user?.uid) {
        setIsLoadingWorkExperience(true);
        const result = await getUserWorkExperienceAction(user.uid);
        if (Array.isArray(result)) setWorkExperience(result);
        else toast({ title: 'Error', description: 'Could not fetch work experience.', variant: 'destructive' });
        setIsLoadingWorkExperience(false);
      } else setWorkExperience([]);
    };
    if(user && !authLoading) fetchWorkExperience();
  }, [user, authLoading, toast]);

  // Existing useEffects for bookmarks, statuses, strategies...
  useEffect(() => {
    const fetchBookmarkedData = async () => {
      if (user?.uid) {
        setIsLoadingBookmarks(true);
        const bookmarkInfosResult = await getUsersBookmarkedProblemsInfoAction(user.uid);
        if (Array.isArray(bookmarkInfosResult)) {
          const detailedProblemsPromises = bookmarkInfosResult.map(async (info) => {
            if (!info.companySlug || !info.problemSlug) return null;
            try {
              const result = await getProblemByCompanySlugAndProblemSlug(info.companySlug, info.problemSlug);
              return result.problem ? { ...result.problem, isBookmarked: true } as ProblemWithStatus : null;
            } catch (e) { return null; }
          });
          setBookmarkedProblemDetails((await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithStatus[]);
        } else {
          toast({ title: 'Error', description: 'Could not fetch bookmarked problems.', variant: 'destructive' });
          setBookmarkedProblemDetails([]);
        }
        setIsLoadingBookmarks(false);
      } else setBookmarkedProblemDetails([]);
    };
    if(user && !authLoading) fetchBookmarkedData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
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
              return result.problem ? { ...result.problem, currentStatus: info.status } as ProblemWithStatus : null;
            } catch (e) { return null; }
          });
          setProblemsWithStatusDetails((await Promise.all(detailedProblemsPromises)).filter(Boolean) as ProblemWithStatus[]);
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
    if(user && !authLoading) fetchStatusData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  useEffect(() => {
    const fetchStrategyTodoLists = async () => {
      if (user?.uid) {
        setIsLoadingStrategyTodoLists(true);
        const result = await getUserStrategyTodoListsAction(user.uid);
        if (Array.isArray(result)) setStrategyTodoLists(result);
        else toast({ title: 'Error', description: 'Could not fetch saved strategy todo lists.', variant: 'destructive' });
        setIsLoadingStrategyTodoLists(false);
      } else setStrategyTodoLists([]);
    };
    if(user && !authLoading) fetchStrategyTodoLists();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);


  const handleAddEducation = async (data: EducationFormValues) => {
    if (!user) return;
    const result = await addUserEducationAction(user.uid, data);
    if (result.id) {
      toast({ title: "Education Added", description: "Your educational background has been updated." });
      setEducationHistory(prev => [{ ...data, id: result.id! }, ...prev]);
      educationForm.reset();
      setIsEducationDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Could not add education.", variant: "destructive" });
    }
  };

  const handleAddWorkExperience = async (data: WorkExperienceFormValues) => {
    if (!user) return;
    const result = await addUserWorkExperienceAction(user.uid, data);
    if (result.id) {
      toast({ title: "Work Experience Added", description: "Your work history has been updated." });
      setWorkExperience(prev => [{ ...data, id: result.id! }, ...prev]);
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
    const originalLists = [...strategyTodoLists];
    setStrategyTodoLists(prevLists =>
      prevLists.map(list => list.companyId === companyId ? { ...list, items: list.items.map((item, index) => index === itemIndex ? { ...item, isCompleted: newStatus } : item) } : list )
    );
    const result = await updateStrategyTodoItemStatusAction(user.uid, companyId, itemIndex, newStatus);
    setUpdatingTodoItemId(null);
    if (!result.success) {
      toast({ title: "Update Failed", description: result.error || "Could not update item status.", variant: "destructive" });
      setStrategyTodoLists(originalLists);
    }
  };

  const handleLogout = async () => { /* ... */ };
  const handleProblemBookmarkChangeOnProfile = (problemId: string, newStatus: boolean) => { /* ... */ };
  const handleProblemStatusChangeOnProfile = (problemId: string, newStatus: ProblemStatus) => { /* ... */ };
  const getInitials = (name: string | null | undefined) => { /* ... */ };
  const onSubmitDisplayName = async (data: DisplayNameFormValues) => { /* ... */ };

  if (authLoading) return <Skeleton className="h-screen w-full" />;
  if (!user) { router.push('/login'); return null; }

  const stats = {
    solved: Object.values(problemStatuses).filter(p => p?.status === 'solved').length,
    attempted: Object.values(problemStatuses).filter(p => p?.status === 'attempted').length,
    todo: Object.values(problemStatuses).filter(p => p?.status === 'todo').length,
  };

  const renderProblemList = (list: ProblemWithStatus[], listTitle: string, isLoading: boolean, type: 'bookmarks' | 'status') => { /* ... */ };
  const renderStrategyTodoLists = () => { /* ... */ };
  
  return (
    <section className="space-y-8 max-w-5xl mx-auto">
      {/* User Info Card - No changes needed here for initial display */}
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 border-b"><CardTitle className="text-3xl font-bold tracking-tight">Your Profile</CardTitle><CardDescription className="text-lg">Account details, progress, and professional background.</CardDescription></CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20"><AvatarImage src={user.photoURL || undefined} data-ai-hint="profile avatar" /><AvatarFallback className="text-2xl bg-primary text-primary-foreground">{getInitials(user.displayName)}</AvatarFallback></Avatar>
            <div className="flex-grow">
              {/* Display Name Form */}
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
                    <FormField control={displayNameForm.control} name="displayName" render={({ field }) => (
                      <FormItem><FormControl><Input {...field} placeholder="Enter display name" className="text-lg" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={isSubmittingDisplayName}>{isSubmittingDisplayName ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingDisplayName(false)} disabled={isSubmittingDisplayName}><X size={16} /> Cancel</Button>
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

      {/* Education History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center"><GraduationCap className="mr-3 text-primary" />Educational Background</CardTitle>
            <CardDescription>Your academic qualifications.</CardDescription>
          </div>
          <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Educational Experience</DialogTitle></DialogHeader>
              <Form {...educationForm}>
                <form onSubmit={educationForm.handleSubmit(handleAddEducation)} className="space-y-4">
                  <FormField control={educationForm.control} name="school" render={({ field }) => (<FormItem><FormLabel>School/University</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="degree" render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="major" render={({ field }) => (<FormItem><FormLabel>Major/Field of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="graduationYear" render={({ field }) => (<FormItem><FormLabel>Graduation Year (YYYY, Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="gpa" render={({ field }) => (<FormItem><FormLabel>GPA (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter><Button type="submit" disabled={educationForm.formState.isSubmitting}>{educationForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Save Education"}</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingEducation ? <Skeleton className="h-20 w-full" /> : educationHistory.length > 0 ? (
            <ul className="space-y-3">
              {educationHistory.map(edu => (
                <li key={edu.id} className="p-3 border rounded-md bg-muted/50">
                  <h4 className="font-semibold">{edu.degree} in {edu.major}</h4>
                  <p className="text-sm text-muted-foreground">{edu.school}{edu.graduationYear && `, Graduated ${edu.graduationYear}`}{edu.gpa && `, GPA: ${edu.gpa}`}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-center py-4">No educational background added yet.</p>}
        </CardContent>
      </Card>

      {/* Work Experience Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
           <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center"><Briefcase className="mr-3 text-primary" />Work Experience</CardTitle>
            <CardDescription>Your professional roles and responsibilities.</CardDescription>
          </div>
          <Dialog open={isWorkDialogOpen} onOpenChange={setIsWorkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Work Experience</DialogTitle></DialogHeader>
              <Form {...workForm}>
                <form onSubmit={workForm.handleSubmit(handleAddWorkExperience)} className="space-y-4">
                  <FormField control={workForm.control} name="jobTitle" render={({ field }) => (<FormItem><FormLabel>Job Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={workForm.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={workForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Start Date (MM/YYYY)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={workForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>End Date (MM/YYYY or Present, Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={workForm.control} name="responsibilities" render={({ field }) => (<FormItem><FormLabel>Key Responsibilities (Optional)</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter><Button type="submit" disabled={workForm.formState.isSubmitting}>{workForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Save Experience"}</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingWorkExperience ? <Skeleton className="h-20 w-full" /> : workExperience.length > 0 ? (
            <ul className="space-y-3">
              {workExperience.map(work => (
                <li key={work.id} className="p-3 border rounded-md bg-muted/50">
                  <h4 className="font-semibold">{work.jobTitle} at {work.companyName}</h4>
                  <p className="text-sm text-muted-foreground">{work.startDate} - {work.endDate || 'Present'}</p>
                  {work.responsibilities && <p className="text-sm mt-1 whitespace-pre-line">{work.responsibilities}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="text-muted-foreground text-center py-4">No work experience added yet.</p>}
        </CardContent>
      </Card>

      {/* Progress Stats Card - No changes needed */}
      <Card className="shadow-lg">
        <CardHeader><CardTitle className="text-2xl flex items-center"><BarChart3 className="mr-3 text-primary" />Your Progress</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/30 rounded-lg"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" /><p className="text-3xl font-bold">{stats.solved}</p><p className="text-sm text-muted-foreground">Solved</p></div>
          <div className="p-4 bg-muted/30 rounded-lg"><Pencil className="h-8 w-8 mx-auto mb-2 text-yellow-500" /><p className="text-3xl font-bold">{stats.attempted}</p><p className="text-sm text-muted-foreground">Attempted</p></div>
          <div className="p-4 bg-muted/30 rounded-lg"><ListTodo className="h-8 w-8 mx-auto mb-2 text-blue-500" /><p className="text-3xl font-bold">{stats.todo}</p><p className="text-sm text-muted-foreground">To-Do</p></div>
        </CardContent>
      </Card>
      
      {/* Tabs for Bookmarks, Statuses, Strategies - No changes needed here */}
      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
          <TabsTrigger value="bookmarks"><Bookmark className="mr-2 h-4 w-4" />Bookmarks ({bookmarkedProblemDetails.length})</TabsTrigger>
          <TabsTrigger value="solved"><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />Solved ({stats.solved})</TabsTrigger>
          <TabsTrigger value="attempted"><Pencil className="mr-2 h-4 w-4 text-yellow-500" />Attempted ({stats.attempted})</TabsTrigger>
          <TabsTrigger value="todo"><ListTodo className="mr-2 h-4 w-4 text-blue-500" />To-Do ({stats.todo})</TabsTrigger>
          <TabsTrigger value="strategyLists"><FolderKanban className="mr-2 h-4 w-4" />Strategy Lists ({strategyTodoLists.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="bookmarks">
          <Card><CardHeader><CardTitle>Your Bookmarked Problems</CardTitle></CardHeader><CardContent>{renderProblemList(bookmarkedProblemDetails, "Bookmarked", isLoadingBookmarks, "bookmarks")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="solved">
          <Card><CardHeader><CardTitle>Solved Problems</CardTitle></CardHeader><CardContent>{renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'solved'), "Solved", isLoadingStatuses, "status")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="attempted">
          <Card><CardHeader><CardTitle>Attempted Problems</CardTitle></CardHeader><CardContent>{renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'attempted'), "Attempted", isLoadingStatuses, "status")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="todo">
          <Card><CardHeader><CardTitle>To-Do Problems</CardTitle></CardHeader><CardContent>{renderProblemList(problemsWithStatusDetails.filter(p => p.currentStatus === 'todo'), "To-Do", isLoadingStatuses, "status")}</CardContent></Card>
        </TabsContent>
        <TabsContent value="strategyLists">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Brain className="mr-2 h-5 w-5 text-primary" />Saved Strategy To-Do Lists</CardTitle>
                    <CardDescription>Actionable AI-generated To-Do lists for company-specific interview preparation.</CardDescription>
                </CardHeader>
                <CardContent>{renderStrategyTodoLists()}</CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
