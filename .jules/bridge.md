# Bridge's Journal

## 🌉 Bridge's Journal

This log tracks critical architectural discoveries, tight coupling "knots," and improvements made to the system's modularity.

### 🔍 Architectural Friction Log

#### [Date: Current] - Initial Survey
- **`src/lib/utils.ts`**: Contains a mix of unrelated utilities: Tailwind helpers, string manipulation, URL logic (with env dependency), and generic JS helpers. This is a mild "Everything Bagel".
- **`src/services/user.service.ts`**: Tightly coupled to `userRepository` via direct import. While common in simple apps, it makes testing harder without mocking the module.
- **`src/hooks/use-problem-interactions.tsx`**: Mixes UI logic (Toasts, Routing) with Business Logic (UserService). A classic "Fat Hook".
- **`src/lib/logger.ts`**: Clean implementation of Strategy pattern. Good example.

### 🌉 Spans (Improvements)

#### [Date: Current] - Decoupling UI Constants from Domain Types
- **💡 What**: Extracted `PROBLEM_STATUS_OPTIONS`, `PROBLEM_STATUS_DISPLAY`, `lastAskedPeriodOptions`, and `lastAskedPeriodDisplayMap` from `src/types/problem.ts` into a new `src/constants/problem-constants.ts` file.
- **🎯 Why**: These constants define UI configuration (labels, icons, colors) and were improperly located in a Type definition file. This coupled the UI layer to the Domain Type layer, meaning a simple text change required editing a file that defines database schemas.
- **🏗️ Architecture**: Created a dedicated `constants/` module to house UI-driven configuration, allowing `types/` to remain focused on data shape.
- **🔬 Verification**: Verified successful build and confirmed all 4 consumers (`use-problem-interactions`, `problem-list-controls`, `problem-status-icon`, `problem-submission-form`) now import from the new module.
