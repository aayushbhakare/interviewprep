# Known Issues & Limitations

This document tracks known limitations, pending provider verifications, and temporary mock fallbacks.

---

## Active Issues & Workarounds

### 1. PostgreSQL Port Configuration
- **Detail:** macOS host runs an existing PostgreSQL instance on port 5432.
- **Resolution:** Dedicated development PostgreSQL instance (Homebrew PostgreSQL 18.4) is configured on port 5433 with trust authentication and databases `interview_platform` and `test_interview_platform`.

### 2. External Provider Status (Budget ₹0)
- **Gemini API:** Subject to actual free-tier quota and developer account enablement. Backend adapters implement deterministic mock/fallback modes for local development and offline testing so tests never depend on internet connectivity or billable credits.
- **Supabase Storage:** Requires project credentials for real cloud storage. A local filesystem mock storage provider is implemented for development to ensure offline resilience.
- **Gmail SMTP:** Requires user-provided App Password. Development uses Django's console email backend (`django.core.mail.backends.console.EmailBackend`) when credentials are not configured.

### 3. CodeRabbit GitHub App Authorization
- **Detail:** CodeRabbit configuration (`.coderabbit.yaml`) is configured and committed to the repository root.
- **Status:** Requires one-time GitHub App authorization by the repository owner at `https://github.com/apps/coderabbitai`. Until authorized for `aayushbhakare/interviewprep`, automated bot reviews on pull requests remain pending; manual code reviews and local test runs are executed.

### 4. Quiz Autosave Network Latency Tolerance
- **Detail:** In low-bandwidth network conditions, autosave or submit requests near the 75-minute timer deadline could arrive slightly past the cutoff.
- **Resolution:** Backend endpoints implement a 60-second grace buffer past the exact 4,500-second mark to accommodate client HTTP latency without rejecting valid in-flight answers.

### 5. Deterministic Fallback for AI Question Generation
- **Detail:** Real-time AI question generation via external LLM APIs can be subject to rate limits or network unavailability.
- **Resolution:** A local deterministic curriculum synthesis engine generates structured, schema-compliant questions across all categories and difficulties when API calls fail or offline mode is active, ensuring ₹0 operational cost.

### 6. Aptitude Timer & Network Grace Buffer
- **Detail:** In high-latency networks, student autosave requests and final submit calls near the 60-minute mark could experience transit delay.
- **Resolution:** Backend session endpoints compute remaining duration dynamically from server `started_at` timestamp and allow a 60-second grace buffer past the nominal 3,600s mark to avoid false rejections.

### 7. Aptitude Deterministic Offline Synthesis Engine
- **Detail:** Real-time AI question replenishment via Gemini API can be subject to external rate limits or API key quotas.
- **Resolution:** `AptitudeQuestionGenerator` synthesizes mathematically accurate cognitive foundation aptitude questions offline with complete step-by-step arithmetic explanations, ensuring ₹0 operational cost and continuous test suite reliability.

### 8. Web Speech API Browser Compatibility & Text Fallback
- **Detail:** Browser native speech recognition (`webkitSpeechRecognition` / `SpeechRecognition`) is supported out-of-the-box in Chromium/Chrome, Safari, and Edge, but requires explicit microphone permissions or may be disabled in headless environments.
- **Resolution:** The interactive simulation room includes an always-available manual text input and "Done Speaking" button alongside the voice interface, enabling uninterrupted practice across all devices, environments, and automated E2E test runs.

### 9. Voice Simulation Budget & Deterministic Provider
- **Detail:** Real-time conversational audio with external multimodal LLMs incurs token and audio streaming bandwidth expenses.
- **Resolution:** `DeterministicVoiceProvider` operates 100% offline at ₹0 cost with dynamic follow-ups, clarification handling, and binary PASS/FAIL rubrics tailored to compensation tiers, guaranteeing zero cloud expenditure. Staff administrators can toggle between Gemini and Deterministic providers via the admin console.

### 10. Automated Risk-Based Content Moderation Scope
- **Detail:** Deterministic keyword and regex scanning (`experiences_moderation_service.py`) reliably catches clear PII (phone, email, Aadhaar, tokens), spam/scam invite links, and profanity, but cannot detect subtly falsified corporate anecdotes or nuanced non-obvious claims without human context.
- **Resolution:** A high-visibility disclaimer confirms that moderation approval signifies compliance with content and policy safety standards, not corporate verification of authentic recruitment. Community issue reporting and staff moderation tools allow rapid investigation and one-click suspension if inaccurate content is surfaced.

### 11. Safe Versioning & Live Discoverability During Re-Review
- **Detail:** When an author edits a published experience, the previous approved version remains live to peers while the revision undergoes review.
- **Resolution:** Prevents sudden discovery feed churn or broken peer bookmarks. Upon moderator approval, the newer revision atomically replaces the canonical record; if rejected, the previous live version remains intact with moderator notes sent to the author.
