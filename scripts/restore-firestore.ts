import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  collection,
  doc,
  setDoc,
  writeBatch,
  getFirestore,
  Timestamp,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

async function restoreFirestore() {
  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../src/lib/firebase");

  if (!db) {
    console.error("Firestore not initialized");
    return;
  }

  const args = process.argv.slice(2);
  let backupFile = args[0];

  if (!backupFile) {
    // Find the latest backup file
    const files = fs.readdirSync(process.cwd())
      .filter(f => f.startsWith("firestore-backup-") && f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length > 0) {
      backupFile = files[0];
      console.log(`No backup file specified. Using latest: ${backupFile}`);
    } else {
      console.error("No backup file specified and no backups found in current directory.");
      console.error("Usage: npx tsx scripts/restore-firestore.ts <backup-file.json>");
      return;
    }
  }

  const backupPath = path.resolve(process.cwd(), backupFile);
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found: ${backupPath}`);
    return;
  }

  console.log(`Reading backup from ${backupPath}...`);
  const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));

  console.log("Starting Firestore restore...");

  for (const colName of Object.keys(backupData)) {
    console.log(`Restoring collection: ${colName}`);
    const colData = backupData[colName];
    
    // Process in batches of 500
    const docs = Object.entries(colData);
    const batchSize = 500;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      
      for (const [docId, docEntry] of chunk) {
        const entry = docEntry as any;
        const docRef = doc(db, colName, docId);
        const data = deserializeData(entry.data);
        batch.set(docRef, data);
      }
      
      await batch.commit();
      console.log(`  Committed batch of ${chunk.length} docs to ${colName}`);
    }

    // Handle subcollections separately (cannot be batched with parent easily if we want to keep structure simple)
    // Actually we can batch them too, but let's iterate again to keep logic clean or do it inline.
    // Doing it inline is better but we need to manage batch size across multiple collections.
    // For simplicity, let's just iterate again for subcollections.
    
    for (const [docId, docEntry] of docs) {
      const entry = docEntry as any;
      if (entry.subcollections) {
        for (const subColName of Object.keys(entry.subcollections)) {
          console.log(`  Restoring subcollection ${subColName} for doc ${docId}`);
          const subColData = entry.subcollections[subColName];
          const subDocs = Object.entries(subColData);
          
          for (let j = 0; j < subDocs.length; j += batchSize) {
            const subBatch = writeBatch(db);
            const subChunk = subDocs.slice(j, j + batchSize);
            
            for (const [subDocId, subDocEntry] of subChunk) {
              const subEntry = subDocEntry as any;
              const subDocRef = doc(db, colName, docId, subColName, subDocId);
              const subData = deserializeData(subEntry.data);
              subBatch.set(subDocRef, subData);
            }
            
            await subBatch.commit();
          }
        }
      }
    }
  }

  console.log("Restore complete.");
}

function deserializeData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(deserializeData);
    }

    const newData: any = {};
    for (const key in data) {
      const value = data[key];
      
      // Check if value is an ISO date string
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
        // Convert to Timestamp
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
           newData[key] = Timestamp.fromDate(date);
           continue;
        }
      }
      
      newData[key] = deserializeData(value);
    }
    return newData;
  }

  return data;
}

restoreFirestore().catch(console.error);
