import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';

export function isAiConfigured() {
  return env.AI_PROVIDER === 'groq'
    ? Boolean(env.GROQ_API_KEY)
    : Boolean(env.OLLAMA_BASE_URL && env.OLLAMA_MODEL);
}

export function aiSetupMessage() {
  return env.AI_PROVIDER === 'groq'
    ? 'AI generation needs GROQ_API_KEY in the server environment.'
    : 'AI generation needs OLLAMA_BASE_URL and OLLAMA_MODEL in the server environment.';
}

function providerError(message, error) {
  if (error.status) return error;
  const timeout = error.name === 'AbortError';
  return httpError(502, 'AI_PROVIDER_UNAVAILABLE', timeout ? message : `Could not reach the configured ${env.AI_PROVIDER} AI provider.`);
}

async function groqCompletion({ messages, onToken, temperature, maxTokens, jsonSchema, signal }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: Boolean(onToken),
      ...(jsonSchema ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!response.ok) {
    if (response.status === 429) throw httpError(429, 'AI_RATE_LIMIT', 'Groq usage limit reached. Please wait a little and try again.');
    throw httpError(502, 'AI_PROVIDER_ERROR', `Groq could not generate a response (HTTP ${response.status}). Check the model and API key settings.`);
  }
  if (!onToken) {
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content?.trim();
    if (!content) throw httpError(502, 'AI_PROVIDER_ERROR', 'Groq returned an empty response. Please try again.');
    return content;
  }
  if (!response.body) throw httpError(502, 'AI_PROVIDER_ERROR', 'Groq returned no answer stream. Please try again.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  const readLine = line => {
    const value = line.trim();
    if (!value.startsWith('data:')) return;
    const data = value.slice(5).trim();
    if (!data || data === '[DONE]') return;
    const packet = JSON.parse(data);
    const token = packet.choices?.[0]?.delta?.content || '';
    if (token) { answer += token; onToken(token); }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      readLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
    }
    if (done) break;
  }
  readLine(buffer);
  if (!answer.trim()) throw httpError(502, 'AI_PROVIDER_ERROR', 'Groq returned an empty answer. Please try again.');
  return answer.trim().slice(0, 12_000);
}

async function ollamaCompletion({ messages, onToken, temperature, maxTokens, jsonSchema, signal }) {
  const response = await fetch(new URL('/api/chat', env.OLLAMA_BASE_URL), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({
      model: env.OLLAMA_MODEL,
      keep_alive: '15m',
      think: false,
      stream: Boolean(onToken),
      ...(jsonSchema ? { format: jsonSchema } : {}),
      options: { temperature, num_predict: maxTokens },
      messages,
    }),
  });
  if (!response.ok) throw httpError(502, 'AI_PROVIDER_ERROR', 'Ollama could not generate a response. Check that it is running and the selected model is available.');
  if (!onToken) {
    const result = await response.json();
    const content = result.message?.content?.trim();
    if (!content) throw httpError(502, 'AI_PROVIDER_ERROR', 'Ollama returned an empty response. Please try again.');
    return content;
  }
  if (!response.body) throw httpError(502, 'AI_PROVIDER_ERROR', 'Ollama returned no answer stream. Please try again.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  const readLine = line => {
    if (!line.trim()) return;
    const packet = JSON.parse(line);
    const token = packet.message?.content || '';
    if (token) { answer += token; onToken(token); }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      readLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
    }
    if (done) break;
  }
  readLine(buffer);
  if (!answer.trim()) throw httpError(502, 'AI_PROVIDER_ERROR', 'Ollama returned an empty answer. Please try again.');
  return answer.trim().slice(0, 12_000);
}

export async function generateCompletion(options) {
  if (!isAiConfigured()) throw httpError(503, 'AI_SETUP_REQUIRED', aiSetupMessage());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 90_000);
  try {
    const request = { ...options, signal: controller.signal };
    return env.AI_PROVIDER === 'groq' ? await groqCompletion(request) : await ollamaCompletion(request);
  } catch (error) {
    throw providerError(options.timeoutMessage || 'AI generation took too long. Try a shorter request.', error);
  } finally {
    clearTimeout(timer);
  }
}
