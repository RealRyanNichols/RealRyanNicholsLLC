#!/usr/bin/env python3
"""Deliver approved emergency dispatches through the existing personal X connection."""

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

EXPECTED_ID = "1827897370945761281"
EXPECTED_HANDLE = "realryannichols"


def deliver(client):
    if client.held():
        return {"ok": False, "reason": "held_for_operator_review"}
    row = client.claim()
    if not row:
        return {"ok": True, "posted": False, "reason": "queue_empty"}
    if not 1 <= len(row["body"]) <= 280:
        client.reject(row, "invalid_caption")
        return {"ok": False, "reason": "invalid_caption"}
    try:
        me = client.identity()
        if me.get("id") != EXPECTED_ID or me.get("username", "").lower() != EXPECTED_HANDLE:
            client.reject(row, "account_identity_mismatch")
            return {"ok": False, "reason": "account_identity_mismatch"}
        if not client.authorized(row):
            client.skip(row)
            return {"ok": True, "posted": False, "reason": "authorization_withdrawn"}
    except Exception:
        client.reject(row, "identity_or_authorization_check_failed")
        return {"ok": False, "reason": "identity_or_authorization_check_failed"}
    try:
        result = client.publish(row["body"])
    except HTTPError as error:
        reason = f"x_http_{error.code}"
        if error.code in (400, 401, 402, 403, 429):
            client.reject(row, reason)
        else:
            client.hold(reason)
        return {"ok": False, "reason": reason}
    except Exception:
        client.hold("delivery_ambiguous")
        return {"ok": False, "reason": "delivery_ambiguous"}
    post_id = str((result.get("data") or {}).get("id", ""))
    if not post_id.isdigit():
        client.hold("post_id_missing")
        return {"ok": False, "reason": "post_id_missing"}
    public_url = f"https://x.com/RealRyanNichols/status/{post_id}"
    try:
        client.receipt(row, post_id, public_url)
        client.acknowledge(row, public_url)
    except Exception:
        client.hold("posted_audit_attention")
        return {"ok": False, "posted": True, "url": public_url, "reason": "posted_audit_attention"}
    verified = False
    try:
        post = client.read(post_id)
        expanded = post.get("text", "")
        for entity in (post.get("entities") or {}).get("urls", []):
            expanded = expanded.replace(entity["url"], entity.get("expanded_url", entity["url"]))
        verified = post.get("author_id") == EXPECTED_ID and expanded == row["body"]
    except Exception:
        pass
    return {"ok": True, "posted": True, "url": public_url, "readback_verified": verified}


class ProductionClient:
    def __init__(self):
        sys.path.insert(0, "/opt/rrn-x-poster")
        import poster
        self.poster = poster
        self.env = poster.env()
        self.origin, self.key = poster.supa(self.env)
        self.directory = Path("/var/lib/rrn-deadman-social")
        self.directory.mkdir(mode=0o700, exist_ok=True)

    def rest(self, path, method="GET", data=None):
        request = Request(
            self.origin + "/rest/v1/" + path,
            method=method,
            data=None if data is None else json.dumps(data).encode(),
            headers={"apikey": self.key, "Authorization": "Bearer " + self.key,
                     "Content-Type": "application/json", "Prefer": "return=representation"},
        )
        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode() or "null")

    def held(self):
        return (self.directory / "hold.json").exists()

    def hold(self, reason):
        (self.directory / "hold.json").write_text(json.dumps({"reason": reason, "at": self.now()}))

    def now(self):
        return datetime.now(timezone.utc).isoformat()

    def claim(self):
        rows = self.poster.rpc(self.env, "claim_next_deadman_social_dispatch", {"p_platform": "x"}) or []
        return rows[0] if rows else None

    def identity(self):
        return self.poster.x_call("GET", "/2/users/me").get("data", {})

    def authorized(self, row):
        incidents = self.rest(f"deadman_incidents?id=eq.{row['incident_id']}&select=status,public_release_authorized")
        updates = self.rest(f"deadman_updates?id=eq.{row['update_id']}&select=status,post_id")
        dispatches = self.rest(f"deadman_social_dispatches?id=eq.{row['id']}&select=status")
        return bool(incidents and updates and dispatches and
                    incidents[0]["status"] == "active" and incidents[0]["public_release_authorized"] is True and
                    updates[0]["status"] == "published" and updates[0]["post_id"] == row["post_id"] and
                    dispatches[0]["status"] == "posting")

    def patch(self, row, data):
        return self.rest(f"deadman_social_dispatches?id=eq.{row['id']}&status=in.(posting,skipped)", "PATCH",
                         {**data, "updated_at": self.now()})

    def reject(self, row, reason):
        self.hold(reason)
        self.patch(row, {"status": "failed", "error": reason})

    def skip(self, row):
        self.patch(row, {"status": "skipped", "error": "Authorization withdrawn before delivery."})

    def publish(self, text):
        return self.poster.x_call("POST", "/2/tweets", {"text": text})

    def receipt(self, row, post_id, public_url):
        receipt = {"dispatch_id": row["id"], "post_id": post_id, "url": public_url,
                   "posted_at": self.now(), "body_sha256": hashlib.sha256(row["body"].encode()).hexdigest()}
        (self.directory / f"{row['id']}.json").write_text(json.dumps(receipt, indent=2))

    def acknowledge(self, row, public_url):
        changed = self.patch(row, {"status": "posted", "posted_at": self.now(), "external_url": public_url, "error": None})
        if len(changed or []) != 1:
            raise ValueError("Audit acknowledgement failed.")
        self.rest("deadman_event_log", "POST", {"incident_id": row["incident_id"],
                  "event_type": "social_dispatch_posted", "actor_id": "deadman-x-oauth2",
                  "detail": {"dispatch_id": row["id"], "platform": "x", "external_url": public_url}})

    def read(self, post_id):
        return self.poster.x_call("GET", f"/2/tweets/{post_id}?tweet.fields=author_id,entities").get("data", {})


if __name__ == "__main__":
    outcome = deliver(ProductionClient())
    print(json.dumps(outcome))
    raise SystemExit(0 if outcome.get("ok") else 1)
