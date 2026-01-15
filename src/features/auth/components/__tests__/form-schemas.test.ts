import { forgotPasswordSchema } from "../forgot-password-form";
import { loginFormSchema } from "../login-form";
import { resetPasswordSchema } from "../reset-password-form";
import { signupFormSchema } from "../signup-form";

describe("Auth Form Schemas Security Limits", () => {
  const longString256 = "a".repeat(256);
  const longString129 = "a".repeat(129);
  const validEmail = "test@example.com";
  const validPassword = "password123";

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
  });
});
