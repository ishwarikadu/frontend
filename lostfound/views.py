from importlib import reload
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from cloudinary.uploader import upload, destroy
from urllib3 import request
from .serializers import CustomTokenSerializer, RegisterSerializer, ReportSerializer
from django.utils import timezone
from .serializers import MatchSerializer
from django.conf import settings
from .ai_utils import compute_similarities, calculate_score
from .models import Report, Match
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .utils import success_response, error_response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from datetime import timedelta


# * AUTH *
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return success_response(
            "User registered successfully",
            None,
            status=status.HTTP_201_CREATED
        )
    return error_response(
        "Validation failed",
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "first_name": request.user.first_name,
        "email": request.user.email,
        "role": "admin" if request.user.is_staff else "user"
    })


# * REPORTS *
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def reports(request):

    if request.method == "GET":

        qs = Report.objects.all().order_by("-created_at")

        # --- FILTERS ---
        status_filter      = request.GET.get("status")
        category_filter    = request.GET.get("category")
        location_filter    = request.GET.get("location")
        search_query       = request.GET.get("search")
        date_from          = request.GET.get("date_from")    # YYYY-MM-DD
        date_to            = request.GET.get("date_to")      # YYYY-MM-DD
        reported_by_filter = request.GET.get("reported_by")  # email

        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        if category_filter:
            qs = qs.filter(category__icontains=category_filter)

        if location_filter:
            qs = qs.filter(location__icontains=location_filter)

        if search_query:
            qs = qs.filter(
                Q(item_name__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        if date_from:
            qs = qs.filter(date__gte=date_from)

        if date_to:
            qs = qs.filter(date__lte=date_to)

        if reported_by_filter:
            qs = qs.filter(reported_by__email=reported_by_filter)

        # --- PAGINATION ---
        try:
            page  = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 10))
        except ValueError:
            return error_response("page and limit must be integers", status=400)

        if page < 1 or limit < 1:
            return error_response("page and limit must be positive numbers", status=400)

        start        = (page - 1) * limit
        end          = start + limit
        total_count  = qs.count()
        paginated_qs = qs[start:end]

        return success_response(
            "Reports fetched successfully",
            {
                "total":   total_count,
                "page":    page,
                "limit":   limit,
                "results": ReportSerializer(paginated_qs, many=True).data
            }
        )

    if request.method == "POST":
        serializer = ReportSerializer(data=request.data)

        if serializer.is_valid():
            report_type = request.query_params.get("type", "lost").lower()

            if report_type == "found":
                serializer.save(reported_by=request.user, status="FOUND")
            else:
                serializer.save(reported_by=request.user, status="LOST")

            return success_response(
                "Report created successfully",
                serializer.data,
                status=201
            )

        return error_response("Validation failed", serializer.errors, status=400)



        # --- PAGINATION ---
        try:
            page  = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 10))
        except ValueError:
            return error_response("page and limit must be integers", status=400)

        if page < 1 or limit < 1:
            return error_response("page and limit must be positive numbers", status=400)

        start      = (page - 1) * limit
        end        = start + limit
        total_count = qs.count()
        paginated_qs = qs[start:end]

        return success_response(
            "Reports fetched successfully",
            {
                "total": total_count,
                "page": page,
                "limit": limit,
                "results": ReportSerializer(paginated_qs, many=True).data
            }
        )

    if request.method == "POST":
        serializer = ReportSerializer(data=request.data)

        if serializer.is_valid():
            report_type = request.query_params.get("type", "lost").lower()

            if report_type == "found":
                serializer.save(reported_by=request.user, status="FOUND")
            else:
                serializer.save(reported_by=request.user, status="LOST")

            return success_response(
                "Report created successfully",
                serializer.data,
                status=201
            )

        return error_response("Validation failed", serializer.errors, status=400)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def report_detail(request, pk):
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return error_response("Report not found", status=404)

    if request.method == "GET":
        return success_response(
            "Report fetched successfully",
            ReportSerializer(report).data
        )

    if report.reported_by != request.user and not request.user.is_staff:
        return error_response("Permission denied", status=403)

    if request.method == "PATCH":
        image = request.FILES.get("image")

        if image:
            if report.image_public_id:
                destroy(report.image_public_id)
            result = upload(image, folder="lost_found")
            report.image_url = result.get("secure_url")
            report.image_public_id = result.get("public_id")

        serializer = ReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return success_response("Report updated successfully", serializer.data)

        return error_response("Validation failed", serializer.errors, status=400)

    if request.method == "DELETE":
        if report.image_public_id:
            destroy(report.image_public_id)
        report.delete()
        return success_response("Report deleted successfully", None, status=200)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_returned(request, pk):
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return error_response("Report not found", status=404)

    if report.reported_by != request.user and not request.user.is_staff:
        return error_response("Not allowed", status=403)

    report.status = "RETURNED"
    report.save()
    return success_response("Report marked as RETURNED", None, status=200)


