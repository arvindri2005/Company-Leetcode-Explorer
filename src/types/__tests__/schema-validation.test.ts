import { LeetCodeProblemSchema } from "..";
import { CompanySchema } from "../company";

describe("LeetCodeProblemSchema", () => {
  const validBase = {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    link: "https://leetcode.com/problems/two-sum",
    tags: ["Array", "Hash Table"],
    companyId: "google",
    companySlug: "google",
    slug: "two-sum",
    normalizedTitle: "two sum",
  };

  it("accepts valid problem without acceptanceRate", () => {
    const result = LeetCodeProblemSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts valid problem with acceptanceRate", () => {
    const data = { ...validBase, acceptanceRate: 48.5 };
    const result = LeetCodeProblemSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptanceRate).toBe(48.5);
    }
  });

  it("accepts valid problem with acceptanceRate 0", () => {
    const data = { ...validBase, acceptanceRate: 0 };
    const result = LeetCodeProblemSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
        expect(result.data.acceptanceRate).toBe(0);
    }
  });
});

describe("CompanySchema", () => {
  const validBase = {
    id: "google",
    name: "Google",
    slug: "google",
  };

  it("accepts valid company without website", () => {
    const result = CompanySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts valid company with valid website", () => {
    const data = { ...validBase, website: "https://google.com" };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts valid company with empty website string", () => {
    const data = { ...validBase, website: "" };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid website URL", () => {
    const data = { ...validBase, website: "not-a-url" };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Expecting standard Zod validation error for URL
      const issue = result.error.issues[0];
      // Zod 3.x uses 'invalid_string' with validation: 'url', but Zod 4.x might be different or the error map is customized.
      // Based on the failure "Received: 'invalid_format'", it seems Zod 4.x (which is in package.json) might use a different code or message.
      // Let's check if it's 'invalid_string' or allow flexibility.
      // Actually, standard Zod error for URL is invalid_string with { validation: "url" }.
      // But let's just check the message or that validation failed.
      expect(issue.message.toLowerCase()).toContain("invalid url");
    }
  });
});
