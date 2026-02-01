# Codebase Structure Documentation

## Overview
The codebase follows a hybrid architectural pattern combining **Clean Architecture** principles with **Feature-Sliced Design (FSD)**, optimized for a Next.js environment. This structure promotes separation of concerns, scalability, and maintainability.

## Directory Breakdown

### 1. `src/core` (Domain Layer)
*   **Role:** The heart of the application. It contains business logic, entities, value objects, and domain service interfaces.
*   **Characteristics:** It is independent of UI frameworks or external libraries. It defines 'what' the system does, not 'how' it is shown.
*   **Detailed Breakdown:**
    *   **`domain/entities`:** Contains business objects that have a unique identity (managed by a base `Entity` class with a UUID) and a lifecycle.
        *   **`base.entity.ts`:** The abstract base class providing identity (ID) and equality logic for all entities.
            *   **Responsibilities:**
                *   **Identity Management:** Automatically generates and manages a unique UUID (`_id`) for every entity instance during initialization.
                *   **State Encapsulation:** Encapsulates entity properties within a protected `props` generic type, ensuring controlled access.
                *   **Equality Checking:** Implements the `equals()` method to compare entities based on their unique identity (ID) rather than structural properties.
        *   **`user.entity.ts`:** Represents a system user and encapsulates domain logic for user profile management.
            *   **Responsibilities:**
                *   **Domain Modeling:** Defines the `User` entity with core attributes (email, display name) and user preferences.
                *   **State Encapsulation:** Manages mutations via specific methods (`updateDisplayName`, `markSynced`), ensuring invariants like `updatedAt` are always current.
                *   **Data Validation:** Exports Zod schemas for complex sub-structures (`EducationExperience`, `WorkExperience`) with custom logic (e.g., validating date ranges).
                *   **Type Definitions:** Centralizes types for auxiliary data like bookmarks (`BookmarkedProblemInfo`) and problem statuses (`UserProblemStatusInfo`).
        *   **`company.entity.ts`:** Represents an organization (`Company`) within the domain, encapsulating its essential attributes and state mutations.
            *   **Responsibilities:**
                *   **State Encapsulation:** Manages core company details like `name`, `slug`, `industry`, and `size` (via `CompanySize` Value Object).
                *   **Lifecycle Management:** Automatically handles creation (`createdAt`) and modification (`updatedAt`) timestamps via the static `create` factory and update methods.
                *   **Controlled Mutation:** Provides semantic methods (`updateName`, `updateDescription`, etc.) to modify detailed properties while strictly enforcing state consistency (e.g., auto-updating `updatedAt`).
        *   **`problem.entity.ts`:** Encapsulates coding problems with difficulty, status, and tags, linked to companies.
            *   **Responsibilities:**
                *   **Domain Modeling:** Represents the core problem entity with attributes like `title`, `description`, and relationships (`companyId`).
                *   **State Management:** Encapsulates state transitions for problem lifecycle via `updateStatus`.
                *   **Tag Management:** Provides logic for adding and removing tags (`addTag`, `removeTag`) ensuring uniqueness.
                *   **Audit Tracking:** Automatically updates `updatedAt` timestamp on any modification to the entity.
        *   **`contact.entity.ts`:** Manages contact form submissions with a lifecycle state machine (`pending` -> `read` -> `replied` -> `archived`).
            *   **Responsibilities:**
                *   **Domain Modeling:** Represents a contact submission with essential fields (name, email, message) and tracking metadata.
                *   **Lifecycle Management:** Enforces state transitions (`markAsRead`, `markAsReplied`, `archive`) to track the progress of a request.
                *   **State Encapsulation:** Protects internal properties and ensures timestamps (`updatedAt`, `repliedAt`) are automatically managed during mutations.
                *   **Factory Creation:** Provides a static `create` method to initialize new contacts with default `pending` status and creation timestamps.
        *   **`index.ts`:** Central export point for all domain entities.
    *   **`domain/value-objects`:** Contains immutable objects defined by their attributes rather than identity. They encapsulate validation logic and business rules, ensuring invalid states cannot exist in the domain layer.
        *   **Class-Based VOs (DDD Pattern):** Follow a strict pattern with private constructors, static factory methods (`create`), and comparison logic (`equals`).
            *   **`company-size.vo.ts`:** Represents the size category of a company ('startup' to 'enterprise') and encapsulates logic for size comparison.
                *   **Responsibilities:**
                    *   **Strict Validation:** The `create` factory method enforces constraints, ensuring only valid sizes are instantiated and throwing `ValidationError` otherwise.
                    *   **Semantic Comparison:** Implements `isLargerThan` using an internal ordinal mapping (startup=1 to enterprise=5) to facilitate size-based logic.
                    *   **Domain Predicates:** Exports semantic checks like `isStartup()` and `isEnterprise()` to simplify domain rules.
                    *   **Value Object Equality:** Implements proper `equals()` method to compare instances by value rather than reference.
            *   **`difficulty.vo.ts`:** Represents the difficulty level of a problem with built-in validation and comparison logic.
                *   **Responsibilities:**
                    *   **Validation:** Enforces that the difficulty is one of the allowed values ('easy', 'medium', 'hard').
                    *   **Logic:** Implements `isHarderThan()` to compare difficulty levels based on a defined hierarchy.
                    *   **Encapsulation:** Ensures the difficulty value remains immutable and valid once created.
            *   **`problem-status.vo.ts`:** Represents the lifecycle status of a problem with validation and state checks.
                *   **Responsibilities:**
                    *   **Strict Validation:** Ensures the status is one of the allowed values: 'pending', 'approved', 'rejected', or 'archived'. Case-insensitive creation.
                    *   **State Encapsulation:** Encapsulates the status string, preventing invalid states.
                    *   **Equality Checking:** Implements `equals()` for value-based comparison.
                    *   **State Predicates:** Provides helper methods (`isPending`, `isApproved`, etc.) to check the current state without exposing raw strings.
        *   **Schema-Based VOs (Zod Pattern):** Defined using Zod schemas for validation and TypeScript types, often for complex or data-transfer structures.
            *   **`strategy.vo.ts`:** Defines structured components for interview preparation strategies, leveraging Zod for validation and type inference.
                *   **Responsibilities:**
                    *   **Schema Definition:** Exports strict Zod schemas (`FocusTopicSchema`, `StrategyTodoItemSchema`) to validate AI-generated content and user inputs.
                    *   **Type Safety:** Provides inferred TypeScript types (`FocusTopic`, `StrategyTodoItem`) for consistent usage across the domain and UI layers.
                    *   **Default Behavior:** Enforces default values (e.g., `isCompleted: false` for new todo items) to ensure consistent initialization.
            *   **`user-problem-status.vo.ts`:** Manages user-specific progress states onto a problem.
                *   **Responsibilities:**
                    *   **Status Definition:** Defines valid progress states (`solved`, `attempted`, `todo`, `none`) via `VALID_USER_PROBLEM_STATUSES`.
                    *   **Schema Validation:** Exports a Zod schema `UserProblemStatusSchema` for runtime validation.
                    *   **Type Guarding:** Provides `isValidUserProblemStatus` to safely type-check unknown values against allowed statuses.
        *   **`index.ts`:** Central export point for all value objects.
    *   **`domain/errors`:** Defines domain-specific exceptions to distinguish business logic failures from technical failures. Currently, all domain errors extend the native `Error` class.
        *   **`validation.error.ts`:** Thrown when domain validation fails for value objects or entities.
            *   **Responsibilities:**
                *   **Error Identification:** Defines a specific `ValidationError` type for domain-level validation failures, distinct from generic system errors.
                *   **Contextual Debugging:** Captures detailed context including the `field` name, the invalid `value`, and the specific `constraint` that was violated.
                *   **Message Formatting:** Automatically generates a comprehensive error message that aids in debugging by combining the field, constraint, and value (serialized via `JSON.stringify`).
                *   **Type Safety:** Extends the standard `Error` class to ensure compatibility with standard error handling mechanisms while providing specific properties for granular error management.
        *   **`index.ts`:** Acts as a barrel file to export all domain errors for easier consumption across the application.

