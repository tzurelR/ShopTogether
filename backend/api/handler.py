"""REST entry point for the HTTP API. Placeholder until ST-7 adds the router."""

import json


def handler(event, context):
    return {
        "statusCode": 501,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": {"code": "not_implemented", "message": f"{event.get('routeKey')} is not built yet"}}),
    }
