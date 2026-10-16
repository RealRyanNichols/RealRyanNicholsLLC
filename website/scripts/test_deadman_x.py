import importlib.util
import unittest
from pathlib import Path
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location("deadman_x", Path(__file__).with_name("dispatch-deadman-x.py"))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class FakeClient:
    def __init__(self):
        self.row = {"id": "dispatch-1", "body": "Approved public bulletin."}
        self.me = {"id": worker.EXPECTED_ID, "username": "RealRyanNichols"}
        self.permitted = True
        self.sent = 0
        self.calls = []
        self.hold_reason = None
        self.error = None
        self.ack_error = False
        self.response = {"data": {"id": "12345"}}

    def held(self):
        return self.hold_reason is not None

    def claim(self):
        self.calls.append("claim")
        row, self.row = self.row, None
        return row

    def identity(self):
        return self.me

    def authorized(self, row):
        return self.permitted

    def hold(self, reason):
        self.hold_reason = reason

    def reject(self, row, reason):
        self.calls.append("reject")
        self.hold(reason)

    def skip(self, row):
        self.calls.append("skip")

    def publish(self, text):
        self.sent += 1
        self.calls.append("publish")
        if self.error:
            raise self.error
        return self.response

    def receipt(self, row, post_id, url):
        self.calls.append("receipt")

    def acknowledge(self, row, url):
        self.calls.append("acknowledge")
        if self.ack_error:
            raise OSError("database unavailable")

    def read(self, post_id):
        return {"author_id": worker.EXPECTED_ID, "text": "Approved public bulletin."}


class DeliveryTests(unittest.TestCase):
    def test_delivery_records_receipt_before_acknowledging_and_reads_back(self):
        client = FakeClient()
        result = worker.deliver(client)
        self.assertTrue(result["posted"])
        self.assertTrue(result["readback_verified"])
        self.assertLess(client.calls.index("receipt"), client.calls.index("acknowledge"))
        worker.deliver(client)
        self.assertEqual(client.sent, 1)

    def test_wrong_account_never_publishes(self):
        client = FakeClient()
        client.me["id"] = "other-account"
        self.assertEqual(worker.deliver(client)["reason"], "account_identity_mismatch")
        self.assertEqual(client.sent, 0)
        self.assertTrue(client.held())

    def test_reversal_before_delivery_skips_the_post(self):
        client = FakeClient()
        client.permitted = False
        self.assertEqual(worker.deliver(client)["reason"], "authorization_withdrawn")
        self.assertIn("skip", client.calls)
        self.assertEqual(client.sent, 0)

    def test_ambiguous_timeout_is_held_without_acknowledgement_or_retry(self):
        client = FakeClient()
        client.error = TimeoutError()
        self.assertEqual(worker.deliver(client)["reason"], "delivery_ambiguous")
        worker.deliver(client)
        self.assertEqual(client.sent, 1)
        self.assertNotIn("acknowledge", client.calls)

    def test_audit_failure_preserves_delivery_id_and_never_reposts(self):
        client = FakeClient()
        client.ack_error = True
        result = worker.deliver(client)
        self.assertTrue(result["posted"])
        self.assertEqual(result["url"], "https://x.com/RealRyanNichols/status/12345")
        self.assertIn("receipt", client.calls)
        worker.deliver(client)
        self.assertEqual(client.sent, 1)

    def test_known_rejection_holds_future_delivery(self):
        client = FakeClient()
        client.error = HTTPError("https://api.x.com/2/tweets", 403, "Forbidden", {}, None)
        self.assertEqual(worker.deliver(client)["reason"], "x_http_403")
        self.assertIn("reject", client.calls)
        self.assertTrue(client.held())

    def test_missing_post_id_is_held_for_reconciliation(self):
        client = FakeClient()
        client.response = {"data": {}}
        self.assertEqual(worker.deliver(client)["reason"], "post_id_missing")
        self.assertNotIn("acknowledge", client.calls)


if __name__ == "__main__":
    unittest.main()
