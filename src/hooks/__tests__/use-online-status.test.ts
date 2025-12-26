import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "../use-online-status";

describe("useOnlineStatus", () => {
  let originalNavigatorOnLine: boolean;

  beforeEach(() => {
    originalNavigatorOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: originalNavigatorOnLine,
    });
  });

  it("should return the initial online status", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("should update status when going offline", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("should update status when coming back online", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });
});
