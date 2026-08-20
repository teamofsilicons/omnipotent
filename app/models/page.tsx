import { Graph } from "./graph"
import { beatenBy, dialFor, edge, plottable, unusable } from "../../lib/dial"
import { EDIT, graph, VIEW } from "../../lib/graph"

export const metadata = {
  title: "models — silicon omni",
  description: "Every model omni can reach, plotted by what it scores against what it costs.",
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

  return (
    <div className="shell rails">
      <section style={{ paddingTop: "4rem" }}>
        <h1 className="rise">The graph.</h1>
        <p className="lede column rise" style={{ ["--i" as string]: 1, marginTop: "1.4rem" }}>
          {points.length} models omni can actually run, each plotted by its GDPval-AA v2 Elo
          against the dollars Artificial Analysis measured it cost to earn that score. The dial is
          the upper-left edge, and everything inside it is a model you would never rationally
          choose.
        </p>

        <Graph models={models} />

        <div className="column" style={{ marginTop: "2.4rem" }}>
          <p>
            Turn a provider off. The edge moves, and models that were shadowed by another
            vendor&apos;s step straight back onto the dial — which is why the same number means
            something different to somebody signed into fewer things than you.
          </p>
          <p>
            Score is an Elo from blind pairwise judging of finished work, anchored so that{" "}
            <mark>a human expert scores 1000</mark>. Confidence intervals run about ±15 to ±27, so
            gaps under roughly 35 Elo are not separable — two models that close are a tie, and the
            cheaper one wins.
          </p>
        </div>
      </section>

      <section className="stitched enter">
        <div className="rule"><span>the dial, all three providers</span></div>
        <table className="rows" style={{ maxWidth: "46rem" }}>
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
              return (
                <tr key={level}>
                  <td className="n">{level}</td>
                  <td>{rung.model}</td>
                  <td className="n">{rung.effort || "—"}</td>
                  <td className="n">{rung.score}</td>
                  <td className="n">{rung.price}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="column quiet" style={{ fontSize: 14, marginTop: "1.2rem" }}>
          Levels share a rung where the edge is shorter than eleven points. That is the dial being
          honest: there is nothing in between worth picking.
        </p>
      </section>

      <section className="stitched enter">
        <div className="rule"><span>what fell off, and to whom</span></div>
        <p className="column">
          Every model here is real and usable. It simply loses to something that is better{" "}
          <em>and</em> cheaper at the same time.
        </p>
        <table className="rows" style={{ maxWidth: "52rem", marginTop: "1.6rem" }}>
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
      </section>

      {skipped.length > 0 && (
        <section className="stitched enter">
          <div className="rule"><span>on the list, off the graph</span></div>
          <p className="column">
            Recorded but not plotted, because something needed is missing rather than because they
            lost.
          </p>
          <table className="rows" style={{ maxWidth: "46rem", marginTop: "1.6rem" }}>
            <tbody>
              {skipped.map((s) => (
                <tr key={`${s.entry.provider}/${s.entry.model}/${s.entry.effort}`}>
                  <td>{s.entry.model}</td>
                  <td className="quiet">{s.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="stitched enter">
        <div className="rule"><span>where this comes from</span></div>
        <div className="column">
          <p>
            The list lives in one file in a public repo. Editing{" "}
            <a className="link" href={VIEW}>
              models-gdpval.json
            </a>{" "}
            and committing is the whole publishing flow — no database, no login, no release of the
            library, no redeploy. This page reads it at request time.{" "}
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
              add a model
            </a>
            <a className="btn ghost" href="/intelligence.json">
              the dial, as json
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
