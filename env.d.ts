declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    STRIPE_SECRET_KEY?: string; // Optional: Stripe integration disabled
    STRIPE_WEBHOOK_SECRET?: string; // Optional: Stripe integration disabled
    BASE_URL: string;
    AUTH_SECRET: string;
    GOOGLE_GENERATIVE_AI_API_KEY: string;
  }
}