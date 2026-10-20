/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist mencoba me-require 'canvas' di Node; tidak dipakai di browser
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
