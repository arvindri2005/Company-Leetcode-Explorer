import { NextCacheAdapter } from "../next-cache-adapter";
import { unstable_cache, revalidateTag } from "next/cache";

// Mock next/cache
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn(),
  revalidateTag: jest.fn(),
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
    (unstable_cache as jest.Mock).mockReturnValue(mockCachedFn);

    const result = await adapter.wrap("key", mockFn, { tags: ["tag"], revalidate: 60 });

    expect(unstable_cache).toHaveBeenCalledWith(
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
    (unstable_cache as jest.Mock).mockReturnValue(mockCachedFn);

    await adapter.wrap("key", mockFn);

    expect(unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ["key"],
      { tags: [], revalidate: 300 }
    );
  });

  it("should call revalidateTag", () => {
    adapter.revalidateTag("tag");
    expect(revalidateTag).toHaveBeenCalledWith("tag");
  });
});






