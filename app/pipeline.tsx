/**
 * The whole publishing flow, which is a commit.
 *
 * Drawn in the gradient rather than in one colour, because it is the one thing
 * on this page that is five things cooperating: a text file in a public repo, a
 * CDN, this website, a cache on your laptop, and a command line. No database,
 * no login, no release of the library, no redeploy.
 */

const STOPS = [
  { at: "models-gdpval.json", what: "one file in a public repo. edit it, commit it. that is the publish" },
  { at: "raw.githubusercontent", what: "read at request time. held for one minute" },
  { at: "/intelligence.json", what: "every combination of providers, answered in one response" },
  { at: "~/.omni/cache", what: "kept an hour, then re-fetched. a stale dial still runs offline" },
  { at: "claude -p --model … --effort max", what: "two strings, handed over untouched" },
]

export function Pipeline() {
  return (
    <ol className="pipe">
      {STOPS.map((stop) => (
        <li key={stop.at} className="pipe-stop">
          <span className="pipe-dot" aria-hidden />
          <code className="pipe-at">{stop.at}</code>
          <span className="pipe-what num">{stop.what}</span>
        </li>
      ))}
    </ol>
  )
}
