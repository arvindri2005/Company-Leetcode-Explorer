import { forgotPasswordSchema } from "../forgot-password-form";
import { loginFormSchema } from "../login-form";
import { resetPasswordSchema } from "../reset-password-form";
import { signupFormSchema } from "../signup-form";

describe("Auth Form Schemas Security Limits", () => {
  const longString256 = "a".repeat(256);
  const longString129 = "a".repeat(129);
  const validEmail = "test@example.com";
  // Updated to meet new complexity requirements: 8+ chars, upper, lower, number, special
  const validPassword = "Password123!";

  describe("loginFormSchema", () => {
    it("should reject email longer than 255 characters", () => {
      const result = loginFormSchema.safeParse({
        email: longString256 + "@example.com",
        password: validPassword,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("255 characters"))).toBe(true);
      }
    });

    it("should reject password longer than 128 characters", () => {
      const result = loginFormSchema.safeParse({
        email: validEmail,
        password: longString129,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("128 characters"))).toBe(true);
      }
    });

    it("should accept password of 6 characters (backward compatibility)", () => {
      const result = loginFormSchema.safeParse({
        email: validEmail,
        password: "123456",
        rememberMe: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("signupFormSchema", () => {
    it("should reject email longer than 255 characters", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: longString256 + "@example.com",
        password: validPassword,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("255 characters"))).toBe(true);
      }
    });

    it("should reject password longer than 128 characters", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: longString129,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("128 characters"))).toBe(true);
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: "Short1!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("8 characters"))).toBe(true);
      }
    });

    it("should reject password without uppercase letter", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: "password123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("uppercase"))).toBe(true);
      }
    });

    it("should reject password without lowercase letter", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: "PASSWORD123!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("lowercase"))).toBe(true);
      }
    });

    it("should reject password without number", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: "Password!!!!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("number"))).toBe(true);
      }
    });

    it("should reject password without special character", () => {
      const result = signupFormSchema.safeParse({
        displayName: "Test User",
        email: validEmail,
        password: "Password1234",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("special character"))).toBe(true);
      }
    });

    it("should trim whitespace from display name", () => {
      const result = signupFormSchema.safeParse({
        displayName: "  Test User  ",
        email: validEmail,
        password: validPassword,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe("Test User");
      }
    });

    it("should reject display name containing HTML characters (<, >)", () => {
      const result = signupFormSchema.safeParse({
        displayName: "<script>alert(1)</script>",
        email: validEmail,
        password: validPassword,
      });
      // Currently this fails (returns true) because we haven't implemented the fix yet.
      // We expect it to be false after the fix.
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("HTML characters"))).toBe(true);
      }
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should reject email longer than 255 characters", () => {
      const result = forgotPasswordSchema.safeParse({
        email: longString256 + "@example.com",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("255 characters"))).toBe(true);
      }
    });
  });

  describe("resetPasswordSchema", () => {
    it("should reject password longer than 128 characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: longString129,
        confirmPassword: longString129,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("128 characters"))).toBe(true);
      }
    });

    it("should reject password shorter than 8 characters", () => {
      const result = resetPasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("8 characters"))).toBe(true);
      }
    });
  });
});
