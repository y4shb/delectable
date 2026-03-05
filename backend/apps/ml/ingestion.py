"""Data ingestion pipeline for venue seeding from external sources."""

import logging
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.venues.models import Venue

from .models import VenueIngestion

logger = logging.getLogger(__name__)


class GooglePlacesIngestion:
    """Ingestion service for Google Places API."""

    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    def __init__(self):
        self.api_key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: int = 5000,
        place_type: str = "restaurant",
    ) -> list:
        """
        Search for nearby places.
        In production, this would call the Google Places API.
        """
        # Placeholder for API call
        # response = requests.get(
        #     f"{self.BASE_URL}/nearbysearch/json",
        #     params={
        #         "location": f"{latitude},{longitude}",
        #         "radius": radius,
        #         "type": place_type,
        #         "key": self.api_key,
        #     }
        # )
        # return response.json().get("results", [])

        logger.info(
            f"GooglePlacesIngestion.search_nearby called: "
            f"lat={latitude}, lng={longitude}, radius={radius}"
        )
        return []

    def get_place_details(self, place_id: str) -> Optional[dict]:
        """
        Get detailed information for a place.
        In production, this would call the Google Places API.
        """
        # Placeholder for API call
        logger.info(f"GooglePlacesIngestion.get_place_details called: place_id={place_id}")
        return None

    def ingest_place(self, place_data: dict) -> Optional[Venue]:
        """Transform Google Places data and create/update venue."""
        place_id = place_data.get("place_id")
        if not place_id:
            return None

        with transaction.atomic():
            # Check for existing ingestion
            existing = VenueIngestion.objects.filter(
                source=VenueIngestion.Source.GOOGLE_PLACES,
                external_id=place_id,
            ).first()

            if existing and existing.venue:
                # Update existing venue
                venue = existing.venue
                self._update_venue_from_place(venue, place_data)
                venue.save()
            else:
                # Create new venue
                venue = self._create_venue_from_place(place_data)

            # Record ingestion
            VenueIngestion.objects.update_or_create(
                source=VenueIngestion.Source.GOOGLE_PLACES,
                external_id=place_id,
                defaults={
                    "venue": venue,
                    "raw_data": place_data,
                    "processed": True,
                    "quality_score": self._calculate_data_quality(place_data),
                    "processed_at": timezone.now(),
                },
            )

            return venue

    def _create_venue_from_place(self, place_data: dict) -> Venue:
        """Create a new Venue from Google Places data."""
        return Venue.objects.create(
            name=place_data.get("name", "Unknown"),
            cuisine_type=self._extract_cuisine(place_data),
            location_text=place_data.get("vicinity", ""),
            city=self._extract_city(place_data),
            latitude=place_data.get("geometry", {}).get("location", {}).get("lat"),
            longitude=place_data.get("geometry", {}).get("location", {}).get("lng"),
            rating=place_data.get("rating", 0),
            photo_url=self._extract_photo_url(place_data),
            google_place_id=place_data.get("place_id"),
        )

    def _update_venue_from_place(self, venue: Venue, place_data: dict):
        """Update existing venue with Google Places data."""
        venue.name = place_data.get("name", venue.name)
        venue.location_text = place_data.get("vicinity", venue.location_text)
        if place_data.get("rating"):
            # Blend ratings
            venue.rating = (float(venue.rating) + float(place_data["rating"])) / 2

    def _extract_cuisine(self, place_data: dict) -> str:
        """Extract cuisine type from place types."""
        types = place_data.get("types", [])
        cuisine_mapping = {
            "italian_restaurant": "Italian",
            "japanese_restaurant": "Japanese",
            "chinese_restaurant": "Chinese",
            "mexican_restaurant": "Mexican",
            "indian_restaurant": "Indian",
            "thai_restaurant": "Thai",
            "french_restaurant": "French",
            "american_restaurant": "American",
            "pizza_restaurant": "Pizza",
            "seafood_restaurant": "Seafood",
            "sushi_restaurant": "Japanese",
            "cafe": "Cafe",
            "bakery": "Bakery",
            "bar": "Bar",
        }
        for t in types:
            if t in cuisine_mapping:
                return cuisine_mapping[t]
        return "Restaurant"

    def _extract_city(self, place_data: dict) -> str:
        """Extract city from address components."""
        components = place_data.get("address_components", [])
        for comp in components:
            if "locality" in comp.get("types", []):
                return comp.get("long_name", "")
        return ""

    def _extract_photo_url(self, place_data: dict) -> str:
        """Extract photo URL from place data."""
        photos = place_data.get("photos", [])
        if photos and self.api_key:
            photo_ref = photos[0].get("photo_reference")
            if photo_ref:
                return (
                    f"{self.BASE_URL}/photo?"
                    f"maxwidth=800&photo_reference={photo_ref}&key={self.api_key}"
                )
        return ""

    def _calculate_data_quality(self, place_data: dict) -> float:
        """Calculate data quality score for ingested place."""
        score = 0.5

        if place_data.get("name"):
            score += 0.1
        if place_data.get("rating"):
            score += 0.1
        if place_data.get("photos"):
            score += 0.1
        if place_data.get("formatted_address") or place_data.get("vicinity"):
            score += 0.1
        if place_data.get("opening_hours"):
            score += 0.1

        return min(score, 1.0)


def run_ingestion_pipeline(
    latitude: float,
    longitude: float,
    radius: int = 5000,
) -> dict:
    """Run full ingestion pipeline for a location."""
    ingestion = GooglePlacesIngestion()

    results = {
        "searched": 0,
        "ingested": 0,
        "updated": 0,
        "errors": 0,
    }

    places = ingestion.search_nearby(latitude, longitude, radius)
    results["searched"] = len(places)

    for place_data in places:
        try:
            place_id = place_data.get("place_id")
            existing = VenueIngestion.objects.filter(
                source=VenueIngestion.Source.GOOGLE_PLACES,
                external_id=place_id,
            ).exists()

            venue = ingestion.ingest_place(place_data)
            if venue:
                if existing:
                    results["updated"] += 1
                else:
                    results["ingested"] += 1
        except Exception as e:
            logger.error(f"Error ingesting place: {e}")
            results["errors"] += 1

    return results


def validate_ingested_data():
    """Validate quality of ingested data."""
    low_quality = VenueIngestion.objects.filter(
        quality_score__lt=0.5,
        processed=True,
    )

    results = {
        "total_ingested": VenueIngestion.objects.filter(processed=True).count(),
        "low_quality_count": low_quality.count(),
        "unprocessed_count": VenueIngestion.objects.filter(processed=False).count(),
    }

    return results
