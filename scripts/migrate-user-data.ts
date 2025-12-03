
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";

async function migrateUserData() {
  const { db } = await import("../src/lib/firebase");
  console.log("Starting user data migration...");

  try {
    const usersCol = collection(db, "users");
    const usersSnap = await getDocs(usersCol);

    if (usersSnap.empty) {
      console.log("No users found.");
      return;
    }

    console.log(`Found ${usersSnap.size} users.`);

    let totalBookmarksMigrated = 0;
    let totalStatusMigrated = 0;

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      console.log(`Processing user: ${userId}`);

      // Migrate Bookmarks
      const bookmarksCol = collection(db, "users", userId, "bookmarkedProblems");
      const bookmarksSnap = await getDocs(bookmarksCol);
      
      if (!bookmarksSnap.empty) {
          const batch = writeBatch(db);
          let ops = 0;
          
          for (const bookmarkDoc of bookmarksSnap.docs) {
              const data = bookmarkDoc.data();
              const oldId = bookmarkDoc.id;
              const newId = data.problemSlug;

              if (newId && newId !== oldId) {
                  const newRef = doc(bookmarksCol, newId);
                  const oldRef = doc(bookmarksCol, oldId);
                  
                  batch.set(newRef, data);
                  batch.delete(oldRef);
                  ops++;
                  totalBookmarksMigrated++;
              }
          }
          
          if (ops > 0) {
              await batch.commit();
              console.log(`  Migrated ${ops} bookmarks.`);
          }
      }

      // Migrate Problem Progress
      const progressCol = collection(db, "users", userId, "problemProgress");
      const progressSnap = await getDocs(progressCol);

      if (!progressSnap.empty) {
          const batch = writeBatch(db);
          let ops = 0;

          for (const progressDoc of progressSnap.docs) {
              const data = progressDoc.data();
              const oldId = progressDoc.id;
              const newId = data.problemSlug;

              if (newId && newId !== oldId) {
                  const newRef = doc(progressCol, newId);
                  const oldRef = doc(progressCol, oldId);

                  batch.set(newRef, data);
                  batch.delete(oldRef);
                  ops++;
                  totalStatusMigrated++;
              }
          }

          if (ops > 0) {
              await batch.commit();
              console.log(`  Migrated ${ops} problem statuses.`);
          }
      }
    }

    console.log(`User data migration complete.`);
    console.log(`Total bookmarks migrated: ${totalBookmarksMigrated}`);
    console.log(`Total statuses migrated: ${totalStatusMigrated}`);

  } catch (error) {
    console.error("User data migration failed:", error);
  }
}

migrateUserData();
