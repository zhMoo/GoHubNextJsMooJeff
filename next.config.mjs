/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    // Allow next/image to show recipe photos from TheMealDB.
    remotePatterns: [new URL("https://www.themealdb.com/images/**")],
  },
};

export default nextConfig;
