
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";

async function createUserAggregates() {
  const { db } = await import("../src/lib/firebase");
  console.log("Starting user aggregate creation...");

  try {
    const usersCol = collection(db, "users");
    const usersSnap = await getDocs(usersCol);

    if (usersSnap.empty) {
      console.log("No users found.");
      return;
    }

    console.log(`Found ${usersSnap.size} users. Processing...`);

    let totalUsersProcessed = 0;

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`Processing user: ${userId}`);

      const solvedProblemIds: string[] = [];
      const attemptedProblemIds: string[] = [];
      const bookmarkedProblemIds: string[] = [];

      // 1. Fetch Problem Progress
      const progressCol = collection(db, "users", userId, "problemProgress");
      const progressSnap = await getDocs(progressCol);
      progressSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'solved') {
              solvedProblemIds.push(doc.id);
          } else if (data.status === 'attempted') {
              attemptedProblemIds.push(doc.id);
          }
      });

      // 2. Fetch Bookmarks
      const bookmarksCol = collection(db, "users", userId, "bookmarkedProblems");
      const bookmarksSnap = await getDocs(bookmarksCol);
      bookmarksSnap.forEach((doc) => {
          bookmarkedProblemIds.push(doc.id);
      });

      // 3. Write Aggregate
      // Only write if there is data, or write empty struct if we want to ensure it exists?
      // Best to write even if empty so frontend finds it and doesn't assume error.
      const aggregateDocRef = doc(db, "users", userId, "aggregates", "problemStats");
      
      await setDoc(aggregateDocRef, {
          solvedProblemIds,
          attemptedProblemIds,
          bookmarkedProblemIds,
          aggregatedAt: new Date() // useful for debugging
      });

      console.log(`  -> Aggregated: ${solvedProblemIds.length} solved, ${attemptedProblemIds.length} attempted, ${bookmarkedProblemIds.length} bookmarked.`);
      totalUsersProcessed++;
    }

    console.log(`Migration complete. Processed ${totalUsersProcessed} users.`);

  } catch (error) {
    console.error("Migration failed:", error);
  }
}

createUserAggregates();
