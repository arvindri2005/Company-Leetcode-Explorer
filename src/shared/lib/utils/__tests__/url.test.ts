import { isValidRedirectUrl } from "../url";

describe("isValidRedirectUrl", () => {
  test("should return true for valid relative URLs", () => {
    expect(isValidRedirectUrl("/dashboard")).toBe(true);
    expect(isValidRedirectUrl("/profile/settings")).toBe(true);
    expect(isValidRedirectUrl("/")).toBe(true);
    expect(isValidRedirectUrl("/path-with-dashes")).toBe(true);
    expect(isValidRedirectUrl("/path_with_underscores")).toBe(true);
    expect(isValidRedirectUrl("/path/with/numbers/123")).toBe(true);
  });

  test("should return false for absolute URLs", () => {
    expect(isValidRedirectUrl("https://google.com")).toBe(false);
    expect(isValidRedirectUrl("http://evil.com")).toBe(false);
    expect(isValidRedirectUrl("ftp://example.com")).toBe(false);
  });

  test("should return false for protocol-relative URLs", () => {
    expect(isValidRedirectUrl("//google.com")).toBe(false);
    expect(isValidRedirectUrl("//evil.com/path")).toBe(false);
  });

  test("should return false for URLs with backslashes", () => {
    expect(isValidRedirectUrl("\\google.com")).toBe(false);
    expect(isValidRedirectUrl("/\\google.com")).toBe(false);
    expect(isValidRedirectUrl("/path\\to")).toBe(false);
  });

  test("should return false for URLs with control characters", () => {
    expect(isValidRedirectUrl("/path\n")).toBe(false);
    expect(isValidRedirectUrl("/path\r")).toBe(false);
    expect(isValidRedirectUrl("/path\t")).toBe(false);
  });

  test("should return false for null, undefined, or empty strings", () => {
    expect(isValidRedirectUrl(null)).toBe(false);
    expect(isValidRedirectUrl(null)).toBe(false);
    expect(isValidRedirectUrl("")).toBe(false);
  });

  test("should return false for dangerous schemes disguised as relative paths", () => {
    // These shouldn't pass the startsWith('/') check anyway, but good to verify
    expect(isValidRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isValidRedirectUrl("data:text/html,...")).toBe(false);
    expect(isValidRedirectUrl("vbscript:...")).toBe(false);
  });
  
  test("should handle tricky cases", () => {
      expect(isValidRedirectUrl("/  example.com")).toBe(true); // Technically relative, though weird
      expect(isValidRedirectUrl("/@example.com")).toBe(true); // Relative path starting with @
  });
});
