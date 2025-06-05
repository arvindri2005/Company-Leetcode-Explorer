
'use server';

import type { Company, LastAskedPeriod } from '@/types';
import { addCompanyToDb, getCompanies as getAllCompaniesFromDbInternal } from '@/lib/data';
import { revalidatePath, revalidateTag } from 'next/cache';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc, FieldValue, collection, query, orderBy, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { slugify } from '@/lib/utils';

/**
 * Adds a new company to the database.
 * @param {Omit<Company, 'id' | 'normalizedName' | 'slug'>} companyDataInput - The data for the company to add.
 * @returns {Promise<{ success: boolean; data?: Company; error?: string }>} Result of the operation.
 */
export async function addCompany(
  companyDataInput: Omit<Company, 'id' | 'normalizedName' | 'slug'>
): Promise<{ success: boolean; data?: Company; error?: string }> {
  try {
    if (!companyDataInput.name) {
      return { success: false, error: 'Company name is required.' };
    }

    let companyData = { ...companyDataInput };
    if (companyData.website && !companyData.website.startsWith('http')) {
      companyData.website = `https://${companyData.website}`;
    }
    if (companyData.logo && !companyData.logo.startsWith('http')) {
      companyData.logo = `https://${companyData.logo}`;
    }
    // Validate URLs after potential prefixing
    if (companyData.website) {
      try { new URL(companyData.website); }
      catch { return { success: false, error: `Invalid website URL: ${companyData.website}. Ensure it includes http:// or https://.` }; }
    }
    if (companyData.logo) {
      try { new URL(companyData.logo); }
      catch { return { success: false, error: `Invalid logo URL: ${companyData.logo}. Ensure it includes http:// or https://.` }; }
    }

    const { id: newCompanyId, error: dbError, alreadyExists } = await addCompanyToDb(companyData);

    if (dbError || !newCompanyId) {
      if (alreadyExists) return { success: false, error: dbError };
      return { success: false, error: dbError || 'Failed to save company to the database.' };
    }
    revalidateTag('companies-collection-broad');
    revalidatePath('/');
    revalidatePath('/add-company');
    return { success: true, data: { ...companyData, id: newCompanyId, slug: slugify(companyData.name), normalizedName: companyData.name.toLowerCase() } };
  } catch (error) {
    console.error('Error adding company (action level):', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while adding the company.' };
  }
}


interface RawExcelCompanyData { name: string; logo?: string; description?: string; website?: string; }
interface BulkAddCompanyDetailedResult { rowIndex: number; name: string; status: 'added' | 'updated' | 'skipped' | 'error'; message: string; }

/**
 * Adds or updates multiple companies from an Excel sheet.
 * If a company with the same name (case-insensitive) exists, its logo and description are updated.
 * @param {RawExcelCompanyData[]} companiesFromExcel - Array of raw company data parsed from Excel.
 * @returns {Promise<{ addedCount: number; updatedCount: number; skippedCount: number; errorCount: number; detailedResults: BulkAddCompanyDetailedResult[] }>} Summary and detailed results.
 */
export async function bulkAddCompanies(
  companiesFromExcel: RawExcelCompanyData[]
): Promise<{ addedCount: number; updatedCount: number; skippedCount: number; errorCount: number; detailedResults: BulkAddCompanyDetailedResult[] }> {
  let added = 0, updated = 0, skipped = 0, errors = 0;
  const detailedResults: BulkAddCompanyDetailedResult[] = [];
  const companiesToRevalidateSlugs = new Set<string>();
  const companiesToRevalidateIds = new Set<string>();

  const existingData = await getAllCompaniesFromDbInternal({ pageSize: 100000 });
  const companyMap = new Map(existingData.companies.map(c => [c.normalizedName || c.name.toLowerCase(), c]));

  for (let i = 0; i < companiesFromExcel.length; i++) {
    const raw = companiesFromExcel[i];
    let name = String(raw.name || '').trim();
    if (!name) { errors++; detailedResults.push({ rowIndex: i, name: '(No Name)', status: 'error', message: 'Missing company name.' }); continue; }

    let logo = String(raw.logo || '').trim();
    let website = String(raw.website || '').trim();
    const description = String(raw.description || '').trim();

    if (website && !website.startsWith('http')) website = `https://${website}`;
    if (logo && !logo.startsWith('http')) logo = `https://${logo}`;

    if (website) {
        try { new URL(website); }
        catch { errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Invalid Website URL: ${website}.`}); continue; }
    }
    if (logo) {
        try { new URL(logo); }
        catch { errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Invalid Logo URL: ${logo}.`}); continue; }
    }

    const existingCompany = companyMap.get(name.toLowerCase());
    const currentSlug = slugify(name);

    if (existingCompany) {
      const payload: Partial<Company> & { normalizedName?: string; logo?: FieldValue | string; description?: FieldValue | string; website?: FieldValue | string, slug?: string } = {};
      let needsUpdate = false;

      if (name !== existingCompany.name || currentSlug !== existingCompany.slug) {
        payload.name = name;
        payload.normalizedName = name.toLowerCase();
        payload.slug = currentSlug;
        needsUpdate = true;
      }

      if (logo === '' && existingCompany.logo) { payload.logo = FieldValue.delete(); needsUpdate = true; }
      else if (logo && logo !== existingCompany.logo) { payload.logo = logo; needsUpdate = true; }

      if (description === '' && existingCompany.description) { payload.description = FieldValue.delete(); needsUpdate = true; }
      else if (description && description !== existingCompany.description) { payload.description = description; needsUpdate = true; }

      if (website === '' && existingCompany.website) { payload.website = FieldValue.delete(); needsUpdate = true; }
      else if (website && website !== existingCompany.website) { payload.website = website; needsUpdate = true; }


      if (needsUpdate && Object.keys(payload).length > 0) {
        try {
          await firestoreUpdateDoc(firestoreDoc(db, 'companies', existingCompany.id), payload);
          updated++; detailedResults.push({ rowIndex: i, name, status: 'updated', message: 'Updated existing company.' }); 
          companiesToRevalidateSlugs.add(currentSlug);
          companiesToRevalidateIds.add(existingCompany.id);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : 'Unknown error during update.';
          errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: `Update failed: ${errorMsg}` });
        }
      } else if (!detailedResults.find(r => r.rowIndex === i && r.status === 'error')) {
        skipped++; detailedResults.push({ rowIndex: i, name, status: 'skipped', message: 'No changes needed.' });
      }
    } else {
      const result = await addCompanyToDb({ name, logo: logo || undefined, description: description || undefined, website: website || undefined });
      if (result.id) {
        added++; detailedResults.push({ rowIndex: i, name, status: 'added', message: 'Added new company.' }); 
        companiesToRevalidateSlugs.add(currentSlug);
        companiesToRevalidateIds.add(result.id);
      } else {
        errors++; detailedResults.push({ rowIndex: i, name, status: 'error', message: result.error || 'Database error occurred adding new company.' });
      }
    }
  }

  if (added > 0 || updated > 0) {
    revalidateTag('companies-collection-broad');
    companiesToRevalidateSlugs.forEach(slug => revalidateTag(`company-slug-${slug}`));
    companiesToRevalidateIds.forEach(id => revalidateTag(`company-detail-${id}`));
    ['/', '/add-company', '/submit-problem', '/bulk-add-problems', '/bulk-add-companies', '/companies'].forEach(p => revalidatePath(p));
    companiesToRevalidateSlugs.forEach(slug => revalidatePath(`/company/${slug}`));
  }

  return { addedCount: added, updatedCount: updated, skippedCount: skipped, errorCount: errors, detailedResults };
}

