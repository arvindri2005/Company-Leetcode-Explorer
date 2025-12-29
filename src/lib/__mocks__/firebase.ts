const db = {
  collection: jest.fn(),
  doc: jest.fn(),
};

const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
};

const app = {};

export { db, auth, app };
