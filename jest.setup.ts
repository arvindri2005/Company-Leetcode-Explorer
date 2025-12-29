import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
global.fetch = jest.fn();

if (typeof setImmediate === 'undefined') {
  global.setImmediate = ((callback: any, ...args: any[]) => setTimeout(callback, 0, ...args)) as any;
}


if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input: any, init?: any) {
        return jest.fn();
    }
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body?: any, init?: any) {
        return jest.fn();
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    append() {}
    delete() {}
    get() {}
    has() {}
    set() {}
    forEach() {}
  } as any;
}

// Mock environment variables for testing
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-domain";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project-id";
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-bucket";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "test-sender-id";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "test-app-id";
