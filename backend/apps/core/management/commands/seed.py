"""
Seed the database with rich, realistic test data.
Usage: python manage.py seed [--clear]
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.notifications.models import Notification
from apps.playlists.models import Playlist, PlaylistItem
from apps.reviews.models import Comment, Review, ReviewLike
from apps.sharing.models import Challenge
from apps.users.models import Follow, User
from apps.venues.models import (
    DietaryReport, Dish, OccasionTag, SeasonalHighlight, Venue, VenueOccasion,
    VenueRatingSnapshot, VenueSimilarity,
)


# ---------------------------------------------------------------------------
# Unsplash image URLs (high-quality, free to use)
# ---------------------------------------------------------------------------

# Avatar photos (portrait/headshots)
AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",  # woman, warm smile
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",  # man, beard
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",  # woman, blonde
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",  # man, clean cut
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",  # woman, striking
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",  # man, serious
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",  # woman, casual
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",  # man, glasses
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",  # woman, dark hair
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",  # man, outdoors
]

# Venue photos (restaurant interiors, exteriors, food)
VENUE_PHOTOS = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",  # elegant restaurant interior
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop",  # cozy restaurant
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",  # fine dining plate
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",  # restaurant bar
    "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=600&fit=crop",  # food spread
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop",  # cafe interior
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",  # sushi bar
    "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800&h=600&fit=crop",  # pizzeria
    "https://images.unsplash.com/photo-1564759298141-cef86f51d4d4?w=800&h=600&fit=crop",  # taco stand
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop",  # noodle shop
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800&h=600&fit=crop",  # plated dish
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop",  # rooftop dining
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop",  # restaurant at night
    "https://images.unsplash.com/photo-1521917441209-e886f0404a7b?w=800&h=600&fit=crop",  # indian restaurant
    "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop",  # ramen close-up
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",  # beautiful food plating
]

# Review photos (individual dishes)
FOOD_PHOTOS = [
    "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop",  # sushi platter
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",  # pizza
    "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&h=600&fit=crop",  # tacos
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop",  # ramen bowl
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",  # healthy bowl
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",  # pancakes
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",  # salad
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop",  # avocado toast
    "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&h=600&fit=crop",  # pasta
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop",  # indian curry
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=600&fit=crop",  # steak
    "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&h=600&fit=crop",  # lobster
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop",  # burger
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop",  # dessert
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=600&fit=crop",  # cocktail
    "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=800&h=600&fit=crop",  # coffee latte art
    "https://images.unsplash.com/photo-1560684352-8497838b8cfe?w=800&h=600&fit=crop",  # seafood
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&h=600&fit=crop",  # thai food
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&h=600&fit=crop",  # brunch spread
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop",  # pasta overhead
]

# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

USERS = [
    {
        "email": "yash@delectable.app",
        "name": "Yash Bhardwaj",
        "password": "password123",
        "bio": "Building de. and eating everything along the way.",
        "level": 9,
        "favorite_cuisines": ["Japanese", "Italian", "Indian"],
        "avatar_url": AVATARS[0],
    },
    {
        "email": "alice@delectable.app",
        "name": "Alice Chen",
        "password": "password123",
        "bio": "NYC food explorer. Always hunting for the next hidden gem.",
        "level": 7,
        "favorite_cuisines": ["Japanese", "Chinese", "Korean"],
        "avatar_url": AVATARS[1],
    },
    {
        "email": "marco@delectable.app",
        "name": "Marco Rossi",
        "password": "password123",
        "bio": "Born in Naples, raised on pasta. Now I judge everyone else's.",
        "level": 8,
        "favorite_cuisines": ["Italian", "French", "Mediterranean"],
        "avatar_url": AVATARS[2],
    },
    {
        "email": "priya@delectable.app",
        "name": "Priya Sharma",
        "password": "password123",
        "bio": "Spice queen. If it doesn't make me sweat, it's not worth it.",
        "level": 6,
        "favorite_cuisines": ["Indian", "Thai", "Mexican"],
        "avatar_url": AVATARS[3],
    },
    {
        "email": "james@delectable.app",
        "name": "James O'Brien",
        "password": "password123",
        "bio": "Brunch is a personality trait. Whiskey sour enthusiast.",
        "level": 5,
        "favorite_cuisines": ["American", "Mediterranean", "French"],
        "avatar_url": AVATARS[4],
    },
    {
        "email": "sofia@delectable.app",
        "name": "Sofia Nakamura",
        "password": "password123",
        "bio": "Half Japanese, half Brazilian. Omakase or churrasco, never both.",
        "level": 10,
        "favorite_cuisines": ["Japanese", "Brazilian", "Peruvian"],
        "avatar_url": AVATARS[5],
    },
    {
        "email": "david@delectable.app",
        "name": "David Okafor",
        "password": "password123",
        "bio": "West African flavors meet NYC hustle. Jollof rice supremacist.",
        "level": 4,
        "favorite_cuisines": ["West African", "Caribbean", "Southern"],
        "avatar_url": AVATARS[6],
    },
    {
        "email": "emma@delectable.app",
        "name": "Emma Lindqvist",
        "password": "password123",
        "bio": "Plant-based and proud. Will travel for a good vegan taco.",
        "level": 6,
        "favorite_cuisines": ["Mexican", "Mediterranean", "Japanese"],
        "avatar_url": AVATARS[7],
    },
    {
        "email": "raj@delectable.app",
        "name": "Raj Patel",
        "password": "password123",
        "bio": "Late-night ramen runs and early-morning dosa dreams.",
        "level": 5,
        "favorite_cuisines": ["Indian", "Japanese", "Thai"],
        "avatar_url": AVATARS[8],
    },
    {
        "email": "nina@delectable.app",
        "name": "Nina Volkov",
        "password": "password123",
        "bio": "Pastry chef turned food critic. The dessert menu is always my main.",
        "level": 8,
        "favorite_cuisines": ["French", "Italian", "Austrian"],
        "avatar_url": AVATARS[9],
    },
]

# ---------------------------------------------------------------------------
# Venues
# ---------------------------------------------------------------------------

VENUES = [
    {
        "name": "Sushi Nakazawa",
        "cuisine_type": "Japanese",
        "location_text": "23 Commerce St, West Village",
        "city": "New York",
        "tags": ["omakase", "sushi", "fine-dining", "date-night"],
        "rating": Decimal("9.2"),
        "latitude": Decimal("40.7321"),
        "longitude": Decimal("-74.0038"),
        "photo_url": VENUE_PHOTOS[6],
    },
    {
        "name": "Los Tacos No. 1",
        "cuisine_type": "Mexican",
        "location_text": "75 9th Ave, Chelsea Market",
        "city": "New York",
        "tags": ["tacos", "casual", "quick-bite", "authentic"],
        "rating": Decimal("8.8"),
        "latitude": Decimal("40.7425"),
        "longitude": Decimal("-74.0048"),
        "photo_url": VENUE_PHOTOS[8],
    },
    {
        "name": "Le Bernardin",
        "cuisine_type": "French",
        "location_text": "155 W 51st St, Midtown",
        "city": "New York",
        "tags": ["fine-dining", "seafood", "michelin", "special-occasion"],
        "rating": Decimal("9.5"),
        "latitude": Decimal("40.7617"),
        "longitude": Decimal("-73.9817"),
        "photo_url": VENUE_PHOTOS[2],
    },
    {
        "name": "Xi'an Famous Foods",
        "cuisine_type": "Chinese",
        "location_text": "67 Bayard St, Chinatown",
        "city": "New York",
        "tags": ["noodles", "spicy", "casual", "quick-bite"],
        "rating": Decimal("8.5"),
        "latitude": Decimal("40.7155"),
        "longitude": Decimal("-73.9987"),
        "photo_url": VENUE_PHOTOS[9],
    },
    {
        "name": "Superiority Burger",
        "cuisine_type": "American",
        "location_text": "430 E 9th St, East Village",
        "city": "New York",
        "tags": ["vegetarian", "burgers", "casual", "hidden-gem"],
        "rating": Decimal("8.7"),
        "latitude": Decimal("40.7272"),
        "longitude": Decimal("-73.9862"),
        "photo_url": VENUE_PHOTOS[3],
    },
    {
        "name": "Dhamaka",
        "cuisine_type": "Indian",
        "location_text": "119 Delancey St, Lower East Side",
        "city": "New York",
        "tags": ["spicy", "authentic", "trending", "bold-flavors"],
        "rating": Decimal("9.0"),
        "latitude": Decimal("40.7184"),
        "longitude": Decimal("-73.9883"),
        "photo_url": VENUE_PHOTOS[13],
    },
    {
        "name": "Tatiana by Kwame",
        "cuisine_type": "American",
        "location_text": "Lincoln Center Plaza",
        "city": "New York",
        "tags": ["brunch", "cocktails", "trendy", "date-night"],
        "rating": Decimal("8.9"),
        "latitude": Decimal("40.7725"),
        "longitude": Decimal("-73.9835"),
        "photo_url": VENUE_PHOTOS[11],
    },
    {
        "name": "Thai Diner",
        "cuisine_type": "Thai",
        "location_text": "186 Mott St, Nolita",
        "city": "New York",
        "tags": ["thai", "brunch", "trendy", "comfort-food"],
        "rating": Decimal("8.3"),
        "latitude": Decimal("40.7215"),
        "longitude": Decimal("-73.9960"),
        "photo_url": VENUE_PHOTOS[5],
    },
    {
        "name": "Russ & Daughters Cafe",
        "cuisine_type": "Jewish Deli",
        "location_text": "127 Orchard St, Lower East Side",
        "city": "New York",
        "tags": ["brunch", "bagels", "classic", "iconic"],
        "rating": Decimal("9.1"),
        "latitude": Decimal("40.7202"),
        "longitude": Decimal("-73.9898"),
        "photo_url": VENUE_PHOTOS[1],
    },
    {
        "name": "Via Carota",
        "cuisine_type": "Italian",
        "location_text": "51 Grove St, West Village",
        "city": "New York",
        "tags": ["pasta", "wine", "romantic", "seasonal"],
        "rating": Decimal("9.3"),
        "latitude": Decimal("40.7330"),
        "longitude": Decimal("-74.0030"),
        "photo_url": VENUE_PHOTOS[0],
    },
    {
        "name": "Jua",
        "cuisine_type": "Korean",
        "location_text": "36 E 1st St, East Village",
        "city": "New York",
        "tags": ["korean", "tasting-menu", "intimate", "michelin"],
        "rating": Decimal("9.4"),
        "latitude": Decimal("40.7248"),
        "longitude": Decimal("-73.9910"),
        "photo_url": VENUE_PHOTOS[12],
    },
    {
        "name": "Mel's",
        "cuisine_type": "American",
        "location_text": "204 E 7th St, East Village",
        "city": "New York",
        "tags": ["burgers", "late-night", "cash-only", "dive"],
        "rating": Decimal("8.6"),
        "latitude": Decimal("40.7265"),
        "longitude": Decimal("-73.9838"),
        "photo_url": VENUE_PHOTOS[4],
    },
    {
        "name": "Adda Indian Canteen",
        "cuisine_type": "Indian",
        "location_text": "31-31 Thomson Ave, Long Island City",
        "city": "New York",
        "tags": ["indian", "casual", "hidden-gem", "authentic"],
        "rating": Decimal("8.8"),
        "latitude": Decimal("40.7440"),
        "longitude": Decimal("-73.9350"),
        "photo_url": VENUE_PHOTOS[10],
    },
    {
        "name": "Llama Inn",
        "cuisine_type": "Peruvian",
        "location_text": "50 Withers St, Williamsburg",
        "city": "New York",
        "tags": ["peruvian", "cocktails", "trendy", "date-night"],
        "rating": Decimal("8.9"),
        "latitude": Decimal("40.7155"),
        "longitude": Decimal("-73.9510"),
        "photo_url": VENUE_PHOTOS[15],
    },
    {
        "name": "Ippudo",
        "cuisine_type": "Japanese",
        "location_text": "65 4th Ave, East Village",
        "city": "New York",
        "tags": ["ramen", "casual", "late-night", "comfort-food"],
        "rating": Decimal("8.4"),
        "latitude": Decimal("40.7310"),
        "longitude": Decimal("-73.9907"),
        "photo_url": VENUE_PHOTOS[14],
    },
    {
        "name": "L'Artusi",
        "cuisine_type": "Italian",
        "location_text": "228 W 10th St, West Village",
        "city": "New York",
        "tags": ["pasta", "wine-bar", "date-night", "seasonal"],
        "rating": Decimal("9.1"),
        "latitude": Decimal("40.7340"),
        "longitude": Decimal("-74.0050"),
        "photo_url": VENUE_PHOTOS[7],
    },
]

# ---------------------------------------------------------------------------
# Reviews: (user_idx, venue_idx, rating, text, dish_name, tags, photo_idx)
# ---------------------------------------------------------------------------

REVIEWS = [
    # Yash (0) — 5 reviews
    (0, 0, Decimal("9.5"), "The omakase was transcendent. Each piece of nigiri told a story. Nakazawa himself served the toro and it melted like butter.", "Toro Nigiri", ["must-try", "best-sushi"], 0),
    (0, 9, Decimal("9.0"), "Via Carota does Italian the way it should be done. Simple, seasonal, perfect. The cacio e pepe is life-changing.", "Cacio e Pepe", ["date-night", "pasta"], 8),
    (0, 5, Decimal("8.5"), "Dhamaka is not playing safe and I respect that. The goat curry had layers of flavor I've never experienced.", "Goat Curry", ["spicy", "authentic"], 9),
    (0, 14, Decimal("8.0"), "Ippudo's tonkotsu is reliable comfort. Not the best ramen in the city but always satisfying after a long day.", "Shiromaru Classic", ["comfort-food", "late-night"], 3),
    (0, 11, Decimal("8.5"), "Mel's is the kind of burger joint that doesn't need to try hard. Cash only, no frills, just a perfect smashburger.", "Smashburger", ["hidden-gem", "casual"], 12),

    # Alice (1) — 5 reviews
    (1, 0, Decimal("9.0"), "Nakazawa's attention to detail is remarkable. Every piece is precise, every bite intentional. Save room for the egg custard.", "Omakase Set", ["omakase", "date-night"], 0),
    (1, 3, Decimal("8.0"), "The hand-pulled noodles with spicy cumin lamb are addictive. I come here every week and I'm not ashamed.", "Cumin Lamb Noodles", ["spicy", "comfort-food"], 3),
    (1, 10, Decimal("9.5"), "Jua is a revelation. The Korean tasting menu redefines what you thought you knew about Korean food. Every course was a surprise.", "Tasting Menu", ["michelin", "must-try"], 17),
    (1, 8, Decimal("9.0"), "Russ & Daughters is a NYC institution for a reason. The smoked salmon bagel is untouchable.", "Smoked Salmon Bagel", ["classic", "brunch"], 7),
    (1, 15, Decimal("8.5"), "L'Artusi's spaghetti with crab is the dish I dream about. The wine list is impeccable too.", "Spaghetti & Crab", ["pasta", "wine"], 8),

    # Marco (2) — 5 reviews
    (2, 2, Decimal("10.0"), "A masterclass in French seafood. Ripert is a genius. The poached lobster with pea puree is worth every single penny.", "Poached Lobster", ["michelin", "fine-dining"], 11),
    (2, 9, Decimal("9.5"), "As an Italian, I'm picky about pasta. Via Carota gets it right. The artichoke appetizer is a masterpiece.", "Carciofi", ["authentic", "seasonal"], 8),
    (2, 15, Decimal("9.0"), "L'Artusi rivals the best trattorias in Rome. The ricotta gnudi are pillowy perfection.", "Ricotta Gnudi", ["pasta", "date-night"], 19),
    (2, 6, Decimal("8.5"), "Vibrant atmosphere and creative dishes. The fried plantain is a must-order. Cocktails are strong.", "Fried Plantain", ["trendy", "cocktails"], 14),
    (2, 13, Decimal("8.5"), "Llama Inn is a beautiful blend of Peruvian tradition and NYC creativity. The ceviche is bright and balanced.", "Ceviche", ["peruvian", "cocktails"], 16),

    # Priya (3) — 5 reviews
    (3, 5, Decimal("9.5"), "Dhamaka understands Indian food at a level most restaurants can't touch. The seekh kebab and the dal are non-negotiable.", "Seekh Kebab", ["authentic", "must-try"], 9),
    (3, 12, Decimal("9.0"), "Adda is what I wish every Indian restaurant was. The keema pav brought tears to my eyes. Seriously.", "Keema Pav", ["hidden-gem", "authentic"], 9),
    (3, 7, Decimal("8.0"), "Thai Diner's khao soi is great but portions are small. The crab fried rice makes up for it. Fun space.", "Khao Soi", ["trendy", "brunch"], 17),
    (3, 1, Decimal("8.5"), "Los Tacos is the real deal. The adobada taco with pineapple is my go-to lunch. Fast, cheap, perfect.", "Adobada Taco", ["casual", "authentic"], 2),
    (3, 14, Decimal("7.5"), "Ippudo is fine but a bit overhyped for the price. The Akamaru ramen is decent, not life-changing.", "Akamaru Modern", ["ramen", "casual"], 3),

    # James (4) — 4 reviews
    (4, 6, Decimal("9.0"), "Best brunch in the city. Tatiana's energy is unmatched. Go early or you'll wait an hour and it's still worth it.", "Brunch Platter", ["brunch", "must-try"], 5),
    (4, 4, Decimal("8.5"), "Don't sleep on Superiority Burger. It's better than most meat burgers in the city. The wrap is incredible too.", "Superiority Burger", ["vegetarian", "hidden-gem"], 12),
    (4, 8, Decimal("8.5"), "Russ & Daughters for Sunday brunch is a spiritual experience. The matzo ball soup heals all wounds.", "Matzo Ball Soup", ["classic", "comfort-food"], 4),
    (4, 11, Decimal("8.0"), "Mel's at 2am after a night out. Nothing else compares. The burger is greasy, sloppy, and absolutely perfect.", "Double Burger", ["late-night", "dive"], 12),

    # Sofia (5) — 5 reviews
    (5, 0, Decimal("9.5"), "I've eaten omakase in Tokyo, Osaka, and NYC. Nakazawa belongs in that conversation. The uni was otherworldly.", "Uni Nigiri", ["omakase", "best-sushi"], 0),
    (5, 10, Decimal("9.5"), "Jua earned that Michelin star. The bibimbap course was the best thing I ate all year. Intimate, thoughtful, flawless.", "Bibimbap Course", ["michelin", "tasting-menu"], 15),
    (5, 13, Decimal("9.0"), "Llama Inn's pisco sour alone is worth the trip. The anticuchos are smoky, charred perfection.", "Anticuchos", ["peruvian", "date-night"], 10),
    (5, 2, Decimal("9.0"), "Le Bernardin is pristine. The barely cooked scallop is an exercise in restraint and mastery.", "Barely Cooked Scallop", ["fine-dining", "seafood"], 16),
    (5, 7, Decimal("7.5"), "Thai Diner is more about the scene than the food. Pretty but the pad thai was underwhelming.", "Pad Thai", ["trendy", "instagram"], 17),

    # David (6) — 4 reviews
    (6, 5, Decimal("8.0"), "Dhamaka is fire but it's not for the faint-hearted. The rabbit kidney was wild. Respect the ambition.", "Rabbit Kidney", ["bold-flavors", "authentic"], 9),
    (6, 1, Decimal("8.5"), "Los Tacos is a vibe. Quick, no-nonsense, and the nopal taco is slept on. Best casual lunch in Chelsea.", "Nopal Taco", ["casual", "quick-bite"], 2),
    (6, 6, Decimal("8.5"), "Tatiana's cocktails are dangerous. The jerk chicken sliders are incredible. Great people-watching too.", "Jerk Chicken Sliders", ["cocktails", "brunch"], 14),
    (6, 11, Decimal("9.0"), "Mel's is the best burger in the East Village and I will die on this hill. Cash. Only.", "Cheeseburger", ["best-burger", "dive"], 12),

    # Emma (7) — 4 reviews
    (7, 4, Decimal("9.0"), "Finally a veggie spot that gets it right. Creative, flavorful, affordable. The burnt-end baked beans are genius.", "Burnt-End Baked Beans", ["vegetarian", "must-try"], 6),
    (7, 5, Decimal("9.5"), "Even as a vegetarian, Dhamaka's dal blew my mind. The depth of flavor is unreal. One of the best meals of my life.", "Dal Makhani", ["vegetarian", "spicy"], 9),
    (7, 9, Decimal("8.5"), "Via Carota's roasted vegetables are a love letter to produce. Every vegetarian should eat here.", "Roasted Vegetables", ["seasonal", "vegetarian"], 6),
    (7, 7, Decimal("8.0"), "Thai Diner's papaya salad is excellent. The space is gorgeous. Just wish the mains had more punch.", "Papaya Salad", ["trendy", "vegetarian"], 17),

    # Raj (8) — 4 reviews
    (8, 14, Decimal("8.5"), "Ippudo hits different at midnight. The tonkotsu broth is rich and soulful. My comfort spot.", "Shiromaru Classic", ["late-night", "ramen"], 3),
    (8, 12, Decimal("9.0"), "Adda is the most authentic Indian food in all of NYC. The biryani is aromatic, layered, and transcendent.", "Chicken Biryani", ["authentic", "must-try"], 9),
    (8, 3, Decimal("8.5"), "Xi'an's cumin lamb burger is underrated. The liangpi noodles are the real star though. Always a queue.", "Liangpi Noodles", ["casual", "spicy"], 4),
    (8, 10, Decimal("9.0"), "Jua is worth every dollar. The tasting menu takes you on a journey. Pair it with the soju flight.", "Tasting Menu", ["michelin", "intimate"], 15),

    # Nina (9) — 4 reviews
    (9, 2, Decimal("9.5"), "Le Bernardin's pastry program is underrated. The chocolate tasting dessert is a work of art.", "Chocolate Tasting", ["dessert", "fine-dining"], 13),
    (9, 9, Decimal("9.0"), "The olive oil cake at Via Carota is the best dessert in the West Village. Simple, moist, heavenly.", "Olive Oil Cake", ["dessert", "seasonal"], 13),
    (9, 15, Decimal("8.5"), "L'Artusi's panna cotta is silky perfection. The wine pairings are expertly curated.", "Panna Cotta", ["dessert", "wine"], 13),
    (9, 8, Decimal("8.0"), "Russ & Daughters' babka is the real deal. Chocolate swirl, warm from the oven. Pure joy.", "Chocolate Babka", ["classic", "dessert"], 13),
]

# ---------------------------------------------------------------------------
# Playlists: (user_idx, title, description, is_public, [venue_indices])
# ---------------------------------------------------------------------------

PLAYLISTS = [
    (0, "Date Night Essentials", "My go-to spots for a special evening out in NYC", True, [0, 2, 9, 10, 13]),
    (0, "Late Night Cravings", "When it's midnight and you need food NOW", True, [14, 11, 1, 3]),
    (1, "Noodle Tour NYC", "Best noodles across every cuisine in the city", True, [3, 14, 7, 10]),
    (2, "Michelin Mission", "Working through NYC's starred restaurants", True, [2, 10, 0]),
    (2, "Italian Hall of Fame", "The best Italian outside of Italy", True, [9, 15]),
    (3, "Spice Level: Maximum", "For when you want to feel alive", True, [5, 12, 3, 7]),
    (4, "Weekend Brunch Circuit", "Saturday and Sunday morning essentials", True, [6, 8, 7, 4]),
    (5, "Omakase & Tasting Menus", "The art of multi-course dining", True, [0, 10, 2]),
    (7, "Plant-Based Paradise", "Best vegetarian and vegan eats in NYC", True, [4, 5, 9]),
    (8, "Comfort Food Classics", "Warm, cozy, soul-satisfying meals", True, [14, 12, 11, 3]),
    (9, "Dessert First", "Life is short. Eat dessert first.", True, [2, 9, 15, 8]),
]

# ---------------------------------------------------------------------------
# Comments: (commenter_idx, review_idx, text)
# ---------------------------------------------------------------------------

COMMENTS = [
    (1, 0, "That toro is next level! Going back this weekend."),
    (2, 0, "Totally agree. Nakazawa is a master of his craft."),
    (5, 0, "The uni there rivals anything I had in Tsukiji."),
    (0, 7, "Adding Jua to my list ASAP. Thanks for the rec!"),
    (3, 7, "Their banchan alone is worth a visit."),
    (9, 10, "That lobster dish haunts my dreams."),
    (2, 10, "Ripert deserves all his stars. Twice."),
    (0, 15, "Dhamaka changed how I think about Indian food."),
    (8, 15, "The seekh kebab is insane. Go hungry."),
    (4, 20, "Tatiana on a Sunday morning is therapy."),
    (6, 20, "The cocktails there are too good. Be careful."),
    (7, 27, "Those baked beans are genius. Going tomorrow."),
    (0, 27, "Best vegetarian spot in the city, hands down."),
    (1, 30, "Ippudo at midnight is a whole vibe."),
    (5, 23, "Llama Inn's pisco sour is dangerously good."),
    (3, 16, "Adda is my happy place. The keema pav is everything."),
    (9, 1, "The cacio e pepe at Via Carota is unforgettable."),
    (6, 25, "Mel's at 2am — this is the way."),
    (8, 31, "That biryani description made me hungry. Going now."),
    (4, 11, "Marco knows his pasta. Via Carota is elite."),
]


# ---------------------------------------------------------------------------
# Occasion Tags: (slug, label, emoji, category)
# ---------------------------------------------------------------------------
OCCASION_TAGS = [
    ("date-night", "Date Night", "\u2764\uFE0F", "social"),
    ("group-dinner", "Group Dinner", "\U0001F46B", "social"),
    ("solo-dining", "Solo Dining", "\U0001F9D1", "social"),
    ("family-friendly", "Family Friendly", "\U0001F468\u200D\U0001F469\u200D\U0001F467", "social"),
    ("business-meal", "Business Meal", "\U0001F4BC", "social"),
    ("brunch", "Brunch", "\U0001F950", "time"),
    ("late-night", "Late Night", "\U0001F319", "time"),
    ("happy-hour", "Happy Hour", "\U0001F378", "time"),
    ("lunch-break", "Lunch Break", "\u2615", "time"),
    ("celebration", "Celebration", "\U0001F389", "vibe"),
    ("casual-hangout", "Casual Hangout", "\U0001F919", "vibe"),
    ("special-occasion", "Special Occasion", "\u2728", "vibe"),
    ("outdoor-dining", "Outdoor Dining", "\U0001F33F", "vibe"),
    ("comfort-food", "Comfort Food", "\U0001F917", "vibe"),
    ("adventurous", "Adventurous", "\U0001F9ED", "vibe"),
    ("instagram-worthy", "Instagram Worthy", "\U0001F4F8", "vibe"),
]

# ---------------------------------------------------------------------------
# Venue Occasions: (venue_idx, occasion_slug, vote_count)
# ---------------------------------------------------------------------------
VENUE_OCCASIONS = [
    (0, "date-night", 12), (0, "special-occasion", 8), (0, "celebration", 5),
    (1, "casual-hangout", 15), (1, "lunch-break", 10), (1, "group-dinner", 6),
    (2, "special-occasion", 18), (2, "celebration", 14), (2, "business-meal", 9),
    (3, "casual-hangout", 12), (3, "lunch-break", 8), (3, "comfort-food", 7),
    (4, "casual-hangout", 10), (4, "lunch-break", 7),
    (5, "group-dinner", 11), (5, "adventurous", 9), (5, "date-night", 5),
    (6, "brunch", 16), (6, "celebration", 8), (6, "group-dinner", 7),
    (7, "brunch", 12), (7, "casual-hangout", 6), (7, "instagram-worthy", 8),
    (8, "brunch", 14), (8, "family-friendly", 10), (8, "comfort-food", 8),
    (9, "date-night", 15), (9, "special-occasion", 10), (9, "celebration", 7),
    (10, "date-night", 13), (10, "special-occasion", 11), (10, "adventurous", 6),
    (11, "late-night", 14), (11, "casual-hangout", 9),
    (12, "family-friendly", 8), (12, "comfort-food", 7), (12, "casual-hangout", 6),
    (13, "date-night", 9), (13, "happy-hour", 7),
    (14, "late-night", 11), (14, "comfort-food", 10), (14, "casual-hangout", 8),
    (15, "date-night", 13), (15, "special-occasion", 8), (15, "happy-hour", 6),
]

# ---------------------------------------------------------------------------
# Dietary Reports: (venue_idx, user_idx, category, is_available)
# ---------------------------------------------------------------------------
DIETARY_REPORTS = [
    (4, 7, "vegetarian", True),  # Superiority Burger — vegetarian
    (4, 0, "vegetarian", True),
    (4, 7, "vegan", True),
    (5, 3, "halal", True),  # Dhamaka
    (5, 8, "halal", True),
    (5, 7, "vegetarian", True),
    (9, 7, "vegetarian", True),  # Via Carota
    (9, 2, "gluten-free", True),
    (1, 3, "gluten-free", True),  # Los Tacos
    (8, 4, "vegetarian", True),  # Russ & Daughters
    (12, 3, "halal", True),  # Adda
    (12, 8, "vegetarian", True),
    (7, 7, "vegetarian", True),  # Thai Diner
    (7, 7, "vegan", True),
]


# ---------------------------------------------------------------------------
# Challenge cover images
# ---------------------------------------------------------------------------
CHALLENGE_COVERS = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",  # food spread
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",  # fine dining
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=400&fit=crop",  # burger
]


# ---------------------------------------------------------------------------
# Seasonal Highlights: (venue_idx, dish_name, season, description, photo_url, start_date, end_date)
# ---------------------------------------------------------------------------
SEASONAL_HIGHLIGHTS = [
    (9, "Spring Pea Crostini", "spring", "Fresh English peas on grilled bread with ricotta and mint. A Via Carota springtime staple.", FOOD_PHOTOS[6], "2026-03-01", "2026-05-31"),
    (2, "Ramp Butter Lobster", "spring", "Le Bernardin's seasonal lobster with foraged ramps and spring vegetables.", FOOD_PHOTOS[11], "2026-03-15", "2026-05-15"),
    (7, "Mango Sticky Rice", "summer", "Thai Diner's tropical summer dessert with coconut cream.", FOOD_PHOTOS[17], "2026-06-01", "2026-08-31"),
    (0, "Summer Omakase", "summer", "Nakazawa's special summer selection featuring seasonal fish from Tsukiji.", FOOD_PHOTOS[0], "2026-06-01", "2026-08-31"),
    (5, "Pumpkin Curry", "fall", "Dhamaka's slow-cooked pumpkin curry with autumn spices and freshly baked naan.", FOOD_PHOTOS[9], "2026-09-01", "2026-11-30"),
    (15, "Truffle Pasta", "fall", "L'Artusi's handmade pappardelle with shaved black truffle and brown butter.", FOOD_PHOTOS[19], "2026-10-01", "2026-12-15"),
    (14, "Winter Miso Ramen", "winter", "Ippudo's limited winter miso tonkotsu with roasted garlic oil.", FOOD_PHOTOS[3], "2025-12-01", "2026-02-28"),
    (12, "Lamb Nihari", "winter", "Adda's warming lamb nihari stew, slow-cooked overnight with winter spices.", FOOD_PHOTOS[9], "2025-12-01", "2026-03-31"),
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
            VenueRatingSnapshot.objects.all().delete()
            VenueSimilarity.objects.all().delete()
            DietaryReport.objects.all().delete()
            VenueOccasion.objects.all().delete()
            OccasionTag.objects.all().delete()
            Dish.objects.all().delete()
            Notification.objects.all().delete()
            Comment.objects.all().delete()
            ReviewLike.objects.all().delete()
            Review.objects.all().delete()
            PlaylistItem.objects.all().delete()
            Playlist.objects.all().delete()
            Follow.objects.all().delete()
            Venue.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        # --- Users ---
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

        # --- Follows: build a realistic social graph ---
        # Each user follows 3-5 others, with some mutual follows
        follow_pairs = set()
        import random
        random.seed(42)  # deterministic
        for i in range(len(users)):
            num_follows = random.randint(3, min(5, len(users) - 1))
            targets = random.sample(
                [j for j in range(len(users)) if j != i], num_follows
            )
            for t in targets:
                follow_pairs.add((i, t))

        follow_count = 0
        for follower_idx, following_idx in follow_pairs:
            _, created = Follow.objects.get_or_create(
                follower=users[follower_idx], following=users[following_idx]
            )
            if created:
                follow_count += 1
        self.stdout.write(f"  Follows: {follow_count}")

        # --- Venues ---
        venues = []
        for data in VENUES:
            v, _ = Venue.objects.get_or_create(name=data["name"], defaults=data)
            venues.append(v)
        self.stdout.write(f"  Venues: {len(venues)}")

        # --- Reviews (with dates spread across months for timeline data) ---
        from datetime import timedelta
        from django.utils import timezone

        import random
        random.seed(42)

        # Spread reviews across the last 10 months for timeline richness
        now = timezone.now()
        review_dates = []
        for i in range(len(REVIEWS)):
            months_ago = random.randint(0, 9)
            day_offset = random.randint(0, 27)
            review_date = now - timedelta(days=months_ago * 30 + day_offset)
            review_dates.append(review_date)

        review_objs = []
        for idx, (user_idx, venue_idx, rating, text, dish_name, tags, photo_idx) in enumerate(REVIEWS):
            # Create or get the Dish object for this review
            dish_obj = None
            if dish_name:
                dish_obj, _ = Dish.objects.get_or_create(
                    venue=venues[venue_idx],
                    name=dish_name,
                    defaults={"category": "main"},
                )

            r, created = Review.objects.get_or_create(
                user=users[user_idx],
                venue=venues[venue_idx],
                defaults={
                    "rating": rating,
                    "text": text,
                    "dish_name": dish_name,
                    "dish": dish_obj,
                    "tags": tags,
                    "photo_url": FOOD_PHOTOS[photo_idx % len(FOOD_PHOTOS)],
                },
            )
            # Backdate the created_at for timeline data
            if created:
                Review.objects.filter(pk=r.pk).update(created_at=review_dates[idx])
                r.refresh_from_db()
            review_objs.append(r)
        self.stdout.write(f"  Reviews: {len(review_objs)}")

        # --- Update dish ratings and review counts ---
        from django.db.models import Avg, Count

        for dish in Dish.objects.all():
            agg = dish.reviews.aggregate(avg=Avg("rating"), cnt=Count("id"))
            dish.avg_rating = agg["avg"] or Decimal("0")
            dish.review_count = agg["cnt"]
            dish.save(update_fields=["avg_rating", "review_count"])
        self.stdout.write(f"  Dishes updated: {Dish.objects.count()}")

        # --- Update venue ratings and review counts ---
        for v in venues:
            agg = v.reviews.aggregate(avg=Avg("rating"), cnt=Count("id"))
            v.rating = agg["avg"] or Decimal("0")
            v.reviews_count = agg["cnt"]
            v.save(update_fields=["rating", "reviews_count"])

        # --- Likes: each user likes reviews from people they follow ---
        import random
        random.seed(42)
        like_count = 0
        for u_idx, u in enumerate(users):
            following_ids = Follow.objects.filter(follower=u).values_list(
                "following_id", flat=True
            )
            candidate_reviews = list(
                Review.objects.filter(user_id__in=following_ids)
                .exclude(user=u)
                .values_list("id", flat=True)
            )
            num_likes = min(len(candidate_reviews), random.randint(3, 7))
            to_like = random.sample(candidate_reviews, num_likes)
            for review_id in to_like:
                _, created = ReviewLike.objects.get_or_create(
                    user=u, review_id=review_id
                )
                if created:
                    like_count += 1
        self.stdout.write(f"  Likes: {like_count}")

        # Update like counts
        for r in Review.objects.all():
            r.like_count = r.likes.count()
            r.save(update_fields=["like_count"])

        # --- Comments ---
        comment_count = 0
        for user_idx, review_idx, text in COMMENTS:
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

        # --- Playlists ---
        playlist_count = 0
        for user_idx, title, desc, is_public, venue_indices in PLAYLISTS:
            p, created = Playlist.objects.get_or_create(
                user=users[user_idx],
                title=title,
                defaults={"description": desc, "visibility": "public" if is_public else "private"},
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

        # --- Update follower/following counts ---
        for u in users:
            u.followers_count = u.follower_set.count()
            u.following_count = u.following_set.count()
            u.save(update_fields=["followers_count", "following_count"])

        # --- Notifications ---
        notif_count = 0
        for like in ReviewLike.objects.select_related("user", "review__user")[:15]:
            _, created = Notification.objects.get_or_create(
                recipient=like.review.user,
                notification_type="like",
                text=f"{like.user.name} liked your review",
                related_object_id=like.review.id,
            )
            if created:
                notif_count += 1

        for follow in Follow.objects.select_related("follower", "following")[:15]:
            _, created = Notification.objects.get_or_create(
                recipient=follow.following,
                notification_type="follow",
                text=f"{follow.follower.name} started following you",
                related_object_id=follow.follower.id,
            )
            if created:
                notif_count += 1

        for comment in Comment.objects.select_related("user", "review__user")[:10]:
            if comment.user != comment.review.user:
                _, created = Notification.objects.get_or_create(
                    recipient=comment.review.user,
                    notification_type="comment",
                    text=f'{comment.user.name} commented: "{comment.text[:50]}"',
                    related_object_id=comment.review.id,
                )
                if created:
                    notif_count += 1
        self.stdout.write(f"  Notifications: {notif_count}")

        # --- Occasion Tags ---
        occasion_tags = {}
        for slug, label, emoji, category in OCCASION_TAGS:
            tag, _ = OccasionTag.objects.get_or_create(
                slug=slug,
                defaults={"label": label, "emoji": emoji, "category": category},
            )
            occasion_tags[slug] = tag
        self.stdout.write(f"  Occasion Tags: {len(occasion_tags)}")

        # --- Venue Occasions ---
        vo_count = 0
        for venue_idx, occasion_slug, vote_count in VENUE_OCCASIONS:
            VenueOccasion.objects.get_or_create(
                venue=venues[venue_idx],
                occasion=occasion_tags[occasion_slug],
                defaults={"vote_count": vote_count},
            )
            vo_count += 1
        self.stdout.write(f"  Venue Occasions: {vo_count}")

        # --- Dietary Reports ---
        dr_count = 0
        for venue_idx, user_idx, category, is_available in DIETARY_REPORTS:
            DietaryReport.objects.get_or_create(
                venue=venues[venue_idx],
                user=users[user_idx],
                category=category,
                scope="venue",
                defaults={"is_available": is_available},
            )
            dr_count += 1
        self.stdout.write(f"  Dietary Reports: {dr_count}")

        # --- Challenges ---
        from datetime import timedelta
        from django.utils import timezone

        now = timezone.now()
        challenges_data = [
            {
                "title": "Cuisine Explorer",
                "description": "Try 5 different cuisines this month. Expand your palate and discover new flavors from around the world.",
                "rules": "Each review must be at a venue with a different cuisine type. Only reviews created during the challenge period count.",
                "cover_image_url": CHALLENGE_COVERS[0],
                "start_date": now - timedelta(days=5),
                "end_date": now + timedelta(days=25),
                "target_count": 5,
                "xp_reward": 500,
                "badge_slug": "cuisine-explorer",
                "status": Challenge.Status.ACTIVE,
            },
            {
                "title": "Hidden Gem Hunter",
                "description": "Review 3 venues with fewer than 5 reviews. Help the community discover new places!",
                "rules": "The venue must have fewer than 5 reviews at the time of your submission. Only new reviews count.",
                "cover_image_url": CHALLENGE_COVERS[1],
                "start_date": now - timedelta(days=3),
                "end_date": now + timedelta(days=27),
                "target_count": 3,
                "xp_reward": 750,
                "badge_slug": "hidden-gem-hunter",
                "status": Challenge.Status.ACTIVE,
            },
            {
                "title": "Photo Foodie",
                "description": "Post 10 reviews with photos this month. Show off those delicious dishes!",
                "rules": "Each review must include at least one photo. Reviews without photos will not count toward this challenge.",
                "cover_image_url": CHALLENGE_COVERS[2],
                "start_date": now - timedelta(days=2),
                "end_date": now + timedelta(days=28),
                "target_count": 10,
                "xp_reward": 1000,
                "badge_slug": "photo-foodie",
                "status": Challenge.Status.ACTIVE,
            },
        ]

        challenge_count = 0
        for cdata in challenges_data:
            _, created = Challenge.objects.get_or_create(
                title=cdata["title"],
                defaults=cdata,
            )
            if created:
                challenge_count += 1
        self.stdout.write(f"  Challenges: {challenge_count}")

        # --- Seasonal Highlights ---
        from datetime import date as dt_date
        sh_count = 0
        for venue_idx, dish_name, season, desc, photo, start, end in SEASONAL_HIGHLIGHTS:
            SeasonalHighlight.objects.get_or_create(
                venue=venues[venue_idx],
                dish_name=dish_name,
                season=season,
                defaults={
                    "description": desc,
                    "photo_url": photo,
                    "start_date": dt_date.fromisoformat(start),
                    "end_date": dt_date.fromisoformat(end),
                    "is_active": True,
                },
            )
            sh_count += 1
        self.stdout.write(f"  Seasonal Highlights: {sh_count}")

        # --- Venue Similarity ---
        from apps.core.management.commands.refresh_venue_similarity import Command as SimCommand
        sim_cmd = SimCommand()
        sim_cmd.stdout = self.stdout
        sim_cmd.style = self.style
        sim_cmd.handle(top_n=10)

        # --- Rating Snapshots (timeline data) ---
        from apps.venues.management.commands.compute_rating_snapshots import Command as SnapshotCmd
        snap_cmd = SnapshotCmd()
        snap_cmd.stdout = self.stdout
        snap_cmd.style = self.style
        snap_cmd.handle(period="month", months=24, clear=True)

        self.stdout.write(self.style.SUCCESS("\nSeed data created successfully!"))
        self.stdout.write(
            f"\nLogin credentials (all users use password: password123):"
        )
        for data in USERS:
            self.stdout.write(f"  {data['email']} — {data['name']}")
