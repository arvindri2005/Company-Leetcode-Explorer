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

  // Extract props that should NOT be passed to the fallback div
  const {
    fill,
    priority,
    loading,
    sizes,
    quality,
    loader,
    placeholder,
    blurDataURL,
    unoptimized,
    onLoadingComplete,
    width,
    height,
    style,
    ...divProps
  } = props;

  // Prepare style for the fallback div to respect width/height if provided (and not fill)
  const divStyle = {
    ...style,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
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
          {...divProps}
        >
          {fallbackIcon ? (
            fallbackIcon
          ) : !isOnline ? (
            <WifiOff className="h-6 w-6" />
          ) : (
            <span className="text-xs">Image Error</span>
          )}
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
          loading={loading}
          sizes={sizes}
          quality={quality}
          loader={loader}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          unoptimized={unoptimized}
          onLoadingComplete={onLoadingComplete}
          width={width}
          height={height}
          style={style}
          {...divProps}
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
      loading={loading}
      sizes={sizes}
      quality={quality}
      loader={loader}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      unoptimized={unoptimized}
      onLoadingComplete={onLoadingComplete}
      width={width}
      height={height}
      style={style}
      {...divProps}
    />
  );
}






