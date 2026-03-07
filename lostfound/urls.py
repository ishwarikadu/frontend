from django.urls import path
from .views import ( create_match, current_user, register, report_matches, reports, report_detail, mark_returned,  matches,
    matches_pending,
    matches_approved,
    matches_rejected,
    approve_match,
    reject_match, suggest_matches,
    unmatched_reports,
    ai_match)

urlpatterns = [
    path("register/", register),
    # reports
    path("reports/", reports),
    path("reports/<int:pk>/", report_detail),
    path("reports/<int:pk>/mark-returned/", mark_returned),
    # matches
    path("matches/", matches),
    path("matches/pending/", matches_pending),
    path("matches/approved/", matches_approved),
    path("matches/rejected/", matches_rejected),
    path("matches/<int:pk>/approve/", approve_match),
    path("matches/<int:pk>/reject/", reject_match),
    path("admin/reports/unmatched/", unmatched_reports),
    # Ai based matching endpoint 
    path("ai/match/", ai_match),
    path("reports/<int:pk>/matches/", report_matches),
    path("me/", current_user),
     path("create_match/",create_match),
     path("reports/<int:pk>/suggest-matches/", suggest_matches),

    ]