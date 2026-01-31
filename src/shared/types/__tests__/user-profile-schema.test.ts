import { createMockUserProfile } from "@/tests/unit/factories/data-factories";

import { UserProfileSchema } from "../user";

describe("UserProfileSchema", () => {
  it("validates a valid user profile", () => {
    const validProfile = createMockUserProfile();
    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("validates a user profile with minimal required fields", () => {
    const validProfile = createMockUserProfile({
      email: null,
      displayName: null,
      lastSyncedAt: undefined,
    });

    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("fails validation when uid is missing", () => {
    const validProfile = createMockUserProfile();
    const invalidProfile = { ...validProfile, uid: undefined };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it("fails validation when createdAt is missing", () => {
    const validProfile = createMockUserProfile();
    const invalidProfile = { ...validProfile, createdAt: undefined };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it("fails validation when createdAt is not a Date object (e.g. Timestamp)", () => {
     const validProfile = createMockUserProfile();
     const timestampProfile = {
       ...validProfile,
       createdAt: { seconds: 1678900000, nanoseconds: 0 }
     };

     const result = UserProfileSchema.safeParse(timestampProfile);
     expect(result.success).toBe(false);
  });
});






