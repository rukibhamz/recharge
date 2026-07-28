-- Allow any connector provider validated by the API (Mistral, Groq, Together, custom OpenAI-compat, …)
alter table public.llm_connectors
  drop constraint if exists llm_connectors_provider_check;

comment on column public.llm_connectors.provider is
  'Provider id from apps catalog (gemini, mistral, openai, groq, together, deepseek, fireworks, openrouter, anthropic, ollama, openai-compat, …). Validated in API.';
