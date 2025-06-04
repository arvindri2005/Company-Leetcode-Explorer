'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

// --- Constants ---
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const LOCAL_STORAGE_KEY = 'aiFeatureCooldownEndTime';

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
  undefined
);
CooldownInternalCtx.displayName = 'AICooldownStateContext';

// --- Provider Component ---
interface CooldownStateProviderProps {
  children: ReactNode;
}

export const CooldownStateProvider: React.FC<CooldownStateProviderProps> = ({ 
  children 
}) => {
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isLoadingCooldown, setIsLoadingCooldown] = useState(true);

  // Effect to load cooldown end time from localStorage on mount
  useEffect(() => {
    setIsLoadingCooldown(true);
    let storedEndTime: number | null = null;
    try {
      const storedEndTimeString = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedEndTimeString) {
        const endTime = parseInt(storedEndTimeString, 10);
        if (!isNaN(endTime) && endTime > Date.now()) {
          storedEndTime = endTime;
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('AI Cooldown: Failed to access localStorage on mount.', error);
    }
    setCooldownEndTime(storedEndTime);
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
            console.warn('AI Cooldown: Failed to remove item from localStorage on expiry.', error);
          }
          if (intervalId) clearInterval(intervalId);
        }
      }, 1000);
    } else if (cooldownEndTime && currentTime >= cooldownEndTime) {
      setCooldownEndTime(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (error) {
        console.warn('AI Cooldown: Failed to remove item from localStorage (cleanup).', error);
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
      console.warn('AI Cooldown: Failed to set item in localStorage.', error);
    }
    setCooldownEndTime(newEndTime);
    setCurrentTime(Date.now());
  }, []);

  const remainingTimeMs = useMemo(
    () => {
      if (isLoadingCooldown) return COOLDOWN_DURATION_MS;
      if (cooldownEndTime) return Math.max(0, cooldownEndTime - currentTime);
      return 0;
    },
    [isLoadingCooldown, cooldownEndTime, currentTime]
  );

  const canUseAI = useMemo(
    () => isLoadingCooldown || remainingTimeMs <= 0,
    [isLoadingCooldown, remainingTimeMs]
  );

  const formattedRemainingTime = useMemo(() => {
    if (isLoadingCooldown && !cooldownEndTime) return '...';
    if (remainingTimeMs <= 0) return 'Ready';

    const totalSeconds = Math.ceil(remainingTimeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
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
    children
  );
};

// --- Custom Hook to Consume Context ---
export function useAICooldown(): AICooldownContextType {
  const context = useContext(CooldownInternalCtx);
  if (context === undefined) {
    throw new Error(
      'useAICooldown must be used within a CooldownStateProvider. Make sure CooldownStateProvider is correctly placed in your component tree (e.g., in layout.tsx).'
    );
  }
  return context;
}