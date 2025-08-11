/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    APP_URL: process.env.APP_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    POSTMARK_TOKEN: process.env.POSTMARK_TOKEN,
    EMAIL_FROM: process.env.EMAIL_FROM,
    DEV_EMAIL_MODE: process.env.DEV_EMAIL_MODE,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

module.exports = nextConfig;