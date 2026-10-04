# HTTP LLM decision provider

ChatCompletionsDecisionProvider implements real HTTP requests to a caller-supplied Chat Completions endpoint. Endpoint, model and credentials have no vendor default. A local compatible inference service or hosted provider can be configured; compatibility is checked by its actual response contract.

```ts
import { ChatCompletionsDecisionProvider } from './dist/index.js';
const decision = new ChatCompletionsDecisionProvider({
  endpoint: process.env.DECISION_ENDPOINT!, // full /chat/completions URL
  model: process.env.DECISION_MODEL!,
  apiKey: process.env.DECISION_API_KEY,
  timeoutMs: 30_000,
  maxRequestBytes: 262_144,
  maxResponseBytes: 262_144,
  maxCompletionTokens: 4_096,
});
// Supply decision to run({ ...yourEngineOptions, decision }, yourTask).
```

The request uses messages, max_completion_tokens and response_format: json_object. The reply must have choices[0].finish_reason equal to stop, a non-refusal message with string content, and JSON containing decisions for every candidate exactly once. JSON mode is a wire aid; local schema validation remains mandatory. Set jsonMode:false only for a compatible service that does not implement this field; its output must still parse and validate. Services/model families supporting different token parameters require a transport adapter rather than a silent guess.

The protocol follows [official structured output guidance](https://developers.openai.com/api/docs/guides/structured-outputs). JSON validity alone does not guarantee schema conformance or factual truth. The core is not tied to this API; CallbackDecisionProvider and the provider contract remain available.

The system prompt asks about material consequences; candidate/state content remains marked as data. State is scoped to candidate IDs before transport. HTTPS is required except loopback HTTP; redirects are rejected to prevent credential forwarding. Timeouts, request/output byte caps, token limits, incomplete responses, refusals and schema failures are handled explicitly. HTTP errors reveal status only, not raw provider response bodies. No implicit fallback or retry is performed. Transport metadata retains model, response ID, usage and prompt version; self-assessed confidence is not a calibrated probability.

Tests execute HTTP against a local fixture server and check request/reply conformance, state scoping, incomplete decisions, truncation, caps, timeout and HTTP errors. They do not prove a remote model's judgement quality. No live API call or paid evaluation was made to prepare the release.

For optional real evaluation, fill .env.example values into your environment and run npm run benchmark:live with ALLOW_LIVE_EVAL=1. This sends only checked-in synthetic fixtures and executes at most 15 requests: three decision calls plus four generation arms per case. Review the provider's costs/privacy before enabling it. It writes actual outputs and scores into ignored benchmark-results/; never commit credentials or private evaluation data.
