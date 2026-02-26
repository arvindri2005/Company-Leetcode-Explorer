import { auth } from '@/shared/lib/api/firebase';
import { UserRepository } from '../user.repository';

// Mock Firebase Auth
jest.mock('@/shared/lib/api/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock Firestore
const mockDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: (...args: any[]) => mockDoc(...args),
    updateDoc: (...args: any[]) => mockUpdateDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    getDoc: jest.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
    serverTimestamp: jest.fn(),
  };
});

describe('User Display Name Security Tests', () => {
  let repository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    mockDoc.mockReturnValue('mock-doc-ref');
  });

  describe('updateUserDisplayName', () => {
    it('should block names with ASCII control characters', async () => {
      (auth as any).currentUser = { uid: 'user-123' };
      // \x07 is the bell character
      const maliciousName = 'Bad\x07User';

      const result = await repository.updateUserDisplayName('user-123', maliciousName);

      // Currently this will FAIL (it will succeed in updating), because we don't check for control chars yet.
      // We want it to fail validation.
      expect(result.success).toBe(false);
      expect(result.error).toContain('contains invalid characters');
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should block names with Unicode BiDi overrides', async () => {
      (auth as any).currentUser = { uid: 'user-123' };
      // \u202E is Right-To-Left Override
      const maliciousName = 'User\u202Eeman';

      const result = await repository.updateUserDisplayName('user-123', maliciousName);

      expect(result.success).toBe(false);
      expect(result.error).toContain('contains invalid characters');
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });
  });

  describe('syncUserProfile', () => {
    it('should sanitize ASCII control characters', async () => {
        (auth as any).currentUser = { uid: 'user-123', email: 'test@example.com' };
        const nameWithControl = 'Bad\x07User';

        await repository.syncUserProfile('test@example.com', nameWithControl);

        // Expect sanitized name to be passed to setDoc
        const setDocArgs = mockSetDoc.mock.calls[0][1];
        expect(setDocArgs.displayName).toBe('BadUser');
    });

    it('should sanitize Unicode BiDi overrides', async () => {
        (auth as any).currentUser = { uid: 'user-123', email: 'test@example.com' };
        const nameWithBiDi = 'User\u202Eeman';

        await repository.syncUserProfile('test@example.com', nameWithBiDi);

        // Expect sanitized name to be passed to setDoc
        const setDocArgs = mockSetDoc.mock.calls[0][1];
        expect(setDocArgs.displayName).toBe('Usereman');
    });
  });
});
