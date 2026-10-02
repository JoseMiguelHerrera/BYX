/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config, { nextRuntime }) => {
    // `instrumentation.ts` starts the APY refresh loop, whose import graph
    // reaches `database/queries.ts` -> dotenv/postgres. Those are Node-only, and
    // Next also compiles instrumentation for the Edge runtime, where webpack
    // fails to resolve their `fs`/`path`/`os` requires. `register()` returns
    // before that import when NEXT_RUNTIME isn't "nodejs", so the modules are
    // never executed on Edge - this only stops the resolver from failing there.
    if (nextRuntime === "edge") {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // postgres.js
        net: false,
        tls: false,
        dns: false,
        crypto: false,
        stream: false,
        perf_hooks: false,
        // dotenv
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};
