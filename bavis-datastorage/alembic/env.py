"""
Alembic env.py for BAVIS — Data Workstream
Reads DATABASE_URL from environment / .env file.
"""

from logging.config import fileConfig
import os
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# ─── Load .env ────────────────────────────────────────────────────────────────
_env_file = Path(__file__).resolve().parent.parent / ".env"
if _env_file.exists():
    load_dotenv(_env_file)

# ─── Import all models so Alembic can detect them ─────────────────────────────
# This import MUST happen before target_metadata is set.
from models import Base  # noqa: E402 — must be after load_dotenv

# ─── Alembic config ───────────────────────────────────────────────────────────
config = context.config

# Inject DATABASE_URL from environment into the alembic config
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set.\n"
        "Copy .env.example → .env and fill in your PostgreSQL credentials."
    )
config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


# ─── Migration functions ──────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection needed)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the DB)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
