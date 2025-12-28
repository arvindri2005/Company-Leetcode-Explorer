
import fs from "fs";
import path from "path";
import { loadEnv, calculateChecksum } from "./utils";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";

// Load env vars BEFORE importing firebase
loadEnv();

async function main() {
  const args = process.argv.slice(2);
  const backupFile = args[0];

  if (!backupFile) {
    console.error("❌ Usage: tsx scripts/restore-firestore.ts <path-to-backup-file>");
    process.exit(1);
  }

  console.log(`🔓 Vault: Starting Restore Process from ${backupFile}...`);

  try {
    // 1. Read and Verify
    const content = fs.readFileSync(backupFile, "utf-8");
    const parsed = JSON.parse(content);

    if (!parsed.metadata || !parsed.data) {
      throw new Error("❌ Invalid backup file format.");
    }

    console.log("🔍 Verifying integrity...");
    const computedChecksum = calculateChecksum(parsed.data);
    if (computedChecksum !== parsed.metadata.checksum) {
      throw new Error(`❌ Integrity Mismatch! Metadata: ${parsed.metadata.checksum}, Computed: ${computedChecksum}`);
    }
    console.log("✅ Integrity Verified.");

    // 2. Initialize Firebase
    const { db } = await import("@/lib/firebase");

    // 3. Restore
    for (const [colName, docs] of Object.entries(parsed.data)) {
      if (!Array.isArray(docs)) continue;

      console.log(`♻️ Restoring collection: ${colName} (${docs.length} docs)...`);

      // Use batches (max 500 ops per batch)
      const BATCH_SIZE = 450;
      let batch = writeBatch(db);
      let opCount = 0;
      let batchCount = 0;

      for (const item of docs) {
        const docData = item as any;
        if (!docData.id) {
          console.warn("   ⚠️ Skipping document without ID");
          continue;
        }

        const docRef = doc(db, colName, docData.id);
        const { id, ...data } = docData; // Remove ID from data payload

        batch.set(docRef, data);
        opCount++;

        if (opCount >= BATCH_SIZE) {
          await batch.commit();
          batchCount++;
          console.log(`   - Committed batch ${batchCount}`);
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
        console.log(`   - Committed final batch`);
      }
      console.log(`   ✅ Restored ${colName}.`);
    }

    console.log("🎉 Restore Complete!");

  } catch (error) {
    console.error("❌ Restore Failed:", error);
    process.exit(1);
  }
}

main();
