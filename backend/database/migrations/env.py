import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from core.config import get_settings  # noqa: E402
from database import models  # noqa: E402  (registers all models on Base.metadata)
from database.session import Base  # noqa: E402

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The sync driver (psycopg2/psycopg) isn't installed — asyncpg only — so
# force the async URL regardless of what's in alembic.ini.
config.set_main_option("sqlalchemy.url", get_settings().database_url)

target_metadata = Base.metadata


PRISMA_SCHEMA = "auth"
# Prisma's own migration-tracking table lives in `public` regardless of the
# `schemas` setting in schema.prisma, and Alembic's own version table can
# show up in a schema-aware autogenerate diff too — exclude both by name in
# addition to excluding everything under the `auth` schema.
NON_DOMAIN_TABLES = {"_prisma_migrations", "alembic_version"}


def include_object(object, name, type_, reflected, compare_to):
    if type_ != "table":
        return True
    # Everything in the `auth` schema (i.e. `users`) is owned by Prisma
    # (frontend) — never let Alembic create, alter, or drop it. `User` is
    # declared in database/models.py only so SQLAlchemy can build foreign
    # keys/relationships against it.
    if getattr(object, "schema", None) == PRISMA_SCHEMA:
        return False
    if name in NON_DOMAIN_TABLES:
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
        include_schemas=True,
        version_table_schema="public",
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
