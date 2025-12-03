
import * as dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { collection, getDocs, doc, setDoc, getDoc, writeBatch, getFirestore } from "firebase/firestore";
// We need to import db dynamically or ensure side effects happen after config
// But since we need 'db' for the script, let's just import it dynamically inside the function or use a require if we were cjs.
// In ESM with tsx, top level await is supported.

// Let's try to import firebase after config.
// Note: Static imports are hoisted. We must use dynamic import.

// Polyfill slugify if import fails or just define it here to be safe
function safeSlugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

async function migrateProblems() {
  const { db } = await import("../src/lib/firebase");
  console.log("Starting migration...");

  try {
    const companiesCol = collection(db, "companies");
    const companiesSnap = await getDocs(companiesCol);

    if (companiesSnap.empty) {
      console.log("No companies found.");
      return;
    }

    console.log(`Found ${companiesSnap.size} companies.`);

    const problemsCol = collection(db, "problems");
    let totalMigrated = 0;

    for (const companyDoc of companiesSnap.docs) {
      const companyId = companyDoc.id;
      const companyData = companyDoc.data();
      const companySlug = companyData.slug || safeSlugify(companyData.name);
      
      console.log(`Processing company: ${companyData.name} (${companyId})`);

      const companyProblemsCol = collection(db, "companies", companyId, "problems");
      const problemsSnap = await getDocs(companyProblemsCol);

      if (problemsSnap.empty) {
        console.log(`  No problems found for ${companyData.name}.`);
        continue;
      }

      console.log(`  Found ${problemsSnap.size} problems.`);

      const batchSize = 500;
      let batch = writeBatch(db);
      let operationCount = 0;

      for (const problemDoc of problemsSnap.docs) {
        const problemData = problemDoc.data();
        const problemSlug = problemData.slug || safeSlugify(problemData.title);
        
        if (!problemSlug) {
            console.warn(`  Skipping problem ${problemDoc.id} due to missing slug/title.`);
            continue;
        }

        const problemRef = doc(problemsCol, problemSlug);
        
        // We need to read the existing doc to merge correctly if it exists
        // But doing a read for every write is slow. 
        // For migration, we can assume we might overwrite or we can try to be smart.
        // Since we want to merge `companyIds` and `companies` map, we should probably read.
        // To optimize, we could read all existing root problems first if the set is small, 
        // but let's stick to read-modify-write for safety, or use set with merge if structure allows.
        // Firestore `set` with `merge: true` merges top-level fields. 
        // But merging arrays (companyIds) is not directly supported by `merge: true` in the way we want (union).
        // We need `arrayUnion`.
        
        // However, we can't use `arrayUnion` easily in a batch set without knowing if doc exists? 
        // Actually `update` works if doc exists, `set` if not.
        // Let's just read it. It's a migration script, speed is secondary to correctness.
        
        const existingDocSnap = await getDoc(problemRef);
        let existingData: any = existingDocSnap.exists() ? existingDocSnap.data() : {};

        const companyIds = new Set(existingData.companyIds || []);
        companyIds.add(companyId);

        const companiesMap = existingData.companies || {};
        companiesMap[companyId] = {
            lastAskedPeriod: problemData.lastAskedPeriod || existingData.companies?.[companyId]?.lastAskedPeriod,
            // Add other company-specific fields here if needed
        };

        const mergedData = {
            ...existingData, // Keep existing fields
            ...problemData, // Overwrite with current problem data (careful here, maybe we prefer existing if it's already there?)
            // Actually, common fields like title, difficulty, tags should be roughly same. 
            // Let's prefer the new data but ensure we don't lose anything.
            slug: problemSlug,
            normalizedTitle: problemData.normalizedTitle || safeSlugify(problemData.title),
            companyIds: Array.from(companyIds),
            companies: companiesMap,
            // Remove legacy single-company fields from the root object to avoid confusion, 
            // OR keep them as "primary" or "last seen" values? 
            // The type definition still has them as legacy. Let's keep them for now but they might be ambiguous.
            // Better to rely on `companies` map.
        };

        // Remove legacy fields from the root if we want to clean up, but for type compatibility we might leave them.
        // Let's just write the merged data.

        batch.set(problemRef, mergedData);
        operationCount++;
        totalMigrated++;

        if (operationCount >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            operationCount = 0;
            console.log(`  Committed batch.`);
        }
      }

      if (operationCount > 0) {
        await batch.commit();
        console.log(`  Committed final batch for company.`);
      }
    }

    console.log(`Migration complete. Migrated ${totalMigrated} problems.`);

  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateProblems();
