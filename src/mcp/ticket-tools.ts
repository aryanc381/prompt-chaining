import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { ConversationLog } from '../services/conversation-log.js';

const fixtureSchema = z.object({
  customers: z.array(z.object({
    id: z.string(), name: z.string(), organisation: z.string(), phone_number: z.string(), city: z.string(),
  })),
  tickets: z.array(z.object({
    id: z.string(), customer_id: z.string(), ticket_number: z.string(),
    technical_information: z.object({
      product: z.string(), windows_version: z.string(), vspace_version: z.string(),
      type_of_issue: z.string(), solution: z.string(), assigned_to: z.string(),
    }),
  })),
});

// Creates fixture-backed MCP operations and limits writes to the active conversation event log.
export function createTicketTools(log?: ConversationLog) {
  const fixturePath = resolve(process.cwd(), 'data/demo-data.json');
  const loadFixture = async () => fixtureSchema.parse(JSON.parse(await readFile(fixturePath, 'utf8')));

  return {
    // Returns identity fields for selection and verification; the selector omits the phone number from display.
    async listDemoCustomers() {
      const { customers } = await loadFixture();
      return { customers };
    },
    // Returns only the tickets associated with a known sample customer.
    async listCustomerTickets(customerId: string) {
      const { customers, tickets } = await loadFixture();
      if (!customers.some(customer => customer.id === customerId)) throw new Error('Unknown customer.');
      return { tickets: tickets.filter(ticket => ticket.customer_id === customerId).map(({ id, ticket_number }) => ({ id, ticket_number })) };
    },
    // Returns customer and technical ticket context after the orchestrator verifies identity.
    async getTicketContext(ticketId: string) {
      const { customers, tickets } = await loadFixture();
      const ticket = tickets.find(item => item.id === ticketId);
      if (!ticket) throw new Error('Unknown ticket.');
      const customer = customers.find(item => item.id === ticket.customer_id);
      if (!customer) throw new Error('Ticket has no matching customer.');
      return { customer, ticket };
    },
    // Records a callback request in the conversation log without mutating the fixture.
    async recordUnresolvedFollowUp(conversationId: string, ticketId: string, reasonDescription: string) {
      if (!log) throw new Error('No active conversation log.');
      if (conversationId !== log.conversation_id) throw new Error('Conversation ID does not match the active log.');
      const { tickets } = await loadFixture();
      if (!tickets.some(ticket => ticket.id === ticketId)) throw new Error('Unknown ticket.');
      const result = { recorded: true as const, callback_requested: true as const, event_id: randomUUID() };
      await log.append({ kind: 'mcp_action', tool: 'record_unresolved_follow_up', input: { ticket_id: ticketId, reason_description: reasonDescription }, result });
      return result;
    },
  };
}
