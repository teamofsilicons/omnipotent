/**
 * The dial is worked out here and nowhere else, so it gets tested here.
 *
 * Run with `npm test`. No test framework: node's own runner, and the
 * typescript already installed for the build, so there is nothing extra to
 * keep up to date.
 */

import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { test } from "node:test"

const require = createRequire(import.meta.url)
const ts = require("typescript")

async function load(file) {
  const source = readFileSync(new URL(`../lib/${file}`, import.meta.url), "utf8")
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  // rewrite relative imports to data urls so the module graph resolves
  const rewritten = js.replace(/from "\.\/([a-z]+)"/g, (_, name) => `from "${dataUrl(name)}"`)
  return import("data:text/javascript," + encodeURIComponent(rewritten))
}

function dataUrl(name) {
  const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8")
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return "data:text/javascript," + encodeURIComponent(js)
}

const { edge, dial, dialFor, plottable, unusable } = await load("dial.ts")
const { invocation, combinations } = await load("providers.ts")

const GRAPH = [
  { provider: "claude", model: "top", effort: "max", score: 1800, price: 30 },
  { provider: "openai", model: "good", effort: "high", score: 1600, price: 8 },
  { provider: "claude", model: "dear", effort: "high", score: 1500, price: 12 },
  { provider: "openai", model: "mid", effort: "medium", score: 1300, price: 3 },
  { provider: "claude", model: "floor", effort: "low", score: 900, price: 0.5 },
]

test("a model nothing beats on both axes stays on the edge", () => {
  assert.deepEqual(edge(plottable(GRAPH)).map((p) => p.model), ["top", "good", "mid", "floor"])
})

test("a model that is worse and dearer is never offered", () => {
  assert.ok(!edge(plottable(GRAPH)).some((p) => p.model === "dear"))
})

test("the edge runs down and to the left", () => {
  const walk = edge(plottable(GRAPH))
  for (let i = 0; i < walk.length - 1; i++) {
    assert.ok(walk[i].score > walk[i + 1].score, "score must fall")
    assert.ok(walk[i].price > walk[i + 1].price, "price must fall")
  }
})

test("losing a provider puts a shadowed model back on the dial", () => {
  const alone = edge(plottable(GRAPH).filter((p) => p.provider === "claude")).map((p) => p.model)
  assert.deepEqual(alone, ["top", "dear", "floor"], "good was the only thing beating dear")
})

test("two models on the same spot count once", () => {
  const twins = [...GRAPH, { provider: "openai", model: "twin", effort: "low", score: 900, price: 0.5 }]
  const spots = edge(plottable(twins)).map((p) => `${p.score}/${p.price}`)
    assert.equal(spots.length, new Set(spots).size)
})

test("the dial puts the best at ten and the cheapest at zero", () => {
  const rungs = dial(edge(plottable(GRAPH)))
  assert.deepEqual(Object.keys(rungs).sort(), [...Array(11).keys()].map(String).sort())
  assert.equal(rungs["10"].model, "top")
  assert.equal(rungs["0"].model, "floor")
})

test("a short edge still fills every level", () => {
  const rungs = dial(edge(plottable(GRAPH)).slice(0, 2))
  assert.equal(Object.keys(rungs).length, 11)
  assert.deepEqual([...new Set(Object.values(rungs).map((r) => r.model))].sort(), ["good", "top"])
})

test("the dial never charges more as it goes down", () => {
  for (const combo of combinations()) {
    const rungs = dialFor(GRAPH, combo.split("+"))
    for (let level = 0; level < 10; level++) {
      const below = rungs[String(level)]
      const above = rungs[String(level + 1)]
      if (!below || !above) continue
      assert.ok(below.price <= above.price, `${combo} level ${level} costs more than ${level + 1}`)
      assert.ok(below.score <= above.score, `${combo} level ${level} scores above ${level + 1}`)
    }
  }
})

// --- the two ways a hand-edited database goes wrong -------------------------

test("a model with its numbers left out never reaches the dial", () => {
  const withGap = [
    ...GRAPH,
    { provider: "openai", model: "brand-new", effort: "high" },
    { provider: "openai", model: "explicit-null", effort: "high", score: null, price: null },
  ]
  const names = Object.values(dialFor(withGap, ["claude", "openai"])).map((r) => r.model)
  assert.ok(!names.includes("brand-new"), "an omitted score must not become NaN and win")
  assert.ok(!names.includes("explicit-null"))
})

test("an effort the cli would reject never reaches the dial", () => {
  const bad = [{ provider: "google", model: "x", effort: "xhigh", score: 9999, price: 0.01 }]
  assert.deepEqual(dialFor(bad, ["google"]), {}, "agy takes no xhigh")
  assert.match(unusable(bad)[0].why, /does not take the effort/)
})

test("everything the dial cannot use is reported rather than dropped silently", () => {
  const messy = [
    { provider: "nope", model: "x", effort: "" },
    { provider: "claude", model: "y", effort: "banana", score: 1, price: 1 },
    { provider: "claude", model: "z", effort: "max" },
  ]
  assert.deepEqual(unusable(messy).map((u) => u.entry.model), ["x", "y", "z"])
})

// --- the promise that a rung is a command that runs -------------------------

test("a rung renders as the command it is", () => {
  assert.equal(
    invocation({ provider: "claude", model: "some-future-model", effort: "max" }),
    "claude -p --model some-future-model --effort max",
  )
  assert.equal(
    invocation({ provider: "google", model: "some-future-slug", effort: "" }),
    "agy --model some-future-slug --print",
    "an empty effort drops the flag entirely",
  )
})
