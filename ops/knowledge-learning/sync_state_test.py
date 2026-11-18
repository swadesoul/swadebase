import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bible_sync', Path(__file__).with_name('sync.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.state = Path(self.temp.name) / 'knowledge-sync.json'

    def test_atomic_success_receipt_stays_readable_without_temporary_files(self):
        with patch.object(sync, 'STATE', self.state):
            sync.write_state({'status': 'ok', 'generation': 1})
            sync.write_state({'status': 'ok', 'generation': 2})
        self.assertEqual(json.loads(self.state.read_text()), {'status': 'ok', 'generation': 2})
        self.assertEqual(self.state.stat().st_mode & 0o777, 0o644)
        self.assertEqual(list(Path(self.temp.name).iterdir()), [self.state])

    def test_failure_replaces_old_success_without_leaking_exception_details(self):
        self.state.write_text('{"status":"ok"}')
        output = io.StringIO()
        with patch.object(sync, 'STATE', self.state), patch.object(sync, 'DRY', False), patch.object(sync, 'run', side_effect=RuntimeError('synthetic-private-value')), contextlib.redirect_stdout(output):
            self.assertEqual(sync.main(), 0)
        report = json.loads(self.state.read_text())
        self.assertEqual(report['status'], 'failed')
        self.assertEqual(report['reason'], 'RuntimeError')
        self.assertIn('time_utc', report)
        self.assertEqual(report['paid_calls'], 0)
        self.assertNotIn('synthetic-private-value', self.state.read_text() + output.getvalue())

    def test_dry_run_failure_does_not_replace_live_receipt(self):
        before = '{"status":"ok","source":"previous"}'
        self.state.write_text(before)
        with patch.object(sync, 'STATE', self.state), patch.object(sync, 'DRY', True), patch.object(sync, 'run', side_effect=RuntimeError('fixture')), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(sync.main(), 1)
        self.assertEqual(self.state.read_text(), before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
