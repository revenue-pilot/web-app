"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  primaryColor: string;
  logoUrl: string | null;
  setTheme: (color: string, logo: string | null) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: "#10b981", // default emerald-500
  logoUrl: null,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children, initialColor, initialLogo }: { children: React.ReactNode, initialColor?: string, initialLogo?: string }) {
  const [primaryColor, setPrimaryColor] = useState(initialColor || "#10b981");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogo || null);

  useEffect(() => {
    // Apply primary color to CSS variables for dynamic Tailwind usage if needed
    document.documentElement.style.setProperty("--primary-color", primaryColor);
  }, [primaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, logoUrl, setTheme: (c, l) => { setPrimaryColor(c); setLogoUrl(l); } }}>
      {children}
    </ThemeContext.Provider>
  );
}
