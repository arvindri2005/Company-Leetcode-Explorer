
'use client';

import React from 'react';
import { useFormContext, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, GraduationCap, Loader2 } from 'lucide-react';
import type { EducationExperience } from '@/types';
import { EducationExperienceSchema as educationFormSchema } from '@/types'; // Renamed for clarity

type EducationFormValues = z.infer<typeof educationFormSchema>;

interface EducationExperienceSectionProps {
  userId: string; // Needed for keying if delete/edit were added
  educationHistory: EducationExperience[];
  isLoadingEducation: boolean;
  handleAddEducation: (data: EducationFormValues) => Promise<void>;
  // educationForm: UseFormReturn<EducationFormValues>; // To be provided by FormProvider
  isEducationDialogOpen: boolean;
  setIsEducationDialogOpen: (isOpen: boolean) => void;
}

const EducationExperienceSection: React.FC<EducationExperienceSectionProps> = ({
  educationHistory,
  isLoadingEducation,
  handleAddEducation,
  isEducationDialogOpen,
  setIsEducationDialogOpen,
}) => {
  const educationForm = useFormContext<EducationFormValues>();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl flex items-center">
            <GraduationCap className="mr-3 text-primary" />
            Educational Background
          </CardTitle>
          <CardDescription>Your academic qualifications.</CardDescription>
        </div>
        <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Educational Experience</DialogTitle>
            </DialogHeader>
            <FormProvider {...educationForm}>
              <Form {...educationForm}>
                <form onSubmit={educationForm.handleSubmit(handleAddEducation)} className="space-y-4">
                  <FormField control={educationForm.control} name="school" render={({ field }) => (<FormItem><FormLabel>School/University</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="degree" render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="major" render={({ field }) => (<FormItem><FormLabel>Major/Field of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="graduationYear" render={({ field }) => (<FormItem><FormLabel>Graduation Year (YYYY, Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={educationForm.control} name="gpa" render={({ field }) => (<FormItem><FormLabel>GPA (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <DialogFooter>
                    <Button type="submit" disabled={educationForm.formState.isSubmitting}>
                      {educationForm.formState.isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Education"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoadingEducation ? (
          <Skeleton className="h-20 w-full" />
        ) : educationHistory.length > 0 ? (
          <ul className="space-y-3">
            {educationHistory.map(edu => (
              <li key={edu.id} className="p-3 border rounded-md bg-muted/50">
                <h4 className="font-semibold">{edu.degree} in {edu.major}</h4>
                <p className="text-sm text-muted-foreground">
                  {edu.school}
                  {edu.graduationYear && `, Graduated ${edu.graduationYear}`}
                  {edu.gpa && `, GPA: ${edu.gpa}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No educational background added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EducationExperienceSection;
