import { db } from "@/lib/firebase";
import { Firestore, Timestamp } from "firebase/firestore";
import { Company } from "@/types";
import { slugify } from "@/lib/utils";

// Helper function to ensure db is not null
export function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

export function mapFirestoreDocToCompany(
  docSnap: import("firebase/firestore").DocumentSnapshot,
): Company {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    slug: data.slug || docSnap.id || slugify(data.name || ""),
    name: data.name || docSnap.id.charAt(0).toUpperCase() + docSnap.id.slice(1),
    normalizedName: data.normalizedName || data.name?.toLowerCase() || docSnap.id.toLowerCase(),
    logo: data.logo,
    description: data.description,
    website: data.website,
    problemCount: data.problemCount || 0,
    difficultyCounts: data.difficultyCounts || {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    },
    recencyCounts: data.recencyCounts || {
      last_30_days: 0,
      within_3_months: 0,
      within_6_months: 0,
      older_than_6_months: 0,
    },
    commonTags: data.commonTags || [],
    relatedCompanies: data.relatedCompanies || [],
    statsLastUpdatedAt:
      data.statsLastUpdatedAt instanceof Timestamp
        ? data.statsLastUpdatedAt.toDate()
        : undefined,
  };
}

// Helper to encode cursor
export function encodeCursor(data: { normalizedName: string; id: string }): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

// Helper to decode cursor
export function decodeCursor(cursor: string): { normalizedName: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch (e) {
    console.error("Failed to decode cursor:", e);
    return null;
  }
}
