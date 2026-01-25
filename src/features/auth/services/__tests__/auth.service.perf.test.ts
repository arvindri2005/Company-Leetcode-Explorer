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
});
