#!/usr/bin/env python3
"""Invoke the existing release worker without exposing its credential in arguments."""

import http.client
import json
import os
import sys


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ("release", "social"):
        raise SystemExit("Expected release or social worker.")
    secret = (os.environ.get("DEADMAN_CRON_SECRET") or os.environ.get("CRON_SECRET") or "").strip()
    if not secret:
        raise SystemExit("Deadman worker authentication is not configured.")
    connection = http.client.HTTPConnection("127.0.0.1", 3103, timeout=90)
    try:
        connection.request(
            "POST",
            f"/api/cron/deadman-{sys.argv[1]}",
            headers={"Host": "realryannichols.com", "Authorization": f"Bearer {secret}"},
        )
        response = connection.getresponse()
        if response.status != 200:
            raise SystemExit(f"Deadman worker returned HTTP {response.status}.")
        result = json.loads(response.read(65536))
        if result.get("ok") is not True:
            raise SystemExit("Deadman worker did not confirm completion.")
        print(json.dumps({key: result[key] for key in ("ok", "active", "released", "reason") if key in result}))
    finally:
        connection.close()


if __name__ == "__main__":
    main()
