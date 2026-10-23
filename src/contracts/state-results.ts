import { z } from 'zod';

const reply = z.string().trim().min(1);

const identityVerificationResult = z.object({
  state: z.literal('identity_verification'),
  verification_status: z.enum(['matched', 'mismatched', 'unclear']),
  reply,
}).strict();

const identityMismatchResult = z.object({
  state: z.literal('identity_mismatch'),
  outcome: z.literal('closed'),
  reply: z.literal('Sorry to disturb you. Have a good day.'),
}).strict();

const resolutionPendingResult = z.object({
  state: z.literal('resolution_pending'),
  ticket_resolution: z.enum(['resolved', 'unresolved', 'unclear']),
  reason_provided: z.boolean(),
  reason_description: z.string(),
  reply,
}).strict().superRefine((result, context) => {
  const hasReason = result.reason_description.trim().length > 0;
  if (result.reason_provided !== hasReason) {
    context.addIssue({ code: 'custom', path: ['reason_description'], message: 'A reason must be present exactly when reason_provided is true.' });
  }
  if (result.ticket_resolution !== 'unresolved' && result.reason_provided) {
    context.addIssue({ code: 'custom', path: ['reason_provided'], message: 'Only an unresolved ticket can include an unresolved reason.' });
  }
});

const ticketResolvedResult = z.object({
  state: z.literal('ticket_resolved'),
  outcome: z.literal('closed'),
  reply,
}).strict();

const issueDescriptionGivenResult = z.object({
  state: z.literal('issue_description_given'),
  reason_description: z.string().trim().min(1),
  callback_requested: z.literal(true),
  reply,
}).strict();

const issueDescriptionPendingResult = z.object({
  state: z.literal('issue_description_pending'),
  reason_status: z.enum(['provided', 'unclear']),
  reason_description: z.string(),
  reply,
}).strict().superRefine((result, context) => {
  const hasReason = result.reason_description.trim().length > 0;
  if ((result.reason_status === 'provided') !== hasReason) {
    context.addIssue({ code: 'custom', path: ['reason_description'], message: 'A reason must be present exactly when reason_status is provided.' });
  }
});

export const stateResultSchema = z.discriminatedUnion('state', [
  identityVerificationResult,
  identityMismatchResult,
  resolutionPendingResult,
  ticketResolvedResult,
  issueDescriptionGivenResult,
  issueDescriptionPendingResult,
]);

export type ConversationState = z.infer<typeof stateResultSchema>['state'];
export type StateResult = z.infer<typeof stateResultSchema>;

// Parses strict JSON and rejects results for a different state than the active prompt.
export function parseStateResult(state: ConversationState, rawResult: string): StateResult {
  const result = stateResultSchema.parse(JSON.parse(rawResult));
  if (result.state !== state) {
    throw new Error(`Expected a ${state} result, received ${result.state}.`);
  }
  return result;
}
