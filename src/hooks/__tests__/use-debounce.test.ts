import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../use-debounce";

jest.useFakeTimers();

describe("useDebounce", () => {
  it("should return the initial value", () => {
    const { result } = renderHook(() => useDebounce("test", 500));
    expect(result.current).toBe("test");
  });

  it("should update the debounced value after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "test", delay: 500 },
      },
    );

    expect(result.current).toBe("test");

    rerender({ value: "updated", delay: 500 });

    expect(result.current).toBe("test");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated");
  });

  it("should handle rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "test", delay: 500 },
      },
    );

    expect(result.current).toBe("test");

    rerender({ value: "updated1", delay: 500 });
    rerender({ value: "updated2", delay: 500 });
    rerender({ value: "updated3", delay: 500 });

    expect(result.current).toBe("test");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated3");
  });
});
