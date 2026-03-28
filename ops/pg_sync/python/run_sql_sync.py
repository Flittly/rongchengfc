from __future__ import annotations

import argparse
from pathlib import Path

from db_utils import connect_db, ensure_database_exists, ensure_env


def run_sql_file(sql_file: Path) -> None:
    sql = sql_file.read_text(encoding="utf-8")
    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply SQL files for PG sync toolkit.")
    parser.add_argument(
        "--include-bootstrap",
        action="store_true",
        help="Create the target database from DATABASE_URL before applying SQL files.",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[3]
    ensure_env(repo_root)

    sql_dir = repo_root / "ops" / "pg_sync" / "sql"
    sql_files = sorted(sql_dir.glob("*.sql"))
    sql_files = [f for f in sql_files if not f.name.startswith("00_")]

    if args.include_bootstrap:
        ensure_database_exists()

    if not sql_files:
        print("No SQL files found.")
        return

    for sql_file in sql_files:
        print(f"[sql-sync] applying {sql_file.name}")
        run_sql_file(sql_file)
    print("[sql-sync] done")


if __name__ == "__main__":
    main()
