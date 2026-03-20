import logging

security_logger = logging.getLogger("delectable.security")


def log_login_failure(email, ip_address):
    security_logger.warning("LOGIN_FAILED email=%s ip=%s", email, ip_address)


def log_login_success(user_id, ip_address):
    security_logger.info("LOGIN_SUCCESS user=%s ip=%s", user_id, ip_address)


def log_permission_denied(user_id, path, ip_address):
    security_logger.warning("PERMISSION_DENIED user=%s path=%s ip=%s", user_id, path, ip_address)


def log_rate_limit_hit(user_id, scope, ip_address):
    security_logger.warning("RATE_LIMIT_HIT user=%s scope=%s ip=%s", user_id, scope, ip_address)


def log_account_deleted(user_id, ip_address):
    security_logger.info("ACCOUNT_DELETED user=%s ip=%s", user_id, ip_address)