### 2. `src/features` (Application/Feature Layer)
*   **Role:** Implements specific user features. Each feature is a self-contained module promoting high cohesion and low coupling.
*   **Feature Modules:**
    *   **`ai`:** Handles AI-powered functionalities using a self-contained module structure. It leverages Google's Genkit for AI workflows, combined with a robust caching and observability layer.
        *   **`actions/`:** Serves as the security perimeter and API gateway for the AI feature.
            *   **`ai.actions.ts`:** Exports server actions that act as the primary bridge between frontend components and the backend `AIService`.
                *   **Responsibilities:**
                    *   **Input Validation:** Enforces constraints (e.g., `MAX_PROBLEMS_FOR_GROUPING` = 50) to prevent abuse and manage costs.
                    *   **Service Orchestration:** Calls core service methods (`groupQuestions`, `findSimilarQuestions`, `generateFlashcards`, etc.).
                    *   **Cache Management:** Triggers on-demand revalidation (`revalidateTag`) to ensure UI consistency after AI operations.
                    *   **Observability:** Logs the start, duration, and completion of AI tasks.
                    *   **Standardization:** Wraps responses in a unified `ApiResponse` format for consistent client-side error handling.
        *   **`components/`:** Implements the UI for AI features, characterized by consistent auth-gating, rate-limiting (cooldowns), and responsive design patterns (Dialog/Drawer hybrids).
            *   **`ai-grouping-section.tsx`:** Categorizes company problems into thematic groups by orchestrating AI interaction and state management.
                *   **Responsibilities:**
                    *   **Feature Lifecycle:** Manages the full feature flow including authentication checks, lazy loading of problem data, and AI cooldown enforcement (`useAICooldown`).
                    *   **AI Orchestration:** Aggregates problem data and invokes the `performQuestionGrouping` server action to categorize questions by concept.
                    *   **User Feedback:** Provides real-time feedback via loading states (spinners) and toasts for errors, success, or cooldown warnings.
                    *   **Result Visualization:** Renders the AI-generated groups in an interactive `Accordion` layout, reusing the `ProblemCard` component for consistent presentation.
            *   **`flashcard-generator.tsx`:** Renders an interactive section for generating AI-powered study flashcards for a company.
                *   **Responsibilities:**
                    *   **Feature Lifecycle:** Manages the full flashcard generation process including authentication checks, cooldown enforcement, and loading states.
                    *   **AI Orchestration:** Calls `generateFlashcardsAction` to fetch AI-generated content and handles success/error feedback via toasts.
                    *   **User Interaction:** Provides a clean UI for users to initiate generation and view results in an interactive Accordion format.
                    *   **Content Rendering:** Renders markdown content for both questions and answers using `react-markdown`.
            *   **`strategy-generator/`:** A complex sub-module for the **Company Strategy Generator** that provides the UI for generating, viewing, and saving AI-powered interview strategies.
                *   **`company-strategy-generator.tsx`:** The main container and orchestrator component for the AI strategy feature.
                    *   **Responsibilities:**
                        *   **Feature Lifecycle:** Manages the full feature flow including authentication checks, loading saved strategies on mount, and handling the generation process.
                        *   **AI Orchestration:** Triggers strategy generation via `useStrategyGeneration` and enforces AI cooldowns to prevent abuse.
                        *   **State Management:** Orchestrates complex loading states (`authLoading`, `isLoadingSaved`, `isGenerating`) and conditionally renders the appropriate view (Login prompt, Form, or Result Display).
                        *   **Persistence Integration:** Bridges the UI with `useStrategyPersistence` to save or update the generated strategy to the user's profile.
                        *   **User Feedback:** Provides real-time feedback via toasts for actions like generation success, save completion, errors, or cooldown warnings.
                *   **`strategy-form.tsx`:** The interactive input component where users select their 'Target Role Level' and initiate the strategy generation.
                    *   **Responsibilities:**
                        *   **User Input:** Captures the user's desired target role level via a dropdown menu to customize the strategy.
                        *   **Action Triggering:** Initiates the generation process via a primary button, which adapts its text ("Generate" vs. "Regenerate") based on whether a strategy already exists.
                        *   **State Feedback:** Visually indicates the generation status (loading spinner) and manages button disabled states during processing.
                        *   **Cooldown Enforcement:** Conditionally renders a cooldown warning message with the remaining time if the user has hit their rate limit.
                        *   **Responsive Layout:** Adapts the form layout for mobile (stacked) and desktop (row) views for optimal usability.
                *   **`strategy-display.tsx`:** A detailed view component that renders the AI-generated strategy. It supports markdown rendering and displays preparation plans, focus topics (in an accordion), and todo lists.
                    *   **Responsibilities:**
                        *   **Strategy Visualization:** Renders complex strategy data including overall preparation plans, focus topics, and actionable todo lists using `react-markdown` and UI components.
                        *   **Interactive Elements:** Uses `Accordion` for focus topics to manage content density.
                        *   **State Reflection:** Visually distinguishes between a "fresh" AI-generated strategy and a previously "saved" strategy, showing timestamps and specific messaging.
                        *   **Action Integration:** Accepts `actionButtons` as a prop to allow parent components to inject controls (like Save/Update buttons) directly into the header.
                *   **`strategy-actions.tsx`:** Renders the primary action buttons for the strategy feature, allowing users to save or update their generated strategies.
                    *   **Responsibilities:**
                        *   **Action Management:** Toggles between "Save Strategy" and "Update Saved Strategy" modes based on whether the strategy has already been persisted.
                        *   **Feedback Integration:** Displays a loading spinner (`Loader2`) within the button during asynchronous save operations to provide immediate visual feedback.
                        *   **State Control:** Disables interaction when the component is explicitly disabled or while a save is in progress to prevent race conditions or duplicate submissions.
                        *   **UI Consistency:** Utilizes the shared `Button` component and `lucide-react` icons (`Save`) to maintain design system consistency.
                *   **`loading-state.tsx`:** Provides a standardized loading UI component for the strategy generator.
                    *   **Responsibilities:**
                        *   **Visual Feedback:** Renders a centered loading view with an animated spinner (`Loader2`) and a customizable status message.
                        *   **UI Consistency:** Standardizes the waiting experience during asynchronous AI operations, ensuring a uniform look and feel.
                        *   **Responsive Layout:** Uses a flexbox-centered layout with standard typography colors (`text-muted-foreground`) to integrate seamlessly into various containers.
                *   **`cooldown-indicator.tsx`:** A focused UI component that informs users when an AI feature is temporarily unavailable due to rate limiting.
                    *   **Responsibilities:**
                        *   **State-Based Rendering:** Conditionally renders the warning only when `isActive` is true, ensuring a clean UI when the feature is available.
                        *   **User Feedback:** Visually alerts the user with a destructive color scheme and an `AlertCircle` icon to indicate the restriction.
                        *   **Time Indication:** Displays the pre-formatted remaining time via the `formattedRemainingTime` prop to manage user expectations.
                *   **`index.ts`:** A standard barrel file exporting all components for cleaner imports.
            *   **`problem-insights-dialog.tsx`:** Displays AI-generated conceptual hints and insights for a specific coding problem using a responsive modal.
                *   **Responsibilities:**
                    *   **Responsive Layout:** Dynamically renders a `Dialog` on desktop and a swipeable `Drawer` on mobile to ensure optimal usability across devices.
                    *   **Content Visualization:** Presents structured data (Key Concepts, Data Structures, Algorithms) in clear lists and renders rich text hints using `react-markdown`.
                    *   **State Management:** Handles various UI states including loading spinners and error messaging when insights are unavailable.
                    *   **Modular Design:** Composes internal sub-components (`InsightSection`, `InsightsContent`) to cleanly separate layout logic from data rendering.
            *   **`similar-problems-dialog.tsx`:** A responsive component that adapts between a Dialog (desktop) and Drawer (mobile) to display AI-curated similar problems.
                *   **Responsibilities:**
                    *   **Adaptive UX:** Automatically switches between `Dialog` and `Drawer` presentation modes based on viewport width via the `useMediaQuery` hook.
                    *   **Content Visualization:** Renders `SimilarProblemDetail` objects in card format, displaying critical metadata including difficulty, platform, tags, and the AI-provided "Similarity Reason".
                    *   **State Management:** Handles distinct UI states for asynchronous data fetching (loading spinner) and empty result sets ("No Similar Problems Found").
                    *   **Navigation:** Provides "View on [Platform]" action buttons that open the recommended problems in a new tab.
        *   **`hooks/`:** Custom hooks for managing AI interactions, including client-side rate limiting, feature orchestration, and strategy management.
            *   **`use-ai-cooldown.ts`:** Implements a robust client-side rate-limiting mechanism using a React Context Provider and `localStorage`.
                *   **Responsibilities:**
                    *   **Client-Side Rate Limiting:** Enforces a mandatory cooldown (default 5 minutes) to prevent abuse of AI features.
                    *   **State Persistence:** Persists the cooldown expiration time in `localStorage` to maintain state across page reloads.
                    *   **Context Management:** Exposes the cooldown state (`canUseAI`, `cooldownEndTime`) and actions (`startCooldown`) via a React Context.
                    *   **Time Formatting:** Provides a helper `getFormattedRemainingTime` to display a countdown (e.g., "4m 30s") for UI feedback.
                    *   **Automatic Cleanup:** Automatically resets the state and clears storage when the timer expires.
            *   **`use-ai-features.ts`:** An orchestrator hook for problem-centric AI features (e.g., 'Similar Problems', 'Problem Insights') that integrates auth checks, cooldown logic, and asynchronous state management.
                *   **Responsibilities:**
                    *   **Feature Orchestration:** Manages the "Find Similar Problems" and "Generate Insights" workflows, bridging UI components with backend server actions.
                    *   **State Management:** Centralized handling of complex UI states including loading indicators, data storage for results, and visibility toggles for dialogs.
                    *   **Cooldown Enforcement:** Integrates with `useAICooldown` to prevent abuse by checking availability before execution and triggering cooldowns after success.
                    *   **User Feedback:** Provides immediate visual feedback via toasts for various outcomes: success (data found), empty states (no matches), errors, and cooldown warnings.
                    *   **Authentication Validation:** Ensures only authenticated users can trigger AI operations, protecting resources from unauthorized access.
            *   **`use-strategy-generation.ts`:** Encapsulates the state and logic for triggering the generation of AI interview strategies, handling the generation flow, loading states, and result data.
                *   **Responsibilities:**
                    *   **State Management:** Tracks critical UI states including `isGenerating` (loading), `error` (failure), and the resulting `strategy` data.
                    *   **Action Invocation:** Orchestrates the call to the server action (`generateCompanyStrategyAction`) with necessary parameters like `companyId` and `roleLevel`.
                    *   **Error Handling:** Catches and standardizes errors during the generation process to ensuring the UI can gracefully display issues.
                    *   **Data Validation:** Verifies the integrity of the server response, ensuring all required fields (preparation strategy, focus topics, todo items) are present before updating state.
            *   **`use-strategy-persistence.ts`:** Custom hook for managing the persistence (saving and loading) of generated company strategies to/from Firestore.
                *   **Responsibilities:**
                    *   **State Management:** Tracks input/output states including `isSaving`, `isLoading`, `hasSavedStrategy`, and `error` to provide feedback to the UI.
                    *   **Persistence Operations:** Exposes `saveStrategy` and `loadStrategy` methods that interact with the `userService` to persist strategy data (preparation strategy, focus topics, todo items).
                    *   **Error Handling:** Manages error states for persistence operations, including graceful handling of "not found" scenarios during loading.
                    *   **Data Transformation:** Maps backend data structures (from `userService`) to the application's `GenerateCompanyStrategyOutput` format.
            *   **`index.ts`:** A barrel file exporting all AI-related hooks for simplified consumption.
        *   **`lib/`:** The core engine of the AI feature, built on Firebase Genkit.
            *   **`flows/`:** Contains individual 'Flow' definitions—type-safe, validated AI operations.
                *   **`generate-company-strategy-flow.ts`:** Generates comprehensive interview strategies for specific companies.
                    *   **Responsibilities:**
                        *   **Strategy Generation:** Uses AI to create a personalized study plan based on company-specific problems and user background (education/work).
                        *   **Input Validation:** Uses Zod for strict input schema, limits problems context (`MAX_PROBLEMS_FOR_CONTEXT` = 25) to prevent context explosion.
                        *   **Cost & Performance:** Implements caching (`companyStrategyCache`) and token limits to optimize costs and latency.
                        *   **Robustness:** Uses `retryWithBackoff` to ensure reliability during transient AI failures.
                        *   **Structured Output:** Enforces a JSON schema for output containing `preparationStrategy`, `focusTopics`, and `todoItems` for consistent UI rendering.
                *   **`generate-problem-insights-flow.ts`:** Generates key concepts, common data structures/algorithms, and a high-level hint for a coding problem.
                    *   **Responsibilities:**
                        *   **AI Flow Definition:** Defines a Genkit flow that takes problem details and outputs structured insights.
                        *   **Caching Strategy:** Checks `problemInsightsCache` before execution to return previously generated insights and save costs.
                        *   **Cost Control:** Truncates and sanitizes problem descriptions to manage token usage while maintaining context.
                        *   **Resilience:** Implements `retryWithBackoff` to handle potential AI service failures or incomplete responses gracefully.
                        *   **Prompt Engineering:** Uses a specialized system prompt ("Nova" persona) to ensure hints guide users conceptually without revealing the full solution code.
                *   **`generate-flashcards-flow.ts`:** Generates study flashcards for a company based on its frequently asked coding problems.
                    *   **Responsibilities:**
                        *   **AI Flow Definition:** Defines a Genkit flow that generates 3-10 high-quality flashcards emphasizing concepts over code.
                        *   **Input/Output Validation:** Uses Zod schemas to ensure type safety for inputs (company details) and structured outputs (Flashcard objects).
                        *   **Token Optimization:** Limits the context window by selecting a maximum of 20 problems (`MAX_PROBLEMS_FOR_CONTEXT`) to reduce costs.
                        *   **Caching Strategy:** Leverages `flashcardsCache` to store and retrieve results for identical inputs, improving latency.
                        *   **Resilience & Security:** Implements `retryWithBackoff` for reliability and sanitizes inputs to prevent injection attacks or PII leaks.
                *   **`find-similar-questions-flow.ts`:** Identifies coding problems from various platforms that are conceptually similar to a given problem.
                    *   **Responsibilities:**
                        *   **AI Flow Definition:** Defines a Genkit flow that accepts problem details (title, difficulty, tags) to perform a conceptual similarity search.
                        *   **Cross-Platform Discovery:** Identifies up to 5 related problems from external platforms like LeetCode, CodingNinjas, and GeeksforGeeks.
                        *   **Semantic Matching:** Instructs the AI to focus on underlying algorithms and data structures rather than surface-level keyword matching.
                        *   **Structured Output:** Enforces a strict Zod schema (`FindSimilarQuestionsOutput`) to ensure results effectively map to the UI (including direct links and similarity reasons).
                *   **`group-questions.ts`:** Defines a Genkit flow that categorizes coding interview questions into logical groups based on themes or algorithms.
                    *   **Responsibilities:**
                        *   **Input Definition:** Defines `GroupQuestionsInputSchema` for validating the input array of questions.
                        *   **Output Definition:** Defines `GroupQuestionsOutputSchema` for structured output (groups with names and question lists).
                        *   **Prompt Engineering:** Constructs a prompt guiding the AI to group questions exhaustively without inventing new ones or modifying existing data.
                        *   **Flow Definition:** Connects the schema and prompt into a callable AI flow (`groupQuestionsFlow`).
                        *   **Caching:** Uses `unstable_cache` to cache AI responses for 1 hour, improving performance.
                        *   **Wrapper Function:** Exports `groupQuestions` as the primary entry point for the grouping logic.
            *   **`services/`:**
                *   **`ai.service.ts`:** An abstraction layer that orchestrates flows, implements multi-layered caching, and provides a clean API for the rest of the application.
                *   **Responsibilities:**
                    *   **Service Abstraction:** Acts as a façade for Genkit flows, registering and retrieving them via `aiFlowRegistry` to decouple implementation from execution.
                    *   **Observability:** Wraps all AI operations with `withObservability` to log start/end times, durations, and request IDs for debugging.
                    *   **Caching Strategy:** Implements intelligent caching using `unstable_cache` and `cacheManager` with specific TTLs (e.g., 7 days for strategies) and revalidation tags, while bypassing cache for personalized requests.
                    *   **Data Aggregation:** Fetches and transforms data from `companyService`, `problemService`, and `userService` to prepare optimized inputs for AI models.
                    *   **Error Handling:** Manages "not found" states and service failures, returning structured error objects or fallback content (e.g., default strategies when problem data is missing).
            *   **`genkit.ts`:** Bootstraps the Genkit framework with the Google AI plugin and default configuration.
                *   **Responsibilities:**
                    *   **Framework Initialization:** Initializes the Genkit instance (`ai`) which serves as the central entry point for all AI operations in the application.
                    *   **Plugin Configuration:** Configures the `googleAI` plugin to enable integration with Google's Gemini models.
                    *   **Default Model Strategy:** Sets the default model to `AI_MODELS.STANDARD` (from the registry) to ensure consistent model usage across the app unless overridden.
            *   **`model-registry.ts`:** Defines the Model Registry and Strategy for AI model selection, decoupling specific versions from their intended usage.
                *   **Responsibilities:**
                    *   **Intent Mapping:** Maps logical intents (`FAST`, `STANDARD`, `REASONING`) to specific model identifiers to abstract version details.
                    *   **Model Strategy:** Defines the `AI_MODELS` constant to centralize configuration for low-latency, balanced, and high-intelligence tasks.
                    *   **Type Safety:** Exports `AIModelIntent` to ensure consistent model requests across the system.
                    *   **Resolution Logic:** Provides the `getModelForIntent` helper to dynamically resolve the correct model ID based on the requested intent.
            *   **`flow-registry.ts`:** A centralized registry for AI flows, allowing for dynamic registration, retrieval, and decoupling of implementation from declaration.
                *   **Responsibilities:**
                    *   **Registry Management:** Maintains a central map of all available AI flows, enabling lookup by name.
                    *   **Decoupling:** Separates the definition of an AI flow interface from its concrete implementation, facilitating easier testing and mocking.
                    *   **Dynamic Registration:** Allows flows to be registered (`register`) and unregistered (`unregister`) at runtime, supporting flexible configuration.
                    *   **Safe Retrieval:** Provides a `get` method with error handling to ensure requested flows exist before execution.
                    *   **Type Safety:** Uses generics (`TInput`, `TOutput`) to strictly type the input and output of each flow function.
            *   **`cache.ts`:** Defines singleton LRU (Least Recently Used) cache instances for various AI responses to reduce latency and API costs.
                *   **Responsibilities:**
                    *   **Performance Optimization:** Reduces reliance on expensive AI calls by caching generated content like problem insights, company strategies, and flashcards.
                    *   **Resource Management:** Instantiates specific caches (`problemInsightsCache`, `companyStrategyCache`, `flashcardsCache`) with tailored capacities and TTLs (e.g., 7 days for flashcards vs. 24 hours for daily insights).
                    *   **Consistency:** Provides a centralized single-source-of-truth for process-level caching across the AI feature.
            *   **`dev.ts`:** Configures the Genkit Developer UI by importing and registering active flows for local development.
                *   **Responsibilities:**
                    *   **Flow Registration:** Imports all AI flow definitions (group-questions, find-similar-questions, generate-flashcards, generate-company-strategy, generate-problem-insights) to ensure they are registered with the Genkit runtime and visible in the developer UI.
                    *   **Development Tooling:** Serves as the entry point for local AI development and testing tools.
            *   **`utils.ts`:** Shared utility functions for managing AI operations and data safety.
                *   **Responsibilities:**
                    *   **Reliability:** Implements `retryWithBackoff` to robustly handle transient failures from external AI services.
                    *   **Cost & Safety:** Provides `truncateText` to strictly manage context window usage and `sanitizeInput` to redact PII (emails) before external processing.
            *   **`README.md`:** Comprehensive internal documentation on the AI architecture and guidelines for adding new flows.
        *   **`types/`:** Shared TypeScript definitions ensuring end-to-end type safety.
            *   **`ai.ts`:** The central definition file for all AI-related types and interfaces, ensuring end-to-end type safety between the UI, Service, and Genkit flows.
                *   **Responsibilities:**
                    *   **Flow Contracts:** Defines specific Input/Output interfaces for each AI flow (e.g., `GenerateCompanyStrategyInput`/`Output`, `FindSimilarQuestionsOutput`), serving as the contract for data exchange.
                    *   **Domain Models:** Exports shared domain types used by both AI and UI components, such as `Flashcard` (front/back), `SimilarProblemDetail` (platform links, reasons), and `ChatMessage`.
                    *   **UI Helpers:** Includes UI-specific constants like `targetRoleLevelOptions` to ensure that dropdowns and input validation stay in sync with the underlying types.
                    *   **General Abstractions:** Provides generic input structures like `AIProblemInput` to standardize how problem data is passed to various AI processors.
        *   **`index.ts`:** Acts as a barrel file to export all domain errors for easier consumption across the application.
    *   **`auth`:** A self-contained module managing authentication using Firebase. It handles user sessions, profile synchronization, and authentication UI flows.
        *   **`context/`:**
            *   **`auth-context.tsx`:** Implements the `AuthProvider` which manages the global authentication state.
                *   **Responsibilities:**
                    *   **State Management:** Tracks the current Firebase user and loading state using `onAuthStateChanged`.
                    *   **Session Persistence:** Manages a cookie (`auth-token`) to persist the authentication state for server-side rendering compatibility.
                    *   **Profile Sync:** Triggers the `syncUserProfile` service method upon successful login to ensure the local user record is up-to-date.
                    *   **Context Provision:** Exposes the user object, loading status, and logout function to the entire component tree via React Context.
        *   **`services/`:**
            *   **`auth.service.ts`:** Encapsulates the core business logic for authentication and user management.
                *   **Responsibilities:**
                    *   **Firebase Integration:** Wraps Firebase Auth methods (e.g., `signInWithPopup`, `signOut`) for Google authentication.
                    *   **Profile Synchronization:** Interacts with the `UserService` to create or update the user's profile in Firestore upon login.
                    *   **Concurrency Control:** Implements a mechanism to deduplicate concurrent synchronization requests for the same user.
                    *   **Error Handling:** Provides consistent error handling for authentication failures.
        *   **`hooks/`:**
            *   **`use-auth.ts`:** A custom hook that consumes the `AuthContext`.
                *   **Responsibilities:**
                    *   **Simplified Access:** Provides a simple interface for components to access authentication state (`user`, `loading`) and methods (`logout`, `loginWithGoogle`).
                    *   **Type Safety:** Ensures that the hook is used within an `AuthProvider` and returns properly typed values.
        *   **`components/`:** Contains a comprehensive set of React components for managing user authentication via Firebase, using Next.js Client Components, `react-hook-form`, and `zod`.
            *   **`auth-layout.tsx`:** Acts as the shared container for all authentication-related pages to ensure visual consistency.
                *   **Responsibilities:**
                    *   **Visual Wrapper:** specific styling (card, background gradients) to all child forms.
                    *   **Contextual Header:** Renders a dynamic title and description passed as props.
            *   **`login-form.tsx`:** The primary entry point for existing users.
                *   **Responsibilities:**
                    *   **Authentication Flow:** Handles email/password login via Firebase.
                    *   **Persistence:** Manages 'remember me' functionality.
                    *   **Error Handling:** Maps Firebase error codes to user-friendly messages.
                    *   **Integration:** Incorporates the `GoogleAuthButton` for social login.
            *   **`signup-form.tsx`:** Manages the registration of new users.
                *   **Responsibilities:**
                    *   **User Creation:** Handles account creation via Firebase Auth.
                    *   **Profile Sync:** Triggers synchronization with Firestore to create the user profile document.
                    *   **Validation:** Uses complex Zod schemas to validate inputs, including password strength.
                    *   **Feedback:** Integrates `SignupPasswordStrength` for real-time password feedback.
            *   **`google-auth-button.tsx`:** A performance-optimized component for Google OAuth integration.
                *   **Responsibilities:**
                    *   **Social Login:** Initiates the Google Sign-In flow.
                    *   **Performance:** Memoized to prevent unnecessary re-renders during parent form input updates.
                    *   **Integration:** Shared across both Login and Signup forms.
            *   **`forgot-password-form.tsx`:** The entry point for the password recovery flow.
                *   **Responsibilities:**
                    *   **Security:** Designed to prevent email enumeration by providing generic success messages regardless of whether the email exists.
                    *   **Request Handling:** Initiates the password reset email via Firebase.
            *   **`reset-password-form.tsx`:** Handles the final step of password recovery.
                *   **Responsibilities:**
                    *   **Code Verification:** Validates the out-of-band (oob) code from the Firebase email link.
                    *   **Password Update:** specific logic to update the user's password.
            *   **`verify-email.tsx`:** A specialized component for confirming email addresses.
                *   **Responsibilities:**
                    *   **Action Handling:** Processes Firebase action codes for email verification.
                    *   **User Feedback:** Displays success or error states based on the verification result.
            *   **`signup-password-strength.tsx` & `password-strength-indicator.tsx`:** Provide visual feedback on password complexity.
                *   **Responsibilities:**
                    *   **Real-time Analysis:** Evaluates password strength against defined criteria (length, symbols, etc.).
                    *   **Visual Cues:** Renders progress bars or color-coded indicators to guide the user.
            *   **`index.ts`:** Central export point for all domain entities.
        *   **`types/`:**
            *   **`index.ts`:** Defines the TypeScript interfaces and types for the module.
                *   **Key Types:** `AuthContextType` (context shape), `LoginCredentials` (form data), and `AuthServiceResponse` (service results).
    *   **`companies`:** Manages information about specific companies, including interview data and insights.
        *   **`actions/`:** Server actions acting as the entry point for company operations.
            *   **`company.actions.ts`:**
                *   **Responsibilities:**
                    *   **Data Fetching:** Exports `fetchCompaniesAction` to retrieve paginated company lists.
                    *   **Data Mutation:** Exports `addCompany` to handle new company submissions with validation.
        *   **`components/`:** Rich UI components for listing, searching, and viewing companies.
            *   **`page/` Subdirectory:**
                *   **`company-not-found.tsx`:** Renders a user-friendly 404 state when a company slug is invalid.
                    *   **Responsibilities:**
                        *   **User Feedback:** Displays a clear message that the requested company could not be found.
                        *   **Navigation:** Provides a direct link back to the main companies index to retain the user.
                *   **`company-page.tsx`:** The server-side entry point for the single company detail route (`/company/[slug]`).
                    *   **Responsibilities:**
                        *   **Data Provision:** Fetches initial company data and paginated problems to hydrate client components.
                        *   **SEO:** Generates dynamic metadata for search engines.
                        *   **Layout:** Orchestrates the high-level layout including the header, main content tabs, and sidebars.
                        *   **Error Handling:** Conditionally renders `CompanyNotFound` or `ProblemLoadError` based on data fetching results.
                *   **`company-tabs.tsx`:** A client-side component orchestrating the main content tabs of the company detail page.
                    *   **Responsibilities:**
                        *   **Navigation:** Switches between "Problems", "Statistics", "AI Groups", "Flashcards", and "Strategy" views.
                        *   **Dynamic Loading:** Lazily loads heavy components (AI features, charts) to optimize initial page load.
                        *   **Empty States:** Renders `NoProblemsAvailable` when the problem list is empty.
                *   **`no-problems-available.tsx`:** Renders an empty state when a company has no associated problems.
                    *   **Responsibilities:**
                        *   **Engagement:** Encourages users to contribute by providing a pre-filled "Add Problem" link.
                        *   **Feedback:** Clearly communicates that the lack of data is due to emptiness, not an error.
                *   **`problem-load-error.tsx`:** A specialized error component for failed problem fetches.
                    *   **Responsibilities:**
                        *   **Error Reporting:** Displays the specific error message to help with debugging or user understanding.
                        *   **Recovery:** Includes a "Try Refreshing" button to easily re-trigger the data fetch.
            *   **`companies-list-container.tsx`:** A server component acting as the data fetcher for the companies index page.
                *   **Responsibilities:**
                    *   **Parallel Data Fetching:** concurrent fetching of the initial company list (page 1) and "trending" companies (Google, Amazon, Microsoft) using `Promise.all` to minimize waterfall latency.
                    *   **Fallback Logic:** Implements robust fallback logic to ensure at least 3 companies are shown in the trending section by filling gaps from the main list if specific trending companies fail to load.
                    *   **SEO Integration:** Generates and injects rich JSON-LD structured data for Breadcrumbs, ItemLists (for the company collection), and FAQs to enhance search engine visibility.
            *   **`companies-page-content.tsx`:** The main client-side orchestrator for the companies listing page.
                *   **Responsibilities:**
                    *   **State Management:** Manages the complex state for the company list, including pagination (cursor-based), "load more" status, and active search queries.
                    *   **Search Integration:** Reacts to URL search parameters to switch between the default view (showing trending companies) and search results, handling data fetching for search queries.
                    *   **Infinite Scroll:** Implements an efficient `IntersectionObserver` pattern to trigger `loadMore` data fetching when the user scrolls to the bottom of the list.
                    *   **Layout Orchestration:** Composes the page layout, conditionally rendering the `DashboardHeader`, `TechCompanyCard` (trending), `CompanyTable` (list), and `AdPlaceholder` components.
            *   **`company-card.tsx`:** A reusable card component for displaying a company summary in grid or list views.
                *   **Responsibilities:**
                    *   **Visual Presentation:** Renders a polished card featuring the company's logo, name, and total problem count with a modern glassmorphism effect (`bg-white/5`).
                    *   **Robust Image Handling:** Utilizes `OfflineImage` to gracefully handle broken logo URLs by showing a fallback icon.
                    *   **Interactive Design:** Features hover effects (border highlight, lift animation) and a clear "View Problems" call-to-action link.
                    *   **Performance:** Exported as a `React.memo` component to prevent unnecessary re-renders in large lists.
            *   **`company-card-error-fallback.tsx`:** A specific error boundary fallback for individual company cards.
                *   **Responsibilities:**
                    *   **Graceful Degradation:** Renders a placeholder card with an error icon and message ("Failed to load company") instead of crashing the entire grid if a single card fails.
                    *   **Visual Consistency:** Matches the dimensions and basic styling of the standard `CompanyCard` to maintain grid layout integrity.
            *   **`company-header.tsx`:** The hero section for a specific company's detail page.
                *   **Responsibilities:**
                    *   **Brand Identity:** Prominently displays the company's large logo, name, and official website link.
                    *   **Navigation Context:** Integrates `Breadcrumb` navigation to help users understand their location within the site hierarchy (Home > Companies > [Company Name]).
                    *   **Visual Impact:** Uses a gradient background and subtle animations to create an engaging first impression.
            *   **`company-list.tsx`:** An alternative client-side list view component for companies (used in specific contexts or older iterations).
                *   **Responsibilities:**
                    *   **Client-Side Pagination:** Manages its own `useCursorPagination` hook to handle infinite scrolling independent of the main page logic.
                    *   **Self-Contained Search:** Integrating `CompanySearchBar` directly to allow filtering within this standalone list view.
                    *   **Duplicate Prevention:** Uses a `Set` of existing IDs to prevent duplicate company cards from appearing during rapid pagination or search updates.
            *   **`company-list-error-fallback.tsx`:** A broad error boundary fallback for the entire company list section.
                *   **Responsibilities:**
                    *   **User Feedback:** distinct error card explaining that the company list failed to load (e.g., due to network issues).
                    *   **Recovery Action:** Provides a "Reload Page" button to allow users to easily retry the failed operation.
            *   **`company-preparation-guide.tsx`:** Renders static, structured guidance content for a specific company.
                *   **Responsibilities:**
                    *   **Structured Content:** Organizes information into clear sections: "About", "Interview Process", "Preparation Tips", and "FAQ".
                    *   **UI Components:** Uses `Card` and `Accordion` components to present large amounts of text in a digestible, collapsible format.
                    *   **Dynamic Rendering:** Conditionally renders the "About" section only if a description is available.
            *   **`company-problem-stats.tsx`:** A data visualization component showing problem distribution metrics.
                *   **Responsibilities:**
                    *   **Interactive Charts:** Uses `recharts` to render vertical bar charts for "Difficulty Distribution" (Easy/Medium/Hard) and "Recency Distribution" (Last 30 days, etc.).
                    *   **Tag Visualization:** Displays the company's most common problem tags as badges.
                    *   **Performance:** Memoizes chart data transformations to avoid expensive recalculations on re-renders.
                    *   **Safety:** Returns `null` (renders nothing) if statistical data (`difficultyCounts`, etc.) is missing.
            *   **`company-search-bar.tsx`:** A sophisticated autocomplete search component.
                *   **Responsibilities:**
                    *   **Live Suggestions:** Fetches company suggestions from the server (`fetchCompanySuggestionsAction`) as the user types, using `useDebounce` to limit API calls.
                    *   **Keyboard Navigation:** Supports full keyboard control (Arrow keys to navigate suggestions, Enter to select) and global shortcuts (`/` or `Cmd+K` to focus).
                    *   **Input Management:** Wraps the optimized `CompanySearchInput` to handle the typing animation logic separately.
                    *   **Accessibility:** Manages ARIA states (`aria-expanded`, `aria-activedescendant`) for screen reader compatibility.
            *   **`company-search-input.tsx`:** An optimized input sub-component for the search bar.
                *   **Responsibilities:**
                    *   **Render Optimization:** Isolates the `useTypingPlaceholder` hook and its animation loop to this specific component. This prevents the heavy parent `CompanySearchBar` (and its suggestion list) from re-rendering on every character animation frame.
            *   **`company-submission-form.tsx`:** A client-side form for users to suggest new companies.
                *   **Responsibilities:**
                    *   **Form Management:** Uses `react-hook-form` and `zod` (`companyFormSchema`) to validate inputs like name length and URL formats.
                    *   **Feedback Loops:** displays a loading state (`Loader2`) during submission and uses `useToast` to provide success/failure notifications.
                    *   **Data Conversion:** Transforms form values into the correct DTO format (creating slugs, normalizing names) before calling `addCompanyAction`.
            *   **`company-table.tsx`:** Renders the list of companies in a dense, tabular format.
                *   **Responsibilities:**
                    *   **Efficient Rendering:** Displays key metrics (Top Tags, Problem Count) in columns, hiding less critical columns on smaller screens (responsiveness).
                    *   **Performance:** Both the main table and individual `CompanyRow` components are wrapped in `React.memo` to ensure high performance when dragging/scrolling large lists.
                    *   **Data Derived UI:** Dynamically sorts and slices `commonTags` to show only the top 2 tags per company.
            *   **`dashboard-header.tsx`:** The visual header for the main companies dashboard page.
                *   **Responsibilities:**
                    *   **Static Layout:** Renders the main title and subtitle.
                    *   **Component Composition:** Embeds `DashboardSearchInput` to provide search functionality within the hero area.
            *   **`dashboard-search-input.tsx`:** A specialized search input for the dashboard header with a distinct design.
                *   **Responsibilities:**
                    *   **Visual Flair:** Features a floating, glassmorphism design with a gradient border and shadow effects to stand out in the hero section.
                    *   **State Syncing:** reads from and writes to the URL query parameters (`?search=...`) to drive the page content.
                    *   **Animation:** Uses `useTypingPlaceholderRef` to animate the placeholder text with top company names.
            *   **`index.ts`:** The barrel file for the components directory.
                *   **Responsibilities:**
                    *   **Encapsulation:** Exports all public components, enabling clean imports in other parts of the application (e.g. `import { CompanyCard } from '@/features/companies/components'`).
            *   **`related-companies.tsx`:** A navigation component suggesting similar or relevant companies.
                *   **Responsibilities:**
                    *   **Navigation:** Renders a list of links to other company pages.
                    *   **Input Handling:** Accepts a simple array of company names strings and converts them to slugs for routing.
            *   **`tech-company-card.tsx`:** A specialized card variant used for the "Trending Companies" section.
                *   **Responsibilities:**
                    *   **Different Layout:** Uses a horizontal layout (row) suitable for the featured top section, unlike the vertical aspect of the standard `CompanyCard`.
                    *   **Priority Loading:** Accepts a `priority` prop to enforce eager image loading for these above-the-fold elements (LCP optimization).
        *   **`hooks/`:** Custom hooks for managing company-specific logic.
            *   **`index.ts`:** The barrel file for the components directory.input placeholders.
            *   **`use-companies.ts`:** Manages the fetching and pagination of company data.
                *   **Responsibilities:**
                    *   **State Management:** Manages local state for companies list, loading indicators, pagination cursor, and error handling.
                    *   **Pagination Control:** Exposes `loadMore` and `refresh` functions to facilitate infinite scrolling or manual data refreshment.
                    *   **Abstraction:** Decouples the UI from specific data fetching implementation details, preparing for integration with server actions.
            *   **`use-typing-placeholder-ref.ts`:** A performance-optimized hook for animating 
                *   **Responsibilities:**
                    *   **Performance Optimization:** Directly manipulates the DOM element's placeholder via a `ref` to avoid expensive React re-renders during the typing animation.
                    *   **Animation Logic:** Manages the timing and state of the typing/deleting effect using a mutable ref and timeouts.
                    *   **User Engagement:** Cycles through a dynamic list of company names to prompt user searches.
        *   **`services/`:**
            *   **`company.service.ts`:** Encapsulates business logic and caching strategies.
                *   **Responsibilities:**
                    *   **Caching Strategy:** Uses `cacheManager` to cache company lists and details with specific TTLs (e.g., 30 days for static company data).
                    *   **Cache Invalidation:** Handles `revalidateCacheTag` calls upon company creation or updates to ensure data consistency.
                    *   **Orchestration:** Coordinates between the repository layer and the application, transforming raw data into domain-ready results.
        *   **`repositories/`:**
            *   **`index.ts`:** The barrel file for the components directory.input placeholders.
            *   **`company.repository.ts`:** The data access layer.
                *   **Responsibilities:**
                    *   **Implementation:** Implements `ICompanyRepository` using a clear delegation pattern.
                    *   **Separation:** Delegates distinct responsibilities to specialized sub-classes: `CompanyCrud` (create/read/update), `PaginationHandler` (cursor-based paging), and `CompanySearch`.
                *   **Sub-modules:**
                    *   **`operations/`:**
                        *   **`company-crud.ts`:** Handles core CRUD operations for Firestore.
                            *   **Responsibilities:**
                                *   **Data Persistence:** Manages direct Firestore interactions for creating, reading, updating, and deleting companies.
                                *   **Transaction Safety:** Uses transactions for critical operations like creation to ensure consistency and prevent duplicates.
                                *   **Mapping:** Contains `mapFirestoreDocToCompany` to transform raw Firestore documents into domain `Company` objects.
                        *   **`index.ts`:** The barrel file for the components directory.input placeholders.
                    *   **`search/`:**
                        *   **`index.ts`:** The barrel file for the components directory.input placeholders.
                        *   **`company-search.ts`:** Specialized specific logic for search functionality.
                            *   **Responsibilities:**
                                *   **Suggestions:** Provides efficient autocomplete suggestions (`fetchCompanySuggestions`) for the search bar.
                                *   **Querying:** Handles complex Firestore queries for name-based filtering and limiting.
                    *   **`pagination/`:**
                        *   **`index.ts`:** The barrel file for the components directory.input placeholders.
                        *   **`pagination-handler.ts`:** Implements advanced pagination strategies.
                            *   **Responsibilities:**
                                *   **Hybrid Strategy:** Supports both cursor-based (for infinite keys) and offset/page-based (limited depth) pagination.
                                *   **Optimization:** Optimizes queries to minimize reads and handle large datasets efficiently.
                        *   **`cursor-manager.ts`:** Manages cursor encoding/decoding.
                            *   **Responsibilities:**
                                *   **Encoding:** Encodes composite keys (e.g., `normalizedName` + `id`) into opaque Base64 strings.
                                *   **Safety:** Ensures cursors are tamper-evident and parseable.
                    *   **`validators/`:**
                        *   **`index.ts`:** The barrel file for the components directory.input placeholders.
                        *   **`company-validators.ts`:** Domain-specific validation logic.
                            *   **Responsibilities:**
                                *   **Input Safety:** Validates `CreateCompanyDTO` and `UpdateCompanyDTO` inputs.
                                *   **Security:** Enforces anti-XSS patterns and sanitizes inputs to prevent mass assignment attacks.
        *   **`types/`:**
            *   **`index.ts`:** The barrel file for the components directory.input placeholders.
            *   **`company.ts`:**
                *   **Responsibilities:**
                    *   **Domain Modeling:** Defines the `Company` entity and its `Zod` schema (`CompanySchema`), including rich metadata like `difficultyCounts` and `recencyCounts`.
            *   **`job-application.ts`:**
                *   **Responsibilities:**
                    *   **Application Tracking:** Defines data structures for tracking user job applications (`JobApplication`).
                    *   **Validation:** Exports `JobApplicationSchema` and status enums to ensure data integrity for the application tracker.
                    *   **UI Helpers:** Provides `JOB_APPLICATION_STATUS_OPTIONS` for consistent dropdown menus.
        *   **`interfaces/`:** Defines the contracts for repositories and services to enable dependency injection and mockability.
            *   **`company.repository.interface.ts`:**
                *   **Responsibilities:**
                    *   **Contract Definition:** Defines `ICompanyRepository` extending `IBaseRepository` for standardized data access.
                    *   **DTOs:** Exports data transfer objects for creation (`CreateCompanyDTO`) and updates (`UpdateCompanyDTO`).
                    *   **Return Types:** Defines response structures like `PaginatedCompaniesResponse`.
            *   **`company.service.interface.ts`:**
                *   **Responsibilities:**
                    *   **Business Logic Contract:** Defines `ICompanyService` for company-related business operations.
                    *   **Result Pattern:** Enforces the use of `Result<T, ServiceError>` for robust error handling.
                    *   **Caching:** Includes methods for cache management and revalidation (`revalidateCompaniesPage`).
            *   **`index.ts`:** Barrel file for exporting interfaces.
        *   **`mappers/`:**
            *   **`company.mapper.ts`:** Handles conversions between Domain Entities, DTOs, and Firestore Documents.
                *   **Responsibilities:**
                    *   **Entity Mapping:** Converts raw Firestore documents (`CompanyDocument`) into rich domain entities (`toDomain`).
                    *   **Persistence Mapping:** Prepares domain entities for storage by flattening them into database-ready structures (`toDocument`).
                    *   **DTO Conversion:** Bridges the gap between the domain core and the UI layer by converting entities to/from DTOs (`toDTO`, `fromDTO`).
                    *   **Direct Mapping:** Provides optimized shortcuts (`documentToDTO`) for read-only operations effectively bypassing domain overhead when not needed.
            *   **`index.ts`:** Barrel export for company mapping utilities.
        *   **`di.ts`:** Dependency Injection configuration for the companies feature.
            *   **Responsibilities:**
                *   **Service Registration:** Registers the `CompanyService` and `CompanyRepository` implementations with the global DI container.
                *   **Lifecycle Management:** Configures services as singletons to ensure efficient resource usage.
                *   **Dependency Wiring:** Automatically resolves and injects the repository dependency into the service layer.
    *   **`problems`:** The core module for interview problems. It handles complex state, data transformation (mappers), and problem-specific data access.
        *   **`actions/`:** Server actions acting as the entry point for problem operations.
            *   **`problem.actions.ts`:** Exports server actions that act as the primary bridge between frontend components and the backend services.
                *   **Responsibilities:**
                    *   **Input Validation:** Enforces constraints (e.g., required fields, link format) to ensure data integrity during problem submission.
                    *   **Service Orchestration:** Calls core service methods (`problemService`, `companyService`) to perform CRUD operations and data retrieval.
                    *   **Cache Management:** Triggers on-demand revalidation (`revalidatePath`, `revalidateTag`) to ensure UI consistency after mutations.
                    *   **Observability:** Logs errors and context using `handleServerActionError` for debugging.
                    *   **Standardization:** Wraps responses in a unified `ApiResponse` format for consistent client-side error handling.
        *   **`constants/`:**
            *   **`problem-constants.ts`:**
                *   **Responsibilities:**
                    *   **Configuration Constants:** Defines application-wide limits like `MAX_COMPANIES_PER_PROBLEM` and `MAX_SEARCH_TERM_LENGTH` to ensure stability and prevent abuse.
                    *   **UI Configuration:** Provides structured data for UI elements such as usage definitions (`lastAskedPeriodOptions`) and status options (`PROBLEM_STATUS_OPTIONS`).
                    *   **Data Mapping:** Offers helper objects (`lastAskedPeriodDisplayMap`, `PROBLEM_STATUS_DISPLAY`) to map internal values to user-friendly labels, icons, and colors, ensuring consistent presentation across the app.
            *   **`index.ts`:** Barrel file for exporting constants.
        *   **`components/`:**
            *   **`all-problems-list/`:** A comprehensive list view for browsing and filtering coding problems.
                *   **`all-problems-list.tsx`:** The main container component that connects data fetching logic with the presentation layer.
                    *   **Responsibilities:**
                        *   **State Integration:** Connects the `useProblemList` hook to the UI, passing down data, loading states, and filter actions.
                        *   **Auth Integration:** Injects the current user's ID (from `useAuth`) into the view to enable personalized features like bookmarks and status tracking.
                        *   **Decoupling:** Separates the "smart" container logic from the "dumb" presentational `ProblemListView`.
                *   **`problem-list-view.tsx`:** The presentational component responsible for rendering the problem grid, controls, and empty states.
                    *   **Responsibilities:**
                        *   **Layout Orchestration:** Renders the `ProblemListControls` (lazily loaded), the list of `ProblemCard`s, and the infinite scroll loader.
                        *   **Empty State Handling:** Displays a user-friendly "No problems found" message with a clear action to reset filters when no results match.
                        *   **Data Derived UI:** Computes the runtime status (solved/attempted) and bookmark state for each problem by merging static prop data with real-time `globalStats`.
                        *   **Ad Integration:** Injects sponsored content (`AdPlaceholder`) at fixed intervals (every 25 items) within the list.
                        *   **Performance:** Uses `React.memo` and `dynamic` imports to optimize rendering and bundle size.
            *   **`ai-tooltip-content/`:**
                *   **`ai-tooltip-content.tsx`:** Renders dynamic tooltip text for AI actions, handling states like authentication and rate limits.
                    *   **Responsibilities:**
                        *   **State Feedback:** Dynamically updates tooltip text based on user login status ("Login to use...") and AI cooldowns.
                        *   **Cooldown Integration:** Consumes `useAICooldown` to display precise remaining time when the feature is rate-limited.
                        *   **Optimization:** Memoized (`React.memo`) to prevent unnecessary re-renders during parent updates.
                *   **`index.ts`:** Barrel file for exporting the component.
            *   **`all-problems-list/`:**
                *   **`all-problems-list.tsx`:** Container component that connects the `ProblemListView` with the `useProblemList` hook.
                    *   **Responsibilities:**
                        *   **State Integration:** Passes data and handlers from `useProblemList` (data fetching, filtering, stats) to the presentation layer.
                        *   **Separation of Concerns:** Keeps logic (hook) and presentation (view) separate.
                *   **`problem-list-view.tsx`:** The purely presentational component for the problems list.
                    *   **Responsibilities:**
                        *   **Rendering:** Displays the grid/list of `ProblemCard`s.
                        *   **Ads & Placeholders:** Injects `AdPlaceholder` components into the list.
                        *   **Lazy Loading:** Dynamically imports `ProblemListControls` with suspense skeletons.
                        *   **Error Boundary:** Wraps each card in an `ErrorBoundary` for resilience.
            *   **`company-badge/`:**
                *   **`company-badge.tsx`:** A memoized, clickable badge component that links to a specific company's problem page.
                    *   **Responsibilities:**
                        *   **Navigation:** Renders a secure Next.js `Link` to `/company/${companyId}`.
                        *   **Event Handling:** Implements `stopPropagation` to allow safe nesting within other clickable components (e.g., problem cards) without triggering parent events.
                        *   **Visual Formatting:** Automatically formats the company slug (replacing hyphens with spaces) and applies consistent styling (muted colors, rounded borders, responsive text).
                        *   **Performance:** Wrapped in `React.memo` to strictly prevent re-renders unless the `companyId` changes, optimizing list performance.
                *   **`index.ts`:** Exports the component.
            *   **`difficulty-badge/`:**
                *   **`difficulty-badge.tsx`:** Displays a colored badge indicating the problem's difficulty level.
                    *   **Responsibilities:**
                        *   **Visual Distinction:** Uses semantic colors (Green/Yellow/Red) to represent Easy/Medium/Hard difficulties.
                        *   **Styling:** Applies consistent badge styling with memoization for performance.
                        *   **Accessibility:** Renders clear text labels for difficulty levels.
                *   **`index.ts`:** Exports the component.
            *   **`problem-list-container.tsx`:** A server component acting as the primary entry point and data controller for the problems listing page.
                *   **Responsibilities:**
                    *   **Initial Data Fetching:** Fetches the first page of problems server-side using `getAllProblemsPaginated` to enable instant content rendering and SEO.
                    *   **Error Handling:** Validates the service response and throws structured errors if data retrieval fails, triggering Next.js error boundaries.
                    *   **Structured Data (SEO):** Generates and injects rich JSON-LD (Schema.org) for both `ItemList` (the problem catalog) and `BreadcrumbList` to enhance search engine visibility.
                    *   **Client Hydration:** Initializes the interactive `AllProblemsList` client component with pre-fetched data, total page counts, and default filter configurations.
            *   **`problem-list-controls/`:**
                *   **`problem-list-controls.tsx`:** A set of UI controls for filtering and sorting the problem list.
                    *   **Responsibilities:**
                        *   **Filter Management:** Provides interactive chips for filtering by Difficulty (Easy, Medium, Hard), Recency (Last Asked), and Status (Solved, Attempted, etc.).
                        *   **Controlled Component:** Operates as a pure presentation component, delegating state management and filter logic to its parent via callbacks.
                        *   **UX/UI:** Uses accessible `Chip` components and a "Clear filters" action to manage complex filter states.
                        *   **Optimization:** Memoized with `React.memo` to prevent re-renders when parent state updates unrelated to filters.
                *   **`index.ts`:** Exports the component.
            *   **`problem-list/`:**
                *   **`problem-list.tsx`:** Renders a filtered, paginated list of problems for a company.
                    *   **Responsibilities:**
                        *   **State Management:** Orchestrates infinite scrolling (`IntersectionObserver`), optimistic updates for problem statuses, and real-time filtering via URL parameters.
                        *   **Data Merging:** Merges server-side initial data with client-side user stats (solved/attempted) to ensure up-to-date UI.
                        *   **Performance:** Implements `React.memo` and deferred loading to optimize re-renders for large lists.
                        *   **Feedback:** Provides loading indicators (skeletons, spinners) and error toasts during data fetching.
                *   **`problem-list-error-fallback.tsx`:** A robust error state component for the problem list.
                    *   **Responsibilities:**
                        *   **User Feedback:** Displays a clear error message and icon when the problem list fails to load.
                        *   **Recovery:** Provides a "Reload Page" button to help users recover from transient network errors.
            *   **`problem-ai-actions/`:**
                *   **`problem-ai-actions.tsx`:** Renders action buttons for AI-powered features (Similar Problems, Hints) related to a specific problem.
                    *   **Responsibilities:**
                        *   **User Interaction:** Provides "Similar" and "Hints" buttons to trigger AI capabilities.
                        *   **Access Control:** Checks for user authentication before allowing access to AI features, prompting login if necessary.
                        *   **State Management:** Orchestrates the visibility of `SimilarProblemsDialog` and `ProblemInsightsDialog` using `useAIFeatures`.
                        *   **Performance:** Uses dynamic imports for heavy dialog components to optimize initial page load.
                *   **`index.ts`:** Exports the component.
            *   **`problem-card/`:**
                *   **`problem-card.tsx`:** A redesigned, modern component for displaying a single coding problem in a customized table-row-like format.
                    *   **Responsibilities:**
                        *   **Data Presentation:** displays problem details with visual indicators for difficulty (colored badges) and status (icons).
                        *   **User Interactions:** detailed "Expanded" view with tags and descriptions, plus quick actions for bookmarks and status updates.
                        *   **Optimization:** Implements lazy loading for heavy sub-components (`ProblemAIActions`) and memoization to prevent unnecessary re-renders.
                        *   **Composition:** Orchestrates sub-components like `CompanyBadge`, `TagBadge`, and `ProblemAIActions` into a cohesive unit.
                *   **`problem-card-error-fallback.tsx`:** Fallback UI when the card fails to render.
                    *   **Responsibilities:**
                        *   **Error Handling:** Renders a safe, contained error state to prevent the entire list from crashing.
            *   **`problem-status-icon/`:**
                *   **`problem-status-icon.tsx`:** Renders the visual status indicator for a problem (solved, attempted, todo) with a tooltip.
                    *   **Responsibilities:**
                        *   **Visual Representation:** Renders specific icons and colors for problem statuses (Solved, Attempted, Todo).
                        *   **User Feedback:** Displays a tooltip with the status label on hover for clarity.
                        *   **Performance:** Memoized (`React.memo`) to prevent unnecessary re-renders.
                        *   **Validation:** Safely handles invalid or "none" statuses by returning null.
                *   **`index.ts`:** Exports the component for external use.
            *   **`problem-info-card/`:**
                *   **`problem-info-card.tsx`:** A detailed card component for displaying problem information in a list view.
                    *   **Responsibilities:**
                        *   **Information Display:** Clearly presents the problem title (linked), difficulty badge, and status icon.
                        *   **Metadata Rendering:** Displays tags, associated companies, and the "last asked" period for interaction context.
                        *   **User Interactions:** Integrates `useProblemInteractions` to handle bookmark toggling and status updates (Solved/Attempted/Todo) directly from the card.
                        *   **Navigation:** Provides a direct "Solve" link to the problem on external platforms.
                *   **`index.ts`:** Barrel file for exporting the component.
            *   **`problem-submission-form/`:**
                *   **`problem-submission-form.tsx`:** A comprehensive form for user contributions.
                    *   **Responsibilities:**
                        *   **Data Capture:** Collects problem details (title, link, difficulty, company, tags).
                        *   **Validation:** Uses `zod` schema to ensure data integrity before submission.
                        *   **Interaction:** Handles form submission state (loading) and provides toast notifications for success/error.
                        *   **Integration:** Calls `addProblem` server action to persist data.
            *   **`tag-badge/`:**
                *   **`tag-badge.tsx`:** Displays a simple, styled badge for problem tags (e.g., "Array", "DP").
                    *   **Responsibilities:**
                        *   **Visuals:** Standardized semantic styling for tags.
                        *   **Performance:** Memoized for efficient rendering in lists.
            *   **`index.ts`:**
                *   **Responsibilities:**
                    *   **Module Exposure:** Acts as a centralized barrel file, re-exporting all sub-components (cards, badges, lists, controls) to provide a clean public API for the module.
        *   **`hooks/`:**
            *   **`use-problem-interactions.tsx`:** Manages user interactions with a single problem, such as bookmarking and status updates.
                *   **Responsibilities:**
                    *   **State Management:** Handles optimistic UI updates for bookmark toggles and status changes to ensure immediate user feedback.
                    *   **Authentication:** Enforces login requirements, prompting unauthenticated users to sign in before performing actions.
                    *   **Feedback:** Displays toast notifications for success or failure of operations.
                    *   **Synchronization:** Syncs local state with props to handle potential desyncs and ensure consistency.
            *   **`use-problem-list.ts`:** A centralized hook for managing the state and logic of the problem list view.
                *   **Responsibilities:**
                    *   **Data Fetching:** Orchestrates fetching of problems based on filters (difficulty, status, recency) and pagination.
                    *   **Infinite Scroll:** Manages the `IntersectionObserver` logic to trigger "load more" actions when scrolling.
                    *   **Global Stats:** Integrates user-specific data (solved/attempted/bookmarked) into the general problem list for personalized indicators.
                    *   **Filter Management:** Parses and updates URL search parameters to reflect current filter states.
        *   **`interfaces/`:** Defines the contracts for repositories and services to ensure loose coupling and testability.
            *   **`problem.repository.interface.ts`:**
                *   **Responsibilities:**
                    *   **Contract Definition:** Defines `IProblemRepository` extending `IBaseRepository`, specifying operations for Problem entities.
                    *   **Advanced Querying:** detailed signatures for `getProblemsByCompany` and `getAllProblemsPaginated` with complex filtering (`ProblemFilterParams`).
                    *   **DTOs:** Exports `CreateProblemDTO` and `UpdateProblemDTO` for type-safe data transfer.
            *   **`problem.service.interface.ts`:**
                *   **Responsibilities:**
                    *   **Service Contract:** Defines `IProblemService` for business logic operations, mirroring repository capabilities with added service-layer protections.
                    *   **Result Pattern:** Enforces usage of `Result<T, ServiceError>` for all operations to ensure consistent error handling.
                    *   **Input Standardization:** Defines input interfaces like `GetPublicProblemsParams` and `CreateProblemInput` to validate service requests.
            *   **`index.ts`:** Barrel file for exporting interfaces.
        *   **`mappers/`:**
            *   **`problem.mapper.ts`:** Handles conversions between Domain Entities, DTOs, and Firestore Documents.
                *   **Responsibilities:**
                    *   **Domain to DTO:** Maps `Problem` entities to `LeetCodeProblem` or `ProblemSummaryDTO` for frontend consumption, handling capitalization and default values.
                    *   **Domain to Persistence:** Converts `Problem` entities to `ProblemDocument` for Firestore storage, handling date normalization and ID omission.
                    *   **Persistence to Domain:** Hydrates `Problem` entities from Firestore documents (`toDomain`), ensuring correct value object instantiation (Difficulty, ProblemStatus).
                    *   **DTO to Domain:** Creates `Problem` entities from external DTOs (e.g., from LeetCode), useful for data ingestion.
            *   **`index.ts`:** Barrel file exporting the mapper class and types.
        *   **`services/`:**
            *   **`problem.service.ts`:** The central business logic layer for problem management.
                *   **Responsibilities:**
                    *   **Service Orchestration:** Coordinates data retrieval by calling repository methods (`getPublicProblems`, `getAllProblemsPaginated`).
                    *   **Cache Management:** Implements robust caching strategies using `cacheManager` to reduce database load, with specific TTLs and invalidation tags (e.g., `problems-company-{id}`).
                    *   **Performance Optimization:** Wraps service methods with React `cache()` to deduplicate requests in Server Components.
                    *   **Error Handling:** Catches execution errors and returns standardized `Result` objects (`success`/`failure`) to ensure safe failure handling.
            *   **`user-problem-bridge.service.ts`:** A specialized bridge service to decouple problems from user profiles.
                *   **Responsibilities:**
                    *   **Dependency Decoupling:** Prevents circular dependencies between `ProblemService` and `UserService`.
                    *   **Data Enrichment:** Merges raw problem data with user-specific context (bookmarks, completion status) via `enrichProblemsWithUserData`.
                    *   **Aggregation:** Orchestrates parallel fetches to `problemService` and `userService` to build personalized problem views (`getAllProblemsPaginatedWithUserStatus`).
        *   **`repositories/`:**
            *   **`problem.repository.ts`:** The primary data access layer for Problem entities, implementing complex querying and optimization strategies.
                *   **Responsibilities:**
                    *   **CRUD Operations:** Implements standard `findById`, `save`, `update`, and `delete` methods for `Problem` entities.
                    *   **Advanced Querying:** Provides `getAllProblemsPaginated` and `getProblemsByCompany` with filtering (difficulty, last asked), sorting, and search capabilities.
                    *   **Query Optimization:** Implements intelligent query construction (`fetchProblemsByCompanyOptimized`) to leverage Firestore indexes and avoid costly reads.
                    *   **Data Integrity:** Enforces server-side generation of `normalizedTitle` and `slug` to prevent search poisoning and ensure URL consistency.
                    *   **Batch Operations:** Handles batched retrieval via `getProblemsByIds` to work around Firestore's `in` query limits (chunking by 30).
        *   **`types/`:**
            *   **`problem.types.ts`:** Defines the core data structures and validation schemas for LeetCode problems within the application.
                *   **Responsibilities:**
                    *   **Domain Models:** Defines `LeetCodeProblem` which is the central interface for problem data.
                    *   **Data Transfer Objects (DTOs):** Defines `ProblemSummaryDTO` for listing views and `CreateProblemDTO`/`UpdateProblemDTO` schemas.
                    *   **Validation:** Exports Zod schemas (`LeetCodeProblemSchema`, `CreateProblemSchema`, `SafeTitleSchema`, etc.) to ensure data integrity for inputs and database records.
                    *   **Filtering & Sorting:** Defines types for list management (`ProblemListFilters`, `SortKey`, `DifficultyFilter`) to support the UI's search/sort functionality.
                    *   **Security:** Includes strict regex-based validation (`SafeDescriptionSchema`) to prevent XSS and injection attacks in user-submitted content.
                    *   **Enums/Constants:** Defines valid values for difficulties, status, and periods (`VALID_DIFFICULTIES`, `VALID_LAST_ASKED_PERIODS`).
            *   **`index.ts`:** Barrel file for exporting types.
        *   **`utils/`:**
            *   **`index.ts`:** Barrel file for exporting utilities.
            *   **`problem-filters/`:** Implements a strategy pattern for filtering problems, allowing for extensible and type-safe query construction.
                *   **`implementations.ts`:**
                    *   **Responsibilities:**
                        *   **Concrete Strategies:** Implements `DifficultyFilterImplementation` and `LastAskedFilterImplementation`.
                        *   **Query Generation:** Converts filter values (e.g., specific difficulties) into Firestore `QueryConstraint`s (`where`, `in`).
                        *   **In-Memory Matching:** Provides `matches` methods to filter `ProblemSummaryDTO` objects in memory, supporting semi-optimized fetch strategies.
                        *   **Validation:** Includes `isValidValue` type guards to ensure runtime values match expected schemas (e.g., verifying `DifficultyFilter[]`).
                *   **`registry.ts`:**
                    *   **Responsibilities:**
                        *   **Central Management:** Register and retrieves active `ProblemFilter` instances.
                        *   **Dynamic Application:** Iterates through registered filters to generate a composite list of Firestore constraints based on active filter params.
                        *   **Fallback Filtering:** Provides `filterInMemory` to refine results when database-level filtering is insufficient or optimization requires fetching a broader set first.
                *   **`types.ts`:**
                    *   **Responsibilities:**
                        *   **Contract Definition:** Defines the `ProblemFilter<T>` interface, enforcing a standard structure (`getConstraints`, `matches`, `isValidValue`) for all filter strategies.
                *   **`index.ts`:** Barrel file for the filter submodule.
    *   **`profile`:** Manages user-specific data, account settings, and learning progress. The feature follows a clear separation of concerns with a Service-Repository pattern, further decomposing the repository into specialized persistent operations.
        *   **`actions/`:**
            *   **`user.actions.ts`:** Server actions for managing user data.
                *   **Responsibilities:**
                    *   **User interaction:** Handles UI-driven actions like toggling bookmarks (`toggleBookmarkProblemAction`) and setting problem status (`setProblemStatusAction`).
                    *   **Data Aggregation:** Provides optimized data fetching for client hydration (`getUserProblemStatusesForIdsAction`).
                    *   **Security:** Validates that the requested `userId` matches the authenticated session to prevent IDOR.
                    *   **Cache Management:** Triggers `revalidateTag` to update cached user data after mutations.
        *   **`components/`:**
            *   **`user-info-card.tsx`**: Displays key user information, allows for editing the display name, and provides a logout button.
                *   **Responsibilities:**
                    *   **Profile Display:** Renders the user's avatar (with fallback), display name, email, and "Member since" date.
                    *   **Interactive Editing:** Provides an inline form to edit the user's display name with character counting and validation.
                    *   **Session Management:** Includes a logout button that triggers the authentication logout flow with loading state feedback.
                    *   **Responsive Design:** Features a mobile-optimized layout that grid-stacks actions on smaller screens.
                    *   **Performance:** Uses `React.memo` with a custom comparison function to prevent unnecessary re-renders when unrelated props change.
            *   **`progress-stats.tsx`**: A component that displays a user's problem-solving statistics in a clear, card-based format.
                *   **Responsibilities:**
                    *   **Visual Metrics:** Renders counts for "Solved", "Attempted", and "To-Do" problems with semantic icons and distinct colors.
                    *   **Data Layout:** Uses a responsive grid that adapts from a single column on mobile to three columns on desktop.
                    *   **Performance:** Memoized with `React.memo` to ensure it only updates when actual statistics change.
            *   **`education-experience-section.tsx`**: Manages and displays the user's academic qualifications.
                *   **Responsibilities:**
                    *   **History Visualization:** Renders a list of education entries (Degree, Major, School, GPA) using memoized sub-components.
                    *   **Entry Creation:** Features a dialog-based form (`FormProvider`, `react-hook-form`) for adding new educational background.
                    *   **Loading/Empty States:** Integrates with `ExperienceListSkeleton` for data fetching and provides a call-to-action for empty profiles.
                    *   **User Feedback:** Shows submission status (saving...) and handles form validation errors.
            *   **`work-experience-section.tsx`**: Displays and manages professional work experience entries.
                *   **Responsibilities:**
                    *   **Professional Timeline:** Renders job titles, company names, date ranges, and key responsibilities in a structured list.
                    *   **CRUD Interface:** Provides a dialog to add new work history with validation for required fields like job title and company.
                    *   **Rich Content:** Supports multi-line "Responsibilities" descriptions using a `Textarea` with character counts.
                    *   **State Management:** Handles loading skeletons and empty state messaging to guide users in building their profile.
            *   **`strategy-lists-section.tsx`**: A sophisticated section for viewing and managing AI-generated company interview strategies.
                *   **Responsibilities:**
                    *   **Hierarchical Display:** Organizes saved strategies by company using an `Accordion` component for space efficiency.
                    *   **Interactive To-Do Lists:** Allows users to toggle completion status for individual strategy items with immediate optimistic UI feedback.
                    *   **Content Rendering:** Safely renders rich markdown content for preparation strategies and focus topics using `react-markdown`.
                    *   **Performance Engineering:** Implements advanced memoization and `useRef` stabilization for callbacks to prevent massive re-renders across all strategy lists when a single item is toggled.
            *   **`profile-problem-list.tsx`**: Displays curated lists of problems (e.g., Bookmarks, Solved) from a user's perspective.
                *   **Responsibilities:**
                    *   **Problem Grid:** Composes multiple `ProblemCard` components into a single view for specific user segments.
                    *   **Personalization:** Passes user-specific data like `isBookmarked` and `currentStatus` to each card to reflect individual progress.
                    *   **Empty State Guidance:** Provides specialized empty states with icons and links (e.g., "Browse Problems") to encourage engagement.
                    *   **Optimization:** Uses `React.memo` to ensure the list only updates when the underlying problem data changes.
            *   **`profile-page/`:**
                *   **`index.ts`:**
                    *   **Responsibilities:**
                        *   **Barrel Export:** Serves as the public interface for profile page layout components, re-exporting `ProfileContent`, `ProfileHeader`, and `ProfileTabs`.
                *   **`profile-content.tsx`:**
                    *   **Responsibilities:**
                        *   **Layout Container:** Wraps the profile navigation and active tab content in a styled container.
                        *   **Tab Orchestration:** Integrates with the `Tabs` UI component to manage active tab state and pass counts to the navigation.
                *   **`profile-header.tsx`:**
                    *   **Responsibilities:**
                        *   **User Overview:** Displays user identity (card) and high-level progress statistics.
                        *   **Action Handling:** Orchestrates logout flows and display name updates via `UserInfoCard`.
                        *   **Sticky UI:** Implements a sticky sidebar-like layout for persistent user information on desktop.
                *   **`profile-tabs.tsx`:**
                    *   **Responsibilities:**
                        *   **Navigation UI:** Renders the tab buttons with icons and dynamic counts for each section (Bookmarks, Solved, etc.).
                        *   **Responsive Tabs:** Uses a grid layout that adapts the number of columns based on screen size for optimal mobile navigation.
            *   **`tabs/`:**
                *   **`bookmarks-tab.tsx`:** Displays a user-friendly view of all bookmarked problems.
                    *   **Responsibilities:**
                        *   **List Rendering:** Integrates `ProfileProblemList` to show bookmarked problems with their current status.
                        *   **State Management:** Passes handlers for bookmark toggling and status updates to child components.
                        *   **Error Handling:** Wrapped in an `ErrorBoundary` with a specialized fallback for the bookmarks view.
                        *   **Empty State:** Provides encouraging messaging and icons for users who haven't bookmarked any problems yet.
                *   **`education-tab.tsx`:** A consolidated view for managing both academic and professional background.
                    *   **Responsibilities:**
                        *   **Section Integration:** Combines `EducationExperienceSection` and `WorkExperienceSection` into a single "Background" tab.
                        *   **Form Context:** Provides `FormProvider` wrappers for both education and work experience forms.
                        *   **Data Orchestration:** Manages props and handlers for adding/displaying entries across both domains.
                        *   **Resiliency:** Includes an `ErrorBoundary` to isolate failures within the background tab from the rest of the profile.
                *   **`overview-tab.tsx`:** A placeholder for future profile overview functionality.
                    *   **Responsibilities:**
                        *   **Forward Compatibility:** Provides a shell for the "Overview" tab to be populated as the feature matures.
                *   **`progress-tab.tsx`:** A dynamic component that handles various problem labels (Solved, Attempted, To-Do).
                    *   **Responsibilities:**
                        *   **Dynamic Configuration:** Reconfigures its title, empty states, and icons based on the active progress segment (`tabValue`).
                        *   **Status Management:** Connects `ProfileProblemList` with user-specific problem data filtered by status.
                        *   **User Feedback:** Provides descriptive empty states to guide users toward their next practice goal.
                *   **`strategies-tab.tsx`:** Manages the display of AI-generated interview strategies.
                    *   **Responsibilities:**
                        *   **Lazy Loading:** Uses Next.js `dynamic` to load the heavy `StrategyListsSection` only when needed, showing a skeleton during load.
                        *   **Interaction Bridge:** Connects to strategy-specific handlers for toggling todo items.
                *   **`index.ts`:**
                    *   **Responsibilities:**
                        *   **Public API:** Acts as a barrel file for all profile tab components, facilitating clean imports in the main profile page.
            *   **`profile-tab-error-fallback.tsx`**: A specialized error boundary component for profile tab content.
                *   **Responsibilities:**
                    *   **Graceful Recovery:** Provides a user-friendly error message and a "Try Again" button to re-trigger failed tab loads.
                    *   **Visual Alert:** Uses a destructive color scheme and alert icons to clearly signal a loading failure.
        *   **`services/`:**
            *   **`user.service.ts`:** Usage of the Repository pattern to implement business logic.
                *   **Responsibilities:**
                    *   **Caching:** Implements `SimpleLRUCache` to cache global stats (`getUserGlobalProblemStats`) for performance.
                    *   **Event Emission:** Publishes domain events (e.g., `user:bookmark_toggled`) to the application event bus.
                    *   **Error Handling:** Wraps repository calls in `Result` types for consistent error management.
        *   **`repositories/`:** The data access layer for user-specific data, following a highly modular architecture that decomposes complex persistence logic into specialized domain-aware sub-modules.
            *   **`user.repository.ts`:** The primary orchestrator and entry point for the profile repository layer.
                *   **Responsibilities:**
                    *   **Modular Orchestration:** Acts as a Facade that delegates all CRUD, query, and validation operations to specialized sub-module implementations (Operations, Queries, Validators).
                    *   **Security Perimeter:** Enforces uniform authorization checks across all data access methods using the `UserValidators` module to ensure users can only access their own data.
                    *   **Dependency Management:** Manages the instantiation and lifecycle of all sub-module dependencies via its constructor.
                    *   **Interface Implementation:** Implements the `IUserRepository` contract, providing a unified API for the service layer while hiding the underlying modular complexity.
            *   **Modular Implementation (Sub-modules):**
                *   **`user/`:** Handles core user document lifecycle management.
                    *   **`user-operations.ts`:** Implements core CRUD operations and handles authentication profile synchronization.
                        *   **Responsibilities:**
                            *   **Data Retrieval:** Fetches user documents by ID and filters sensitive fields for non-owner access.
                            *   **Profile Management:** Handles saving new users and updating existing profile data (email, display name, photo URL).
                            *   **Auth Synchronization:** Syncs user profile data from Firebase Auth to Firestore, ensuring consistency.
                            *   **Validation & Security:** Sanitizes user inputs to prevent XSS and enforces session-based UID derivation.
                    *   **`user-queries.ts`:** Manages user search and listing (currently restrictive to prevent data enumeration).
                        *   **Responsibilities:**
                            *   **Query Abstraction:** Defines the interface for user-related query operations.
                            *   **Privacy Enforcement:** Explicitly disables multi-user listing (`findAll`) to protect user data from scraping and enumeration.
                            *   **Graceful Failures:** Returns empty results instead of throwing errors to maintain compatibility with generic components.
                    *   **`user-validators.ts`:** Enforces security policies, including ownership checks and XSS prevention.
                        *   **Responsibilities:**
                            *   **Authorization Logic:** Verifies if the currently authenticated user has permission to access or modify specific user data (ownership check).
                            *   **Input Sanitization:** Validates text strings for common XSS characters (e.g., `<`) to ensure data integrity during profile updates.
                            *   **Security Predicates:** Provides reusable validation methods used across the user repository layer.
                    *   **`index.ts`:** Central export point for the user repository sub-module.
                        *   **Responsibilities:**
                            *   **Module Aggregation:** Re-exports all functionality from `user-operations`, `user-queries`, and `user-validators`.
                            *   **Public API Definition:** Acts as the entry point for other parts of the system to consume user repository logic.
                *   **`bookmarks/`:** Manages problem bookkeeping.
                    *   **`bookmark-operations.ts`:** Handles the atomic toggling of bookmarks and retrieval of detailed bookmark metadata.
                        *   **Responsibilities:**
                            *   **Data Retrieval:** Fetches bookmarked problem info for a user with pagination (MAX_PAGE_SIZE = 50) and ordering by recency.
                            *   **Atomic Operations:** Uses Firestore `writeBatch` to ensure consistent updates when toggling bookmarks.
                            *   **State Synchronization:** Manages the `bookmarkedProblems` sub-collection while simultaneously updating the `bookmarkedProblemIds` aggregate list in `problemStats`.
                            *   **Security & Logging:** Implements robust error handling and logs sensitive failures via `Logger`, returning generic messages to the client.
                    *   **`bookmark-queries.ts`:** Provides efficient batch-lookup strategies for bookmarks using chunked Firestore queries.
                        *   **Responsibilities:**
                            *   **Batch Lookup:** Implements optimized existence checks for multiple problem IDs using Firestore `in` queries.
                            *   **Chunking:** Handles Firestore's 30-item limit for `in` queries by automatically chunking input IDs and parallelizing requests.
                            *   **Data Transformation:** Converts query snapshots into a performant `Set<string>` for quick O(1) lookups in the UI layer.
                    *   **`index.ts`:** Barrel file for the bookmarks repository sub-module.
                        *   **Responsibilities:**
                            *   **Public API:** Acts as a barrel file, exporting the implementation and interfaces for bookmark operations and queries to the rest of the profile module.
                *   **`problem-statuses/`:** Tracks user progress across the problem catalog.
                    *   **`status-operations.ts`:** Manages problem status transitions (solved, attempted) and updates aggregate statistics for historical tracking.
                        *   **Responsibilities:**
                            *   **Data Retrieval:** Fetches all individual problem statuses for a user (e.g., solved, attempted) via `getAllUserProblemStatuses`.
                            *   **Aggregate Management:** Retrieves global problem statistics from a centralized aggregate document.
                            *   **Atomic Updates:** Uses `writeBatch` to ensure that setting a problem status and updating aggregate stats are handled atomically.
                            *   **Persistence Strategy:** Uses `arrayUnion` to maintain a historical record of all attempted or solved problems in aggregates.
                    *   **`status-queries.ts`:** Implements optimized batch-fetching for problem statuses to support list hydration.
                        *   **Responsibilities:**
                            *   **Batch Retrieval:** Fetches problem statuses for a specific set of problem IDs.
                            *   **Chunked Querying:** Handles Firestore's 30-item `in` query limit by chunking input IDs.
                            *   **Data Transformation:** Maps Firestore snapshots into unified `UserProblemStatusInfo` records.
                    *   **`index.ts`:**
                        *   **Responsibilities:**
                            *   **Module Aggregation:** Re-exports all functionality from operations and queries for the profile feature.
                *   **`education/`**: Handles structured academic history data.
                    *   **`education-operations.ts`**: Manages the retrieval and persistence of educational background.
                        *   **Responsibilities**:
                            *   **Data Retrieval**: Fetches a user's chronological education history (`getUserEducation`) with pagination (MAX_PAGE_SIZE = 50) and reverse chronological ordering.
                            *   **Persistence**: Securely adds new education entries (`addUserEducation`) using Firestore's `addDoc` with automatic `serverTimestamp`.
                            *   **Security Integration**: Delegates to `EducationValidators` for input sanitization and schema enforcement before database writes.
                            *   **Standardized Responses**: Returns unified result objects with clear error messaging for the service layer.
                    *   **`education-validators.ts`**: Enforces domain rules and security policies for education data.
                        *   **Responsibilities**:
                            *   **Schema Enforcement**: Uses Zod (`EducationExperienceSchema`) to validate data integrity and type safety.
                            *   **XSS Prevention**: Implements strict content filtering to block malicious characters (e.g., `<`) in user-submitted text.
                            *   **Security Logging**: Monitors and logs validation failures to detect potential abuse attempts.
                    *   **`index.ts`**:
                        *   **Responsibilities**:
                            *   **Module Exposure**: Provides a centralized entry point by exporting operations and validators for consumption by the main `UserRepository`.
                *   **`work-experience/`**: Handles structured professional background data.
                    *   **`experience-operations.ts`**: Manages the creation and retrieval of professional history.
                        *   **Responsibilities:**
                            *   **Data Retrieval:** Fetches user's chronological work experience (`getUserWorkExperience`) with pagination and ordering.
                            *   **Persistence:** Securely adds new work experience entries (`addUserWorkExperience`) with automatic server timestamps.
                            *   **Validation & Security:** Integrates with `ExperienceValidators` to ensure data integrity and prevent XSS.
                            *   **Error Handling:** Provides generic error messages to clients while logging detailed background errors.
                    *   **`experience-validators.ts`**: Enforces domain-specific validation rules and security scrubbing for experience entries.
                        *   **Responsibilities:**
                            *   **Schema Validation:** Uses Zod (`WorkExperienceSchema`) to validate the structure and content of work experience data.
                            *   **Security Sanitization:** Checks for invalid characters (e.g., `<`) to prevent XSS attacks.
                            *   **Logging:** Logs detailed validation warnings for security auditing and debugging.
                    *   **`index.ts`**:
                        *   **Responsibilities:**
                            *   **Module API:** Acts as a barrel file, exporting implementations and interfaces for work experience operations and validators.
                *   **`strategies/`:** Persists AI-driven preparation intelligence.
                    *   **`strategy-operations.ts`:** Handles the persistence of generated interview strategies and manages the incremental update of associated to-do item completion states.
                        *   **Responsibilities:**
                            *   **Individual Retrieval:** Fetches a specific strategy todo list for a company via `getStrategyTodoListForCompany`.
                            *   **Persistence:** Saves generated interview strategies with focus topics and todo items using `saveStrategyTodoList`.
                            *   **Item State Management:** Updates completion status for individual items within a strategy list via `updateStrategyTodoItemStatus`.
                            *   **Data Integrity:** Normalizes strategy data and provides safe defaults for missing fields during retrieval.
                    *   **`strategy-queries.ts`:** Retrieves collections of saved strategies organized by company.
                        *   **Responsibilities:**
                            *   **Bulk Retrieval:** Fetches all saved strategy todo lists for a user, ordered by company name.
                            *   **Data Normalization:** Transforms Firestore documents into `SavedStrategyTodoList` entities, sanitizing nested items and focus topics.
                            *   **Performance:** Implements pagination limits (MAX_PAGE_SIZE = 50) to ensure efficient data rendering.
                    *   **`index.ts`:** Central export point for strategy repository operations and queries.
                        *   **Responsibilities:**
                            *   **Module Exposure:** Re-exports `StrategyOperations` and `StrategyQueries` implementations and interfaces.
                *   **`shared/`:** Common infrastructure for the repository layer providing reusable utilities for validation, error handling, and data fetching.
                    *   **`error-handlers.ts`:** Centralizes error management and response standardization for the repository layer.
                        *   **Responsibilities:**
                            *   **Standardized Logging:** Logs errors with operation context via a unified `Logger` to aid in debugging.
                            *   **Security:** Returns generic error responses to the client while keeping detailed error information in server logs to prevent sensitive data leakage.
                            *   **Success Abstraction:** Provides a consistent structure for success and error responses across all repository modules.
                    *   **`transaction-helpers.ts`:** Provides utilities for managing complex Firestore operations and data retrieval.
                        *   **Responsibilities:**
                            *   **Query Optimization:** Automatically handles Firestore's 30-item limit for `in` queries by chunking and parallelizing requests.
                            *   **Batch Retrieval:** Implements a unified helper (`fetchDocsByIds`) for safely fetching multiple documents by ID across different collections.
                            *   **Abstraction:** Simplifies complex Firestore query logic into reusable utility methods for repositories.
                    *   **`validators.ts`:** Enforces data integrity and security rules for complex profile data structures.
                        *   **Responsibilities:**
                            *   **Data Validation:** Uses Zod schemas (e.g., `SavedStrategyTodoListSchema`) to validate the structure and content of AI-generated content.
                            *   **XSS Protection:** Performs deep sanitization of nested fields to block potentially malicious characters (e.g., `<`) in saved strategies.
                            *   **Centralized Policies:** Serves as a single source of truth for cross-cutting validation rules used by multiple repository sub-modules.
                    *   **`index.ts`:** Barrel file that exports all shared utilities for easier consumption within the repository layer.
            *   **`index.ts`:**
                *   **Responsibilities:**
                    *   **Public API Mapping:** Re-exports the main `UserRepository` and critical DTO interfaces to maintain a clean public API surface for other features.
                    *   **Module Exposure:** Provides selective access to internal sub-module implementations for advanced consumption or testing.
        *   **`hooks/`:**
            *   **`use-bookmarks.ts`:** Hook for fetching and managing bookmarked problems.
                *   **Responsibilities:**
                    - **Data Fetching:** Retrieves bookmarked problem IDs from `userService` and details from `getProblemsByIdsBatchAction`.
                    - **Local State Management:** Tracks `bookmarkedProblemDetails` and `isLoadingBookmarks`.
                    - **UI Interactions:** Provides `handleProblemBookmarkChange` for optimistic updates of the bookmark status.
                    - **Error Handling:** Uses `useToast` to notify the user of fetch failures.
            *   **`use-education.ts`:** Hook for fetching and managing education history.
                *   **Responsibilities:**
                    - **Data Fetching:** Retrieves a user's educational background via `userService`.
                    - **Mutation Logic:** Handles adding new education entries through `handleAddEducation`.
                    - **State Management:** Manages `educationHistory`, loading states, and the visibility of the education dialog.
                    - **Optimistic Updates:** Updates the local state after successfully adding new education data.
            *   **`use-problem-statuses.ts`:** Hook for fetching and managing problem statuses (solved, attempted, todo) with detail hydration.
                *   **Responsibilities:**
                    - **Selective Hydration:** Implements `hydrateProblemsForStatus` to fetch full problem details only when requested for a specific tab.
                    - **List Management:** Provides memoized lists for `solvedProblems`, `attemptedProblems`, and `todoProblems`.
                    - **Interaction Handling:** Supports updating problem statuses locally and syncing with the global status map.
                    - **Concurrency Control:** Uses refs to prevent duplicate or concurrent hydration requests for the same status.
            *   **`use-profile-data.ts`:** Core hook for managing high-level profile data, specifically problem statuses and statistics.
                *   **Responsibilities:**
                    - **Map Management:** Fetches and maintains a lightweight `problemStatuses` map (ID -> Status).
                    - **Statistics Calculation:** Computes aggregate stats (solved, attempted, todo counts) using an optimized single-pass iteration.
                    - **Local Updates:** Provides `updateProblemStatusLocally` for immediate UI feedback during status changes.
                    - **Coordination:** Acts as the primary data source for other status-dependent hooks like `useProblemStatuses`.
            *   **`use-strategies.ts`:** Hook for fetching and managing user-saved strategy todo lists.
                *   **Responsibilities:**
                    - **Data Fetching:** Retrieves strategy-specific todo lists from `userService`.
                    - **Task Management:** Implements `handleToggleTodoItem` for updating the completion status of individual strategy items.
                    - **Optimistic UI:** Immediately reflects toggle changes in the UI with a fallback mechanism on failure.
                    - **State Tracking:** Manages `strategyTodoLists` and tracks which specific item is currently being updated.
            *   **`use-work-experience.ts`:** Hook for fetching and managing professional work experience.
                *   **Responsibilities:**
                    - **Professional Timeline:** Renders job titles, company names, date ranges, and key responsibilities in a structured list.
                    - **Mutation Logic:** Handles adding new work experience entries through `handleAddWorkExperience`.
                    - **State Management:** Manages `workExperience`, loading states, and work experience dialog visibility.
                    - **Optimistic Updates:** Updates the local state after successfully adding new work history.
            *   **`index.ts`:** Barrel export file for the profile hooks.
                *   **Responsibilities:**
                    - **Public API Surface:** Re-exports all profile-related hooks for easier consumption across the application.
                    - **Type Exports:** Re-exports data interfaces and types associated with each hook for type safety.
                    - **Code Organization:** Maintains a clean interface for the `hooks` folder.
        *   **`mappers/`:**
            *   **`user.mapper.ts`:** Handles conversions between Firestore documents, user entities, and profile DTOs.
                *   **Responsibilities:**
                    *   **Domain to DTO:** Maps `User` entities to `UserProfile` DTOs for client-side consumption.
                    *   **Domain to Persistence:** Converts `User` entities to Firestore document formats for database storage.
                    *   **Persistence to Domain:** Hydrates `User` entities from Firestore documents, ensuring type safety and field mapping.
                    *   **DTO to Domain:** Enables creation of domain entities from external DTO data.
                    *   **Direct Mapping:** Provides shortcuts for direct Firestore document to DTO mapping where domain logic isn't required.
            *   **`index.ts`:**
                *   **Responsibilities:**
                    *   **Barrel Export:** Facilitates a clean public API for the mappers module by re-exporting all `UserMapper` functionalities.
        *   **`interfaces/`:** Defines the contracts for repositories and services to enable dependency injection and mockability for user-related data.
            *   **`user.repository.interface.ts`:**
                *   **Responsibilities:**
                    *   **Contract Definition:** Defines `IUserRepository` extending `IBaseRepository` for standardized data access to user profiles.
                    *   **Data Structures:** Defines `UserGlobalProblemStats`, `CreateUserDTO`, and `UpdateUserDTO` for type-safe data handling.
                    *   **Query Specifications:** Specifies methods for retrieving bookmarks, problem statuses, education, work experience, and strategy todo lists.
                    *   **Mutation Operations:** Defines signatures for toggling bookmarks, updating display names, adding experience, and syncing user profiles.
            *   **`user.service.interface.ts`:**
                *   **Responsibilities:**
                    *   **Business Logic Contract:** Defines `IUserService` for user-related business operations and event orchestration.
                    *   **Result Pattern:** Enforces the use of `Result<T, ServiceError>` for consistent and robust error handling across all service methods.
                    *   **Event Orchestration:** Includes methods for subscribing to application-wide user events.
                    *  - [x] Analyze `src/app/contact` files <!-- id: 0 -->
