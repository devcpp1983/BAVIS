# BAVIS — Data Workstream Makefile
# Convenience targets for database migrations, seeding, and MinIO setup.
# Works on Linux/macOS. Windows users: run the python commands directly or use WSL.

.PHONY: help install migrate downgrade seed reset minio-setup clean check

# ─── Config ───────────────────────────────────────────────────────────────────
PYTHON     ?= python
PIP        ?= pip
ENV_FILE   ?= .env

# ─── Default ──────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "BAVIS Data Workstream — available targets:"
	@echo ""
	@echo "  make install       Install Python dependencies from requirements.txt"
	@echo "  make migrate       Run all pending Alembic migrations (creates tables)"
	@echo "  make downgrade     Roll back the last Alembic migration"
	@echo "  make seed          Populate the database with demo / fixture data"
	@echo "  make reset         Wipe seed data and re-insert (clean demo reset)"
	@echo "  make minio-setup   Create MinIO bucket and apply retention policy"
	@echo "  make check         Verify DB connection and list tables"
	@echo "  make clean         Remove Python cache files"
	@echo ""

# ─── Install ──────────────────────────────────────────────────────────────────
install:
	$(PIP) install -r requirements.txt

# ─── Migrations ───────────────────────────────────────────────────────────────
migrate:
	@echo "[bavis] Running Alembic migrations…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		alembic upgrade head
	@echo "[bavis] ✅ Migrations complete."

downgrade:
	@echo "[bavis] Rolling back last migration…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		alembic downgrade -1
	@echo "[bavis] Downgrade done."

# ─── Seed data ────────────────────────────────────────────────────────────────
seed:
	@echo "[bavis] Seeding database with demo data…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		$(PYTHON) seeds/seed.py
	@echo "[bavis] ✅ Seed complete."

reset:
	@echo "[bavis] Resetting seed data (wipe + re-insert)…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		$(PYTHON) seeds/seed.py --reset
	@echo "[bavis] ✅ Reset complete."

# ─── MinIO ────────────────────────────────────────────────────────────────────
minio-setup:
	@echo "[bavis] Setting up MinIO evidence storage…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		$(PYTHON) minio_setup/setup_buckets.py
	@echo "[bavis] ✅ MinIO setup complete."

# ─── Check ────────────────────────────────────────────────────────────────────
check:
	@echo "[bavis] Checking database connection and listing tables…"
	@set -a && . ./$(ENV_FILE) && set +a && \
		$(PYTHON) -c "\
import os; \
from sqlalchemy import create_engine, inspect; \
e = create_engine(os.environ['DATABASE_URL']); \
insp = inspect(e); \
tables = insp.get_table_names(); \
print('Connected to:', e.url.render_as_string(hide_password=True)); \
print('Tables:', tables if tables else '(none yet — run: make migrate)'); \
"

# ─── Clean ────────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
