import type OpenAI from 'openai';
import { parseStateResult, type ConversationState, type StateResult } from '../contracts/state-results.js';
import { basePrompt } from '../prompts/base.js';

// Sends the current message to the configured Workers AI model and returns its reply.
export async function getAssistantReply(
  client: OpenAI,
  model: string,
  message: string,
): Promise<string> {
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: message }],
  });
  const reply = completion.choices[0]?.message.content;

  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw new Error('The model returned an empty reply.');
  }

  return reply;
}

// Runs one stateless state prompt and validates its JSON result before returning it.
export async function getStateResult(
  client: OpenAI,
  model: string,
  state: ConversationState,
  statePrompt: string,
  message: string,
  context: Record<string, unknown>,
): Promise<StateResult> {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: `${basePrompt}\n\n${statePrompt}\n\nExplicit context JSON:\n${JSON.stringify(context)}` },
      { role: 'user', content: message },
    ],
  });
  const output = completion.choices[0]?.message.content;

  if (typeof output !== 'string' || output.trim().length === 0) {
    throw new Error('The model returned an empty state result.');
  }

  return parseStateResult(state, output);
}