- [x] Prepare documentation for each file <!-- id: 1 -->
- [/] Update `info.md` with the new documentation <!-- id: 2 -->
- [ ] Verify the updates in `info.md` <!-- id: 3 -->
        *   **`index.ts`:**
                *   **Responsibilities:**
                    *   **Barrel Export:** Acts as a centralized barrel file, re-exporting all interfaces to provide a clean public API for the module.
        *   **`di.ts`:** Dependency Injection configuration for the profile feature.
            *   **Responsibilities:**
                *   **Service Registration:** Registers `UserService` and `UserRepository` implementations with the global DI container.
                *   **Lifecycle Management:** Configures services as singletons to ensure efficient resource usage.
                *   **Dependency Wiring:** Automatically resolves and injects the `UserRepository` dependency into the `UserService`.
        *   **`index.ts`:** The public API (barrel file) for the profile feature.
            *   **Responsibilities:**
                *   **Encapsulation:** Exposes only the public components, services, repositories, and interfaces of the profile feature.
                *   **Component Export:** Exports key UI sections like `UserInfoCard`, `ProgressStats`, and experience sections.
                *   **Service Access:** Provides access to the `userService` singleton and `UserService` class for cross-feature usage.
                *   **Type Safety:** Exports DTOs and interfaces to ensure type compatibility when interacting with the profile feature from other modules.
                *   **Mapper Exposure:** Exports `UserMapper` and associated types for data transformation.
    *   **`contact`:** Handles user feedback and contact form submissions through a clean architecture implementation.
        *   **`actions/`:** Server actions acting as the secure entry point for contact operations.
            *   **`contact.actions.ts`:**
                *   **Responsibilities:**
                    *   **Input Validation:** Enforces data integrity using Zod schemas (max length, email format) to prevent abuse.
                    *   **Form Processing:** Handles the submission lifecycle (`sendContactMessage`) including error handling and service delegation.
                    *   **Feedback:** Returns structured `ContactFormState` (success/errors) to drive UI feedback.
        *   **`components/`:** UI components for the contact feature.
            *   **`contact-form.tsx`:** A client-side form component for message submission.
                *   **Responsibilities:**
                    *   **User Interaction:** Captures name, email, and message inputs with real-time validation feedback.
                    *   **State Management:** Uses `useFormState` and `useFormStatus` to handle pending requests and optimistic updates.
                    *   **Accessibility:** Implements ARIA attributes for error messaging and form status.
                    *   **Offline Handling:** Disables submission and prompts the user when internet connection is lost via `useOnlineStatus`.
        *   **`services/`:** Business logic layer.
            *   **`contact.service.ts`:** Implements `IContactService` to orchestrate contact operations.
                *   **Responsibilities:**
                    *   **Business Logic:** Manages specific message operations like submission, status updates (read/replied/archived), and retrieval.
                    *   **Error Handling:** Wraps repository calls in `Result` types to ensure safe failure handling and consistent service errors.
                    *   **Logging:** Integrates with `Logger` to track operation success/failure without exposing PII.
        *   **`repositories/`:** Data access layer.
            *   **`contact.repository.ts`:** Handles direct interaction with Firestore.
                *   **Responsibilities:**
                    *   **Persistence:** Saves validated contact messages to the `contact-messages` collection with server timestamps.
                    *   **Data Integrity:** Re-validates data using Zod (`contactMessageSchema`) before writing to the database as a safety net.
        *   **`mappers/`:**
            *   **`contact.mapper.ts`:** Utilities for data transformation.
                *   **Responsibilities:**
                    *   **Abstraction:** Converts between Firestore documents, Domain Entities, and DTOs to keep layers loosely coupled.
                    *   **Lifecycle Management:** Handles logic for setting entity status based on document fields during hydration.
            *   **`index.ts`:** The barrel file for the components placeholders.
        *   **`interfaces/`:** Type definitions for implementation contracts.
            *   **`contact.repository.interface.ts`:** Defines the contract for contact data persistence and creates a standardized API for storage interactions.
                *   **Responsibilities:**
                    *   **Contract Definition:** extends `IBaseRepository` to inherit fundamental data access patterns while adding contact-specific operations.
                    *   **Data Structures:** Exports critical DTOs like `ContactMessageData`, `CreateContactDTO`, and `UpdateContactDTO` for type safety.
                    *   **Query Specifications:** Defines signatures for status-based filtering (`getContactMessagesByStatus`) and state mutations (`markAsRead`, `archive`).
            *   **`contact.service.interface.ts`:** Establishes the contract for the business logic layer, decoupling implementation from consumption.
                *   **Responsibilities:**
                    *   **Service Definition:** Defines `IContactService` to handle contact submissions and administrative workflows.
                    *   **Result Pattern:** Enforces `Result<T, ServiceError>` return types for robust and explicit error handling.
                    *   **Lifecycle Operations:** Specifies methods for the full contact lifecycle including submission (`submitMessage`), retrieval (`getContactById`), and status updates.
            *   **`index.ts`:** The barrel file for the components placeholders.
        *   **`di.ts`:** Dependency Injection setup.
            *   **Responsibilities:**
                *   **Wiring:** Registers `ContactService` and `ContactRepository` as singletons in the global container.
        *   **`index.ts`:** The barrel file for the components placeholders.
    *   **`landing`:** Contains UI components and logic specifically for the main landing page.
        *   **`components/`:**
            *   **`hero-section.tsx`:** The "above-the-fold" component.
                *   **Responsibilities:**
                    *   **Main Visual:** Renders the primary headline and call-to-action ("Start Exploring").
                    *   **Visual Flair:** Integrates `FloatingShapes` for background animation.
                    *   **Navigation:** Links directly to the `/companies` page.
            *   **`search-section.tsx`:** Central search functionality for the landing page.
                *   **Responsibilities:**
                    *   **Search Interface:** Wraps the `CompanySearchBar` to allow users to search for companies immediately.
                    *   **Navigation:** Handles search submission by redirecting to the `/companies` page with query parameters.
            *   **`feature-section.tsx`:** Highlights key application features.
                *   **Responsibilities:**
                    *   **Grid Layout:** Displays a responsive grid of `FeatureCard` components.
                    *   **Data Driven:** Renders content based on the `FEATURES` constant.
            *   **`stats-section.tsx`:** Social proof and metrics.
                *   **Responsibilities:**
                    *   **Key Metrics:** Displays statistics (e.g., number of companies, problems) using `StatItem`.
                    *   **Data Driven:** Sources data from the `STATS` constant.
            *   **`footer.tsx`:** The comprehensive site footer.
                *   **Responsibilities:**
                    *   **Navigation:** Links to legal pages (Privacy, Terms), Contact, Blog, and Sitemap.
                    *   **Branding:** Displays copyright and branding information.
            *   **`search-section-error-fallback.tsx`:** Robust error handling for the search component.
                *   **Responsibilities:**
                    *   **Error State:** Displays a user-friendly message if the search bar fails to load.
                    *   **Recovery:** Provides a "Reload Page" button to attempt recovery.
        *   **`index.ts`:** Public API for the landing feature, exporting all main sections.
    *   **`tools`:** Houses auxiliary features like the typing test and interactive UI tools.
        *   **`components/typing-test/`**:
            *   **`typing-area.tsx`**: The main interface for the typing game.
                *   **Responsibilities:**
                    *   **Render Logic:** Displays the code snippet with syntax highlighting and a real-time cursor that follows user input.
                    *   **Visual Feedback:** Highlights correct characters, mistakes, and untyped text using distinct colors.
                    *   **Accessibility:** Manages focus states and ensures the hidden `textarea` is accessible for input.
            *   **`typing-controls.tsx`**: Controls for managing the game session.
                *   **Responsibilities:**
                    *   **Language Selection:** Provides a dropdown to switch between supported programming languages (JS, Python, C++, etc.).
                    *   **Session Management:** Offers "Reset" and "Next Snippet" actions to restart or rotate the coding challenge.
            *   **`typing-results.tsx`**: Displays performance metrics after game completion.
                *   **Responsibilities:**
                    *   **Data Visualization:** Renders a line chart (`recharts`) showing WPM over time.
                    *   **Performance Summary:** Shows final WPM, Accuracy, and total Mistakes with a modern, card-based layout.
                    *   **Interactive Sharing:** Provides options to restart or try a new snippet from the results screen.
            *   **`typing-stats.tsx`**: Live display of current session statistics.
                *   **Responsibilities:**
                    *   **Real-time Metrics:** Displays current WPM and Accuracy as the user types.
                    *   **Progress Tracking:** Shows a visual progress bar indicating how much of the snippet has been completed.
            *   **`typing-test-game.tsx`**: The primary game engine component.
                *   **Responsibilities:**
                    *   **State Integration:** Connects the `useTypingGame` hook to the UI modules (Stats, Area, Controls).
                    *   **Keyboard Handling:** Captures global key events and manages focus transitions.
            *   **`typing-test-container.tsx`**: A layout wrapper for the typing test feature.
                *   **Responsibilities:**
                    *   **Structural Layout:** Provides a centered, responsive container with polished glassmorphism styling.
            *   **`typing-test-error-fallback.tsx`**: Specialized error boundary for the typing test.
                *   **Responsibilities:**
                    *   **Resilience:** Renders a clean error state with a retry option if the game logic fails.
        *   **`hooks/`**:
            *   **`use-typing-game.ts`**: The core logic orchestrator for the typing test.
                *   **Responsibilities:**
                    *   **Game Loop:** Manages start/end times, user input state, and completion logic.
                    *   **Stat Calculation:** Computes live WPM, accuracy, and mistake counts using utility functions.
                    *   **UX Enhancements:** Handles auto-scrolling to the cursor and manages input focus.
            *   **`use-typing-placeholder.ts`**: Animates placeholder text for search inputs.
                *   **Responsibilities:**
                    *   **User Engagement:** Cycles through a list of terms with a typing/deleting animation effect.
        *   **`utils/`**:
            *   **`typing-game-logic.ts`**: Pure, stateless functions for game calculations.
                *   **Responsibilities:**
                    *   **Algorithm Implementation:** contains logic for WPM calculation, accuracy percentage, and smart indentation (handling Enter/Tab).
                    *   **Input Validation:** Detects mistakes by comparing input against the target snippet.
        *   **`constants/`**:
            *   **`typing-test-snippets.ts`**: A curated collection of code snippets across 10+ languages.
                *   **Responsibilities:**
                    *   **Content Diversity:** Provides realistic code samples for various languages (JS, TS, Python, C++, Java, Go, Rust, SQL, HTML, CSS).
                    *   **Standardization:** Ensures all snippets adhere to the `Snippet` interface for consistent consumption by the typing engine.
                    *   **Pedagogical Breadth:** Covers a wide range of topics from basic algorithms (Bubble Sort) to advanced concepts (Goroutines, Rust ownership).
                    *   **Quality Content:** Features hand-crafted code blocks with meaningful comments and logical flow to simulate real-world coding.
        *   **`types/`**:
            *   **`typing-test.ts`**: Defines the core `Snippet` and `Language` interfaces used across the feature.
                *   **Responsibilities**:
                    *   **Type Definitions**: Provides the `Language` union type for strong typing of supported programming languages (JS, Python, TS, etc.).
                    *   **Data Modeling**: Defines the `Snippet` interface to ensure code samples have consistent IDs, metadata, and content.
                    *   **Global Schema**: Establishes the core data contract used by components (stats, controls, area) and the main game logic.
            *   **`index.ts`**: Barrel file for the typing test types.
                *   **Responsibilities**:
                    *   **Public API**: Serves as a barrel file, re-exporting internal type definitions to external modules.
                    *   **Developer Experience**: Simplifies import paths, allowing consumers to import from `@/features/tools/types` instead of specific files.
        *   **`index.ts`**: Barrel file for the tools feature, exporting public components and types.
