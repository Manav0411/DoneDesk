from __future__ import annotations

import os

from app import create_app, socketio
from app.extensions import db

app = create_app()

# Allow skipping automatic DB creation on startup (useful when remote DB is unreachable)
skip_db_create = os.getenv("SKIP_DB_CREATE", "0").lower() in ("1", "true", "yes")
if not skip_db_create:
    with app.app_context():
        try:
            db.create_all()
        except Exception as exc:  # pragma: no cover - runtime guard
            print("Warning: db.create_all() failed:", exc)
            print(
                "If this is expected (e.g. remote Postgres unavailable), set SKIP_DB_CREATE=1 to skip creating the DB on startup."
            )
else:
    print("SKIP_DB_CREATE set; skipping db.create_all() on startup")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
