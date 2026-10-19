import { ChatMessage } from '@/types';

export async function createCooperAgentForUser() {
  throw new Error('Composio agent is disabled in local-first mode.');
}

export async function runComposioAgentForUser(_: {
  userId: string;
  messages: ChatMessage[];
}) {
  throw new Error('Composio agent is disabled in local-first mode.');
}

export function parseToolOutput() {
  return undefined;
}

export function mapMessages() {
  return [];
}
