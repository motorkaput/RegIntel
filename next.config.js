/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    POSTMARK_API_TOKEN: process.env.POSTMARK_API_TOKEN,
  },
};

module.exports = nextConfig;