import { renderHook, act } from "@testing-library/react";
import { useCompaniesCache } from "../use-companies-cache";
import { fetchCompaniesAction } from "@/app/actions/company.actions";

// Mock the server action
jest.mock("@/app/actions/company.actions", () => ({
  fetchCompaniesAction: jest.fn(),
}));

describe("useCompaniesCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the cache by calling clearCache via a hook instance
    const { result } = renderHook(() => useCompaniesCache());
    act(() => {
      result.current.clearCache();
    });
  });

  it("should return cached data on second call", async () => {
    const mockData = {
      companies: [{ id: "1", name: "Test Co" }],
      totalPages: 1,
      totalCompanies: 1,
      currentPage: 1,
    };

    (fetchCompaniesAction as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCompaniesCache());

    // First fetch: Should call API
    await act(async () => {
      const data = await result.current.fetchCompaniesWithCache(1, 10, "");
      expect(data).toEqual(mockData);
    });
    expect(fetchCompaniesAction).toHaveBeenCalledTimes(1);

    // Second fetch: Should hit cache (no API call)
    await act(async () => {
      const data = await result.current.fetchCompaniesWithCache(1, 10, "");
      expect(data).toEqual(mockData);
    });
    expect(fetchCompaniesAction).toHaveBeenCalledTimes(1);
  });

  it("should share cache between different hook instances (Singleton)", async () => {
    const mockData = {
      companies: [{ id: "2", name: "Singleton Co" }],
      totalPages: 1,
      totalCompanies: 1,
      currentPage: 1,
    };

    (fetchCompaniesAction as jest.Mock).mockResolvedValue(mockData);

    // Instance 1
    const { result: result1, unmount: unmount1 } = renderHook(() => useCompaniesCache());

    await act(async () => {
      await result1.current.fetchCompaniesWithCache(1, 10, "singleton");
    });
    expect(fetchCompaniesAction).toHaveBeenCalledTimes(1);

    // Unmount Instance 1 (simulating navigation away)
    unmount1();

    // Instance 2 (simulating navigation back)
    const { result: result2 } = renderHook(() => useCompaniesCache());

    await act(async () => {
      const data = await result2.current.fetchCompaniesWithCache(1, 10, "singleton");
      expect(data).toEqual(mockData);
    });

    // API should NOT be called again
    expect(fetchCompaniesAction).toHaveBeenCalledTimes(1);
  });
});
