import { type User as FirebaseUser } from "firebase/auth";

import { userService } from "@/features/profile/services/user.service";
import { success } from "@/shared/types/result";

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

describe("AuthService Performance", () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    authService = new AuthService();
  });

  describe("syncUserProfile Deduplication", () => {
    it("should prevent concurrent API calls for the same user", async () => {
      const mockUser = {
        uid: "test-uid-perf",
        email: "perf@example.com",
        displayName: "Perf User",
      } as FirebaseUser;

      // Mock a slow response
      (userService.syncUserProfile as jest.Mock).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return success();
      });

      // Launch two concurrent requests
      const promise1 = authService.syncUserProfile(mockUser);
      const promise2 = authService.syncUserProfile(mockUser);

      await Promise.all([promise1, promise2]);

      // Should only call service once
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);
    });

    it("should allow new calls after the first one finishes", async () => {
      const mockUser = {
        uid: "test-uid-perf",
        email: "perf@example.com",
        displayName: "Perf User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // First call
      await authService.syncUserProfile(mockUser);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);

      // Force a second call (bypassing memory cache)
      await authService.syncUserProfile(mockUser, true);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(2);
    });
    
     it("should start a new sync when forced, even if sync is in progress", async () => {
      const mockUser = {
        uid: "test-uid-perf",
        email: "perf@example.com",
        displayName: "Perf User",
      } as FirebaseUser;

      // Mock a slow response
      (userService.syncUserProfile as jest.Mock).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return success();
      });

      // Launch two concurrent requests, second one forced
      const promise1 = authService.syncUserProfile(mockUser, false); // Initiates sync
      const promise2 = authService.syncUserProfile(mockUser, true);  // Force bypasses deduplication

      await Promise.all([promise1, promise2]);

      // Force=true bypasses deduplication, so both calls trigger API
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe("skipNextAutoSync", () => {
    it("should skip automatic sync when requested", async () => {
      const mockUser = {
        uid: "test-uid-skip",
        email: "skip@example.com",
        displayName: "Skip User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // Signal to skip
      authService.skipNextAutoSync();

      // Attempt sync (should be skipped)
      const result = await authService.syncUserProfile(mockUser, false);

      expect(result.success).toBe(true);
      expect(userService.syncUserProfile).not.toHaveBeenCalled();
    });

    it("should NOT skip forced sync even when requested", async () => {
      const mockUser = {
        uid: "test-uid-skip-forced",
        email: "skip-forced@example.com",
        displayName: "Skip Forced User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      // Signal to skip
      authService.skipNextAutoSync();

      // Attempt forced sync (should NOT be skipped)
      await authService.syncUserProfile(mockUser, true);

      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);
    });

    it("should consume the skip flag after one use", async () => {
      const mockUser = {
        uid: "test-uid-skip-consume",
        email: "skip-consume@example.com",
        displayName: "Skip Consume User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      authService.skipNextAutoSync();

      // First call skipped
      await authService.syncUserProfile(mockUser, false);
      expect(userService.syncUserProfile).not.toHaveBeenCalled();

      // Second call proceeds (flag consumed)
      await authService.syncUserProfile(mockUser, false);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);
    });

    it("should allow resetting the skip flag", async () => {
      const mockUser = {
        uid: "test-uid-skip-reset",
        email: "skip-reset@example.com",
        displayName: "Skip Reset User",
      } as FirebaseUser;

      (userService.syncUserProfile as jest.Mock).mockResolvedValue(success());

      authService.skipNextAutoSync();
      authService.resetSkipAutoSync();

      // Should sync immediately because flag was reset
      await authService.syncUserProfile(mockUser, false);
      expect(userService.syncUserProfile).toHaveBeenCalledTimes(1);
    });
  });
});
