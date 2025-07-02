import { jest } from '@jest/globals';

const originalModule = jest.requireActual('firebase/firestore');

class MockTimestamp extends originalModule.Timestamp {
    constructor(seconds: number, nanoseconds: number) {
        super(seconds, nanoseconds);
    }
    toDate() {
        return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
    }
}

export const getFirestore = jest.fn();
export const collection = jest.fn();
export const getDocs = jest.fn();
export const doc = jest.fn();
export const getDoc = jest.fn();
export const query = jest.fn();
export const where = jest.fn();
export const addDoc = jest.fn();
export const serverTimestamp = jest.fn(() => MockTimestamp.now());
export const updateDoc = jest.fn();
export const writeBatch = jest.fn(() => ({
    commit: jest.fn().mockResolvedValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
}));
export const orderBy = jest.fn();
export const limit = jest.fn();
export const startAfter = jest.fn();
export const getCountFromServer = jest.fn();
export const Timestamp = MockTimestamp;
