// Mock Firestore
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();

// Mock Web APIs
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })) as jest.Mock;
global.Response = jest.fn();
global.Headers = jest.fn();
global.Request = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: mockGetDoc,
  collection: jest.fn(),
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  serverTimestamp: jest.fn(),
}));

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {},
}));

// Mock data
jest.mock('@/lib/data', () => ({
  getProblemsByCompanyFromDb: jest.fn(),
}));

import {
  checkUserAdminStatus,
  triggerAllCompanyProblemStatsUpdate,
  triggerRevalidation,
} from '../admin.actions';
import { getProblemsByCompanyFromDb } from '@/lib/data';

describe('admin.actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkUserAdminStatus', () => {
    it('should return true for an admin user', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ isAdmin: true }) });
      const isAdmin = await checkUserAdminStatus('admin-uid');
      expect(isAdmin).toBe(true);
    });

    it('should return false for a non-admin user', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });
      const isAdmin = await checkUserAdminStatus('user-uid');
      expect(isAdmin).toBe(false);
    });
  });

  describe('triggerAllCompanyProblemStatsUpdate', () => {
    it('should update company stats successfully', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: '1', data: () => ({ name: 'Company A' }) }],
      });
      (getProblemsByCompanyFromDb as jest.Mock).mockResolvedValue({
        problems: [{ difficulty: 'Easy', lastAskedPeriod: 'last_30_days', tags: ['Array'] }],
      });
      const result = await triggerAllCompanyProblemStatsUpdate();
      expect(result.success).toBe(true);
      expect(result.updatedCompaniesCount).toBe(1);
    });
  });

  describe('triggerRevalidation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv, REVALIDATION_TOKEN: 'test-token', NEXT_PUBLIC_APP_URL: 'http://localhost:3000' };
    });

    afterEach(() => {
        process.env = originalEnv;
    });
    it('should trigger revalidation successfully', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
      const result = await triggerRevalidation('/test-path');
      expect(result.success).toBe(true);
    });

    it('should fail if revalidation token is missing', async () => {
        delete process.env.REVALIDATION_TOKEN;
        await expect(triggerRevalidation('/test-path')).rejects.toThrow('REVALIDATION_TOKEN is not set');
    });
  });
});
