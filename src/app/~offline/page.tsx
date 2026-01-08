import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You are offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-2 text-2xl font-bold text-balance">You are offline</h1>
      <p className="text-muted-foreground">
        It looks like you have lost your internet connection.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Please check your network settings and try again.
      </p>
    </div>
  );
}






