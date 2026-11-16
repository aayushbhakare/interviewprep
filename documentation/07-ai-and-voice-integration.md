# 07 — AI, Gemini, and Voice Integration

## Provider strategy

Gemini API is the primary candidate for AI features. Gemini Live API is the first candidate for real-time voice interviews. Both choices are conditional on:
- Current API availability and account eligibility.
- Model capability and regional availability.
- Current free-tier quota/rate limits.
- Current pricing and data-use terms.
- Technical proof of concept.

A Gemini consumer subscription (including a subscription bundled with a mobile recharge) does not automatically provide API access, API credits, or unlimited app usage.

Do not enable paid usage or incur charges without explicit approval. Before implementation, check current official Google AI documentation and the account's actual API quota/terms. Record the date and source in the project docs.

## Provider adapter architecture

All provider integration must be behind backend interfaces, for example:
- `TextGenerationProvider`
- `StructuredEvaluationProvider`
- `ModerationProvider`
- `RealtimeVoiceProvider`

Business logic should not directly depend on a specific Gemini SDK. Keep prompts, provider clients, response schemas, retries, usage accounting, and error normalization in `ai_services`.

If Gemini is unavailable, the application must preserve user data and expose a clear pending/unavailable state. Do not silently substitute an untested provider.

## AI use cases

1. Learning content generation.
2. Weekly quiz answer evaluation.
3. Topic conceptual exercise evaluation.
4. Question generation and validation.
5. Interview experience moderation.
6. Voice interview conversation and interview feedback.
7. Aptitude question generation/validation where AI is used.

Use deterministic code execution/comparison when appropriate (coding test cases, SQL execution, output comparison); do not pay for AI to do tasks that can be evaluated safely and deterministically.

## Learning content quality pipeline

Use a hybrid approach:
1. Maintain a curated trusted documentation/reference library per technology.
2. Generate explanation/examples/exercises/interview perspective grounded in references.
3. Run automated checks: technical consistency, code execution, SQL results, outdated information, and schema validation.
4. Publish only when required checks pass.
5. Reuse content by technology/topic/content version; do not regenerate the same topic for every student.
6. Adapt depth to experience and target salary.
7. Version content. Updates must not erase progress.
8. Periodically check for outdated content.

Student-reported questions may be extracted from published experiences. Label them “Student Reported Interview Question”, include context/frequency only when supported, and do not claim independently verified. AI-generated questions must be labeled separately.

## Question bank pipeline

- Pre-generate and store questions; never generate live quiz questions during a timed attempt.
- Generate only when approved bank supply is insufficient.
- AI validates questions before bank admission.
- Failed/uncertain questions get up to 3 further reviews; then suspend from new assignments if confidence remains insufficient.
- Preserve question versions; never overwrite a version referenced by a historical attempt.
- Use reports, automated checks, and usage frequency to prioritize review.
- AI-only review initially; admin can inspect and intervene in suspended/reported items.

## Evaluation safety

- Validate AI output against a strict schema before saving.
- Store model, prompt/template version, evaluation method, status, and timestamps.
- Do not convert provider errors/timeouts into incorrect answers or zero scores.
- Preserve raw user submission before evaluation.
- Retry only safe/idempotent operations and cap retries.
- If still unresolved, mark Evaluation Pending and resume later.
- Show final score only after all 45 questions are evaluated.
- Keep AI feedback concise and grounded in the submitted answer and rubric.
- Do not expose hidden chain-of-thought or ask the model to reveal it. Request concise rubric-based explanations only.

## Cost controls

- Track requests, tokens/usage, model, feature, duration, and errors.
- Reuse cached reusable reference/content data where appropriate; do not cache one student's private evaluation as another student's.
- Use smaller/cheaper eligible models for routine tasks if quality is sufficient and verified.
- Rate-limit user-triggered AI operations.
- Avoid duplicate requests with idempotency keys.
- Set conservative budgets/limits and fail safely.
- Do not claim free-tier capacity is guaranteed or sufficient for production.

## Real-time voice proof of concept

Before building the full interview module, create a small isolated proof of concept to verify:
- Browser microphone permission and audio capture.
- Real-time spoken input and spoken output.
- Latency suitable for conversation.
- Manual interruption while AI is speaking.
- Silence detection and manual Done Speaking backup.
- Repeat/clarification behavior.
- Session expiration/reconnection.
- Secure short-lived credentials issued by Django.
- Actual API quota, model access, and cost constraints.

The permanent Gemini API key must never be exposed to the browser. If the provider supports ephemeral/session credentials, Django must authorize the user and issue short-lived credentials only. If not, use a secure backend-mediated transport that does not expose permanent secrets.

Do not assume the chosen provider supports every required behavior merely because it supports live audio. Test it.

## Interview behavior and evaluation

- Professional interviewer tone.
- AI follows role, experience, salary range, stack, and optional resume snapshot.
- No company-specific targeting.
- Realistic follow-ups; user can ask to repeat/clarify and can say “I don't know”.
- No skip button.
- Evaluate according to defined role/experience/salary standard.
- Result is PASS/FAIL only; feedback categories are technical knowledge where relevant, communication, problem-solving, weaknesses, and improvement suggestions.
- Do not display question-by-question evaluation or spoken transcript in the result UI.

## Moderation

Use automated risk-based moderation for experiences. A low-risk automated pass means content passed moderation, not proof of authenticity. High-risk items and reports go to admin review. Do not present AI decisions as verified facts.
