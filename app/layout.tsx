import type { Metadata } from "next"

import { Chrome } from "./chrome"
import "./globals.css"

export const metadata: Metadata = {
  title: "silicon omni — one interface for Claude Code, Codex and Antigravity",
  description:
    "A conversation that moves between vendors mid-flight and carries on where it left off. One Python object over three agentic CLIs, driven by the subscriptions you already pay for.",
  openGraph: {
    title: "silicon omni",
    description:
      "One interface for Claude Code, Codex and Antigravity. Move a conversation between vendors mid-flight and it carries on where it left off.",
    siteName: "silicon omni",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Chrome>{children}</Chrome>
      </body>
    </html>
  )
}
