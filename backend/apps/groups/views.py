from django.db import transaction
from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reviews.models import Review
from apps.venues.models import Venue

from .models import DinnerPlan, DinnerPlanMember, DinnerPlanVenue, DinnerPlanVote
from .serializers import (
    BatchVotesSerializer,
    DinnerPlanCreateSerializer,
    DinnerPlanSerializer,
)


def populate_venue_options(plan):
    """
    Auto-select venues for a dinner plan based on member preferences.

    Strategy:
    1. Find venues reviewed positively by plan members (rating >= 7).
    2. Filter by cuisine_filter if provided.
    3. Fill remaining slots with highly-rated venues.
    4. Limit to plan.max_venues (default 10).
    """
    max_venues = plan.max_venues or 10
    member_user_ids = list(
        plan.members.values_list("user_id", flat=True)
    )

    selected_venue_ids = []

    # Base queryset with optional cuisine filter
    base_qs = Venue.objects.all()
    if plan.cuisine_filter:
        base_qs = base_qs.filter(
            cuisine_type__icontains=plan.cuisine_filter
        )

    # Step 1: Venues liked by the most members (from their reviews with rating >= 7)
    if member_user_ids:
        social_venues = (
            base_qs.filter(
                reviews__user_id__in=member_user_ids,
                reviews__rating__gte=7,
            )
            .annotate(member_likes=Count("reviews__user", distinct=True))
            .order_by("-member_likes", "-rating")
            .values_list("id", flat=True)[:max_venues]
        )
        selected_venue_ids.extend(social_venues)

    # Step 2: Fill remaining slots with highly-rated venues
    remaining = max_venues - len(selected_venue_ids)
    if remaining > 0:
        top_rated = (
            base_qs.exclude(id__in=selected_venue_ids)
            .filter(reviews_count__gte=1)
            .order_by("-rating", "-reviews_count")
            .values_list("id", flat=True)[:remaining]
        )
        selected_venue_ids.extend(top_rated)

    # Step 3: If still not enough, add any remaining venues
    remaining = max_venues - len(selected_venue_ids)
    if remaining > 0:
        fallback = (
            base_qs.exclude(id__in=selected_venue_ids)
            .order_by("-rating")
            .values_list("id", flat=True)[:remaining]
        )
        selected_venue_ids.extend(fallback)

    # Create DinnerPlanVenue objects
    plan_venues = []
    for i, venue_id in enumerate(selected_venue_ids):
        plan_venues.append(
            DinnerPlanVenue(plan=plan, venue_id=venue_id, sort_order=i)
        )
    DinnerPlanVenue.objects.bulk_create(plan_venues, ignore_conflicts=True)


class CreateDinnerPlanView(APIView):
    """
    POST /api/groups/plans/ - Create a new dinner plan.

    Automatically adds the creator as host and populates venue options.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DinnerPlanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            plan = serializer.save(creator=request.user, status="voting")

            # Add creator as host member
            DinnerPlanMember.objects.create(
                plan=plan, user=request.user, role="host"
            )

            # Auto-populate venue options
            populate_venue_options(plan)

        response_serializer = DinnerPlanSerializer(
            plan, context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        """GET /api/groups/plans/ - List user's dinner plans."""
        plans = DinnerPlan.objects.filter(
            members__user=request.user
        ).select_related("creator", "selected_venue").prefetch_related(
            "members__user", "venue_options__venue"
        ).distinct().order_by("-created_at")

        serializer = DinnerPlanSerializer(
            plans, many=True, context={"request": request}
        )
        return Response(serializer.data)


