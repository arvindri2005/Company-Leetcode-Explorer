# RFC-001: Job Application Tracker

## 1. Summary
A dedicated Job Application Tracker to help users manage their job search directly within the platform. This feature allows users to track applications, status changes (Applied, Interviewing, Offer, etc.), and link them to the companies they are practicing for.

## 2. Problem
**User Pain Point:** Users currently have to switch between the "Byte to Offer" platform (for practice) and external tools like Excel, Notion, or Trello (for tracking applications).
**Impact:** This context switching breaks flow and disconnects the "practice" from the "goal".
**Gap:** The data model (`JobApplication`, `JobApplicationStatus`) already exists in `src/types/index.ts` but is completely unused.

## 3. Goals (MVP)
1.  **Centralize:** Provide a single place to view all active job applications.
2.  **Manage:** Allow creating, editing, and deleting applications.
3.  **Visualize:** Show status (Wishlist -> Applied -> Interviewing -> Offer -> Rejected).

## 4. Technical Specification

### 4.1 Data Model (Existing)
Already defined in `src/types/index.ts`:
```typescript
interface JobApplication {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  status: "Wishlist" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  // ... location, salary, notes, etc.
}
```

### 4.2 Architecture
We will follow the existing Clean Architecture pattern:
1.  **Repository:** `src/repositories/job-application.repository.ts` (Direct Firestore access).
2.  **Service:** `src/services/job-application.service.ts` (Business logic, Zod validation).
3.  **Actions:** `src/app/actions/job-application.actions.ts` (Server Actions for frontend).
4.  **UI:** Client Components in `src/components/tracker/`.

### 4.3 Database Schema (Firestore)
-   Collection: `users/{userId}/job_applications`
-   Documents: Auto-ID
-   Fields: Matches `JobApplicationSchema`

## 5. Implementation Plan

### Phase 1: Backend Foundation (Days 1-2)
-   [ ] Create `JobApplicationRepository` with CRUD methods (`add`, `update`, `delete`, `list`).
-   [ ] Create `JobApplicationService` to wrap repository and handle validation.
-   [ ] Create Server Actions `createJobApplication`, `updateJobApplication`, `deleteJobApplication`.

### Phase 2: UI Components (Days 3-4)
-   [ ] **ApplicationList:** A `Table` or `Card` list view of applications.
-   [ ] **ApplicationDialog:** A form using `react-hook-form` and `zod` to add/edit.
-   [ ] **StatusBadge:** Visual indicator for application status.

### Phase 3: Integration (Day 5)
-   [ ] Create route `src/app/tracker/page.tsx`.
-   [ ] Add "Tracker" link to the main `Header` navigation.

## 6. Future Scope (Post-MVP)
-   **Company Integration:** Link application to existing `Company` entities to show "relevant problems" automatically.
-   **Kanban View:** Drag-and-drop board for statuses.
-   **Reminders:** Email reminders for follow-ups.
