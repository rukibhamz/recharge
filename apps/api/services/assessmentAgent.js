import { generateJson, getLastLlmProvider, hasAnyLlmProvider } from './llmProvider.js';
import { assessmentAgentMaxRetries } from '../config/llm.js';
import { getAssessmentTask } from './assessmentAgentTasks.js';

/**
 * Mini Assessment Agent — sole LLM interface for assessment language tasks.
 * Measurement (typeCode, burnout pct) stays in code; the agent only personalizes copy.
 */
export async function runAgentTask(taskId, input, { maxRetries } = {}) {
  const task = getAssessmentTask(taskId);
  if (!task) {
    throw new Error(`Unknown assessment agent task: ${taskId}`);
  }

  const retries =
    maxRetries != null ? maxRetries : assessmentAgentMaxRetries();

  if (!(await hasAnyLlmProvider())) {
    return {
      result: task.fallback(input),
      source: 'bank-fallback',
      attempts: 0,
    };
  }

  let lastErrors = [];
  let prompt = task.buildPrompt(input);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const parsed = await generateJson(prompt);
      const check = task.validate(parsed, input);
      if (check.ok) {
        return {
          result: check.value,
          source: getLastLlmProvider() ?? 'llm',
          attempts: attempt + 1,
        };
      }
      lastErrors = check.errors;
      console.warn(
        `[assessment-agent] ${taskId} validation failed (attempt ${attempt + 1}):`,
        lastErrors.join('; '),
      );
      if (attempt < retries) {
        prompt = task.repairPrompt(lastErrors, input);
      }
    } catch (err) {
      lastErrors = [err.message];
      console.warn(
        `[assessment-agent] ${taskId} LLM error (attempt ${attempt + 1}):`,
        err.message,
      );
      if (attempt < retries) {
        prompt = task.repairPrompt(lastErrors, input);
      }
    }
  }

  return {
    result: task.fallback(input),
    source: 'bank-fallback',
    attempts: retries + 1,
    errors: lastErrors,
  };
}

/**
 * Personalize a batch of anchors. Per-slot fallback if a rewrite fails.
 * Concurrency capped to avoid hammering providers.
 */
export async function personalizeAnchorBatch(taskId, anchors, context, { concurrency = 4 } = {}) {
  const results = new Array(anchors.length);
  let anyLlm = false;

  let index = 0;
  async function worker() {
    while (index < anchors.length) {
      const i = index;
      index += 1;
      const anchor = anchors[i];
      const { result, source } = await runAgentTask(taskId, {
        ...context,
        anchor,
        anchorIndex: i,
      });
      if (source !== 'bank-fallback') anyLlm = true;
      results[i] = { ...result, anchor, source };
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, anchors.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return {
    items: results,
    source: anyLlm ? (getLastLlmProvider() ?? 'llm') : 'bank-fallback',
  };
}