class DinnerPlanDetailView(APIView):
    """
    GET /api/groups/plans/<id>/ - Get dinner plan details.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, plan_id):
        try:
            plan = (
                DinnerPlan.objects.select_related("creator", "selected_venue")
                .prefetch_related(
                    "members__user", "venue_options__venue"
                )
                .get(id=plan_id)
            )
        except DinnerPlan.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Dinner plan not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check membership
        is_member = plan.members.filter(user=request.user).exists()
        if not is_member:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You are not a member of this plan."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = DinnerPlanSerializer(plan, context={"request": request})
        return Response(serializer.data)


class JoinDinnerPlanView(APIView):
    """
    POST /api/groups/plans/join/ - Join a dinner plan via share code.

    Body: { "share_code": "ABCD1234" }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        share_code = request.data.get("share_code", "").strip().upper()
        if not share_code:
            return Response(
                {"error": {"code": "VALIDATION", "message": "Share code is required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = DinnerPlan.objects.get(share_code=share_code)
        except DinnerPlan.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Invalid share code."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if plan.status in ("cancelled", "decided"):
            return Response(
                {"error": {"code": "CONFLICT", "message": "This plan is no longer accepting members."}},
                status=status.HTTP_409_CONFLICT,
            )

        # Check if already a member
        if plan.members.filter(user=request.user).exists():
            serializer = DinnerPlanSerializer(plan, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        with transaction.atomic():
            DinnerPlanMember.objects.create(
                plan=plan, user=request.user, role="member"
            )

        # Re-fetch with prefetches
        plan = (
            DinnerPlan.objects.select_related("creator", "selected_venue")
            .prefetch_related("members__user", "venue_options__venue")
            .get(id=plan.id)
        )

        serializer = DinnerPlanSerializer(plan, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubmitVotesView(APIView):
    """
    POST /api/groups/plans/<id>/votes/ - Submit votes for all venues.

    Body: { "votes": [{"venue_id": "...", "vote": "yes"}, ...] }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, plan_id):
        try:
            plan = DinnerPlan.objects.get(id=plan_id)
        except DinnerPlan.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Dinner plan not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check membership
        try:
            membership = DinnerPlanMember.objects.get(plan=plan, user=request.user)
        except DinnerPlanMember.DoesNotExist:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You are not a member of this plan."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if membership.has_voted:
            return Response(
                {"error": {"code": "CONFLICT", "message": "You have already voted."}},
                status=status.HTTP_409_CONFLICT,
            )

        if plan.status not in ("planning", "voting"):
            return Response(
                {"error": {"code": "CONFLICT", "message": "Voting is closed for this plan."}},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = BatchVotesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        votes_data = serializer.validated_data["votes"]

        with transaction.atomic():
            for vote_item in votes_data:
                venue_id = vote_item["venue_id"]
                vote_choice = vote_item["vote"]

                try:
                    plan_venue = DinnerPlanVenue.objects.get(
                        plan=plan, venue_id=venue_id
                    )
                except DinnerPlanVenue.DoesNotExist:
                    continue  # Skip invalid venues

                DinnerPlanVote.objects.update_or_create(
                    plan_venue=plan_venue,
                    user=request.user,
                    defaults={"vote": vote_choice},
                )

                # Update tallies
                yes_count = DinnerPlanVote.objects.filter(
                    plan_venue=plan_venue, vote="yes"
                ).count()
                no_count = DinnerPlanVote.objects.filter(
                    plan_venue=plan_venue, vote="no"
                ).count()
                plan_venue.total_yes = yes_count
                plan_venue.total_no = no_count
                plan_venue.save(update_fields=["total_yes", "total_no"])

            # Mark member as voted
            membership.has_voted = True
            membership.save(update_fields=["has_voted"])

            # Check if all members have voted
            total_members = plan.members.count()
            voted_members = plan.members.filter(has_voted=True).count()

            if voted_members >= total_members:
                # Auto-decide: pick venue with most "yes" votes
                winner = (
                    plan.venue_options.order_by("-total_yes", "total_no", "sort_order")
                    .first()
                )
                if winner:
                    plan.selected_venue = winner.venue
                    plan.status = "decided"
                    plan.save(update_fields=["selected_venue", "status"])

        # Return updated plan
        plan.refresh_from_db()
        plan = (
            DinnerPlan.objects.select_related("creator", "selected_venue")
            .prefetch_related("members__user", "venue_options__venue")
            .get(id=plan.id)
        )
        response_serializer = DinnerPlanSerializer(
            plan, context={"request": request}
        )
        return Response(response_serializer.data)


class DinnerPlanResultView(APIView):
    """
    GET /api/groups/plans/<id>/result/ - Get the consensus result.

    Returns the venue with the most "yes" votes, plus full vote breakdown.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, plan_id):
        try:
            plan = (
                DinnerPlan.objects.select_related("creator", "selected_venue")
                .prefetch_related(
                    "members__user",
                    "venue_options__venue",
                    "venue_options__votes__user",
                )
                .get(id=plan_id)
            )
        except DinnerPlan.DoesNotExist:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "Dinner plan not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check membership
        if not plan.members.filter(user=request.user).exists():
            return Response(
                {"error": {"code": "FORBIDDEN", "message": "You are not a member of this plan."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Calculate results — use the prefetched venue_options to avoid N+1
        from apps.venues.serializers import VenueListSerializer

        venue_results = []
        sorted_options = sorted(
            plan.venue_options.all(),
            key=lambda pv: (-pv.total_yes, pv.total_no, pv.sort_order),
        )
        for pv in sorted_options:
            venue_data = VenueListSerializer(pv.venue).data
            venue_results.append({
                "venue_option_id": str(pv.id),
                "venue": venue_data,
                "total_yes": pv.total_yes,
                "total_no": pv.total_no,
                "sort_order": pv.sort_order,
            })

        # Determine winner (most yes votes, tiebreak by fewest no votes)
        winner = None
        if venue_results:
            winner = venue_results[0]

        total_members = plan.members.count()
        voted_count = plan.members.filter(has_voted=True).count()

        return Response({
            "plan_id": str(plan.id),
            "title": plan.title,
            "status": plan.status,
            "total_members": total_members,
            "voted_count": voted_count,
            "all_voted": voted_count >= total_members,
            "winner": winner,
            "venue_results": venue_results,
            "suggested_date": plan.suggested_date,
            "suggested_time": str(plan.suggested_time) if plan.suggested_time else None,
        })
