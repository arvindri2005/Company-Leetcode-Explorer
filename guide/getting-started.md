# Getting Started

Follow these instructions to set up and run the project locally.

## Prerequisites

-   Node.js (v20 or later recommended)
-   npm or yarn
-   A Firebase project
-   A Google Cloud project with access to Generative AI models (e.g., Gemini via Google AI Studio or Vertex AI)

## 1. Clone the Repository

```bash
git clone https://github.com/arvindri2005/Company-Leetcode-Explorer.git
cd Company-Leetcode-Explorer
```

## 2. Install Dependencies

```bash
npm install
# or
# yarn install
```

## 3. Set Up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project or select an existing one.
3. In your project, enable **Firestore Database**. Create it in **Production mode** and choose a region.
4. Enable **Firebase Authentication**.
    - Navigate to the "Authentication" section.
    - Go to the "Sign-in method" tab.
    - Enable the **Email/Password** provider.
5. From your Firebase project settings (Project Overview > Project settings > General tab), find your web app's Firebase configuration (API Key, Auth Domain, Project ID, etc.).

## 4. Set Up Google Generative AI

1. Go to [Google AI Studio](https://aistudio.google.com/) or your Google Cloud Console.
2. Obtain an API key for the Generative AI models (e.g., Gemini).
    - In Google AI Studio: Click "Get API key" > "Create API key in new project" (or existing).
    - In Google Cloud Console: Ensure the "Vertex AI API" or "Generative Language API" is enabled, then create an API key under "APIs & Services" > "Credentials."
3. **Important**: Treat this API key as a secret.

## 5. Configure Environment Variables

1. In the root of your project, create a file named `.env.local`.
2. Add your Firebase configuration and Google AI API key to this file. The `src/ai/genkit.ts` file expects `GOOGLE_API_KEY`.

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


## 6. Set Up Firestore Security Rules

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



## 7. Run the Development Server

```bash
npm run dev
# or
# yarn dev
```

Your application should now be running on `http://localhost:3000`.

## 8. Genkit Development Server (for AI features)

To see AI flow traces and debug AI features locally, run the Genkit development UI in a separate terminal:

```bash
npm run genkit:dev
# or if you prefer with watch mode for AI flow changes:
# npm run genkit:watch
```

This will typically start the Genkit UI on `http://localhost:4000`.

## 9. Running Tests

This project uses Jest for testing. You can run the test suite with the following commands:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm test:watch
```

## 10. Next Steps

To dive deeper into our engineering standards, check out these specific guides:

*   [**Testing Guidelines**](./testing.md): How to write unit and component tests.
*   [**Performance & Scalability**](./performance.md): rendering strategies and optimization techniques.
*   [**Advanced Patterns**](./advanced-patterns.md): Architecture, error handling, and scalable design patterns.
*   [**UI Guidelines**](./ui-guidelines.md): Design system and styling conventions.

