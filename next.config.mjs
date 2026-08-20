import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
export default {
  // Pin the root: there are lockfiles above this directory that are none of our business.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
  // The dial is read by omni from anywhere, so it has to be open. Read-only:
  // changing it is a commit to models-gdpval.json, not a request.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ]
  },
}
