import { NextCacheAdapter } from "../next-cache-adapter";

// Mock next/cache with dynamic import support
const mockUnstableCache = jest.fn();
jest.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

describe("NextCacheAdapter", () => {
  let adapter: NextCacheAdapter;

  beforeEach(() => {
    adapter = new NextCacheAdapter();
    jest.clearAllMocks();
  });

  it("should wrap function with unstable_cache", async () => {
    const mockFn = jest.fn().mockResolvedValue("data");
    const mockCachedFn = jest.fn().mockResolvedValue("data");
    mockUnstableCache.mockReturnValue(mockCachedFn);

    const result = await adapter.wrap("key", mockFn, { tags: ["tag"], revalidate: 60 });

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["key"],
      { tags: ["tag"], revalidate: 60 }
    );
    expect(mockCachedFn).toHaveBeenCalled();
    expect(result).toBe("data");
  });

  it("should default revalidate to SHORT (300) if not provided", async () => {
    const mockFn = jest.fn().mockResolvedValue("data");
    const mockCachedFn = jest.fn().mockResolvedValue("data");
    mockUnstableCache.mockReturnValue(mockCachedFn);

    await adapter.wrap("key", mockFn);

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["key"],
      { tags: [], revalidate: 300 }
    );
  });

  it("should throw error when revalidateTag is called", () => {
    expect(() => adapter.revalidateTag("tag")).toThrow(
      "revalidateTag cannot be called from this adapter"
    );
  });
});






