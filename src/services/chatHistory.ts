import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatThreadType = 'main' | 'side';
export type ChatMessageRole = 'user' | 'assistant';

type LocalChatThread = {
  id: string;
  user_email: string;
  type: ChatThreadType;
  title: string;
  has_unread_updates?: boolean;
  created_at: string;
  updated_at: string;
};

type LocalChatMessage = {
  id: string;
  user_email: string;
  thread_id: string;
  role: ChatMessageRole;
  content: string;
  metadata: any;
  created_at: string;
};

const THREADS_KEY = 'muse.chat.threads.v1';
const MESSAGES_KEY = 'muse.chat.messages.v1';

async function loadThreads(): Promise<LocalChatThread[]> {
  const raw = await AsyncStorage.getItem(THREADS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalChatThread[];
  } catch {
    return [];
  }
}

async function saveThreads(threads: LocalChatThread[]) {
  await AsyncStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

async function loadMessages(): Promise<LocalChatMessage[]> {
  const raw = await AsyncStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as LocalChatMessage[];
  } catch {
    return [];
  }
}

async function saveMessages(messages: LocalChatMessage[]) {
  await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const CreateNewThread = async (
  userEmail: string,
  type: ChatThreadType,
  title?: string
) => {
  const now = new Date().toISOString();
  const threads = await loadThreads();

  const thread: LocalChatThread = {
    id: makeId('thread'),
    user_email: userEmail,
    type,
    title: title || (type === 'main' ? 'Main Chat' : 'New Side Chat'),
    has_unread_updates: false,
    created_at: now,
    updated_at: now,
  };

  await saveThreads([thread, ...threads]);
  return thread;
};

export const getThread = async (threadId: string, userEmail?: string) => {
  const threads = await loadThreads();

  if (!threadId) {
    return (
      threads.find(
        (thread) => thread.type === 'main' && thread.user_email === userEmail
      ) || null
    );
  }

  return threads.find((thread) => thread.id === threadId) || null;
};

export const GetLatestThread = async (userEmail: string) => {
  const threads = await loadThreads();
  return (
    threads
      .filter((thread) => thread.user_email === userEmail)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null
  );
};

export const saveMessage = async (
  userEmail: string,
  threadId: string,
  role: ChatMessageRole,
  content: string,
  metadata: any
) => {
  const messages = await loadMessages();
  const threads = await loadThreads();
  const now = new Date().toISOString();

  const message: LocalChatMessage = {
    id: makeId('msg'),
    user_email: userEmail,
    thread_id: threadId,
    role,
    content,
    metadata,
    created_at: now,
  };

  await saveMessages([...messages, message]);

  const updatedThreads = threads.map((thread) =>
    thread.id === threadId
      ? {
          ...thread,
          updated_at: now,
          title:
            role === 'assistant' && content
              ? content.slice(0, 40)
              : thread.title,
        }
      : thread
  );

  await saveThreads(updatedThreads);
  return message;
};

export const updateMessage = async (
  messageId: string,
  content: string,
  metadata: any
) => {
  const messages = await loadMessages();
  let updated: LocalChatMessage | null = null;

  const next = messages.map((message) => {
    if (message.id !== messageId) return message;
    updated = { ...message, content, metadata };
    return updated;
  });

  await saveMessages(next);
  return updated;
};

export const LoadMessages = async (threadid: string) => {
  const messages = await loadMessages();
  return messages
    .filter((message) => message.thread_id === threadid)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
};

export const GetAllUserThreads = async (userEmail: string) => {
  const threads = await loadThreads();
  return threads
    .filter((thread) => thread.user_email === userEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const DeleteThread = async (threadId: string) => {
  const messages = await loadMessages();
  const threads = await loadThreads();

  const nextMessages = messages.filter((message) => message.thread_id !== threadId);
  const nextThreads = threads.filter((thread) => thread.id !== threadId);

  await saveMessages(nextMessages);
  await saveThreads(nextThreads);

  return { success: true };
};
