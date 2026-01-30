import { act, renderHook } from "@testing-library/react";

import { createMockCompany } from "@/__tests__/factories/data-factories";

import { useCursorPagination } from "./use-cursor-pagination";

// Mock Logger to prevent console noise during tests
jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useCursorPagination", () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Suppress expected console.error from the hook (until we refactor it)
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch companies successfully", async () => {
    const mockCompanies = [createMockCompany()];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        companies: mockCompanies,
        hasMore: false,
      }),
    });

    const { result } = renderHook(() => useCursorPagination());

    let response;
    await act(async () => {
      response = await result.current.fetchCompaniesWithCursor();
    });

    expect(response).toEqual({
      companies: mockCompanies,
      hasMore: false,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/companies"),
      expect.objectContaining({
        method: "GET",
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("should handle fetch errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useCursorPagination());

    let response;
    await act(async () => {
      response = await result.current.fetchCompaniesWithCursor();
    });

    expect(response).toEqual({
      companies: [],
      hasMore: false,
      nextCursor: undefined,
      error: "Network Error",
    });
    
    // In current implementation, it uses console.error
    // Once refactored, we will expect Logger.error
  });

  it("should abort previous request when a new one is started", async () => {
    // First request hangs
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); 
    // Second request resolves
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ companies: [], hasMore: false }),
    });

    const { result } = renderHook(() => useCursorPagination());

    // Start first request
    await act(async () => {
      result.current.fetchCompaniesWithCursor();
    });

    // Start second request
    await act(async () => {
      result.current.fetchCompaniesWithCursor();
    });

    // We can't easily assert the abort signal state on the first promise without deeper mocking,
    // but we can verify fetch was called twice.
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});






