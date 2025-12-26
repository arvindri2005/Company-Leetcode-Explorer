"use client";

export function OfflineContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">You are offline</h1>
      <p className="text-lg text-gray-500 mb-8">
        It seems you have lost your internet connection.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
