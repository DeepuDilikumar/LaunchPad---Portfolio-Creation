export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "bp_theme";

/** Runs in <head> before paint so the page never flashes the wrong theme. Keep in sync with readPref() in lib/theme.ts. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");document.documentElement.dataset.theme=t==="light"||t==="system"||t==="dark"?t:"dark"}catch(e){}})()`;
