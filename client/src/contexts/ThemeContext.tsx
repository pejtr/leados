import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark-teal" | "light-classic" | "midnight-purple";

export const THEMES: { id: Theme; label: string; icon: string; description: string }[] = [
  {
    id: "dark-teal",
    label: "Dark Teal",
    icon: "🌊",
    description: "Atlantis — tmavé pozadí, tyrkysový akcent",
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
