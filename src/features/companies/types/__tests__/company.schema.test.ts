import { CompanySchema } from "../company";

describe("CompanySchema Security Tests", () => {
  it("should REJECT excessive commonTags (DoS Prevention)", () => {
    // Generate a massive array of tags
    const massiveTags = Array.from({ length: 100 }, (_, i) => ({
      tag: `tag-${i}`,
      count: 1,
    }));

    const companyData = {
      id: "123",
      name: "Test Company",
      slug: "test-company",
      commonTags: massiveTags,
    };

    const result = CompanySchema.safeParse(companyData);
    expect(result.success).toBe(false);
    if (!result.success) {
       expect(result.error.issues[0].message).toContain("Cannot have more than 50 common tags");
    }
  });

  it("should REJECT excessive tag length (DoS Prevention)", () => {
    const longTag = "a".repeat(100);
    const companyData = {
      id: "123",
      name: "Test Company",
      slug: "test-company",
      commonTags: [{ tag: longTag, count: 1 }],
    };

    const result = CompanySchema.safeParse(companyData);
    expect(result.success).toBe(false);
    if (!result.success) {
       expect(result.error.issues[0].message).toContain("Tag must be less than 50 characters");
    }
  });

  it("should ACCEPT valid commonTags", () => {
    const validTags = [
        { tag: "React", count: 10 },
        { tag: "TypeScript", count: 5 }
    ];

    const companyData = {
      id: "123",
      name: "Valid Company",
      slug: "valid-company",
      commonTags: validTags,
    };

    const result = CompanySchema.safeParse(companyData);
    expect(result.success).toBe(true);
  });
});
