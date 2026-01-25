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
    sessionStorage.clear();
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

    it("should use cached result if already synced", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // First call
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);

      // Second call
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);
    });

    it("should bypass cache if force is true", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // First call
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);

      // Second call with force
      await authService.syncUserProfile(mockUser, true);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(2);
    });

    it("should clear memory cache on logout", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // First call
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);

      // Logout
      await authService.logout();

      // Manually clear session storage to verify memory cache was cleared by logout
      sessionStorage.clear();

      // Second call should sync again (because memory is cleared AND storage is cleared)
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(2);
    });

    it("should allow forced sync to proceed even if another sync is in progress", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      } as FirebaseUser;

      let resolveSync: (value: any) => void;
      const syncPromise = new Promise((resolve) => {
        resolveSync = resolve;
      });

      // Mock first sync to hang
      (userService.syncUserProfile as jest.Mock).mockImplementationOnce(
        () => syncPromise
      );
      // Mock second sync to resolve immediately
      (userService.syncUserProfile as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve(success())
      );

      // Start first sync (non-forced)
      const firstCall = authService.syncUserProfile(mockUser, false);

      // Start second sync (forced)
      const secondCall = authService.syncUserProfile(mockUser, true);

      // Resolve the first sync
      resolveSync!(success());

      await Promise.all([firstCall, secondCall]);

      // Both should have been called
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(2);
    });
  });
});
