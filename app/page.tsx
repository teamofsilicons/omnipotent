import { ArrowRight, ChartScatter, Prohibit } from "@phosphor-icons/react/dist/ssr"

import { Boundary } from "./boundary"
import { Chapter, Plate } from "./chapter"
import { Contents } from "./contents"
import { Copy } from "./copy"
import { Dialer } from "./dialer"
import { Dither } from "./dither"
import { Field } from "./field"
import { Grammars } from "./grammars"
import { Mark } from "./mark"
import { Pipeline } from "./pipeline"
import { Tape } from "./tape"
import { dialFor, edge, plottable } from "../lib/dial"
import { graph } from "../lib/graph"
import { dial as levelColour, on as inkOn } from "../lib/ramp"

const QUICKSTART = `from omni import Inference, Event

chat = Inference.load_or_create_session("nightly-triage")
chat.intelligence(7)

@chat.on_event
def handle(event):
    if event.type == Event.TEXT:
        print(event.text)

chat.start()
chat.send("what changed in this repo today?")`

const CHAPTERS = 8

export default async function Landing() {
  const { models } = await graph()
  const points = plottable(models)
  const walk = edge(points)
  const rungs = dialFor(models, ["claude", "openai", "google"])
  const top = rungs["10"]
  const floor = rungs["0"]
  const ratio = top && floor ? Math.round(top.price / floor.price) : 0
  const span = top && floor ? Math.log10(top.price) - Math.log10(floor.price) : 1

  /* The two rungs the log figure runs on, read out of the dial rather than
     typed into the figure. Take the top rung, then the highest rung below it
     that a different vendor holds — which is the cheapest honest example of a
     switch, and it cannot contradict the ladder because it comes from it. */
  const held = (level: number) => rungs[String(level)]
  const highLevel = 10
  const lowLevel = (() => {
    for (let l = highLevel - 1; l >= 0; l--) {
      if (held(l) && held(l).provider !== held(highLevel)?.provider) return l
    }
    return 0
  })()
  const asHeld = (level: number) => {
    const r = held(level)
    return { level, provider: r.provider, model: r.model, effort: r.effort }
  }

  /* What the dial actually looks like today, counted rather than asserted. */
  const distinct = new Set(points.map((p) => p.model)).size
  const byVendor = walk.reduce<Record<string, number>>((all, r) => {
    all[r.provider] = (all[r.provider] ?? 0) + 1
    return all
  }, {})
  const onDial = Object.entries(byVendor).sort((a, b) => b[1] - a[1])
  const missing = ["claude", "openai", "google"].filter((p) => !byVendor[p])

  /* Numbers where a landing page would put adjectives. The first two are
     counted out of the database at request time, so they cannot go stale
     against the graph directly above them. */
  const TALLY: [string, string][] = [
    [String(points.length), "models it can run, every one of them measured"],
    [String(walk.length), "survive the test: nothing beats them on both at once"],
    ["3", "agentic CLIs, driven from one Python object"],
    ["0", "dependencies, and no model name in the wheel"],
    ["1", "file holds the conversation, whoever answers it"],
  ]

  return (
    <>
      <section className="hero">
        <Dither shape="radial" cells={210} />
        <div className="hero-plot">
          <Field points={points} />
        </div>
        <div className="hero-say">
          <h1 className="rise">
            The conversation is yours.
            <br />
            The vendor is a&nbsp;setting.
          </h1>
          <p className="lede rise" style={{ ["--i" as string]: 1 }}>
            silicon omni drives Claude Code, Codex and Antigravity from one Python object, on the
            subscriptions you already pay for. Move the dial from 7 to 4 and the same chat finishes
            on another company&apos;s model, with everything said before it already in its head.
          </p>
          <p className="rise quiet" style={{ ["--i" as string]: 2, marginTop: ".95rem", fontSize: 13.5, lineHeight: 1.55 }}>
            It holds no API key. It signs in as you, on consumer plans, under terms that were not
            written with a Python library in mind.
          </p>
          <div className="row rise" style={{ ["--i" as string]: 3, marginTop: "1.5rem" }}>
            <code className="install">pip install silicon-omni</code>
            <Copy text="pip install silicon-omni" />
            <a className="btn ghost" href="/docs">
              documentation
              <ArrowRight size={14} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      <div className="shell rails">
        <div className="tally enter">
          {TALLY.map(([n, what]) => (
            <div key={what}>
              <b>{n}</b>
              <span>{what}</span>
            </div>
          ))}
        </div>

        {/* The admission, and it goes above everything it complicates. Lemon
            convicts the car in the headline and sells more cars for it; the
            equivalent here is that the thing which makes omni cheap is also
            the thing nobody can indemnify you against. */}
        <p className="set enter" style={{ maxWidth: "40rem", margin: "2.6rem 0 0" }}>
          This is the ugly part, and it belongs at the top. omni owns no credential of its own: it
          drives the three CLIs with the logins already sitting on your machine, which is why a run
          costs you nothing beyond the subscription you were paying for anyway. Those are consumer
          subscriptions, and consumer terms are written for a person at a keyboard rather than for a
          Python object running a nightly job. Read yours before you point this at anything that
          matters. The bill is not the risk here. The account is.
        </p>

        <Contents />

        <Chapter
          n={1}
          of={CHAPTERS}
          id="gauge"
          name="the break of gauge"
          title="Three good CLIs. None of them speak."
          argue={
            <>
              <p>
                Every vendor ships a good one, so you pick a good one, and you have also picked its
                models, its rate limits and its bad afternoons. Leaving later costs you the
                integration and the conversation you were in the middle of. The second one is the
                expensive part, and it is the one nobody quotes you for.
              </p>
              <p>
                omni takes the conversation off the vendor and keeps it in a file of its own. The
                three CLIs become engines, and you can change an engine without stopping.
              </p>
            </>
          }
        >
          {/* Brunel really did promise the Bristol company that transshipment
              would be trivial — the substance is well attested — but the exact
              wording traces only to MacDermot's History of the GWR at second
              hand, and archive.org and HathiTrust full-text are both closed to
              us. So it is paraphrased. Do not put the quotation marks back
              without reading vol. I pt. 1 p. 211 yourself. */}
          <Plate
            name="break-of-gauge"
            eager
            alt="Porters transferring freight between broad-gauge and standard-gauge trains at Gloucester, 1846"
            why={
              <>
                Seven foot and a quarter inch on one side of the shed, four foot eight and a half on
                the other, and a hundred men in between moving every crate across by hand. Brunel
                had assured the Bristol company that shifting a whole load from one company&apos;s
                waggon to the other&apos;s would need only a very simple arrangement. The engraving
                is the arrangement.
              </>
            }
          />
          <Grammars />
          <div className="spread lean">
            <p className="set">
              Three grammars, drawn here at three gauges. One takes flags and JSON lines on stdin.
              One takes JSON-RPC over a socket. One takes neither, and has to be handed its history
              folded into the front of the next message. omni holds all three open at once and tells
              each of them the same story, in the only dialect that one will accept.
            </p>
            <Plate
              name="diving-bell"
              aside
              alt="Engraving of Halley's diving bell, a man seated alone inside it on the sea floor"
              why={
                <>
                  One man, one hose, and one surface he is permitted to reach. A single vendor is
                  comfortable in exactly this way.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={2}
          of={CHAPTERS}
          id="write"
          name="what you write"
          title="One object, and no API key."
          argue={
            <>
              <p>
                No client to construct. No key to hold. No model string to keep current. omni
                offers the providers whose CLI is installed <em>and</em> logged in, and it offers
                nothing else — an uninstalled CLI is not a fallback, it is absent.
              </p>
              <p>
                The rest of the library is this same object. <code>send</code> from any thread,{" "}
                <code>intelligence</code> to change what answers, <code>stop</code> to let the
                session id go.
              </p>
            </>
          }
        >
          <div className="spread lean">
            <div className="slab">
              <pre>{QUICKSTART}</pre>
              <Copy text={QUICKSTART} />
            </div>
            <Plate
              name="movable-type"
              aside
              alt="A diagram naming every part of a single piece of metal type"
              why={
                <>
                  Ojo, cuerpo, cran, línea: an apprentice was expected to know every part by name
                  before he was allowed to set a word. Everything ever printed is this object, a few
                  thousand times over, in an order somebody chose.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={3}
          of={CHAPTERS}
          id="log"
          name="one integer"
          title="One file. One integer. It only goes up."
          argue={
            <>
              <p>
                The session is a log omni appends to and never rewrites. Every line carries a
                sequence number, and that number does not repeat across any provider the
                conversation has passed through. A second, smaller file records how far up the log
                each provider has actually been shown.
              </p>
              <p>
                That is the entire trick. Arriving somewhere new replays only what it missed.
                Coming back is cheap, because the provider resumes <em>its own</em> session and is
                told only what happened while it was away.
              </p>
            </>
          }
        >
          <Tape high={asHeld(highLevel)} low={asHeld(lowLevel)} />
          <div className="spread">
            <div>
              <p className="set">
                Watch the second column fill. On the way out, the arriving provider is handed eight
                lines it has never seen. Coming back, the first one is handed seven, and not the
                fourteen the file holds by then, because the first six are already inside its own
                session and it is resuming that rather than being told the story again. A
                conversation written down is a list of things said in the order they were said.
                Everything else on the disk is bookkeeping about that.
              </p>
              <Plate
                name="punched-tape"
                aside
                alt="A Hollerith punched card from 1895, its columns printed with the digits nought to nine"
                why={
                  <>
                    Each column is printed nought to nine, and the hole says which. A number you can
                    drop on the floor and still put back in order.
                  </>
                }
              />
            </div>
            <Plate
              name="ships-log"
              aside
              alt="A page from the log of HMS Amphitrite for 13 August 1914, hours ruled down the margin"
              why={
                <>
                  The hours are ruled down the margin before the day has happened. An hour with
                  nothing written in it is evidence; an hour that was never ruled is not.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={4}
          of={CHAPTERS}
          id="switch"
          name="the relay"
          title="Three vendors hold one conversation."
          argue={
            <p>
              A real run, transcribed. One fact each to three companies&apos; models, then the
              question put back to the first of them. Nothing was repeated to anybody.
            </p>
          }
        >
          <div className="relay">
            {[
              { who: "claude", model: "claude-sonnet-5", said: "Remember: fact one is RUBY-1.", back: "OK" },
              { who: "openai", model: "gpt-5.4-mini", said: "Remember: fact two is JADE-2.", back: "OK" },
              { who: "google", model: "gemini-3.5-flash-low", said: "Remember: fact three is ONYX-3.", back: "OK" },
            ].map((step, i) => (
              <div key={step.who} className="leg" style={{ ["--tint" as string]: `var(--${step.who})`, ["--tint-ink" as string]: `var(--${step.who}-ink)` }}>
                <div className="leg-head">
                  <span className="dot" />
                  <span className="leg-who">{step.who}</span>
                  <span className="leg-model num">{step.model}</span>
                  {i > 0 && <span className="leg-move num">switched</span>}
                </div>
                <p className="leg-said">{step.said}</p>
                <p className="leg-back">{step.back}</p>
              </div>
            ))}
            <div className="leg final" style={{ ["--tint" as string]: "var(--claude)", ["--tint-ink" as string]: "var(--claude-ink)" }}>
              <div className="leg-head">
                <span className="dot" />
                <span className="leg-who">claude</span>
                <span className="leg-model num">claude-sonnet-5</span>
                <span className="leg-move num">switched back</span>
              </div>
              <p className="leg-said">List all three facts.</p>
              <p className="leg-back big">RUBY-1, JADE-2, ONYX-3</p>
            </div>
          </div>

          <Plate
            name="switchboard"
            alt="Operators at a Bell System international switchboard, patching calls by hand"
            why={
              <>
                LONDON. PARIS. BERMUDA. BUENOS AIRES. SHIP-TO-SHORE. For eighty years the network
                between two exchanges was a woman holding both ends of it, and she is the part the
                diagrams leave out.
              </>
            }
          />

          <div className="spread lean">
            <p className="set">
              A tool the destination does not have arrives as text that reads as what happened —{" "}
              <code>[GoogleSearch: &quot;kite festivals&quot;]</code>. The structured original stays
              in the log. Go back to Gemini and it resumes Gemini&apos;s own session, in which the
              brackets never happened.
            </p>
            <Plate
              name="wax-seal"
              aside
              alt="A 1176 charter of Philip of Alsace with his wax seal hanging from a parchment tag"
              why={
                <>
                  Anyone may copy the words; nobody can copy the seal. Reasoning is the seal —
                  signed per vendor, replayable nowhere else, so omni records that the model thought
                  and throws the thought itself away.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={5}
          of={CHAPTERS}
          id="dial"
          name="the dial"
          title="You turn a dial. You do not pick a model."
          argue={
            <>
              <p>
                Every model is one point: what it scores on{" "}
                <a className="link" href="https://artificialanalysis.ai/evaluations/gdpval-aa">
                  GDPval
                </a>{" "}
                against the dollars it measurably took to score it. Only the upper-left edge of that
                cloud becomes a dial. A model earns a level when nothing else on the graph is both
                better <em>and</em> cheaper; the rest are real models that lose on both counts at
                the same time.
              </p>
              <p>
                Level 10 is the top of the edge and the walk goes down and to the left, so a step
                down is a saving you can name. Two of today&apos;s ten steps are smaller than the
                benchmark can resolve; the dial below says which, because a number that cannot tell
                you it is guessing is worse than no number.
              </p>
            </>
          }
        >
          <Dialer rungs={rungs} />

          <div className="ladder">
            {Array.from({ length: 11 }, (_, i) => 10 - i).map((level) => {
              const rung = rungs[String(level)]
              if (!rung) return null
              const colour = levelColour(level)
              const width = span ? (Math.log10(rung.price) - Math.log10(floor.price)) / span : 0
              return (
                <div key={level} className="step">
                  <span
                    className="step-level num"
                    style={{ ["--tone" as string]: colour, ["--on" as string]: inkOn(colour) }}
                  >
                    {level}
                  </span>
                  <span
                    className="step-bar"
                    style={{ width: `${Math.max(2.5, width * 100)}%`, ["--tone" as string]: colour }}
                  />
                  <span className="step-model">
                    <i className="step-who" style={{ ["--tone" as string]: `var(--${rung.provider})` }} />
                    {rung.model}
                    {rung.effort ? <em> {rung.effort}</em> : null}
                  </span>
                  <span className="step-price num">${rung.price}</span>
                </div>
              )
            })}
          </div>

          <div className="spread lean">
            <div>
              <p className="set">
                Bars are cost, on a log scale. Colour is the level itself: one gradient sampled
                eleven times, because the eleven are one object. The dot beside each model says
                which vendor holds that rung today, and it moves.
              </p>
              <p className="set">
                Today it moves like this:{" "}
                {onDial.map(([who, n], i) => (
                  <span key={who}>
                    {i > 0 ? (i === onDial.length - 1 ? " and " : ", ") : ""}
                    <strong>
                      {n} to {who}
                    </strong>
                  </span>
                ))}
                {missing.length > 0 && (
                  <>
                    {" "}
                    — and <strong>none at all</strong> to {missing.join(" or ")}, because every
                    model {missing.length > 1 ? "they serve is" : "it serves is"} beaten on both
                    counts by something on another vendor&apos;s list. That is this week&apos;s
                    arithmetic and not a verdict, and it is the whole reason the board lives in a
                    file you can edit rather than in the library.
                  </>
                )}
              </p>
              <p className="set">
                Level 10 is{" "}
                <strong>{top ? Math.round(top.score - floor.score) : 0} Elo above</strong> level 0
                and <strong>{ratio}&times; the money</strong>. That trade is the only decision omni
                makes you think about. There is also a different dial per set of providers: drop a vendor
                and models the other two were shadowing come back onto the rungs, so the same number
                means something else to somebody signed into fewer things than you.{" "}
                <a className="link" href="/models">
                  See the whole graph
                </a>{" "}
                and turn a provider off.
              </p>
              <p className="set">
                One benchmark decides all of this. If Artificial Analysis mismeasures a model, or
                stops publishing, or scores it on work that is not your work, the dial is wrong in
                exactly that way and omni will not know. It is one third party, named, with its
                method and its error bars printed — which is the best available answer and not a
                good one.
              </p>
            </div>
          </div>

        </Chapter>

        <Chapter
          n={6}
          of={CHAPTERS}
          id="turn"
          name="the seam"
          title="The provider has conduct. omni has command."
          argue={
            <>
              <p>
                Intelligence, providers, prompts and session swaps are written down the moment you
                ask for them and applied at the next turn boundary, once the running tool has
                finished. A model never changes underneath itself.
              </p>
              <p>
                A message is the exception, and on purpose. Sent while a turn is running, it is{" "}
                <em>injected</em> into that turn rather than queued behind it.
              </p>
            </>
          }
        >
          <blockquote className="pull">
            <p>
              If, at any time, the officer in charge of the navigational watch is to be relieved when
              a manoeuvre or other action to avoid any hazard is taking place, the relief of that
              officer shall be deferred until such action has been completed.
            </p>
            <cite className="num">
              STCW Code, Section A-VIII/2, Part 4-1, paragraph 23 · the Manila amendments, 2010 ·{" "}
              <a href="https://wwwcdn.imo.org/localresources/en/OurWork/HumanElement/Documents/34.pdf" rel="noreferrer">
                International Maritime Organization
              </a>
            </cite>
          </blockquote>

          <p className="set" style={{ maxWidth: "38rem" }}>
            A ship under pilotage separates two things that software usually confuses. The pilot has
            the <em>conduct</em> of the vessel; the master never stops being in{" "}
            <em>command</em>. That is the whole of this chapter. The provider has conduct of the
            turn — it decides what to say and which tool to reach for. omni has command: it owns the
            log, the counter, and the moment at which anything is allowed to change.
          </p>

          <Boundary />
          <div className="spread lean">
            <Plate
              name="lock-gate"
              aside
              alt="Joseph Pennell's 1912 lithograph of the guard gate at Gatun Lock, standing closed in a dry chamber"
              why={
                <>
                  Drawn while the chamber was still dry, so that the gate can be seen doing nothing.
                  No ship is ever lifted between levels: it waits with both gates shut, which is the
                  only way anyone has found to change a level safely.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={7}
          of={CHAPTERS}
          id="refusals"
          name="the refusals"
          title="Five things it will not do."
          argue={
            <p>
              What a tool refuses tells you more than what it claims. Here are the five, each with
              its reason attached, because a refusal with no reason behind it is only a missing
              feature wearing better clothes.
            </p>
          }
        >
          <div className="spread lean">
            <div className="nots">
              {[
                ["Carry reasoning across a switch.", "Signed or encrypted per vendor, so it cannot be replayed anywhere else. omni records that the model thought and throws the content away — including out of your logs. Nothing gets it back."],
                ["Define tools.", "It watches what the CLI already exposes. It never installs, renames or invents one."],
                ["Pretend Antigravity can be muzzled.", "No flag exists there. So omni writes down that it ignored you, rather than quietly doing nothing and letting you believe otherwise."],
                ["Guess a benchmark number.", "A model GDPval has not scored or costed is left off the dial, not estimated onto it."],
                ["Ship a model list.", "A list baked into a release is a list going stale. With no registry reachable and nothing cached, omni raises rather than recommending last quarter's best buy."],
              ].map(([what, why]) => (
                <div key={what} className="not">
                  <Prohibit size={17} weight="bold" className="not-icon" />
                  <div>
                    <h3>{what}</h3>
                    <p>{why}</p>
                  </div>
                </div>
              ))}
            </div>
            <Plate
              name="no-admittance"
              aside
              alt="An 1878 quarantine notice from the Cape Girardeau Board of Health, forbidding any vessel to land"
              why={
                <>
                  No steamboat to land freight or passengers within five miles of the town. A notice
                  is useful in exact proportion to how precisely it names what it refuses.
                </>
              }
            />
          </div>
        </Chapter>

        <Chapter
          n={8}
          of={CHAPTERS}
          id="database"
          name="the database"
          title="Publishing is a commit."
          argue={
            <>
              <p>
                omni contains the name of no model. Not one. It asks this site for a finished map
                from level to model, and hands two strings to a command line.
              </p>
              <p>
                The database behind that map is a text file: one JSON file in a public repository.
                Editing it and committing is the whole publishing flow — no database, no login, no
                release of the library, no redeploy. Git does what a table would have done: history,
                blame, review, rollback.
              </p>
              <p>
                Which also means somebody&apos;s commit is your routing table. That is the trade.
                What you get for it is a diff you can read, a name against every change, and{" "}
                <code>OMNI_REGISTRY</code> if you would rather point at your own.
              </p>
            </>
          }
        >
          <p className="set" style={{ maxWidth: "38rem", marginBottom: "0" }}>
            It matters whose file it is. The shipowners kept one register of ships and the
            underwriters kept another: the Red Book and the Green Book, 1800 to 1833, grading the
            same hulls, each believed only by the party that had printed it. Both came to the verge
            of bankruptcy. Merged 1834, into{" "}
            <a className="link" href="https://www.lr.org/en/who-we-are/brief-history/">
              one body neither of them owned
            </a>
            . That is the arrangement that survived. A routing table maintained by any one of these
            three vendors would be the Red Book.
          </p>
          <div className="spread lean">
            <Pipeline />
            <Plate
              name="stale-catalogue"
              aside
              alt="The Price Act broadside of 1777, fixing the price of every commodity in the town of Ipswich"
              why={
                <>
                  Every commodity in the town, priced by ordinance and set in display caps. It was
                  wrong by March, and any model list baked into a release is this broadside.
                </>
              }
            />
          </div>
        </Chapter>

        <div className="breath"><Mark h={16} /></div>

        <section className="close enter">
          <h2 className="column">
            One <code>pip install</code>. After that, the largest decision left is an integer
            between 0 and 10.
          </h2>
          <div className="row" style={{ marginTop: "1.8rem" }}>
            <a className="btn solid" href="/docs">
              documentation
              <ArrowRight size={14} weight="bold" />
            </a>
            <a className="btn ghost" href="/models">
              <ChartScatter size={15} weight="bold" />
              the models graph
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