*   **Common Internal Structure (per Feature):**
    *   **`actions/`:** Next.js Server Actions for server-side operations.
    *   **`components/`:** UI components scoped to the feature.
    *   **`hooks/`:** Feature-specific React hooks.
    *   **`services/`:** Business logic implementation for the feature.
    *   **`repositories/`:** Data access layer (e.g., Firestore interactions).
    *   **`mappers/`:** Logic to transform data between infrastructure and domain layers.
    *   **`stores/`:** Client-side state management (e.g., Zustand).
    *   **`interfaces/` / `types/`:** TypeScript definitions scoped to the feature.
    *   **`di.ts`:** Dependency Injection configuration for the feature.

### 3. `src/app` (Presentation/Routing Layer)
*   **Role:** Uses Next.js App Router to define routes and layouts.
*   **Interaction:** Pages in `src/app` act as orchestrators, composing UI components from `features` and `shared`. They typically do not contain complex business logic.
*   **Core Files:**
    *   **`error.tsx`**: Defines the global error boundary for the application.
        *   **Responsibilities:**
            *   **Error Handling:** Catches unhandled runtime errors in client components to prevent full application crashes.
            *   **Observability:** Logs error details and digests via the shared `Logger` for debugging.
            *   **UX Recovery:** Provides a user-friendly fallback UI with options to retry the failed action or return to the homepage.
    *   **`globals.css`**: The central entry point for all global styles and CSS architecture.
        *   **Responsibilities:**
            *   **Design Tokens:** Manages CSS variables for the application's color palette (background, foreground, primary, accent, etc.) across different themes.
            *   **Tailwind Configuration:** Orchestrates Tailwind directives and custom theme property mappings using the modern `@theme` syntax.
            *   **Utility Layer:** Defines project-specific utilities such as `sr-only` for accessibility and `animated-gradient-background` for premium visual effects.
            *   **Base Styles:** Enforces consistent typography and smooth scrolling behavior across the entire body.
    *   **`layout.tsx`**: The top-level root layout orchestrator for the entire application.
        *   **Responsibilities:**
            *   **Context Provisioning:** Wraps the component tree with essential providers including `ThemeProvider`, `AuthProvider`, and `CooldownStateProvider`.
            *   **SEO & Metadata:** Configures global site metadata (titles, descriptions, keywords) and Open Graph attributes for social sharing.
            *   **Global Components:** Injects persistent UI elements like the `Header`, `Footer`, `Toaster`, and `OfflineIndicator`.
            *   **Analytics Integration:** Optimizes performance and tracking by embedding Vercel Web Analytics and Speed Insights.
            *   **Hydration Safety:** Configures `suppressHydrationWarning` and handles high-level font loading (Geist Mono).
    *   **`loading.tsx`**: Provides a standard global fallback UI during asynchronous route transitions.
        *   **Responsibilities:**
            *   **Visual Feedback:** Renders a centered, animated spinner to indicate ongoing data fetching or page transitions.
            *   **Perceived Performance:** Leverages Next.js Suspense to provide immediate visual updates, reducing the perceived wait time for users.
    *   **`not-found.tsx`**: Implements the custom 404 error page for unmapped routes.
        *   **Responsibilities:**
            *   **Navigation Recovery:** Helps users find their way by providing direct links back to the homepage and the company list.
            *   **Interactive Search:** Integrates the `CompanySearchBar` to allow users to search for specific companies directly from the 404 page.
    *   **`opengraph-image.tsx`**: Generates dynamic social sharing images using the Next.js OG Image generation.
        *   **Responsibilities:**
            *   **Brand Representation:** Renders a high-fidelity visual representing the site's brand, logo, and value proposition.
            *   **Edge Runtime:** Optimized to run on the Edge Network for fast, on-the-fly image generation and delivery.
    *   **`page.tsx`**: The main entry point for the application's homepage.
        *   **Responsibilities:**
            *   **Feature Orchestration:** Composes the landing page by assembling feature-specific sections: Hero, Features, Stats, and Search.
            *   **SEO Optimization:** Defines page-level metadata and canonical links specific to the landing experience.
            *   **Structured Data:** Injects `WebSite` and `SearchAction` JSON-LD to enhance search engine visibility and rich snippets.
    *   **`robots.ts`**: Programmatically generates the `robots.txt` configuration for search crawlers.
        *   **Responsibilities**:
            *   **Crawler Management**: Defines access rules for bots, allowing full site indexing while protecting internal and administrative paths (`/api/`, `/admin/`).
            *   **Sitemap Discovery**: Explicitly provides the sitemap URL to ensure efficient crawling of all public routes.
    *   **`sitemap.xml/`**: Handles the dynamic generation of the site's XML sitemap for search engine optimization.
        *   **Responsibilities**:
            *   **Dynamic Discovery**: Fetches all available company slugs via `companyService` to ensure all individual company pages are indexed.
            *   **Route Orchestration**: Includes static routes such as the homepage, `/companies`, `/problems`, and `/blog` in the sitemap.
            *   **Metadata Specification**: Defines SEO-critical attributes like `lastmod`, `changefreq`, and `priority` for each listed URL.
            *   **Standardized Output**: Returns a strictly formatted XML response with the correct `application/xml` content type, compliant with sitemaps.org protocols.
    *   **`sw.ts`**: The Service Worker configuration for PWA support and offline capabilities.
        *   **Responsibilities:**
            *   **Precaching:** Manages the lifecycle of precached assets defined in the application manifest.
            *   **Caching Strategy:** Implements runtime caching for various resources to improve load times on repeat visits.
            *   **Offline Resilience:** Provides an offline fallback navigation route (`/~offline`) to ensure the app remains functional without a network connection.
