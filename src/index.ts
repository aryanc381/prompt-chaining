import { createInterface } from 'node:readline';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
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
  const messages: ChatCompletionMessageParam[] = [];
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

    messages.push({ role: 'user', content: input });
    try {
      const reply = await getAssistantReply(client, config.model, messages);
      messages.push({ role: 'assistant', content: reply });
      console.log(`\nAssistant: ${reply}\n`);
    } catch (error) {
      messages.pop();
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
