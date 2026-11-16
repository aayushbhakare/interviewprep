import uuid
from django.db import transaction
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from apps.learning.models import (
    Roadmap,
    RoadmapConfigurationSnapshot,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
    RoadmapPracticeTask,
    TopicProgress,
    PracticeTaskProgress,
)
from apps.content.models import TopicContent
from apps.learning.services.catalog_service import validate_roadmap_input
from apps.ai_services.roadmap_ai_service import generate_roadmap_with_ai


def _get_phase_templates(
    role: str,
    language: str,
    framework: str,
    database: str,
    salary_tier: str,
    custom_role: str | None = None,
) -> list[dict]:
    effective_role = custom_role if role == "Other" and custom_role else role
    framework_name = framework or "Core Architecture"
    is_senior_tier = salary_tier in ["₹10–15 LPA", "₹15+ LPA"]
    is_mid_tier = salary_tier in ["₹5–7 LPA", "₹7–10 LPA"]

    phases = [
        {
            "phase_number": 1,
            "title": f"{language} Fundamentals & Runtime Architecture",
            "description": f"Master {language} language mechanics, memory model, and algorithmic foundations.",
            "weeks": [
                {
                    "week_number": 1,
                    "title": "Syntax, Control Flow & Data Structures",
                    "goal": f"Gain fluency in {language} primitives, control flow, and collection types.",
                    "topics": [
                        {
                            "title": f"{language} Variables, Scopes & Memory Layout",
                            "minutes": 45,
                            "depth": "fundamental",
                        },
                        {
                            "title": f"Collections & Complexity in {language}",
                            "minutes": 60,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Functions, Closures & Scope Chains",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Exception Handling & Defensive Programming",
                            "minutes": 40,
                            "depth": "fundamental",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Implement In-Memory LRU Cache with Frequency Tracking",
                            "task_type": "coding_exercise",
                            "difficulty": "Medium",
                            "estimated_minutes": 60,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": f"Build a bounded in-memory cache in {language} maintaining O(1) operations using native hash map and linked node abstractions.",
                            "problem_statement": f"Implement an LRU Cache data structure in {language} with capacity limits. Evict least recently used elements and track cache hit rates.",
                            "requirements": [
                                "Maintain O(1) average time complexity for get and put operations.",
                                "Update access sequence atomically on read operations.",
                                "Handle nil and non-existent keys gracefully without raising unhandled runtime errors.",
                            ],
                            "constraints": [
                                "Capacity up to 10,000 entries.",
                                "Standard library only; no third-party cache dependencies.",
                            ],
                            "sample_io": [
                                {
                                    "input": "cache = LRUCache(2); cache.put(1, 'A'); cache.put(2, 'B'); cache.get(1); cache.put(3, 'C')",
                                    "output": "cache.get(2) returns None (evicted)",
                                    "explanation": "Key 2 was evicted because Key 1 was refreshed by get(1).",
                                }
                            ],
                            "expected_deliverable": f"A clean {language} class implementation accompanied by verification test cases.",
                            "starter_code": f"# {language} LRU Cache Skeleton\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass",
                            "hints": [
                                "Consider combining a hash table for fast lookups with a doubly linked list for eviction ordering.",
                                "Guard against edge cases where capacity is 0 or 1.",
                            ],
                        },
                        {
                            "title": "Data Pipeline Exception Boundary & Resource Recovery",
                            "task_type": "debugging",
                            "difficulty": "Medium",
                            "estimated_minutes": 45,
                            "order": 2,
                            "related_topic_idx": 3,
                            "objective": f"Remediate resource leakage and unhandled exceptions in a {language} batch parsing routine.",
                            "problem_statement": "A batch ingestion worker crashes on malformed CSV records and leaves open file descriptors. Implement resilient error containment and isolation.",
                            "requirements": [
                                "Guarantee deterministic file descriptor closure using context managers.",
                                "Isolate malformed records into a structured dead-letter collection.",
                                "Log meaningful diagnostic context without exposing sensitive internal memory dumps.",
                            ],
                            "constraints": [
                                "Process at least 1,000 records under 50MB RAM."
                            ],
                            "sample_io": [
                                {
                                    "input": "records.csv with 980 valid lines and 20 corrupted lines",
                                    "output": "980 records saved, 20 quarantined in DLQ, 0 leaked descriptors",
                                    "explanation": "Clean batch completion with isolated error logging.",
                                }
                            ],
                            "expected_deliverable": "Refactored processing script with automated unit tests asserting resource closure on failure.",
                            "starter_code": "# Faulty batch processor\ndef process_batch(filepath):\n    f = open(filepath, 'r')\n    # Missing cleanup on error\n    lines = f.readlines()\n    return [int(x) for x in lines]",
                            "hints": [
                                "Use language context managers (`with` statement) to guarantee file closure.",
                                "Avoid broad catch-all exceptions that mask system signals.",
                            ],
                        },
                    ],
                },
                {
                    "week_number": 2,
                    "title": f"Object-Oriented Design & Idiomatic {language}",
                    "goal": f"Write clean, modular, and maintainable {language} code adhering to SOLID principles.",
                    "topics": [
                        {
                            "title": f"Object Models, Inheritance & Interfaces in {language}",
                            "minutes": 50,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Memory Management & Garbage Collection Mechanics",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": "File I/O, Serialization & String Manipulation",
                            "minutes": 45,
                            "depth": "fundamental",
                        },
                        {
                            "title": "Unit Testing & Mocking Foundations",
                            "minutes": 50,
                            "depth": "intermediate",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Refactor Monolithic ETL into Modular SOLID Components",
                            "task_type": "implementation",
                            "difficulty": "Medium",
                            "estimated_minutes": 60,
                            "order": 1,
                            "related_topic_idx": 0,
                            "objective": f"Deconstruct tightly-coupled procedural scripts into swappable interfaces adhering to Single Responsibility and Dependency Inversion in {language}.",
                            "problem_statement": "Refactor a monolithic script into distinct reader, parser, transformer, and persistence repository classes.",
                            "requirements": [
                                "Define abstract interfaces for DataSource and DataSink.",
                                "Inject dependencies via constructor rather than hardcoded instantiation.",
                                "Support adding new data sinks without editing transformer logic.",
                            ],
                            "constraints": [
                                "Maintain 100% functional parity with original script."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Decoupled class directory with unit tests using mocked data sinks.",
                            "starter_code": "# Monolithic script to refactor into SOLID components",
                            "hints": [
                                "Identify segments of code that change for different business reasons.",
                                "Keep constructors focused on dependency injection.",
                            ],
                        },
                        {
                            "title": "Automated Test Suite with Mocked Network Dependencies",
                            "task_type": "coding_exercise",
                            "difficulty": "Easy",
                            "estimated_minutes": 45,
                            "order": 2,
                            "related_topic_idx": 3,
                            "objective": "Author automated unit tests verifying third-party HTTP integrations using mock assertions.",
                            "problem_statement": "Write comprehensive unit tests for an external currency conversion client. Test 200 OK, 429 Rate Limited, 503 Service Unavailable, and timeout scenarios using mock objects.",
                            "requirements": [
                                "Zero real HTTP network requests during test runs.",
                                "Verify exponential retry backoff on HTTP 503.",
                                "Assert custom domain exception is raised on 401 Unauthorized.",
                            ],
                            "constraints": ["All tests execute in under 1 second."],
                            "sample_io": [],
                            "expected_deliverable": f"Test suite file achieving complete branch coverage of API client module in {language}.",
                            "starter_code": "# Test suite skeleton with mock fixtures",
                            "hints": [
                                "Use mock libraries or dependency injection to provide simulated HTTP responses."
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "phase_number": 2,
            "title": f"{framework_name} Architecture & API Development",
            "description": f"Build enterprise web backends and RESTful services using {framework_name}.",
            "weeks": [
                {
                    "week_number": 3,
                    "title": f"{framework_name} Core Lifecycle & Routing",
                    "goal": "Understand request-response flow, middleware pipeline, and controller patterns.",
                    "topics": [
                        {
                            "title": f"{framework_name} Request Dispatcher & URL Routing",
                            "minutes": 50,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Middleware Architecture & Request Interception",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Request Validation & Serialization Schemes",
                            "minutes": 55,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Dependency Injection & Service Configuration",
                            "minutes": 50,
                            "depth": "advanced",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Build Rate-Limiting & Audit Request Interceptor Middleware",
                            "task_type": "implementation",
                            "difficulty": "Medium",
                            "estimated_minutes": 55,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": f"Build a custom middleware pipeline in {framework_name} that applies token bucket rate-limiting and structured audit logging.",
                            "problem_statement": "Implement middleware that validates API keys, calculates per-minute request limits, injects correlation IDs (X-Request-ID), and logs request latency.",
                            "requirements": [
                                "Inject unique UUID correlation ID into request state and response headers.",
                                "Return HTTP 429 Too Many Requests when rate threshold exceeded.",
                                "Capture request duration in milliseconds for Prometheus metrics.",
                            ],
                            "constraints": [
                                "Middleware overhead must be < 2ms per request."
                            ],
                            "sample_io": [
                                {
                                    "input": "11 requests within 60s (limit 10)",
                                    "output": "10x 200 OK, 1x 429 Too Many Requests",
                                    "explanation": "Threshold enforced cleanly with Retry-After header.",
                                }
                            ],
                            "expected_deliverable": f"{framework_name} middleware module with automated test cases validating rejection and header injection.",
                            "starter_code": f"# {framework_name} Middleware Starter",
                            "hints": [
                                "Store token bucket timestamps in memory or Redis.",
                                "Handle client IP extraction behind reverse proxies.",
                            ],
                        },
                        {
                            "title": "Strict Payload Validation & Custom Sanitizer Engine",
                            "task_type": "coding_exercise",
                            "difficulty": "Easy",
                            "estimated_minutes": 40,
                            "order": 2,
                            "related_topic_idx": 2,
                            "objective": f"Create schema validators in {framework_name} rejecting SQL injection, XSS vectors, and malformed nested structures.",
                            "problem_statement": "Build a serializer/validator schema for a user registration payload with nested addresses. Enforce password complexity, international phone normalization, and disallow unknown fields.",
                            "requirements": [
                                "Reject payload containing unrecognized keys (strict schema).",
                                "Validate and normalize email to lowercase.",
                                "Sanitize HTML tags from user-provided bio string.",
                            ],
                            "constraints": [
                                "Produce standard error envelope on failure."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Validation schema module and test suite.",
                            "starter_code": "# Validation schema",
                            "hints": [
                                "Look into framework schema options or serializers."
                            ],
                        },
                    ],
                },
                {
                    "week_number": 4,
                    "title": "REST API Standards, Authentication & Error Envelopes",
                    "goal": "Design predictable, standard-compliant RESTful APIs with secure authentication.",
                    "topics": [
                        {
                            "title": "REST API Architecture & HTTP Semantics",
                            "minutes": 45,
                            "depth": "fundamental",
                        },
                        {
                            "title": "JWT Authentication, Refresh Cycles & Revocation",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": "Role-Based Access Control (RBAC) & Permissions",
                            "minutes": 50,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Centralized Error Handling & API Response Standardization",
                            "minutes": 40,
                            "depth": "intermediate",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Implement Stateless JWT Authentication Pipeline with Blacklist",
                            "task_type": "implementation",
                            "difficulty": "Hard",
                            "estimated_minutes": 75,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": "Implement full JWT authentication lifecycle: access token issuance (15m), refresh rotation, and token invalidation upon logout.",
                            "problem_statement": "Build the authentication service endpoints for token issuance, verification, refresh rotation, and logout blacklist.",
                            "requirements": [
                                "Access token signed with standard claims and 15m expiration.",
                                "Refresh token rotated upon every use.",
                                "Blacklisted refresh tokens stored and rejected on reuse.",
                            ],
                            "constraints": [
                                "Detect and revoke all tokens if a previously rotated refresh token is reused."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Authentication view controllers and test suite validating session invalidation.",
                            "starter_code": "# Auth views and token handlers",
                            "hints": [
                                "Store revoked token JTI (unique identifier) with remaining TTL."
                            ],
                        },
                        {
                            "title": "Production REST API CRUD Module with Standardized Response Envelope",
                            "task_type": "mini_project",
                            "difficulty": "Medium",
                            "estimated_minutes": 60,
                            "order": 2,
                            "related_topic_idx": 3,
                            "objective": f"Build a production-grade CRUD resource module in {framework_name} featuring pagination, filtering, and standard JSON envelopes.",
                            "problem_statement": "Create a Product catalog management API with endpoints for list, retrieve, create, update, and delete. Return unified `{ status, data, error }` envelopes and handle 404, 400, and 500 errors gracefully.",
                            "requirements": [
                                "Implement cursor or page-based pagination.",
                                "Standard response envelope on all endpoints.",
                                "Catch unhandled exceptions in a global error handler.",
                            ],
                            "constraints": ["Zero raw traceback leakage to client."],
                            "sample_io": [],
                            "expected_deliverable": "Controller, serializer, routing, and test suite.",
                            "starter_code": "# Resource controller",
                            "hints": [
                                "Use custom exception handler and response renderer."
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "phase_number": 3,
            "title": f"{database} Persistence & Query Optimization",
            "description": f"Architect relational data models, indexing strategies, and transactional workflows in {database}.",
            "weeks": [
                {
                    "week_number": 5,
                    "title": "Schema Design, Relationships & Normalization",
                    "goal": f"Design normalized entity structures and relational constraints in {database}.",
                    "topics": [
                        {
                            "title": f"{database} Table Constraints, Foreign Keys & Schema Normalization",
                            "minutes": 55,
                            "depth": "fundamental",
                        },
                        {
                            "title": "Complex Queries, Joins, Aggregations & Window Functions",
                            "minutes": 65,
                            "depth": "intermediate",
                        },
                        {
                            "title": "ACID Properties, Transactions & Isolation Levels",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": "ORM Integration & Overcoming the N+1 Query Problem",
                            "minutes": 50,
                            "depth": "intermediate",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Multi-Table Financial Ledger Joins & Window Aggregations",
                            "task_type": "sql_query",
                            "difficulty": "Medium",
                            "estimated_minutes": 50,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": f"Write high-performance {database} queries utilizing window functions, subqueries, and multi-table joins to generate financial statements.",
                            "problem_statement": f"Given tables for accounts, transactions, and categories in {database}, write queries to calculate running balances per account, monthly spending per category, and rank top 5 merchants.",
                            "requirements": [
                                "Use SUM() OVER (PARTITION BY account_id ORDER BY created_at) for running balance.",
                                "Use CTEs (Common Table Expressions) for readable query structure.",
                                "Handle NULL balances gracefully using COALESCE.",
                            ],
                            "constraints": [
                                "Avoid correlated subqueries; ensure linear scan or indexed lookups."
                            ],
                            "sample_io": [],
                            "expected_deliverable": f"A SQL script with schema, sample seed data, and verified {database} queries.",
                            "starter_code": f"-- {database} Schema and Query Skeleton",
                            "hints": [
                                "Use window functions with PARTITION BY and ORDER BY."
                            ],
                        },
                        {
                            "title": "Diagnose and Eliminate ORM N+1 Query Bottlenecks",
                            "task_type": "implementation",
                            "difficulty": "Medium",
                            "estimated_minutes": 45,
                            "order": 2,
                            "related_topic_idx": 3,
                            "objective": "Detect N+1 query patterns in an ORM query endpoint and optimize it to execute in constant O(1) database queries.",
                            "problem_statement": "An endpoint listing authors and their books executes 1 query for authors and 100 queries for their books (N+1). Optimize the query to execute in constant round trips.",
                            "requirements": [
                                "Use select_related (joins) or prefetch_related (batch lookups).",
                                "Assert query count using database query log or test assertions.",
                                "Measure and record latency reduction.",
                            ],
                            "constraints": [
                                "Query count must not scale with dataset size."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Optimized ORM repository module and automated test asserting query count.",
                            "starter_code": "# Inefficient query snippet to optimize",
                            "hints": [
                                "Use prefetch_related for reverse foreign key relationships."
                            ],
                        },
                    ],
                },
                {
                    "week_number": 6,
                    "title": "Indexing, Execution Plans & Performance Tuning",
                    "goal": "Diagnose query performance bottlenecks and optimize storage throughput.",
                    "topics": [
                        {
                            "title": (
                                f"{database} B-Tree Indexes, Composite Keys & Execution Plan Analysis"
                                if (is_senior_tier or is_mid_tier)
                                else f"{database} Basic Indexing & Query Optimization"
                            ),
                            "minutes": 60,
                            "depth": "advanced" if is_senior_tier else "intermediate",
                        },
                        {
                            "title": "Database Connection Pooling & Concurrency Controls",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Migrations, Seeders & Backward Compatibility in Production",
                            "minutes": 45,
                            "depth": "fundamental",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Index Strategy & Execution Plan Remediation",
                            "task_type": "sql_query",
                            "difficulty": "Hard",
                            "estimated_minutes": 60,
                            "order": 1,
                            "related_topic_idx": 0,
                            "objective": f"Analyze EXPLAIN ANALYZE output in {database}, identify sequential table scans, and architect composite indexes.",
                            "problem_statement": f"A query filtering on tenant_id, status, and created_at takes 450ms across 2M rows. Use EXPLAIN in {database} to diagnose the bottleneck and create an optimal index.",
                            "requirements": [
                                "Identify Seq Scan vs Index Scan in execution plan.",
                                "Create composite index adhering to equality-first rule (Equality, Range).",
                                "Verify query execution drops under 10ms.",
                            ],
                            "constraints": [
                                "Do not create redundant indexes that degrade write throughput."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "SQL migration creating index and markdown explaining execution plan before and after.",
                            "starter_code": "-- Write your CREATE INDEX statement here",
                            "hints": [
                                "Place equality filter columns first in composite index, then range/sort columns."
                            ],
                        },
                        {
                            "title": "Pessimistic vs Optimistic Locking Simulator",
                            "task_type": "coding_exercise",
                            "difficulty": "Hard",
                            "estimated_minutes": 60,
                            "order": 2,
                            "related_topic_idx": 1,
                            "objective": "Implement and compare pessimistic locking (SELECT FOR UPDATE) and optimistic locking (version column) in concurrent debit transactions.",
                            "problem_statement": "Simulate 50 concurrent requests attempting to purchase the last 5 inventory items. Implement both locking mechanisms to prevent over-selling and evaluate throughput.",
                            "requirements": [
                                "Pessimistic: Lock row within database transaction.",
                                "Optimistic: Use version check with retry loop on conflict.",
                                "Verify final inventory count is exactly 0 with zero oversold items.",
                            ],
                            "constraints": [
                                "Handle deadlock exceptions with retry backoff."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Backend test script running concurrent threads against test database.",
                            "starter_code": "# Concurrency test simulator",
                            "hints": [
                                "In optimistic locking, record updated rows; if 0, retry or abort."
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "phase_number": 4,
            "title": "Production Engineering & System Reliability",
            "description": "Prepare systems for real-world traffic, security hardening, and scalability.",
            "weeks": [
                {
                    "week_number": 7,
                    "title": "Caching, Background Processing & Scalability",
                    "goal": "Apply caching strategies and decouple heavy tasks from request loops.",
                    "topics": [
                        {
                            "title": "Cache-Aside Patterns, TTL Strategies & Redis Invalidation",
                            "minutes": 55,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Asynchronous Task Processing & Queue Idempotency",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": "Containerization with Docker & Environment Isolation",
                            "minutes": 50,
                            "depth": "fundamental",
                        },
                        {
                            "title": "Logging, Structured Tracing & Health Monitoring",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Build Idempotent Job Queue Worker with Lease Timeouts",
                            "task_type": "implementation",
                            "difficulty": "Hard",
                            "estimated_minutes": 70,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": "Implement a reliable background worker polling a database processing job ledger with atomic row-locking, lease renewal, and dead-letter handling.",
                            "problem_statement": "Design a worker loop that picks 'queued' tasks, updates status to 'running' with a lease timeout, executes the job, and updates to 'succeeded' or 'failed'. Reclaim expired leases safely.",
                            "requirements": [
                                "Use atomic query (SELECT FOR UPDATE SKIP LOCKED) to claim jobs without collisions.",
                                "Check idempotency key before running side effects.",
                                "Increment retry_count and transition to failed when max_retries reached.",
                            ],
                            "constraints": [
                                "Support multiple concurrent worker processes without double execution."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Worker daemon script and test suite simulating worker crashes.",
                            "starter_code": "# Worker loop starter",
                            "hints": [
                                "Use SKIP LOCKED to prevent workers blocking on locked rows."
                            ],
                        },
                        {
                            "title": "Two-Tier Distributed Cache with Stampede Protection",
                            "task_type": "coding_exercise",
                            "difficulty": "Medium",
                            "estimated_minutes": 50,
                            "order": 2,
                            "related_topic_idx": 0,
                            "objective": "Build a cache client combining fast local memory with shared Redis cache, incorporating mutex locks to prevent cache stampedes.",
                            "problem_statement": "When a popular cache key expires, thousands of incoming requests hit the database simultaneously. Implement single-flight mutex locking.",
                            "requirements": [
                                "Check L1 memory cache, then L2 Redis, then fallback to database.",
                                "Use distributed lock or single-flight pattern so only 1 worker queries DB on cache miss.",
                                "Warm cache with random jitter TTL.",
                            ],
                            "constraints": ["L1 lookup < 0.1ms; L2 lookup < 2ms."],
                            "sample_io": [],
                            "expected_deliverable": "Cache wrapper class with unit tests demonstrating stampede suppression.",
                            "starter_code": "# Cache client starter",
                            "hints": [
                                "Use a mutex lock on key computation so only one thread computes while others await."
                            ],
                        },
                    ],
                },
                {
                    "week_number": 8,
                    "title": "Security Hardening, Observability & Containerization",
                    "goal": "Harden backend endpoints against OWASP threats and build containerized artifacts.",
                    "topics": [
                        {
                            "title": "OWASP Top 10 Backend Vulnerability Mitigation",
                            "minutes": 50,
                            "depth": "advanced",
                        },
                        {
                            "title": "Structured Logging, Metrics & Health Probes",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                        {
                            "title": "Containerization with Multi-Stage Dockerfiles",
                            "minutes": 45,
                            "depth": "fundamental",
                        },
                        {
                            "title": "CI/CD Automation, Linting & Secret Management",
                            "minutes": 40,
                            "depth": "fundamental",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Audit and Patch Vulnerable Endpoints (SQLi, XSS, CSRF)",
                            "task_type": "debugging",
                            "difficulty": "Medium",
                            "estimated_minutes": 50,
                            "order": 1,
                            "related_topic_idx": 0,
                            "objective": "Conduct vulnerability remediation on an intentionally vulnerable web service and rewrite endpoints to remediate OWASP Top 10 flaws.",
                            "problem_statement": "Inspect vulnerable endpoint handlers (raw SQL interpolation, unsanitized user output rendering, missing CSRF tokens, and IDOR). Patch each vulnerability.",
                            "requirements": [
                                "Replace string interpolation with parameterized queries.",
                                "Apply context-aware HTML escaping.",
                                "Enforce authorization check that resource.user_id == current_user.id.",
                            ],
                            "constraints": [
                                "Zero regression of existing valid user workflows."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Patched endpoint code and security regression test suite.",
                            "starter_code": "# Vulnerable endpoint code to patch",
                            "hints": [
                                "Always use ORM parameterization or bind variables."
                            ],
                        },
                        {
                            "title": "Multi-Stage Production Dockerfile Optimization",
                            "task_type": "implementation",
                            "difficulty": "Easy",
                            "estimated_minutes": 40,
                            "order": 2,
                            "related_topic_idx": 2,
                            "objective": "Write a hardened multi-stage Dockerfile that builds assets in a builder stage and produces a lightweight non-root runtime image.",
                            "problem_statement": f"Create a Dockerfile for a {language} / {framework_name} web application. Reduce final image size, run as non-root user, and add a HEALTHCHECK directive.",
                            "requirements": [
                                "Multi-stage build separating compiler/dev dependencies from runtime.",
                                "Create and switch to non-root user.",
                                "Include functional HEALTHCHECK instruction querying /api/v1/health/.",
                            ],
                            "constraints": [
                                "Final image must not contain package managers or development compilers."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "Dockerfile, .dockerignore, and verification notes.",
                            "starter_code": "# Dockerfile starter",
                            "hints": [
                                "Copy only the compiled dependencies into final base."
                            ],
                        },
                    ],
                },
            ],
        },
        {
            "phase_number": 5,
            "title": "Technical Interview Mastery & Live Problem Solving",
            "description": "Targeted preparation for verbal interviews, code tracing, and architecture deep dives.",
            "weeks": [
                {
                    "week_number": 9,
                    "title": f"{effective_role} Interview Focus & Scenario Dissection",
                    "goal": "Articulate technical trade-offs and solve realistic production debugging scenarios.",
                    "topics": [
                        {
                            "title": f"Core {language} & {framework_name} Interview Traps & Pitfalls",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": (
                                "Distributed System Design: Microservices, Eventual Consistency & CAP"
                                if is_senior_tier
                                else "System Architecture & High-Level Design Principles"
                            ),
                            "minutes": 70,
                            "depth": "advanced",
                        },
                        {
                            "title": "Live Code Debugging: Diagnosing Deadlocks & Memory Leaks",
                            "minutes": 60,
                            "depth": "advanced",
                        },
                        {
                            "title": "Behavioral Engineering: Trade-off Justification & Post-Mortems",
                            "minutes": 45,
                            "depth": "intermediate",
                        },
                    ],
                    "practice_tasks": [
                        {
                            "title": "Real-World Scenario: Design Resilient URL Shortener with 10M DAU Scaling",
                            "task_type": "system_scenario",
                            "difficulty": "Hard",
                            "estimated_minutes": 90,
                            "order": 1,
                            "related_topic_idx": 1,
                            "objective": "Produce full component design, schema, caching layer, and failure recovery blueprint for a high-traffic URL shortener.",
                            "problem_statement": "Design a globally available URL shortener service handling 100M new links per month with a 10:1 read/write ratio. Detail database choice, hashing vs counter generation, cache sizing, and analytics telemetry.",
                            "requirements": [
                                "Calculate QPS, storage requirements for 5 years, and memory cache footprint.",
                                "Compare Base62 counter generation vs MD5/SHA256 truncation.",
                                "Design fallback strategy when cache layer fails.",
                            ],
                            "constraints": [
                                "Latency SLA: P99 < 50ms on redirect lookups."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "System architecture document with schema definitions, cache topology, and failure analysis.",
                            "starter_code": "# Architectural diagram and calculation notes",
                            "hints": [
                                "Size cache based on 80/20 rule (20% of URLs generate 80% of traffic)."
                            ],
                        },
                        {
                            "title": "Portfolio Project: Production-Grade Microservice Prototype",
                            "task_type": "portfolio_project",
                            "difficulty": "Hard",
                            "estimated_minutes": 120,
                            "order": 2,
                            "related_topic_idx": 0,
                            "objective": f"Deliver a complete, running {effective_role} portfolio project in {language} featuring auth, persistent storage, rate limiting, and test automation.",
                            "problem_statement": "Develop a production-ready REST service with comprehensive test coverage, Docker packaging, and automated CI configuration demonstrating full stack/backend competency.",
                            "requirements": [
                                "Full authentication and authorization pipeline.",
                                "Database migrations with at least 3 relational entities.",
                                "Automated unit and integration test suite passing with >80% coverage.",
                            ],
                            "constraints": [
                                "Fully deployable to any cloud container platform."
                            ],
                            "sample_io": [],
                            "expected_deliverable": "GitHub-ready repository structure with README and deployment guide.",
                            "starter_code": "# Portfolio project scaffold",
                            "hints": [
                                "Focus on code structure, clean commits, and comprehensive documentation."
                            ],
                        },
                    ],
                },
            ],
        },
    ]

    return phases


def _seed_topic_content_if_missing(
    topic_slug: str, title: str, language: str, framework: str
):
    if TopicContent.objects.filter(slug=topic_slug).exists():
        return

    learning_objectives = [
        f"Understand the core mechanics and design philosophy of {title}.",
        "Analyze memory, performance, and runtime complexity trade-offs.",
        "Demonstrate practical implementation in real engineering projects.",
        "Articulate nuances and edge cases during technical recruitment interviews.",
    ]

    concept_explanation = (
        f"{title} represents an essential engineering concept in {language} and modern {framework or 'backend'} systems. "
        "Engineers must grasp both the high-level API abstraction and the underlying operating system and memory behavior "
        "to build robust, scalable applications."
    )

    how_it_works = (
        "Under the hood, runtime execution manages state allocation, pointer resolution, and garbage collection or destruction cycles. "
        "When invoked, the runtime scheduler sequences instructions, verifies boundaries, and ensures consistent state transitions "
        "without triggering race conditions or unintended side effects."
    )

    examples = [
        {
            "description": "Standard Idiomatic Implementation",
            "code": f"// Example: {title}\n// Implements efficient standard flow\nfunction executeWorkflow() {{\n  // Safe execution with verified boundaries\n  return true;\n}}",
        }
    ]

    practical_implementation = (
        f"In real-world production services using {language}, {title} should always be paired with defensive exception handling, "
        "telemetry logging, and automated test coverage. Avoid premature optimization, but profile memory allocations before deploying."
    )

    interview_perspective = (
        f"Interviewers frequently test {title} by introducing subtle edge cases: nil/null pointer dereferences, concurrent mutation, "
        "or performance degradation under large inputs. Candidates should clearly explain the trade-offs between speed, memory overhead, "
        "and architectural maintainability."
    )

    key_takeaways = [
        "Focus on fundamental mechanics rather than rote memorization.",
        "Always account for edge cases and boundary conditions.",
        "Structure code for testability and predictable error containment.",
    ]

    TopicContent.objects.create(
        slug=topic_slug,
        topic_name=title,
        technology=language,
        version=1,
        learning_objectives=learning_objectives,
        concept_explanation=concept_explanation,
        how_it_works=how_it_works,
        examples=examples,
        practical_implementation=practical_implementation,
        interview_perspective=interview_perspective,
        key_takeaways=key_takeaways,
        is_published=True,
    )


@transaction.atomic
def generate_student_roadmap(user, data: dict, replace: bool = False) -> Roadmap:
    errors = validate_roadmap_input(data)
    if errors:
        raise ValidationError({"detail": errors})

    role = data["role"]
    custom_role = data.get("custom_role", "")
    effective_role = custom_role.strip() if role == "Other" and custom_role else role
    experience_level = data["experience_level"]
    target_salary = data.get("target_salary")
    language = data["language"]
    framework = data.get("framework") or ""
    database = data["database"]

    existing_active = Roadmap.objects.filter(user=user, is_active=True).first()
    if existing_active and not replace:
        raise ValidationError(
            {
                "detail": "An active roadmap already exists for your account. Use the replacement workflow to create a new one."
            }
        )

    # Create new Roadmap instance
    new_roadmap = Roadmap.objects.create(
        id=uuid.uuid4(),
        user=user,
        role=effective_role,
        experience_level=experience_level,
        target_salary=target_salary,
        language=language,
        framework=framework,
        database=database,
        status=Roadmap.STATUS_PREPARING,
        is_active=True,
    )

    # Save configuration snapshot
    RoadmapConfigurationSnapshot.objects.create(
        roadmap=new_roadmap,
        role=role,
        experience_level=experience_level,
        target_salary=target_salary,
        language=language,
        framework=framework,
        database=database,
        custom_role=custom_role,
    )

    # Build phases, weeks, topics, and hands-on practice tasks via AI Service (with deterministic fallback)
    templates = generate_roadmap_with_ai(
        role=role,
        experience_level=experience_level,
        target_salary=target_salary,
        language=language,
        framework=framework,
        database=database,
        custom_role=custom_role,
        fallback_generator=_get_phase_templates,
        user=user,
    )

    topic_order_counter = 1
    task_order_counter = 1

    for p_data in templates:
        phase = RoadmapPhase.objects.create(
            roadmap=new_roadmap,
            phase_number=p_data["phase_number"],
            title=p_data["title"],
            description=p_data.get("description", ""),
        )

        for w_data in p_data.get("weeks", []):
            week = RoadmapWeek.objects.create(
                phase=phase,
                week_number=w_data["week_number"],
                title=w_data["title"],
                goal=w_data.get("goal", ""),
            )

            created_topics = []
            for t_data in w_data.get("topics", []):
                slug = slugify(f"{language}-{t_data['title']}")
                topic_ref = RoadmapTopicReference.objects.create(
                    week=week,
                    topic_slug=slug,
                    title=t_data["title"],
                    order=topic_order_counter,
                    estimated_minutes=t_data.get("minutes", 45),
                    depth_level=t_data.get("depth", "intermediate"),
                )
                topic_order_counter += 1
                created_topics.append(topic_ref)

                # Initialize student learning progress (not_started)
                TopicProgress.objects.create(
                    roadmap=new_roadmap,
                    topic=topic_ref,
                    status=TopicProgress.STATUS_NOT_STARTED,
                )

                # Seed content in apps.content if not already seeded
                _seed_topic_content_if_missing(
                    slug, t_data["title"], language, framework
                )

            # Generate connected hands-on practice tasks for this week
            for task_data in w_data.get("practice_tasks", []):
                related_idx = task_data.get("related_topic_idx", 0)
                related_topic = (
                    created_topics[related_idx]
                    if created_topics and related_idx < len(created_topics)
                    else (created_topics[0] if created_topics else None)
                )

                task_obj = RoadmapPracticeTask.objects.create(
                    week=week,
                    related_topic=related_topic,
                    title=task_data["title"],
                    task_type=task_data.get("task_type", "coding_exercise"),
                    difficulty=task_data.get("difficulty", "Medium"),
                    estimated_minutes=task_data.get("estimated_minutes", 45),
                    order=task_order_counter,
                    objective=task_data.get(
                        "objective", f"Complete hands-on exercise: {task_data['title']}"
                    ),
                    problem_statement=task_data.get(
                        "problem_statement", task_data.get("objective", "")
                    ),
                    requirements=task_data.get("requirements", []),
                    constraints=task_data.get("constraints", []),
                    sample_io=task_data.get("sample_io", []),
                    expected_deliverable=task_data.get(
                        "expected_deliverable",
                        "Working implementation with verified tests",
                    ),
                    starter_code=task_data.get("starter_code", ""),
                    hints=task_data.get("hints", []),
                )
                task_order_counter += 1

                # Initialize student practice progress (not_started)
                PracticeTaskProgress.objects.create(
                    roadmap=new_roadmap,
                    task=task_obj,
                    status=PracticeTaskProgress.STATUS_NOT_STARTED,
                )

    # If replacing existing active roadmap, deactivate old one now that new one is ready
    if existing_active:
        existing_active.is_active = False
        existing_active.save(update_fields=["is_active"])

    new_roadmap.status = Roadmap.STATUS_READY
    new_roadmap.save(update_fields=["status"])

    # Prepare weekly quiz assignments for the new roadmap
    try:
        from apps.quizzes.services.quiz_service import (
            prepare_all_quiz_assignments_for_roadmap,
        )

        prepare_all_quiz_assignments_for_roadmap(new_roadmap)
    except Exception:
        pass

    return new_roadmap
