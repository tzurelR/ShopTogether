"""Errors a route can raise. The router turns each one into {"error": {"code", "message"}}."""


class ApiError(Exception):
    status = 400
    code = "bad_request"

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class BadRequest(ApiError):
    status = 400
    code = "bad_request"


class ValidationError(BadRequest):
    code = "validation_error"


class Unauthorized(ApiError):
    status = 401
    code = "unauthorized"


class Forbidden(ApiError):
    status = 403
    code = "forbidden"


class NotFound(ApiError):
    status = 404
    code = "not_found"


class Conflict(ApiError):
    status = 409
    code = "conflict"


class NotImplementedRoute(ApiError):
    status = 501
    code = "not_implemented"
