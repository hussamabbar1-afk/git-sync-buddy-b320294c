export const THEME_STORAGE_KEY = "zunftecho_theme";

export function applyTheme(darkMode: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
}

export function applyStoredTheme() {
  if (typeof window === "undefined") return;
  applyTheme(window.localStorage.getItem(THEME_STORAGE_KEY) === "dark");
}
