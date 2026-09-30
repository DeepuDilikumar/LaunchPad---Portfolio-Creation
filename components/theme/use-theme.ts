"use client"

import { useSyncExternalStore } from "react"

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isTheme,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme"

const listeners = new Set<() => void>()
const DARK_QUERY = "(prefers-color-scheme: dark)"

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function systemPrefersDark() {
  return window.matchMedia(DARK_QUERY).matches
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme, systemPrefersDark())
  const root = document.documentElement
  // Suppress colour transitions for one frame so the whole page switches at once.
  root.classList.add("theme-switching")
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
  root.dataset.theme = theme
  requestAnimationFrame(() => root.classList.remove("theme-switching"))
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage unavailable: still apply for this page view.
  }
  applyTheme(theme)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  const onSystemChange = () => {
    if (readTheme() === "system") applyTheme("system")
    emit()
  }
  // Keep tabs in sync when the theme changes elsewhere.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(readTheme())
    emit()
  }
  media.addEventListener("change", onSystemChange)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    media.removeEventListener("change", onSystemChange)
    window.removeEventListener("storage", onStorage)
  }
}

function getResolved(): ResolvedTheme {
  return resolveTheme(readTheme(), systemPrefersDark())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME)
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolved,
    () => "light" as ResolvedTheme
  )
  return { theme, resolvedTheme, setTheme }
}
