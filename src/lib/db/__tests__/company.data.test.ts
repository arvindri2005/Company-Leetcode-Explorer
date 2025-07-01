const mockCollection = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockGetCountFromServer = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockWhere = jest.fn();
const mockStartAfter = jest.fn();
const mockDoc = jest.fn();
const mockTriggerRevalidation = jest.fn();

class MockTimestamp {
    private date: Date;
    constructor(date?: Date) { this.date = date || new Date(); }
    toDate() { return this.date; }
    static now() { return new MockTimestamp(); }
}

let mockDbValue: any = {};
jest.mock('@/lib/firebase', () => ({ get db() { return mockDbValue; } }));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: mockCollection,
  getDocs: mockGetDocs,
  doc: mockDoc,
  getDoc: mockGetDoc,
  addDoc: mockAddDoc,
  getCountFromServer: mockGetCountFromServer,
  query: mockQuery,
  orderBy: mockOrderBy,
  limit: mockLimit,
  where: mockWhere,
  startAfter: mockStartAfter,
  Timestamp: MockTimestamp,
}));

jest.mock('@/app/actions/admin.actions', () => ({ triggerCompaniesRevalidation: mockTriggerRevalidation }));

import * as companyData from '../company.data';

// Test Data
const mockCompanies = [
  { id: '1', name: 'Company A', slug: 'company-a', normalizedName: 'company a', statsLastUpdatedAt: new MockTimestamp() },
  { id: '2', name: 'Company B', slug: 'company-b', normalizedName: 'company b' },
  { id: '3', name: 'Company C', slug: 'company-c', normalizedName: 'company c' },
];

const mockFirestoreDocs = (data: any[]) => data.map(item => ({ id: item.id, data: () => item, exists: () => true }));

describe('Company Data', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    companyData.invalidateCompaniesCache();
    mockDbValue = {};
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mock implementations
    mockCollection.mockReturnValue({} as any);
    mockQuery.mockImplementation((...args) => args.filter(Boolean).join('_'));
    mockOrderBy.mockReturnValue('orderBy');
    mockLimit.mockReturnValue('limit');
    mockWhere.mockReturnValue('where');
    mockStartAfter.mockReturnValue('startAfter');
    mockDoc.mockImplementation((_, id) => ({ id }));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // --- Start of Tests ---

  it('should handle db initialization failure', async () => {
    mockDbValue = null;
    const result = await companyData.getCompanies();
    expect(result.companies).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getCompanies:', expect.any(Error));
  });

  describe('getCompanies & loadMoreCompanies', () => {
    it('should fetch and use a cursor correctly', async () => {
      mockGetDocs.mockResolvedValue({ docs: mockFirestoreDocs(mockCompanies) });
      const result1 = await companyData.getCompanies({ pageSize: 1 });
      expect(result1.companies).toHaveLength(1);
      expect(result1.nextCursor).toBeDefined();

      await companyData.loadMoreCompanies(result1.nextCursor!, 1);
      expect(mockStartAfter).toHaveBeenCalled();
    });

    it('should handle errors in loadMoreCompanies', async () => {
        mockGetDocs.mockRejectedValue(new Error('Firestore error'));
        await companyData.loadMoreCompanies('cursor');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in loadMoreCompanies:', expect.any(Error));
    });
  });

  describe('getCompaniesWithTotalCount', () => {
    it('should fetch page 2 correctly', async () => {
      mockGetCountFromServer.mockResolvedValue({ data: () => ({ count: 3 }) });
      mockGetDocs.mockResolvedValueOnce({ docs: mockFirestoreDocs(mockCompanies.slice(0, 2)) });
      mockGetDocs.mockResolvedValueOnce({ docs: mockFirestoreDocs([mockCompanies[2]]) });
      const result = await companyData.getCompaniesWithTotalCount({ page: 2, pageSize: 2 });
      expect(result.companies[0].name).toBe('Company C');
    });

    it('should handle errors', async () => {
        mockGetCountFromServer.mockRejectedValue(new Error('Count error'));
        await companyData.getCompaniesWithTotalCount();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in getCompaniesWithTotalCount:', expect.any(Error));
    });
  });

  describe('getCompanyById', () => {
    it('should return undefined if not found', async () => {
        mockGetDoc.mockResolvedValue({ exists: () => false });
        const result = await companyData.getCompanyById('4');
        expect(result).toBeUndefined();
    });
    it('should handle errors', async () => {
        mockGetDoc.mockRejectedValue(new Error('GetDoc error'));
        await companyData.getCompanyById('1');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching company by ID 1:', expect.any(Error));
    });
  });

  describe('getCompanyBySlug', () => {
    it('should return undefined if not found', async () => {
        mockGetDocs.mockResolvedValue({ docs: [], empty: true });
        const result = await companyData.getCompanyBySlug('non-existent');
        expect(result).toBeUndefined();
    });
    it('should handle errors', async () => {
        mockGetDocs.mockRejectedValue(new Error('GetDocs error'));
        await companyData.getCompanyBySlug('slug');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching company by slug slug:', expect.any(Error));
    });
  });

  describe('getAllCompanySlugs', () => {
    it('should handle errors', async () => {
        mockGetDocs.mockRejectedValue(new Error('GetDocs error'));
        await companyData.getAllCompanySlugs();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching all company slugs:', expect.any(Error));
    });
  });

  describe('addCompanyToDb', () => {
    it('should return error if company exists', async () => {
        mockGetDocs.mockResolvedValue({ docs: mockFirestoreDocs([mockCompanies[0]]), empty: false });
        const result = await companyData.addCompanyToDb({ name: 'Company A', description: '', website: '', logo: '' });
        expect(result.alreadyExists).toBe(true);
    });
    it('should handle add errors', async () => {
        mockGetDocs.mockResolvedValue({ docs: [], empty: true });
        mockAddDoc.mockRejectedValue(new Error('AddDoc error'));
        await companyData.addCompanyToDb({ name: 'New', description: '', website: '', logo: '' });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error in addCompanyToDb:', 'AddDoc error', expect.any(Error));
    });
    it('should handle revalidation failure', async () => {
        mockGetDocs.mockResolvedValue({ docs: [], empty: true });
        mockAddDoc.mockResolvedValue({ id: 'new-id' });
        mockTriggerRevalidation.mockRejectedValue(new Error('Revalidation failed'));
        await companyData.addCompanyToDb({ name: 'New', description: '', website: '', logo: '' });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to revalidate companies page:', expect.any(Error));
    });
  });

  describe('Cache Logic', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });

    it('should expire company cache', async () => {
        mockGetDoc.mockResolvedValue(mockFirestoreDocs([mockCompanies[0]])[0]);
        await companyData.getCompanyById('1');
        jest.advanceTimersByTime(2 * 24 * 60 * 60 * 1000);
        await companyData.getCompanyById('1');
        expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('should expire slug cache', async () => {
        mockGetDocs.mockResolvedValue({ docs: mockFirestoreDocs(mockCompanies), empty: false });
        await companyData.getAllCompanySlugs();
        jest.advanceTimersByTime(2 * 24 * 60 * 60 * 1000);
        await companyData.getAllCompanySlugs();
        expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });
  });
});
