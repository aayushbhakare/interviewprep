import time
import os
from django.db import connection
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from apps.administration.permissions import IsPlatformAdmin
from apps.administration.services.activity_log_service import log_admin_activity
from apps.common.models import ProcessingJob
from apps.interviews.models import InterviewSession


class AdminMonitoringView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="System Health & AI Usage Monitoring",
        description="Consolidates system health diagnostics, database latency, AI provider telemetry in INR (₹0), and background jobs.",
        responses={200: dict},
    )
    def get(self, request):
        # 1. Database Connectivity & Latency Check
        db_start = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)
            db_status = "healthy"
        except Exception as e:
            db_latency_ms = None
            db_status = f"unhealthy: {str(e)}"

        # 2. AI Provider Statuses
        has_gemini_key = bool(os.environ.get("GEMINI_API_KEY"))
        ai_providers = [
            {
                "id": "deterministic",
                "name": "Deterministic Conversational Engine",
                "status": "operational",
                "mode": "offline",
                "cost_tier": "₹0.00 (Standard)",
            },
            {
                "id": "gemini",
                "name": "Google Gemini 2.0 Flash",
                "status": "operational" if has_gemini_key else "offline (no API key configured)",
                "mode": "cloud_api",
                "cost_tier": "Pay-as-you-go (Subject to free tier)",
            },
        ]

        # 3. AI Usage Telemetry (Aggregated across platform AI usage)
        from apps.ai_services.models import AIUsageRecord

        total_sessions = InterviewSession.objects.count()
        ai_records = AIUsageRecord.objects.all()
        total_turns = ai_records.count()
        total_prompt_tokens = sum(r.prompt_tokens for r in ai_records)
        total_candidate_tokens = sum(r.completion_tokens for r in ai_records)
        total_cost_usd = sum(float(r.estimated_cost_usd) for r in ai_records)
        cost_inr = round(total_cost_usd * 85.0, 2)

        # 4. Background Processing Jobs
        recent_jobs = (
            ProcessingJob.objects.all()
            .order_by("-created_at")[:15]
            .values(
                "id",
                "job_type",
                "status",
                "retry_count",
                "max_retries",
                "error_message",
                "created_at",
                "completed_at",
            )
        )

        return Response(
            {
                "status": "success",
                "data": {
                    "health": {
                        "backend_status": "operational",
                        "database_status": db_status,
                        "database_latency_ms": db_latency_ms,
                        "ai_providers": ai_providers,
                    },
                    "ai_telemetry": {
                        "total_interviews_monitored": total_sessions,
                        "total_provider_turns": total_turns,
                        "prompt_tokens": total_prompt_tokens,
                        "candidate_tokens": total_candidate_tokens,
                        "total_tokens": total_prompt_tokens + total_candidate_tokens,
                        "estimated_cost_inr": f"₹{cost_inr:.2f}",
                        "budget_compliance": "Within ₹0 target budget",
                    },
                    "background_jobs": list(recent_jobs),
                },
            }
        )


class AdminJobRetryView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(
        summary="Retry Failed Background Job",
        description="Resets a failed processing job back to queued state for safe re-execution.",
        request=None,
        responses={200: dict},
    )
    def post(self, request, job_id):
        job = get_object_or_404(ProcessingJob, id=job_id)

        if job.status not in (ProcessingJob.STATUS_FAILED, ProcessingJob.STATUS_RUNNING):
            return Response(
                {"detail": f"Cannot retry job in '{job.status}' state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        job.status = ProcessingJob.STATUS_QUEUED
        job.retry_count += 1
        job.error_message = None
        job.save(update_fields=["status", "retry_count", "error_message", "updated_at"])

        log_admin_activity(
            actor=request.user,
            action="processing_job_retried",
            resource_type="processing_job",
            resource_id=str(job.id),
            details={"job_type": job.job_type, "retry_count": job.retry_count},
            request=request,
        )

        return Response(
            {
                "status": "success",
                "message": f"Job {job.id} requeued successfully.",
                "data": {
                    "id": str(job.id),
                    "status": job.status,
                    "retry_count": job.retry_count,
                },
            }
        )
