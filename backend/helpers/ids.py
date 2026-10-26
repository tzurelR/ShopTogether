"""ULIDs: 26-char, time-sortable IDs (48-bit ms timestamp + 80 random bits, Crockford base32).

Monotonic within a Lambda instance: two IDs made in the same millisecond still sort
in creation order, because the second one reuses the random part plus one.
"""

import os
import threading
import time

_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
_MAX_RANDOM = (1 << 80) - 1

_lock = threading.Lock()
_last_ms = -1
_last_random = 0


def _encode(value: int, length: int) -> str:
    chars = []
    for _ in range(length):
        value, rem = divmod(value, 32)
        chars.append(_ALPHABET[rem])
    return "".join(reversed(chars))


def new_id(now_ms: int | None = None) -> str:
    global _last_ms, _last_random
    timestamp = time.time_ns() // 1_000_000 if now_ms is None else now_ms
    with _lock:
        if timestamp <= _last_ms and _last_random < _MAX_RANDOM:
            timestamp, randomness = _last_ms, _last_random + 1
        else:
            randomness = int.from_bytes(os.urandom(10), "big")
        _last_ms, _last_random = timestamp, randomness
    return _encode(timestamp, 10) + _encode(randomness, 16)
