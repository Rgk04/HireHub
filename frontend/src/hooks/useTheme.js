import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hirehub-theme";
const THEME_COLORS = { light: "#f6f8fb", dark: "#0b1220" };
const listeners = new Set();

const getCurrentTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(getCurrentTheme);

  useEffect(() => {
    const listener = (nextTheme) => setThemeState(nextTheme);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Persisting the choice is best-effort when storage is unavailable.
    }
    listeners.forEach((listener) => listener(nextTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
};
