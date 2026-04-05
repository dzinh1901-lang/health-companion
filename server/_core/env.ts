export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  /** URL of the deployed frontend (e.g. https://your-app.vercel.app). Used for OAuth redirects. */
  frontendUrl: process.env.FRONTEND_URL ?? "",
};

/**
 * Validate that all required environment variables are present.
 * Exits the process with a descriptive error message if any are missing.
 * Call this once at server startup.
 */
export function validateEnv(): void {
  const required: [string, string][] = [
    ["DATABASE_URL", ENV.databaseUrl],
    ["JWT_SECRET", ENV.cookieSecret],
    ["OAUTH_SERVER_URL", ENV.oAuthServerUrl],
    ["VITE_APP_ID", ENV.appId],
  ];

  const missing = required.filter(([, val]) => !val).map(([key]) => key);
  if (missing.length > 0) {
    console.error(
      `[env] Missing required environment variables: ${missing.join(", ")}\n` +
        `      Set these in your Railway service environment (or .env for local dev).\n` +
        `      See .env.example for a full list of required variables.`,
    );
    process.exit(1);
  }

  if (ENV.isProduction && !ENV.frontendUrl) {
    console.warn(
      "[env] FRONTEND_URL is not set. OAuth web callbacks will redirect to " +
        "http://localhost:8081, which will not work in production. " +
        "Set FRONTEND_URL to your Vercel deployment URL.",
    );
  }
}
