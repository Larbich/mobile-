import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProviderId =
  | 'openrouter'
  | 'ollama'
  | 'gemini'
  | 'groq'
  | 'together'
  | 'mistral'
  | 'huggingface'
  | 'customOpenAI';

export type ProviderMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export type AiSettings = {
  activeProvider: ProviderId;
  providers: Record<ProviderId, ProviderConfig>;
};

export type LocalProfile = {
  id: string;
  name: string;
  email: string;
};

const AI_SETTINGS_KEY = 'muse.ai.settings.v1';
const LOCAL_PROFILE_KEY = 'muse.local.profile.v1';

export const PROVIDER_OPTIONS: Array<{ id: ProviderId; label: string }> = [
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'ollama', label: 'Ollama / Local Server' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'groq', label: 'Groq' },
  { id: 'together', label: 'Together AI' },
  { id: 'mistral', label: 'Mistral API' },
  { id: 'huggingface', label: 'Hugging Face Inference' },
  { id: 'customOpenAI', label: 'Custom OpenAI-Compatible' },
];

export const DEFAULT_AI_SETTINGS: AiSettings = {
  activeProvider: 'openrouter',
  providers: {
    openrouter: {
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/deepseek-r1:free',
    },
    ollama: {
      apiKey: '',
      baseUrl: 'http://127.0.0.1:11434',
      model: 'llama3.1:8b',
    },
    gemini: {
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-1.5-flash',
    },
    groq: {
      apiKey: '',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama3-8b-8192',
    },
    together: {
      apiKey: '',
      baseUrl: 'https://api.together.xyz/v1',
      model: 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
    },
    mistral: {
      apiKey: '',
      baseUrl: 'https://api.mistral.ai/v1',
      model: 'mistral-small-latest',
    },
    huggingface: {
      apiKey: '',
      baseUrl: 'https://router.huggingface.co/v1',
      model: 'Qwen/Qwen2.5-7B-Instruct',
    },
    customOpenAI: {
      apiKey: '',
      baseUrl: 'http://127.0.0.1:1234/v1',
      model: 'local-model',
    },
  },
};

export async function loadAiSettings(): Promise<AiSettings> {
  const raw = await AsyncStorage.getItem(AI_SETTINGS_KEY);
  if (!raw) return DEFAULT_AI_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as AiSettings;
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
      providers: {
        ...DEFAULT_AI_SETTINGS.providers,
        ...(parsed.providers || {}),
      },
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<void> {
  await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadLocalProfile(): Promise<LocalProfile | null> {
  const raw = await AsyncStorage.getItem(LOCAL_PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export async function saveLocalProfile(profile: LocalProfile): Promise<void> {
  await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

export async function clearLocalProfile(): Promise<void> {
  await AsyncStorage.removeItem(LOCAL_PROFILE_KEY);
}
