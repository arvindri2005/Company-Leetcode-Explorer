
import { DateStringSchema, WorkExperienceSchema } from "../user";

describe("DateStringSchema", () => {
  it("should accept valid YYYY format", () => {
    expect(DateStringSchema.safeParse("2023").success).toBe(true);
    expect(DateStringSchema.safeParse("1990").success).toBe(true);
  });

  it("should accept valid MM/YYYY format", () => {
    expect(DateStringSchema.safeParse("01/2023").success).toBe(true);
    expect(DateStringSchema.safeParse("12/2023").success).toBe(true);
    expect(DateStringSchema.safeParse("05/2024").success).toBe(true);
  });

  it("should reject invalid formats", () => {
    expect(DateStringSchema.safeParse("23").success).toBe(false);
    expect(DateStringSchema.safeParse("202").success).toBe(false);
    expect(DateStringSchema.safeParse("abc/2023").success).toBe(false);
    expect(DateStringSchema.safeParse("2023/01").success).toBe(false); // YYYY/MM not supported
  });

  it("should reject invalid months", () => {
    expect(DateStringSchema.safeParse("13/2023").success).toBe(false);
    expect(DateStringSchema.safeParse("00/2023").success).toBe(false);
    expect(DateStringSchema.safeParse("20/2023").success).toBe(false);
  });
});

describe("WorkExperienceSchema Date Validation", () => {
  const validBase = {
    jobTitle: "Software Engineer",
    companyName: "Tech Corp",
    responsibilities: "Writing clean code for critical systems.",
  };

  it("should accept valid date ranges", () => {
    const data = {
      ...validBase,
      startDate: "2020",
      endDate: "2022",
    };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);

    const data2 = {
      ...validBase,
      startDate: "01/2020",
      endDate: "05/2020",
    };
    expect(WorkExperienceSchema.safeParse(data2).success).toBe(true);
  });

  it("should accept 'Present' as end date", () => {
    const data = {
      ...validBase,
      startDate: "2020",
      endDate: "Present",
    };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(true);
  });

  it("should reject end date before start date", () => {
    const data = {
      ...validBase,
      startDate: "2022",
      endDate: "2020",
    };
    const result = WorkExperienceSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("End date must be after start date");
    }
  });

  it("should reject end date before start date (mixed precision)", () => {
    // 02/2022 is after 2022 (which is treated as Jan 2022 for start date?)
    // Actually parseDateValue treats YYYY start as Jan, YYYY end as Dec.

    // Start: 2022 -> Jan 2022
    // End: 02/2021 -> Feb 2021
    // Should fail
    const data = {
      ...validBase,
      startDate: "2022",
      endDate: "02/2021",
    };
    expect(WorkExperienceSchema.safeParse(data).success).toBe(false);
  });
});
