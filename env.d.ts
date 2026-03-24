declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    BASE_URL: string;
    AUTH_SECRET: string;

  }
}