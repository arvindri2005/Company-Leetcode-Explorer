# RFC: Job Application Tracker Feature

 ## 1. Problem Statement
 **User Problem:** Users currently use the platform to practice for interviews (solving LeetCode problems) but have no integrated way to track the actual applications they are preparing for. They likely switch between this app and a spreadsheet or another tool to manage their job search pipeline.

 **Gap:**
 - `JobApplication` type existed in `src/types/index.ts` but was unused.
 - No UI or storage existed for tracking applications.

 ## 2. Proposed Solution
 Implement a "Job Application Tracker" within the User Profile.

 **Key Features:**
 - **List View:** See all applications in a table with status (Applied, Interviewing, Offer, etc.).
 - **Add/Edit:** Form to add new applications with details like Company, Job Title, Salary, Location, and Notes.
 - **Status Management:** Easily update the status of an application as it moves through the pipeline.

 ## 3. Technical Implementation (MVP)

 ### Data Model
 Re-use existing `JobApplication` schema in `src/types/index.ts`.
 ```typescript
 export const JobApplicationSchema = z.object({
   id: z.string().optional(),
   userId: z.string(),
   companyName: z.string().min(1),
   jobTitle: z.string().min(1),
   location: z.string().optional(),
   salary: z.string().optional(),
   status: JobApplicationStatusSchema,
   appliedDate: z.date().optional(),
   url: z.string().url().optional(),
   notes: z.string().optional(),
   createdAt: z.date().optional(),
   updatedAt: z.date().optional(),
 });
 ```

 ### Architecture
 - **Repository:** `JobApplicationRepository` (Firestore `users/{userId}/jobApplications`)
 - **Service:** `JobApplicationService` (Business logic)
 - **Server Actions:** `src/app/actions/job-application.actions.ts` (Next.js Server Actions)
 - **UI:**
   - `JobApplicationsSection` (Container)
   - `JobApplicationList` (Display)
   - `AddJobApplicationDialog` (Form)

 ### Security Considerations
 - **IDOR Risk:** Due to the lack of `firebase-admin` for server-side token verification, `userId` is passed from the client. This is a known risk documented with "SENTINEL SECURITY WARNING" in the code. Future mitigation requires `firebase-admin` integration.

 ## 4. Future Improvements (Post-MVP)
 - **Kanban Board:** Drag-and-drop board for applications.
 - **Company Integration:** Link application to existing "Company" entities in the system to auto-fill logo/stats.
 - **Reminders:** Email/Push notifications for follow-ups.
 - **Analytics:** Success rate charts.
