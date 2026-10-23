import { runConversation } from './cli/conversation.js';
import { selectCustomerAndTicket } from './cli/select-customer.js';
import { createDemoMcpClient } from './mcp/client.js';
import { createConversationLog } from './services/conversation-log.js';
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
  const selectionMcp = await createDemoMcpClient();
  try {
    const selection = await selectCustomerAndTicket(selectionMcp);
    const log = await createConversationLog(selection.customerId, selection.ticketId);
    const mcp = await createDemoMcpClient(log);
    try {
      await runConversation({ client, model: config.model, mcp, log, selection });
    } finally {
      await mcp.close();
    }
  } catch (error) {
    console.error(`\nConversation stopped: ${String(error)}`);
    process.exitCode = 1;
  } finally {
    await selectionMcp.close();
  }
}

main().catch((error: unknown) => {
  console.error(String(error));
  process.exitCode = 1;
});
