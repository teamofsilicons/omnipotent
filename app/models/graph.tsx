"use client"

import { useMemo, useState } from "react"

import { beatenBy, dial, edge, plottable, type Entry, type Rung } from "../../lib/dial"
import { PROVIDERS } from "../../lib/providers"
import { dial as levelColour, on as inkOn } from "../../lib/ramp"

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

/**
 * A vendor is a shape as well as a colour.
 *
 * Eight of the eleven dial stops sit under 3:1 against this paper — yellow is
 * 1.09 — so a chart that leans on hue alone is a chart that stops working in
 * greyscale, on a photocopier, and for a reader with any of the three common
 * dichromacies. Giving each CLI its own silhouette costs one switch statement
 * and means the picture still reads with every colour set to the same ink.
 */
const SHAPE: Record<string, "circle" | "square" | "triangle"> = {
  google: "circle",
  openai: "square",
  claude: "triangle",
}

function Glyph({
  shape,
  cx,
  cy,
  r,
  className,
}: {
  shape: "circle" | "square" | "triangle"
  cx: number
  cy: number
  r: number
  className?: string
}) {
  if (shape === "square") {
    const a = r * 0.9
    return <rect x={cx - a} y={cy - a} width={a * 2} height={a * 2} rx={1} className={className} />
  }
  if (shape === "triangle") {
    const a = r * 1.16
    const pts = [0, 1, 2]
      .map((i) => {
        const t = -Math.PI / 2 + (i * 2 * Math.PI) / 3
        return `${cx + a * Math.cos(t)},${cy + a * Math.sin(t) + a * 0.14}`
      })
      .join(" ")
    return <polygon points={pts} className={className} />
  }
  return <circle cx={cx} cy={cy} r={r} className={className} />
}

export function Graph({ models }: { models: Entry[] }) {
  const [on, setOn] = useState<string[]>(PROVIDERS.map((p) => p.id))
  const [held, setHeld] = useState<Rung | null>(null)
  /** where the keyboard is, walking the edge best-first */
  const [cursor, setCursor] = useState(-1)

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
        : `L ${x(walk[i - 1].price)},${y(p.score)} L ${x(p.price)},${y(p.score)}`,
    )
    .join(" ")

  /* Markowitz shaded the attainable set before he drew its boundary. Shading
     what the frontier excludes is what makes the frontier legible without a
     legend — and it turns "everything inside it is a model you would never
     rationally choose" from a sentence into a region. */
  const beaten =
    walk.length > 1
      ? `${staircase} L ${x(walk[walk.length - 1].price)},${H - PAD.bottom}` +
        ` L ${W - PAD.right},${H - PAD.bottom} L ${W - PAD.right},${y(walk[0].score)} Z`
      : ""

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
            <span className={`key key-${SHAPE[p.id] ?? "circle"}`} />
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
        tabIndex={0}
        role="group"
        aria-label={`${points.length} models plotted by cost against score. ${walk.length} are on the dial. Use the arrow keys to walk it.`}
        onKeyDown={(e) => {
          const by =
            e.key === "ArrowRight" || e.key === "ArrowUp" ? -1
            : e.key === "ArrowLeft" || e.key === "ArrowDown" ? 1
            : 0
          if (!by) {
            if (e.key === "Escape") { setCursor(-1); setHeld(null) }
            return
          }
          e.preventDefault()
          const next = Math.max(0, Math.min(walk.length - 1, (cursor < 0 ? 0 : cursor) + by))
          setCursor(next)
          setHeld(walk[next] ?? null)
        }}
        onBlur={() => { setCursor(-1); setHeld(null) }}
      >
        <defs>
          <linearGradient id="graph-ramp" x1="0" y1="1" x2="0.35" y2="0">
            <stop offset="0%" stopColor="#76d4f0" />
            <stop offset="20%" stopColor="#f9f987" />
            <stop offset="60%" stopColor="#fead75" />
            <stop offset="80%" stopColor="#f15347" />
            <stop offset="100%" stopColor="#14245f" />
          </linearGradient>
        </defs>
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

        {beaten && <path d={beaten} className="beaten-region" />}
        <path d={staircase} className="edge-path" />

        {/* The two things a frontier asserts, written on the two regions it
            makes. Confidence intervals on this benchmark run about ±15 to ±27
            Elo, so the band is drawn pecked: inside it, two models are a tie
            and the cheaper one wins. */}
        {walk.length > 1 && (
          <>
            <text x={x(walk[walk.length - 1].price) + 16} y={y(walk[0].score) + 24} className="void-note">
              nothing is both better and cheaper
            </text>
            <text
              x={x(walk[Math.floor(walk.length / 2)].price) + 24}
              y={H - PAD.bottom - 22}
              className="void-note beaten"
            >
              {points.length - walk.length} models, each beaten on both counts at once
            </text>
          </>
        )}

        {beater && held && (
          <g className="beat">
            <line x1={x(held.price)} y1={y(held.score)} x2={x(beater.price)} y2={y(beater.score)} />
          </g>
        )}

        {points.map((p) => {
          const mine = onEdge.has(key(p))
          const level = levels.get(key(p))
          const top = level?.sort((a, b) => b - a)[0]
          const dim = held && !mine && key(held) !== key(p) && key(beater ?? held) !== key(p)
          const tone = mine && top !== undefined ? levelColour(top) : undefined
          return (
            <g
              key={key(p)}
              className={`point${mine ? " on" : ""}${dim ? " dim" : ""}`}
              style={{ ["--tint" as string]: TINT[p.provider], ...(tone ? { ["--tone" as string]: tone } : {}) }}
              onMouseEnter={() => setHeld(p)}
              onMouseLeave={() => setHeld(null)}
              onClick={() => setHeld((was) => (was && key(was) === key(p) ? null : p))}
            >
              {/* The ink ring is outside the mark, its radius the mark's plus
                  the stroke, so the two curves stay concentric — and the pale
                  end of the ramp is visible at all. */}
              {mine && (
                <Glyph
                  shape={SHAPE[p.provider] ?? "circle"}
                  cx={x(p.price)}
                  cy={y(p.score)}
                  r={12.5}
                  className="ring"
                />
              )}
              <Glyph
                shape={SHAPE[p.provider] ?? "circle"}
                cx={x(p.price)}
                cy={y(p.score)}
                r={mine ? 11 : 4.5}
                className="mark"
              />
              {mine && top !== undefined && (
                <text
                  x={x(p.price)}
                  y={y(p.score)}
                  className="level"
                  style={{ ["--on" as string]: inkOn(levelColour(top)) }}
                >
                  {top}
                </text>
              )}
              <circle cx={x(p.price)} cy={y(p.score)} r={17} className="hit" />
            </g>
          )
        })}
      </svg>

      <div className={`graph-read${held ? " showing" : ""}`} aria-live="polite">
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
            hover or tap a model, or walk the dial with the arrow keys. turn a provider off and
            watch the edge move.
          </span>
        )}
      </div>
    </div>
  )
}
