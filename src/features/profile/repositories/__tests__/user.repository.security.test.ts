import { auth } from '@/lib/api/firebase';

import { UserRepository } from '../user.repository';

// Mock Firebase Auth
jest.mock('@/lib/api/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Use a simple manual mock
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    doc: (...args: any[]) => mockDoc(...args),
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
    getDoc: (...args: any[]) => mockGetDoc(...args),
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

describe('UserRepository Security Tests - IDOR on Reads', () => {
  let repository: UserRepository;
  let getDocsMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    
    // Get the mocked functions
    const firestore = require('firebase/firestore');
    getDocsMock = firestore.getDocs;
    
    // Default mocks
    mockDoc.mockReturnValue('mock-doc-ref');
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });
  });

  // PROTECTED METHODS: Should NOT call Firestore
  const protectedMethods: Array<{
    name: string;
    call: (repo: UserRepository, userId: string) => Promise<any>;
    expectedReturn: any;
  }> = [
    {
      name: 'getBookmarkedProblemsInfo',
      call: (repo, uid) => repo.getBookmarkedProblemsInfo(uid),
      expectedReturn: []
    },
    {
      name: 'getBookmarksForIds',
      call: (repo, uid) => repo.getBookmarksForIds(uid, ['prob1']),
      expectedReturn: new Set()
    },
    {
      name: 'getUserStrategyTodoLists',
      call: (repo, uid) => repo.getUserStrategyTodoLists(uid),
      expectedReturn: []
    },
    {
      name: 'getStrategyTodoListForCompany',
      call: (repo, uid) => repo.getStrategyTodoListForCompany(uid, 'comp1'),
      expectedReturn: null
    },
    {
      name: 'getUserGlobalProblemStats',
      call: (repo, uid) => repo.getUserGlobalProblemStats(uid),
      expectedReturn: { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] }
    },
    {
      name: 'getAllUserProblemStatuses',
      call: (repo, uid) => repo.getAllUserProblemStatuses(uid),
      expectedReturn: {}
    },
    {
      name: 'getProblemStatusesForIds',
      call: (repo, uid) => repo.getProblemStatusesForIds(uid, ['prob1']),
      expectedReturn: {}
    },
    {
      name: 'getUserEducation',
      call: (repo, uid) => repo.getUserEducation(uid),
      expectedReturn: []
    },
    {
      name: 'getUserWorkExperience',
      call: (repo, uid) => repo.getUserWorkExperience(uid),
      expectedReturn: []
    }
  ];

  // PUBLIC/ALLOWED METHODS: Should CALL Firestore
  // Note: Most user profile methods are now protected to prevent IDOR.
  // The only public interactions should be generic or strictly controlled via other mechanisms.
  const publicMethods: Array<{
    name: string;
    call: (repo: UserRepository, userId: string) => Promise<any>;
  }> = [
    // Currently no public methods in this test suite, as even basic profile fetching
    // is covered by specific findById tests or returns sanitized data.
    // Keeping this array for future extensibility.
  ];

  protectedMethods.forEach(method => {
    it(`should prevent IDOR in ${method.name} (Protected)`, async () => {
       (auth as any).currentUser = { uid: 'attacker-uid' };
       const victimId = 'victim-uid';
       
       const result = await method.call(repository, victimId);
       
       // This verifies that the repository did NOT make a network call
       // Note: getDoc might be called by internal implementation before auth check in some cases? 
       // But in the restored file it expected NOT to be called.
       // Let's rely on the mock clearing in beforeEach
       expect(getDocsMock).not.toHaveBeenCalled();
       // For protected methods that use query(), getDoc is not used usually, getDocs is.
       // getBookmarksForIds uses query.
       // getStrategyTodoListForCompany uses getDoc.
       
       if (method.name === 'getStrategyTodoListForCompany') {
           expect(mockGetDoc).not.toHaveBeenCalled();
       } else {
           expect(getDocsMock).not.toHaveBeenCalled();
       }
       
       // And returned safe empty value
       expect(result).toEqual(method.expectedReturn);
    });
  });

  publicMethods.forEach(method => {
    it(`should ALLOW access to ${method.name} (Public Profile)`, async () => {
       (auth as any).currentUser = { uid: 'attacker-uid' };
       const victimId = 'victim-uid';
       
       await method.call(repository, victimId);
       
       // Should have called Firestore (or at least attempted)
       const calledDocs = getDocsMock.mock.calls.length > 0;
       const calledDoc = mockGetDoc.mock.calls.length > 0;
       expect(calledDocs || calledDoc).toBe(true);
    });
  });

});

