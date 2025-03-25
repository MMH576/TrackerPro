"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define theme categories for better organization
export const themeCategories = {
  light: ["light", "corporate"],
  dark: ["dark", "synthwave"],
  colorful: ["cupcake"]
};

// Flatten all themes from categories
export const themes = [
  ...themeCategories.light,
  ...themeCategories.dark,
  ...themeCategories.colorful
];

// Theme metadata for richer theme selection UI
export const themeMetadata = {
  light: { name: "Light", icon: "☀️", description: "Clean, minimal light theme" },
  dark: { name: "Dark", icon: "🌙", description: "Dark mode for night viewing" },
  cupcake: { name: "Cupcake", icon: "🧁", description: "Pastel and soft colors" },
  synthwave: { name: "Synthwave", icon: "🌊", description: "Retro 80s neon vibe" },
  corporate: { name: "Corporate", icon: "🏢", description: "Professional blue theme" }
};

// Map DaisyUI themes to Shadcn dark/light mode
const darkThemes = ["dark", "synthwave"];

type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  availableThemes: string[];
  themeCategories: typeof themeCategories;
  themeMetadata: typeof themeMetadata;
  getThemeIcon: (themeName: string) => string;
  getThemeInfo: (themeName: string) => { name: string; icon: string; description: string };
  systemTheme: string | null;
  useSystemTheme: boolean;
  setUseSystemTheme: (use: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState("light");
  const [systemTheme, setSystemTheme] = useState<string | null>(null);
  const [useSystemTheme, setUseSystemTheme] = useState(false);

  // Handle theme change
  const handleThemeChange = (newTheme: string) => {
    if (!themes.includes(newTheme)) {
      console.warn(`Theme "${newTheme}" not found, defaulting to "light"`);
      newTheme = "light";
    }

    setThemeState(newTheme);
    
    if (!mounted) return;
    
    // Save to localStorage only if not using system theme
    if (!useSystemTheme) {
      localStorage.setItem("theme", newTheme);
    }
    
    // Apply the theme to the html element
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Also update the class for Shadcn UI compatibility
    if (darkThemes.includes(newTheme)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Get theme icon by name
  const getThemeIcon = (themeName: string) => {
    return themeMetadata[themeName as keyof typeof themeMetadata]?.icon || "🎨";
  };

  // Get theme information by name
  const getThemeInfo = (themeName: string) => {
    return themeMetadata[themeName as keyof typeof themeMetadata] || 
      { name: themeName, icon: "🎨", description: "Custom theme" };
  };

  // Check for system theme preference
  const detectSystemTheme = () => {
    if (typeof window === 'undefined') return null;
    
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  };

  // Toggle system theme usage
  const handleSystemThemeToggle = (use: boolean) => {
    setUseSystemTheme(use);
    localStorage.setItem("useSystemTheme", use.toString());
    
    if (use && systemTheme) {
      handleThemeChange(systemTheme);
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    // Detect system theme
    const detectedSystemTheme = detectSystemTheme();
    setSystemTheme(detectedSystemTheme);
    
    // Check user preference for system theme
    const savedUseSystemTheme = localStorage.getItem("useSystemTheme") === "true";
    setUseSystemTheme(savedUseSystemTheme);
    
    // Get theme based on preferences
    const savedTheme = localStorage.getItem("theme") || "light";
    const themeToApply = savedUseSystemTheme && detectedSystemTheme ? detectedSystemTheme : savedTheme;
    
    // Apply the initial theme
    handleThemeChange(themeToApply);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
      
      // Only apply if using system theme
      if (useSystemTheme) {
        handleThemeChange(newSystemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, useSystemTheme]);

  // Context value
  const contextValue = {
    theme,
    setTheme: handleThemeChange,
    availableThemes: themes,
    themeCategories,
    themeMetadata,
    getThemeIcon,
    getThemeInfo,
    systemTheme,
    useSystemTheme,
    setUseSystemTheme: handleSystemThemeToggle
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  
  return context;
} 