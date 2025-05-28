
// To run this script, you might need to temporarily adjust your Firestore rules
// or run it in an environment that has admin access (e.g., Firebase Admin SDK).
// For client-side seeding with NEXT_PUBLIC_ variables, ensure your rules allow writes.
// Example command if you adapt this to be a runnable script: `npx tsx src/lib/seed.ts`

import { db } from './firebase'; // Ensure your firebase.ts uses NEXT_PUBLIC_ env vars for client-side execution
import { collection, doc, writeBatch, getDocs, query, limit } from 'firebase/firestore';
import type { Company, LeetCodeProblem } from '@/types';

// Original data for seeding
const initialCompaniesData: Omit<Company, 'id'>[] = [
  { name: 'Google', normalizedName: 'google', logo: 'https://logo.clearbit.com/google.com', description: 'Focuses on algorithms, data structures, and system design.', website: 'https://careers.google.com/' },
  { name: 'Amazon', normalizedName: 'amazon', logo: 'https://logo.clearbit.com/amazon.com', description: 'Often asks about data structures, algorithms, and leadership principles.', website: 'https://www.amazon.jobs/' },
  { name: 'Microsoft', normalizedName: 'microsoft', logo: 'https://logo.clearbit.com/microsoft.com', description: 'Covers a broad range of topics including OS, networking, and DS/Algo.', website: 'https://careers.microsoft.com/' },
  { name: 'Meta', normalizedName: 'meta', logo: 'https://logo.clearbit.com/meta.com', description: 'Strong emphasis on algorithms, system design, and product sense.', website: 'https://www.metacareers.com/' },
  { name: 'Apple', normalizedName: 'apple', logo: 'https://logo.clearbit.com/apple.com', description: 'Known for questions on data structures, algorithms, and iOS/macOS specifics.', website: 'https://www.apple.com/careers/' }
];

// Use specific IDs for companies to match existing problem companyId references
const companyIds: Record<string, string> = {
  Google: 'google',
  Amazon: 'amazon',
  Microsoft: 'microsoft',
  Meta: 'meta',
  Apple: 'apple',
};

