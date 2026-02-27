import base64
import json

from rest_framework.pagination import CursorPagination, PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Default offset-based pagination for list endpoints."""

    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100


class FeedCursorPagination(CursorPagination):
    """Cursor-based pagination for feeds, reviews, notifications.

    Uses (created_at, id) as cursor for stable pagination.
    """

    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 50
    ordering = "-created_at"

    def get_paginated_response(self, data):
        next_link = self.get_next_link()
        # Extract cursor from the full URL
        next_cursor = None
        if next_link:
            from urllib.parse import parse_qs, urlparse

            parsed = urlparse(next_link)
            cursor_values = parse_qs(parsed.query).get("cursor")
            if cursor_values:
                next_cursor = cursor_values[0]

        return Response(
            {
                "data": data,
                "pagination": {
                    "next_cursor": next_cursor,
                    "has_more": next_link is not None,
                    "limit": self.page_size,
                },
            }
        )