# * MATCHES *
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def matches(request):

    if request.method == "GET":
        if not request.user.is_staff:
            return error_response("Admin access required", status=403)

        qs = Match.objects.all().order_by("-created_at")
        return success_response(
            "Matches fetched successfully",
            MatchSerializer(qs, many=True).data,
            status=200
        )

    serializer = MatchSerializer(data=request.data)

    if not serializer.is_valid():
        return error_response("Validation failed", serializer.errors, status=400)

    lost  = serializer.validated_data["lost_report"]
    found = serializer.validated_data["found_report"]

    if lost.status != "LOST":
        return error_response("lost_report must have status LOST", status=400)

    if found.status != "FOUND":
        return error_response("found_report must have status FOUND", status=400)

    match = serializer.save(status="PENDING")
    return success_response(
        "Match created successfully",
        MatchSerializer(match).data,
        status=201
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_match(request):

    lost_id  = request.data.get("lost_id")
    found_id = request.data.get("found_id")
    score    = request.data.get("score")
    reason   = request.data.get("reason")

    try:
        lost  = Report.objects.get(pk=lost_id,  status="LOST")
        found = Report.objects.get(pk=found_id, status="FOUND")
    except Report.DoesNotExist:
        return error_response("Invalid report IDs", status=400)

    if lost.reported_by != request.user:
        return error_response("Only the LOST reporter can request claim", status=403)

    if found.is_matched:
        return error_response("This item is already matched", status=400)

    if Match.objects.filter(lost_report=lost, found_report=found, status="PENDING").exists():
        return error_response("Match already requested", status=400)

    match = Match.objects.create(
        lost_report=lost,
        found_report=found,
        match_score=score,
        reason=reason,
        status="PENDING"
    )

    return success_response(
        "Match request sent to admin",
        MatchSerializer(match).data,
        status=201
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def matches_pending(request):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    qs = Match.objects.filter(status="PENDING").order_by("-created_at")

    # --- FILTERS ---
    location_filter  = request.GET.get("location")
    date_from        = request.GET.get("date_from")
    date_to          = request.GET.get("date_to")
    min_score        = request.GET.get("min_score")
    max_score        = request.GET.get("max_score")
    search_query     = request.GET.get("search")

    if location_filter:
        qs = qs.filter(
            Q(lost_report__location__icontains=location_filter) |
            Q(found_report__location__icontains=location_filter)
        )

    if date_from:
        qs = qs.filter(created_at__date__gte=date_from)

    if date_to:
        qs = qs.filter(created_at__date__lte=date_to)

    if min_score:
        qs = qs.filter(match_score__gte=float(min_score))

    if max_score:
        qs = qs.filter(match_score__lte=float(max_score))

    if search_query:
        qs = qs.filter(
            Q(lost_report__item_name__icontains=search_query) |
            Q(found_report__item_name__icontains=search_query) |
            Q(reason__icontains=search_query)
        )

    return success_response(
        "Matches fetched successfully",
        MatchSerializer(qs, many=True).data,
        status=200
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def matches_approved(request):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    one_week_ago = timezone.now() - timedelta(weeks=1)

    # delete approved matches older than a week to save DB space
    Match.objects.filter(
        status="APPROVED",
        approved_at__lt=one_week_ago
    ).delete()

    qs = Match.objects.filter(
        status="APPROVED",
        approved_at__gte=one_week_ago
    ).order_by("-created_at")

    # --- FILTERS ---
    location_filter = request.GET.get("location")
    date_from       = request.GET.get("date_from")
    date_to         = request.GET.get("date_to")
    min_score       = request.GET.get("min_score")
    max_score       = request.GET.get("max_score")
    search_query    = request.GET.get("search")

    if location_filter:
        qs = qs.filter(
            Q(lost_report__location__icontains=location_filter) |
            Q(found_report__location__icontains=location_filter)
        )

    if date_from:
        qs = qs.filter(approved_at__date__gte=date_from)

    if date_to:
        qs = qs.filter(approved_at__date__lte=date_to)

    if min_score:
        qs = qs.filter(match_score__gte=float(min_score))

    if max_score:
        qs = qs.filter(match_score__lte=float(max_score))

    if search_query:
        qs = qs.filter(
            Q(lost_report__item_name__icontains=search_query) |
            Q(found_report__item_name__icontains=search_query) |
            Q(reason__icontains=search_query)
        )

    return success_response(
        "Matches fetched successfully",
        MatchSerializer(qs, many=True).data,
        status=200
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def matches_rejected(request):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    one_week_ago = timezone.now() - timedelta(weeks=1)

    # delete rejected matches older than a week to save DB space
    Match.objects.filter(
        status="REJECTED",
        approved_at__lt=one_week_ago
    ).delete()

    qs = Match.objects.filter(
        status="REJECTED",
        approved_at__gte=one_week_ago
    ).order_by("-created_at")

    # --- FILTERS ---
    location_filter = request.GET.get("location")
    date_from       = request.GET.get("date_from")
    date_to         = request.GET.get("date_to")
    min_score       = request.GET.get("min_score")
    max_score       = request.GET.get("max_score")
    search_query    = request.GET.get("search")

    if location_filter:
        qs = qs.filter(
            Q(lost_report__location__icontains=location_filter) |
            Q(found_report__location__icontains=location_filter)
        )

    if date_from:
        qs = qs.filter(approved_at__date__gte=date_from)

    if date_to:
        qs = qs.filter(approved_at__date__lte=date_to)

    if min_score:
        qs = qs.filter(match_score__gte=float(min_score))

    if max_score:
        qs = qs.filter(match_score__lte=float(max_score))

    if search_query:
        qs = qs.filter(
            Q(lost_report__item_name__icontains=search_query) |
            Q(found_report__item_name__icontains=search_query) |
            Q(reason__icontains=search_query)
        )

    return success_response(
        "Matches fetched successfully",
        MatchSerializer(qs, many=True).data,
        status=200
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_match(request, pk):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    try:
        match = Match.objects.get(pk=pk)
    except Match.DoesNotExist:
        return error_response("Match not found", status=404)

    match.status = "APPROVED"
    match.approved_by = request.user
    match.approved_at = timezone.now()
    match.save()

    match.lost_report.status = "RETURNED"
    match.lost_report.is_matched = True
    match.lost_report.save()

    match.found_report.status = "RETURNED"
    match.found_report.is_matched = True
    match.found_report.save()

    return success_response("Match approved successfully", None, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_match(request, pk):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    try:
        match = Match.objects.get(pk=pk)
    except Match.DoesNotExist:
        return error_response("Match not found", status=404)

    match.status = "REJECTED"
    match.approved_by = request.user
    match.approved_at = timezone.now()
    match.save()

    return success_response("Match Rejected", None, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unmatched_reports(request):
    if not request.user.is_staff:
        return error_response("Admin access required", status=403)

    qs = Report.objects.filter(is_matched=False).order_by("-created_at")

    # --- FILTERS ---
    status_filter   = request.GET.get("status")
    category_filter = request.GET.get("category")
    location_filter = request.GET.get("location")
    date_from       = request.GET.get("date_from")
    date_to         = request.GET.get("date_to")
    search_query    = request.GET.get("search")

    if status_filter:
        qs = qs.filter(status=status_filter.upper())

    if category_filter:
        qs = qs.filter(category__icontains=category_filter)

    if location_filter:
        qs = qs.filter(location__icontains=location_filter)

    if date_from:
        qs = qs.filter(date__gte=date_from)

    if date_to:
        qs = qs.filter(date__lte=date_to)

    if search_query:
        qs = qs.filter(
            Q(item_name__icontains=search_query) |
            Q(description__icontains=search_query)
        )

    return success_response(
        "Unmatched reports fetched successfully",
        ReportSerializer(qs, many=True).data,
        status=200
    )


# * AI BASED MATCHING *
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_match(request):

    api_key = request.headers.get("X-AI-KEY")
    if api_key != settings.AI_API_KEY:
        return error_response("Invalid AI key", status=403)

    report_id = request.data.get("report_id")
    if not report_id:
        return error_response("report_id is required", status=400)

    try:
        target = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        return error_response("Report not found", status=404)

    if target.status == "LOST":
        candidates = Report.objects.filter(status="FOUND", is_matched=False)
    else:
        candidates = Report.objects.filter(status="LOST", is_matched=False)

    candidate_texts = [c.description or "" for c in candidates]
    similarities = compute_similarities(target.description or "", candidate_texts)

    results = []
    for candidate, sim in zip(candidates, similarities):
        score, reason = calculate_score(target, candidate, sim)
        results.append({
            "report_id": candidate.id,
            "score": round(score, 2),
            "reason": reason,
        })

    results = sorted(results, key=lambda x: x["score"], reverse=True)[:5]

    return success_response(
        "AI matching completed",
        {
            "report_id": target.id,
            "matches": results
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def report_matches(request, pk):
    try:
        report = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return error_response("Report not found", status=404)

    if report.reported_by != request.user and not request.user.is_staff:
        return error_response("Permission denied", status=403)

    qs = Match.objects.filter(
        Q(lost_report=report) | Q(found_report=report)
    ).order_by("-created_at")

    return success_response(
        "Matches fetched successfully",
        MatchSerializer(qs, many=True).data,
        status=200
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def suggest_matches(request, pk):
    try:
        target = Report.objects.get(pk=pk)
    except Report.DoesNotExist:
        return error_response("Report not found", status=404)

    if target.reported_by != request.user and not request.user.is_staff:
        return error_response("Permission denied", status=403)

    if target.status == "LOST":
        candidates = Report.objects.filter(
            status="FOUND", is_matched=False
        ).exclude(id=target.id)
    else:
        candidates = Report.objects.filter(
            status="LOST", is_matched=False
        ).exclude(id=target.id)

    if not candidates.exists():
        return success_response(
            "No potential matches found",
            {"report_id": target.id, "matches": []},
            status=200
        )

    candidate_texts = [c.description or "" for c in candidates]
    similarities = compute_similarities(target.description or "", candidate_texts)

    results = []
    for candidate, sim in zip(candidates, similarities):
        score, reason = calculate_score(target, candidate, sim)
        pending_exists = Match.objects.filter(
            found_report=candidate,
            status="PENDING"
        ).exists()

        results.append({
            "report_id": candidate.id,
            "item_name": candidate.item_name,
            "category": candidate.category,
            "location": candidate.location,
            "date": candidate.date,
            "image_url": candidate.image_url,
            "score": round(score, 2),
            "reason": reason,
            "pending_claim": pending_exists
        })

    results = sorted(results, key=lambda x: x["score"], reverse=True)[:5]

    return success_response(
        "Suggestions generated",
        {"report_id": target.id, "matches": results},
        status=200
    )