// Ensure all problems have a normalizedTitle for seeding
const initialProblemsData: (Omit<LeetCodeProblem, 'id' | 'normalizedTitle'> & { normalizedTitle: string })[] = [
  { title: 'Two Sum', normalizedTitle: 'two sum', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/', tags: ['Array', 'Hash Table'], companyId: 'google', lastAskedPeriod: 'last_30_days' },
  { title: 'Merge K Sorted Lists', normalizedTitle: 'merge k sorted lists', difficulty: 'Hard', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', tags: ['Linked List', 'Heap', 'Divide and Conquer'], companyId: 'google', lastAskedPeriod: 'within_3_months' },
  { title: 'Longest Substring Without Repeating Characters', normalizedTitle: 'longest substring without repeating characters', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', tags: ['Hash Table', 'String', 'Sliding Window'], companyId: 'google', lastAskedPeriod: 'within_6_months' },
  { title: 'Number of Islands', normalizedTitle: 'number of islands', difficulty: 'Medium', link: 'https://leetcode.com/problems/number-of-islands/', tags: ['Array', 'DFS', 'BFS', 'Union Find'], companyId: 'google', lastAskedPeriod: 'older_than_6_months' },
  { title: 'Kth Largest Element in an Array', normalizedTitle: 'kth largest element in an array', difficulty: 'Medium', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', tags: ['Array', 'Divide and Conquer', 'Sorting', 'Heap'], companyId: 'amazon', lastAskedPeriod: 'last_30_days' },
  { title: 'LRU Cache', normalizedTitle: 'lru cache', difficulty: 'Medium', link: 'https://leetcode.com/problems/lru-cache/', tags: ['Hash Table', 'Linked List', 'Design'], companyId: 'amazon', lastAskedPeriod: 'within_3_months' },
  { title: 'Reorder Data in Log Files', normalizedTitle: 'reorder data in log files', difficulty: 'Easy', link: 'https://leetcode.com/problems/reorder-data-in-log-files/', tags: ['Array', 'String', 'Sorting'], companyId: 'amazon', lastAskedPeriod: 'older_than_6_months' },
  { title: 'Critical Connections in a Network', normalizedTitle: 'critical connections in a network', difficulty: 'Hard', link: 'https://leetcode.com/problems/critical-connections-in-a-network/', tags: ['DFS', 'Graph', 'Biconnected Component'], companyId: 'amazon', lastAskedPeriod: 'older_than_6_months' },
  { title: 'Reverse Linked List', normalizedTitle: 'reverse linked list', difficulty: 'Easy', link: 'https://leetcode.com/problems/reverse-linked-list/', tags: ['Linked List', 'Recursion'], companyId: 'microsoft', lastAskedPeriod: 'within_6_months' },
  { title: 'Validate Binary Search Tree', normalizedTitle: 'validate binary search tree', difficulty: 'Medium', link: 'https://leetcode.com/problems/validate-binary-search-tree/', tags: ['Tree', 'DFS', 'BFS', 'Binary Search Tree'], companyId: 'microsoft', lastAskedPeriod: 'last_30_days' },
  { title: 'Serialize and Deserialize Binary Tree', normalizedTitle: 'serialize and deserialize binary tree', difficulty: 'Hard', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', tags: ['Tree', 'Design', 'DFS', 'BFS', 'String'], companyId: 'microsoft', lastAskedPeriod: 'older_than_6_months' },
  { title: 'Copy List with Random Pointer', normalizedTitle: 'copy list with random pointer', difficulty: 'Medium', link: 'https://leetcode.com/problems/copy-list-with-random-pointer/', tags: ['Hash Table', 'Linked List'], companyId: 'microsoft', lastAskedPeriod: 'within_3_months' },
  { title: 'Add Two Numbers', normalizedTitle: 'add two numbers', difficulty: 'Medium', link: 'https://leetcode.com/problems/add-two-numbers/', tags: ['Linked List', 'Math', 'Recursion'], companyId: 'meta', lastAskedPeriod: 'within_6_months' },
  { title: 'Product of Array Except Self', normalizedTitle: 'product of array except self', difficulty: 'Medium', link: 'https://leetcode.com/problems/product-of-array-except-self/', tags: ['Array', 'Prefix Sum'], companyId: 'meta', lastAskedPeriod: 'last_30_days' },
  { title: 'Binary Tree Right Side View', normalizedTitle: 'binary tree right side view', difficulty: 'Medium', link: 'https://leetcode.com/problems/binary-tree-right-side-view/', tags: ['Tree', 'DFS', 'BFS'], companyId: 'meta', lastAskedPeriod: 'older_than_6_months' },
  { title: 'Find Median from Data Stream', normalizedTitle: 'find median from data stream', difficulty: 'Hard', link: 'https://leetcode.com/problems/find-median-from-data-stream/', tags: ['Heap', 'Design', 'Two Pointers'], companyId: 'apple', lastAskedPeriod: 'within_3_months' },
  { title: 'Meeting Rooms II', normalizedTitle: 'meeting rooms ii', difficulty: 'Medium', link: 'https://leetcode.com/problems/meeting-rooms-ii/', tags: ['Array', 'Heap', 'Greedy', 'Sorting'], companyId: 'apple', lastAskedPeriod: 'within_6_months' },
];

export async function seedDatabase() {
  console.log('Starting database seed...');
  const batch = writeBatch(db);

  // Check if companies collection is empty
  const companiesCol = collection(db, 'companies');
  const companiesQuery = query(companiesCol, limit(1));
  const companiesSnapshot = await getDocs(companiesQuery);

  if (companiesSnapshot.empty) {
    console.log('Seeding companies...');
    initialCompaniesData.forEach((companyData) => {
      const companyIdToUse = companyIds[companyData.name]; // Assumes companyData.name exists in companyIds map
      const companyNameToSeed = companyData.name; // Store original name for normalizedName logic
      
      if (companyIdToUse) {
        const companyRef = doc(db, 'companies', companyIdToUse);
        // Ensure normalizedName is included from initialCompaniesData or generated
        const dataToSet: Company = {
            id: companyIdToUse, // Not strictly needed in the data itself if ID is the doc ID
            name: companyNameToSeed,
            normalizedName: companyData.normalizedName || companyNameToSeed.toLowerCase(),
            logo: companyData.logo,
            description: companyData.description,
            website: companyData.website,
        };
        // Firestore's set function for a DocRef doesn't need the id field inside the data object
        const { id, ...restOfData } = dataToSet; 
        batch.set(companyRef, restOfData);
      } else {
         console.warn(`Company ID for ${companyNameToSeed} not found in mapping. Skipping.`);
      }
    });
  } else {
    console.log('Companies collection is not empty. Skipping company seeding.');
  }

  // Check if problems collection is empty
  const problemsCol = collection(db, 'problems');
  const problemsQuery = query(problemsCol, limit(1));
  const problemsSnapshot = await getDocs(problemsQuery);

  if (problemsSnapshot.empty) {
    console.log('Seeding problems...');
    initialProblemsData.forEach((problemData) => { 
      const problemRef = doc(collection(db, 'problems'));
      // The normalizedTitle is already part of problemData in the updated array
      batch.set(problemRef, problemData);
    });
  } else {
    console.log('Problems collection is not empty. Skipping problem seeding. If you need to update existing problems with normalizedTitle, a migration script would be required.');
  }

  try {
    await batch.commit();
    console.log('Database batch commit successful (data written if collections were empty).');
  } catch (error) {
    console.error('Error committing seed batch to database: ', error);
  }
}

// To run this script:
// 1. Ensure your .env file is populated with Firebase credentials.
// 2. Install tsx and dotenv: `npm install --save-dev tsx dotenv`
// 3. Add to package.json scripts: "seed": "tsx src/lib/seed.ts"
// 4. Run `npm run seed`
// Note: This process assumes client-side Firebase config is sufficient for write access
// during seeding, or Firestore rules are temporarily adjusted.
/*
import dotenv from 'dotenv';
import path from 'path';

async function main() {
  // Load .env file from project root
  const envPath = path.resolve(__dirname, '../../.env');
  console.log(`Loading .env file from: ${envPath}`);
  dotenv.config({ path: envPath });


  // Verify environment variables are loaded (optional)
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("Firebase environment variables are not loaded. Make sure .env file is correct and at the project root.");
    process.exit(1);
  }
  
  console.log(`Using Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  await seedDatabase();
  console.log("Seeding script finished.");
}

if (require.main === module) {
  main().catch(console.error);
}
*/
