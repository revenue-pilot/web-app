"use client";

import { SubscriptionProvider } from "./SubscriptionContext";
import React from "react";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;

    if (url?.includes("/api/auth/")) {
      return originalFetch(input, init);
    }

    const email =
      localStorage.getItem("user_email") ||
      "arjun@Revenuepilot.com";

    const headers = new Headers(init?.headers || {});

    if (!headers.has("x-user-email")) {
      headers.set("x-user-email", email);
    }

    return originalFetch(input, {
      ...init,
      headers,
    });
  };
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionProvider>
      {children}
    </SubscriptionProvider>
  );
}