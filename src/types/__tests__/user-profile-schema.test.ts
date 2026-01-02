import { z } from "zod";
import { UserProfileSchema } from "../user";

describe("UserProfileSchema", () => {
  it("validates a valid user profile", () => {
    const validProfile = {
      uid: "user123",
      email: "test@example.com",
      displayName: "Test User",
      createdAt: new Date(),
      lastSyncedAt: new Date(),
    };

    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("validates a user profile with minimal required fields", () => {
    const validProfile = {
      uid: "user123",
      email: null,
      displayName: null,
      createdAt: new Date(),
    };

    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("fails validation when uid is missing", () => {
    const invalidProfile = {
      email: "test@example.com",
      displayName: "Test User",
      createdAt: new Date(),
    };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it("fails validation when createdAt is missing", () => {
    const invalidProfile = {
      uid: "user123",
      email: "test@example.com",
      displayName: "Test User",
    };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it("fails validation when createdAt is not a Date object (e.g. Timestamp)", () => {
     const timestampProfile = {
       uid: "user123",
       email: "test@example.com",
       displayName: "Test User",
       createdAt: { seconds: 1678900000, nanoseconds: 0 }
     };

     const result = UserProfileSchema.safeParse(timestampProfile);
     expect(result.success).toBe(false);
  });
});
