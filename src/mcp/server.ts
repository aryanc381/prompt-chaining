import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ConversationLog } from '../services/conversation-log.js';
import { createTicketTools } from './ticket-tools.js';

// Exposes the local ticket operations as MCP tools for the terminal client.
export function createDemoMcpServer(log?: ConversationLog): McpServer {
  const server = new McpServer({ name: 'prompt-chaining-demo', version: '1.0.0' });
  const tools = createTicketTools(log);

  server.registerTool('list_demo_customers', {
    description: 'List sample customers available for a demo conversation.',
    inputSchema: {},
  }, async () => ({ content: [{ type: 'text', text: JSON.stringify(await tools.listDemoCustomers()) }] }));

  server.registerTool('list_customer_tickets', {
    description: 'List the sample tickets belonging to a customer.',
    inputSchema: { customer_id: z.string().min(1) },
  }, async ({ customer_id }) => ({ content: [{ type: 'text', text: JSON.stringify(await tools.listCustomerTickets(customer_id)) }] }));

  server.registerTool('get_ticket_context', {
    description: 'Fetch the sample customer and technical details for a ticket.',
    inputSchema: { ticket_id: z.string().min(1) },
  }, async ({ ticket_id }) => ({ content: [{ type: 'text', text: JSON.stringify(await tools.getTicketContext(ticket_id)) }] }));

  if (log) {
    server.registerTool('record_unresolved_follow_up', {
      description: 'Append an unresolved callback request to this conversation log; never changes the ticket fixture.',
      inputSchema: {
        conversation_id: z.string().min(1),
        ticket_id: z.string().min(1),
        reason_description: z.string().trim().min(1),
      },
    }, async ({ conversation_id, ticket_id, reason_description }) => ({
      content: [{ type: 'text', text: JSON.stringify(await tools.recordUnresolvedFollowUp(conversation_id, ticket_id, reason_description)) }],
    }));
  }

  return server;
}
