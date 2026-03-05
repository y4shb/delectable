"""
Data migration: Create Dish records from existing Review.dish_name values
and backfill Review.dish FK.
"""

from django.db import migrations


def backfill_dishes(apps, schema_editor):
    Review = apps.get_model("reviews", "Review")
    Dish = apps.get_model("venues", "Dish")

    # Group reviews by (venue_id, dish_name) where dish_name is non-empty
    reviews_with_dish = Review.objects.filter(dish_name__gt="").exclude(dish_name="")
    dish_groups = {}
    for review in reviews_with_dish:
        key = (review.venue_id, review.dish_name)
        if key not in dish_groups:
            dish_groups[key] = []
        dish_groups[key].append(review)

    # Create Dish records and backfill FK
    for (venue_id, dish_name), reviews in dish_groups.items():
        dish, _ = Dish.objects.get_or_create(
            venue_id=venue_id,
            name=dish_name,
            defaults={
                "avg_rating": sum(r.rating for r in reviews) / len(reviews),
                "review_count": len(reviews),
            },
        )
        for review in reviews:
            review.dish = dish
            review.save(update_fields=["dish"])


def reverse_backfill(apps, schema_editor):
    Review = apps.get_model("reviews", "Review")
    Review.objects.filter(dish__isnull=False).update(dish=None)


class Migration(migrations.Migration):

    dependencies = [
        ("venues", "0002_occasiontag_dish_dietaryreport_occasionvote_and_more"),
        ("reviews", "0005_remove_comment_chk_comment_parent_valid_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_dishes, reverse_backfill),
    ]