*   **Route Structure:**
    *   **`api/`**: Contains server-side API routes for companies and problems, providing RESTful endpoints for data access.
        *   **`companies/route.ts`**: Provides API endpoints (`GET`, `POST`) for paginated company retrieval.
            *   **Responsibilities:**
                *   **Pagination:** Implements efficient cursor-based pagination for large-dataset traversal.
                *   **Input Validation:** Validates `cursor`, `pageSize` (1-50), and `searchTerm` parameters.
                *   **Service Orchestration:** Delegates data fetching to the `companyService`.
                *   **Observability:** Logs request lifecycle with unique `requestId` and duration tracking.
        *   **`companies/[companyId]/ai-problems/route.ts`**: Specialized endpoint optimized for AI-driven problem analysis.
            *   **Responsibilities:**
                *   **Category-Aware Fetching:** Retrieves public problems specific to a provided `companyId`.
                *   **AI Context Optimization:** Fetches a larger dataset (`pageSize: 200`) to provide sufficient context for AI features like clustering.
                *   **Next.js Dynamic Routing:** Leverages dynamic route parameters for context-aware data access.
                *   **Observability:** Tracks request execution time and success/failure states via detailed logging.
        *   **`problems/route.ts`**: A comprehensive endpoint for global and company-specific problem filtering.
            *   **Responsibilities:**
                *   **Dual-Mode Fetching:** Handles both company-specific (via `problemService`) and global (via `userProblemBridgeService`) problem retrieval.
                *   **Advanced Filtering:** Supports complex filters for difficulty, recency, and search terms via URL parameters.
                *   **Security (Anti-IDOR):** Explicitly ignores client-provided `userId` to prevent unauthorized data access in public endpoints.
                *   **Optimization Hints:** Processes client-side hints (total counts, slugs) to minimize redundant database lookups.
    *   **`auth/`**: Dedicated routes for authentication-related flows (handled by the `auth` feature).
        *   **`action/page.tsx`**: Universal auth action handler for Firebase email actions.
            *   **Responsibilities**:
                *   **Action Handling**: Processes Firebase Authentication email actions such as `resetPassword`, `verifyEmail`, and `recoverEmail`.
                *   **Dynamic Rendering**: Conditionally renders specialized components (`ResetPasswordForm`, `VerifyEmail`) based on the `mode` query parameter.
                *   **Layout Orchestration**: Wraps auth flows in a consistent `AuthLayout` for a unified user experience.
                *   **Suspense Integration**: Leverages React Suspense to provide visual feedback (animated spinner) while auth parameters are being processed.

    *   **`companies/`**: Route for the main companies list and explorer view.
        *   **`page.tsx`**: The main entry point for the companies listing page.
            *   **Responsibilities:**
                *   **Feature Orchestration:** Composes the companies listing page using `CompaniesListContainer`.
                *   **SEO Optimization:** Defines extensive metadata including keywords for top tech companies and interview prep.
                *   **Structured Data:** Injects `CollectionPage` JSON-LD to enhance search engine visibility for the company collection.
                *   **Resilience:** Wraps the content in an `ErrorBoundary` with a specialized `CompanyListErrorFallback`.
                *   **Performance:** Sets a revalidation interval of 1 month (`revalidate = 2592000`) for static generation.
        *   **`loading.tsx`**: Defines the loading skeleton UI for the main companies listing page.
            *   **Responsibilities:**
                *   **Visual Feedback:** Renders a cohesive loading state using `DashboardHeaderSkeleton`, `TechCompanyCardSkeleton`, and `CompanyTableSkeleton`.
                *   **UX Consistency:** Mimics the actual page layout to provide a smooth transition and reduce perceived latency.
                *   **Layout Matching:** Uses a grid system and spacing that exactly matches the fully loaded companies page.

    *   **`company/[slug]/`**: Dynamic routes for individual company detail pages.
        *   **`page.tsx`**: The main entry point for a specific company's detail page, handling data orchestration and SEO.
            *   **Responsibilities:**
                *   **Data Orchestration:** Concurrently fetches company details and initial problems using `Promise.all` to minimize latency.
                *   **SEO & Metadata:** Dynamically generates comprehensive metadata (title, description, OG tags) and structured data (Organization, Breadcrumb, FAQ, ItemList) for rich search results.
                *   **Static Generation:** Implements `generateStaticParams` to pre-render the most relevant company pages at build time.
                *   **User Feedback:** Handles the "Not Found" state by triggering the `notFound()` utility if a company slug is invalid.
        *   **`loading.tsx`**: Provides a cohesive loading experience for the company detail page.
            *   **Responsibilities:**
                *   **Visual Feedback:** Renders the `CompanyPageSkeleton` to maintain layout consistency during data fetching.
        *   **`not-found.tsx`**: Custom 404 page for missing company records.
            *   **Responsibilities:**
                *   **UX Guidance:** Provides a clear "Company Not Found" message and a direct link back to the main companies browser.
        *   **`error.tsx`**: Error boundary for the company detail route.
            *   **Responsibilities:**
                *   **Graceful Recovery:** Displays a user-friendly error message with options to "Try Again" or return to the companies search.
                *   **Observability:** Logs the error details for server-side monitoring.
    *   **`problems/`**: Route for the centralized problem directory and listing.
        *   **`page.tsx`**: The main entry point for the coding problems listing page.
            *   **Responsibilities:**
                *   **SEO & Metadata:** Generates comprehensive metadata and CollectionPage structured data to optimize discovery of the problem library.
                *   **Feature Orchestration:** Composes the page by integrating the `ProblemListContainer` for core functionality.
                *   **Layout & UX:** Implements a responsive grid layout with a dedicated sidebar for sponsored content and advertisements.
                *   **Error Handling:** Wraps the main list in a local `ErrorBoundary` with a specialized `ProblemListErrorFallback`.
                *   **Static Optimization:** Configures a monthly revalidation cycle (`revalidate = 2592000`) for efficient static generation.
        *   **`loading.tsx`**: Manages the initial loading state for the problems browser.
            *   **Responsibilities:**
                *   **Skeleton UI:** Renders the `ProblemsPageSkeleton` to provide immediate visual feedback and maintain layout stability during data fetching.
        *   **`error.tsx`**: Route-level error boundary for the problems page.
            *   **Responsibilities:**
                *   **Graceful Recovery:** Provides a user-friendly error interface with a "Try Again" action to reset the route state.
                *   **Observability:** Logs runtime errors to the console for easier client-side debugging.
    *   **`profile/`**: User dashboard and account management routes.
        *   **`page.tsx`**: The main user profile dashboard, orchestrating data and interactions.
            *   **Responsibilities:**
                *   **Authentication & Access Control:** Manages session state, redirecting unauthenticated users to `/login`.
                *   **Data Aggregation:** Acts as a central hub, fetching and displaying user statistics, bookmarks, problem statuses, educational/work history, and AI strategies using specialized hooks.
                *   **Interactive Management:** Handles user-driven updates such as display name modifications and state toggles for AI to-do lists.
                *   **Performance Optimization:** Implements lazy loading for tab-specific data (e.g., Solved vs. Attempted problems) to minimize initial load weight.
                *   **Component Composition:** Assemblies the UI using modular components like `ProfileHeader` and `ProfileContent`.
        *   **`loading.tsx`**: Provides visual feedback during profile data fetching.
            *   **Responsibilities:**
                *   **Skeleton UI:** Renders the `ProfilePageSkeleton` to maintain layout stability during the initial data load.
        *   **`error.tsx`**: Handles runtime failures for the profile dashboard.
            *   **Responsibilities:**
                *   **Graceful Recovery:** Displays a user-friendly error card with options to "Try Again" or return to the homepage.
                *   **Observability:** Logs error details to the console for easier client-side debugging.
    *   **`signup/`**: Client-side routes for user sign-up forms.
        *   **`page.tsx`**: The main entry point for the user registration page.
            *   **Responsibilities:**
                *   **SEO & Metadata:** Defines page-specific metadata (title, description) for the registration experience.
                *   **Feature Orchestration:** Composes the sign-up screen by wrapping the `SignupForm` within an `AuthLayout`.
                *   **UX Consistency:** Provides a welcoming interface for new users to join the platform.
        *   **`loading.tsx`**: Provides visual feedback during the sign-up page loading state.
            *   **Responsibilities:**
                *   **Skeleton UI:** Renders a card-based skeleton structure matching the `SignupForm` layout.
                *   **Layout Stability:** Prevents layout shifts by occupying the expected space for the registration card and fields.
                *   **Perceived Performance:** Leverages Next.js Suspense to provide an immediate, polished loading state.
    *   **`login/`**: Handles user authentication and provides access to existing accounts.
        *   **`page.tsx`**: The main entry point for the login page.
            *   **Responsibilities:**
                *   **SEO & Metadata:** Defines page-specific metadata (title, description) for the "Welcome Back" experience.
                *   **Feature Orchestration:** Composes the login screen by wrapping the `LoginForm` within an `AuthLayout`.
                *   **UX Consistency:** Ensures a unified presentation for the sign-in process.
        *   **`loading.tsx`**: Provides visual feedback during the login page loading state.
            *   **Responsibilities:**
                *   **Skeleton UI:** Renders a card-based skeleton structure matching the `LoginForm` layout.
                *   **Layout Stability:** Prevents layout shifts by occupying the expected space for the card, header, and input fields.
                *   **Perceived Performance:** Leverages Next.js Suspense to provide an immediate, polished loading state.

    *   **`forgot-password/`**: Route for the password recovery initiation page.
        *   **`page.tsx`**: The main entry point for the password reset request flow.
            *   **Responsibilities:**
                *   **Password Recovery Entry Point**: Provides the user interface for initiating a password reset.
                *   **Layout Consistency**: Integrates `AuthLayout` to ensure a unified visual experience across the authentication suite.
                *   **Feature Orchestration**: Consumes `ForgotPasswordForm` from the auth feature to handle the core recovery logic.
                *   **SEO & Metadata**: Defines page-specific metadata (title, description) to optimize search engine visibility.

    *   **`tools/`**: Host for auxiliary developer tools designed for software engineers.
        *   **`page.tsx`**: The main landing page for the Developer Tools category.
            *   **Responsibilities:**
                *   **Tool Aggregation**: Displays a managed list of essential tools like Code Playground, Resume Analyzer, and Interview Simulator.
                *   **Availability Management**: Distinguishes between functional tools and "Coming Soon" features to manage user expectations.
                *   **Navigation Bridge**: Provides quick-action links to specialized tool pages such as the typing test and playground.
                *   **UX Presentation**: Uses a responsive grid of cards with glassmorphism and animations to showcase tool value propositions.
        *   **`typing-test/`**: Specialized route for the developer typing speed tool.
            *   **`page.tsx`**: Renders the "Speed Coder" tool interface.
                *   **Responsibilities:**
                    *   **Feature Orchestration**: Integrates the `TypingTestContainer` to provide the core interactive typing experience.
                    *   **SEO Optimization**: Defines specific metadata (title, description) focused on developer-centric typing practice.
                    *   **Contextual Branding**: Provides targeted messaging about practicing with real code syntax rather than generic text.

    *   **`contact/`**: Route for the contact form and user inquiries.
        *   **`page.tsx`**: Renders the main contact page and manages SEO metadata.
            *   **Responsibilities:**
                *   **SEO & Metadata**: Provides optimized SEO attributes (title, description, OG tags) for the contact page.
                *   **Component Composition**: Wraps the client-side `ContactForm` component in a styled container.
        *   **`layout.tsx`**: Pass-through layout for the contact route.
            *   **Responsibilities:**
                *   **Metadata Association**: Associates specific metadata with the `/contact` route and its sub-routes.
        *   **`loading.tsx`**: Provides visual feedback during the contact page loading state.
            *   **Responsibilities:**
                *   **Skeleton UI**: Renders a skeleton loader that matches the contact page layout to improve perceived performance.
        *   **`error.tsx`**: Handles runtime errors for the contact route.
            *   **Responsibilities:**
                *   **Error Visualization**: Displays a user-friendly error message and a "Try Again" recovery action.
                *   **Observability**: Logs error details for debugging.
    *   **`blog/`**: Route for the tech interview insights blog.
        *   **`page.tsx`**: Renders the main blog listing page showcasing expert insights and articles.
            *   **Responsibilities:**
                *   **Content Presentation**: Displays a curated list of blog post summaries, including titles, dates, and preview excerpts.
                *   **SEO & Metadata**: Provides optimized SEO attributes (title, description, canonical URLs) to enhance search visibility for blog content.
                *   **Navigation**: Orchestrates internal routing to individual blog posts via dynamic slug-based links.
                *   **CMS Integration Placeholder**: Defines a hardcoded `blogPosts` array as a structural foundation for future dynamic content integration.
        *   **`[slug]/`**: Dynamic route segment for individual blog post detail pages.
            *   **Responsibilities:**
                *   **Dynamic Routing**: Serves as the placeholder for rendering detailed blog post content based on URL slugs.
    *   **`privacy-policy/`**: Route for the application's privacy policy.
        *   **`page.tsx`**: Renders the static privacy policy page and manages SEO.
            *   **Responsibilities:**
                *   **Metadata Management**: Defines page-specific metadata, including SEO titles, descriptions, and robot instructions (noindex, nofollow) to prevent search engine indexing.
                *   **Static Content Rendering**: Displays the complete text of the application's privacy policy, organized into sections like data collection, usage, sharing, security, and user rights.
                *   **User Navigation**: Provides links to other relevant pages, such as the contact page.
                *   **Consistent Layout**: Integrates the standard `Footer` component for a unified look and feel across the site.
    *   **`terms-of-service/`**: Route for the application's terms of service.
        *   **`page.tsx`**: Renders the static terms of service page and manages SEO.
            *   **Responsibilities:**
                *   **Static Content Rendering**: Displays the full text of the website's terms of service, covering user responsibilities, intellectual property, and legal disclaimers.
                *   **SEO Configuration**: Sets metadata and robot instructions (`index: false`, `follow: false`) to prevent search engine indexing of the legal page.
                *   **Canonical URL**: Defines the canonical link for the terms of service page to ensure proper SEO.
                *   **User Navigation**: Includes the application's footer and provides navigational links for user inquiries.
    *   **`~offline/`**: Specialized fallback route rendered when a user is offline.
        *   **`page.tsx`**: Renders a user-friendly "You are offline" message when internet connectivity is lost.
        *   **Responsibilities:**
                *   **User Feedback:** Provides a clear, centered message informing the user of the connection loss.
                *   **SEO:** Manages the page metadata, setting the title to "You are offline".
                *   **UX Consistency:** Uses the app's design system (typography, colors) to maintain a seamless experience even in error states.
    *   **`submit-problem/`**: Route for contributing new coding interview problems to the platform.
        *   **`page.tsx`**: Renders the problem submission page and manages form-related data and SEO.
            *   **Responsibilities:**
                *   **Data Orchestration**: Fetches a paginated list of companies (up to 200) from `companyService` to populate the submission form's company dropdown.
                *   **SEO & Metadata**: Defines page-specific metadata (title, description) for the problem contribution experience.
                *   **Feature Orchestration**: Composes the submission interface by integrating the `ProblemSubmissionForm` component.
                *   **UX Guidance**: Provides a clear header and description for the submission process, including helpful notes for users.

