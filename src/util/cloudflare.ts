import OpenAI from 'openai';
import type { CloudflareConfig } from './env.js';

// Creates the OpenAI-compatible client for this Cloudflare account's Workers AI endpoint.
export function createCloudflareClient(config: CloudflareConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiToken,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/v1`,
  });
}
