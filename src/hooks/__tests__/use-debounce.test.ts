import { renderHook, act } from "@testing-library/react";
import { useDebounce, useDebouncedCallback } from "../use-debounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 500 });

    // Value should not update immediately
    expect(result.current).toBe("initial");

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated");
  });

  it("should reset timer if value changes within delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "update1", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    rerender({ value: "update2", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    // Should still be initial because timer was reset
    expect(result.current).toBe("initial");

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe("update2");
  });
});

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should call the callback after delay", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current("test");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("test");
  });

  it("should debounce multiple calls", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current("test1");
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    act(() => {
      result.current("test2");
    });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test2");
  });

  it("should preserve the latest callback", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncedCallback(cb, 500),
      { initialProps: { cb: callback1 } }
    );

    act(() => {
      result.current("test");
    });

    rerender({ cb: callback2 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledWith("test");
  });
});
