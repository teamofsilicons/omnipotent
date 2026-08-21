"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const PLACES = [
  { href: "/docs", label: "documentation" },
  { href: "/models", label: "models" },
  { href: "https://github.com/teamofsilicons/silicon-omni", label: "github" },
]

export function Chrome({ children }: { children: React.ReactNode }) {
  const here = usePathname()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const watch = () => setStuck(window.scrollY > 8)
    watch()
    window.addEventListener("scroll", watch, { passive: true })
    return () => window.removeEventListener("scroll", watch)
  }, [])

  // Anything marked .enter is released as it arrives, once.
  useEffect(() => {
    const waiting = document.querySelectorAll(".enter:not(.seen)")
    if (!waiting.length) return
    const eye = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("seen")
            eye.unobserve(entry.target)
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    )
    waiting.forEach((el) => eye.observe(el))
    return () => eye.disconnect()
  }, [here])

  return (
    <>
      <header className={`top${stuck ? " stuck" : ""}`}>
        <a href="/" className="wordmark">
          silicon omni
        </a>
        <nav>
          {PLACES.map((place) => (
            <a
              key={place.href}
              href={place.href}
              {...(here.startsWith(place.href) ? { "data-here": "" } : {})}
            >
              {place.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="end">
        <div className="row">
          <span>silicon omni</span>
          <a href="/docs">documentation</a>
          <a href="/models">models</a>
          <a href="/intelligence.json">the dial, as json</a>
          <a href="https://github.com/teamofsilicons/silicon-omni">library</a>
          <a href="https://pypi.org/project/silicon-omni/">pypi</a>
          <a href="https://github.com/teamofsilicons/silicon-omni/blob/main/CHANGELOG.md">changelog</a>
          <a href="https://github.com/teamofsilicons/omnipotent">this site</a>
          <a href="https://artificialanalysis.ai/evaluations/gdpval-aa">gdpval</a>
        </div>
      </footer>
    </>
  )
}
