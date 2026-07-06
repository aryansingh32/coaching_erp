import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tenant logos are hosted at arbitrary HTTPS URLs provided at runtime.
    // We allow all HTTPS sources; actual security is enforced at the API/CSP layer.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
