import { CreateProblemSchema } from "../problem.types";

describe("Problem Validation Schemas", () => {
  describe("SafeTitleSchema", () => {
    const validBase = {
      difficulty: "Easy" as const,
      link: "https://leetcode.com/problems/valid",
      tags: ["Array"],
      normalizedTitle: "valid-title",
    };

    it("should accept valid titles", () => {
      const validTitles = [
        "Two Sum",
        "3Sum",
        "Valid Parentheses",
        "Problem - 1",
        "Title with (parentheses) and [brackets]",
        "Title with: colons and . dots",
      ];

      validTitles.forEach((title) => {
        const result = CreateProblemSchema.safeParse({
          ...validBase,
          title,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject titles with HTML characters < and >", () => {
      const invalidTitles = [
        "<script>alert(1)</script>",
        "Title with <tag>",
        "Title with > arrow",
        "<div>HTML</div>",
      ];

      invalidTitles.forEach((title) => {
        const result = CreateProblemSchema.safeParse({
          ...validBase,
          title,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("HTML");
        }
      });
    });

    it("should reject titles with control characters", () => {
      const result = CreateProblemSchema.safeParse({
        ...validBase,
        title: "Title\u0000Null",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("SafeDescriptionSchema", () => {
    const validBase = {
        title: "Valid Title",
        difficulty: "Easy" as const,
        link: "https://leetcode.com/problems/valid",
        tags: ["Array"],
        normalizedTitle: "valid-title",
    };

    it("should accept valid descriptions", () => {
        const validDescriptions = [
            "This is a valid description.",
            "Description with newlines\nand paragraphs.",
            "Description with special chars: !@#$%^&*()_+",
            "Description with <math> inequalities like 1 < 2",
            "Description with generics like List<String>",
            undefined, // Optional
        ];

        validDescriptions.forEach((description) => {
            const result = CreateProblemSchema.safeParse({
                ...validBase,
                description,
            });
            expect(result.success).toBe(true);
        });
    });

    it("should reject descriptions that are too long", () => {
        const longDescription = "a".repeat(10001);
        const result = CreateProblemSchema.safeParse({
            ...validBase,
            description: longDescription,
        });
        expect(result.success).toBe(false);
    });
  });
});
