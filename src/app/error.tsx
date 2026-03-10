"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  useEffect(() => {
    console.error("Uncaught error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#313338] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ed4245]/10">
        <AlertTriangle className="h-10 w-10 text-[#ed4245]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-[#8e9297]">
          An unexpected error occurred. This has been logged automatically.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-2 rounded-md bg-[#5865f2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4]"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
