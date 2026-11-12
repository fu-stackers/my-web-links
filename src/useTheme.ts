import { useEffect, useState, useCallback } from "react";
import { getTheme, setTheme, type Theme } from "./storage";

export type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // Applies the "dark" class to <html> based on current theme preference
  const applyTheme = useCallback((currentTheme: Theme) => {
    let activeDark = false;
    if (currentTheme === "system") {
      activeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } else {
      activeDark = currentTheme === "dark";
    }

    if (activeDark) {
      document.documentElement.classList.add("dark");
      setResolvedTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setResolvedTheme("light");
    }
  }, []);

  // Initial load from storage
  useEffect(() => {
    getTheme().then((saved) => {
      setThemeState(saved);
      applyTheme(saved);
    });
  }, [applyTheme]);

  // Listen for system changes when in "system" mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Update theme in storage and state
  const changeTheme = useCallback(
    async (nextTheme: Theme) => {
      setThemeState(nextTheme);
      applyTheme(nextTheme);
      await setTheme(nextTheme);
    },
    [applyTheme],
  );

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    changeTheme(next);
  }, [resolvedTheme, changeTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme: changeTheme,
    toggleTheme,
  };
}
