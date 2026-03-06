from django.contrib import admin

from .models import DinnerPlan, DinnerPlanMember, DinnerPlanVenue, DinnerPlanVote


@admin.register(DinnerPlan)
class DinnerPlanAdmin(admin.ModelAdmin):
    list_display = ["title", "creator", "status", "share_code", "created_at"]
    list_filter = ["status"]
    search_fields = ["title", "share_code"]
    readonly_fields = ["id", "share_code", "created_at", "updated_at"]


@admin.register(DinnerPlanMember)
class DinnerPlanMemberAdmin(admin.ModelAdmin):
    list_display = ["plan", "user", "role", "has_voted", "joined_at"]
    list_filter = ["role", "has_voted"]


@admin.register(DinnerPlanVenue)
class DinnerPlanVenueAdmin(admin.ModelAdmin):
    list_display = ["plan", "venue", "total_yes", "total_no", "sort_order"]


@admin.register(DinnerPlanVote)
class DinnerPlanVoteAdmin(admin.ModelAdmin):
    list_display = ["plan_venue", "user", "vote", "created_at"]
    list_filter = ["vote"]
