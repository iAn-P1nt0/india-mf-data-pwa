"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/app/contexts/ToastContext";
import { WatchlistProvider } from "@/app/contexts/WatchlistContext";
import ToastContainer from "@/components/notifications/ToastContainer";

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
          {children}
          <ToastContainer />
        </WatchlistProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
