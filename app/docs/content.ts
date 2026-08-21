/**
 * Everything omni exposes, and what each thing does underneath.
 *
 * `inside` is the optional half: the flag, the JSON-RPC call, the file write
 * that the friendly line actually turns into. It is kept next to the surface
 * rather than in a separate document so the two cannot drift.
 */

export interface Entry {
  call: string
  takes?: string
  gives?: string
  does: string
  inside?: string
}

export interface Section {
  id: string
  /** phosphor icon name, so the contents can be scanned by shape */
  icon: string
  title: string
  blurb: string
  code?: string
  entries?: Entry[]
  note?: string
}

export const SECTIONS: Section[] = [
  {
    id: "install",
    icon: "DownloadSimple",
    title: "Install",
    blurb:
      "One package, no dependencies. You bring the CLIs. omni offers the ones that are both installed and signed in, and never mentions the others.",
    code: `pip install silicon-omni`,
    entries: [
      {
        call: "claude",
        takes: "Claude Code",
        does: "Serves Anthropic models. Checked with `claude auth status`.",
        inside:
          "Runs as one long-lived `claude -p --output-format stream-json --input-format stream-json --verbose --dangerously-skip-permissions --disable-slash-commands`, with `--model` and `--effort` taken from the dial. Memory files are switched off through the environment on every run, so a session means the same thing on any machine.",
      },
      {
        call: "openai",
        takes: "Codex",
        does: "Serves OpenAI models. Checked with an `account/read` over the app server.",
        inside:
          "`codex app-server --stdio`, spoken to as JSON-RPC over newline-delimited JSON. CODEX_HOME is redirected to `~/.omni/jails/<session>/codex`, which holds a symlink to your real auth.json and a near-empty config. No MCP server, hook or AGENTS.md is ever loaded.",
      },
      {
        call: "google",
        takes: "Antigravity",
        does: "Serves Gemini models, plus the Anthropic and OpenAI models agy resells. Checked with `agy models`.",
        inside:
          "`agy --output-format stream-json --input-format stream-json --disable-slash-commands --print-timeout 24h --dangerously-skip-permissions --print \"\"`. The empty `--print` goes last on purpose: it takes a value, and anywhere else it swallows the flag that follows it.",
      },
    ],
  },
  {
    id: "inference",
    icon: "Door",
    title: "Inference",
    blurb: "The front door, and the only object you import besides the events.",
    code: `from omni import Inference, Event

PROVIDERS = Inference.get_available_providers()
chat = Inference.load_or_create_session("nightly-triage", PROVIDERS)`,
    entries: [
      {
        call: "Inference.get_available_providers(limit_to=None)",
        gives: "list[str]",
        does:
          "Lists the providers whose CLI is installed and logged in, in a stable order. Pass `limit_to` to narrow what omni may use.",
        inside:
          "`shutil.which` for the binary, then the provider's own auth check. A yes is remembered for 60 seconds, because every probe means running a CLI. A no is trusted for 10, so a network blip cannot quietly drop a provider off your dial.",
      },
      {
        call: "Inference.load_or_create_session(id, providers=None)",
        gives: "Chat",
        does:
          "Opens a session by id, and creates it if this is the first time. Raises `SessionBusy` if another live process already holds that id.",
        inside:
          "Reads `~/.omni/sessions/{id}.jsonl` for the history and `{id}.meta.json` for each provider's own session, then takes `{id}.lock` with an O_EXCL create. A lock whose owner is gone is claimed by writing over it and reading it back, so exactly one contender wins.",
      },
      {
        call: "Inference.claude · .openai · .google",
        gives: "Account",
        does: "Gives the three account handles: `installed`, `auth_status`, `available`, `start_auth()`, `finish_auth()`, `limits`.",
        inside:
          "Resolved lazily through an import map, so touching one never imports the other two protocols.",
      },
    ],
  },
  {
    id: "chat",
    icon: "ChatCircleDots",
    title: "Chat",
    blurb:
      "Everything below is written down the moment you call it and applied at the next turn boundary. Nothing changes mid-turn. The one exception is `send`, which is injected where you sent it.",
    entries: [
      {
        call: "chat.start()",
        gives: "Chat",
        does: "Brings a provider up and begins. Returns immediately.",
        inside:
          "Starts the conductor thread and queues a launch. The conductor resolves the dial, builds the runner, seeds it if it has missed anything, and records a `config` event naming the model it settled on.",
      },
      {
        call: "chat.send(text)",
        does:
          "Opens a turn, or lands inside the one already running. Never blocks. Safe from any thread, including from inside an event handler. Raises if the chat is stopped.",
        inside:
          "Queued to the conductor. It is recorded only once a runner has taken it, so a failed send leaves it queued rather than half-delivered, and a message is never both seeded into a provider and sent to it. claude gets a `{\"type\":\"user\"}` line on stdin; codex gets `turn/steer` if a turn is live and `turn/start` otherwise; agy gets `{\"event\":\"user\"}` and runs it as its own turn.",
      },
      {
        call: "chat.stop()",
        does: "Shuts the provider down and releases the session id. Safe to call from inside a handler.",
        inside:
          "Interrupts the turn if one is running, stops the process, drains whatever the provider said on its way out into the log, then releases the lock. Closing stdin is tried before terminate, and terminate before kill.",
      },
      {
        call: "chat.status",
        gives: "str",
        does: "Reports `idle` before start, then `busy` / `waiting`, then `stopped`.",
      },
      {
        call: "chat.idle",
        gives: "bool",
        does: "True when the chat is waiting and nothing is queued. This is the one a polling loop should check.",
      },
      {
        call: "chat.intelligence(n)",
        takes: "0-10",
        does: "Turns the dial. May change model, effort and vendor at once. `chat.inteligence` is an alias for it, misspelling included.",
        inside:
          "Records the wish and returns. At the next turn end the wanted `(provider, model, effort, config)` is compared with what the runner was built with. If only model or effort differ on the same provider, the runner is re-tuned in place; anything else is a restart.",
      },
      {
        call: "chat.active_inference_providers([...])",
        does: "Narrows which providers omni may route to.",
        inside: "Changes which dial is asked for, since there is one dial per set of providers.",
      },
      {
        call: "chat.system_prompt(text)",
        does: "Replaces the provider's own session prompt.",
        inside:
          "claude `--system-prompt`; codex `baseInstructions` on thread start. agy has no equivalent, so it is folded into the front of the first message and a `config` event records that it was approximated.",
      },
      { call: "chat.system_prompt_file(path)", does: "Reads the same from a file." },
      {
        call: "chat.append_system_prompt(text)",
        does: "Keeps the provider's prompt and adds to it.",
        inside: "claude `--append-system-prompt`; codex `developerInstructions`.",
      },
      { call: "chat.append_system_prompt_file(path)", does: "Reads the same from a file." },
      {
        call: "chat.enable_subagents()",
        does:
          "Lets the provider spawn its own. Off by default: a chat starts quiet and you opt in, never out.",
        inside:
          "Quiet means claude gets `--disallowedTools \"Agent(*)\"` plus `CLAUDE_CODE_DISABLE_WORKFLOWS=1`, and codex gets `--disable apps --disable plugins -c agents.enabled=false`; because skills live outside CODEX_HOME they are additionally switched off one at a time over `skills/config/write`. `-c project_doc_max_bytes=0` is sent whichever way this is set, so opting in cannot bring an AGENTS.md along with it. agy has no equivalent at all, and says so.",
      },
      {
        call: "chat.enable_mcp()",
        does: "Lets the provider load its MCP servers and connectors. Off by default.",
        inside:
          "Quiet means claude gets `--strict-mcp-config --setting-sources \"\"`. codex is isolated by its jail either way. agy cannot be, and says so.",
      },
      {
        call: "chat.disable_subagents()",
        does: "States the default out loud.",
      },
      { call: "chat.disable_mcp()", does: "Likewise." },
      {
        call: "chat.disable_autoremoving_unauthenticated_providers()",
        does:
          "Stops dropping a provider that loses its login mid-run. The dropping is on by default; see Auth.",
      },
      {
        call: "chat.cwd(path)",
        does: "Sets where the provider runs its tools. Pinned to the session.",
        inside:
          "Resolved through symlinks first. Claude names its session file after the working directory, and on macOS `/var` and `/tmp` are links, so an unresolved path files the session somewhere omni would never look again.",
      },
      {
        call: "@chat.on_event",
        does: "Decorator. Delivers every event as it happens, on one thread, in order.",
        inside:
          "A handler that raises is reported as an `ERROR` of kind `handler` and stepped over. It cannot take the run down.",
      },
      {
        call: "@chat.logs",
        does: "Decorator. Delivers everything `on_event` sees, plus omni's own bookkeeping.",
        inside:
          "A log handler that raises cannot be reported to the log handlers, so its failure is written straight to the session file instead.",
      },
    ],
  },
  {
    id: "events",
    icon: "Broadcast",
    title: "Events",
    blurb:
      "One dataclass for everything. The same objects go to your handlers, to your logs and onto disk, so the session file is the event log and there is never a second schema.",
    entries: [
      { call: "Event.START", takes: "text", does: "The message that opened this turn." },
      { call: "Event.TEXT", takes: "text", does: "One finished assistant message." },
      {
        call: "Event.THINKING",
        does: "The model is reasoning. Never what it thought.",
        inside:
          "Reasoning is signed or encrypted per vendor and cannot be replayed anywhere else, so omni records that it happened and drops the content, including out of your logs. There is no flag to keep it.",
      },
      { call: "Event.TOOL.CALL", takes: "tool, args, id", does: "A tool was invoked." },
      { call: "Event.TOOL.RESULT", takes: "tool, id, result, ok", does: "It came back." },
      { call: "Event.END", does: "The turn is over." },
      { call: "Event.INJECTED", takes: "text", does: "A message that landed inside a running turn." },
      {
        call: "Event.ERROR",
        takes: "error, kind",
        does:
          "`auth` · `limit` · `unavailable` · `crash` from the model or its CLI, plus `stderr` for CLI chatter, `omni` when the engine failed, and `handler` when your own callback raised.",
        inside:
          "Every provider words its failures differently. omni sorts them into the only four answers that change what you do: log in, wait, retry, or read a stack trace.",
      },
      { call: "Event.SWITCH_PROVIDER", takes: "provider, extra.from", does: "The conversation moved." },
      { call: "Event.NEW_SESSION", takes: "extra.native", does: "A provider opened one of its own." },
      {
        call: "Event.CONFIG",
        takes: "text",
        does:
          "A setting changed, or omni did something worth writing down: `launch` · `retune` · `reseed` · `provider_removed` · `unsupported` · `approximated` · `stop`.",
      },
      {
        call: "event.seq",
        gives: "int",
        does:
          "Its position in the session log. It only goes up, and it never repeats, across every provider the conversation has passed through.",
        inside:
          "This is how omni knows what a provider still has to be told. The meta file records the last seq each one saw, so coming back replays exactly what was recorded since, and nothing twice.",
      },
    ],
    note: "Fields: type, session, provider, model, text, tool, id, args, result, ok, kind, error, at, seq, extra. Anything sitting at its default is left out of the file rather than written as null.",
  },
  {
    id: "sessions",
    icon: "Files",
    title: "Sessions",
    blurb:
      "The session file is the source of truth and it outlives every provider. Everything else on disk is bookkeeping about it.",
    entries: [
      { call: "~/.omni/sessions/{id}.jsonl", does: "The conversation, as an append-only event log. Never rewritten." },
      {
        call: "~/.omni/sessions/{id}.meta.json",
        does: "Each provider's own session id, and how far up the log that provider has been shown.",
        inside:
          "`synced` is advanced at the end of each turn, on the provider that ran it, and deliberately not when switching away. Everything recorded since is exactly what that provider must be told on the way back.",
      },
      {
        call: "~/.omni/sessions/{id}.lock",
        does: "The owning pid. Reclaimed if that pid is gone, so a crash never wedges a session shut for good.",
      },
      { call: "~/.omni/jails/{id}/codex", does: "Codex's stripped CODEX_HOME." },
      { call: "~/.omni/cache/intelligence.json", does: "The dial, one per provider set, kept an hour." },
    ],
    note:
      "Continuing on the same provider uses that provider's native resume and never reads omni's log at all. Arriving somewhere new replays only what that provider missed. A provider that reports back a session id omni did not ask for is assumed to have lost the old one, and is told the whole story from the top.",
  },
  {
    id: "auth",
    icon: "Key",
    title: "Auth",
    blurb: "omni drives each CLI's own login, so you never have to open the CLI yourself.",
    code: `Inference.claude.auth_status
print(Inference.claude.start_auth())      # the url to open
Inference.claude.finish_auth("code-or-redirect-url")`,
    entries: [
      {
        call: "start_auth()",
        gives: "str",
        does: "Begins a login and hands back the URL to open.",
        inside:
          "Spawns the CLI's own login, watches its output for a URL and returns it. If nothing usable appears, whatever it printed comes back verbatim, along with the command to run by hand.",
      },
      {
        call: "finish_auth(code)",
        gives: "str",
        does: "Takes the code or redirect URL back, then re-checks.",
        inside:
          "Codex runs its own browser callback, so there this waits for an `account/login/completed` notification instead of typing anything, and the code you pass is ignored.",
      },
      {
        call: "a login that dies mid-run",
        does:
          "The provider is dropped from that chat, the error is reported, and the same intelligence level is resolved again over whoever is left. The conversation carries on somewhere else, at a level that now means something slightly different.",
        inside:
          "An `ERROR`/`auth` closes the turn, emits `CONFIG`/`provider_removed`, then relaunches, which reports as a `SWITCH_PROVIDER`. The failed turn is not replayed: it is in the log for the next provider to read, but re-driving it could re-run a tool that has already run. Switch the whole behaviour off with `chat.disable_autoremoving_unauthenticated_providers()` and the error ends the turn and nothing else.",
      },
    ],
  },
  {
    id: "limits",
    icon: "Gauge",
    title: "Limits",
    blurb:
      "Asking costs no tokens on any of the three. `used` comes back a fraction and `reset` an RFC3339 UTC string, whatever each one answers natively: one of them counts seconds since the epoch, and you never have to know which.",
    code: `Inference.openai.limits
# {'5h': {'used': 0.0,  'reset': '2026-08-21T14:31:07.000Z'},
#  '7d': {'used': 0.16, 'reset': '2026-08-21T10:53:25.000Z'}}`,
    entries: [
      {
        call: "claude",
        does: "Some enterprise plans expose no windows at all. `used` is then None, and not zero — the difference matters.",
        inside: "A `get_usage` control request over a throwaway stream-json process. Costs nothing and needs no credentials of omni's own.",
      },
      {
        call: "openai",
        does: "Read by window duration, never by position.",
        inside:
          "`account/rateLimits/read`. `primary` is not always the 5-hour window; on some plans it is the weekly one. So omni branches on `windowDurationMins`, where 300 is the 5h and 10080 the 7d.",
      },
      {
        call: "google",
        does: "Reports remaining per model group. omni reports used, worst group first.",
        inside: "`agy -p /usage`, which the CLI answers itself, so no model is called and no quota is spent.",
      },
    ],
  },
  {
    id: "testing",
    icon: "TestTube",
    title: "Testing",
    blurb:
      "A provider that needs no CLI, no login and no quota, and answers the same way every time. It is not registered until you ask for it, so it cannot turn up in a real run by accident.",
    code: `from omni import Inference
from omni.providers import test

test.install()
chat = Inference.load_or_create_session("t", ["test"])
chat.start()
chat.send("hello")        # -> TEXT  'echo: hello'`,
    entries: [
      {
        call: "test.install()",
        gives: "str",
        does: "Registers the provider and pins a whole 0-10 dial for it.",
        inside:
          "The dial is written into `~/.omni/cache/intelligence.json` under its own key, so routing runs down exactly the same path a real provider would and nothing reaches the network.",
      },
      { call: "[tool:NAME]", does: "Runs `NAME`, and emits a `TOOL.CALL` and a matching `TOOL.RESULT`." },
      {
        call: "[recall]",
        does: "Replies with everything it was told before this message.",
        inside:
          "Including history it was only ever seeded with, never sent, which is what makes it useful for testing a provider switch without switching provider.",
      },
      { call: "anything else", does: "Replies `echo: <what you sent>`." },
    ],
    note:
      "The library's own live suite runs against the real ~/.omni rather than a sandbox, because a test that uses different paths from a real run is not testing a real run. `scripts/cleanup.py` in the repo takes its sessions, jails and working directories back out afterwards.",
  },
  {
    id: "registry",
    icon: "Database",
    title: "The registry",
    blurb:
      "omni contains the name of no model. It asks this site for a finished map from level to model, then hands the two strings to a CLI and reads nothing else out of the answer.",
    code: `GET https://omni.teamofsilicons.com/intelligence.json?providers=claude+google`,
    entries: [
      {
        call: "OMNI_REGISTRY",
        does: "Points omni at your own registry. The contract is one GET with a `providers` query.",
        inside:
          "The answer is cached under `~/.omni/cache` for an hour, keyed by the set of providers. A dial fetched once is reused even after it has expired, so a machine that has run before keeps working offline.",
      },
      {
        call: "NoDial",
        does:
          "Raised when the registry has never been reached and nothing is cached. No model list ships in the wheel as a fallback, so this is a hard stop and not a degraded mode.",
        inside:
          "A model list baked into a release is a list going stale, and quietly recommending last quarter's best buy is worse than refusing to answer.",
      },
    ],
  },
]
