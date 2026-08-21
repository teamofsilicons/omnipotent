import {
  ArrowRight,
  ChartScatter,
  Flag,
  Prohibit,
  PlugsConnected,
  WarningDiamond,
} from "@phosphor-icons/react/dist/ssr"

import { Copy } from "./copy"
import { Dither } from "./dither"
import { Session } from "./session"
import { dialFor } from "../lib/dial"
import { graph } from "../lib/graph"

const QUICKSTART = `from omni import Inference, Event

chat = Inference.load_or_create_session("nightly-triage")
chat.intelligence(7)

@chat.on_event
def handle(event):
    if event.type == Event.TEXT:
        print(event.text)

chat.start()
chat.send("what changed in this repo today?")`

/** Four numbers instead of four adjectives. */
const FACTS = [
  ["3", "agentic CLIs, one object"],
  ["0", "dependencies"],
  ["11", "levels on the dial"],
  ["1", "session file, whoever runs it"],
]

export default async function Landing() {
  const { models } = await graph()
  const rungs = dialFor(models, ["claude", "openai", "google"])
  const top = rungs["10"]
  const floor = rungs["0"]
  const ratio = top && floor ? Math.round(top.price / floor.price) : 0

  return (
    <>
      <section className="hero">
        <Dither shape="radial" />
        <div className="shell wide">
          <div className="hero-grid">
            <div>
              <h1 className="rise" style={{ ["--i" as string]: 0 }}>
                One conversation.
                <br />
                <span className="under">Three vendors</span> underneath&nbsp;it.
              </h1>
              <p className="lede rise" style={{ ["--i" as string]: 1, marginTop: "1.5rem" }}>
                silicon omni drives Claude Code, Codex and Antigravity from a single Python
                object, on the subscriptions you already pay for. Turn one dial and the same
                chat finishes on a different vendor&apos;s model — with everything that came
                before already in its head.
              </p>
              <div className="row rise" style={{ ["--i" as string]: 2, marginTop: "2rem" }}>
                <code className="install">pip install silicon-omni</code>
                <Copy text="pip install silicon-omni" />
                <a className="btn ghost" href="/docs">
                  documentation
                  <ArrowRight size={14} weight="bold" />
                </a>
              </div>
            </div>

            <div className="rise" style={{ ["--i" as string]: 3 }}>
              <Session />
            </div>
          </div>

          <div className="facts rise" style={{ ["--i" as string]: 4 }}>
            {FACTS.map(([n, what]) => (
              <div key={what} className="fact">
                <span className="fact-n num">{n}</span>
                <span className="fact-what">{what}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="shell rails">
        <section className="stitched enter">
          <div className="rule"><span>the problem</span></div>
          <div className="split">
            <h2>Every vendor ships a good CLI. None of them speak to each other.</h2>
            <div className="split-body">
              <p>
                So you pick one, and you inherit its models, its rate limits and its bad
                afternoons. Switching later means rewriting your integration and abandoning the
                conversation you were in the middle of.
              </p>
              <p>
                omni takes the conversation off the vendor and keeps it in a file it owns. The
                providers become engines you can change while the engine is running.
              </p>
            </div>
          </div>

          <div className="three enter">
            {[
              { name: "Claude Code", icon: Flag, tint: "claude", body: "Flags do the work. Seeding is a file write, and model changes go over the stdin control channel — so re-tuning restarts nothing." },
              { name: "Codex", icon: PlugsConnected, tint: "openai", body: "The app server, not exec. A CODEX_HOME of its own holding a link to your credentials and almost nothing else. History arrives by thread/inject_items." },
              { name: "Antigravity", icon: WarningDiamond, tint: "google", body: "No flag for MCP, none for subagents, no way to seed. So prior conversation is folded into the front of the next message — one turn, not two." },
            ].map(({ name, icon: Icon, tint, body }) => (
              <div key={name} className="cell" style={{ ["--tint" as string]: `var(--${tint})` }}>
                <Icon size={22} weight="duotone" className="cell-icon" />
                <h3>{name}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="stitched enter" id="write">
          <div className="rule"><span>what you write</span></div>
          <div className="split">
            <h2>The whole surface is one object.</h2>
            <div className="split-body">
              <p>
                No client to construct, no keys to hold, no model string to keep current. omni
                offers you the providers whose CLI is installed <em>and</em> logged in, and
                nothing else.
              </p>
              <p>
                Everything after this is the same object: <code>send</code> from any thread,{" "}
                <code>intelligence</code> to change what answers, <code>stop</code> to let the
                session id go.
              </p>
            </div>
          </div>
          <div className="slab enter">
            <pre>{QUICKSTART}</pre>
            <Copy text={QUICKSTART} />
          </div>
        </section>

        <section className="stitched enter" id="switch">
          <div className="rule"><span>switching</span></div>
          <div className="split">
            <h2>Three vendors. One conversation.</h2>
            <div className="split-body">
              <p>
                This is a real run. Three facts told to three different companies&apos; models,
                then a question to the first one again.
              </p>
            </div>
          </div>

          <div className="relay enter">
            {[
              { who: "claude", model: "claude-sonnet-5", said: "Remember: fact one is RUBY-1.", back: "OK" },
              { who: "openai", model: "gpt-5.4-mini", said: "Remember: fact two is JADE-2.", back: "OK" },
              { who: "google", model: "gemini-3.5-flash-low", said: "Remember: fact three is ONYX-3.", back: "OK" },
            ].map((step, i) => (
              <div key={step.who} className="leg" style={{ ["--tint" as string]: `var(--${step.who})` }}>
                <div className="leg-head">
                  <span className="dot" />
                  <span className="leg-who">{step.who}</span>
                  <span className="leg-model num">{step.model}</span>
                  {i > 0 && <span className="leg-move">switched</span>}
                </div>
                <p className="leg-said">{step.said}</p>
                <p className="leg-back">{step.back}</p>
              </div>
            ))}
            <div className="leg final" style={{ ["--tint" as string]: "var(--claude)" }}>
              <div className="leg-head">
                <span className="dot" />
                <span className="leg-who">claude</span>
                <span className="leg-model num">claude-sonnet-5</span>
                <span className="leg-move">switched back</span>
              </div>
              <p className="leg-said">List all three facts.</p>
              <p className="leg-back big">RUBY-1, JADE-2, ONYX-3</p>
            </div>
          </div>

          <div className="column" style={{ marginTop: "2.2rem" }}>
            <p>
              Coming back is the cheap direction. Claude resumed <em>its own</em> session and was
              told only what happened while it was away, because omni records how far up the log
              each provider has already seen.
            </p>
            <p>
              Tools the destination does not have arrive as text that reads as what happened —{" "}
              <code>[GoogleSearch: &quot;kite festivals&quot;]</code>. The structured original stays
              in the log, so going back to Gemini replays Gemini&apos;s own session and the brackets
              never happened. <mark>Preserved, not lossy.</mark>
            </p>
          </div>
        </section>

        <section className="stitched enter" id="dial">
          <div className="rule"><span>the dial</span></div>
          <div className="split">
            <h2>One number, not a model picker.</h2>
            <div className="split-body">
              <p>
                Every model is a point: what it scores on{" "}
                <a className="link" href="https://artificialanalysis.ai/evaluations/gdpval-aa">
                  GDPval
                </a>{" "}
                against what it measurably cost to score it. Only the left edge of that graph
                becomes a dial — a model earns a level when nothing else is both better{" "}
                <em>and</em> cheaper.
              </p>
            </div>
          </div>

          <div className="ladder enter">
            {Array.from({ length: 11 }, (_, i) => 10 - i).map((level) => {
              const rung = rungs[String(level)]
              if (!rung) return null
              const width = top ? (Math.log10(rung.price) - Math.log10(floor.price)) /
                (Math.log10(top.price) - Math.log10(floor.price)) : 0
              return (
                <div key={level} className="step" style={{ ["--tint" as string]: `var(--${rung.provider})` }}>
                  <span className="step-level num">{level}</span>
                  <span className="step-bar" style={{ width: `${Math.max(3, width * 100)}%` }} />
                  <span className="step-model">
                    {rung.model}
                    {rung.effort ? <em> {rung.effort}</em> : null}
                  </span>
                  <span className="step-price num">${rung.price}</span>
                </div>
              )
            })}
          </div>

          <div className="column" style={{ marginTop: "2rem" }}>
            <p>
              The bars are cost, on a log scale. Level 10 buys you{" "}
              <strong>{top ? Math.round(top.score - floor.score) : 0} more Elo</strong> than level 0 and costs{" "}
              <strong>{ratio}&times; more</strong> to run. Whether that trade is worth it is the
              only decision omni asks you to make.
            </p>
            <p>
              There is one dial per set of providers, because losing a vendor puts models back on
              the dial that another vendor&apos;s were shadowing.{" "}
              <a className="link" href="/models">
                See the whole graph
              </a>{" "}
              and turn a provider off.
            </p>
          </div>
        </section>

        <section className="stitched enter">
          <div className="rule"><span>the rule everything hangs off</span></div>
          <div className="split">
            <h2>Nothing changes mid turn.</h2>
            <div className="split-body">
              <p>
                Intelligence, providers, prompts and session swaps are recorded the moment you ask
                and applied at the next turn boundary, once the running tool has finished. A model
                never changes underneath itself.
              </p>
              <p>
                A message sent while a turn is running is <em>injected</em> rather than queued
                behind it. Either way <code>send</code> returns immediately and is safe from any
                thread, so whether you drive omni from a loop, asyncio or a message bus is your
                business.
              </p>
            </div>
          </div>
        </section>

        <section className="stitched enter">
          <div className="rule"><span>what it will not do</span></div>
          <div className="split">
            <h2>The refusals.</h2>
            <div className="split-body">
              <p>What a tool declines to do tells you more than what it claims.</p>
            </div>
          </div>
          <div className="nots enter">
            {[
              ["Carry reasoning across a switch.", "Signed or encrypted per vendor, so it cannot be replayed. omni records that the model thought and throws the content away — including out of your logs."],
              ["Define tools.", "It observes whatever the CLI exposes and never installs, renames or invents one."],
              ["Pretend Antigravity can be muzzled.", "There is no equivalent switch there, so omni logs that it ignored you rather than quietly doing nothing."],
              ["Guess a benchmark number.", "A model GDPval has not scored or costed is left off the dial rather than estimated onto it."],
              ["Ship a model list.", "A list baked into a release goes stale. With no registry reachable and nothing cached, omni raises rather than recommending last quarter's best buy."],
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
        </section>

        <div className="breath"><span /><span /><span /></div>

        <section className="close enter">
          <h2 className="column">
            It is one <code>pip install</code> and one number.
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
