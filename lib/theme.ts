/**
 * Theme system (light / dark / system).
 * The choice lives in localStorage under `launchpad_theme`. Light is the default;
 * `system` (follow the OS) is available as an explicit choice.
 * `THEME_INIT_SCRIPT` runs inline in <head> before first paint, so there is no flash.
 */

export const THEME_STORAGE_KEY = "launchpad_theme"

export const THEMES = ["light", "dark", "system"] as const
export type Theme = (typeof THEMES)[number]
export type ResolvedTheme = Exclude<Theme, "system">

export const DEFAULT_THEME: Theme = "light"

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value)
}

export function resolveTheme(theme: Theme, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === "system") return systemPrefersDark ? "dark" : "light"
  return theme
}

/**
 * Inline, dependency-free and wrapped in try/catch: storage can throw in
 * private mode or with blocked site data. Keep it in sync with `resolveTheme`.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(t!=="light"&&t!=="dark"&&t!=="system")t="light";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";r.dataset.theme=t}catch(e){}})();`
