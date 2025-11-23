"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register(SW_PATH)
      .catch((error) => console.error("Service worker registration failed", error));
  }, []);

  return null;
}
