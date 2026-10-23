import type { ConversationState, StateResult } from './contracts/state-results.js';

// Chooses the next workflow state using validated fields only; unclear results keep the current state.
export function getNextState(state: ConversationState, result: StateResult): ConversationState | 'closed' {
  if (result.state !== state) throw new Error(`Cannot transition ${state} with a ${result.state} result.`);

  switch (result.state) {
    case 'identity_verification':
      if (result.verification_status === 'matched') return 'resolution_pending';
      if (result.verification_status === 'mismatched') return 'identity_mismatch';
      return state;
    case 'identity_mismatch':
    case 'ticket_resolved':
    case 'issue_description_given':
      return 'closed';
    case 'resolution_pending':
      if (result.ticket_resolution === 'resolved') return 'ticket_resolved';
      if (result.ticket_resolution === 'unresolved') return result.reason_provided ? 'issue_description_given' : 'issue_description_pending';
      return state;
    case 'issue_description_pending':
      return result.reason_status === 'provided' ? 'issue_description_given' : state;
  }
}
