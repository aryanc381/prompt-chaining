import type OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Sends the current chat history to the configured Workers AI model and returns its reply.
export async function getAssistantReply(
  client: OpenAI,
  model: string,
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const completion = await client.chat.completions.create({ model, messages });
  const reply = completion.choices[0]?.message.content;

  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw new Error('The model returned an empty reply.');
  }

  return reply;
}
