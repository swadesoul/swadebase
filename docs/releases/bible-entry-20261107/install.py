#!/usr/bin/env python3
"""Scoped installer for the already authorized Bible-entry release."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, shutil, subprocess, tempfile

STAGE = Path('/opt/swadebase-staging/bible-entry-20261107')
RUNTIME = Path('/opt/swadebase/ops/mcp')
OPS = Path('/opt/swadebase/ops/knowledge-learning')
HOOK = Path('/etc/systemd/system/sssbrain-guardian.service.d/guardian-knowledge-index.conf')
EXPECTED = {
    'service.mjs': 'd61686df3bca577e4b4bfa779eaebfcd280d4b9122abb494ece2a7df74da5cc0',
    'protocol.mjs': '0be6decf758bac46266538babf241a1b90fa0c1054e7844e321955773cad7767',
    'route.mjs': 'a4663306274074d0b04be5bb04cbac6c29f34bc017ac38d09f88453805833802',
    'knowledge.mjs': 'f68766a5cda085df990d41999eefae1f843d74cd108a9afd7b0dbf297140defd',
    'entry-context.mjs': None,
    'core.test.mjs': '525601df027928745064137a74bd8e994e50c29f4aef62fe25c5fe347051d7cb',
    'protocol.test.mjs': '731af03afac6cccd03fdda773bf73629d4711b50acff1dee3507fdafd59647ca',
    'knowledge.test.mjs': 'cb6bd29bc4b468f6bb275b10ef252f3d8ff9e2a586adbf1c25f405790a929605',
    'native-knowledge.test.mjs': 'b33807c3006d102b4cee76e8ec6e0f93c3c147464467c9a53db29d885e5682e1',
    'studio-routes.test.mjs': '0facbb6b4a8788fe4de513daed8b69665602f05ff3b76a6b5900865855d35004',
    'entry-context.test.mjs': None,
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def command(args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError('service_or_syntax_check_failed')
    return result.stdout.strip()

def replace(source, target, metadata=None):
    with tempfile.NamedTemporaryFile(dir=target.parent, prefix='.bible-entry-', delete=False) as stream:
        temporary = Path(stream.name)
        try:
            stream.write(source.read_bytes()); stream.flush(); os.fsync(stream.fileno())
            os.fchmod(stream.fileno(), (metadata.st_mode & 0o777) if metadata else 0o644)
            if metadata:
                os.fchown(stream.fileno(), metadata.st_uid, metadata.st_gid)
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    try:
        os.replace(temporary, target)
    finally:
        temporary.unlink(missing_ok=True)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--deploy', action='store_true')
    parser.add_argument('--source-commit', required=True)
    args = parser.parse_args()
    assert args.deploy and os.geteuid() == 0
    assert len(args.source_commit) == 40 and all(c in '0123456789abcdef' for c in args.source_commit)
    locks = [line for line in Path('/opt/swadebase/docs/DEPLOY_LOCK.md').read_text().splitlines() if line.strip() and not line.lstrip().startswith('#')]
    assert len(locks) == 1 and '| chatgpt-bible-entry-20261107 |' in locks[0], 'deployment_lock_changed'
    assert command(['systemctl', 'is-active', 'swadebase-adapters.service']) == 'active'
    assert command(['systemctl', 'is-active', 'sssbrain-guardian.timer']) == 'active'
    assert sha(OPS/'ALLOWLIST.txt') == '42fdd8c9ac0b765e5dd3cd37270fb4fe7baa17d1f440647ea1c558219eef07d2'
    planned = [(STAGE/'runtime'/name, RUNTIME/name, expected) for name, expected in EXPECTED.items()]
    planned += [
        (STAGE/'knowledge-learning/sync.py', OPS/'sync.py', '21b934136e938cc77cb7dbb4a97dfb3c154f5062618340e3401a422169d16036'),
        (STAGE/'knowledge-learning/sync_state_test.py', OPS/'sync_state_test.py', None),
        (STAGE/'knowledge-learning/guardian-knowledge-index.conf', HOOK, None),
    ]
    for source, target, expected in planned:
        assert source.is_file() and not source.is_symlink()
        assert not target.is_symlink()
        assert (target.is_file() and sha(target) == expected) if expected else not target.exists(), 'baseline_changed:'+str(target)
    for name in EXPECTED:
        command(['node', '--check', str(STAGE/'runtime'/name)])
    protected = [Path('/etc/systemd/system/sssbrain-guardian.service'), Path('/etc/systemd/system/sssbrain-guardian.timer'), Path('/etc/systemd/system/sssbrain-guardian.service.d/abagale-merch-observer.conf')]
    before = {str(path): sha(path) for path in protected}
    backup = Path('/opt/swadebase/backups')/('bible-entry-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(mode=0o700)
    records = []
    for source, target, expected in planned:
        previous = backup/target.relative_to('/')
        metadata = target.stat() if target.exists() else None
        if metadata:
            previous.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(target, previous)
            os.chown(previous, metadata.st_uid, metadata.st_gid)
        records.append({'path': str(target), 'before_sha256': expected, 'sha256': sha(source), 'backup_path': str(previous) if metadata else None})
    manifest = {'source_commit': args.source_commit, 'backup': str(backup), 'files': records, 'protected_hashes': before, 'status': 'prepared'}
    (backup/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    changed = []
    try:
        for source, target, expected in planned:
            metadata = target.stat() if target.exists() else None
            replace(source, target, metadata); changed.append(target)
        command(['systemctl', 'daemon-reload'])
        command(['systemctl', 'restart', 'swadebase-adapters.service'])
        assert command(['systemctl', 'is-active', 'swadebase-adapters.service']) == 'active'
        assert command(['systemctl', 'is-active', 'sssbrain-guardian.timer']) == 'active'
        assert {str(path): sha(path) for path in protected} == before, 'existing_guardian_changed'
        for item in records:
            assert sha(Path(item['path'])) == item['sha256']
        manifest.update(status='installed', installed_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), automatic_scheduled_run='pending_verification')
    except BaseException:
        for target in reversed(changed):
            previous = backup/target.relative_to('/')
            if previous.exists():
                replace(previous, target, previous.stat())
            else:
                target.unlink(missing_ok=True)
        command(['systemctl', 'daemon-reload'])
        command(['systemctl', 'restart', 'swadebase-adapters.service'])
        manifest['status'] = 'rolled_back_after_install_failure'
        (backup/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
        raise
    (backup/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (STAGE/'deployed.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(json.dumps({'status': manifest['status'], 'source_commit': args.source_commit, 'backup': str(backup), 'files_verified': len(records), 'existing_guardian_unchanged': True, 'scheduled_run': 'pending_verification'}))

if __name__ == '__main__':
    main()
