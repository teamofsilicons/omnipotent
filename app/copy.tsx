"use client"

import { useState } from "react"

export function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className={`copy${done ? " done" : ""}`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
      aria-label="copy to clipboard"
    >
      {done ? "copied" : "copy"}
    </button>
  )
}
