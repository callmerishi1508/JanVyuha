/**
 * Voice-to-text for the report wizard via the free browser Web Speech API —
 * an equity feature for low-literacy users (P2-11): speaking a complaint in
 * Hindi/Telugu/Tamil is easier than typing it. Additive and never required;
 * the mic button simply doesn't render where the API is missing (Firefox,
 * most non-Chromium Android browsers) or was denied.
 *
 * Chrome/Edge stream audio to a Google speech service — same sub-processor
 * family already disclosed for the optional AI assist on /privacy.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { currentLocale } from './i18n'

/** Minimal typings — lib.dom omits the (prefixed) SpeechRecognition API. */
interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null
}

/** BCP-47 speech locales for the app's UI languages. */
const SPEECH_LANG: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
}

export interface SpeechInput {
  /** False where the browser has no Web Speech API — hide the mic entirely. */
  supported: boolean
  listening: boolean
  /** Begin dictation; each finalized phrase is passed to onText. */
  start: () => void
  stop: () => void
}

export function useSpeechInput(onText: (text: string) => void): SpeechInput {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  // Keep the latest callback without re-creating the recognizer per render.
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  const supported = typeof window !== 'undefined' && getRecognitionCtor() !== null

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || recRef.current) return
    const rec = new Ctor()
    rec.lang = SPEECH_LANG[currentLocale()] ?? 'en-IN'
    rec.continuous = true
    rec.interimResults = false // only append finalized phrases — no flicker
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal && r[0]?.transcript) onTextRef.current(r[0].transcript.trim())
      }
    }
    // Covers natural end-of-speech, permission denial and network errors alike:
    // the UI just returns to the idle mic state.
    rec.onend = () => {
      recRef.current = null
      setListening(false)
    }
    rec.onerror = () => {
      /* onend fires after onerror and does the cleanup */
    }
    recRef.current = rec
    setListening(true)
    try {
      rec.start()
    } catch {
      recRef.current = null
      setListening(false)
    }
  }, [])

  // Never leave the mic hot after unmount (e.g. user navigates mid-dictation).
  useEffect(() => () => recRef.current?.abort(), [])

  return { supported, listening, start, stop }
}
