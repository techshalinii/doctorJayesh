import type { NextConfig } from "next";
import path from "node:path";

function supabaseImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const { hostname } = new URL(raw);
    return [{ protocol: "https", hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(),
  },

  images: {
    remotePatterns: supabaseImagePatterns(),
    formats: ["image/avif", "image/webp"],
  },

  trailingSlash: true,

  async redirects() {
    return [
      { source: "/contact", destination: "/contact-us/", permanent: true },

      { source: "/category/uncategorized", destination: "/blog/", permanent: true },

      { source: "/elementor-hf/header", destination: "/", permanent: true },
      { source: "/elementor-hf/footer", destination: "/", permanent: true },
    ];
  },

  async rewrites() {
    const base = process.env.R2_PUBLIC_BASE?.replace(/\/$/, "");
    if (!base) return [];
    return [
      {
        source: "/wp-content/uploads/:path*",
        destination: `${base}/wp-content/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
