"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

function getCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const noop = () => () => {}

/** Speech-to-text where the browser supports it (Chrome on Android does). Text stays on the device's speech service. */
export function useSpeech(onText: (text: string) => void) {
  const supported = useSyncExternalStore(noop, () => getCtor() !== null, () => false)
  const [listening, setListening] = useState(false)
  const rec = useRef<Recognition | null>(null)
  const cb = useRef(onText)
  useEffect(() => {
    cb.current = onText
  }, [onText])

  const stop = useCallback(() => {
    rec.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    const r = new Ctor()
    r.lang = "en-IN"
    r.continuous = true
    r.interimResults = false
    r.onresult = (e) => {
      let text = ""
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript
      if (text.trim()) cb.current(text.trim())
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    r.start()
    setListening(true)
  }, [])

  useEffect(() => () => rec.current?.stop(), [])

  return { supported, listening, start, stop }
}
