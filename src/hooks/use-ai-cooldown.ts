"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

// --- Constants ---
const COOLDOWN_DURATION_MS = 0 * 60 * 1000; // 5 minutes
const LOCAL_STORAGE_KEY = "aiFeatureCooldownEndTime";

// --- Context Type Definition ---
interface AICooldownContextType {
  cooldownEndTime: number | null;
  canUseAI: boolean;
  isLoadingCooldown: boolean;
  remainingTimeMs: number;
  startCooldown: () => void;
  formattedRemainingTime: string;
}

// --- Create Context ---
const CooldownInternalCtx = createContext<AICooldownContextType | undefined>(
  undefined,
);
CooldownInternalCtx.displayName = "AICooldownStateContext";

// --- Provider Component ---
interface CooldownStateProviderProps {
  children: ReactNode;
}

/**
 * @function CooldownStateProvider
 * @description A provider component that manages and exposes the state for an AI feature cooldown timer.
 * It handles storing the cooldown end time in localStorage and provides values and functions to its children.
 * @param {CooldownStateProviderProps} props - The props for the component.
 * @returns {JSX.Element} The provider component wrapping its children.
 */
export const CooldownStateProvider: React.FC<CooldownStateProviderProps> = ({
  children,
}) => {
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const storedEndTimeString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedEndTimeString) {
      const endTime = parseInt(storedEndTimeString, 10);
      if (!isNaN(endTime) && endTime > Date.now()) {
        return endTime;
      }
    }
    return null;
  });
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isLoadingCooldown, setIsLoadingCooldown] = useState(true);

  useEffect(() => {
    setIsLoadingCooldown(false);
  }, []);

  // Effect to manage the countdown timer
  useEffect(() => {
    if (isLoadingCooldown) return;

    let intervalId: NodeJS.Timeout | undefined;

    if (cooldownEndTime && cooldownEndTime > currentTime) {
      intervalId = setInterval(() => {
        const now = Date.now();
        setCurrentTime(now);
        if (now >= cooldownEndTime) {
          setCooldownEndTime(null);
          try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          } catch (error) {
            console.warn(
              "AI Cooldown: Failed to remove item from localStorage on expiry.",
              error,
            );
          }
          if (intervalId) clearInterval(intervalId);
        }
      }, 1000);
    } else if (cooldownEndTime && currentTime >= cooldownEndTime) {
      setCooldownEndTime(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.warn(
          "AI Cooldown: Failed to remove item from localStorage (cleanup).",
          error,
        );
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cooldownEndTime, currentTime, isLoadingCooldown]);

  const startCooldown = useCallback(() => {
    const newEndTime = Date.now() + COOLDOWN_DURATION_MS;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newEndTime.toString());
    } catch (error) {
      console.warn("AI Cooldown: Failed to set item in localStorage.", error);
    }
    setCooldownEndTime(newEndTime);
    setCurrentTime(Date.now());
  }, []);

  const remainingTimeMs = useMemo(() => {
    if (isLoadingCooldown) return COOLDOWN_DURATION_MS;
    if (cooldownEndTime) return Math.max(0, cooldownEndTime - currentTime);
    return 0;
  }, [isLoadingCooldown, cooldownEndTime, currentTime]);

  const canUseAI = useMemo(
    () => isLoadingCooldown || remainingTimeMs <= 0,
    [isLoadingCooldown, remainingTimeMs],
  );

  const formattedRemainingTime = useMemo(() => {
    if (isLoadingCooldown && !cooldownEndTime) return "...";
    if (remainingTimeMs <= 0) return "Ready";

    const totalSeconds = Math.ceil(remainingTimeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${seconds}s`;
  }, [isLoadingCooldown, remainingTimeMs, cooldownEndTime]);

  const providerValue = {
    cooldownEndTime,
    canUseAI,
    isLoadingCooldown,
    remainingTimeMs,
    startCooldown,
    formattedRemainingTime,
  };

  return React.createElement(
    CooldownInternalCtx.Provider,
    { value: providerValue },
    children,
  );
};

/**
 * @function useAICooldown
 * @description A custom hook to consume the AI feature cooldown context.
 * It provides access to the cooldown state, such as whether the feature can be used, the remaining time, and a function to start the cooldown.
 * @throws {Error} If used outside of a `CooldownStateProvider`.
 * @returns {AICooldownContextType} The cooldown context, including state and control functions.
 */
export function useAICooldown(): AICooldownContextType {
  const context = useContext(CooldownInternalCtx);
  if (context === undefined) {
    throw new Error(
      "useAICooldown must be used within a CooldownStateProvider. Make sure CooldownStateProvider is correctly placed in your component tree (e.g., in layout.tsx).",
    );
  }
  return context;
}
