import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark-teal" | "light-classic" | "midnight-purple";

export const THEMES: { id: Theme; label: string; icon: string; description: string }[] = [
  {
    id: "dark-teal",
    label: "Royal Blue",
    icon: "🌊",
    description: "Královsky modré pozadí s jemným nebeským glow",
  },
  {
    id: "light-classic",
    label: "Light Classic",
    icon: "☀️",
    description: "Světlý klasický vzhled",
  },
  {
    id: "midnight-purple",
    label: "Midnight Purple",
    icon: "🌌",
    description: "Půlnoční fialová — hluboký vesmír",
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("leados-theme") as Theme | null;
    if (stored && THEMES.find(t => t.id === stored)) return stored;
    return "dark-teal";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove("dark", "theme-light-classic", "theme-midnight-purple", "theme-dark-teal");
    // Apply the correct class(es)
    if (theme === "dark-teal") {
      root.classList.add("dark", "theme-dark-teal");
    } else if (theme === "light-classic") {
      root.classList.add("theme-light-classic");
    } else if (theme === "midnight-purple") {
      root.classList.add("dark", "theme-midnight-purple");
    }
    localStorage.setItem("leados-theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((current) => current === "light-classic" ? "dark-teal" : "light-classic");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
