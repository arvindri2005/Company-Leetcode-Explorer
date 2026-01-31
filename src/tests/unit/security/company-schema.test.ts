import { CompanySchema } from "@/features/companies/types/company";

describe("CompanySchema Security", () => {
  const validCompany = {
    id: "123",
    name: "Test Company",
    slug: "test-company",
    difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
    recencyCounts: {
      last_30_days: 0,
      within_3_months: 0,
      within_6_months: 0,
      older_than_6_months: 0,
    },
  };

  it("should validate a valid website URL", () => {
    const data = {
      ...validCompany,
      website: "https://example.com",
    };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject javascript: protocol in website", () => {
    const data = {
      ...validCompany,
      website: "javascript:alert(1)",
    };
    const result = CompanySchema.safeParse(data);
    
    // We expect this to fail validation
    expect(result.success).toBe(false);
  });

  it("should reject vbscript: protocol in website", () => {
    const data = {
      ...validCompany,
      website: "vbscript:msgbox(1)",
    };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should reject file: protocol in website", () => {
    const data = {
      ...validCompany,
      website: "file:///etc/passwd",
    };
    const result = CompanySchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  // Logo currently is just z.string(), so this test might pass (validating it accepts anything)
  // But we want to ENFORCE it to be a URL, so we will change the expectation to be strict later.
  // For now, let's see what happens.
  it("should reject javascript: protocol in logo", () => {
    const data = {
      ...validCompany,
      logo: "javascript:alert(1)",
    };
    const result = CompanySchema.safeParse(data);
    
    // We WANT this to fail, but currently it might pass because logo is z.string()
    // So we will assert false, and if it fails (because schema accepts it), we confirm the vulnerability.
    expect(result.success).toBe(false);
  });
});