### 4. `src/shared` (Infrastructure/Common Layer)
*   **Role:** Houses generic components (UI kit), hooks, and utility functions that are reused across multiple features.
*   **Key Contents:**
    *   **`index.ts`**: Barrel file for the shared feature, exporting public components and types.
    *   **`components/`**: The application's UI foundation.
        *   **`ads/`**:
            *   **`ad-placeholder.tsx`**: Dynamic Google AdSense integration.
                *   **Responsibilities**:
                    *   **Ad Delivery**: Renders the `<ins>` tag and triggers `adsbygoogle.push()` for ad loading.
                    *   **Resilience**: Provides a visual placeholder if the AdSense slot ID is missing in development.
                    *   **Compliance**: Automatically includes "Advertisement" labels to meet platform requirements.
        *   **`common/`**: Cross-cutting UI utilities and providers.
            *   **`hydration-error-boundary.tsx`**: Specialized error handling for SSR mismatches.
                *   **Responsibilities**:
                    *   **Graceful Recovery**: Catches hydration errors and allows users to retry or refresh without a full crash.
                    *   **Observability**: Tracks hydration issues via `hydrationMonitor` for debugging production mismatches.
            *   **`theme-provider.tsx`**: Integration layer for `next-themes`.
                *   **Responsibilities**:
                    *   **Context Management**: Provides light/dark mode state to all child components.
            *   **`theme-switcher.tsx`**: UI control for theme toggling.
                *   **Responsibilities**:
                    *   **Interactive Control**: Allows users to switch between Light, Dark, and System modes.
            *   **`index.ts`**: Barrel export for all shared components.
                *   **Responsibilities**:
                    *   **Centralization**: Aggregates all shared components into a single, clean import point.
        *   **`icons/`**:
            *   **`google-icon.tsx`**: SVG-based branding assets for OAuth and social UI.
        *   **`layout/header/`**: Structural components for page orchestration.
            *   **`header.tsx`**: The main responsive navigation system.
                *   **Responsibilities**:
                    *   **Responsive Navigation**: Adapts between a desktop menu and a mobile `Sheet` (drawer) using a unified navigation registry.
                    *   **Auth Orchestration**: Dynamically swaps Login/Sign-up links for Profile/Logout based on session state, ensuring a personalized user experience.
                    *   **Hydration Safety**: Implements hydration-safe rendering to prevent server-client mismatches, especially during the initialization of authentication state.
                    *   **Flexible Extensibility**: Supports custom render functions (slots) and action-based items (like Logout) via the `navigationRegistry`, delegating business logic to appropriate handlers.
                    *   **Optimal Performance**: Leverages memoization (`React.memo`, `useMemo`, `useCallback`) to minimize unnecessary re-renders in the global layout.
            *   **`header-error-fallback.tsx`**: A simplified, resilient header for error scenarios.
                *   **Responsibilities**:
                    *   **Graceful Degradation**: Renders a functional, static header with the primary branding (logo) when the main navigation fails.
                    *   **User Communication**: Provides a clear, non-disruptive "Navigation temporarily unavailable" message to manage user expectations.
            *   **`index.ts`**: The barrel export for the header layout.
                *   **Responsibilities**:
                    *   **Public API**: Centralizes internal module exports, providing a clean interface for the main `Header` and its `HeaderErrorFallback`.
        *   **`sections/`**: Reusable landing page and feature-specific layout blocks.
            *   **`home-cta.tsx`**: A prominent call-to-action section designed to drive user conversions.
                *   **Responsibilities**:
                    *   **UI Presentation**: Renders a high-impact heading and persuasive sub-text to encourage sign-ups.
                    *   **Navigation**: Integrates a primary action button that links users directly to the `/signup` flow.
                    *   **Micro-interactions**: Features a hover-animated chevron icon to provide subtle visual feedback and improve engagement.
            *   **`home-features-grid.tsx`**: A comprehensive feature showcase organizing the platform's core value propositions.
                *   **Responsibilities**:
                    *   **Product Discovery**: Displays a structured grid of `ActionFeatureCard` components highlighting AI-powered capabilities and data tools.
                    *   **Navigation Hub**: Acts as a central jumping-off point, directing users to features like Company Explorer, AI Mock Interviews, and Profile Tracking.
                    *   **Responsive Layout**: Implements a fluid grid that optimizes the presentation across mobile, tablet, and desktop viewports.
        *   **`seo/`**: Search engine optimization components.
            *   **`structured-data.tsx`**: Injects JSON-LD for rich search results.
                *   **Responsibilities**:
                    *   **Metadata Injection**: Safely stringifies and injects structured data into the page `<head>`.
        *   **`skeletons/`**: Standardized loading placeholders designed to mimic final UI layouts, significantly reducing perceived latency and improving user experience during data fetching.
            *   **`call-to-action-skeleton.tsx`**: A skeleton loader component that mimics the appearance of the call-to-action section.
                Responsibilities:
                Visual Layout: Renders skeletons for high-impact headings, sub-text, and primary action buttons.
                Spacing Consistency: Ensures that the loading state occupies the same vertical space as the final component to prevent layout shifts.
            *   **`companies-page-skeleton.tsx`**: A comprehensive skeleton for the entire companies listing page.
                Responsibilities:
                Page Orchestration: Composes `DashboardHeaderSkeleton`, `TechCompanyCardSkeleton`, and `CompanyTableSkeleton` into a full-page layout.
                Section Simulation: Provides placeholders for trending sections, main content grids, and sidebar advertisements.
            *   **`companies-skeletons.tsx`**: A collection of reusable skeleton components for company-related views.
                Responsibilities:
                DashboardHeaderSkeleton: Mimics the search-focused hero section with responsive title and search bar placeholders.
                TechCompanyCardSkeleton: Renders a horizontal card layout with logo, text, and action button shimmers.
                CompanyTableSkeleton: Provides a tabular skeleton with animated headers and multiple rows to simulate data loading.
            *   **`company-ai-skeletons.tsx`**: Specialized skeletons for AI-powered feature sections within company pages.
                Responsibilities:
                CompanyAIFeatureSkeleton: Mimics the AI Grouping and Flashcard Generator headers and action areas.
                CompanyStrategySkeleton: Represents the complex AI Strategy Generator interface, including controls and card wrappers.
                CompanyStatsSkeleton: Simulates data visualization areas with chart placeholders and tag shimmers.
            *   **`company-card-skeleton.tsx`**: A standalone skeleton for individual company cards in a grid.
                Responsibilities:
                Component Fidelity: Mimics the exact dimensions, border radiuses, and glassmorphism levels of the `CompanyCard`.
                Asset Placeholders: Uses circular skeletons for logos and varied widths for name/description shimmers.
            *   **`company-page-skeleton.tsx`**: Renders the complete layout for a single company's detail profile.
                Responsibilities:
                Layout Structure: Simulates the company header, statistical overview grid, and the paginated problem list.
                Interaction Feedback: Includes pagination and search control shimmers to indicate interactive areas.
            *   **`experience-skeleton.tsx`**: Skeletons for professional and educational history entries.
                Responsibilities:
                Item Definition: Provides `ExperienceItemSkeleton` as an atomic placeholder for list entries.
                List Simulation: Offers `ExperienceListSkeleton` to mimic timeline-based data structures.
            *   **`feature-grid-skeleton.tsx`**: Mimics landing page feature showcases.
                Responsibilities:
                Visual Representation: Distributes `FeatureCardSkeleton` units across a responsive grid to match discovery sections.
                Composition: Combines card units with section title skeletons for a complete structural placeholder.
            *   **`problem-skeletons.tsx`**: Functional loading states for coding problem lists and details.
                Responsibilities:
                ProblemCardSkeleton: Mimics the modernized problem row, including status toggles, difficulty badges, and conceptual action shimmers.
                ProblemListControlsSkeleton: Represents the complex search and multi-select filter bar.
                ProblemsPageSkeleton: Orchestrates the full problem browsing experience from controls to infinite scroll.
            *   **`profile-skeletons.tsx`**: Simulates the personalized user profile dashboard.
                Responsibilities:
                Data Aggregation: Composes `UserInfoCardSkeleton`, `ProgressStatsSkeleton`, and tabbed content areas into a cohesive loading view.
                Layout Matching: Ensures the sidebars and main columns align perfectly with the authenticated user's profile view.
            *   **`strategy-skeleton.tsx`**: Skeletons for complex AI-generated interview strategies.
                Responsibilities:
                Task Simulation: Renders `StrategyItemSkeleton` and `StrategyListSkeleton` to mimic checkbox-based todo lists and preparation plans.
        *   **`ui/`**: Atomic component library (Shadcn UI).
            *   **Accordion**
                - **Responsibilities**: Provides a vertically stacked set of interactive headings that each reveal a section of content.
                - **Input Validation**: TypeScript props for children and Radix Accordion primitive properties.
                - **Service Orchestration**: None (Presentation only).
                - **Cache Management**: None.
                - **Observability**: Standard React error catching.
                - **Standardization**: Built on `@radix-ui/react-accordion`.
            *   **ActionFeatureCard**
                - **Responsibilities**: A reusable card component to display a single feature with an icon, title, description, and a call-to-action link.
                - **Input Validation**: `ActionFeatureCardProps` interface (icon, title, description, link, linkText).
                - **Service Orchestration**: Uses Next.js `Link` for navigation.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Composed using `Card` and `Button` UI primitives.
            *   **Alert**
                - **Responsibilities**: Displays important messages or feedback to the user in a visually distinct way.
                - **Input Validation**: `alertVariants` via `cva` for styling variants (default, destructive).
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Shadcn UI Alert primitive.
            *   **AlertDialog**
                - **Responsibilities**: A modal dialog that interrupts the user with important content and expects a response.
                - **Input Validation**: Radix AlertDialog primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Built on `@radix-ui/react-alert-dialog`.
            *   **Avatar**
                - **Responsibilities**: Displays a user's profile picture or a fallback (initials/icon) when an image is unavailable.
                - **Input Validation**: Radix Avatar primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Handles image loading errors via `AvatarFallback`.
                - **Standardization**: Built on `@radix-ui/react-avatar`.
            *   **Badge**
                - **Responsibilities**: A small visual indicator for status, category, or tagging.
                - **Input Validation**: `badgeVariants` via `cva` (default, secondary, destructive, outline).
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Shadcn UI Badge primitive.
            *   **Breadcrumb**
                - **Responsibilities**: A navigational aid that reveals the user's location in the application hierarchy.
                - **Input Validation**: TypeScript props for list items and links.
                - **Service Orchestration**: Uses `Slot` for flexible rendering.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Shadcn UI Breadcrumb implementation.
            *   **Button**
                - **Responsibilities**: Core interactive element for actions and navigation.
                - **Input Validation**: `buttonVariants` via `cva` (variants, sizes) and `isLoading` prop.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Includes loading state and ARIA busy attributes.
                - **Standardization**: Shadcn UI Button, extended with `isLoading` support.
            *   **Calendar**
                - **Responsibilities**: A date picker component for selecting individual days or ranges.
                - **Input Validation**: `CalendarProps` from `@react-day-picker`.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Built on `react-day-picker` and integrated with `Button` primitives.
            *   **Card**
                - **Responsibilities**: A flexible container for grouping related content and actions.
                - **Input Validation**: Standard HTML attributes via TypeScript.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Shadcn UI Card primitives.
            *   **Checkbox**
                - **Responsibilities**: A control that allows the user to toggle between checked and unchecked states.
                - **Input Validation**: Radix Checkbox primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Supports `peer` styling for associative labeling.
                - **Standardization**: Built on `@radix-ui/react-checkbox`.
            *   **Chip**
                - **Responsibilities**: A compact element that represents an input, attribute, or action, often used for selection.
                - **Input Validation**: `chipVariants` via `cva` (default, selected).
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Uses `aria-pressed` for selection state accessibility.
                - **Standardization**: Custom UI component following brand aesthetics.
            *   **ChipGroup**
                - **Responsibilities**: Manages a collection of `Chip` components, supporting single or multiple selection logic.
                - **Input Validation**: `ChipGroupProps` for options and value types.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Custom composition of `Chip` components.
            *   **Dialog**
                - **Responsibilities**: An overlay that provides contextual information or allows users to perform tasks without leaving the parent page.
                - **Input Validation**: Radix Dialog primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Handles focus trapping and overlay dismissal.
                - **Standardization**: Built on `@radix-ui/react-dialog`.
            *   **Drawer**
                - **Responsibilities**: A panel that slides out from the side or bottom of the screen, typically used for mobile navigation or supplemental content.
                - **Input Validation**: `vaul` drawer properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Supports background scaling for premium UX.
                - **Standardization**: Built on `vaul` library.
            *   **DropdownMenu**
                - **Responsibilities**: Displays a list of options to the user, triggered by a button or icon.
                - **Input Validation**: Radix DropdownMenu primitive properties.
                - **Service Orchestration**: Uses `Portal` for rendering outside the DOM hierarchy.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Built on `@radix-ui/react-dropdown-menu`.
            *   **ErrorBoundary**
                - **Responsibilities**: Catches JavaScript errors in their child component tree, logs those errors, and displays a fallback UI.
                - **Input Validation**: `Props` for children and fallback nodes.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Logs uncaught errors to the console; provides `resetErrorBoundary` functionality.
                - **Standardization**: Traditional React class-based Error Boundary implementation.
            *   **FeatureCard**
                - **Responsibilities**: A decorative card designed to showcase platform features with high-impact visuals.
                - **Input Validation**: `FeatureCardProps` from `@/shared/types`.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Features brand-specific glassmorphism and animated hover effects.
            *   **FloatingShapes**
                - **Responsibilities**: Renders animated, gradient-colored shapes for background depth and visual interest.
                - **Input Validation**: None.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Custom CSS-animated background element.
            *   **Form**
                - **Responsibilities**: A wrapper around `react-hook-form` to provide context and accessibility (ARIA) to form fields.
                - **Input Validation**: Fully integrated with `react-hook-form` and server-side validation.
                - **Service Orchestration**: Orchestrates input, description, and error message associations.
                - **Cache Management**: None.
                - **Observability**: Automatically manages error states and ARIA descriptions.
                - **Standardization**: Built on `react-hook-form` primitives.
            *   **Input**
                - **Responsibilities**: A basic text input field for user data entry.
                - **Input Validation**: Standard HTML input attributes.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Supports various input types and focus states.
                - **Standardization**: Shadcn UI Input primitive.
            *   **Label**
                - **Responsibilities**: Provides a textual label for form controls, improving accessibility.
                - **Input Validation**: None.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Built on `@radix-ui/react-label`.
            *   **OfflineImage**
                - **Responsibilities**: An enhanced image component that handles offline states and loading errors gracefully.
                - **Input Validation**: Next.js `ImageProps` extension.
                - **Service Orchestration**: Uses `useOnlineStatus` hook to detect connectivity.
                - **Cache Management**: Relies on Next.js Image caching.
                - **Observability**: Monitors loading errors and switches to fallback sources or icons (e.g., `WifiOff`).
                - **Standardization**: Custom wrapper around Next.js `Image`.
            *   **OfflineIndicator**
                - **Responsibilities**: A persistent visual indicator that appears when the user loses internet connectivity.
                - **Input Validation**: None.
                - **Service Orchestration**: Uses `useOnlineStatus` hook.
                - **Cache Management**: None.
                - **Observability**: Provides immediate feedback on connectivity status via ARIA live regions.
                - **Standardization**: Custom infrastructure component.
            *   **Pagination**
                - **Responsibilities**: Provides navigation controls for splitting large datasets into multiple pages.
                - **Input Validation**: TypeScript props for links and current page.
                - **Service Orchestration**: Uses Next.js `Link` for page transitions.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Shadcn UI Pagination implementation.
            *   **PasswordInput**
                - **Responsibilities**: A specialized input field for passwords, providing visibility toggling and Caps Lock detection.
                - **Input Validation**: Standard password length/complexity via form parent.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Visually alerts user when Caps Lock is active; inclusive design via show/hide password toggle.
                - **Standardization**: Custom extension of the `Input` primitive.
            *   **Popover**
                - **Responsibilities**: Displays rich content in a portal, triggered by an element.
                - **Input Validation**: Radix Popover primitive properties.
                - **Service Orchestration**: Uses `Portal` for overflow safety.
                - **Cache Management**: None.
                - **Observability**: Manages focus and positioning dynamically.
                - **Standardization**: Built on `@radix-ui/react-popover`.
            *   **RadioGroup**
                - **Responsibilities**: A set of checkable buttons where only one can be checked at a time.
                - **Input Validation**: Radix RadioGroup primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Provides clear focus indicators and inclusive touch targets.
                - **Standardization**: Built on `@radix-ui/react-radio-group`.
            *   **ScrollArea**
                - **Responsibilities**: Provides a custom-styled scrollbar for content that exceeds its container's dimensions.
                - **Input Validation**: Radix ScrollArea primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Implements smooth, accessible scrolling behaviors.
                - **Standardization**: Built on `@radix-ui/react-scroll-area`.
            *   **Select**
                - **Responsibilities**: A control that allows users to choose one option from a list of values.
                - **Input Validation**: Radix Select primitive properties.
                - **Service Orchestration**: Uses `Portal` for the dropdown viewport.
                - **Cache Management**: None.
                - **Observability**: Handles keyboard navigation and viewport clipping.
                - **Standardization**: Built on `@radix-ui/react-select`.
            *   **Separator**
                - **Responsibilities**: Visually separates content in a layout, either horizontally or vertically.
                - **Input Validation**: Radix Separator primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: None.
                - **Standardization**: Built on `@radix-ui/react-separator`.
            *   **Sheet**
                - **Responsibilities**: A sidepanel overlay that slides in from the edge of the screen.
                - **Input Validation**: Radix Dialog primitive (reused for Sheet).
                - **Service Orchestration**: Uses `Portal` and `Overlay`.
                - **Cache Management**: None.
                - **Observability**: Supports multiple entry directions (top, bottom, left, right).
                - **Standardization**: Shadcn UI Sheet implementation.
            *   **ShineButton**
                - **Responsibilities**: A premium action button featuring a gradient background and a periodic "shine" animation effect.
                - **Input Validation**: TypeScript props for children and optional icon.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Visual feedback via hover translations and glow effects.
                - **Standardization**: Brand-specific custom interactive component.
            *   **Skeleton**
                - **Responsibilities**: Displays a placeholder preview of content while data is loading.
                - **Input Validation**: Standard HTML attributes.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Uses `animate-pulse` for subtle motion feedback.
                - **Standardization**: Shadcn UI Skeleton primitive.
            *   **StatItem**
                - **Responsibilities**: A specialized display unit for numerical statistics and their descriptive labels.
                - **Input Validation**: `StatItemProps` (number, label).
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Uses brand-specific teal coloring for emphasis.
                - **Standardization**: Custom presentation component.
            *   **Switch**
                - **Responsibilities**: A toggle control that allows users to switch between two states (on/off).
                - **Input Validation**: Radix Switch primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Provides smooth transitions and clear visual state changes.
                - **Standardization**: Built on `@radix-ui/react-switch`.
            *   **Table**
                - **Responsibilities**: Organizes and displays data in a structured, tabular format.
                - **Input Validation**: Standard HTML table attributes.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Supports horizontal scrolling in small viewports.
                - **Standardization**: Shadcn UI Table implementation.
            *   **Tabs**
                - **Responsibilities**: A set of layered sections of content, known as tab panels, that are displayed one at a time.
                - **Input Validation**: Radix Tabs primitive properties.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Manages active state styles and keyboard shortcuts.
                - **Standardization**: Built on `@radix-ui/react-tabs`.
            *   **Textarea**
                - **Responsibilities**: A multi-line text input field for longer user descriptions or notes.
                - **Input Validation**: Standard HTML textarea attributes.
                - **Service Orchestration**: None.
                - **Cache Management**: None.
                - **Observability**: Automatically adjusts to custom minimum heights.
                - **Standardization**: Shadcn UI Textarea primitive.
            *   **Toast / Toaster**
                - **Responsibilities**: Provides brief, non-interruptive feedback about an operation (success, error, info).
                - **Input Validation**: `toastVariants` via `cva` (success, warning, info, destructive).
                - **Service Orchestration**: Orchestrated by `useToast` hook and `Toaster` provider.
                - **Cache Management**: None.
                - **Observability**: Managed via a global notification queue and swipe-to-dismiss interactions.
                - **Standardization**: Built on `@radix-ui/react-toast`.
            *   **Tooltip**
                - **Responsibilities**: Displays a small popup with descriptive text when a user hovers over or focuses an element.
                - **Input Validation**: Radix Tooltip primitive properties.
                - **Service Orchestration**: Uses `Portal` for overflow safety.
                - **Cache Management**: None.
                - **Observability**: Implements small delay timings to prevent visual clutter.
                - **Standardization**: Built on `@radix-ui/react-tooltip`.
    *   **`constants/`**: Centralized repository for application-wide constants, theme tokens, and feature configurations.
        *   **`colors.ts`**: Defines the application's primary color palette and semantic tokens.
            *   **Responsibilities:**
                *   **Brand Identity:** Manages core brand colors (Teal, Purple, Yellow) and surface/deep background gradients.
                *   **Semantic Tokenization:** Provides consistent color tokens for feature-specific UI elements like difficulty levels (Easy/Medium/Hard) and statistical indicators.
                *   **Design System Consistency:** Centralizes custom gray scales and stroke colors to ensure visual uniformity across all components.
                *   **Type Safety:** Exports the `COLORS` object as a constant for immutable, type-safe consumption in styles.
        *   **`features.ts`**: Configures the core value propositions and promotional metrics displayed throughout the application.
            *   **Responsibilities:**
                *   **Feature Discovery:** Defines the `FEATURES` registry (Smart Search, Detailed Solutions, etc.) with associated icons, titles, and descriptions for landing page showcases.
                *   **Social Proof:** Manages the `STATS` collection to display key platform metrics (Problems Available, Active Users) for user engagement.
                *   **Data Modeling:** Leverages shared types (`Feature`, `Stat`) to ensure strict structural integrity for all promotional content.
        *   **`index.ts`**: Serves as the global entry point for shared constants.
            *   **Responsibilities:**
                *   **Barrel Exporting:** Currently acting as a placeholder but intended to aggregate and re-export constants from the directory to simplify import paths for consumers.
    *   **`hooks/`**: Reusable logic for cross-cutting concerns.
        *   **`use-cursor-pagination.ts`**: Standardizes client-side infinity scroll and pagination logic.
            *   **Responsibilities:**
                *   **Standardization:** Provides a unified interface for cursor-based pagination.
                *   **Request Orchestration:** Manages API calls to `/api/companies` with cursor, pageSize, and search parameters.
                *   **Lifecycle Management:** Automatically aborts pending requests on unmount or before starting new requests using `AbortController`.
                *   **Error Handling:** Logs errors via `Logger` and returns structured responses even on failure or cancellation.
        *   **`use-feature-flag.ts`**: React hook for feature flag management.
            *   **Responsibilities:**
                *   **Abstaction:** Wraps the core `isFeatureEnabled` logic for use within React components.
                *   **Performance:** Memoizes the flag check to prevent unnecessary recalculations on re-renders.
        *   **`use-hydration-safe.ts`**: Utilities for handling SSR/CSR hydration mismatches.
            *   **Responsibilities:**
                *   **Hydration Tracking:** Provides `useHydrationSafe` to defer rendering of client-only content until after hydration.
                *   **Layout Effects:** Includes `useIsomorphicLayoutEffect` to safely use layout effects in both SSR and CSR environments.
        *   **`use-media-query.ts`**: Responsive design utility.
            *   **Responsibilities:**
                *   **Viewport Monitoring:** Tracks CSS media queries (e.g., min-width) using `matchMedia`.
                *   **Dynamic Updates:** Automatically updates state when the media query match status changes.
        *   **`use-mounted.ts`**: Tracks the mounting status of a component.
            *   **Responsibilities:**
                *   **Hydration Safety:** Helps avoid hydration mismatches by identifying if the code is running on the client after initial mount.
                *   **Environment Detection:** Initializes state based on the existence of the `window` object.
        *   **`use-navbar-scroll.ts`**: UI state management for the header.
            *   **Responsibilities:**
                *   **Visual Feedback:** Dynamically updates the navbar background opacity based on the window scroll position.
                *   **Event Handling:** Manages scroll event listeners and cleanup.
        *   **`use-online-status.ts`**: Tracks the user's network connectivity.
            *   **Responsibilities:**
                *   **Connectivity Monitoring:** Uses `useSyncExternalStore` to subscribe to browser `online` and `offline` events.
                *   **SSR Awareness:** Safely defaults to `true` (online) during server-side rendering.
        *   **`use-speech.ts`**: Interface for the Web Speech API (Recognition and Synthesis).
            *   **Responsibilities:**
                *   **Speech-to-Text:** Manages `SpeechRecognition` sessions, handling continuous recording, interim results, and microphone permissions.
                *   **Text-to-Speech:** Orchestrates `speechSynthesis` to read out text, including smart content sanitization (removing markdown).
                *   **User Feedback:** Integrates with `useToast` to notify users about recording status and errors.
                *   **Concurrency Control:** Ensures only one recording or speech session is active at a time.
        *   **`use-toast.ts`**: Centralized state management for the toast notification system.
            *   **Responsibilities:**
                *   **State Orchestration:** Manages a global queue of toast notifications through a custom reducer.
                *   **Automated Lifecycle:** Handles the timed dismissal and removal of toasts from the queue.
                *   **Public API:** Provides a descriptive `toast` function with specialized variants (success, error, warning, info).
                *   **Standardization:** Built on `@radix-ui/react-toast` primitives for accessibility and performance.
    *   **`interfaces/`**: Abstract data and service contracts.
        *   **`repository.interface.ts`**: Defines standard contracts for data persistence layers, ensuring consistent data access patterns across all features.
            *   **Responsibilities:**
                *   **Contract Definition:** Defines the `IBaseRepository` interface with generic CRUD operations (`findById`, `findAll`, `save`, `update`, `delete`, `exists`).
                *   **Type Safety:** Utilizes generics for entity types and DTOs to ensure strict type checking during data operations.
                *   **Data Transfer Standardization:** Provides shared interfaces for pagination (`PaginationParams`) and result structures (`PaginatedResult`) for consistent API responses.
        *   **`index.ts`**: Acts as a central barrel export for all shared interfaces, simplifying imports throughout the application.
            *   **Responsibilities:**
                *   **Centralization:** Aggregates all shared interfaces into a single, clean import point.
    *   **`lib/`**: Core infrastructure and third-party integrations.
        *   **`api/`**: Base API infrastructure and standardized communication layer.
            *   **`firebase.ts`**: Initializes and exports Firebase App, Auth, and Firestore instances with multi-tab persistence logic.
                *   **Responsibilities**:
                    *   **Initialization**: Centralizes Firebase initialization (App, Auth, Firestore) for the entire application.
                    *   **Configuration Management**: Loads and validates Firebase configuration from environment variables.
                    *   **Persistence Orchestration**: Implements multi-tab IndexedDB persistence for Firestore to improve offline experience and performance.
                    *   **Singleton Export**: Provides shared, thread-safe instances of `app`, `auth`, and `db` to be used across the service layer.
                    *   **Observability**: Logs warnings if persistence cannot be enabled (e.g., due to multiple tabs or browser limitations).
            *   **`response.ts`**: Defines standardized `ApiResponse`, `ApiError`, and pagination types to ensure consistent communication between client and server.
                *   **Responsibilities**:
                    *   **Standardization**: Defines a unified `ApiResponse<T>` format to ensure consistency across all server actions and API routes.
                    *   **Type Safety**: Provides strictly typed interfaces for success data, error structures (`ApiError`), and metadata (`ResponseMeta`).
                    *   **Pagination Support**: Implements `PaginationMeta` to standardize how list-based results are communicated to the frontend.
                    *   **Factory Methods**: Exports helper functions (`successResponse`, `errorResponse`, `paginatedResponse`) to simplify the creation of compliant response objects.
                    *   **Observability**: Automatically injects ISO timestamps and optional request IDs into every response for tracing and debugging.
            *   **`index.ts`**: Barrel export for API utilities and types.
                *   **Responsibilities**:
                    *   **Module Exposure**: Acts as a barrel file to export all API response utilities and types from a single entry point.
                    *   **Abstraction**: Simplifies import paths for consumers (e.g., `@/shared/lib/api`) and hides internal directory structure.
        *   **`config/`**: Centralized application configurations and registries.
            *   **`feature-flags.ts`**: Implements an environment-aware feature toggle system for gradual fallout and feature gating.
                *   **Responsibilities:**
                    *   **Environment Awareness**: Uses `NEXT_PUBLIC_ENV` to determine the current environment (development, staging, production) and applies flags accordingly.
                    *   **Flag Definitions**: Centralizes configurations for various features (AI Insights, Flashcards, Job Tracker, etc.) with default values and environment-specific overrides.
                    *   **State Management**: Provides `isFeatureEnabled` for runtime checks and `getAllFeatureFlags` for full application state snapshots.
                    *   **Standardization**: Exports `FeatureFlagConfig` and `Environment` types to ensure consistent configuration across the system.
            *   **`navigation.ts`**: Implements a flexible, registry-based navigation system for application-wide routing and actions.
                *   **Responsibilities:**
                    *   **Dynamic Registration**: Allows modules to register navigation items with labels, hrefs, icons, and specialized visibility rules.
                    *   **Context-Aware Visibility**: Employs `isVisible` callbacks using `NavigationContext` (user state, loading) to dynamically show/hide links (e.g., Auth-gated routes).
                    *   **Positioning and Ordering**: Supports different navigation zones (`main`, `auth`, `mobile-bottom`) and numerical ordering for layout consistency.
                    *   **Action Orchestration**: Enables navigation items to trigger complex `onClick` handlers with injected dependencies like `router`, `toast`, and `auth`.
                    *   **Registry Pattern**: Provides a centralized `navigationRegistry` singleton for unified navigation management.
        *   **`di/`**: Core infrastructure for Dependency Injection.
            *   **`container.ts`**: A lightweight, type-safe DI container supporting singleton and transient service registrations.
                *   **Responsibilities:**
                    *   **Dependency Injection:** Provides a lightweight, type-safe container for managing application services and repositories.
                    *   **Service Lifecycle:** Supports both singleton (shared instance) and transient (new instance per resolution) registration patterns.
                    *   **Type Safety:** Leverages TypeScript generics to ensure type-safe service resolution from the container.
                    *   **Testability:** Allows for easy overriding of registrations with mocks or fakes during testing via the `override` method.
                    *   **State Management:** Manages a registry of service factories and instances, providing methods to check for registrations and reset the container.
            *   **`tokens.ts`**: Defines unique symbols for service and repository identification.
                *   **Responsibilities:**
                    *   **Service Identification:** Defines unique `Symbol` based tokens for every service and repository in the system to ensure safe DI resolution.
                    *   **Collision Prevention:** Uses symbols to guarantee uniqueness and prevent naming collisions across different modules.
                    *   **Type Safety:** Exports a `TokenKey` type to ensure only valid token names are used when interacting with the container.
                    *   **Centralized Registry:** Groups all DI tokens in a single, immersive `TOKENS` object for better discoverability and management.
            *   **`index.ts`**: Public API and barrel file for the DI module.
                *   **Responsibilities:**
                    *   **Module Exposure:** Acts as the barrel file for the DI infrastructure, providing a clean public API for the rest of the application.
                    *   **Abstraction:** Simplifies import paths by aggregating and re-exporting the container instance, classes, and tokens.
        *   **`utils/`**: Shared utility library for cross-cutting concerns.
            *   **`cache/`**: Standardized caching layer for Server Components and Actions.
                *   **`index.ts`**: Provides the global `cacheManager` instance, initialized with the `NextCacheAdapter`.
                    *   **Responsibilities:**
                        *   **Singleton Management:** Orchestrates the centralized caching instance used across the server-side application.
                        *   **API Exposure:** Exports the `CacheTTL` and configuration types for unified usage.
                *   **`next-cache-adapter.ts`**: Implements the `CacheAdapter` interface using Next.js `unstable_cache`.
                    *   **Responsibilities:**
                        *   **Data Caching:** Leverages Next.js Data Cache for persistent, shared caching across requests.
                        *   **Dynamic Execution:** Uses dynamic imports to ensure the adapter only operates in server-only contexts (Actions/Server Components).
                        *   **Error Resiliency:** Wraps source functions to log and propagate execution errors during cache misses.
                *   **`server-cache.ts`**: Provides server-only cache invalidation utilities.
                    *   **Responsibilities:**
                        *   **On-Demand Revalidation:** Implements `revalidateCacheTag` for stale-while-revalidate semantics.
                        *   **Immediate Expiration:** Provides `revalidateCacheTagImmediate` for scenarios requiring instant cache purging (e.g., webhooks).
                        *   **Observability:** Logs all revalidation attempts and failures for cache layer debugging.
                *   **`types.ts`**: Defines the contracts and constants for the caching strategy.
                    *   **Responsibilities:**
                        *   **Standardization:** Defines the `CacheTTL` registry (Static, Weekly, Daily, etc.) to ensure consistent expiration policies.
                        *   **Contract Definition:** Establishes the `CacheAdapter` and `CacheOptions` interfaces for framework-agnostic implementation.
            *   **`error-handler.ts`**: Standardizes error management for Server Actions.
                *   **Responsibilities:**
                    *   **Standardization:** Provides `handleServerActionError` to wrap server-side failures in a unified format.
                    *   **Observability:** Automatically logs enriched error context, including action names and custom metadata, via the `Logger`.
                    *   **Client Safety:** Returns sanitized, user-friendly error strings suitable for UI display.
            *   **`event-emitter.ts`**: A generic, typed implementation of the Observer pattern.
                *   **Responsibilities:**
                    *   **Decoupled Communication:** Enables type-safe event-driven interactions across application layers.
                    *   **Asynchronous Flow:** Supports `async` listeners and awaits all emitters, ensuring compatibility with serverless environments.
                    *   **Error Isolation:** Safely executes listeners, catching and logging individual failures to prevent cascading crashes.
            *   **`hydration-monitor.ts`**: Specialized service for tracking and reporting hydration health.
                *   **Responsibilities:**
                    *   **Hydration Tracking:** Monitors client-side hydration events, capturing metrics like duration and success rates.
                    *   **Error Diagnostics:** Captures rich diagnostics (component stack, user agent, URL) when SSR vs. CSR mismatches occur.
                    *   **Threshold Monitoring:** Automatically alerts via `Logger` when hydration error rates exceed configurable thresholds.
                    *   **Performance Sampling:** Respects sampling rates to minimize performance overhead while maintaining statistical reliability.
            *   **`logger.ts`**: A structured, transport-based logging system.
                *   **Responsibilities:**
                    *   **Standardized Logging:** Enforces a consistent `LogEntry` format with timestamps, levels (DEBUG/INFO/WARN/ERROR), and context.
                    *   **Multi-Transport Support:** Orchestrates logging to multiple destinations (currently `ConsoleTransport`) with extensibility for external services.
                    *   **Environment Filtering:** Dynamically adjusts log verbosity based on `NODE_ENV` and `LOG_LEVEL` configurations.
            *   **`lru-cache.ts`**: In-memory LRU (Least Recently Used) cache with TTL support.
                *   **Responsibilities:**
                    *   **Performance Optimization:** Provides fast, in-memory storage for frequently accessed process-level data.
                    *   **Resource Management:** Enforces capacity limits (`maxEntries`) and time-to-live (`ttl`) to prevent memory leaks.
                    *   **Stable Hashing:** Implements `generateKey` with SHA-256 and key sorting for deterministic cache hits across identical object inputs.
            *   **`url.ts`**: URL security and validation utilities.
                *   **Responsibilities:**
                    *   **Security Enforcement:** Provides `isValidRedirectUrl` to prevent Open Redirect vulnerabilities.
                    *   **Input Sanitization:** Validates internal relative paths, blocking protocol-relative URLs (`//`) and malicious characters (backslashes/control chars).
            *   **`index.ts`**: Centralized collection of core UI and data utilities.
                *   **Responsibilities:**
                    *   **Style Composition:** Exports `cn` for safe Tailwind CSS class merging using `twMerge` and `clsx`.
                    *   **SEO & Web Safety:** Implements `slugify` for URL generation and `safeJsonLd` for XSS-safe metadata injection.
                    *   **Asset Management:** Provides `getLogoUrl` to securely append API tokens to trusted logo domains.
                    *   **Deterministic Logic:** Offers `getDeterministicRandom` for consistent UI generation across SSR and client hydration.
    *   **`services/`**: Cross-feature communication layer.
        *   **`event-bus.ts`**: Typed global event emitter for decoupled feature interaction.
            *   **Responsibilities:**
                *   **Decoupled Communication:** Enables type-safe event-driven interactions across application layers.
                *   **Type Safety:** Enforces strict event payloads via `AppEventMap` (e.g., `user:problem_status_changed`, `user:bookmark_toggled`), preventing malformed event data.
                *   **Service Orchestration:** Acts as a central hub for cross-feature signaling without direct dependency coupling.
                *   **Asynchronous Flow:** Supports standard and asynchronous listeners, ensuring compatibility with complex side effects.
                *   **Standardization:** Provides a unified `appEvents` instance for consistent event handling across the system.
    *   **`types/`**: Domain-agnostic type definitions and shared data contracts.
        *   **`amp.d.ts`**: Provides TypeScript declaration for AMP (Accelerated Mobile Pages) components.
            *   **Responsibilities:**
                *   **JSX Extension:** Extends the building `JSX.IntrinsicElements` to support AMP-specific tags like `<amp-ad>` and `<amp-auto-ads>` within React/Next.js.
                *   **Browser API Polyfills:** Defines missing or experimental browser interfaces like `SpeechRecognition` and `SpeechRecognitionEvent` for type-safe interaction.
        *   **`common.ts`**: Centralizes generic domain types and shared validation logic.
            *   **Responsibilities:**
                *   **Slug Validation:** Defines and exports the `SlugSchema` (Zod) and `Slug` type ensuring consistent URL slug formats across the application.
        *   **`result.ts`**: Implements a robust `Result<T, E>` pattern for explicit, type-safe error handling.
            *   **Responsibilities:**
                *   **Encapsulation:** Provides `Success` and `Failure` classes to wrap operation outcomes, avoiding the use of exceptions for expected business failures.
                *   **Functional API:** Offers methods like `map`, `flatMap`, and `getOrElse` for declarative result processing.
                *   **Factory Utilities:** Exports `success()` and `failure()` helpers to simplify result creation.
        *   **`service-error.ts`**: Defines the standardized error structure for the service layer.
            *   **Responsibilities:**
                *   **Error Taxonomy:** Defines the `ServiceErrorCode` union (e.g., `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`) for programmatic error categorization.
                *   **Standardized Interface:** Provides the `ServiceError` interface, ensuring every service failure carries a consistent payload (code, message, details, cause).
        *   **`ui.ts`**: Centralizes types and interfaces for common UI patterns.
            *   **Responsibilities:**
                *   **Component Contracts:** Defines props for cross-cutting components like `FeatureCard` and `StatItem`.
                *   **Data Models:** Provides inferred types for standard UI data structures like `Feature` and `Stat`.
        *   **`user.ts`**: Bridges auth-related types and core user entities.
            *   **Responsibilities:**
                *   **Domain Re-export:** Provides convenient re-exports for user-related entities (`UserProfile`, `WorkExperience`, etc.) to maintain backward compatibility.
                *   **Auth Orchestration:** Defines the `AuthContextType` interface, establishing the contract for global authentication state management.
        *   **`index.ts`**: The primary entry point (barrel file) for the shared types module.
            *   **Responsibilities:**
                *   **Centralized Aggregation:** Re-exports types from internal files and consolidates related types from feature-specific modules (AI, Companies, Problems) to provide a unified import path.

