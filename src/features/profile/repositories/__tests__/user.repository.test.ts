import { auth} from '@/lib/api/firebase';

import { UserRepository } from '../user.repository';

// Mock Firebase Auth
jest.mock('@/lib/api/firebase', () => ({
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

describe('UserRepository Security Tests', () => {
  let repository: UserRepository;
  let updateDocMock: any;
  let docMock: any;
  let limitMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    
    // Get the mocked functions
    const firestore = require('firebase/firestore');
    updateDocMock = firestore.updateDoc;
    docMock = firestore.doc;
    limitMock = firestore.limit;
  });

  it('should PREVENT modifying another user\'s profile (IDOR protection)', async () => {
    // Setup: Authenticated as 'attacker', trying to modify 'victim'
    (auth as any).currentUser = { uid: 'attacker-uid' };
    const victimId = 'victim-uid';
    const newName = 'Hacked Name';

    // Mock successful update
    updateDocMock.mockResolvedValue();
    docMock.mockReturnValue('mock-doc-ref');

    // Action: Call updateUserDisplayName with victimId
    const result = await repository.updateUserDisplayName(victimId, newName);

    // Assertion: Should fail due to Unauthorized access
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized access to user profile.');
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('should enforce MAX_PAGE_SIZE in findAll to prevent DoS', async () => {
    // Action: Call findAll with a large pageSize
    const largePageSize = 1000;
    await repository.findAll({ pageSize: largePageSize });

    // Assertion: The limit() function should be called with 51 (MAX_PAGE_SIZE + 1)
    // because MAX_PAGE_SIZE is 50, and code does limit(pageSize + 1)
    expect(limitMock).toHaveBeenCalledWith(51); 
  });
});
