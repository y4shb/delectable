from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Custom exception handler that returns consistent error format."""
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "error": {
                "code": _get_error_code(response.status_code),
                "message": _get_error_message(response.data),
                "status": response.status_code,
            }
        }

        # Include field-level validation details
        if response.status_code == 400 and isinstance(response.data, dict):
            details = []
            for field, messages in response.data.items():
                if field == "detail":
                    error_data["error"]["message"] = str(messages)
                    continue
                if isinstance(messages, list):
                    for msg in messages:
                        details.append({"field": field, "message": str(msg)})
                else:
                    details.append({"field": field, "message": str(messages)})
            if details:
                error_data["error"]["details"] = details

        response.data = error_data

    return response


def _get_error_code(status_code):
    codes = {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        429: "RATE_LIMITED",
    }
    return codes.get(status_code, "ERROR")


def _get_error_message(data):
    if isinstance(data, dict):
        detail = data.get("detail")
        if detail:
            return str(detail)
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."