### 5. `src/lib` & `src/providers` (Support Layer)
*   **`src/lib`:** Manages cross-cutting concerns, such as Dependency Injection (`di`) configurations and external library wrappers.
    *   **`di/`:** Central hub for Dependency Injection orchestration and service resolution across all application features.
        *   **`index.ts`:** Central export point for DI registrations and resolution helpers.
            *   **Responsibilities:**
                *   **Public API:** Exports registration functions and typed resolvers to be consumed by the application entry point and features.
                *   **Abstraction:** Provides a clean interface for dependency resolution, shielding consumers from the underlying container implementation.
        *   **`registrations.ts`:** Orchestrates the global registration of all feature-specific dependencies and provides typed resolution helpers.
            *   **Responsibilities:**
                *   **Dependency Orchestration:** Aggregates and invokes registration functions from individual features (`problems`, `companies`, `profile`, `contact`).
                *   **Global Registration:** Provides the `registerDependencies` entry point used to initialize the DI container at application startup.
                *   **Typed Resolvers:** Exports specialized functions (e.g., `getProblemService`, `getCompanyRepository`) that resolve dependencies with full TypeScript type safety, eliminating the need for manual token management in consumers.
                *   **Container Access:** Provides controlled access to the shared DI container for resolving core services and repositories.
