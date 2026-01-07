# Company LeetCode Explorer (AI-Powered)

Welcome to the Company LeetCode Explorer! This Next.js application is designed to help software engineers prepare for technical interviews by providing a platform to explore LeetCode problems frequently asked by specific companies. It's supercharged with AI features to offer problem insights, personalized strategies, and more.

## 🚀 Try it Now

### [🎯 Visit ByteToOffer.com Now! 🎯](https://bytetooffer.com/companies)

Supercharge your interview preparation with AI-powered tools, company-specific problem sets, and more.
Don't wait - start practicing with our cutting-edge platform today!

## ✨ Key Features

- **Company & Problem Database**:
  - Browse a curated list of companies and their associated LeetCode problems.
  - View problem details including difficulty, tags, LeetCode link, and recency (last asked period).
- **Data Management**:
  - Submit new LeetCode problems and associate them with companies.
  - Add new companies to the platform.
  - **Bulk Upload**: Efficiently add multiple problems or companies at once using Excel (.xlsx) files.
- **Advanced Filtering & Sorting**:
  - Filter problems on company pages by difficulty, tags (via search), "last asked" period, and personal progress status.
  - Sort problems by title, difficulty, or "last asked" recency.
- **User Authentication & Personalization**:
  - Secure user signup and login using Firebase Authentication.
  - **Profile Page**: View your account details and manage your progress.
  - **Edit Profile**: Update your display name.
  - **Problem Bookmarking**: Save problems for later review.
  - **Progress Tracking**: Mark problems as "Solved," "Attempted," or "To-Do."
- **AI-Powered Interview Preparation Tools (via Genkit & Google Gemini)**:
  - **Similar Problem Suggestions**: For any given problem, get AI suggestions for conceptually similar LeetCode problems.
  - **Problem Insights Generation**: AI provides key concepts, common data structures/algorithms, and a high-level hint for a selected problem.
  - **Company-Specific Flashcard Generation**: AI creates study flashcards based on concepts found in problems frequently asked by a specific company.
  - **Personalized Interview Strategy**: AI generates a tailored preparation strategy for a selected company, adaptable for different target role levels (e.g., Internship, New Grad, Experienced).
  - **AI Problem Grouping**: AI automatically categorizes a company's problems into related themes or concepts for structured learning.
- **Modern & Responsive UI**:
  - Built with Next.js App Router, React, ShadCN UI components, and Tailwind CSS.
  - Fully responsive design for optimal viewing on desktop, tablet, and mobile devices.
  - **Theme Customization**: Switch between Light, Dark, and System default themes.
- **Company Statistics**:
  - Visual breakdown of problems by difficulty and "last asked" period using pie charts on company detail pages.


## 🛠️ Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Language**: TypeScript
-   **UI**: React 19, ShadCN UI, Tailwind CSS
-   **AI Integration**: Genkit (with Google Gemini models)
-   **Database**: Firebase Firestore
-   **Authentication**: Firebase Authentication
-   **Form Handling**: React Hook Form + Zod
-   **Data Fetching & Caching**: Next.js Server Actions, `unstable_cache`
-   **Excel Parsing**: `xlsx` library

## 📚 Developer Guide

New to the project? Check out our detailed **[Developer Guide](./guide)** for everything you need to know!

-   **[Getting Started](./guide/getting-started.md)**: Setup and installation.
-   **[Project Structure](./guide/project-structure.md)**: Architecture and directory layout.
-   **[Coding Standards](./guide/coding-standards.md)**: Naming conventions and style guide.
-   **[Adding Features](./guide/feature-workflow.md)**: Step-by-step workflow.
-   **[Testing Guidelines](./guide/testing.md)**: Best practices for unit and component testing.
-   **[AI Architecture](./src/ai/README.md)**: Overview of Genkit flows and AI integration.
-   **[Data Layer Patterns](./guide/data-layer.md)**: Repositories, validation, and persistence.
-   **[Filter Registry](./guide/filter-registry.md)**: How to implement complex filters combining DB and memory logic.
-   **[UI Guidelines](./guide/ui-guidelines.md)**: Colors, typography, and component usage.
-   **[Advanced Patterns](./guide/advanced-patterns.md)**: Event bus, SOLID principles, and error handling.

## 🤝 Contributing

Contributions are welcome! Please see our **[Contribution Guide](./guide/contribution.md)**.
