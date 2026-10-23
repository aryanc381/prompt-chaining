import type OpenAI from 'openai';

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