*   **`src/providers`:** Manages global React state via Context Providers to wrap the application root.
    *   **`auth-provider.tsx`:** Provides authentication context wrapper for the application.
        *   **Responsibilities:**
            *   **Context Bridging:** Re-exports `AuthContext`, `AuthProvider`, and `useAuth` from the authentication feature.
            *   **Abstraction:** Provides a unified entry point for authentication context, shielding the root layout from feature-specific paths.
            *   **Compatibility:** Ensures backwards compatibility and ease of use across the application.
    *   **`theme-provider.tsx`:** Manages light/dark mode theme state.
        *   **Responsibilities:**
            *   **Library Integration:** Wraps the `next-themes` `ThemeProvider` for application-wide theme management.
            *   **Configuration:** Handles theme attributes (e.g., `class`) and default settings (e.g., `dark` mode).
            *   **Client-Side Rendering:** Explicitly marked as a client-side component to manage theme state in the browser.
    *   **`index.ts`:** Barrel export for all global providers.
        *   **Responsibilities:**
            *   **Centralization:** Aggregates all global providers into a single, clean import point.
            *   **Developer Experience:** Simplifies usage in root layouts by allowing multiple providers to be imported from `@/providers`.

## Architectural Insights

*   **Dependency Flow:** Dependencies generally point inwards.
    *   `app` depends on `features` and `shared`.
    *   `features` depends on `core` and `shared`.
    *   `core` is independent.
    *   `shared` is a horizontal layer available to all upper layers.
*   **Modularity:** The feature-based structure makes the codebase highly scalable. New features can be added with minimal impact on existing code.
*   **Testability:** The separation of domain logic in `core` and features allows for isolated unit testing (located in `src/tests`).
