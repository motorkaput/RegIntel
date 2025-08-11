/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: false,
  },
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    POSTMARK_API_TOKEN: process.env.POSTMARK_API_TOKEN,
    FROM_EMAIL: process.env.FROM_EMAIL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig