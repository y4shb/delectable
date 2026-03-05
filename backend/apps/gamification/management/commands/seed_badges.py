"""Seed badge definitions for gamification."""

from django.core.management.base import BaseCommand

from apps.gamification.models import BadgeDefinition


BADGE_DEFINITIONS = [
    # Explorer badges (venue count)
    {"slug": "explorer-bronze", "name": "Explorer", "description": "Visit 5 different venues", "category": "explorer", "tier": "bronze", "requirement_type": "venue_count", "requirement_value": 5, "xp_reward": 100},
    {"slug": "explorer-silver", "name": "Adventurer", "description": "Visit 25 different venues", "category": "explorer", "tier": "silver", "requirement_type": "venue_count", "requirement_value": 25, "xp_reward": 200},
    {"slug": "explorer-gold", "name": "Globetrotter", "description": "Visit 100 different venues", "category": "explorer", "tier": "gold", "requirement_type": "venue_count", "requirement_value": 100, "xp_reward": 400},
    {"slug": "explorer-platinum", "name": "World Traveler", "description": "Visit 500 different venues", "category": "explorer", "tier": "platinum", "requirement_type": "venue_count", "requirement_value": 500, "xp_reward": 800},

    # Reviewer badges (review count)
    {"slug": "reviewer-bronze", "name": "First Bite", "description": "Write 1 review", "category": "reviewer", "tier": "bronze", "requirement_type": "review_count", "requirement_value": 1, "xp_reward": 50},
    {"slug": "reviewer-silver", "name": "Food Critic", "description": "Write 10 reviews", "category": "reviewer", "tier": "silver", "requirement_type": "review_count", "requirement_value": 10, "xp_reward": 150},
    {"slug": "reviewer-gold", "name": "Taste Authority", "description": "Write 50 reviews", "category": "reviewer", "tier": "gold", "requirement_type": "review_count", "requirement_value": 50, "xp_reward": 300},
    {"slug": "reviewer-platinum", "name": "Culinary Legend", "description": "Write 250 reviews", "category": "reviewer", "tier": "platinum", "requirement_type": "review_count", "requirement_value": 250, "xp_reward": 600},

    # Photographer badges (photo count)
    {"slug": "photographer-bronze", "name": "Shutterbug", "description": "Share 5 food photos", "category": "photographer", "tier": "bronze", "requirement_type": "photo_count", "requirement_value": 5, "xp_reward": 100},
    {"slug": "photographer-silver", "name": "Food Photographer", "description": "Share 25 food photos", "category": "photographer", "tier": "silver", "requirement_type": "photo_count", "requirement_value": 25, "xp_reward": 200},
    {"slug": "photographer-gold", "name": "Visual Storyteller", "description": "Share 100 food photos", "category": "photographer", "tier": "gold", "requirement_type": "photo_count", "requirement_value": 100, "xp_reward": 400},
    {"slug": "photographer-platinum", "name": "Master Photographer", "description": "Share 500 food photos", "category": "photographer", "tier": "platinum", "requirement_type": "photo_count", "requirement_value": 500, "xp_reward": 800},

    # Social badges (follower count)
    {"slug": "social-bronze", "name": "Friendly", "description": "Gain 10 followers", "category": "social", "tier": "bronze", "requirement_type": "follower_count", "requirement_value": 10, "xp_reward": 100},
    {"slug": "social-silver", "name": "Influencer", "description": "Gain 100 followers", "category": "social", "tier": "silver", "requirement_type": "follower_count", "requirement_value": 100, "xp_reward": 250},
    {"slug": "social-gold", "name": "Tastemaker", "description": "Gain 1,000 followers", "category": "social", "tier": "gold", "requirement_type": "follower_count", "requirement_value": 1000, "xp_reward": 500},
    {"slug": "social-platinum", "name": "Celebrity Chef", "description": "Gain 10,000 followers", "category": "social", "tier": "platinum", "requirement_type": "follower_count", "requirement_value": 10000, "xp_reward": 1000},

    # Streak badges
    {"slug": "streak-bronze", "name": "Getting Started", "description": "Maintain a 3-day streak", "category": "streak", "tier": "bronze", "requirement_type": "streak", "requirement_value": 3, "xp_reward": 75},
    {"slug": "streak-silver", "name": "Consistent", "description": "Maintain a 7-day streak", "category": "streak", "tier": "silver", "requirement_type": "streak", "requirement_value": 7, "xp_reward": 150},
    {"slug": "streak-gold", "name": "Dedicated", "description": "Maintain a 30-day streak", "category": "streak", "tier": "gold", "requirement_type": "streak", "requirement_value": 30, "xp_reward": 400},
    {"slug": "streak-platinum", "name": "Unstoppable", "description": "Maintain a 100-day streak", "category": "streak", "tier": "platinum", "requirement_type": "streak", "requirement_value": 100, "xp_reward": 1000},

    # Foodie badges (cuisine variety)
    {"slug": "foodie-bronze", "name": "Open Mind", "description": "Try 3 different cuisines", "category": "foodie", "tier": "bronze", "requirement_type": "cuisine_count", "requirement_value": 3, "xp_reward": 100},
    {"slug": "foodie-silver", "name": "Adventurous Eater", "description": "Try 10 different cuisines", "category": "foodie", "tier": "silver", "requirement_type": "cuisine_count", "requirement_value": 10, "xp_reward": 200},
    {"slug": "foodie-gold", "name": "World Palate", "description": "Try 20 different cuisines", "category": "foodie", "tier": "gold", "requirement_type": "cuisine_count", "requirement_value": 20, "xp_reward": 400},
    {"slug": "foodie-platinum", "name": "Global Gourmet", "description": "Try 50 different cuisines", "category": "foodie", "tier": "platinum", "requirement_type": "cuisine_count", "requirement_value": 50, "xp_reward": 800},

    # Curator badges (playlist creation)
    {"slug": "curator-bronze", "name": "List Maker", "description": "Create 1 playlist", "category": "curator", "tier": "bronze", "requirement_type": "playlist_count", "requirement_value": 1, "xp_reward": 75},
    {"slug": "curator-silver", "name": "Curator", "description": "Create 5 playlists", "category": "curator", "tier": "silver", "requirement_type": "playlist_count", "requirement_value": 5, "xp_reward": 150},
    {"slug": "curator-gold", "name": "Guide Creator", "description": "Create 20 playlists", "category": "curator", "tier": "gold", "requirement_type": "playlist_count", "requirement_value": 20, "xp_reward": 300},
    {"slug": "curator-platinum", "name": "Master Curator", "description": "Create 50 playlists", "category": "curator", "tier": "platinum", "requirement_type": "playlist_count", "requirement_value": 50, "xp_reward": 600},

    # Local Expert badges (reviews in same area)
    {"slug": "local-bronze", "name": "Local", "description": "Review 5 venues in your area", "category": "local", "tier": "bronze", "requirement_type": "local_review_count", "requirement_value": 5, "xp_reward": 100},
    {"slug": "local-silver", "name": "Neighborhood Guide", "description": "Review 25 venues in your area", "category": "local", "tier": "silver", "requirement_type": "local_review_count", "requirement_value": 25, "xp_reward": 200},
    {"slug": "local-gold", "name": "Local Expert", "description": "Review 100 venues in your area", "category": "local", "tier": "gold", "requirement_type": "local_review_count", "requirement_value": 100, "xp_reward": 400},
    {"slug": "local-platinum", "name": "City Ambassador", "description": "Review 500 venues in your area", "category": "local", "tier": "platinum", "requirement_type": "local_review_count", "requirement_value": 500, "xp_reward": 800},
]


class Command(BaseCommand):
    help = "Seed badge definitions for gamification"

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for badge_data in BADGE_DEFINITIONS:
            badge, created = BadgeDefinition.objects.update_or_create(
                slug=badge_data["slug"],
                defaults=badge_data,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {created_count} new badges, updated {updated_count} existing badges."
            )
        )
