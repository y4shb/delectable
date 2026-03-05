"""
Compute venue similarities using Jaccard similarity on shared reviewers.
Usage: python manage.py refresh_venue_similarity
"""

from collections import defaultdict
from itertools import combinations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.reviews.models import Review
from apps.venues.models import Venue, VenueSimilarity


class Command(BaseCommand):
    help = "Compute and store venue similarity scores (Jaccard on shared reviewers)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--top-n", type=int, default=10,
            help="Store top N similar venues per venue (default: 10)",
        )

    def handle(self, *args, **options):
        top_n = options["top_n"]

        # Build reviewer sets per venue
        self.stdout.write("Building reviewer sets...")
        venue_reviewers = defaultdict(set)
        for venue_id, user_id in Review.objects.values_list("venue_id", "user_id"):
            venue_reviewers[venue_id].add(user_id)

        venue_ids = list(venue_reviewers.keys())
        self.stdout.write(f"  {len(venue_ids)} venues with reviews")

        # Compute Jaccard similarity for all pairs
        self.stdout.write("Computing similarities...")
        similarities = []
        for va, vb in combinations(venue_ids, 2):
            set_a = venue_reviewers[va]
            set_b = venue_reviewers[vb]
            intersection = len(set_a & set_b)
            if intersection == 0:
                continue
            union = len(set_a | set_b)
            score = intersection / union
            similarities.append((va, vb, score))

        self.stdout.write(f"  {len(similarities)} non-zero pairs")

        # Group by venue and keep top N per venue
        venue_top = defaultdict(list)
        for va, vb, score in similarities:
            venue_top[va].append((vb, score))
            venue_top[vb].append((va, score))

        # Sort and truncate
        for vid in venue_top:
            venue_top[vid].sort(key=lambda x: -x[1])
            venue_top[vid] = venue_top[vid][:top_n]

        # Store in database
        self.stdout.write("Storing similarities...")
        with transaction.atomic():
            VenueSimilarity.objects.all().delete()
            records = []
            seen = set()
            for va, pairs in venue_top.items():
                for vb, score in pairs:
                    key = (va, vb)
                    if key not in seen:
                        records.append(
                            VenueSimilarity(venue_a_id=va, venue_b_id=vb, score=score)
                        )
                        seen.add(key)
            VenueSimilarity.objects.bulk_create(records)

        self.stdout.write(self.style.SUCCESS(f"Stored {len(records)} similarity records"))
