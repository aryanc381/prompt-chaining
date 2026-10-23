import 'dotenv/config';

export type CloudflareConfig = {
  accountId: string;
  apiToken: string;
  model: string;
};

// Reads the required Cloudflare settings and reports missing values together.
export function getCloudflareConfig(): CloudflareConfig {
  const values = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID?.trim(),
    apiToken: process.env.CLOUDFLARE_API_TOKEN?.trim(),
    model: process.env.CLOUDFLARE_AI_MODEL?.trim(),
  };
  const missing = [
    ['CLOUDFLARE_ACCOUNT_ID', values.accountId],
    ['CLOUDFLARE_API_TOKEN', values.apiToken],
    ['CLOUDFLARE_AI_MODEL', values.model],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  }

  return values as CloudflareConfig;
}
