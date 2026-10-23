import { select } from '@inquirer/prompts';
import type { DemoMcpClient } from '../mcp/client.js';

export type SelectedCustomerTicket = {
  customerId: string;
  ticketId: string;
  customer: { id: string; name: string; organisation: string; phone_number: string; city: string };
};

// Loads customer and ticket choices from the local MCP tools before the conversation starts.
export async function selectCustomerAndTicket(mcp: DemoMcpClient): Promise<SelectedCustomerTicket> {
  console.log('MCP: list_demo_customers');
  const customers = await mcp.call<{ customers: { id: string; name: string; organisation: string; phone_number: string; city: string }[] }>(
    'list_demo_customers', {},
  );
  console.log(`MCP result: ${customers.customers.length} sample customers`);
  const customerId = await select({
    message: 'Choose a sample customer',
    choices: customers.customers.map(customer => ({
      name: `${customer.name} — ${customer.organisation} (${customer.city})`,
      value: customer.id,
    })),
  });
  const customer = customers.customers.find(item => item.id === customerId);
  if (!customer) throw new Error('Selected customer is missing from the local fixture.');
  console.log(`MCP: list_customer_tickets(${customerId})`);
  const tickets = await mcp.call<{ tickets: { id: string; ticket_number: string }[] }>(
    'list_customer_tickets', { customer_id: customerId },
  );
  console.log(`MCP result: ${tickets.tickets.length} tickets`);
  const ticketId = await select({
    message: 'Choose a ticket',
    choices: tickets.tickets.map(ticket => ({ name: ticket.ticket_number, value: ticket.id })),
  });

  return { customerId, ticketId, customer };
}
