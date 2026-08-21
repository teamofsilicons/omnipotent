"use client"

/**
 * The field.
 *
 * There is a version of this page that opens with a screenshot and a sentence
 * about unifying your AI workflow. This is not it. Every model omni can reach
 * is one dot, placed by what it scores against what it measurably cost to
 * score it, and the eleven dots along the upper-left edge are the dial — the
 * whole product, drawn, before a word of it is claimed.
 *
 * Three things are true of this picture and none of them can be said as well:
 *
 *   the edge is a staircase, so a step down is always a real saving;
 *   most of the cloud is inside the edge, so most models are a mistake;
 *   the edge is one object with one direction of travel, which is why it is
 *   drawn in the one gradient and every other mark on the page — each of which
 *   stands for exactly one thing — is drawn in one colour.
 *
 * It plays itself, level 0 up to level 10, until a pointer arrives — then it
 * stops talking and answers questions instead. Touch a dot inside the edge and
 * it draws you a line to the model that beat it. That is the argument.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { beatenBy, dial as ladderOf, edge, type Rung } from "../lib/dial"
import { dial as levelColour, on as inkOn } from "../lib/ramp"

const key = (r: Rung) => `${r.provider}/${r.model}/${r.effort}`

/** The staircase, once, so the stroke and the shaded region cannot disagree. */
function stairFrom(
  walk: Rung[],
  atX: (price: number) => number,
  atY: (score: number) => number,
): string {
  return walk
    .map((p, i) =>
      i === 0
        ? `M ${atX(p.price)},${atY(p.score)}`
        : `L ${atX(walk[i - 1].price)},${atY(p.score)} L ${atX(p.price)},${atY(p.score)}`,
    )
    .join(" ")
}

/** How close the pointer has to be, in px, before a dot answers to it. */
const REACH = 120

type Placed = Rung & { x: number; y: number; level: number | null }

