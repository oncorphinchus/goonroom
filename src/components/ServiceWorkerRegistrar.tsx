"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") console.warn("SW registration failed:", err);
      });
    }
  }, []);

  return null;
}
