import withSerwistInit from "@serwist/next";

const pages = ["/"];
const revision = Date.now().toString();

const withPWA = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  exclude: [/public\/sw.js/],
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
