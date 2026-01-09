# Custom Hooks Documentation

This directory contains custom React hooks used throughout the application to encapsulate reusable logic.

## 🧠 AI & Game Logic

### `useAIFeatures` (`use-ai-features.ts`)
**Description**: Manages state and execution for AI-powered problem insights and similar question discovery.
**When to use**: On the Problem Details page to handle "Get Help" or "Find Similar" actions.
**Key Features**:
- Handles API loading states.
- Coordinates with `useAICooldown` to prevent abuse.
- Manages dialog open/close states for results.

### `useAICooldown` (`use-ai-cooldown.ts`)
**Description**: Enforces a global cooldown period for expensive AI operations.
**When to use**: Whenever triggering an AI generation feature (Flashcards, Strategy, Insights).
**Key Features**:
- Persists cooldown state to `localStorage`.
- Provides formatted "remaining time" strings.

### `useSpeech` (`use-speech.ts`)
**Description**: wrapper around the Web Speech API (Speech Recognition & Synthesis).
**When to use**: For accessibility features or voice-controlled interfaces.
**Key Features**:
- Handles microphone permissions.
- Provides real-time transcript updates.
- Supports Text-to-Speech (TTS) with text sanitization (removes markdown).

### `useTypingGame` (`use-typing-game.ts`)
**Description**: The core engine for the "Speed Typing" mini-game.
**When to use**: In the Typing Test component.
**Key Features**:
- Calculates WPM (Words Per Minute) and Accuracy in real-time.
- Manages snippet selection and language switching.
- Tracks historical WPM for graphing.

## 💾 Data & Interaction

### `useProblemInteractions` (`use-problem-interactions.tsx`)
**Description**: Manages user interactions with a specific problem (Bookmarking, Status changes).
**When to use**: In lists or detail views where users can mark a problem as "Solved" or "Bookmarked".
**Key Features**:
- **Optimistic UI**: Updates the UI immediately before the server request completes.
- **Rollback**: Reverts changes if the server request fails.
- **Auth Guard**: Prompts user to login if they attempt an action while anonymous.

### `useCursorPagination` (`use-cursor-pagination.ts`)
**Description**: Handles infinite scrolling logic using Firestore cursors.
**When to use**: In the "Companies" list or any feed-style view.
**Key Features**:
- Manages `AbortController` to cancel stale requests.
- Returns `nextCursor` for the next fetch.

## 🎨 UI & Effects

### `useToast` (`use-toast.ts`)
**Description**: A custom toast notification system (inspired by `react-hot-toast`).
**When to use**: To display temporary success/error messages.
**Key Features**:
- Supports `success`, `error`, `warning`, `info` variants.
- Manages queue and auto-dismissal.

### `useNavbarScroll` (`use-navbar-scroll.ts`)
**Description**: Detects scroll position to toggle navbar transparency.
**When to use**: In the main layout/navigation component.

### `useTypingPlaceholder` (`use-typing-placeholder.ts`)
**Description**: Creates a "typewriter" effect for input placeholders.
**When to use**: In the main search bar to cycle through example queries (e.g., "Google", "Amazon").

## 🛠️ Utilities

### `useMediaQuery` (`use-media-query.ts`)
**Description**: React wrapper for `window.matchMedia`.
**When to use**: To render different components based on screen size (when CSS isn't enough).

### `useMounted` (`use-mounted.ts`)
**Description**: Tracks whether the component has mounted on the client.
**When to use**: To prevent **Hydration Mismatches** when rendering browser-specific content (e.g., `Date.now()`, `window` usage).

### `useOnlineStatus` (`use-online-status.ts`)
**Description**: Tracks the browser's online/offline state.
**When to use**: To disable features or show warnings when the user loses internet connection.
