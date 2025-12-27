# Vault Journal 🗄️

## 2024-05-23: User Repository Soft Deletes

### 🔍 Audit
- **Fragility Point**: "Noisy Deletes" identified in `src/repositories/user.repository.ts`.
- **Details**: `toggleBookmarkProblem` and `setProblemStatus` were using `batch.delete()` to remove documents. This means if a user accidentally unbookmarks a problem or clears their status, the data (including timestamp history) is lost immediately.
- **Risk**: Data loss and inability to recover from accidental user actions. Also prevents future analytics on "dropped" problems.

### 🗄️ Select
- **Safeguard**: Implement Soft Deletes for User Bookmarks and Problem Statuses.
- **Why**: Allows data recovery and preserves history.

### 🔧 Fortify
- Modified `toggleBookmarkProblem`:
    - Instead of deleting, it now sets `isDeleted: true` and `deletedAt: serverTimestamp()`.
    - It also handles restoration if the item was previously soft-deleted.
- Modified `setProblemStatus`:
    - If status is "none", it sets `status: "none"`, `isDeleted: true`, and `deletedAt`.
- Updated Queries:
    - `getBookmarkedProblemsInfo`, `getAllUserProblemStatuses`, `getProblemStatusesForIds`, `getBookmarksForIds` now filter out `isDeleted` items in memory.
- **Technical Note**: In-memory filtering was chosen over Firestore query constraints to avoid immediate need for new composite indexes, as the volume of per-user data is expected to be manageable (low thousands max).

### ✅ Verify
- **Verification Plan**:
    - Run existing tests to ensure no regression.
    - Manually verify the behavior by creating a test script (or using the app if I could).
    - Since I am an agent, I will rely on code review and potentially creating a small test case.

### 🎁 Present
- **Title**: 🗄️ Vault: Implemented Soft Deletes for User Data
- **Description**: Replaced hard deletes in `UserRepository` with soft deletes (`isDeleted` flag). This prevents permanent data loss when users unbookmark problems or clear status, allowing for potential future recovery or "undo" features.
