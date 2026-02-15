import { navigationRegistry } from "@/shared/lib/config/navigation";

import { authService } from "./services/auth.service";

export function registerAuthNavigation() {
  navigationRegistry.register({
    key: "logout",
    label: "Logout",
    position: "auth",
    order: 100,
    isVisible: ({ user, isLoading }) => !isLoading && !!user,
    onClick: async ({ router, toast }) => {
      try {
        await authService.logout();
        toast.success("Logged Out", "You have been successfully logged out.");
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Logout Failed", "Could not log you out. Please try again.");
      }
    },
  });
}
