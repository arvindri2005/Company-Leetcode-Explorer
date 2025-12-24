/**
 * @fileoverview A functional component for Google AdSense units.
 *
 * This component replaces the visual placeholder with a real Google AdSense
 * ad unit. It handles the script injection (via layout) and the ad push call.
 */
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Props for the AdPlaceholder (AdUnit) component.
 */
interface AdPlaceholderProps {
  /** The title for the ad label, e.g., "Sponsored" or "Advertisement". */
  title?: string;
  /** Additional CSS classes to apply to the component container. */
  className?: string;
  /** The Google AdSense Client ID (Publisher ID). Defaults to env var or hardcoded fallback. */
  client?: string;
  /** The Google AdSense Slot ID. Defaults to env var. */
  slotId?: string;
  /** The ad format. Defaults to "auto". */
  format?: "auto" | "fluid" | "rectangle";
  /** Whether the ad is full-width responsive. Defaults to true. */
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

/**
 * Renders a Google AdSense ad unit.
 *
 * This component renders the `<ins>` tag required by AdSense and triggers
 * the push call to load the ad. It also includes a label for compliance.
 *
 * @param {AdPlaceholderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered ad unit.
 */
export default function AdPlaceholder({
  title = "Advertisement",
  className = "",
  client,
  slotId,
  format = "auto",
  responsive = true,
}: AdPlaceholderProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  const adClient =
    client ||
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ||
    "ca-pub-6342943619826199";
  const adSlot = slotId || process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID;

  useEffect(() => {
    // Avoid double pushing in React strict mode or re-renders
    if (isLoaded.current) return;

    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  if (!adSlot) {
    // Fallback to a visual placeholder if no slot ID is provided (e.g. dev mode without env vars)
    // This ensures layout doesn't break if keys are missing.
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full bg-muted/20 border border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground p-4 text-center overflow-hidden",
          className
        )}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground/50 mb-1">
          {title}
        </p>
        <div className="text-xs">Ad Space (Missing Slot ID)</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center w-full overflow-hidden my-4",
        className,
      )}
    >
      {title && (
        <div className="w-full text-center mb-1">
          <span className="text-xxs uppercase tracking-widest text-muted-foreground/60">
            {title}
          </span>
        </div>
      )}
      <div className="w-full flex-1 flex justify-center bg-muted/10 min-h-[100px] rounded-md">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      </div>
    </div>
  );
}
