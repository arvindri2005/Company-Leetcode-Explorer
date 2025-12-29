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

// Global mock for Firebase to prevent initialization errors in tests
jest.mock('@/lib/firebase');
