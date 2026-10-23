import { createInterface } from 'node:readline';
import { getAssistantReply } from './services/model.js';
import { createCloudflareClient } from './util/cloudflare.js';
import { getCloudflareConfig } from './util/env.js';

async function main() {
  let config;
  try {
    config = getCloudflareConfig();
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
    return;
  }

  const client = createCloudflareClient(config);
  const terminal = createInterface({ input: process.stdin, output: process.stdout });

  console.log('Cloudflare Workers AI chat. Type /exit to quit.');
  terminal.setPrompt('You: ');
  terminal.prompt();

  for await (const line of terminal) {
    const input = line.trim();
    if (input === '/exit') break;
    if (!input) {
      terminal.prompt();
      continue;
    }

    try {
      const reply = await getAssistantReply(client, config.model, [
        { role: 'user', content: input },
      ]);
      console.log(`\nAssistant: ${reply}\n`);
    } catch (error) {
      console.error(`\nCloudflare request failed: ${String(error)}`);
      process.exitCode = 1;
      break;
    }
    terminal.prompt();
  }

  terminal.close();
  console.log('\nChat ended.');
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exitCode = 1;
});
