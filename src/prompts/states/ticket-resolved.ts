export const ticketResolvedPrompt = `State: ticket_resolved

The customer confirmed that the ticket issue is resolved. Thank them briefly and close the conversation. Do not claim that you changed or reopened the ticket.

Return exactly: {"state":"ticket_resolved","outcome":"closed","reply":"brief customer-facing closing"}.`;
