"use client";

import React, { memo } from "react";
import { FormProvider,useFormContext } from "react-hook-form";

import { Briefcase, Loader2,PlusCircle } from "lucide-react";
import { type z } from "zod";

import { ExperienceListSkeleton } from "@/shared/components/skeletons/experience-skeleton";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import type { WorkExperience } from "@/shared/types";
import { type WorkExperienceSchema as workExperienceFormSchema } from "@/shared/types"; // Renamed for clarity

type WorkExperienceFormValues = z.infer<typeof workExperienceFormSchema>;

/**
 * @interface WorkExperienceSectionProps
 * @description Props for the WorkExperienceSection component.
 * @property {string} userId - The user's ID.
 * @property {WorkExperience[]} workExperience - An array of the user's work experiences.
 * @property {boolean} isLoadingWorkExperience - Flag indicating if work experience data is loading.
 * @property {(data: WorkExperienceFormValues) => Promise<void>} handleAddWorkExperience - Async function to handle adding a new work experience entry.
 * @property {boolean} isWorkDialogOpen - Flag indicating if the 'add work experience' dialog is open.
 * @property {(isOpen: boolean) => void} setIsWorkDialogOpen - Function to set the state of the 'add work experience' dialog.
 */
interface WorkExperienceSectionProps {
  userId: string; // Needed for keying if delete/edit were added
  workExperience: WorkExperience[];
  isLoadingWorkExperience: boolean;
  handleAddWorkExperience: (data: WorkExperienceFormValues) => Promise<void>;
  // workForm: UseFormReturn<WorkExperienceFormValues>; // To be provided by FormProvider
  isWorkDialogOpen: boolean;
  setIsWorkDialogOpen: (isOpen: boolean) => void;
}

/**
 * @component WorkExperienceItem
 * @description A memoized component to render a single work experience item.
 * This prevents unnecessary re-renders of the list items when parent state changes.
 */
const WorkExperienceItem = memo(({ work }: { work: WorkExperience }) => (
  <li className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
    <h4 className="font-semibold">
      {work.role} at {work.company}
    </h4>
    <p className="text-sm text-muted-foreground">
      {work.startDate} - {work.endDate || "Present"}
    </p>
    {work.description && (
      <p className="text-sm mt-1 whitespace-pre-line">
        {work.description}
      </p>
    )}
  </li>
));
WorkExperienceItem.displayName = "WorkExperienceItem";

/**
 * @function WorkExperienceSection
 * @description A component that displays a user's professional work experience and provides a dialog to add new entries.
 * @param {WorkExperienceSectionProps} props - The props for the component.
 * @returns {JSX.Element} The rendered section displaying work history, a loading state, or an empty state message.
 */
const WorkExperienceSection: React.FC<WorkExperienceSectionProps> = ({
  workExperience,
  isLoadingWorkExperience,
  handleAddWorkExperience,
  isWorkDialogOpen,
  setIsWorkDialogOpen,
}) => {
  const workForm = useFormContext<WorkExperienceFormValues>();

  return (
    <>
      <div className="flex flex-row items-center justify-between bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold flex items-center">
            <Briefcase className="mr-3 text-primary" aria-hidden="true" />
            Work Experience
          </h3>
          <p className="text-muted-foreground">
            Your professional roles and responsibilities.
          </p>
        </div>
        <Dialog
          open={isWorkDialogOpen}
          onOpenChange={setIsWorkDialogOpen}
          modal={false}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Add Work Experience
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
              <DialogDescription>
                Enter your job details including company, dates, and responsibilities.
              </DialogDescription>
            </DialogHeader>
            <FormProvider {...workForm}>
              <Form {...workForm}>
                <form
                  onSubmit={workForm.handleSubmit(handleAddWorkExperience)}
                  className="space-y-4"
                >
                  <FormField
                    control={workForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Job Title <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            maxLength={100}
                            {...field}
                            placeholder="e.g. Senior Software Engineer"
                            autoFocus
                            autoComplete="organization-title"
                            autoCapitalize="words"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={workForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Company Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            maxLength={100}
                            {...field}
                            placeholder="e.g. Tech Corp"
                            autoComplete="organization"
                            autoCapitalize="words"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={workForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Start Date (MM/YYYY){" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MM/YYYY"
                              autoComplete="off"
                              maxLength={7}
                              enterKeyHint="next"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={workForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            End Date (MM/YYYY or Present, Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="MM/YYYY or Present"
                              autoComplete="off"
                              maxLength={7}
                              enterKeyHint="next"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={workForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Key Responsibilities (Optional)</FormLabel>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "text-xs text-muted-foreground font-normal",
                              (field.value?.length || 0) >= 1000 &&
                                "text-destructive font-medium",
                            )}
                          >
                            {field.value?.length || 0}/1000
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            maxLength={1000}
                            {...field}
                            rows={3}
                            placeholder="e.g. Led a team of 5 developers to ship a new feature..."
                          />
                        </FormControl>
                        <FormDescription className="sr-only">
                          {field.value?.length || 0} out of 1000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={workForm.formState.isSubmitting}
                    >
                      {workForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        "Save Experience"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {(() => {
          if (isLoadingWorkExperience) {
            return <ExperienceListSkeleton />;
          }
          if (workExperience.length > 0) {
            return (
              <ul className="space-y-3 mt-4">
                {workExperience.map((work) => (
                  <WorkExperienceItem key={work.id} work={work} />
                ))}
              </ul>
            );
          }
          return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-muted rounded-xl bg-muted/5">
              <div className="bg-background p-3 rounded-full mb-4 ring-1 ring-border shadow-sm">
                <Briefcase className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No work experience
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Add your professional experience to build your profile.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWorkDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Add Work Experience
              </Button>
            </div>
          );
        })()}
      </div>
    </>
  );
};

export default memo(WorkExperienceSection);
