"use client";

import React, { useState } from "react";

import Image, { type ImageProps } from "next/image";

import { WifiOff } from "lucide-react";

import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { cn } from "@/shared/lib/utils";

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
  fill,
  priority,
  width,
  height,
  style,
  ...restProps
}: OfflineImageProps) {
  const isOnline = useOnlineStatus();
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [prevSrc, setPrevSrc] = useState(src);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgSrc(src);
    setError(false);
    setFallbackFailed(false);
  }

  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  const handleFallbackError = () => {
    setFallbackFailed(true);
  };

  // Prepare style for the fallback div to respect width/height if provided (and not fill)
  const divStyle = {
    ...style,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
  };

  const renderFallbackContent = () => {
    if (fallbackIcon) {
      return fallbackIcon;
    }
    if (!isOnline) {
      return <WifiOff className="h-6 w-6" />;
    }
    return <span className="text-xs">Image Error</span>;
  };

  if (error) {
    if (fallbackFailed || !fallbackSrc) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground",
            fill && "absolute inset-0 h-full w-full",
            className
          )}
          style={divStyle}
          role="img"
          aria-label={alt || "Image not available"}
        >
          {renderFallbackContent()}
        </div>
      );
    }

    if (imgSrc === fallbackSrc) {
      return (
        <Image
          src={fallbackSrc}
          alt={alt || "Fallback image"}
          className={cn(className, !isOnline && "grayscale opacity-80")}
          onError={handleFallbackError}
          fill={fill}
          priority={priority}
          width={width}
          height={height}
          style={style}
          {...restProps}
        />
      );
    }
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={cn(className, !isOnline && "opacity-90")}
      onError={handleError}
      fill={fill}
      priority={priority}
      width={width}
      height={height}
      style={style}
      {...restProps}
    />
  );
}
