/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
  experimental: {
    // TTF fonts used by PDF invoice renderer (DejaVu, Cyrillic support for EU market)
    // must be bundled into serverless functions on Vercel.
    outputFileTracingIncludes: {
      "/api/**/*": ["./src/lib/fonts/**/*.ttf"],
      "/admin/**/*": ["./src/lib/fonts/**/*.ttf"],
      "/hu-admin/**/*": ["./src/lib/fonts/**/*.ttf"],
    },
  },
};

export default nextConfig;
