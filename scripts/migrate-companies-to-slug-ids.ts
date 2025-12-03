import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import { slugify } from "../src/lib/utils";

async function migrateCompanies() {
  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../src/lib/firebase");
  
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }

  console.log("Starting migration...");

  const companiesCol = collection(db, "companies");
  const snapshot = await getDocs(companiesCol);
  const companies = snapshot.docs;

  console.log(`Found ${companies.length} companies to check.`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const companyDoc of companies) {
    const data = companyDoc.data();
    const currentId = companyDoc.id;
    const name = data.name;

    if (!name) {
      console.warn(`Company ${currentId} has no name, skipping.`);
      errorCount++;
      continue;
    }

    const slug = data.slug || slugify(name);
    
    // If the current ID is already the slug, skip
    if (currentId === slug) {
      console.log(`Company "${name}" already has slug ID (${slug}), skipping.`);
      skippedCount++;
      continue;
    }

    console.log(`Migrating "${name}" (ID: ${currentId}) to ID: ${slug}...`);

    try {
      // 1. Check if target doc already exists (collision check)
      const targetDocRef = doc(companiesCol, slug);
      const targetDocSnap = await getDoc(targetDocRef);

      if (targetDocSnap.exists()) {
        console.warn(`Target document ${slug} already exists! Merging/Overwriting...`);
        // In this case, we might want to merge or just skip if it's a duplicate.
        // For safety, let's assume if it exists, we just update references and delete the old one?
        // Or maybe we should just skip and let manual intervention handle duplicates.
        // Let's skip for now to avoid data loss.
        console.warn(`SKIPPING migration for ${name} due to existing target doc.`);
        errorCount++;
        continue;
      }

      // 2. Create new document with slug ID
      await setDoc(targetDocRef, {
        ...data,
        slug: slug, // Ensure slug is set correctly
        id: slug,   // Update ID field if it exists in data (though usually ID is not stored in data)
      });

      // 3. Update all problems referencing the old ID
      const problemsCol = collection(db, "problems");
      const problemsQuery = query(
        problemsCol,
        where("companyIds", "array-contains", currentId)
      );
      const problemsSnapshot = await getDocs(problemsQuery);

      if (!problemsSnapshot.empty) {
        console.log(`Updating ${problemsSnapshot.size} problems referencing ${currentId}...`);
        const batch = writeBatch(db);
        
        problemsSnapshot.docs.forEach((probDoc) => {
          const probData = probDoc.data();
          const newCompanyIds = (probData.companyIds || []).map((id: string) => 
            id === currentId ? slug : id
          );
          
          // Also update the companies map if it exists
          const newCompaniesMap = { ...probData.companies };
          if (newCompaniesMap[currentId]) {
            newCompaniesMap[slug] = newCompaniesMap[currentId];
            delete newCompaniesMap[currentId];
          }

          batch.update(doc(problemsCol, probDoc.id), {
            companyIds: newCompanyIds,
            companies: newCompaniesMap,
          });
        });

        await batch.commit();
      }

      // 4. Delete old document
      await deleteDoc(doc(companiesCol, currentId));
      
      migratedCount++;
      console.log(`Successfully migrated "${name}".`);

    } catch (error) {
      console.error(`Failed to migrate "${name}":`, error);
      errorCount++;
    }
  }

  console.log("\nMigration complete.");
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

migrateCompanies().catch(console.error);
