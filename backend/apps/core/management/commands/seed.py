"""
Seed the database with realistic test data.
Usage: python manage.py seed [--clear]
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.notifications.models import Notification
from apps.playlists.models import Playlist, PlaylistItem
from apps.reviews.models import Comment, Review, ReviewLike
from apps.users.models import Follow, User
from apps.venues.models import Venue


USERS = [
    {
        "email": "alice@delectable.app",
        "name": "Alice Chen",
        "password": "password123",
        "bio": "NYC food explorer. Always hunting for the next hidden gem.",
        "level": 5,
        "favorite_cuisines": ["Japanese", "Italian", "Mexican"],
    },
    {
        "email": "bob@delectable.app",
        "name": "Bob Martinez",
        "password": "password123",
        "bio": "Street food addict and spice enthusiast.",
        "level": 3,
        "favorite_cuisines": ["Mexican", "Thai", "Korean"],
    },
    {
        "email": "clara@delectable.app",
        "name": "Clara Kim",
        "password": "password123",
        "bio": "Fine dining aficionado. Sommelier in training.",
        "level": 7,
        "favorite_cuisines": ["French", "Japanese", "Italian"],
    },
    {
        "email": "david@delectable.app",
        "name": "David Okafor",
        "password": "password123",
        "bio": "Brunch is a lifestyle. Coffee is a religion.",
        "level": 4,
        "favorite_cuisines": ["American", "Mediterranean", "Indian"],
    },
    {
        "email": "emma@delectable.app",
        "name": "Emma Patel",
        "password": "password123",
        "bio": "Vegetarian foodie on a mission to find the best plant-based eats.",
        "level": 6,
        "favorite_cuisines": ["Indian", "Mediterranean", "Japanese"],
    },
]

VENUES = [
    {
        "name": "Sushi Nakazawa",
        "cuisine_type": "Japanese",
        "location_text": "23 Commerce St, New York, NY",
        "city": "New York",
        "tags": ["omakase", "sushi", "fine-dining", "date-night"],
        "rating": Decimal("9.2"),
        "latitude": Decimal("40.7321"),
        "longitude": Decimal("-74.0038"),
        "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    },
    {
        "name": "Los Tacos No. 1",
        "cuisine_type": "Mexican",
        "location_text": "75 9th Ave, New York, NY",
        "city": "New York",
        "tags": ["tacos", "casual", "quick-bite", "authentic"],
        "rating": Decimal("8.8"),
        "latitude": Decimal("40.7425"),
        "longitude": Decimal("-74.0048"),
    },
    {
        "name": "Le Bernardin",
        "cuisine_type": "French",
        "location_text": "155 W 51st St, New York, NY",
        "city": "New York",
        "tags": ["fine-dining", "seafood", "michelin", "special-occasion"],
        "rating": Decimal("9.5"),
        "latitude": Decimal("40.7617"),
        "longitude": Decimal("-73.9817"),
    },
    {
        "name": "Xi'an Famous Foods",
        "cuisine_type": "Chinese",
        "location_text": "67 Bayard St, New York, NY",
        "city": "New York",
        "tags": ["noodles", "spicy", "casual", "quick-bite"],
        "rating": Decimal("8.5"),
        "latitude": Decimal("40.7155"),
        "longitude": Decimal("-73.9987"),
    },
    {
        "name": "Superiority Burger",
        "cuisine_type": "American",
        "location_text": "430 E 9th St, New York, NY",
        "city": "New York",
        "tags": ["vegetarian", "burgers", "casual", "hidden-gem"],
        "rating": Decimal("8.7"),
        "latitude": Decimal("40.7272"),
        "longitude": Decimal("-73.9862"),
    },
    {
        "name": "Dhamaka",
        "cuisine_type": "Indian",
        "location_text": "119 Delancey St, New York, NY",
        "city": "New York",
        "tags": ["spicy", "authentic", "trending", "bold-flavors"],
        "rating": Decimal("9.0"),
        "latitude": Decimal("40.7184"),
        "longitude": Decimal("-73.9883"),
    },
    {
        "name": "Tatiana by Kwame",
        "cuisine_type": "American",
        "location_text": "Lincoln Center, New York, NY",
        "city": "New York",
        "tags": ["brunch", "cocktails", "trendy", "date-night"],
        "rating": Decimal("8.9"),
        "latitude": Decimal("40.7725"),
        "longitude": Decimal("-73.9835"),
    },
    {
        "name": "Thai Diner",
        "cuisine_type": "Thai",
        "location_text": "186 Mott St, New York, NY",
        "city": "New York",
        "tags": ["thai", "brunch", "trendy", "comfort-food"],
        "rating": Decimal("8.3"),
        "latitude": Decimal("40.7215"),
        "longitude": Decimal("-73.9960"),
    },
]

REVIEWS = [
    # Alice's reviews
    (0, 0, Decimal("9.5"), "The omakase was transcendent. Each piece of nigiri told a story.", "Toro", ["must-try", "best-sushi"]),
    (0, 2, Decimal("9.0"), "Seafood perfection. The tasting menu is an experience you won't forget.", "Lobster", ["fine-dining", "special-occasion"]),
    (0, 5, Decimal("8.5"), "Bold and unapologetic flavors. The goat curry was incredible.", "Goat Curry", ["spicy", "authentic"]),
    # Bob's reviews
    (1, 1, Decimal("9.0"), "Best tacos in NYC, hands down. The adobada is life-changing.", "Adobada Taco", ["must-try", "authentic"]),
    (1, 3, Decimal("8.0"), "The hand-pulled noodles with spicy cumin lamb are addictive.", "Cumin Lamb Noodles", ["spicy", "comfort-food"]),
    (1, 7, Decimal("7.5"), "Fun vibe, creative menu. The khao soi is great but portions are small.", "Khao Soi", ["trendy", "brunch"]),
    # Clara's reviews
    (2, 2, Decimal("10.0"), "A masterclass in French seafood. Ripert is a genius. Worth every penny.", "Tasting Menu", ["michelin", "fine-dining"]),
    (2, 0, Decimal("9.0"), "Nakazawa's attention to detail is remarkable. Every piece is perfect.", "Omakase Set", ["omakase", "date-night"]),
    (2, 6, Decimal("8.5"), "Vibrant atmosphere and creative dishes. The plantain is a must.", "Fried Plantain", ["trendy", "cocktails"]),
    # David's reviews
    (3, 6, Decimal("9.0"), "Best brunch in the city. The vibe is unmatched. Go early.", "Brunch Platter", ["brunch", "must-try"]),
    (3, 4, Decimal("8.5"), "Don't sleep on the veggie burger. It's better than most meat burgers.", "Superiority Burger", ["vegetarian", "hidden-gem"]),
    (3, 5, Decimal("8.0"), "Fiery and full of character. The rabbit dish was a surprise hit.", "Rabbit Kidney", ["bold-flavors", "authentic"]),
    # Emma's reviews
    (4, 4, Decimal("9.0"), "Finally a veggie spot that gets it right. Creative, flavorful, affordable.", "Burnt-End Baked Beans", ["vegetarian", "must-try"]),
    (4, 5, Decimal("9.5"), "Incredible depth of flavor. Even as a vegetarian, the dal is unforgettable.", "Dal", ["vegetarian", "spicy"]),
    (4, 7, Decimal("8.0"), "The crab fried rice is divine. Lovely space too.", "Crab Fried Rice", ["comfort-food", "trendy"]),
]

PLAYLISTS = [
    (0, "Date Night Essentials", "My go-to spots for a special evening out", True, [0, 2, 6]),
    (1, "Best Street Eats", "Casual bites that punch above their weight", True, [1, 3, 7]),
    (2, "Michelin Trail", "Working through NYC's finest", True, [2, 0]),
    (3, "Weekend Brunch Spots", "Saturday morning essentials", True, [6, 7, 4]),
    (4, "Plant-Based Favorites", "Best vegetarian food in NYC", True, [4, 5]),
]


class Command(BaseCommand):
    help = "Seed the database with realistic test data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear", action="store_true", help="Clear existing data before seeding"
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            Notification.objects.all().delete()
            Comment.objects.all().delete()
            ReviewLike.objects.all().delete()
            Review.objects.all().delete()
            PlaylistItem.objects.all().delete()
            Playlist.objects.all().delete()
            Follow.objects.all().delete()
            Venue.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        # Users
        users = []
        for data in USERS:
            pwd = data.pop("password")
            cuisines = data.pop("favorite_cuisines")
            u, created = User.objects.get_or_create(
                email=data["email"], defaults=data
            )
            if created:
                u.set_password(pwd)
                u.favorite_cuisines = cuisines
                u.save()
            users.append(u)
            data["password"] = pwd
            data["favorite_cuisines"] = cuisines
        self.stdout.write(f"  Users: {len(users)}")

        # Follows: each user follows the next 2 users (circular)
        follow_count = 0
        for i, u in enumerate(users):
            for offset in (1, 2):
                target = users[(i + offset) % len(users)]
                _, created = Follow.objects.get_or_create(
                    follower=u, following=target
                )
                if created:
                    follow_count += 1
        self.stdout.write(f"  Follows: {follow_count}")

        # Venues
        venues = []
        for data in VENUES:
            v, _ = Venue.objects.get_or_create(name=data["name"], defaults=data)
            venues.append(v)
        self.stdout.write(f"  Venues: {len(venues)}")

        # Reviews
        review_objs = []
        for user_idx, venue_idx, rating, text, dish, tags in REVIEWS:
            r, _ = Review.objects.get_or_create(
                user=users[user_idx],
                venue=venues[venue_idx],
                defaults={
                    "rating": rating,
                    "text": text,
                    "dish_name": dish,
                    "tags": tags,
                },
            )
            review_objs.append(r)
        self.stdout.write(f"  Reviews: {len(review_objs)}")

        # Update venue ratings and review counts
        from django.db.models import Avg, Count

        for v in venues:
            agg = v.reviews.aggregate(avg=Avg("rating"), cnt=Count("id"))
            v.rating = agg["avg"] or Decimal("0")
            v.reviews_count = agg["cnt"]
            v.save(update_fields=["rating", "reviews_count"])

        # Likes: each user likes reviews from users they follow
        like_count = 0
        for u in users:
            following_ids = Follow.objects.filter(follower=u).values_list(
                "following_id", flat=True
            )
            reviews_to_like = Review.objects.filter(
                user_id__in=following_ids
            )[:3]
            for r in reviews_to_like:
                _, created = ReviewLike.objects.get_or_create(user=u, review=r)
                if created:
                    like_count += 1
        self.stdout.write(f"  Likes: {like_count}")

        # Update like counts
        from django.db.models import F

        for r in Review.objects.all():
            r.like_count = r.likes.count()
            r.save(update_fields=["like_count"])

        # Comments
        comments = [
            (1, 0, "That toro is next level!"),
            (2, 0, "Totally agree, Nakazawa is a master."),
            (0, 3, "Adding this to my list ASAP."),
            (3, 6, "We need to go back together!"),
            (4, 10, "Those baked beans are incredible."),
            (0, 4, "The cumin lamb is what dreams are made of."),
        ]
        comment_count = 0
        for user_idx, review_idx, text in comments:
            if review_idx < len(review_objs):
                Comment.objects.get_or_create(
                    user=users[user_idx],
                    review=review_objs[review_idx],
                    text=text,
                )
                comment_count += 1
        self.stdout.write(f"  Comments: {comment_count}")

        # Update comment counts
        for r in Review.objects.all():
            r.comment_count = r.comments.count()
            r.save(update_fields=["comment_count"])

        # Playlists
        playlist_count = 0
        for user_idx, title, desc, is_public, venue_indices in PLAYLISTS:
            p, created = Playlist.objects.get_or_create(
                user=users[user_idx],
                title=title,
                defaults={"description": desc, "is_public": is_public},
            )
            if created:
                for order, vi in enumerate(venue_indices):
                    PlaylistItem.objects.get_or_create(
                        playlist=p,
                        venue=venues[vi],
                        defaults={"sort_order": order},
                    )
                p.items_count = len(venue_indices)
                p.save(update_fields=["items_count"])
                playlist_count += 1
        self.stdout.write(f"  Playlists: {playlist_count}")

        # Update follower/following counts
        for u in users:
            u.followers_count = u.follower_set.count()
            u.following_count = u.following_set.count()
            u.save(update_fields=["followers_count", "following_count"])

        # Notifications
        notif_count = 0
        for like in ReviewLike.objects.select_related("user", "review__user")[:5]:
            _, created = Notification.objects.get_or_create(
                recipient=like.review.user,
                notification_type="like",
                text=f"{like.user.name} liked your review",
                related_object_id=like.review.id,
            )
            if created:
                notif_count += 1
        for follow in Follow.objects.select_related("follower", "following")[:5]:
            _, created = Notification.objects.get_or_create(
                recipient=follow.following,
                notification_type="follow",
                text=f"{follow.follower.name} started following you",
                related_object_id=follow.follower.id,
            )
            if created:
                notif_count += 1
        self.stdout.write(f"  Notifications: {notif_count}")

        self.stdout.write(self.style.SUCCESS("\nSeed data created successfully!"))
        self.stdout.write(
            f"\nLogin credentials (all users use password: password123):"
        )
        for data in USERS:
            self.stdout.write(f"  {data['email']} — {data['name']}")
