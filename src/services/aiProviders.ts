import {
  loadAiSettings,
  ProviderId,
  ProviderMessage,
} from '@/services/providerStorage';

type GenerateOptions = {
  temperature?: number;
  maxTokens?: number;
};

type OpenAiLikePayload = {
  model: string;
  messages: ProviderMessage[];
  temperature?: number;
  max_tokens?: number;
};

const DEFAULT_BASE_URLS: Record<ProviderId, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  ollama: 'http://127.0.0.1:11434',
  gemini: 'https://generativelanguage.googleapis.com',
  groq: 'https://api.groq.com/openai/v1',
  together: 'https://api.together.xyz/v1',
  mistral: 'https://api.mistral.ai/v1',
  huggingface: 'https://router.huggingface.co/v1',
  customOpenAI: 'http://127.0.0.1:1234/v1',
};

export async function generateAiText(
  messages: ProviderMessage[],
  options: GenerateOptions = {}
): Promise<string> {
  const settings = await loadAiSettings();
  const provider = settings.activeProvider;
  const cfg = settings.providers[provider];
  const baseUrl = (cfg.baseUrl || DEFAULT_BASE_URLS[provider]).replace(/\/+$/, '');
  const model = cfg.model?.trim();

  if (!model) throw new Error(`Model is required for ${provider}.`);
  if (provider !== 'ollama' && provider !== 'customOpenAI' && !cfg.apiKey?.trim()) {
    throw new Error(`API key is required for ${provider}.`);
  }

  if (provider === 'gemini') {
    return callGemini({
      apiKey: cfg.apiKey || '',
      baseUrl,
      model,
      messages,
      options,
    });
  }

  if (provider === 'ollama') {
    return callOllama({
      baseUrl,
      model,
      messages,
      options,
    });
  }

  return callOpenAiCompatible({
    provider,
    apiKey: cfg.apiKey || '',
    baseUrl,
    model,
    messages,
    options,
  });
}

async function callOpenAiCompatible(args: {
  provider: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ProviderMessage[];
  options: GenerateOptions;
}) {
  const { provider, apiKey, baseUrl, model, messages, options } = args;
  const payload: OpenAiLikePayload = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 700,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + apiKey,
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://muse-local.app';
    headers['X-Title'] = 'Muse AI Clone Local Client';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `Provider error (${res.status})`);
  }

  return json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || 'No response.';
}

async function callOllama(args: {
  baseUrl: string;
  model: string;
  messages: ProviderMessage[];
  options: GenerateOptions;
}) {
  const { baseUrl, model, messages, options } = args;

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `Ollama error (${res.status})`);
  }

  return json?.message?.content || 'No response.';
}

async function callGemini(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ProviderMessage[];
  options: GenerateOptions;
}) {
  const { apiKey, baseUrl, model, messages, options } = args;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 700,
        },
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `Gemini error (${res.status})`);
  }

  return json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
}
