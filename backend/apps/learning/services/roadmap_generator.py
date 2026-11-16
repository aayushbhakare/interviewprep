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
    TopicProgress,
)
from apps.content.models import TopicContent
from apps.learning.services.catalog_service import validate_roadmap_input


def _get_phase_templates(role: str, language: str, framework: str, database: str, salary_tier: str) -> list[dict]:
    framework_name = framework or "Core Framework"
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
                        {"title": f"{language} Variables, Scopes & Memory Layout", "minutes": 45},
                        {"title": f"Collections & Complexity in {language}", "minutes": 60},
                        {"title": "Functions, Closures & Scope Chains", "minutes": 45},
                        {"title": "Exception Handling & Defensive Programming", "minutes": 40},
                    ],
                },
                {
                    "week_number": 2,
                    "title": f"Object-Oriented Design & Idiomatic {language}",
                    "goal": f"Write clean, modular, and maintainable {language} code adhering to SOLID principles.",
                    "topics": [
                        {"title": f"Object Models, Inheritance & Interfaces in {language}", "minutes": 50},
                        {"title": "Memory Management & Garbage Collection Mechanics", "minutes": 60},
                        {"title": "File I/O, Serialization & String Manipulation", "minutes": 45},
                        {"title": "Unit Testing & Mocking Foundations", "minutes": 50},
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
                        {"title": f"{framework_name} Request Dispatcher & URL Routing", "minutes": 50},
                        {"title": "Middleware Architecture & Request Interception", "minutes": 45},
                        {"title": "Request Validation & Serialization Schemes", "minutes": 55},
                        {"title": "Dependency Injection & Service Configuration", "minutes": 50},
                    ],
                },
                {
                    "week_number": 4,
                    "title": "REST API Standards, Authentication & Error Envelopes",
                    "goal": "Design predictable, standard-compliant RESTful APIs with secure authentication.",
                    "topics": [
                        {"title": "REST API Architecture & HTTP Semantics", "minutes": 45},
                        {"title": "JWT Authentication, Refresh Cycles & Revocation", "minutes": 60},
                        {"title": "Role-Based Access Control (RBAC) & Permissions", "minutes": 50},
                        {"title": "Centralized Error Handling & API Response Standardization", "minutes": 40},
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
                        {"title": f"{database} Table Constraints, Foreign Keys & Schema Normalization", "minutes": 55},
                        {"title": "Complex Queries, Joins, Aggregations & Window Functions", "minutes": 65},
                        {"title": "ACID Properties, Transactions & Isolation Levels", "minutes": 60},
                        {"title": "ORM Integration & Overcoming the N+1 Query Problem", "minutes": 50},
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
                        },
                        {"title": "Database Connection Pooling & Concurrency Controls", "minutes": 45},
                        {"title": "Migrations, Seeders & Backward Compatibility in Production", "minutes": 45},
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
                        {"title": "Cache-Aside Patterns, TTL Strategies & Redis Invalidation", "minutes": 55},
                        {"title": "Asynchronous Task Processing & Queue Idempotency", "minutes": 60},
                        {"title": "Containerization with Docker & Environment Isolation", "minutes": 50},
                        {"title": "Logging, Structured Tracing & Health Monitoring", "minutes": 45},
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
                    "week_number": 8,
                    "title": f"{role} Interview Focus & Scenario Dissection",
                    "goal": "Articulate technical trade-offs and solve realistic production debugging scenarios.",
                    "topics": [
                        {"title": f"Core {language} & {framework_name} Interview Traps & Pitfalls", "minutes": 60},
                        {
                            "title": (
                                "Distributed System Design: Microservices, Eventual Consistency & CAP"
                                if is_senior_tier
                                else "System Architecture & High-Level Design Principles"
                            ),
                            "minutes": 70,
                        },
                        {"title": "Live Code Debugging: Diagnosing Deadlocks & Memory Leaks", "minutes": 60},
                        {"title": "Behavioral Engineering: Trade-off Justification & Post-Mortems", "minutes": 45},
                    ],
                },
            ],
        },
    ]

    return phases


def _seed_topic_content_if_missing(topic_slug: str, title: str, language: str, framework: str):
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
        raise ValidationError({
            "detail": "An active roadmap already exists for your account. Use the replacement workflow to create a new one."
        })

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

    # Build phases, weeks, and topics
    templates = _get_phase_templates(
        role=effective_role,
        language=language,
        framework=framework,
        database=database,
        salary_tier=target_salary or "Standard",
    )

    topic_order_counter = 1
    for p_data in templates:
        phase = RoadmapPhase.objects.create(
            roadmap=new_roadmap,
            phase_number=p_data["phase_number"],
            title=p_data["title"],
            description=p_data["description"],
        )

        for w_data in p_data["weeks"]:
            week = RoadmapWeek.objects.create(
                phase=phase,
                week_number=w_data["week_number"],
                title=w_data["title"],
                goal=w_data["goal"],
            )

            for t_data in w_data["topics"]:
                slug = slugify(f"{language}-{t_data['title']}")
                topic_ref = RoadmapTopicReference.objects.create(
                    week=week,
                    topic_slug=slug,
                    title=t_data["title"],
                    order=topic_order_counter,
                    estimated_minutes=t_data["minutes"],
                )
                topic_order_counter += 1

                # Initialize student progress state (not_started)
                TopicProgress.objects.create(
                    roadmap=new_roadmap,
                    topic=topic_ref,
                    status=TopicProgress.STATUS_NOT_STARTED,
                )

                # Seed content in apps.content if not already seeded
                _seed_topic_content_if_missing(slug, t_data["title"], language, framework)

    # If replacing existing active roadmap, deactivate old one now that new one is ready
    if existing_active:
        existing_active.is_active = False
        existing_active.save(update_fields=["is_active"])

    new_roadmap.status = Roadmap.STATUS_READY
    new_roadmap.save(update_fields=["status"])
    return new_roadmap
