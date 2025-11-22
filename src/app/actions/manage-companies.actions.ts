"use server";

import { getCompanies, updateCompanyInDb, deleteCompanyFromDb, bulkDeleteCompaniesFromDb } from "@/lib/data";
import { checkUserAdminStatus } from "@/app/actions/admin.actions";
import { auth } from "@/lib/firebase"; // NOTE: This might be client-side auth, we need server-side auth checking if possible, or trust the client passes UID and we verify admin status.
// Actually, `admin.actions` uses `checkUserAdminStatus` which takes a userId. 
// Standard pattern here seems to be: 
// 1. Client ensures user is logged in.
// 2. Server action checks permissions using a passed ID or context.
// However, `getCompanies` is public. `update` and `delete` are protected.

// Since we are in "use server", we usually need a way to verify identity. 
// Assuming the calling context (Admin Dashboard) ensures the user is admin.
// But for security, we should verify inside the action.
// The `checkUserAdminStatus` reads from Firestore. We need the current user's ID.
// In Next.js App Router with Firebase, usually we pass the UID or use cookies.
// For now, I'll accept the UID as a parameter for security check, or rely on the fact that these are called from an admin page.
// Better: Ask for userId in the action or assume it's passed.
// I will require `userId` as the first argument for mutation actions to verify admin status.

import { Company } from "@/types";

/**
 * Fetches all companies for the admin table.
 * We use a large pageSize to simulate "fetching all" for the client-side table.
 */
export async function fetchAllCompaniesAction() {
  // 1000 should be enough for now. If it grows larger, we'll need real pagination.
  const result = await getCompanies({ pageSize: 1000 });
  // If there are more than 1000, we might need a loop, but let's start simple.
  return { companies: result.companies };
}

/**
 * Updates a company.
 */
export async function updateCompanyAction(userId: string, companyId: string, data: Partial<Company>) {
  const isAdmin = await checkUserAdminStatus(userId);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: User is not an admin." };
  }

  return await updateCompanyInDb(companyId, data);
}

/**
 * Deletes a company.
 */
export async function deleteCompanyAction(userId: string, companyId: string) {
  const isAdmin = await checkUserAdminStatus(userId);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: User is not an admin." };
  }

  return await deleteCompanyFromDb(companyId);
}

/**
 * Bulk deletes companies.
 */
export async function bulkDeleteCompaniesAction(userId: string, companyIds: string[]) {
  const isAdmin = await checkUserAdminStatus(userId);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: User is not an admin." };
  }

  return await bulkDeleteCompaniesFromDb(companyIds);
}
