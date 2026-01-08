import React from "react";

/**
 * Fallback component displayed when a CompanyCard fails to render.
 */
const CompanyCardErrorFallback = () => {
  return (
    <article className="flex flex-col h-full min-h-[180px] rounded-xl bg-white/5 backdrop-blur-lg border border-red-500/30 p-4 items-center justify-center text-center">
        <div className="text-red-400 mb-2 text-2xl">
            ⚠️
        </div>
        <p className="text-white/80 text-sm font-medium">
            Failed to load company
        </p>
    </article>
  );
};

export default CompanyCardErrorFallback;
