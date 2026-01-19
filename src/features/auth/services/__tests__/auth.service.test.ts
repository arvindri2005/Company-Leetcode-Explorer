import { type User as FirebaseUser } from "firebase/auth";

import { userService } from "@/features/profile/services/user.service";
import { Logger } from "@/lib/utils/logger";
import { failure,success } from "@/shared/types/result";

import { AuthService } from "../auth.service";

// Mock dependencies
jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
}));

jest.mock("@/lib/api/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("@/features/profile/services/user.service", () => ({
  userService: {
    syncUserProfile: jest.fn(),
  },
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe("syncUserProfile", () => {
    it("should sanitize display name before calling userService", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "  Dirty Name   ",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      await authService.syncUserProfile(mockUser);

      expect(userService.syncUserProfile).toHaveBeenCalledWith(
        "test@example.com",
        "Dirty Name" // Trimmed
      );
    });

    it("should truncate long display names", async () => {
      const longName = "A".repeat(100);
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: longName,
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      await authService.syncUserProfile(mockUser);

      expect(userService.syncUserProfile).toHaveBeenCalledWith(
        "test@example.com",
        "A".repeat(50) // Truncated to 50 chars
      );
    });

    it("should handle null display name", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: null,
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      await authService.syncUserProfile(mockUser);

      expect(userService.syncUserProfile).toHaveBeenCalledWith(
        "test@example.com",
        null
      );
    });

    it("should log error if sync fails", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(
        failure({ code: "INTERNAL_ERROR", message: "Sync failed" })
      );

      const result = await authService.syncUserProfile(mockUser);

      expect(result.success).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(
        "Failed to sync user profile",
        expect.objectContaining({ message: "Sync failed" }),
        expect.any(Object)
      );
    });
  });
});
