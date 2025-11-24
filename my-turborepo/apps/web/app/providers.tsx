"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/app/contexts/ToastContext";
import { WatchlistProvider } from "@/app/contexts/WatchlistContext";
import ToastContainer from "@/components/notifications/ToastContainer";
import KeyboardCommandPalette from "@/components/navigation/KeyboardCommandPalette";
import { useGlobalKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function ProvidersInner({ children }: { children: ReactNode }) {
  useGlobalKeyboardShortcuts();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <>
      {children}
      <ToastContainer />
      <KeyboardCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true
          }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <WatchlistProvider>
          <ProvidersInner>{children}</ProvidersInner>
        </WatchlistProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
