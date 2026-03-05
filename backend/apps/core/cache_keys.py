class CacheKeys:
    """Centralized cache key definitions.

    Every cache key in the application should be defined here.
    When migrating from LocMemCache to Redis, nothing changes except settings.
    """

    VERSION = "v1"

    # --- Feeds ---
    @staticmethod
    def user_feed(user_id, cursor="first"):
        return f"v1:feed:user:{user_id}:cursor:{cursor}"

    @staticmethod
    def user_feed_pattern(user_id):
        return f"v1:feed:user:{user_id}:*"

    # --- Venues ---
    @staticmethod
    def venue_detail(venue_id):
        return f"v1:venue:{venue_id}:detail"

    @staticmethod
    def venue_reviews(venue_id, page=1):
        return f"v1:venue:{venue_id}:reviews:page:{page}"

    # --- Users ---
    @staticmethod
    def user_profile(user_id):
        return f"v1:user:{user_id}:profile"

    # --- Search ---
    @staticmethod
    def search_results(query_hash):
        return f"v1:search:{query_hash}"
