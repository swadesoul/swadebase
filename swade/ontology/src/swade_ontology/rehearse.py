"""Rehearse the isolated migration inside a transaction that always rolls back."""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

from .config import database_name


MIGRATION_PATH = Path(__file__).resolve().parents[2] / "migrations" / "001_swade_ontology.sql"
_COMMIT = re.compile(r"(?im)^\s*commit\b")
_VECTOR = re.compile(r"(?i)\bpgvector\b|\bcreate\s+extension\s+.*\bvector\b")


class RehearsalError(RuntimeError):
    """The migration must not be applied."""


class RecordingConnection:
    """Stand-in connection used by tests and by check-only runs."""

    def __init__(self) -> None:
        self.statements: list[str] = []
        self.committed = False

    def execute(self, sql: str) -> None:
        if sql.strip().upper() == "COMMIT":
            self.committed = True
        self.statements.append(sql)

    def close(self) -> None:
        return None


def validate_sql(sql_text: str) -> None:
    if _COMMIT.search(sql_text):
        raise RehearsalError("migration file must not commit")
    if _VECTOR.search(sql_text):
        raise RehearsalError("migration must not install pgvector")
    if "swade_ontology" not in sql_text:
        raise RehearsalError("migration must stay in the swade_ontology schema")


def rehearse(sql_text: str, connection: RecordingConnection, database: str) -> None:
    if database != "swade_ontology":
        raise RehearsalError(f"refusing database {database}")
    validate_sql(sql_text)
    connection.execute("BEGIN")
    connection.execute(sql_text)
    connection.execute("ROLLBACK")
    if connection.committed:
        raise RehearsalError("rehearsal committed; that is not allowed")


def main(argv: list[str] | None = None, env: dict[str, str] | None = None) -> int:
    del argv
    source = env if env is not None else dict(**__import__("os").environ)
    sql_text = MIGRATION_PATH.read_text(encoding="utf-8")
    try:
        validate_sql(sql_text)
    except RehearsalError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    url = (source.get("SWADE_ONTOLOGY_DATABASE_URL") or "").strip()
    if not url:
        print("rehearsal check only; no database url; nothing applied")
        return 0
    name = database_name(url)
    if name != "swade_ontology":
        print(f"refusing to connect to database {name}", file=sys.stderr)
        return 2
    psql = shutil.which("psql")
    if psql is None:
        print("psql is not installed; refusing to connect", file=sys.stderr)
        return 2
    script = "BEGIN;\n" + sql_text + "\nROLLBACK;\n"
    if "COMMIT" in script.upper().split("ROLLBACK")[0]:
        print("refusing to rehearse a script that commits", file=sys.stderr)
        return 2
    completed = subprocess.run(
        [psql, url, "-v", "ON_ERROR_STOP=1"],
        input=script,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        print("rehearsal failed and was not committed", file=sys.stderr)
        return completed.returncode
    print("rehearsed and rolled back; nothing applied")
    return 0
