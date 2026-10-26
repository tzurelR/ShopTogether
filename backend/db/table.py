"""The single DynamoDB table. Clients are created lazily and reused across warm invocations."""

import os
from functools import cache

import boto3
from boto3.dynamodb.types import TypeSerializer
from botocore.exceptions import ClientError

_serializer = TypeSerializer()

BATCH_GET_LIMIT = 100
TRANSACT_LIMIT = 100


@cache
def resource():
    return boto3.resource("dynamodb")


@cache
def table():
    return resource().Table(os.environ["TABLE_NAME"])


@cache
def client():
    return boto3.client("dynamodb")


def is_condition_failure(err: ClientError) -> bool:
    code = err.response.get("Error", {}).get("Code")
    return code in ("ConditionalCheckFailedException", "TransactionCanceledException")


def query_all(**kwargs) -> list[dict]:
    """Query and follow LastEvaluatedKey until every page is read."""
    items: list[dict] = []
    while True:
        page = table().query(**kwargs)
        items.extend(page.get("Items", []))
        if "LastEvaluatedKey" not in page:
            return items
        kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]


def batch_get(keys: list[dict]) -> list[dict]:
    """BatchGetItem in chunks of 100, retrying unprocessed keys. Missing keys are skipped."""
    name = table().name
    found: list[dict] = []
    for start in range(0, len(keys), BATCH_GET_LIMIT):
        request = {name: {"Keys": keys[start : start + BATCH_GET_LIMIT]}}
        while request:
            page = resource().batch_get_item(RequestItems=request)
            found.extend(page.get("Responses", {}).get(name, []))
            request = page.get("UnprocessedKeys") or None
    return found


def batch_delete(keys: list[dict]) -> None:
    with table().batch_writer() as writer:
        for k in keys:
            writer.delete_item(Key=k)


# ---------- transactions (low-level client, so values must be serialized) ----------

def _serialize(item: dict) -> dict:
    return {k: _serializer.serialize(v) for k, v in item.items()}


def tx_put(item: dict, condition: str | None = None) -> dict:
    op: dict = {"TableName": table().name, "Item": _serialize(item)}
    if condition:
        op["ConditionExpression"] = condition
    return {"Put": op}


def tx_delete(key: dict) -> dict:
    return {"Delete": {"TableName": table().name, "Key": _serialize(key)}}


def transact_write(ops: list[dict]) -> None:
    if len(ops) > TRANSACT_LIMIT:
        raise ValueError(f"A transaction takes at most {TRANSACT_LIMIT} operations, got {len(ops)}.")
    client().transact_write_items(TransactItems=ops)
