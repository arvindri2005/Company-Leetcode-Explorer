import { TextDecoder,TextEncoder } from 'util';

import '@testing-library/jest-dom'

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
global.fetch = jest.fn();

if (typeof setImmediate === 'undefined') {
  global.setImmediate = ((callback: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(callback, 0, ...args)) as unknown as typeof setImmediate;
}


if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(_input: RequestInfo | URL, _init?: RequestInit) {
        return jest.fn() as unknown as Request;
    }
  } as unknown as typeof Request;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(_body?: BodyInit | null, _init?: ResponseInit) {
        return jest.fn() as unknown as Response;
    }
  } as unknown as typeof Response;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    append() {}
    delete() {}
    get() {}
    has() {}
    set() {}
    forEach() {}
  } as unknown as typeof Headers;
}

// Global mock for Firebase to prevent initialization errors in tests
jest.mock('@/shared/lib/api/firebase', () => ({
  app: {}, // Mock app object
  auth: {}, // Mock auth object
  db: {},  // Mock db object so "if (!db)" checks pass
}));

// Global mock for react-markdown and remark-gfm to resolve ESM issues in Jest
jest.mock("react-markdown", () => (props: { children: React.ReactNode }) => {
  return props.children;
});

jest.mock("remark-gfm", () => () => {});

