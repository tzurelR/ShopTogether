// Backend addresses from .env.local (CDK outputs). Vite only exposes VITE_* variables.
const REQUIRED = [
  "VITE_REGION",
  "VITE_USER_POOL_ID",
  "VITE_USER_POOL_CLIENT_ID",
  "VITE_API_URL",
  "VITE_WEBSOCKET_URL",
];

const missing = REQUIRED.filter((name) => !import.meta.env[name]);
if (missing.length) {
  throw new Error(`Missing ${missing.join(", ")} in frontend/.env.local (see .env.example).`);
}

export const config = {
  region: import.meta.env.VITE_REGION,
  userPoolId: import.meta.env.VITE_USER_POOL_ID,
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
  apiUrl: import.meta.env.VITE_API_URL.replace(/\/$/, ""),
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL,
};