export function Field({ points }: { points: Rung[] }) {
  const hull = useRef<HTMLDivElement>(null)
  const plot = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 1180, h: 720 })
  const [held, setHeld] = useState<Rung | null>(null)
  const [walking, setWalking] = useState<number | null>(0)
  const [near, setNear] = useState(false)
  /** set once somebody drives it themselves; stops the demonstration for good */
  const [pinned, setPinned] = useState(false)
  const marks = useRef(new Map<string, SVGCircleElement>())
  const cursor = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef(0)

  /* Measure the plot, never the thing the plot is inside: the svg carries an
     intrinsic aspect ratio from its own viewBox, so measuring its parent makes
     each frame taller than the last, forever. */
  useEffect(() => {
    const el = plot.current
    if (!el) return
    const watch = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setBox({ w: Math.max(320, Math.round(r.width)), h: Math.max(300, Math.round(r.height)) })
    })
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  const wide = box.w > 760
  const pad = wide
    ? { top: 64, right: 54, bottom: 62, left: 62 }
    : { top: 34, right: 26, bottom: 52, left: 40 }

  const walk = useMemo(() => edge(points), [points])
  const rungs = useMemo(() => ladderOf(walk), [walk])

  /** Which levels each edge point holds. An edge shorter than eleven doubles up. */
  const levelsAt = useMemo(() => {
    const at = new Map<string, number[]>()
    for (const [level, rung] of Object.entries(rungs)) {
      at.set(key(rung), [...(at.get(key(rung)) ?? []), Number(level)])
    }
    return at
  }, [rungs])

  const placed = useMemo<Placed[]>(() => {
    if (!points.length) return []
    const prices = points.map((p) => Math.log10(p.price))
    const scores = points.map((p) => p.score)
    const x0 = Math.min(...prices) - 0.18
    const x1 = Math.max(...prices) + 0.18
    const y0 = Math.min(...scores) - 55
    const y1 = Math.max(...scores) + 65
    const w = box.w - pad.left - pad.right
    const h = box.h - pad.top - pad.bottom
    return points.map((p) => ({
      ...p,
      x: pad.left + ((Math.log10(p.price) - x0) / (x1 - x0)) * w,
      y: pad.top + h - ((p.score - y0) / (y1 - y0)) * h,
      level: (levelsAt.get(key(p)) ?? []).sort((a, b) => b - a)[0] ?? null,
    }))
  }, [points, box, pad.left, pad.right, pad.top, pad.bottom, levelsAt])

  const bounds = useMemo(() => {
    if (!points.length) return { x0: -2, x1: 1, y0: 900, y1: 1700 }
    const prices = points.map((p) => Math.log10(p.price))
    const scores = points.map((p) => p.score)
    return {
      x0: Math.min(...prices) - 0.18,
      x1: Math.max(...prices) + 0.18,
      y0: Math.min(...scores) - 55,
      y1: Math.max(...scores) + 65,
    }
  }, [points])

  const atX = useCallback(
    (price: number) =>
      pad.left +
      ((Math.log10(price) - bounds.x0) / (bounds.x1 - bounds.x0)) * (box.w - pad.left - pad.right),
    [bounds, box.w, pad.left, pad.right],
  )
  const atY = useCallback(
    (score: number) =>
      pad.top +
      (box.h - pad.top - pad.bottom) -
      ((score - bounds.y0) / (bounds.y1 - bounds.y0)) * (box.h - pad.top - pad.bottom),
    [bounds, box.h, pad.top, pad.bottom],
  )

  const onEdge = useMemo(() => new Set(walk.map(key)), [walk])
  const inside = useMemo(() => placed.filter((p) => !onEdge.has(key(p))), [placed, onEdge])
  const rim = useMemo(() => placed.filter((p) => onEdge.has(key(p))), [placed, onEdge])

  /* Markowitz drew the attainable set as a filled region in 1952 and only then
     drew its boundary, which is the right way round: the frontier needs no
     label if the thing it excludes is visibly shaded. So the dominated half of
     this cloud gets a flat tint, and the empty half above the staircase gets a
     sentence, because the region where nothing can exist is the half people
     remember. */
  const dominated = useMemo(() => {
    if (walk.length < 2) return ""
    const bottom = box.h - pad.bottom
    const right = box.w - pad.right
    return (
      stairFrom(walk, atX, atY) +
      ` L ${atX(walk[walk.length - 1].price)},${bottom}` +
      ` L ${right},${bottom}` +
      ` L ${right},${atY(walk[0].score)} Z`
    )
  }, [walk, atX, atY, box.h, box.w, pad.bottom, pad.right])

  /* The staircase, as the dial actually descends: give up score at the same
     money, then give up money. A diagonal would imply a trade nobody is
     offering, and turning the corner the other way would draw the step through
     the one region a frontier exists to say is empty — better AND cheaper than
     everything. So: down at the old price, then left at the new score. */
  const stair = useMemo(() => stairFrom(walk, atX, atY), [walk, atX, atY])

  /* It plays itself until somebody arrives. A hero that only performs on hover
     performs for nobody on a phone. */
  useEffect(() => {
    if (near || held || pinned) return
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWalking(10)
      return
    }
    const t = setTimeout(() => setWalking((n) => (n === null ? 0 : (n + 1) % 11)), walking === 10 ? 2100 : 820)
    return () => clearTimeout(t)
  }, [walking, near, held, pinned])

  /* Proximity is written straight to the DOM. Forty dots at sixty frames is
     nothing, but forty dots through React state on every pointer move is a
     re-render per mouse twitch for no gain. */
  useEffect(() => {
    if (!plot.current) return

    const tick = () => {
      const at = cursor.current
      let closest: Placed | null = null
      let best = REACH
      for (const p of placed) {
        const node = marks.current.get(key(p))
        if (!node) continue
        if (!at) {
          node.style.setProperty("--pull", "0")
          continue
        }
        const d = Math.hypot(p.x - at.x, p.y - at.y)
        node.style.setProperty("--pull", String(Math.max(0, 1 - d / REACH) ** 1.6))
        if (d < best) {
          best = d
          closest = p
        }
      }
      setHeld((was) => (key(was ?? ({} as Rung)) === key(closest ?? ({} as Rung)) ? was : closest))
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [placed])

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = plot.current?.getBoundingClientRect()
    if (!r) return
    cursor.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    setNear(true)
  }

  const leave = () => {
    cursor.current = null
    setNear(false)
    setHeld(null)
  }

  const lit = held ?? (walking === null ? null : rungs[String(walking)] ?? null)
  const litKey = lit ? key(lit) : null
  const beater = lit && !onEdge.has(litKey!) ? beatenBy(lit, points) : null
  const litLevels = lit ? (levelsAt.get(litKey!) ?? []).sort((a, b) => b - a) : []

  const decades = useMemo(() => {
    const out: number[] = []
    for (let e = Math.ceil(bounds.x0); e <= Math.floor(bounds.x1); e++) out.push(10 ** e)
    return out
  }, [bounds])

  const money = (n: number) => (n >= 1 ? `$${n}` : `$${n.toFixed(n < 0.01 ? 3 : 2)}`)

  return (
    <div className="field" ref={hull} onPointerMove={track} onPointerLeave={leave}>
      <div
        className="field-plot"
        ref={plot}
        tabIndex={0}
        role="group"
        aria-label="the dial, eleven levels. use the arrow keys to walk it."
        onKeyDown={(e) => {
          const step =
            e.key === "ArrowRight" || e.key === "ArrowUp" ? 1
            : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1
            : 0
          if (!step) {
            if (e.key === "Home") { setPinned(true); setWalking(0) }
            if (e.key === "End") { setPinned(true); setWalking(10) }
            return
          }
          e.preventDefault()
          setPinned(true)
          setHeld(null)
          setWalking((n) => Math.max(0, Math.min(10, (n ?? 0) + step)))
        }}
      >
      <svg
        className="field-svg"
        viewBox={`0 0 ${box.w} ${box.h}`}
        role="img"
        aria-label={`${points.length} models omni can run, plotted by cost against score. ${walk.length} of them are on the dial.`}
      >
        <defs>
          {/* the frontier is the one thing here made by three vendors at once,
              so it is the one thing drawn in the whole gradient */}
          <linearGradient id="ramp" x1="0" y1="1" x2="0.35" y2="0">
            <stop offset="0%" stopColor="#76d4f0" />
            <stop offset="20%" stopColor="#f9f987" />
            <stop offset="60%" stopColor="#fead75" />
            <stop offset="80%" stopColor="#f15347" />
            <stop offset="100%" stopColor="#14245f" />
          </linearGradient>
          {/* The sentence pushes the data aside rather than sitting on top of
              it. The headline lives in the lower right because that corner of
              this particular graph is dear and weak, and nothing is ever both
              — so the type is standing in the one place the data cannot go.
              Stacked on a phone the two never overlap, so the hole closes. */}
          <radialGradient id="room" cx={wide ? "0.73" : "0.5"} cy={wide ? "0.79" : "1.6"} r={wide ? "0.32" : "0.02"}>
            <stop offset="0%" stopColor="#000" />
            <stop offset="52%" stopColor="#3a3a3a" />
            <stop offset="100%" stopColor="#fff" />
          </radialGradient>
          <mask id="make-room">
            <rect width={box.w} height={box.h} fill="url(#room)" />
          </mask>
        </defs>

        {decades.map((t) => (
          <g key={t}>
            <line
              x1={atX(t)}
              x2={atX(t)}
              y1={pad.top - 14}
              y2={box.h - pad.bottom}
              className="field-grid"
            />
            <text x={atX(t)} y={pad.top - 22} className="field-tick mid">
              {money(t)}
            </text>
          </g>
        ))}

        {/* anchored so a human expert scores 1000. the most quotable line on
            the chart, and it costs one dashed rule */}
        {bounds.y0 < 1000 && bounds.y1 > 1000 && (
          <g>
            {/* stopped short of the headline: a rule that runs under a
                sentence is a rule arguing with it */}
            <line
              x1={pad.left - 18}
              x2={wide ? box.w * 0.58 : box.w - pad.right}
              y1={atY(1000)}
              y2={atY(1000)}
              className="field-human"
            />
            <text x={pad.left - 14} y={atY(1000) - 9} className="field-tick">
              1000 — a human expert
            </text>
          </g>
        )}

        {wide && (
          <text x={pad.left - 18} y={pad.top - 22} className="field-axis">
            cost per task
          </text>
        )}
        <text
          className="field-axis"
          transform={`translate(${pad.left - 20} ${pad.top + (box.h - pad.top - pad.bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          gdpval elo →
        </text>

        <g mask="url(#make-room)">
          {inside.map((p) => (
            <circle
              key={key(p)}
              ref={(node) => {
                if (node) marks.current.set(key(p), node)
                else marks.current.delete(key(p))
              }}
              cx={p.x}
              cy={p.y}
              r={3.4}
              className={`field-dot${litKey === key(p) ? " lit" : ""}${
                beater && key(beater) === key(p) ? " beater" : ""
              }${lit && litKey !== key(p) && !(beater && key(beater) === key(p)) ? " hush" : ""}`}
            />
          ))}
        </g>

        {dominated && <path d={dominated} className="field-beaten" />}
        <path d={stair} className="field-stair" />

        {/* Named, because a frontier is a claim about what cannot exist. */}
        {walk.length > 1 && wide && (
          <>
            <text
              x={atX(walk[walk.length - 1].price) + 18}
              y={atY(walk[0].score) + 26}
              className="field-void"
            >
              nothing is both better and cheaper
            </text>
            <text
              x={atX(walk[walk.length - 1].price) + 26}
              y={box.h - pad.bottom - 16}
              className="field-void beaten"
            >
              {points.length - walk.length} models live in here, every one of them beaten on both counts
            </text>
          </>
        )}

        {beater && lit && (
          <line
            x1={atX(lit.price)}
            y1={atY(lit.score)}
            x2={atX(beater.price)}
            y2={atY(beater.score)}
            className="field-beat"
          />
        )}

        {rim.map((p) => {
          const colour = levelColour(p.level ?? 0)
          const isLit = litKey === key(p)
          return (
            <g
              key={key(p)}
              className={`field-rung${isLit ? " lit" : ""}${lit && !isLit ? " hush" : ""}`}
            >
              <circle
                ref={(node) => {
                  if (node) marks.current.set(key(p), node)
                  else marks.current.delete(key(p))
                }}
                cx={p.x}
                cy={p.y}
                r={wide ? 11 : 9}
                className="field-mark"
                style={{ ["--tone" as string]: colour }}
              />
              <text
                x={p.x}
                y={p.y}
                className="field-level"
                style={{ ["--tone" as string]: inkOn(colour) }}
              >
                {p.level}
              </text>
            </g>
          )
        })}
      </svg>
      </div>

      {/* Announced only when a person is driving it. With the demonstration
          running this is eleven announcements a cycle, indefinitely, which is
          not information — it is a stuck tap. */}
      <p className="field-read num" aria-live={held || pinned ? "polite" : "off"}>
        {lit ? (
          <>
            {litLevels.length > 0 && (
              <span className="field-badge" style={{ ["--tone" as string]: levelColour(litLevels[0]), ["--on" as string]: inkOn(levelColour(litLevels[0])) }}>
                {litLevels.length > 1 ? `levels ${litLevels.join("–")}` : `level ${litLevels[0]}`}
              </span>
            )}
            <span className="field-name">
              {lit.model}
              {lit.effort ? <em> {lit.effort}</em> : null}
            </span>
            <span className="field-nums">
              {Math.round(lit.score)} elo · {money(lit.price)} a task
            </span>
            {beater ? (
              <span className="field-verdict">
                beaten by {beater.model}
                {beater.effort ? ` ${beater.effort}` : ""} — better <em>and</em> cheaper
              </span>
            ) : (
              <span className="field-verdict on">on the dial</span>
            )}
          </>
        ) : (
          <span className="field-hint">
            {points.length} models · <strong>{walk.length}</strong> on the dial ·{" "}
            {points.length - walk.length} you would never rationally choose
          </span>
        )}
      </p>
    </div>
  )
}
