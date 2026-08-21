# omnipotent

The registry and landing page for [silicon omni](https://github.com/teamofsilicons/silicon-omni).

Two jobs. It explains what omni is, and it decides which model each rung of
omni's 0-10 intelligence dial points at.

```
models-gdpval.json         the database. every model, its score and its cost
plates.json                every image, where it came from, and its licence
app/intelligence.json      the dial omni reads

app/page.tsx               the landing page, as eight numbered chapters
app/docs/                  every call omni exposes, with a second layer
app/models/                every model plotted, and the whole edge
app/inspirations/          where the design came from. sixty debts, ten headings

app/field.tsx              the hero: every model as a dot, the edge as a staircase
app/tape.tsx               one log, two columns of dots — who has read how far
app/dialer.tsx             the dial, live, inline in the prose
app/contents.tsx           the chapters, shown rather than listed
app/boundary.tsx           injected against held, at the turn seam
app/grammars.tsx           three CLIs drawn at three rail gauges
app/pipeline.tsx           commit to command line, in five stations
app/chapter.tsx            a chapter, and a plate with its credit read from JSON
app/mark.tsx               four circles, overlapping. in ink, or overprinted
app/dither.tsx             an 8x8 Bayer field, drawn once per page

lib/ramp.ts                the one gradient, sampled. the CSS and the SVG agree here
lib/dial.ts                the left edge, and the 0-10 walk. computed nowhere else
lib/providers.ts           the three CLIs and the effort words each accepts
lib/graph.ts               reads models-gdpval.json out of this repo

tools/plates.py            prints the plates to one bit through the same matrix
tools/refresh-gdpval.py    pulls the whole board again from Artificial Analysis
```

## The pictures

Every photograph and engraving on the site is quantised to one bit through the
same ordered Bayer matrix the page's dither uses, which is what makes a wood
engraving from 1846 and a photograph from 2015 read as plates from one book.

[`plates.json`](plates.json) is the manifest, the licence audit and the input to
the printing script, all at once — so a caption on the site cannot drift from the
record of where its picture came from. Public domain, PD-US, CC0 and
no-known-restrictions only.

```bash
python3 tools/plates.py                 # anything not yet printed
python3 tools/plates.py switchboard     # just one
python3 tools/plates.py --force         # all of them, again
```

The script writes `public/plates/<name>.png` and `<name>@2x.png`, dithering each
size from the original rather than resampling the larger one — downscaling a
dither is how you get moiré. It also writes the rendered size back into
`plates.json`, so every `<img>` carries width and height and the page never
reflows around a plate that has not loaded.

## The colour

One sheet of warm paper, one ink, one blue, and one gradient:

```
paper   #FFFDF9      ink     #1A1A1A      blue    #1F5FB8
ramp    #76D4F0 → #F9F987 → #FEAD75 → #F15347 → #14245F
```

A **single stop** stands for a single thing: one per vendor, and the vendor
colours are not arbitrary — the deepest for the soberest CLI, the lightest for
the one that can be told the least. The **whole ramp** stands for things working
together, which on this site means exactly three: the dial (eleven levels made
out of three rivals' models, sampled from the ramp in
[`lib/ramp.ts`](lib/ramp.ts)), the publishing pipeline, and the page itself —
each chapter carries one stop, so reading the swatches from top to bottom is
reading the gradient.

Everything else is `#1A1A1A` at a lower alpha, which is why nothing here needs a
sixteenth grey.

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

[`/models`](https://omni.teamofsilicons.com/models) plots every row in this file
and draws the edge, so you can see what a new entry would do to the dial before
you commit it — and turn a provider off to see whose models were being shadowed.

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
Artificial Analysis measured it cost to earn that score. Only the upper-left edge
becomes a dial — a model earns a level if nothing else is both better *and*
cheaper. Level 10 is the top of the edge and the walk goes down and to the left,
so a step down is a real saving and never a sideways move.

`beats` compares with no tolerance, while the benchmark's own confidence
intervals run about ±15 to ±27 Elo. So two rungs can sit closer together than
the board can actually resolve — on the current data, two of the ten steps do.
The site prints the Elo given up at each step and names the ones that are inside
the error bars rather than smoothing them away.

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
