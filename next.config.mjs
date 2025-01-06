import withSerwistInit from "@serwist/next";

const pages = ["/"];
const revision = Date.now().toString();

const withPWA = withSerwistInit({
  swSrc: "src/service-workers/sw.ts",
  swDest: "public/sw.js",
  exclude: [/public\/sw.js/, /dynamic-css-manifest.json/],
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  additionalPrecacheEntries: pages.map((url) => ({ url, revision })),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    nextScriptWorkers: true,
  },
};

export default withPWA(nextConfig);
