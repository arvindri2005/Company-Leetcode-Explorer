import { WorkExperienceSchema } from "../user";

describe("WorkExperienceSchema", () => {
  const validBase = {
    jobTitle: "Developer",
    companyName: "Tech Corp",
    startDate: "2023",
    endDate: "Present",
    responsibilities: "Writing code.",
  };

  it("accepts valid YYYY date", () => {
    const data = { ...validBase, startDate: "2023" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("accepts valid MM/YYYY date", () => {
    const data = { ...validBase, startDate: "05/2023" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("rejects invalid date string", () => {
    const data = { ...validBase, startDate: "abcd" };
    const result = WorkExperienceSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      // In Zod, the `error` property is present when `success` is false.
      // However, TypeScript might not automatically narrow this in all configurations.
      const issues = result.error.issues;
      const messages = issues.map(e => e.message);
      expect(messages).toContain("Start date must be in YYYY or MM/YYYY format.");
    }
  });

  it("rejects invalid format M/YYYY (strict)", () => {
    const data = { ...validBase, startDate: "5/2023" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(false);
  });

  // EndDate tests
  it("accepts 'Present' as endDate", () => {
    const data = { ...validBase, endDate: "Present" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("accepts valid YYYY endDate", () => {
    const data = { ...validBase, endDate: "2024" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("accepts valid MM/YYYY endDate", () => {
    const data = { ...validBase, endDate: "01/2024" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("accepts empty string endDate", () => {
     const data = { ...validBase, endDate: "" };
     expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("rejects invalid string endDate", () => {
    // This should fail after we implement the fix
    const data = { ...validBase, endDate: "Invalid Date" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(false);
  });
});
