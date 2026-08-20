/**
 * Turning a pile of models into a 0-10 dial.
 *
 * Every model is a point on a graph: how good it is, and what it costs. Only
 * the left edge of that graph becomes a dial — a model earns a level if nothing
 * else is both better and cheaper. Level 10 is the top of the edge, and the
 * walk goes down and to the left, so a step down is always a real saving and
 * never a sideways move.
 *
 * This is the only place the dial is worked out. The library does none of it:
 * it asks for a finished map and hands the strings to a CLI.
 */

import { provider } from "./providers"

export interface Rung {
  provider: string
  model: string
  effort: string
  score: number
  price: number
}

/** A row of the database. Without both numbers it cannot be plotted, which is
 *  allowed on purpose: you can record a model before anyone has benchmarked it. */
export interface Entry {
  provider: string
  model: string
  effort?: string
  score?: number | null
  price?: number | null
}

export const LEVELS = 11

/** Is `one` at least as good as `other` on both axes, and better on one? */
function beats(one: Rung, other: Rung): boolean {
  return (
    one.score >= other.score &&
    one.price <= other.price &&
    (one.score > other.score || one.price < other.price)
  )
}

/**
 * A field that has to be a real number.
 *
 * Both ways of leaving one out have to be caught, and neither is obvious:
 * `Number(undefined)` is NaN, but `Number(null)` is 0 — which would make an
 * unbenchmarked model free, and free wins the bottom of the dial outright.
 */
function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * The rows that can actually be put on the graph and then run.
 *
 * The database invites leaving a score out, so a row missing one must not slip
 * through and land on the dial. The effort has to be one the CLI accepts too,
 * or the rung would be unusable the moment omni tried to run it.
 */
export function plottable(entries: Entry[]): Rung[] {
  const out: Rung[] = []
  for (const entry of entries) {
    const known = provider(entry.provider)
    const effort = entry.effort ?? ""
    if (!known || !known.efforts.includes(effort)) continue
    const score = number(entry.score)
    const price = number(entry.price)
    if (score === null || price === null) continue
    out.push({ provider: known.id, model: entry.model, effort, score, price })
  }
  return out
}

/** Rows the database holds but the dial cannot use, and why. */
export function unusable(entries: Entry[]): { entry: Entry; why: string }[] {
  const out: { entry: Entry; why: string }[] = []
  for (const entry of entries) {
    const known = provider(entry.provider)
    const effort = entry.effort ?? ""
    if (!known) out.push({ entry, why: `no such provider "${entry.provider}"` })
    else if (!known.efforts.includes(effort))
      out.push({ entry, why: `${known.label} does not take the effort "${effort}"` })
    else if (number(entry.score) === null || number(entry.price) === null)
      out.push({ entry, why: "not benchmarked yet" })
  }
  return out
}

/** The left edge of the graph, best first. */
export function edge(points: Rung[]): Rung[] {
  const kept = points.filter((p) => !points.some((q) => beats(q, p)))
  const seen = new Set<string>()
  const out: Rung[] = []
  for (const point of [...kept].sort((a, b) => b.score - a.score || a.price - b.price)) {
    const spot = `${point.score}/${point.price}`
    if (!seen.has(spot)) {
      seen.add(spot) // two models on one spot are one point
      out.push(point)
    }
  }
  return out
}

/** Spread the edge over levels 0-10, 10 at the top. */
export function dial(points: Rung[]): Record<string, Rung> {
  if (!points.length) return {}
  const steps = points.length - 1
  const out: Record<string, Rung> = {}
  for (let level = 0; level < LEVELS; level++) {
    out[String(level)] = points[Math.round(((LEVELS - 1 - level) * steps) / (LEVELS - 1))]
  }
  return out
}

/** The dial for one set of providers. */
export function dialFor(entries: Entry[], providers: string[]): Record<string, Rung> {
  return dial(edge(plottable(entries).filter((p) => providers.includes(p.provider))))
}
