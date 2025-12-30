# RFC-002: AI Mock Interview Simulator

## 1. Summary
An interactive, AI-powered "Mock Interview" mode where a Chatbot plays the role of a technical interviewer. It challenges the user to explain their thought process, asks clarifying questions, and provides feedback on their communication and approach, not just the code.

## 2. Problem
**User Pain Point:** LeetCode practice is silent and isolated. Real interviews are conversational. Users often fail because they jump to coding without clarifying requirements or explaining their approach.
**Impact:** Users can solve "Hard" problems but fail "Easy" interviews due to poor communication.
**Gap:** We have the `Genkit` infrastructure and `MockInterviewInput` types (`src/types/ai.ts`), but no implementation exists.

## 3. Goals (MVP)
1.  **Simulate:** A chat interface where the AI acts as a senior engineer interviewer.
2.  **Context:** The AI knows the problem context and (optional) user's resume.
3.  **Feedback:** Post-interview feedback on communication, correctness, and optimization.

## 4. Technical Specification

### 4.1 Data Model (Existing)
Already defined in `src/types/ai.ts`:
```typescript
interface MockInterviewInput {
  problemTitle: string;
  conversationHistory: ChatMessage[];
  currentUserMessage: string;
  // ...
}
```

### 4.2 Architecture
1.  **Flow:** Create `src/ai/flows/mock-interview-flow.ts`.
    -   System Prompt: "You are a senior technical interviewer..."
    -   State: Stateless (client sends full history) or Session-based (if we use Genkit sessions). MVP: Client manages history.
2.  **Service:** Update `src/services/ai.service.ts`.
3.  **Actions:** Add `performMockInterviewTurn` to `src/app/actions/ai.actions.ts`.
4.  **UI:**
    -   `src/components/interview/interview-chat-window.tsx`: Chat UI.
    -   `src/components/interview/mock-interview-dialog.tsx`: Entry point from Problem Page.

### 4.3 User Flow
1.  User clicks "Start Mock Interview" on a Problem Page.
2.  Modal/Drawer opens with Chat UI.
3.  AI starts: "Hi! I see you're looking at [Problem]. How would you approach this?"
4.  User types explanation.
5.  AI challenges: "What is the time complexity of that?" or "Can you handle edge case X?"
6.  User clicks "End Interview".
7.  AI generates structured feedback.

## 5. Implementation Plan

### Phase 1: AI Flow & Backend (Days 1-2)
-   [ ] Implement `mockInterviewFlow` in `src/ai/flows`.
-   [ ] Define prompt engineering for "Interviewer Persona".
-   [ ] Expose via `aiService` and Server Actions.

### Phase 2: UI Implementation (Days 3-4)
-   [ ] Create `ChatBubble` and `ChatInput` components (reusable).
-   [ ] Create `MockInterviewDrawer` component.
-   [ ] Integrate with `ProblemCard` or `ProblemPage` (if it existed, or add to `ProblemList` actions).

### Phase 3: Feedback Loop (Day 5)
-   [ ] Implement "End Interview" flow to trigger feedback generation.
-   [ ] Display feedback nicely.

## 6. Future Scope
-   **Voice Mode:** Use Web Speech API for voice-to-text.
-   **Code Execution:** Allow running code within the chat context.
-   **Resume Integration:** AI asks questions based on user's past experience (already supported in types).
