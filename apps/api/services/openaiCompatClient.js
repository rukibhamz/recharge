function extractJson(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());
    const start = trimmed.indexOf('{');
    const arrStart = trimmed.indexOf('[');
    const idx =
      start >= 0 && arrStart >= 0 ? Math.min(start, arrStart) : Math.max(start, arrStart);
    if (idx >= 0) return JSON.parse(trimmed.slice(idx));
    throw new Error('Response was not valid JSON');
  }
}

function chatCompletionsUrl(baseUrl) {
  const root = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  if (root.endsWith('/chat/completions')) return root;
  if (root.endsWith('/v1')) return `${root}/chat/completions`;
  return `${root}/v1/chat/completions`;
}

/**
 * OpenAI Chat Completions compatible
 * (OpenAI, Mistral, Groq, Together, DeepSeek, Fireworks, OpenRouter, LM Studio, vLLM, …).
 */
export async function generateOpenAiCompatibleJson(
  prompt,
  {
    apiKey,
    model,
    baseUrl,
    providerLabel,
    supportsJsonMode = true,
    requireApiKey = true,
  } = {},
) {
  if (requireApiKey && !apiKey) {
    throw new Error(`${providerLabel || 'OpenAI-compatible'} API key not configured`);
  }
  if (!model) throw new Error('Model is required');
  if (!baseUrl && providerLabel === 'openai-compat') {
    throw new Error('Base URL is required for custom OpenAI-compatible providers');
  }

  const url = chatCompletionsUrl(baseUrl);
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (providerLabel === 'openrouter') {
    headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL || 'https://recharge.app';
    headers['X-Title'] = process.env.OPENROUTER_APP_NAME || 'Recharge';
  }

  const body = {
    model,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: 'You are a precise JSON API. Respond with valid JSON only — no markdown.',
      },
      { role: 'user', content: prompt },
    ],
  };
  if (supportsJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.OPENAI_TIMEOUT_MS) || 120_000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    // Retry without json_object if the host rejects response_format
    if (
      supportsJsonMode &&
      res.status === 400 &&
      /response_format|json_object|not supported/i.test(errBody)
    ) {
      return generateOpenAiCompatibleJson(prompt, {
        apiKey,
        model,
        baseUrl,
        providerLabel,
        supportsJsonMode: false,
        requireApiKey,
      });
    }
    throw new Error(`${providerLabel || 'OpenAI-compatible'} ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${providerLabel || 'OpenAI-compatible'} returned empty content`);
  return extractJson(text);
}

export async function generateAnthropicJson(prompt, { apiKey, model, baseUrl }) {
  if (!apiKey) throw new Error('Anthropic API key not configured');
  if (!model) throw new Error('Model is required');

  const root = (baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  const res = await fetch(`${root}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.4,
      system:
        'You are a precise JSON API. Respond with valid JSON only — no markdown, no commentary.',
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(Number(process.env.ANTHROPIC_TIMEOUT_MS) || 120_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.content?.map((b) => b.text).filter(Boolean).join('\n');
  if (!text) throw new Error('Anthropic returned empty content');
  return extractJson(text);
}
