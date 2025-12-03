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
    companies: ["problems"], // Based on hasData check, though main problems seem to be at root
  },
};

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
  const backup: BackupData = {};

  for (const colName of SCHEMA.root) {
    console.log(`Backing up collection: ${colName}`);
    backup[colName] = {};
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);

    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      const docData = docSnap.data();
      
      // Convert Timestamps to dates or strings for JSON serialization
      const serializedData = serializeData(docData);

      backup[colName][docId] = {
        data: serializedData,
      };

      // Check for subcollections
      if (colName in SCHEMA.subcollections) {
        const subCols = SCHEMA.subcollections[colName as keyof typeof SCHEMA.subcollections];
        if (subCols) {
          backup[colName][docId].subcollections = {};
          
          for (const subColName of subCols) {
            const subColRef = collection(db, colName, docId, subColName);
            const subSnapshot = await getDocs(subColRef);
            
            if (!subSnapshot.empty) {
               console.log(`  Found subcollection ${subColName} for doc ${docId} (${subSnapshot.size} docs)`);
               backup[colName][docId].subcollections![subColName] = {};
               
               for (const subDocSnap of subSnapshot.docs) {
                 backup[colName][docId].subcollections![subColName][subDocSnap.id] = {
                   data: serializeData(subDocSnap.data())
                 };
               }
            }
          }
          
          // Clean up empty subcollections object if no data found
          if (Object.keys(backup[colName][docId].subcollections!).length === 0) {
            delete backup[colName][docId].subcollections;
          }
        }
      }
    }
    console.log(`Finished collection: ${colName} (${snapshot.size} docs)`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `firestore-backup-${timestamp}.json`;
  const outputPath = path.join(process.cwd(), filename);

  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2));
  console.log(`Backup saved to ${outputPath}`);
}

function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'object') {
    // Handle Firestore Timestamp
    if (data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length === 2) {
       // It's likely a Timestamp object from the SDK (or similar structure)
       // We can convert to ISO string for JSON
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
    for (const key in data) {
      newData[key] = serializeData(data[key]);
    }
    return newData;
  }

  return data;
}

backupFirestore().catch(console.error);
