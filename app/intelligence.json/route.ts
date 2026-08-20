/**
 * The dial. This is the URL the library reads.
 *
 *   GET https://omni.teamofsilicons.com/intelligence.json
 *   GET https://omni.teamofsilicons.com/intelligence.json?providers=claude+google
 *
 * Every combination of providers is answered at once, keyed the way omni asks
 * for them, so one fetch serves an install whatever it is signed into.
 *
 * `model` and `effort` are rendered exactly as the CLI takes them, and nothing
 * reaches this output unless the effort is one that provider actually accepts.
 * A rung here is a command that runs.
 */

import { NextRequest, NextResponse } from "next/server"

import { dialFor, plottable, unusable } from "../../lib/dial"
import { graph, VIEW } from "../../lib/graph"
import { combinations, invocation, key } from "../../lib/providers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get("providers") ?? ""
  const providers = asked.split(/[+,\s]+/).filter(Boolean)
  const { models, source, caveats, fresh } = await graph()

  const ladders: Record<string, Record<string, unknown>> = {}
  for (const combo of combinations()) {
    ladders[key(combo.split("+"))] = dialFor(models, combo.split("+"))
  }

  return NextResponse.json(
    {
      providers: providers.length ? key(providers) : null,
      ladder: providers.length ? dialFor(models, providers) : null,
      ladders,
      // the same rungs written out as the command each one is, so there is no
      // question about how a name is meant to be used
      runs: Object.fromEntries(
        Object.entries(ladders["claude+google+openai"] ?? {}).map(([level, rung]) => [
          level,
          invocation(rung as { provider: string; model: string; effort: string }),
        ]),
      ),
      plotted: plottable(models).length,
      skipped: unusable(models).map(({ entry, why }) => ({ ...entry, why })),
      source: { ...source, database: VIEW },
      caveats,
      fresh,
    },
    { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=3600" } },
  )
}
