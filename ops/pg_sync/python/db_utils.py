from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict
from urllib.parse import parse_qsl, unquote, urlparse

import psycopg
from psycopg import sql


def load_env_file(env_path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        values[key] = value
    return values


def ensure_env(repo_root: Path) -> None:
    env_file = repo_root / ".env.local"
    for key, value in load_env_file(env_file).items():
        if key not in os.environ:
            os.environ[key] = value


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is missing. Set it in .env.local.")
    return url


def get_database_config(database_url: str | None = None) -> Dict[str, Any]:
    url = database_url or get_database_url()
    parsed = urlparse(url)

    if parsed.scheme not in {"postgres", "postgresql"}:
        raise RuntimeError("DATABASE_URL must use the postgres:// or postgresql:// scheme.")

    dbname = unquote(parsed.path.lstrip("/"))
    if not dbname:
        raise RuntimeError("DATABASE_URL must include a database name.")

    config: Dict[str, Any] = {"dbname": dbname}

    if parsed.hostname:
        config["host"] = parsed.hostname
    if parsed.port:
        config["port"] = parsed.port
    if parsed.username:
        config["user"] = unquote(parsed.username)
    if parsed.password is not None:
        config["password"] = unquote(parsed.password)

    schema_name = None
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        if key == "schema" and value:
            schema_name = value

    # Prisma-style schema=public is not a libpq parameter, so translate it to search_path.
    if schema_name:
        config["options"] = f"-c search_path={schema_name}"

    return config


def connect_db(*, dbname: str | None = None, autocommit: bool = False):
    config = get_database_config()
    if dbname is not None:
        config["dbname"] = dbname

    conn = psycopg.connect(**config)
    conn.autocommit = autocommit
    return conn


def ensure_database_exists(*, admin_db: str = "postgres") -> str:
    target_config = get_database_config()
    target_db = str(target_config["dbname"])
    admin_config = dict(target_config)
    admin_config["dbname"] = admin_db

    with psycopg.connect(**admin_config) as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s",
                (target_db,),
            )
            if cur.fetchone():
                print(f"[sql-sync] database already exists: {target_db}")
                return target_db

            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target_db)))
            print(f"[sql-sync] created database: {target_db}")

    return target_db
