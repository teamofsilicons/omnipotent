"use client"

import { useMemo, useState } from "react"

import { beatenBy, dial, edge, plottable, type Entry, type Rung } from "../../lib/dial"
import { PROVIDERS } from "../../lib/providers"

/**
 * The whole argument, drawn.
 *
 * Cost runs left to right on a log scale, because the models span three orders
 * of magnitude and a linear axis would pile them against the left wall. Score
 * runs bottom to top. The dial is the upper-left edge of the cloud, and the
 * staircase between its points is literally the walk the dial takes.
 *
 * Turning a provider off is the point: models that were shadowed by another
 * vendor's step straight back onto the edge.
 */

const W = 1000
const H = 620
const PAD = { top: 44, right: 44, bottom: 64, left: 68 }

const TINT: Record<string, string> = {
  claude: "var(--claude)",
  openai: "var(--openai)",
  google: "var(--google)",
}

const key = (r: Rung) => `${r.provider}/${r.model}/${r.effort}`

export function Graph({ models }: { models: Entry[] }) {
  const [on, setOn] = useState<string[]>(PROVIDERS.map((p) => p.id))
  const [held, setHeld] = useState<Rung | null>(null)

  const everything = useMemo(() => plottable(models), [models])
  const points = useMemo(() => everything.filter((p) => on.includes(p.provider)), [everything, on])
  const walk = useMemo(() => edge(points), [points])
  const rungs = useMemo(() => dial(walk), [walk])
  const onEdge = useMemo(() => new Set(walk.map(key)), [walk])

  const levels = useMemo(() => {
    const at = new Map<string, number[]>()
    for (const [level, rung] of Object.entries(rungs)) {
      at.set(key(rung), [...(at.get(key(rung)) ?? []), Number(level)])
    }
    return at
  }, [rungs])

  // the axes hold still while providers are toggled, or the picture jumps and
  // you cannot see what actually changed
  const bounds = useMemo(() => {
    const prices = everything.map((p) => Math.log10(p.price))
    const scores = everything.map((p) => p.score)
    return {
      x0: Math.min(...prices) - 0.25,
      x1: Math.max(...prices) + 0.25,
      y0: Math.min(...scores) - 70,
      y1: Math.max(...scores) + 70,
    }
  }, [everything])

  const x = (price: number) =>
    PAD.left + ((Math.log10(price) - bounds.x0) / (bounds.x1 - bounds.x0)) * (W - PAD.left - PAD.right)
  const y = (score: number) =>
    H - PAD.bottom - ((score - bounds.y0) / (bounds.y1 - bounds.y0)) * (H - PAD.top - PAD.bottom)

  // a staircase, not a diagonal: each step is "less score at the same money",
  // then "less money", which is how the dial actually descends
  const staircase = walk
    .map((p, i) =>
      i === 0
        ? `M ${x(p.price)},${y(p.score)}`
        : `L ${x(p.price)},${y(walk[i - 1].score)} L ${x(p.price)},${y(p.score)}`,
    )
    .join(" ")

  const beater = held && !onEdge.has(key(held)) ? beatenBy(held, points) : null

  const ticks = useMemo(() => {
    const out: number[] = []
    for (let e = Math.ceil(bounds.x0); e <= Math.floor(bounds.x1); e++) out.push(10 ** e)
    return out
  }, [bounds])

  return (
    <div className="graph">
      <div className="graph-toggles">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            className={`toggle${on.includes(p.id) ? " on" : ""}`}
            style={{ ["--tint" as string]: TINT[p.id] }}
            onClick={() =>
              setOn((was) => (was.includes(p.id) ? was.filter((n) => n !== p.id) : [...was, p.id]))
            }
            aria-pressed={on.includes(p.id)}
          >
            <span className="dot" />
            {p.label}
          </button>
        ))}
        <span className="graph-count">
          {points.length} plotted · <strong>{walk.length}</strong> on the dial
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="graph-svg"
        role="img"
        aria-label="Every model plotted by cost against score, with the dial along the upper-left edge"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={PAD.top} y2={H - PAD.bottom} className="grid" />
            <text x={x(t)} y={H - PAD.bottom + 24} className="tick mid">
              ${t >= 1 ? t : t.toFixed(t < 0.01 ? 3 : 2)}
            </text>
          </g>
        ))}
        {[1000, 1200, 1400, 1600, 1800].map((s) =>
          s > bounds.y0 && s < bounds.y1 ? (
            <g key={s}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(s)} y2={y(s)} className="grid" />
              <text x={PAD.left - 14} y={y(s) + 4} className="tick end">
                {s}
              </text>
            </g>
          ) : null,
        )}

        <text x={PAD.left} y={H - 12} className="axis">
          cost per task →
        </text>
        <text x={PAD.left - 14} y={PAD.top - 18} className="axis end">
          score ↑
        </text>

        {/* a human expert scores 1000 by construction. worth drawing. */}
        {bounds.y0 < 1000 && bounds.y1 > 1000 && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(1000)} y2={y(1000)} className="human" />
            <text x={W - PAD.right} y={y(1000) - 10} className="tick end quiet">
              a human expert
            </text>
          </g>
        )}

        <path d={staircase} className="edge-path" />

        {beater && held && (
          <g className="beat">
            <line x1={x(held.price)} y1={y(held.score)} x2={x(beater.price)} y2={y(beater.score)} />
          </g>
        )}

        {points.map((p) => {
          const mine = onEdge.has(key(p))
          const level = levels.get(key(p))
          const dim = held && !mine && key(held) !== key(p) && key(beater ?? held) !== key(p)
          return (
            <g
              key={key(p)}
              className={`point${mine ? " on" : ""}${dim ? " dim" : ""}`}
              style={{ ["--tint" as string]: TINT[p.provider] }}
              onMouseEnter={() => setHeld(p)}
              onMouseLeave={() => setHeld(null)}
            >
              <circle cx={x(p.price)} cy={y(p.score)} r={mine ? 11 : 4.5} className="mark" />
              {mine && level && (
                <text x={x(p.price)} y={y(p.score)} className="level">
                  {level.sort((a, b) => b - a)[0]}
                </text>
              )}
              <circle cx={x(p.price)} cy={y(p.score)} r={17} className="hit" />
            </g>
          )
        })}
      </svg>

      <div className={`graph-read${held ? " showing" : ""}`}>
        {held ? (
          <>
            <span className="graph-model">
              {held.model}
              {held.effort ? <em> {held.effort}</em> : null}
            </span>
            <span className="graph-nums">
              {held.score} elo · ${held.price} per task
            </span>
            <span className="graph-verdict">
              {onEdge.has(key(held))
                ? `level ${(levels.get(key(held)) ?? []).sort((a, b) => b - a).join(", ")}`
                : beater
                  ? `beaten by ${beater.model}${beater.effort ? ` ${beater.effort}` : ""} — better and cheaper`
                  : "off the dial"}
            </span>
          </>
        ) : (
          <span className="graph-hint">
            hover a model. turn a provider off and watch the edge move.
          </span>
        )}
      </div>
    </div>
  )
}
