import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

export type ConversationEvent = {
  at: string;
  kind: 'state_result' | 'mcp_action';
  state?: string;
  state_result?: unknown;
  tool?: string;
  input?: Record<string, unknown>;
  result?: unknown;
};

export type ConversationLog = {
  conversation_id: string;
  append(event: Omit<ConversationEvent, 'at'>): Promise<void>;
};

type LogFile = {
  conversation_id: string;
  customer_id: string;
  ticket_id: string;
  started_at: string;
  events: ConversationEvent[];
};

// Creates a conversation log that records state outputs and MCP actions, never the chat transcript.
export async function createConversationLog(customerId: string, ticketId: string): Promise<ConversationLog> {
  const conversationId = randomUUID();
  const directory = resolve(process.cwd(), 'data/conversations');
  const path = resolve(directory, `${conversationId}.json`);
  const log: LogFile = {
    conversation_id: conversationId,
    customer_id: customerId,
    ticket_id: ticketId,
    started_at: new Date().toISOString(),
    events: [],
  };
  await mkdir(directory, { recursive: true });
  await writeFile(path, `${JSON.stringify(log, null, 2)}\n`, { flag: 'wx' });

  return {
    conversation_id: conversationId,
    async append(event) {
      const current = JSON.parse(await readFile(path, 'utf8')) as LogFile;
      current.events.push({ at: new Date().toISOString(), ...event });
      await writeFile(path, `${JSON.stringify(current, null, 2)}\n`);
    },
  };
}
