# 08 — Security and Privacy Requirements

Security is a product requirement, not a final polish task. Implement controls incrementally and test them.

## Authentication and authorization

- Use Django custom user model with email login from the start.
- Use Django password hashing; never store plaintext passwords.
- Use SimpleJWT for access/refresh token authentication.
- Choose access/refresh lifetimes and refresh rotation/blacklisting deliberately; document them.
- Prefer secure refresh-token storage/transport appropriate to the deployment architecture. Do not casually store long-lived tokens in localStorage.
- Protect student and admin routes in frontend, but enforce every permission in backend.
- Admin has separate permissions and mandatory 2FA.
- No public admin registration; first admin provisioned securely, later admins invited.
- Rate-limit login, verification, password reset, and sensitive operations.
- Expire inactive sessions as planned.
- Verification and reset codes must expire, be single-use, rate-limited, and not be logged in plaintext.

## Secrets management

- Django config via python-decouple and backend `.env`.
- Vite variables are public after build; never place secrets there.
- Keep `.env`, credentials, local database dumps, and private files out of version control.
- Maintain `.env.example` with placeholder names only.
- Never commit Gemini API keys, Gmail App Password, Supabase service-role key, Django secret key, or database passwords.
- Use least-privilege credentials.
- Do not print secrets in exceptions/logs.

## Supabase resume storage

- Private bucket only.
- Validate PDF type and actual file content; do not trust filename or browser MIME type alone.
- Set a reasonable file-size limit (choose and document an initial limit before implementation).
- Generate random object keys; do not use user-supplied filenames as storage paths.
- Django checks ownership and authorization before issuing short-lived signed URLs or proxying access.
- Never expose service-role credentials to React.
- Delete/replace operations must update metadata and storage safely; handle partial failure.
- Store resume version metadata and interview snapshot references.
- Do not send resumes to Gemini unless the feature explicitly needs them and user consent/legal basis is established. Minimize extracted personal data.

## API and application security

- Use Django CSRF protections where cookie-based flows require them.
- Configure CORS narrowly for the local frontend origin; do not use wildcard credentials.
- Validate all request payloads and file uploads server-side.
- Use Django ORM and safe query patterns; avoid unsafe raw SQL.
- Protect against IDOR: verify user ownership for every user-specific object.
- Apply throttling/rate limits to expensive endpoints.
- Avoid leaking stack traces or provider details to clients.
- Use secure headers and production settings when deployment begins; do not pretend local development settings are production-safe.

## AI and prompt security

- Treat user input, uploaded text, and submitted experience content as untrusted data.
- Do not allow user content to override system/developer policy or application rules.
- Keep provider keys server-side.
- Validate structured output and enforce business rules in backend code, not by trusting the model.
- Do not let AI directly execute arbitrary SQL, shell commands, or unrestricted code.
- Sandbox code execution for coding questions before enabling it. Do not execute untrusted submissions on the Django host without isolation, resource limits, and security review.
- Avoid sending personal information to AI when not needed.
- Do not log full resumes, passwords, verification codes, raw tokens, or sensitive answer payloads.

## Privacy and retention

- Collect only required data.
- Make anonymity choice clear for public experience submissions.
- Internal identity remains available for moderation/abuse prevention, but must not be shown publicly when Anonymous is selected.
- Provide account deletion workflow with clear treatment of records that must be retained for security/legal reasons; define retention before production.
- Do not expose another student's roadmap, answers, resume, interview records, or private drafts.
- Historical quiz/interview records must be visible only to their owner and authorized admins.

## Admin security and audit

- Mandatory 2FA.
- Invitation-only.
- Log important settings and moderation actions with actor, timestamp, affected record, previous/new value, and result.
- Activity log read-only in UI and not deletable by admins.
- Secrets never visible in AI Model Management; show configured/not configured and masked metadata only.

## Security acceptance checklist

- [ ] Student A cannot access Student B's resources by changing IDs.
- [ ] Student cannot access admin APIs.
- [ ] Admin route and API require admin role and 2FA.
- [ ] Expired/invalid tokens are rejected.
- [ ] Login and verification rate limits work.
- [ ] Private resume cannot be fetched without authorization.
- [ ] No provider secrets exist in frontend bundle or Git history.
- [ ] Logs contain no secrets or unnecessary personal data.
- [ ] AI output is schema-validated and cannot override backend business rules.
- [ ] Destructive actions require confirmation and safe transaction handling.
