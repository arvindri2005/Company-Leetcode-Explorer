# Explorer: Saved Flashcard Decks

## 1. Summary
Allow users to **save and review** the AI-generated flashcards. Currently, flashcards are transient—generated on-the-fly and lost upon page refresh. This feature adds persistence, enabling users to build a personal library of study materials for specific companies.

## 2. Problem
**User Pain Point:** "I spent AI credits (and time) generating a great set of flashcards for Google, but when I came back the next day, they were gone."
**Impact:**
-   **Frustration:** Users feel their effort/credits are wasted.
-   **Engagement:** Users can't use the app for *spaced repetition* or review, which is the core value of flashcards.
-   **Cost:** Users might re-generate the same deck multiple times, wasting system resources (LLM tokens).

## 3. Goals (MVP)
1.  **Persistence:** Save generated flashcards to the user's profile.
2.  **Access:** View saved decks in a dedicated "Flashcards" tab on the Profile page.
3.  **Review:** Re-open a saved deck to study (Flip front/back).

## 4. Technical Specification

### 4.1 Data Model
We will introduce a new Firestore collection `flashcard_decks` under `users/{userId}/`.

**Interface:**
```typescript
interface FlashcardDeck {
  id: string; // Auto-ID
  userId: string;
  companyId: string;
  companyName: string;
  companySlug: string; // For linking back
  cards: Flashcard[]; // Array of { front, back }
  createdAt: Date;
}
```
*Note: `Flashcard` type already exists in `src/types/ai.ts`.*

### 4.2 Architecture
1.  **Repository:** `src/repositories/flashcard.repository.ts`
    -   `createDeck(userId, deck): Promise<string>`
    -   `getUserDecks(userId): Promise<FlashcardDeck[]>`
    -   `deleteDeck(userId, deckId): Promise<void>`
2.  **Service:** `src/services/flashcard.service.ts` (Business logic)
3.  **Actions:** `src/app/actions/flashcard.actions.ts`
    -   `saveFlashcardDeckAction(companyId, cards)`
    -   `getUserFlashcardDecksAction()`
    -   `deleteFlashcardDeckAction(deckId)`

### 4.3 UI Changes

#### A. Company Page (`FlashcardGenerator` component)
-   **Change:** Add a "Save Deck" button next to the generated results.
-   **State:** When clicked, call `saveFlashcardDeckAction`. Show "Saved!" toast. Disable button if already saved (local state check).

#### B. Profile Page (`src/app/profile/page.tsx`)
-   **Change:** Add a new Tab `Flashcards` in the main `Tabs` component.
-   **Content:** A grid of `Card` components, each representing a deck (e.g., "Google Flashcards - 10 cards - May 22").
-   **Interaction:** Clicking a deck opens a `Dialog` (modal) displaying the `FlashcardGenerator` (or a reuseable `FlashcardViewer`) in "Review Mode" (no generation, just viewing).

## 5. Implementation Plan

### Phase 1: Backend (Data Layer)
1.  Create `src/types/flashcard.ts` (or update `ai.ts`).
2.  Create `src/repositories/flashcard.repository.ts`.
3.  Create `src/services/flashcard.service.ts`.
4.  Create `src/app/actions/flashcard.actions.ts`.

### Phase 2: Company Page Integration
1.  Update `src/components/ai/flashcard-generator.tsx` to include "Save" functionality.
2.  Ensure it handles the `loading` state during save.

### Phase 3: Profile Page Integration
1.  Create `src/components/profile/flashcard-deck-list.tsx`.
2.  Create `src/components/profile/flashcard-deck-viewer.tsx` (or refactor `FlashcardGenerator` to accept `initialCards`).
3.  Update `src/app/profile/page.tsx` to fetch and render the list.

## 6. Success Metrics
-   **Adoption:** % of users who save a deck after generating one.
-   **Retention:** % of users who return to the Profile -> Flashcards tab.
