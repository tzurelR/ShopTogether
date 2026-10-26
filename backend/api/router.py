"""Matches the HTTP API routeKey to a handler and turns errors into JSON responses."""

import logging

from helpers.auth import current_user
from helpers.errors import ApiError, NotImplementedRoute
from helpers.request import Handler, Request
from helpers.responses import error, from_api_error

logger = logging.getLogger(__name__)


def dispatch(event: dict, request_id: str, routes: dict[str, Handler]) -> dict:
    route_key = event.get("routeKey", "")
    try:
        route = routes.get(route_key)
        if route is None:
            raise NotImplementedRoute(f"{route_key} is not built yet.")
        return route(Request(event=event, user=current_user(event), request_id=request_id))
    except ApiError as err:
        logger.info("%s -> %s %s: %s", route_key, err.status, err.code, err.message)
        return from_api_error(err)
    except Exception:
        logger.exception("Unhandled error in %s (request %s)", route_key, request_id)
        return error(500, "internal_error", f"Something went wrong. Request ID: {request_id}")
