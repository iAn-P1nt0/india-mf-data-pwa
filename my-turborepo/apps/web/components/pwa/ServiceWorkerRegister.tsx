"use client";

import { useEffect } from "react";

import { API_BASE_URL } from "@/lib/config";

const SW_PATH = "/sw.js";
const PREFETCH_URL = `${API_BASE_URL}/api/funds?limit=50`;

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let isMounted = true;
    let registration: ServiceWorkerRegistration | undefined;

    function triggerPrefetch() {
      if (registration) {
        prefetchFunds(registration, PREFETCH_URL);
      }
    }

    navigator.serviceWorker
      .register(SW_PATH)
      .then((reg) => {
        if (!isMounted) {
          return;
        }
        registration = reg;
        triggerPrefetch();
        window.addEventListener("online", triggerPrefetch);
      })
      .catch((error) => console.error("Service worker registration failed", error));

    return () => {
      isMounted = false;
      window.removeEventListener("online", triggerPrefetch);
    };
  }, []);

  return null;
}

export function prefetchFunds(registration: ServiceWorkerRegistration, url: string) {
  if (!url) {
    return;
  }
  const payload = { type: "prefetch", payload: [url] };
  if (registration.active) {
    registration.active.postMessage(payload);
  } else if (registration.installing) {
    registration.installing.addEventListener("statechange", () => {
      registration.active?.postMessage(payload);
    });
  } else if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(payload);
  }
}
