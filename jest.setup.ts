import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

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

// Global mock for framer-motion to simplify testing components with animations
// We need to return a proper React component from the mock
jest.mock("framer-motion", () => {
  return {
    motion: {
      div: ({ children, whileHover, whileTap, layout, transition, initial, animate, exit, variants, ...props }: any) => {
        return React.createElement('div', props, children);
      },
      // Add other HTML elements as needed (span, ul, li, etc.)
      span: ({ children, ...props }: any) => React.createElement('span', props, children),
      button: ({ children, ...props }: any) => React.createElement('button', props, children),
    },
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});
