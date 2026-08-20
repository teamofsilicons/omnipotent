"use client"

import {
  Broadcast,
  ChatCircleDots,
  Database,
  TestTube,
  Door,
  DownloadSimple,
  Files,
  Gauge,
  Key,
  Wrench,
  Eye,
} from "@phosphor-icons/react/dist/ssr"
import { useEffect, useState } from "react"

import { Copy } from "../copy"
import { Ticks } from "../ticks"
import { SECTIONS } from "./content"

/**
 * The reference, with an optional second layer.
 *
 * "internal" is not a separate page, because the two would drift. It is the
 * same list with a second paragraph revealed, so what a call does and what it
 * turns into stay side by side.
 */

const ICONS: Record<string, React.ComponentType<{ size?: number; weight?: "bold" | "duotone" }>> = {
  DownloadSimple,
  Door,
  ChatCircleDots,
  Broadcast,
  Files,
  Key,
  Gauge,
  Database,
  TestTube,
}

export function Docs() {
  const [inside, setInside] = useState(false)
  const [here, setHere] = useState(SECTIONS[0].id)

  useEffect(() => {
    const eye = new IntersectionObserver(
      (entries) => {
        const showing = entries.filter((e) => e.isIntersecting)
        if (showing.length) setHere(showing[0].target.id)
      },
      { rootMargin: "-88px 0px -62% 0px" },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) eye.observe(el)
    })
    return () => eye.disconnect()
  }, [])

  return (
    <div className="shell docs">
      <aside className="toc">
        <ol>
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={here === s.id ? "here" : undefined}>
                {(() => {
                  const Icon = ICONS[s.icon]
                  return Icon ? <Icon size={15} weight="bold" /> : null
                })()}
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        <div className="toc-switch">
          <div className="switch" role="tablist">
            <button className={inside ? undefined : "on"} onClick={() => setInside(false)} role="tab">
              <Eye size={13} weight="bold" />
              surface
            </button>
            <button className={inside ? "on" : undefined} onClick={() => setInside(true)} role="tab">
              <Wrench size={13} weight="bold" />
              internal
            </button>
          </div>
          <p className="toc-hint">
            {inside
              ? "showing what each call turns into underneath"
              : "what each call does, and what it takes"}
          </p>
        </div>
      </aside>

      <div className="docs-body">
        <h1 className="rise">
          Documentation.{" "}
          <a
            className="release num"
            href="https://pypi.org/project/silicon-omni/"
            title="the release this page documents"
          >
            v0.2.0
          </a>
        </h1>
        <p className="lede rise" style={{ ["--i" as string]: 1, marginTop: "1.3rem", maxWidth: "34rem" }}>
          Every call omni exposes. Flip to <strong>internal</strong> at any point to see the flag,
          the JSON-RPC method or the file write it actually becomes.
        </p>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="doc-section enter">
            <div className="rule">
              {(() => {
                const Icon = ICONS[section.icon]
                return Icon ? <Icon size={14} weight="bold" /> : null
              })()}
              <span>{section.title.toLowerCase()}</span>
            </div>
            <p className="doc-blurb"><Ticks>{section.blurb}</Ticks></p>

            {section.code && (
              <div className="doc-code">
                <pre>
                  <code>{section.code}</code>
                </pre>
                <Copy text={section.code} />
              </div>
            )}

            {section.entries && (
              <dl className="entries">
                {section.entries.map((entry) => (
                  <div key={entry.call} className="entry">
                    <dt>
                      <code>{entry.call}</code>
                      {entry.takes && <span className="tag">{entry.takes}</span>}
                      {entry.gives && <span className="tag">→ {entry.gives}</span>}
                    </dt>
                    <dd>
                      <p><Ticks>{entry.does}</Ticks></p>
                      {entry.inside && (
                        <p className={`inside${inside ? " open" : ""}`}>
                          <Ticks>{entry.inside}</Ticks>
                        </p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {section.note && (
              <p className="doc-note">
                <Ticks>{section.note}</Ticks>
              </p>
            )}
          </section>
        ))}

        <div className="breath">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
