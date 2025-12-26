import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  collection,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Define known collections and subcollections
const SCHEMA = {
  root: ["companies", "problems", "users", "contact-messages"],
  subcollections: {
    users: [
      "bookmarkedProblems",
      "problemProgress",
      "educationHistory",
      "workExperience",
      "strategyTodoLists",
    ],
    companies: ["problems"],
  },
};

interface BackupMetadata {
  timestamp: string;
  version: string;
  counts: Record<string, number>;
  checksum: string;
  environment: string;
}

interface BackupFile {
  metadata: BackupMetadata;
  data: BackupData;
}

interface BackupData {
  [collectionName: string]: {
    [docId: string]: {
      data: DocumentData;
      subcollections?: {
        [subColName: string]: {
          [subDocId: string]: {
            data: DocumentData;
          };
        };
      };
    };
  };
}

async function backupFirestore() {
  // Dynamic import to ensure env vars are loaded first
  const { db } = await import("../src/lib/firebase");

  if (!db) {
    console.error("Firestore not initialized");
    return;
  }

  console.log("Starting Firestore backup...");
  const backupData: BackupData = {};
  const counts: Record<string, number> = {};

  for (const colName of SCHEMA.root) {
    console.log(`Backing up collection: ${colName}`);
    backupData[colName] = {};
    counts[colName] = 0;

    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);

      for (const docSnap of snapshot.docs) {
        const docId = docSnap.id;
        const docData = docSnap.data();

        // Convert Timestamps to dates or strings for JSON serialization
        const serializedData = serializeData(docData);

        backupData[colName][docId] = {
          data: serializedData,
        };
        counts[colName]++;

        // Check for subcollections
        if (colName in SCHEMA.subcollections) {
          const subCols = SCHEMA.subcollections[colName as keyof typeof SCHEMA.subcollections];
          if (subCols) {
            
            for (const subColName of subCols) {
              const subColRef = collection(db, colName, docId, subColName);
              const subSnapshot = await getDocs(subColRef);

              if (!subSnapshot.empty) {
                 if (!backupData[colName][docId].subcollections) {
                    backupData[colName][docId].subcollections = {};
                 }

                 console.log(`  Found subcollection ${subColName} for doc ${docId} (${subSnapshot.size} docs)`);
                 backupData[colName][docId].subcollections![subColName] = {};

                 for (const subDocSnap of subSnapshot.docs) {
                   backupData[colName][docId].subcollections![subColName][subDocSnap.id] = {
                     data: serializeData(subDocSnap.data())
                   };
                 }
              }
            }
          }
        }
      }
      console.log(`Finished collection: ${colName} (${snapshot.size} docs)`);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn(`Skipping collection ${colName}: Permission denied.`);
      } else {
        console.error(`Error backing up collection ${colName}:`, error);
      }
    }
  }

  // Calculate Checksum
  console.log("Calculating checksum...");
  const dataString = JSON.stringify(backupData); // Consistent serialization needed? JSON.stringify is usually consistent enough for this if keys order is not guaranteed but here we just read it back.
  // Actually, for verification we just need to match what we write.
  const checksum = crypto.createHash("sha256").update(dataString).digest("hex");

  const metadata: BackupMetadata = {
    timestamp: new Date().toISOString(),
    version: "1.1.0",
    counts,
    checksum,
    environment: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown",
  };

  const backupFile: BackupFile = {
    metadata,
    data: backupData, // In a real scenario, we might want to keep data as a separate string to avoid double serialization cost, but memory is cheap here.
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `firestore-backup-${timestamp}.json`;
  const outputPath = path.join(process.cwd(), filename);

  console.log(`Writing backup to ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(backupFile, null, 2));

  // Verify
  console.log("Verifying backup integrity...");
  const fileContent = fs.readFileSync(outputPath, "utf-8");
  const loadedBackup = JSON.parse(fileContent);
  const loadedDataString = JSON.stringify(loadedBackup.data);
  const loadedChecksum = crypto.createHash("sha256").update(loadedDataString).digest("hex");

  if (loadedChecksum === checksum) {
      console.log("✅ Backup verified successfully: Checksum matches.");
  } else {
      console.error("❌ Backup verification FAILED: Checksum mismatch!");
      console.error(`Expected: ${checksum}`);
      console.error(`Actual:   ${loadedChecksum}`);
      // Don't delete, but warn loudly
  }
}

function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'object') {
    // Handle Firestore Timestamp
    if (data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length === 2) {
       return new Date(data.seconds * 1000 + data.nanoseconds / 1000000).toISOString();
    }
    
    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }

    if (Array.isArray(data)) {
      return data.map(serializeData);
    }

    const newData: any = {};
    const sortedKeys = Object.keys(data).sort(); // Sort keys for consistent serialization if needed, though JSON.stringify(obj) order is not guaranteed.
    // However, since we verify by reading back the JSON, exact byte match of 'data' part depends on how we stringify it.
    // We used JSON.stringify(backupData) for checksum.
    // When we read back `loadedBackup.data` and `JSON.stringify` it, it must match.
    // Node's JSON.stringify is deterministic for same object structure.

    for (const key of sortedKeys) {
      newData[key] = serializeData(data[key]);
    }
    return newData;
  }

  return data;
}

backupFirestore().catch(console.error);
