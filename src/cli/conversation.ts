import { createInterface } from 'node:readline/promises';
import type OpenAI from 'openai';
import type { StateResult, ConversationState } from '../contracts/state-results.js';
import { getNextState } from '../orchestrator.js';
import { identityMismatchPrompt } from '../prompts/states/identity-mismatch.js';
import { identityVerificationPrompt } from '../prompts/states/identity-verification.js';
import { issueDescriptionGivenPrompt } from '../prompts/states/issue-description-given.js';
import { issueDescriptionPendingPrompt } from '../prompts/states/issue-description-pending.js';
import { resolutionPendingPrompt } from '../prompts/states/resolution-pending.js';
import { ticketResolvedPrompt } from '../prompts/states/ticket-resolved.js';
import type { SelectedCustomerTicket } from './select-customer.js';
import type { DemoMcpClient } from '../mcp/client.js';
import type { ConversationLog } from '../services/conversation-log.js';
import { getStateResult } from '../services/model.js';

type TicketContext = {
  customer: { id: string; name: string; organisation: string; phone_number: string; city: string };
  ticket: { id: string; ticket_number: string; technical_information: Record<string, string> };
};

const prompts: Record<ConversationState, string> = {
  identity_verification: identityVerificationPrompt,
  identity_mismatch: identityMismatchPrompt,
  resolution_pending: resolutionPendingPrompt,
  ticket_resolved: ticketResolvedPrompt,
  issue_description_given: issueDescriptionGivenPrompt,
  issue_description_pending: issueDescriptionPendingPrompt,
};

function normalizeAnswer(message: string): string {
  return message.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getClearAnswer(state: ConversationState, message: string): StateResult | undefined {
  const answer = normalizeAnswer(message);

  if (state === 'identity_verification') {
    if (/^(yes|yeah|yep|correct)( i am| thats me| that is me)?$/.test(answer)) {
      return { state, verification_status: 'matched', reply: 'Thanks for confirming.' };
    }
    if (/^(no|nope|nah|not me|wrong person|wrong number|this is not me|this isnt me|no this is not me|no this isnt me)$/.test(answer)) {
      return { state, verification_status: 'mismatched', reply: 'Understood.' };
    }
  }

  if (state === 'resolution_pending') {
    if (/^(yes|yeah|yep|yes it is|yes the issue is resolved|the issue is resolved|it is resolved|resolved|it works now|fixed now)$/.test(answer)) {
      return { state, ticket_resolution: 'resolved', reason_provided: false, reason_description: '', reply: 'Thanks for confirming.' };
    }
    if (/^(no|nope|nah|not yet|not resolved|still not resolved|(no|nope|nah)( it)? (wasnt|was not|isnt|is not)( resolved| fixed| working)?|it (wasnt|was not|isnt|is not) resolved)$/.test(answer)) {
      return { state, ticket_resolution: 'unresolved', reason_provided: false, reason_description: '', reply: 'What is still not resolved in this ticket?' };
    }
  }

  return undefined;
}

// Runs the selected customer's stateless prompt chain, recording only validated results and MCP actions.
export async function runConversation(args: {
  client: OpenAI;
  model: string;
  mcp: DemoMcpClient;
  log: ConversationLog;
  selection: SelectedCustomerTicket;
}): Promise<void> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let state: ConversationState | 'closed' = 'identity_verification';
  let message = '';
  let context: Record<string, unknown> = { customer: args.selection.customer };
  let ticketContext: TicketContext | undefined;

  console.log(`\nCall audit demo — conversation ${args.log.conversation_id}`);
  console.log('Each turn is sent independently; prior chat messages are not saved or sent. Type /exit to stop.');
  console.log('State: identity_verification');

  try {
    while (state !== 'closed') {
      if (state !== 'identity_mismatch' && state !== 'ticket_resolved' && state !== 'issue_description_given') {
        message = (await terminal.question('\nYou: ')).trim();
        if (message === '/exit') break;
        if (!message) continue;
      }

      const clearAnswer = getClearAnswer(state, message);
      const result: StateResult = clearAnswer
        ? clearAnswer
        : await getStateResult(args.client, args.model, state, prompts[state], message, context);
      await args.log.append({ kind: 'state_result', state, state_result: result });
      const nextState = getNextState(state, result);
      const responseFollows = nextState !== state && ['identity_mismatch', 'ticket_resolved', 'issue_description_given', 'issue_description_pending'].includes(nextState);
      if (nextState === 'issue_description_pending') {
        console.log('\nAssistant: What is still not resolved in this ticket?');
      } else if (!responseFollows) {
        console.log(`\nAssistant: ${result.reply}`);
      }

      if (state === 'identity_verification' && result.state === 'identity_verification' && result.verification_status === 'matched') {
        console.log(`MCP: get_ticket_context(${args.selection.ticketId})`);
        ticketContext = await args.mcp.call<TicketContext>('get_ticket_context', { ticket_id: args.selection.ticketId });
        await args.log.append({
          kind: 'mcp_action', tool: 'get_ticket_context', input: { ticket_id: args.selection.ticketId },
          result: ticketContext,
        });
        console.log(`MCP result: loaded ticket ${ticketContext.ticket.ticket_number} and technical context`);
        context = { customer: ticketContext.customer, ticket: ticketContext.ticket };
      }

      if (state === 'resolution_pending' && result.state === 'resolution_pending' && result.ticket_resolution === 'unresolved' && result.reason_provided) {
        context = { ...ticketContext, reason_description: result.reason_description };
      }
      if (state === 'issue_description_pending' && result.state === 'issue_description_pending' && result.reason_status === 'provided') {
        context = { ...ticketContext, reason_description: result.reason_description };
      }

      if (state === 'issue_description_given' && result.state === 'issue_description_given') {
        console.log('MCP: record_unresolved_follow_up');
        const followUp = await args.mcp.call<{ recorded: true; callback_requested: true; event_id: string }>('record_unresolved_follow_up', {
          conversation_id: args.log.conversation_id,
          ticket_id: args.selection.ticketId,
          reason_description: result.reason_description,
        });
        console.log(`MCP result: callback requested and logged (${followUp.event_id}).`);
      }

      state = nextState;
      if (state !== 'closed') console.log(`State: ${state}`);
    }
  } finally {
    terminal.close();
  }
  console.log('\nConversation ended.');
}
