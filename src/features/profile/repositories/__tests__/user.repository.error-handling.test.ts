import { auth } from '@/shared/lib/api/firebase';

import { UserRepository } from '../user.repository';

// Mock Firebase Auth
jest.mock('@/shared/lib/api/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Use a simple manual mock
jest.mock('firebase/firestore', () => {
  return {
    doc: jest.fn(() => 'mock-doc-ref'),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    addDoc: jest.fn(),
    deleteDoc: jest.fn(),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    collection: jest.fn(),
    query: jest.fn(),
    getDocs: jest.fn(() => ({ docs: [], forEach: jest.fn() })),
    getDoc: jest.fn(() => ({ exists: () => true, data: () => ({}) })),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    getCountFromServer: jest.fn(() => ({ data: () => ({ count: 0 }) })),
    documentId: jest.fn(),
  };
});

describe('UserRepository Error Handling & Security', () => {
  let repository: UserRepository;
  let updateDocMock: any;
  let setDocMock: any;
  let getDocMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    
    // Get the mocked functions
    const firestore = require('firebase/firestore');
    updateDocMock = firestore.updateDoc;
    setDocMock = firestore.setDoc;
    getDocMock = firestore.getDoc;
    
    // Setup authenticated user by default
    (auth as any).currentUser = { uid: 'test-user-id' };
  });

  describe('updateUserDisplayName Security', () => {
    it('should reject display names with < or > characters', async () => {
      const maliciousName = 'Admin <script>alert(1)</script>';
      const result = await repository.updateUserDisplayName('test-user-id', maliciousName);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Display name contains invalid characters');
      expect(updateDocMock).not.toHaveBeenCalled();
    });

    it('should reject display names with only <', async () => {
        const maliciousName = 'User<';
        const result = await repository.updateUserDisplayName('test-user-id', maliciousName);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Display name contains invalid characters');
        expect(updateDocMock).not.toHaveBeenCalled();
    });
    
    it('should accept valid display names', async () => {
        const validName = 'John Doe 123';
        updateDocMock.mockResolvedValue();
        const result = await repository.updateUserDisplayName('test-user-id', validName);
        
        expect(result.success).toBe(true);
        expect(updateDocMock).toHaveBeenCalled();
    });
  });

  describe('Secure Error Handling (No Information Leakage)', () => {
    it('updateUserDisplayName should return generic error on internal failure', async () => {
      // Mock internal error with sensitive info
      updateDocMock.mockRejectedValue(new Error('Firestore error: Permission denied at /projects/abc/databases/(default)/documents/users/123'));
      
      const result = await repository.updateUserDisplayName('test-user-id', 'Valid Name');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred while updating display name.');
    });

    it('syncUserProfile should return generic error on internal failure', async () => {
       setDocMock.mockRejectedValue(new Error('Quota exceeded for project nextn-123'));
       
       const result = await repository.syncUserProfile('test@example.com', 'Valid Name');
       
       expect(result.success).toBe(false);
       expect(result.error).toBe('An unexpected error occurred while syncing user profile.');
    });

    it('toggleBookmarkProblem should return generic error on internal failure', async () => {
        getDocMock.mockRejectedValue(new Error('Internal path /users/123/bookmarks exposed'));
        
        const result = await repository.toggleBookmarkProblem('test-user-id', 'p1', 'c1', 'p1');
        
        expect(result.isBookmarked).toBe(false);
        expect(result.error).toBe('An unexpected error occurred while toggling bookmark.');
    });
  });
});
