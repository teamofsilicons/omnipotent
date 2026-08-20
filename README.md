# omnipotent

The registry and landing page for [silicon omni](https://github.com/teamofsilicons/silicon-omni).

Two jobs. It explains what omni is, and it decides which model each rung of
omni's 0-10 intelligence dial points at.

```
models-gdpval.json         the database. every model, its score and its cost
app/intelligence.json      the dial omni reads
app/page.tsx               landing
app/reference/page.tsx     the full reference
app/dial/page.tsx          the dial, the whole graph, and an entry builder
lib/dial.ts                the left edge, and the 0-10 walk. computed nowhere else
lib/providers.ts           the three CLIs and the effort words each accepts
lib/graph.ts               reads models-gdpval.json out of this repo
tools/refresh-gdpval.py    pulls the whole board again from Artificial Analysis
```

## Adding a model

Edit [`models-gdpval.json`](models-gdpval.json) and commit. That is the whole
flow — no database, no login, no release of the library, and no redeploy. The
site reads the file over `raw.githubusercontent` at request time and caches it
for a minute, so a change is live about as fast as you can refresh.

GitHub is the database. Git does what a table would have: history, blame,
review, rollback.

One entry per model **and** effort, because effort changes both what a model
scores and what it costs:

```json
{ "provider": "openai", "model": "gpt-5.6-luna", "effort": "max",
  "score": 1578.3, "price": 0.1022 }
```

| field | |
|---|---|
| `provider` | which CLI runs it: `claude`, `openai` or `google` |
| `model` | passed to the CLI **verbatim**. It need not exist in any catalogue |
| `effort` | passed verbatim, and must be one that CLI accepts. `""` omits the flag |
| `score` | GDPval-AA v2 Elo. Leave it out and the model is kept but stays off the dial |
| `price` | USD per GDPval task. Same |

[`/dial`](https://omni.teamofsilicons.com/dial) has a builder that gets the
three unguessable fields right and hands you the JSON to paste. It writes
nothing.

Nothing reaches the dial unless its effort is one that provider actually
accepts, and both numbers are real. Whatever is rejected comes back under
`skipped` in the response, with the reason — so a typo shows up as a missing
model rather than a broken install.

## What omni reads

```
GET https://omni.teamofsilicons.com/intelligence.json
GET https://omni.teamofsilicons.com/intelligence.json?providers=claude+google
```

```json
{
  "providers": "claude+google",
  "ladder":  { "10": { "provider": "claude", "model": "…", "effort": "max" }, "…": {} },
  "ladders": { "claude": {}, "claude+google": {}, "…": {} },
  "runs":    { "10": "claude -p --model … --effort max" },
  "skipped": [],
  "source":  {}, "caveats": []
}
```

Every combination of providers is answered at once, so one fetch serves an
install whatever it is signed into. omni reads `ladders[<providers>]` and falls
back to `ladder`.

`runs` is the same rungs written out as the command each one is. It exists so
there is never a question about how a name is meant to be used: the strings in
the dial go to the CLI untouched, so whatever a future model is called, that is
how it gets run.

## What the dial is

Every model is a point on a graph: a GDPval-AA v2 Elo, and the dollars
Artificial Analysis measured it cost to earn that score. Only the left edge
becomes a dial — a model earns a level if nothing else is both better *and*
cheaper. Level 10 is the top of the edge and the walk goes down and to the left,
so a step down is always a real saving and never a sideways move.

There is one dial per set of providers, because losing a vendor puts models back
on the dial that another vendor's were shadowing. That is why the same number
means different things to different people, and why the library cannot work it
out for itself.

Levels can share a rung when the edge is shorter than eleven points. That is
honest: it means there is nothing in between worth picking.

## Deploying

Import this repo on Vercel. Nothing to provision, no environment variables.
`OMNI_REPO` and `OMNI_BRANCH` only if the model list should be read from
somewhere else; `OMNI_BRANCH` must name a real branch, since
`raw.githubusercontent` will not resolve `HEAD`.

If GitHub cannot be reached the site serves the copy compiled into the
deployment and says so, so it degrades rather than falls over.

## Local

```bash
npm install
npm run dev
npm test        # the dial is worked out here and nowhere else, so it is tested here
```
