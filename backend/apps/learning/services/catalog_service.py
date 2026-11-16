SUPPORTED_ROLES = [
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Java Developer",
    "Python Developer",
    "Software Tester / QA",
    "Data Analyst",
    "Data Engineer",
    "DevOps Engineer",
    "Other",
]

SUPPORTED_EXPERIENCES = [
    "Fresher",
    "Less than 1 year",
    "1–3 years",
    "3–5 years",
    "5+ years",
]

SUPPORTED_SALARIES = [
    "Below ₹3 LPA",
    "₹3–5 LPA",
    "₹5–7 LPA",
    "₹7–10 LPA",
    "₹10–15 LPA",
    "₹15+ LPA",
    "Skip",
]

SUPPORTED_LANGUAGES = [
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "C",
    "C++",
    "C#",
    "PHP",
    "Go",
    "Ruby",
    "Kotlin",
    "Swift",
    "Rust",
    "Other",
]

LANGUAGE_FRAMEWORK_MATRIX = {
    "Python": ["Django", "FastAPI", "Flask", "Other"],
    "Java": ["Spring Boot", "Micronaut", "Quarkus", "Other"],
    "JavaScript": ["Express.js", "NestJS", "Next.js", "Fastify", "React", "Other"],
    "TypeScript": ["NestJS", "Express.js", "Next.js", "Fastify", "React", "Other"],
    "C#": [".NET Core / ASP.NET", "Other"],
    "PHP": ["Laravel", "Symfony", "Other"],
    "Go": ["Gin", "Fiber", "Echo", "Standard Library (net/http)", "Other"],
    "Ruby": ["Ruby on Rails", "Sinatra", "Other"],
    "Kotlin": ["Spring Boot", "Ktor", "Other"],
    "Swift": ["Vapor", "SwiftUI / UIKit", "Other"],
    "Rust": ["Actix Web", "Axum", "Rocket", "Other"],
    "C": ["Standard C / POSIX", "Other"],
    "C++": ["Boost.Asio", "Crow", "Qt", "Other"],
    "Other": ["Other"],
}

SUPPORTED_DATABASES = [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "SQLite",
    "Microsoft SQL Server",
    "Oracle Database",
    "Redis",
    "MariaDB",
    "Firebase",
    "Other",
]


def get_catalog_data() -> dict:
    return {
        "roles": SUPPORTED_ROLES,
        "experience_levels": SUPPORTED_EXPERIENCES,
        "salary_tiers": SUPPORTED_SALARIES,
        "languages": SUPPORTED_LANGUAGES,
        "frameworks_by_language": LANGUAGE_FRAMEWORK_MATRIX,
        "databases": SUPPORTED_DATABASES,
    }


def is_framework_compatible(language: str, framework: str) -> bool:
    compatible = LANGUAGE_FRAMEWORK_MATRIX.get(language, ["Other"])
    return framework in compatible


def validate_roadmap_input(data: dict) -> list[str]:
    errors = []
    role = data.get("role")
    custom_role = data.get("custom_role")
    experience = data.get("experience_level")
    salary = data.get("target_salary")
    language = data.get("language")
    framework = data.get("framework")
    database = data.get("database")

    if not role or role not in SUPPORTED_ROLES:
        errors.append("A valid target role must be selected.")
    elif role == "Other" and (not custom_role or not custom_role.strip()):
        errors.append("Please specify your custom target role.")

    if not experience or experience not in SUPPORTED_EXPERIENCES:
        errors.append("A valid experience level must be selected.")

    if salary and salary not in SUPPORTED_SALARIES:
        errors.append("Target salary range must be one of the supported tiers or 'Skip'.")

    if not language or language not in SUPPORTED_LANGUAGES:
        errors.append("A valid programming language must be selected.")

    if framework and language:
        if not is_framework_compatible(language, framework):
            errors.append(f"Framework '{framework}' is not compatible with language '{language}'.")

    if not database or database not in SUPPORTED_DATABASES:
        errors.append("A valid database must be selected.")

    return errors
