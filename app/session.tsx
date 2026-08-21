"use client"

/**
 * A session that plays itself.
 *
 * The one non-obvious thing about omni is that the conversation outlives the
 * provider running it. Saying that costs a paragraph and convinces nobody.
 * Watching it happen costs nothing — so the hero is an omni event log replayed
 * at reading speed: one thread, one sequence counter, and the vendor underneath
 * it changing halfway through while the numbers keep going up.
 *
 * The script below is the shape of a real run. Every field is a field the
 * library actually emits.
 */

import { useEffect, useRef, useState } from "react"

type Kind =
  | "config"
  | "start"
  | "thinking"
  | "tool.call"
  | "tool.result"
  | "text"
  | "end"
  | "switch_provider"

type Beat = {
  type: Kind
  provider: "claude" | "openai"
  text?: string
  tool?: string
  note?: string
  /** milliseconds to hold before the next beat — pacing is the whole effect */
  hold: number
}

const MODELS = {
  claude: "claude-opus-5 · medium",
  openai: "gpt-5.6-sol · xhigh",
}

const SCRIPT: Beat[] = [
  { type: "config", provider: "claude", note: "launch", text: "level 6", hold: 620 },
  { type: "start", provider: "claude", text: "Which test in this repo is the slowest?", hold: 520 },
  { type: "thinking", provider: "claude", hold: 900 },
  { type: "tool.call", provider: "claude", tool: "Bash", text: "pytest --durations=3", hold: 1150 },
  { type: "tool.result", provider: "claude", tool: "Bash", text: "3 slowest durations", hold: 620 },
  {
    type: "text",
    provider: "claude",
    text: "test_a_conversation_survives_moving_between_providers — 41.2s.",
    hold: 1500,
  },
  { type: "end", provider: "claude", hold: 1400 },

  { type: "switch_provider", provider: "openai", note: "intelligence(9)", hold: 1500 },

  { type: "start", provider: "openai", text: "Why is that one slow?", hold: 620 },
  { type: "thinking", provider: "openai", hold: 1000 },
  {
    type: "text",
    provider: "openai",
    text: "It boots two CLIs and waits out both cold starts before the first token.",
    hold: 1800,
  },
  { type: "end", provider: "openai", hold: 3200 },
]

const LABEL: Record<Kind, string> = {
  config: "config",
  start: "start",
  thinking: "thinking",
  "tool.call": "tool.call",
  "tool.result": "tool.result",
  text: "text",
  end: "end",
  switch_provider: "switch",
}

function Line({ beat, seq }: { beat: Beat; seq: number }) {
  if (beat.type === "switch_provider") {
    return (
      <div className="beat swap" style={{ ["--tint" as string]: `var(--${beat.provider})` }}>
        <span className="beat-seq num">{seq}</span>
        <span className="swap-rule" />
        <span className="swap-what">
          <b>{beat.note}</b> — the conversation moves to {beat.provider}
        </span>
      </div>
    )
  }

  return (
    <div className={`beat is-${beat.type.replace(".", "-")}`} style={{ ["--tint" as string]: `var(--${beat.provider})` }}>
      <span className="beat-seq num">{seq}</span>
      <span className="beat-kind num">{LABEL[beat.type]}</span>
      <span className="beat-body">
        {beat.type === "thinking" && (
          <span className="pulse">
            <i />
            <i />
            <i />
          </span>
        )}
        {beat.type === "tool.call" && (
          <code>
            [{beat.tool}: {beat.text}]
          </code>
        )}
        {beat.type === "tool.result" && (
          <code className="dim">
            [{beat.tool} result: {beat.text}]
          </code>
        )}
        {beat.type === "config" && (
          <span className="dim">
            {beat.note} · {beat.text}
          </span>
        )}
        {beat.type === "end" && <span className="dim">turn complete</span>}
        {(beat.type === "start" || beat.type === "text") && beat.text}
      </span>
    </div>
  )
}

export function Session() {
  const [shown, setShown] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [watching, setWatching] = useState(false)

  // Nothing plays off-screen. A hero animating in a tab nobody is looking at is
  // just a battery bill.
  useEffect(() => {
    const el = box.current
    if (!el) return
    const eye = new IntersectionObserver(([entry]) => setWatching(entry.isIntersecting), {
      threshold: 0.25,
    })
    eye.observe(el)
    return () => eye.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(SCRIPT.length)
      return
    }
    if (!watching) return
    const beat = SCRIPT[Math.min(shown, SCRIPT.length - 1)]
    const wait = shown >= SCRIPT.length ? 2600 : beat.hold
    const timer = setTimeout(() => setShown((n) => (n >= SCRIPT.length ? 0 : n + 1)), wait)
    return () => clearTimeout(timer)
  }, [shown, watching])

  // Follow the newest line without dragging the whole page with it.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [shown])

  const live = SCRIPT.slice(0, shown)
  const provider = live.length ? live[live.length - 1].provider : "claude"

  return (
    <div className="session" ref={box} style={{ ["--tint" as string]: `var(--${provider})` }}>
      <div className="session-top">
        <span className="dot" />
        <span className="session-who">{provider}</span>
        <span className="session-model num">{MODELS[provider]}</span>
        <span className="session-live num">
          seq {Math.max(0, live.length - 1)}
        </span>
      </div>
      <div className="session-body" ref={scroller}>
        {live.map((beat, i) => (
          <Line key={i} beat={beat} seq={i} />
        ))}
      </div>
      <div className="session-foot num">
        ~/.omni/sessions/readme.jsonl — one file, both providers
      </div>
    </div>
  )
}
