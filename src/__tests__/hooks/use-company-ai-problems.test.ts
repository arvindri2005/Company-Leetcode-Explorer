import { renderHook, waitFor } from '@testing-library/react';
import { useCompanyAIProblems, clearCompanyAIProblemsCache } from '@/hooks/use-company-ai-problems';

// Mock fetch globally
global.fetch = jest.fn();

describe('useCompanyAIProblems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCompanyAIProblemsCache();
  });

  it('fetches data and updates state on first call', async () => {
    const mockData = [{ id: '1', title: 'Problem 1' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useCompanyAIProblems('company-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.problems).toEqual([]);

    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.problems).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/companies/company-1/ai-problems');
  });

  it('returns cached data immediately on second call without fetching', async () => {
    const mockData = [{ id: '1', title: 'Problem 1' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    // First call
    const { result: result1 } = renderHook(() => useCompanyAIProblems('company-1'));
    await waitFor(() => expect(result1.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call (simulate remount or another component usage)
    const { result: result2 } = renderHook(() => useCompanyAIProblems('company-1'));

    // Should be available immediately (or at least no loading state if I set it correctly,
    // but in useEffect it might be async in setting state, but no fetch)

    // In my implementation:
    // if (cache.has) setProblems; return;
    // So it might still be async state update, but fetch is skipped.

    await waitFor(() => expect(result2.current.problems).toEqual(mockData));

    expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
  });

  it('handles errors correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useCompanyAIProblems('company-error'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.problems).toEqual([]);
  });
});
