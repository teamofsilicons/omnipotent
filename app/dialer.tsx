"use client"

/**
 * The dial, as a thing you can actually turn.
 *
 * Every page about a product like this ships a picture of its main control. A
 * picture of a dial is a promise; a dial is an argument. Since the entire claim
 * of this library is that model choice collapses to one integer, the integer had
 * better move — and everything downstream of it had better move with it: the
 * model, the vendor, the score, the bill, and the literal command line that
 * comes out the other end.
 *
 * Drag it, click a tick, or use the arrow keys. The numbers are real; they are
 * the same rungs the library will fetch from this site in a minute's time.
 */

import { useState } from "react"

import type { Rung } from "../lib/dial"
import { invocation, provider } from "../lib/providers"
import { dial as levelColour, on as inkOn } from "../lib/ramp"

const money = (n: number) => (n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`)

/**
 * The narrowest Elo gap this benchmark can actually resolve.
 *
 * GDPval-AA's 95% intervals run about ±15 to ±27, so anything under this is two
 * models tying and the cheaper one winning. `beats()` in lib/dial.ts compares
 * with no tolerance and will therefore hand out rungs for gaps it cannot see —
 * which is worth admitting on the instrument rather than in a footnote.
 */
const RESOLVABLE = 35

export function Dialer({ rungs }: { rungs: Record<string, Rung> }) {
  const [level, setLevel] = useState(7)
  const rung = rungs[String(level)]
  const below = rungs[String(Math.max(0, level - 1))]
  if (!rung) return null

  const colour = levelColour(level)
  const saving = below && below.price < rung.price ? rung.price - below.price : 0
  const cost = below && below.score < rung.score ? rung.score - below.score : 0
  const cli = provider(rung.provider)

  return (
    <div className="dialer" style={{ ["--tone" as string]: colour, ["--on" as string]: inkOn(colour) }}>
      <p className="dialer-say">
        Set it to <b className="num">{level}</b>. omni runs{" "}
        <em>
          {rung.model}
          {rung.effort ? ` ${rung.effort}` : ""}
        </em>{" "}
        on {cli?.label ?? rung.provider}: <span className="num">{Math.round(rung.score)} Elo</span>,{" "}
        <span className="num">{money(rung.price)}</span> a task.
      </p>

      <div className="dialer-track">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          aria-label="intelligence level, 0 to 10"
          aria-valuetext={`level ${level}, ${rung.model} at ${money(rung.price)} a task`}
        />
        <div className="dialer-ticks" aria-hidden>
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              tabIndex={-1}
              className={`dialer-tick${i === level ? " on" : ""}`}
              style={{ ["--tone" as string]: levelColour(i) }}
              onClick={() => setLevel(i)}
            >
              <i />
              <u className="num">{i}</u>
            </button>
          ))}
        </div>
      </div>

      <p className="dialer-wire num">
        {cli?.wire ?? "what omni sends"}
      </p>
      <code className="dialer-run">{invocation(rung)}</code>

      <p className="dialer-delta num">
        {saving > 0 ? (
          <>
            one step down · &minus;{money(saving)} a task · &minus;{Math.round(cost)} elo
            {cost < RESOLVABLE && (
              <b> · a gap this benchmark cannot resolve — that step is free</b>
            )}
          </>
        ) : level === 0 ? (
          <>bottom of the edge · nothing cheaper is worth running</>
        ) : (
          <>level {level - 1} is this same rung · nothing in between worth picking</>
        )}
      </p>
    </div>
  )
}
