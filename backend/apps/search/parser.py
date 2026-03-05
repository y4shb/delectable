"""
Smart search parser — pure regex extraction for structured search queries.
No external dependencies.
"""

import re


CUISINE_PATTERNS = [
    "japanese", "italian", "american", "european", "experimental",
    "chinese", "korean", "thai", "indian", "mexican", "french",
    "peruvian", "mediterranean", "vietnamese", "brazilian",
]

OCCASION_PATTERNS = {
    "date night": "date-night",
    "date": "date-night",
    "group dinner": "group-dinner",
    "group": "group-dinner",
    "brunch": "brunch",
    "late night": "late-night",
    "late-night": "late-night",
    "business": "business-meal",
    "business meal": "business-meal",
    "solo": "solo-dining",
    "solo dining": "solo-dining",
    "family": "family-friendly",
    "family friendly": "family-friendly",
    "celebration": "celebration",
    "birthday": "celebration",
    "happy hour": "happy-hour",
    "outdoor": "outdoor-dining",
    "outdoor dining": "outdoor-dining",
}

DIETARY_PATTERNS = [
    "vegan", "vegetarian", "gluten-free", "gluten free",
    "halal", "kosher", "dairy-free", "dairy free",
    "nut-free", "nut free",
]

RADIUS_PATTERNS = [
    (r"nearby", 1000),
    (r"within\s+(\d+)\s*km", None),  # dynamic
    (r"within\s+(\d+)\s*mi(?:les?)?", None),  # dynamic (miles)
    (r"(\d+)\s*km\s+(?:from|away|radius)", None),
]


def parse_search_query(query: str) -> dict:
    """
    Parse a natural-language search query and extract structured filters.

    Returns:
        {
            "cuisine": str | None,
            "occasion": str | None,  (slug)
            "dietary": list[str],
            "radius_meters": int | None,
            "remaining_text": str,
        }
    """
    text = query.lower().strip()
    result = {
        "cuisine": None,
        "occasion": None,
        "dietary": [],
        "radius_meters": None,
        "remaining_text": text,
    }

    # Extract cuisine
    for cuisine in CUISINE_PATTERNS:
        pattern = r"\b" + re.escape(cuisine) + r"\b"
        if re.search(pattern, text):
            result["cuisine"] = cuisine
            text = re.sub(pattern, "", text).strip()
            break

    # Extract occasion (longest match first)
    for phrase, slug in sorted(OCCASION_PATTERNS.items(), key=lambda x: -len(x[0])):
        pattern = r"\b" + re.escape(phrase) + r"\b"
        if re.search(pattern, text):
            result["occasion"] = slug
            text = re.sub(pattern, "", text).strip()
            break

    # Extract dietary
    for diet in DIETARY_PATTERNS:
        pattern = r"\b" + re.escape(diet) + r"\b"
        if re.search(pattern, text):
            normalized = diet.replace(" ", "-")
            result["dietary"].append(normalized)
            text = re.sub(pattern, "", text).strip()

    # Extract radius
    if re.search(r"\bnearby\b", text):
        result["radius_meters"] = 1000
        text = re.sub(r"\bnearby\b", "", text).strip()
    else:
        km_match = re.search(r"within\s+(\d+)\s*km", text)
        if km_match:
            result["radius_meters"] = int(km_match.group(1)) * 1000
            text = re.sub(r"within\s+\d+\s*km", "", text).strip()
        else:
            mi_match = re.search(r"within\s+(\d+)\s*mi(?:les?)?", text)
            if mi_match:
                result["radius_meters"] = int(float(mi_match.group(1)) * 1609)
                text = re.sub(r"within\s+\d+\s*mi(?:les?)?", "", text).strip()

    # Clean remaining text
    text = re.sub(r"\s+", " ", text).strip()
    # Remove dangling prepositions
    text = re.sub(r"^(for|in|at|near|with)\s+", "", text).strip()
    text = re.sub(r"\s+(for|in|at|near|with)$", "", text).strip()

    result["remaining_text"] = text

    return result
