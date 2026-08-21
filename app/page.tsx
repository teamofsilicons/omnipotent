import { ArrowRight, ChartScatter, Prohibit } from "@phosphor-icons/react/dist/ssr"

import { Boundary } from "./boundary"
import { Chapter, Plate } from "./chapter"
import { Contents } from "./contents"
import { Code } from "./code"
import { Command } from "./command"
import { Dialer } from "./dialer"
import { Dither } from "./dither"
import { Field } from "./field"
import { Grammars } from "./grammars"
import { Mark } from "./mark"
import { Logo, type Vendor } from "./logos"
import { Pipeline } from "./pipeline"
import { Relay } from "./relay"
import { Tape } from "./tape"
import { dialFor, edge, plottable } from "../lib/dial"
import { graph } from "../lib/graph"
import { dial as levelColour, on as inkOn } from "../lib/ramp"

const QUICKSTART = `from omni import Inference, Event

chat = Inference.load_or_create_session("triage")
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
    [String(points.length), `settings we can run — ${distinct} models at the efforts each takes`],
    [String(walk.length), "survive it: everything better also costs more"],
    ["3", "command lines, one object"],
    ["0", "dependencies"],
    ["1", "file holds the conversation, whoever answers it"],
  ]

  return (
    <>
      {/* Two bands, not an overlay.
          The type used to sit on top of the chart, in a hole the chart masked
          out of itself. That only works while the sentence stays the height it
          was when the hole was cut — and the sentence is copy, so it doesn't.
          A headline's height and a frontier's shape are independent variables;
          asking them to miss each other was a bet, and it lost. */}
      <section className="hero">
        <Dither shape="radial" cells={210} />
        <div className="shell hero-shell">
          <div className="hero-grid">
            <h1 className="rise">
              We keep the conversation.
              <br />
              The three of them take&nbsp;turns.
            </h1>
            <div className="hero-side">
              <p className="lede rise" style={{ ["--i" as string]: 1 }}>
                We drive Claude Code, Codex and Antigravity from one Python object, on the
                subscriptions you already have. Turn the dial from seven to four and the same chat
                finishes on another company&apos;s model, knowing everything said before it.
              </p>
              <div className="row rise" style={{ ["--i" as string]: 2 }}>
                <Command text="pip install silicon-omni" />
                <a className="btn ghost" href="/docs">
                  documentation
                  <ArrowRight size={14} weight="bold" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="plot">
        <Field points={points} />
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

        <Contents />

        <Chapter
          n={1}
          of={CHAPTERS}
          id="gauge"
          name="the break of gauge"
          title="Each of the three keeps its own memory."
          argue={
            <>
              <p>
                Pick a good one and you have picked its models, its rate limits and its bad
                afternoons with it. Leaving later costs you the integration and the conversation you
                were in the middle of. The second one is the expensive part, and it is the one
                nobody quotes you for.
              </p>
              <p>
                We keep the conversation in a file of our own. The three become engines, and you can
                change an engine while it runs.
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
              One takes JSON-RPC over a socket. One takes its history inside the front of the next
              message. We hold all three open and tell each of them the same story, in the dialect
              that one accepts.
            </p>
            <Plate
              name="sea-floor"
              aside
              alt="Engraving: masons laying a wall on the sea floor, air hoses running up through the waterline to a crew working in the open above"
              why={
                <>
                  Every man down there breathes through his own line. The wall goes up all the same.
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
          title="One object, and the logins already on your machine."
          argue={
            <>
              <p>
                We offer the providers whose command line is installed <em>and</em> signed in.
                That is the list you get.
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
            <Code>{QUICKSTART}</Code>
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
          title="Every line gets a number, and the number only goes up."
          argue={
            <>
              <p>
                The session is a log we append to. Every line carries a number, and the number
                runs on through every provider the conversation has passed through. A second,
                smaller file holds how far up that log each one has read.
              </p>
              <p>
                Two files, and the rest follows. A provider arriving hears what it missed. A
                provider coming back resumes <em>its own</em> session and hears the rest.
              </p>
            </>
          }
        >
          <Tape high={asHeld(highLevel)} low={asHeld(lowLevel)} />
          <div className="spread">
            <div>
              <p className="set">
                Watch the second column fill. On the way out, the arriving provider is handed eight
              lines. Coming back, the first one is handed seven of the fourteen the file now holds,
              because the first six are already inside its own session and it is resuming that.
            </p>
            <p className="set">
              Benedict gave the kitchen a week at a time, and gave the changeover to both men at
              once: the server going off washes up and returns the utensils to the cellarer, who
              hands them to the server coming on,{" "}
              <a className="link" href="https://www.gutenberg.org/files/50040/50040-h/50040-h.htm#Chapter_35">
                in order that he may know what he gives out and what he receives back
              </a>
              . The second file is the cellarer&apos;s list.
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
                  The hours are ruled down the margin before the day happens. An hour with a blank
                  against it still counts as an hour.
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
          title="We tell the next one what it missed."
          argue={
            <p>
              A real run, transcribed. One fact each to three companies&apos; models, then the
              question put back to the first. Each of them heard its own line once.
            </p>
          }
        >
          <Relay />

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
              A tool that belongs to somebody else arrives as text that reads as what happened —{" "}
              <code>[GoogleSearch: &quot;kite festivals&quot;]</code>. The structured original stays
              in the log, so going back to Gemini resumes Gemini&apos;s own session, which holds it.
            </p>
            <p className="set">
              When a bob is called, the bells in fourth and fifth place ring on{" "}
              <a className="link" href="https://archive.org/details/changeringingan00troygoog">
                as if no calling had been made
              </a>
              . Coming back, so does the provider.
            </p>
            <Plate
              name="wax-seal"
              aside
              alt="A 1176 charter of Philip of Alsace with his wax seal hanging from a parchment tag"
              why={
                <>
                  The words copy. The seal stays where it was pressed. Reasoning is the seal, which
                  is why we record that the model thought and keep the thought out of the file.
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
          title="One number, nought to ten."
          argue={
            <>
              <p>
                Every model is one point: what it scores on{" "}
                <a className="link" href="https://artificialanalysis.ai/evaluations/gdpval-aa">
                  GDPval
                </a>{" "}
                against the dollars it measurably took to score it. The upper-left edge of that
                cloud becomes the dial. A model earns a level when everything better also costs
                more.
              </p>
              <p>
                Level 10 sits at the top of the edge and the walk goes down and to the left, so
                every step saves money you can name. Two of today&apos;s ten steps fall inside the
                benchmark&apos;s own error bars, and the dial below says which. Whether the trade is
                worth it is the part we leave to you.
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
                    <span className="step-who" style={{ ["--tone" as string]: `var(--${rung.provider}-ink)` }}>
                      <Logo of={rung.provider as Vendor} size={11} />
                    </span>
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
                eleven times, because the eleven are one object. The mark beside each model says
                whose command line holds that rung today, and it moves.
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
                    arithmetic, which is the whole reason the board lives in a file you can edit.
                  </>
                )}
              </p>
              <p className="set">
                Level 10 is{" "}
                <strong>{top ? Math.round(top.score - floor.score) : 0} Elo above</strong> level 0
                and <strong>{ratio}&times; the money</strong>. That trade is the one thing we
                make you think about. There is also a different dial per set of providers: drop a vendor
                and models the other two were shadowing come back onto the rungs, so the same number
                means something else to somebody signed into fewer things than you.{" "}
                <a className="link" href="/models">
                  See the whole graph
                </a>{" "}
                and turn a provider off.
              </p>
              <p className="set">
                One benchmark decides all of this. If Artificial Analysis mismeasures a model, or
                stops publishing, or scores it on work unlike yours, the dial is wrong in exactly
                that way and we carry on. It is one third party, named, with its method and its
                error bars printed.
              </p>
              <p className="set">
                A bee hunter gets his straight line out of the eighth or tenth flight. The first few
                point somewhere else.
              </p>
            </div>
          </div>

        </Chapter>

        <Chapter
          n={6}
          of={CHAPTERS}
          id="turn"
          name="the seam"
          title="We wait for the turn to end."
          argue={
            <>
              <p>
                Intelligence, providers, prompts and session swaps are written down the moment you
                ask for them, and applied at the next turn boundary, once the running tool has
                finished.
              </p>
              <p>
                A message is the exception, and on purpose. Sent while a turn is running, it goes
                into that turn.
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
            the <em>conduct</em> of the vessel; the master stays in{" "}
            <em>command</em>. The provider has conduct of the
            turn — it decides what to say and which tool to reach for. We have command: the
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
                  Drawn while the chamber was still dry, so the gate can be seen at rest. A ship
                  waits between two shut gates while the water finds its new level. Everyone who has
                  tried it another way has stopped.
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
          title="Five things we refuse."
          argue={
            <p>Five, with the mechanism for each.</p>
          }
        >
          <div className="spread lean">
            <div className="nots">
              {[
                ["Carry reasoning across a switch.", "A vendor signs its reasoning, so it replays only where it was made. We record that the model thought, and drop the thought — out of your logs as well."],
                ["Define tools.", "We watch what the command line already exposes."],
                ["Muzzle Antigravity.", "Antigravity keeps that decision. We write down that we ignored you."],
                ["Guess a benchmark number.", "A model GDPval has measured goes on the dial. A model it has yet to measure stays on the list."],
                ["Ship a model list.", "A list inside a release goes stale. With the registry unreachable and the cache empty, we raise."],
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
                  Ordered by the Board of Health: no steamboat to land freight or passengers within
                  five miles of the town. A notice is useful in exact proportion to how precisely it
                  names what it refuses.
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
          title="The list is one text file."
          aside={
            <p className="ch-aside set">
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
          }
          argue={
            <>
              <p>
                We ask this site for a finished map from level to model, and hand two strings to a
                command line. Every model name on your machine arrived over the wire this morning.
              </p>
              <p>
                The map comes out of one JSON file in a public repository. Editing it and committing
                is the publish. Git does what a table would have done: history, blame, review,
                rollback.
              </p>
              <p>
                Which also means somebody&apos;s commit is your routing table. That is the trade.
                What you get for it is a diff you can read, a name against every change, and{" "}
                <code>OMNI_REGISTRY</code> if you would rather point at your own.
              </p>
            </>
          }
        >
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

        {/* A rest, rather than a gap. The mark alone on an empty band was a
            held breath with nothing in it; a flock is the same argument the
            whole page has been making, and it is nobody's design. */}
        <figure className="rest">
          <div className="rest-plate">
            <img
              src="/plates/murmuration.png"
              srcSet="/plates/murmuration.png 1x, /plates/murmuration@2x.png 2x"
              alt="A dense band of red-winged blackbirds along the horizon, its upper edge rolling"
              width={720}
              height={240}
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption>
            <Mark h={13} />
            <span>
              Nobody drew the top edge of that flock, and it is the sharpest line in the photograph.
              Every frontier on this site is made the same way.
            </span>
          </figcaption>
        </figure>

        <section className="close enter">
          <h2 className="column">
            One <code>pip install</code>, and one number.
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
