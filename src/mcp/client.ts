import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { ConversationLog } from '../services/conversation-log.js';
import { createDemoMcpServer } from './server.js';

export type DemoMcpClient = {
  call<T>(name: string, args: Record<string, unknown>): Promise<T>;
  close(): Promise<void>;
};

const toolResults = {
  list_demo_customers: z.object({ customers: z.array(z.object({ id: z.string(), name: z.string(), organisation: z.string(), phone_number: z.string(), city: z.string() })) }),
  list_customer_tickets: z.object({ tickets: z.array(z.object({ id: z.string(), ticket_number: z.string() })) }),
  get_ticket_context: z.object({
    customer: z.object({ id: z.string(), name: z.string(), organisation: z.string(), phone_number: z.string(), city: z.string() }),
    ticket: z.object({
      id: z.string(), ticket_number: z.string(), technical_information: z.object({
        product: z.string(), windows_version: z.string(), vspace_version: z.string(),
        type_of_issue: z.string(), solution: z.string(), assigned_to: z.string(),
      }),
    }),
  }),
  record_unresolved_follow_up: z.object({ recorded: z.literal(true), callback_requested: z.literal(true), event_id: z.string() }),
};

// Connects the CLI to the local tools through the MCP client/server protocol in memory.
export async function createDemoMcpClient(log?: ConversationLog): Promise<DemoMcpClient> {
  const server = createDemoMcpServer(log);
  const client = new Client({ name: 'prompt-chaining-cli', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    async call<T>(name: string, args: Record<string, unknown>): Promise<T> {
      const result = await client.callTool({ name, arguments: args }) as CallToolResult;
      if (result.isError) throw new Error(`MCP tool ${name} failed: ${result.content.map(item => item.type === 'text' ? item.text : '').join(' ')}`);
      const text = result.content.find(item => item.type === 'text');
      if (!text || text.type !== 'text') throw new Error(`MCP tool ${name} returned no result.`);
      const parser = toolResults[name as keyof typeof toolResults];
      if (!parser) throw new Error(`Unknown MCP tool: ${name}`);
      return parser.parse(JSON.parse(text.text)) as T;
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}
