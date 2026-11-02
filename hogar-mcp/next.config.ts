import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // postgres.js usa sockets de Node: se deja fuera del bundle.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