/**
 * Fetches a paginated list of companies, optionally filtered by a search term.
 * This is the main action for displaying the full list of companies.
 * @param {number} page - The current page number (1-indexed).
 * @param {number} pageSize - The number of companies per page.
 * @param {string} [searchTerm] - Optional search term to filter companies by name or description.
 * @returns {Promise<{ companies: Company[]; totalPages: number; totalCompanies: number; currentPage: number; error?: string }>} Paginated company data or an error object.
 */
export async function fetchCompaniesAction(
  page: number, pageSize: number, searchTerm?: string
): Promise<{ companies: Company[]; totalPages: number; totalCompanies: number; currentPage: number; error?: string }> {
  try {
    return await getAllCompaniesFromDbInternal({ page, pageSize, searchTerm });
  } catch (error) {
    console.error('Error fetching companies in action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching companies.';
    return { companies: [], totalPages: 0, totalCompanies: 0, currentPage: 1, error: message };
  }
}

/**
 * Fetches a list of company names and slugs for search suggestions.
 * @param {string} searchTerm - The term to search for in company names.
 * @param {number} [limitNum=5] - Maximum number of suggestions to return.
 * @returns {Promise<Array<Pick<Company, 'id' | 'name' | 'slug'>> | { error: string }>} Array of suggestions or an error object.
 */
export async function fetchCompanySuggestionsAction(
  searchTerm: string,
  limitNum: number = 5
): Promise<Array<Pick<Company, 'id' | 'name' | 'slug' | 'logo'>> | { error: string }> {
  if (!searchTerm || searchTerm.trim().length < 1) {
    return [];
  }
  try {
    const companiesCol = collection(db, 'companies');
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
    
    const q = query(
      companiesCol,
      orderBy('normalizedName'),
      where('normalizedName', '>=', lowercasedSearchTerm),
      where('normalizedName', '<=', lowercasedSearchTerm + '\uf8ff'),
      limit(limitNum)
    );

    const querySnapshot = await getDocs(q);
    const suggestions = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug || slugify(data.name),
        logo: data.logo, // Include logo for richer suggestions
      } as Pick<Company, 'id' | 'name' | 'slug' | 'logo'>;
    });
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching company suggestions in action:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching suggestions.';
    return { error: message };
  }
}
    
