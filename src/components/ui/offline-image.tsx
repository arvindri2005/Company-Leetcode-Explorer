"use client";

import React, { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface OfflineImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
}

export function OfflineImage({
  src,
  alt,
  className,
  fallbackSrc = "/icon.png",
  fallbackIcon,
  ...props
}: OfflineImageProps) {
  const isOnline = useOnlineStatus();
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setError(false);
    setFallbackFailed(false);
  }, [src]);

  const handleError = () => {
    setError(true);
    // If we have a fallback source, try to load that
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  const handleFallbackError = () => {
    setFallbackFailed(true);
  };

  // 1. Initial Load: Show primary src
  // 2. Primary Error: Show fallbackSrc
  // 3. Fallback Error (or no fallbackSrc): Show Icon

  // If we are in an error state
  if (error) {
    // Case 3: Fallback failed or no fallback provided -> Show Icon
    if (fallbackFailed || !fallbackSrc) {
        return (
          <div
            className={cn(
              "flex items-center justify-center bg-muted text-muted-foreground",
              className
            )}
            role="img"
            aria-label={alt || "Image not available"}
          >
            {fallbackIcon ? (
                fallbackIcon
            ) : (
                 !isOnline ? <WifiOff className="h-6 w-6" /> : <span className="text-xs">Image Error</span>
            )}
          </div>
        );
    }

    // Case 2: Primary failed, trying fallback
    // Note: We check `imgSrc === fallbackSrc` to ensure we are actually rendering the fallback
    if (imgSrc === fallbackSrc) {
        return (
            <Image
                src={fallbackSrc}
                alt={alt || "Fallback image"}
                className={cn(className, !isOnline && "grayscale opacity-80")}
                onError={handleFallbackError}
                {...props}
            />
        )
    }
  }

  // Case 1: Standard render
  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={cn(className, !isOnline && "opacity-90")} // Slight opacity drop if offline to hint status if cached
      onError={handleError}
      {...props}
    />
  );
}
