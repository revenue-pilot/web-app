"use client";

import { SessionProvider } from "next-auth/react";
import { SubscriptionProvider } from "./SubscriptionContext";
import React from "react";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    // Get the URL as a string
    const url = typeof input === 'string' ? input : input.url;
    
    // Skip custom headers for NextAuth endpoints
    if (url?.includes('/api/auth/')) {
      return originalFetch(input, init);
    }

    const email = localStorage.getItem("user_email") || "arjun@Revenuepilot.com";
    const headers = new Headers(init?.headers || {});
    if (!headers.has("x-user-email")) {
      headers.set("x-user-email", email);
    }
    const newInit = {
      ...init,
      headers,
    };
    return originalFetch(input, newInit);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SubscriptionProvider>
        {children}
      </SubscriptionProvider>
    </SessionProvider>
  );
}
