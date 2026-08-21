import { ArrowSquareOut, PencilSimple } from "@phosphor-icons/react/dist/ssr"

import { Graph } from "./graph"
import { Chapter } from "../chapter"
import { Dither } from "../dither"
import { Mark } from "../mark"
import { beatenBy, dialFor, edge, plottable, unusable } from "../../lib/dial"
import { EDIT, graph, VIEW } from "../../lib/graph"
import { dial as levelColour, on as inkOn } from "../../lib/ramp"
import { Logo, type Vendor } from "../logos"

export const metadata = {
  title: "models — silicon omni",
  description: "Every model omni can reach, plotted by what it scores against what it was measured to cost.",
}

export default async function Models() {
  const { models, source, caveats, fresh } = await graph()
  const points = plottable(models)
  const walk = edge(points)
  const rungs = dialFor(models, ["claude", "openai", "google"])
  const skipped = unusable(models)
  const onEdge = new Set(walk.map((r) => `${r.provider}/${r.model}/${r.effort}`))

  const dominated = points
    .filter((p) => !onEdge.has(`${p.provider}/${p.model}/${p.effort}`))
    .map((p) => ({ p, by: beatenBy(p, points) }))
    .sort((a, b) => b.p.score - a.p.score)

  const OF = 4

  return (
    <div className="shell rails">
      <section style={{ paddingTop: "4rem", position: "relative" }}>
        <Dither shape="radial" cells={200} />
        <h1 className="rise">The graph.</h1>
        <p className="lede column rise" style={{ ["--i" as string]: 1, marginTop: "1.4rem" }}>
          {points.length} models omni can actually run, each plotted by its GDPval-AA v2 Elo
          against the dollars Artificial Analysis measured it took to earn that score. The dial is
          the upper-left edge. Everything inside the edge works, and none of it is a model you
          would rationally choose.
        </p>

        <Graph models={models} />

        <div className="column" style={{ marginTop: "2.4rem" }}>
          <p>
            Turn a provider off. The edge moves, and models another vendor was shadowing step
            straight back onto the dial. This is why the same number means something different to
            somebody signed into fewer things than you. There is one dial per set of providers, and
            not one dial for everybody.
          </p>
          <p>
            Score is an Elo from blind pairwise judging of finished work, anchored so that{" "}
            <mark>a human expert scores 1000</mark>. Confidence intervals run about ±15 to ±27.
            Gaps under roughly 35 Elo are therefore not separable: two models that close are a tie,
            and the cheaper one wins the rung.
          </p>
        </div>
      </section>

      <Chapter
        n={1}
        of={OF}
        name="the dial"
        title="Eleven rungs. Whoever wins them wins them."
        argue={
          <p className="set">
            This is the dial with all three providers signed in. Where the edge is shorter than
            eleven points, levels share a rung — the dial declining to invent a step, because there
            is nothing in between worth picking.
          </p>
        }
      >
        <table className="rows wide" style={{ maxWidth: "46rem" }}>
          <thead>
            <tr>
              <th style={{ width: "3rem" }}>level</th>
              <th>model</th>
              <th style={{ width: "5rem" }}>effort</th>
              <th style={{ width: "5rem" }}>elo</th>
              <th style={{ width: "6rem" }}>$/task</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 11 }, (_, i) => 10 - i).map((level) => {
              const rung = rungs[String(level)]
              if (!rung) return null
              const colour = levelColour(level)
              return (
                <tr key={level}>
                  <td>
                    <span
                      className="lvl num"
                      style={{ ["--tone" as string]: colour, ["--on" as string]: inkOn(colour) }}
                    >
                      {level}
                    </span>
                  </td>
                  <td>
                    <span className="step-who" style={{ ["--tone" as string]: `var(--${rung.provider}-ink)` }}>
                      <Logo of={rung.provider as Vendor} size={11} />
                    </span>
                    {rung.model}
                  </td>
                  <td className="n">{rung.effort || "—"}</td>
                  <td className="n">{rung.score}</td>
                  <td className="n">{rung.price}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Chapter>

      <Chapter
        n={2}
        of={OF}
        name="what fell off"
        title="Every model here works. Every one of them is beaten."
        argue={
          <p className="set">
            Not obsolete, and not bad. Each one loses to something better{" "}
            <em>and</em> cheaper at the same moment, which is the only test the dial applies.
          </p>
        }
      >
        <table className="rows wide" style={{ maxWidth: "52rem" }}>
          <thead>
            <tr>
              <th>model</th>
              <th style={{ width: "5rem" }}>elo</th>
              <th style={{ width: "6rem" }}>$/task</th>
              <th>beaten by</th>
            </tr>
          </thead>
          <tbody>
            {dominated.map(({ p, by }) => (
              <tr key={`${p.provider}/${p.model}/${p.effort}`}>
                <td>
                  {p.model} <span className="quiet">{p.effort}</span>
                </td>
                <td className="n">{p.score}</td>
                <td className="n">{p.price}</td>
                <td className="quiet">
                  {by ? `${by.model} ${by.effort}`.trim() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Chapter>

      {skipped.length > 0 && (
        <Chapter
          n={3}
          of={OF}
          name="off the graph"
          title="Recorded, and deliberately not plotted."
          argue={
            <p className="set">
              These are here because a number is missing, not because they lost. A model GDPval has
              not scored or costed is kept on the list and left off the dial, rather than estimated
              onto it.
            </p>
          }
        >
          <table className="rows" style={{ maxWidth: "46rem" }}>
            <tbody>
              {skipped.map((s) => (
                <tr key={`${s.entry.provider}/${s.entry.model}/${s.entry.effort}`}>
                  <td>{s.entry.model}</td>
                  <td className="quiet">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Chapter>
      )}

      <Chapter
        n={4}
        of={OF}
        name="the source"
        title="The whole database is one file."
        argue={
          <p className="set">
            Editing it and committing is the whole publishing flow. No database, no login, no
            release of the library, no redeploy. Git does what a table would have done: history,
            blame, review, rollback — and it also means somebody&apos;s commit is your routing
            table.
          </p>
        }
      >
        <div className="column">
          <p>
            Edit{" "}
            <a className="link" href={VIEW}>
              models-gdpval.json
            </a>{" "}
            and commit. This page reads it at request time, so the change is live on the next
            request and the library picks it up within the hour.{" "}
            {fresh ? null : <strong>Right now GitHub is unreachable, so you are seeing a copy compiled into this deployment.</strong>}
          </p>
          <p className="quiet" style={{ fontSize: 14 }}>
            {source.score}
          </p>
          <ul className="caveats">
            {caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: "1.6rem" }}>
            <a className="btn solid" href={EDIT}>
              <PencilSimple size={14} weight="bold" />
              add a model
            </a>
            <a className="btn ghost" href="/intelligence.json">
              the dial, as json
              <ArrowSquareOut size={14} weight="bold" />
            </a>
          </div>
        </div>
      </Chapter>

      <div className="breath"><Mark h={16} /></div>
    </div>
  )
}
