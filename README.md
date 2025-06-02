
# Company LeetCode Explorer (AI-Powered)

Welcome to the Company LeetCode Explorer! This Next.js application is designed to help software engineers prepare for technical interviews by providing a platform to explore LeetCode problems frequently asked by specific companies. It's supercharged with AI features to offer mock interviews, problem insights, personalized strategies, and more.

## 🌐 Official Site

Visit the official site at [https://www.bytetooffer.com/](https://www.bytetooffer.com/) for more resources and information.


## ✨ Key Features

*   **Company & Problem Database**:
    *   Browse a curated list of companies and their associated LeetCode problems.
    *   View problem details including difficulty, tags, LeetCode link, and recency (last asked period).
*   **Data Management**:
    *   Submit new LeetCode problems and associate them with companies.
    *   Add new companies to the platform.
    *   **Bulk Upload**: Efficiently add multiple problems or companies at once using Excel (.xlsx) files.
*   **Advanced Filtering & Sorting**:
    *   Filter problems on company pages by difficulty, tags (via search), "last asked" period, and personal progress status.
    *   Sort problems by title, difficulty, or "last asked" recency.
*   **User Authentication & Personalization**:
    *   Secure user signup and login using Firebase Authentication.
    *   **Profile Page**: View your account details and manage your progress.
    *   **Edit Profile**: Update your display name.
    *   **Problem Bookmarking**: Save problems for later review.
    *   **Progress Tracking**: Mark problems as "Solved," "Attempted," or "To-Do."
*   **AI-Powered Interview Preparation Tools (via Genkit & Google Gemini)**:
    *   **Mock Interviews**: Engage in an interactive mock coding interview with an AI interviewer that provides guidance, feedback on your approach, and suggests follow-up questions. Supports text and voice input/output.
    *   **Similar Problem Suggestions**: For any given problem, get AI suggestions for conceptually similar LeetCode problems.
    *   **Problem Insights Generation**: AI provides key concepts, common data structures/algorithms, and a high-level hint for a selected problem.
    *   **Company-Specific Flashcard Generation**: AI creates study flashcards based on concepts found in problems frequently asked by a specific company.
    *   **Personalized Interview Strategy**: AI generates a tailored preparation strategy for a selected company, adaptable for different target role levels (e.g., Internship, New Grad, Experienced).
    *   **AI Problem Grouping**: AI automatically categorizes a company's problems into related themes or concepts for structured learning.
*   **Modern & Responsive UI**:
    *   Built with Next.js App Router, React, ShadCN UI components, and Tailwind CSS.
    *   Fully responsive design for optimal viewing on desktop, tablet, and mobile devices.
    *   **Theme Customization**: Switch between Light, Dark, and System default themes.
*   **Company Statistics**:
    *   Visual breakdown of problems by difficulty and "last asked" period using pie charts on company detail pages.

## 🛠️ Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI**: React, ShadCN UI, Tailwind CSS
*   **AI Integration**: Genkit (with Google Gemini models)
*   **Database**: Firebase Firestore
*   **Authentication**: Firebase Authentication
*   **Form Handling**: React Hook Form + Zod
*   **Data Fetching & Caching**: Next.js Server Actions, `unstable_cache`
*   **Excel Parsing**: `xlsx` library

## 🤝 Contributing

Contributions are welcome! This project is open source, and we encourage you to contribute to make it even better. If you have ideas for new features, bug fixes, or improvements, please feel free to submit pull requests or open issues. Let's work together to help more software engineers ace their technical interviews!

## 🚀 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Firebase project
*   A Google Cloud project with access to Generative AI models (e.g., Gemini via Google AI Studio or Vertex AI)

### 1. Clone the Repository

```bash
git clone https://github.com/arvindri2005/Company-Leetcode-Explorer.git
cd Company-Leetcode-Explorer
```

### 2. Install Dependencies

```bash
npm install
# or
# yarn install
```

### 3. Set Up Firebase

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new Firebase project or select an existing one.
3.  In your project, enable **Firestore Database**. Create it in **Production mode** and choose a region.
4.  Enable **Firebase Authentication**.
    *   Navigate to the "Authentication" section.
    *   Go to the "Sign-in method" tab.
    *   Enable the **Email/Password** provider.
5.  From your Firebase project settings (Project Overview > Project settings > General tab), find your web app's Firebase configuration (API Key, Auth Domain, Project ID, etc.).

### 4. Set Up Google Generative AI

1.  Go to [Google AI Studio](https://aistudio.google.com/) or your Google Cloud Console.
2.  Obtain an API key for the Generative AI models (e.g., Gemini).
    *   In Google AI Studio: Click "Get API key" > "Create API key in new project" (or existing).
    *   In Google Cloud Console: Ensure the "Vertex AI API" or "Generative Language API" is enabled, then create an API key under "APIs & Services" > "Credentials."
3.  **Important**: Treat this API key as a secret.

### 5. Configure Environment Variables

1.  In the root of your project, create a file named `.env.local`.
2.  Add your Firebase configuration and Google AI API key to this file. The `src/ai/genkit.ts` file expects `GOOGLE_API_KEY`.

    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

    # Google Generative AI API Key
    GOOGLE_API_KEY=your_google_generative_ai_api_key
    ```
    Replace the `your_...` placeholders with your actual credentials.
    **Ensure `.env.local` is added to your `.gitignore` file to prevent committing secrets.**

### 6. Set Up Firestore Security Rules

For the application to function correctly, you need to set up appropriate security rules for your Firestore database.
Go to your Firebase project > Firestore Database > Rules.
Replace the default rules with the following (adjust for production as needed):

```firestore-rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Companies: Publicly readable, restrict writes (e.g., to admin or specific functions)
    match /companies/{companyId} {
      allow read: if true;
      allow write: if request.auth != null; // Example: Allow writes if user is authenticated. Refine for admin-only.
    }

    // Problems: Publicly readable, restrict writes
    match /problems/{problemId} {
      allow read: if true;
      allow write: if request.auth != null; // Example: Allow writes if user is authenticated. Refine for admin-only.
    }

    // Users: Users can read and write their own profile and associated subcollections
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId; // Usually handled by Firebase Auth user creation trigger

      // Bookmarked Problems subcollection
      match /bookmarkedProblems/{problemId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }

      // Problem Progress subcollection
      match /problemProgress/{problemId} {
        allow read, write, delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```
Click **Publish** to save your rules. **Review and tighten these rules for a production environment according to your security needs.**

### 7. Seed the Database (Optional but Recommended)

The project includes a seed script (`src/lib/seed.ts`) to populate your Firestore database with initial company and problem data. This is helpful for quickly getting started and testing features.

To run the seed script:
1.  The seed script is currently designed to be run manually or adapted. One way is to temporarily add a button in a development page that calls the `seedDatabase` function.
2.  Alternatively, you can adapt it into a standalone script:
    *   Install `tsx` and `dotenv`: `npm install --save-dev tsx dotenv`
    *   Uncomment the `main` function call at the bottom of `src/lib/seed.ts`.
    *   Run: `npm run seed` (add `"seed": "tsx src/lib/seed.ts"` to your `package.json` scripts).

    **Note**: The seed script checks if collections are empty before seeding. It uses specific IDs for companies to ensure problem data links correctly.

### 8. Run the Development Server

```bash
npm run dev
# or
# yarn dev
```
Your application should now be running on `http://localhost:9002` (or another port if 9002 is busy).

### 9. Genkit Development Server (for AI features)

To see AI flow traces and debug AI features locally, run the Genkit development UI in a separate terminal:
```bash
npm run genkit:dev
# or if you prefer with watch mode for AI flow changes:
# npm run genkit:watch
```
This will typically start the Genkit UI on `http://localhost:4000`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs, feature requests, or improvements.
