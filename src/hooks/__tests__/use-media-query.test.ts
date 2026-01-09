import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

describe("useMediaQuery", () => {
  const matchMediaMock = jest.fn();
  let originalMatchMedia: any;
  let listeners: Record<string, Function[]> = {};

  beforeAll(() => {
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  beforeEach(() => {
    listeners = {};
    // Default mock
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, callback) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      removeEventListener: jest.fn((event, callback) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((cb) => cb !== callback);
        }
      }),
      dispatchEvent: jest.fn(),
    }));
  });

  it("should return false by default (when no match)", () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("should return true when media query matches", () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("should update when media query changes", () => {
    let changeCallback: (e: MediaQueryListEvent) => void;
    let currentMatches = false;

    matchMediaMock.mockImplementation((query) => ({
      get matches() { return currentMatches; },
      media: query,
      addEventListener: jest.fn((event, callback) => {
        if (event === "change") {
            changeCallback = callback;
        }
      }),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
        currentMatches = true;
        // Simulate a change event
        if (changeCallback) {
            changeCallback({ matches: true } as MediaQueryListEvent);
        }
    });

    expect(result.current).toBe(true);
  });
});
