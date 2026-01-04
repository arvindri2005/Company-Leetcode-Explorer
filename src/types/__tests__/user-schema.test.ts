import { WorkExperienceSchema } from "../user";

describe("WorkExperienceSchema", () => {
  const validBase = {
    jobTitle: "Developer",
    companyName: "Tech Corp",
    startDate: "2023",
    endDate: "Present",
    responsibilities: "Writing code. Writing code.",
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
      const messages = result.error.issues.map(e => e.message);
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
    const data = { ...validBase, endDate: "Invalid Date" };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(false);
  });

  // Chronological Logic Tests
  describe("Chronological Logic", () => {
    it("accepts same year (2023 start, 2023 end)", () => {
        const data = { ...validBase, startDate: "2023", endDate: "2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    it("accepts start month before end month in same year (01/2023 start, 05/2023 end)", () => {
        const data = { ...validBase, startDate: "01/2023", endDate: "05/2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    it("accepts start year before end year (2022 start, 2023 end)", () => {
        const data = { ...validBase, startDate: "2022", endDate: "2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    it("accepts start MM/YYYY before end MM/YYYY (12/2022 start, 01/2023 end)", () => {
        const data = { ...validBase, startDate: "12/2022", endDate: "01/2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    // Mixed Formats
    it("accepts start MM/YYYY and end YYYY (02/2023 start, 2023 end)", () => {
        // 02/2023 is Feb 2023. End "2023" implies up to Dec 2023. Should be valid.
        const data = { ...validBase, startDate: "02/2023", endDate: "2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    it("accepts start YYYY and end MM/YYYY (2023 start, 12/2023 end)", () => {
        // Start "2023" implies Jan 2023. End 12/2023 is Dec 2023. Valid.
        const data = { ...validBase, startDate: "2023", endDate: "12/2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });

    // Invalid Cases
    it("rejects start year after end year (2024 start, 2023 end)", () => {
        const data = { ...validBase, startDate: "2024", endDate: "2023" };
        const result = WorkExperienceSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe("End date must be after start date.");
        }
    });

    it("rejects start month after end month in same year (05/2023 start, 01/2023 end)", () => {
        const data = { ...validBase, startDate: "05/2023", endDate: "01/2023" };
        const result = WorkExperienceSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe("End date must be after start date.");
        }
    });

    it("rejects start MM/YYYY after end YYYY (02/2023 start, 2022 end)", () => {
         const data = { ...validBase, startDate: "02/2023", endDate: "2022" };
         const result = WorkExperienceSchema.safeParse(data);
         expect(result.success).toBe(false);
    });

    // Edge case: Start "2023" vs End "01/2023".
    // Start "2023" -> Jan 2023. End "01/2023" -> Jan 2023.
    // Logic: 2023*12 + 1 vs 2023*12 + 1. Equal. Valid.
    it("accepts start YYYY vs end MM/YYYY where logic aligns (2023 start, 01/2023 end)", () => {
        const data = { ...validBase, startDate: "2023", endDate: "01/2023" };
        expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
    });
  });
});
