import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

describe("useMediaQuery", () => {
  let matchMediaMock: jest.Mock;
  let listeners: Record<string, ((e: MediaQueryListEvent) => void)[]> = {};

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    listeners = {};
    matchMediaMock = jest.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn((event, callback) => {
        if (!listeners[query]) listeners[query] = [];
        listeners[query].push(callback);
      }),
      removeEventListener: jest.fn((event, callback) => {
        if (listeners[query]) {
          listeners[query] = listeners[query].filter((cb) => cb !== callback);
        }
      }),
      dispatchEvent: jest.fn(),
    }));
    window.matchMedia = matchMediaMock;
  });

  it("should return false by default (initial state)", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("should return true if query matches initially", () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("should update when media query changes", () => {
    let changeCallback: ((e: any) => void) | undefined;

    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, cb) => {
        changeCallback = cb;
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);

    act(() => {
        if (changeCallback) {
            // Need to update the mock implementation so getSnapshot returns true
            matchMediaMock.mockImplementation((query) => ({
                matches: true,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn((event, cb) => {
                  // Keep the callback registration if needed, or just no-op
                  // since we already have the callback
                }),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));

            changeCallback({ matches: true, media: "(min-width: 768px)" } as any);
        }
    });

    expect(result.current).toBe(true);
  });
});
