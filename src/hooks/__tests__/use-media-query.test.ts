import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

describe("useMediaQuery", () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("should return false by default when no match", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("should return true when matchMedia matches", () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
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
    let changeHandler: ((e: MediaQueryListEvent) => void) | undefined;
    const addEventListener = jest.fn((event, handler) => {
      if (event === "change") {
        changeHandler = handler;
      }
    });
    const removeEventListener = jest.fn();

    let matches = false;

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      get matches() { return matches; }, // Dynamic getter
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener,
      removeEventListener,
      dispatchEvent: jest.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      matches = true; // Update underlying state
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });
});
