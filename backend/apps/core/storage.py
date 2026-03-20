"""S3 presigned URL generation for direct browser uploads."""

import os
import time
import uuid

import boto3
from botocore.config import Config
from django.conf import settings


def _get_s3_client():
    """Return a boto3 S3 client configured from Django settings."""
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION_NAME,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )


def _build_object_key(file_name: str, folder: str = "uploads") -> str:
    """
    Build a collision-free S3 object key.

    Format: {folder}/{uuid}_{timestamp}.{ext}
    """
    _, ext = os.path.splitext(file_name)
    ext = ext.lower()
    unique_id = uuid.uuid4().hex[:12]
    timestamp = int(time.time())
    return f"{folder}/{unique_id}_{timestamp}{ext}"


def _get_public_url(key: str) -> str:
    """Return the public URL for an S3 object, using CloudFront if configured."""
    if settings.AWS_S3_CUSTOM_DOMAIN:
        return f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}"
    return (
        f"https://{settings.AWS_STORAGE_BUCKET_NAME}"
        f".s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{key}"
    )


def generate_presigned_upload_url(
    file_name: str,
    content_type: str,
    folder: str = "uploads",
) -> dict:
    """
    Generate an S3 presigned POST URL for direct browser upload.

    Returns a dict with:
      - uploadUrl: the S3 endpoint to POST to
      - fields: form fields to include in the multipart POST
      - fileUrl: the final public URL of the uploaded object
      - key: the S3 object key
    """
    client = _get_s3_client()
    key = _build_object_key(file_name, folder)

    conditions = [
        ["content-length-range", 1, settings.UPLOAD_MAX_FILE_SIZE],
        {"Content-Type": content_type},
    ]

    presigned = client.generate_presigned_post(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
        Fields={"Content-Type": content_type},
        Conditions=conditions,
        ExpiresIn=300,  # 5 minutes
    )

    return {
        "uploadUrl": presigned["url"],
        "fields": presigned["fields"],
        "fileUrl": _get_public_url(key),
        "key": key,
    }


def generate_presigned_download_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned GET URL for a private S3 object.

    Args:
        key: The S3 object key.
        expires_in: URL expiry in seconds (default 1 hour).

    Returns:
        A presigned URL string.
    """
    client = _get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=expires_in,
    )
