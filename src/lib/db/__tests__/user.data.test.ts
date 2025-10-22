// Mock Firestore
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockGetDocs = jest.fn();

// Mock Web APIs
global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })) as jest.Mock;
global.Response = jest.fn();
global.Headers = jest.fn();
global.Request = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  updateDoc: mockUpdateDoc,
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(),
}));

import {
  dbToggleBookmarkProblem,
  dbSetProblemStatus,
  dbUpdateUserDisplayName,
  dbAddUserEducation,
  dbAddUserWorkExperience,
  dbSaveStrategyTodoList,
  dbUpdateStrategyTodoItemStatus,
} from '../user.data';

describe('user.data', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dbToggleBookmarkProblem', () => {
    it('should bookmark a problem', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => false });
      const result = await dbToggleBookmarkProblem('user1', 'problem1', 'company-a', 'problem-a');
      expect(result.isBookmarked).toBe(true);
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should unbookmark a problem', async () => {
      mockGetDoc.mockResolvedValue({ exists: () => true });
      const result = await dbToggleBookmarkProblem('user1', 'problem1', 'company-a', 'problem-a');
      expect(result.isBookmarked).toBe(false);
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('dbSetProblemStatus', () => {
    it('should set a problem status', async () => {
      await dbSetProblemStatus('user1', 'problem1', 'solved', 'company-a', 'problem-a');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should unset a problem status', async () => {
      await dbSetProblemStatus('user1', 'problem1', 'none', 'company-a', 'problem-a');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('dbUpdateUserDisplayName', () => {
    it('should not update with a short display name', async () => {
      const result = await dbUpdateUserDisplayName('user1', 'a');
      expect(result.success).toBe(false);
    });
  });

  describe('dbAddUserEducation', () => {
    it('should add education experience', async () => {
        mockAddDoc.mockResolvedValue({ id: 'new-id' });
        const result = await dbAddUserEducation('user1', { school: 'Test University', degree: 'BS' });
        expect(result.id).toBe('new-id');
    });
  });

  describe('dbAddUserWorkExperience', () => {
    it('should add work experience', async () => {
        mockAddDoc.mockResolvedValue({ id: 'new-id' });
        const result = await dbAddUserWorkExperience('user1', { company: 'Test Company', role: 'Developer' });
        expect(result.id).toBe('new-id');
    });
  });

  describe('dbSaveStrategyTodoList', () => {
    it('should save a strategy todo list', async () => {
        const result = await dbSaveStrategyTodoList('user1', 'company1', 'Company A', {
            preparationStrategy: 'Test Strategy',
            focusTopics: [],
            todoItems: [],
        });
        expect(result.success).toBe(true);
        expect(mockSetDoc).toHaveBeenCalled();
    });
  });

  describe('dbUpdateStrategyTodoItemStatus', () => {
    it('should update a todo item status', async () => {
        mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({ items: [{ task: 'Test Task', isCompleted: false }] }),
        });
        const result = await dbUpdateStrategyTodoItemStatus('user1', 'company1', 0, true);
        expect(result.success).toBe(true);
        expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });
});