describe('UserRepository Security - syncUserProfile', () => {
  let repository: UserRepository;
  let setDocMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    const firestore = require('firebase/firestore');
    setDocMock = firestore.setDoc;
  });

  it('should ignore provided email if it differs from authenticated user email', async () => {
    // Setup: Auth user has 'real@email.com'
    const realEmail = 'real@email.com';
    const fakeEmail = 'fake@email.com';
    (auth as any).currentUser = { uid: 'user-123', email: realEmail };

    // Action: Try to sync with fake email
    await repository.syncUserProfile(fakeEmail, 'Display Name');

    // Assertion: setDoc should be called with realEmail
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: realEmail
      }),
      expect.anything()
    );
    
    // Ensure fake email was NOT used
    const setDocArgs = setDocMock.mock.calls[0][1];
    expect(setDocArgs.email).toBe(realEmail);
    expect(setDocArgs.email).not.toBe(fakeEmail);
  });

  it('should use provided email only if auth email is null', async () => {
    // Setup: Auth user has NO email (e.g. phone auth or anon)
    (auth as any).currentUser = { uid: 'user-123', email: null };
    const providedEmail = 'provided@email.com';

    // Action
    await repository.syncUserProfile(providedEmail, 'Display Name');

    // Assertion
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: providedEmail
      }),
      expect.anything()
    );
  });

  it('should truncate excessively long display names', async () => {
    (auth as any).currentUser = { uid: 'user-123', email: 'test@email.com' };
    const longName = 'A'.repeat(100); // 100 chars

    await repository.syncUserProfile('test@email.com', longName);

    // Assertion
    const setDocArgs = setDocMock.mock.calls[0][1];
    expect(setDocArgs.displayName.length).toBeLessThanOrEqual(50);
    expect(setDocArgs.displayName).toBe('A'.repeat(50));
  });

  it('should trim display names', async () => {
    (auth as any).currentUser = { uid: 'user-123', email: 'test@email.com' };
    const untrimmedName = '  Bob  ';

    await repository.syncUserProfile('test@email.com', untrimmedName);

    // Assertion
    const setDocArgs = setDocMock.mock.calls[0][1];
    expect(setDocArgs.displayName).toBe('Bob');
  });

  it('should fail if user is not authenticated', async () => {
    (auth as any).currentUser = null;

    const result = await repository.syncUserProfile('test@email.com', 'Bob');

    expect(result.success).toBe(false);
    expect(result.error).toBe('User is not authenticated.');
    expect(setDocMock).not.toHaveBeenCalled();
  });
});

describe('UserRepository Security - findById', () => {
  let repository: UserRepository;
  const targetUserId = 'target-user-123';
  const attackerUserId = 'attacker-user-456';

  const sensitiveUserData = {
    email: 'sensitive@example.com',
    displayName: 'Target User',
    photoUrl: 'http://example.com/photo.jpg',
    preferences: { theme: 'dark', emailNotifications: true },
    createdAt: { toDate: () => new Date('2023-01-01') },
    lastSyncedAt: { toDate: () => new Date('2023-01-02') },
  };

  beforeEach(() => {
    repository = new UserRepository();
    jest.clearAllMocks();

    // Setup default mock return for getDoc
    mockDoc.mockReturnValue('doc-ref');
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: targetUserId,
      data: () => sensitiveUserData,
    });
  });

  it('should return FULL data when user fetches their OWN profile', async () => {
    // Arrange: Authenticated as the target user
    // @ts-ignore
    auth.currentUser = { uid: targetUserId, email: sensitiveUserData.email };

    // Act
    const result = await repository.findById(targetUserId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.email).toBe(sensitiveUserData.email);
    expect(result?.preferences).toEqual(sensitiveUserData.preferences);
  });

  it('should return SANITIZED data when user fetches ANOTHER profile (IDOR prevention)', async () => {
    // Arrange: Authenticated as an attacker (or just another user)
    // @ts-ignore
    auth.currentUser = { uid: attackerUserId };

    // Act
    const result = await repository.findById(targetUserId);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.displayName).toBe(sensitiveUserData.displayName); // Public info
    expect(result?.photoUrl).toBe(sensitiveUserData.photoUrl);       // Public info
    
    // Sensitive info should be masked/removed
    expect(result?.email).toBeNull(); 
    expect(result?.preferences).toEqual({}); 
  });
  
  it('should return SANITIZED data when unauthenticated user fetches a profile', async () => {
      // Arrange: No user logged in
      // @ts-ignore
      auth.currentUser = null;
  
      // Act
      const result = await repository.findById(targetUserId);
  
      // Assert
      expect(result).not.toBeNull();
      expect(result?.displayName).toBe(sensitiveUserData.displayName);
      expect(result?.email).toBeNull();
      expect(result?.preferences).toEqual({});
    });
});
