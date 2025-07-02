import '@testing-library/jest-dom';

// Mock Next.js specific modules for testing async components
jest.mock('next/cache', () => ({
  cache: jest.fn((fn) => fn),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));