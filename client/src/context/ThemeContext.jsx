import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "sweety_theme";

function applyThemeToDOM(activeTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (activeTheme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    if (body) {
      body.classList.add("dark");
      body.setAttribute("data-theme", "dark");
    }
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    if (body) {
      body.classList.remove("dark");
      body.setAttribute("data-theme", "light");
    }
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    } catch {
      // fallback
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark") return "dark";
      if (saved === "light") return "light";
    } catch {
      // fallback
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme immediately on state change and listen to media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveAndApply = () => {
      let active;
      if (theme === "dark") {
        active = "dark";
      } else if (theme === "light") {
        active = "light";
      } else {
        active = mediaQuery.matches ? "dark" : "light";
      }

      setResolvedTheme(active);
      applyThemeToDOM(active);
    };

    resolveAndApply();

    const handleSystemChange = () => {
      if (theme === "system") {
        resolveAndApply();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme !== "light" && newTheme !== "dark" && newTheme !== "system") {
      return;
    }
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const value = {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
