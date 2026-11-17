from apps.administration.models import PlatformSetting

DEFAULT_SETTINGS = {
    "aptitude_config": {
        "description": "Standardized cognitive aptitude testing configuration",
        "value": {
            "standalone_daily_limit": 5,
            "test_duration_minutes": 60,
            "total_questions": 45,
            "mixed_cutoff_percentage": 60.0,
            "categories": {"quantitative": 15, "logical": 15, "verbal": 15},
            "difficulties": {"Easy": 15, "Medium": 20, "Hard": 10},
        },
    },
    "quiz_config": {
        "description": "Weekly technical quiz configuration",
        "value": {
            "duration_minutes": 60,
            "max_attempts_per_quiz": 5,
            "question_count": 45,
            "pass_percentage": 60.0,
        },
    },
    "interview_config": {
        "description": "AI-powered voice interview practice configuration",
        "value": {
            "cooling_hours_technical": 24,
            "cooling_hours_hr": 24,
            "cooling_hours_mixed": 24,
            "default_provider": "deterministic",
            "model_name": "gemini-2.0-flash",
            "mixed_aptitude_cutoff": 60.0,
        },
    },
    "account_config": {
        "description": "Student registration and security configuration",
        "value": {
            "registration_enabled": True,
            "email_verification_required": True,
            "max_login_attempts": 5,
            "lockout_duration_minutes": 15,
        },
    },
    "maintenance_config": {
        "description": "Module-level and global platform maintenance configuration",
        "value": {
            "global_maintenance": False,
            "global_message": "The platform is currently undergoing scheduled maintenance. Please check back shortly.",
            "modules": {
                "learning": {
                    "enabled": False,
                    "message": "The Learn module is undergoing scheduled maintenance.",
                },
                "practice": {
                    "enabled": False,
                    "message": "Practice tasks are temporarily offline for updates.",
                },
                "quizzes": {
                    "enabled": False,
                    "message": "Weekly Quizzes are currently unavailable.",
                },
                "aptitude": {
                    "enabled": False,
                    "message": "Aptitude Practice is temporarily offline.",
                },
                "interviews_technical": {
                    "enabled": False,
                    "message": "Technical voice interviews are under maintenance.",
                },
                "interviews_hr": {
                    "enabled": False,
                    "message": "HR voice interviews are under maintenance.",
                },
                "interviews_mixed": {
                    "enabled": False,
                    "message": "Mixed recruitment simulation is under maintenance.",
                },
                "experiences": {
                    "enabled": False,
                    "message": "Share Interview Experience is currently in read-only mode.",
                },
            },
        },
    },
    "ai_models_config": {
        "description": "AI provider and service routing configuration",
        "value": {
            "learning_content": {
                "service_label": "Learning Content Generation",
                "provider": "deterministic",
                "model": "content-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 30,
            },
            "practice_tasks": {
                "service_label": "Practice Task Generation",
                "provider": "deterministic",
                "model": "task-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 30,
            },
            "quiz_generation": {
                "service_label": "Weekly Quiz Question Generation",
                "provider": "deterministic",
                "model": "quiz-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 30,
            },
            "quiz_evaluation": {
                "service_label": "Weekly Quiz Submission Evaluation",
                "provider": "deterministic",
                "model": "eval-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 45,
            },
            "aptitude_generation": {
                "service_label": "Aptitude Question Generation & Validation",
                "provider": "deterministic",
                "model": "aptitude-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 30,
            },
            "interview_generation": {
                "service_label": "Interview Scenario & Question Generation",
                "provider": "deterministic",
                "model": "interview-engine-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 30,
            },
            "voice_simulation": {
                "service_label": "Real-Time AI Voice Simulation",
                "provider": "deterministic",
                "model": "voice-dialogue-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 20,
            },
            "interview_evaluation": {
                "service_label": "Interview Performance Scorecard Evaluation",
                "provider": "deterministic",
                "model": "interview-eval-v1",
                "fallback_provider": "gemini",
                "status": "active",
                "timeout_seconds": 45,
            },
            "experience_moderation": {
                "service_label": "Policy Risk-Based Moderation",
                "provider": "deterministic",
                "model": "policy-moderation-v1",
                "fallback_provider": "none",
                "status": "active",
                "timeout_seconds": 15,
            },
            "question_extraction": {
                "service_label": "Student Question Extractor",
                "provider": "deterministic",
                "model": "regex-parser-v1",
                "fallback_provider": "none",
                "status": "active",
                "timeout_seconds": 15,
            },
        },
    },
}


def get_setting(key: str, default=None):
    setting = PlatformSetting.objects.filter(key=key).first()
    if setting:
        return setting.value
    if key in DEFAULT_SETTINGS:
        return DEFAULT_SETTINGS[key]["value"]
    return default


def set_setting(key: str, value, description: str = "", updated_by=None):
    setting, _ = PlatformSetting.objects.get_or_create(
        key=key,
        defaults={
            "description": description
            or DEFAULT_SETTINGS.get(key, {}).get("description", ""),
            "value": value,
        },
    )
    setting.value = value
    if description:
        setting.description = description
    setting.updated_by = updated_by
    setting.save()
    return setting


def get_all_settings():
    initialize_default_settings()
    settings = {}
    for s in PlatformSetting.objects.all():
        settings[s.key] = {
            "key": s.key,
            "description": s.description,
            "value": s.value,
            "updated_at": s.updated_at,
            "updated_by": s.updated_by.email if s.updated_by else None,
        }
    return settings


def initialize_default_settings():
    for key, data in DEFAULT_SETTINGS.items():
        PlatformSetting.objects.get_or_create(
            key=key,
            defaults={
                "description": data["description"],
                "value": data["value"],
            },
        )
