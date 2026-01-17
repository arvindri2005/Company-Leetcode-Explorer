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

describe('UserRepository Security Tests - IDOR on Reads', () => {
  let repository: UserRepository;
  let getDocsMock: any;
  let getDocMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new UserRepository();
    
    // Get the mocked functions
    const firestore = require('firebase/firestore');
    getDocsMock = firestore.getDocs;
    getDocMock = firestore.getDoc;
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
    }
  ];

  // PUBLIC/ALLOWED METHODS: Should CALL Firestore
  const publicMethods: Array<{
    name: string;
    call: (repo: UserRepository, userId: string) => Promise<any>;
  }> = [
    {
      name: 'getUserGlobalProblemStats',
      call: (repo, uid) => repo.getUserGlobalProblemStats(uid),
    },
    {
      name: 'getAllUserProblemStatuses',
      call: (repo, uid) => repo.getAllUserProblemStatuses(uid),
    },
    {
      name: 'getProblemStatusesForIds',
      call: (repo, uid) => repo.getProblemStatusesForIds(uid, ['prob1']),
    },
    {
      name: 'getUserEducation',
      call: (repo, uid) => repo.getUserEducation(uid),
    },
    {
      name: 'getUserWorkExperience',
      call: (repo, uid) => repo.getUserWorkExperience(uid),
    }
  ];

  protectedMethods.forEach(method => {
    it(`should prevent IDOR in ${method.name} (Protected)`, async () => {
       (auth as any).currentUser = { uid: 'attacker-uid' };
       const victimId = 'victim-uid';
       
       const result = await method.call(repository, victimId);
       
       // This verifies that the repository did NOT make a network call
       expect(getDocsMock).not.toHaveBeenCalled();
       expect(getDocMock).not.toHaveBeenCalled();
       
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
       const calledDoc = getDocMock.mock.calls.length > 0;
       expect(calledDocs || calledDoc).toBe(true);
    });
  });

});
