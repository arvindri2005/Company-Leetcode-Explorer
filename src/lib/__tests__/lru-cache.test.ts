import { SimpleLRUCache } from "../lru-cache";
import { createHash } from "crypto";

describe("SimpleLRUCache", () => {
  let cache: SimpleLRUCache<any>;

  beforeEach(() => {
    cache = new SimpleLRUCache(3); // Small size for LRU testing
  });

  it("should store and retrieve values", () => {
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("should return undefined for missing keys", () => {
    expect(cache.get("missing")).toBeUndefined();
  });

  it("should evict least recently used items", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);

    // Access 'a' to make it most recently used
    cache.get("a");

    // Add 'd', should evict 'b' (since 'a' was just used, 'b' is now LRU?
    // Wait: a, b, c inserted.
    // Order: a, b, c (most recent).
    // Access a: b, c, a.
    // Insert d: c, a, d. Evict b.
    cache.set("d", 4);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("should generate stable keys for objects regardless of key order", () => {
    const obj1 = { a: 1, b: 2, c: { d: 3, e: 4 } };
    const obj2 = { c: { e: 4, d: 3 }, b: 2, a: 1 };

    const key1 = cache.generateKey(obj1);
    const key2 = cache.generateKey(obj2);

    expect(key1).toBe(key2);
  });

  it("should generate stable keys for arrays containing objects", () => {
      const arr1 = [{ a: 1, b: 2 }, { c: 3 }];
      const arr2 = [{ b: 2, a: 1 }, { c: 3 }];

      const key1 = cache.generateKey(arr1);
      const key2 = cache.generateKey(arr2);

      expect(key1).toBe(key2);
  });

  it("should match expected hash for a known object", () => {
      // This test ensures we don't accidentally change the hashing algorithm
      // effectively invalidating all existing caches (though they are in-memory,
      // consistent behavior is good).
      const obj = { a: 1, b: [2, 3] };

      // We manually construct the expected string based on current logic:
      // {"a":1,"b":[2,3]}
      // sha256 of this string
      const expectedString = '{"a":1,"b":[2,3]}';
      const expectedHash = createHash("sha256").update(expectedString).digest("hex");

      expect(cache.generateKey(obj)).toBe(expectedHash);
  });

  it("should handle mixed types correctly", () => {
      const obj = {
          a: 1,
          b: "string",
          c: null,
          d: true,
          e: [1, "2", { f: 3 }]
      };

      // Ensure it doesn't crash
      const key = cache.generateKey(obj);
      expect(key).toBeDefined();
  });

  it("should handle explicit undefined values safely", () => {
      const obj = { a: 1, b: undefined };
      // Expectation: shouldn't crash.
      expect(() => cache.generateKey(obj)).not.toThrow();
  });
});
