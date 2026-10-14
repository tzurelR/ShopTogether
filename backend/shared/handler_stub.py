import json
from typing import Any


def not_implemented(name: str) -> dict[str, Any]:
    return {
        "statusCode": 501,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"message": f"{name} not implemented yet"}),
    }
