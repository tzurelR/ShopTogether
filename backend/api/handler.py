"""Lambda entry point for every REST route of the HTTP API."""

import logging

from api.router import dispatch
from routes import ROUTES

logging.getLogger().setLevel(logging.INFO)


def handler(event, context):
    request_id = getattr(context, "aws_request_id", "local")
    return dispatch(event, request_id, ROUTES)
