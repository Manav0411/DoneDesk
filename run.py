from __future__ import annotations

import os

from app import create_app, socketio
from app.extensions import db

app = create_app()

with app.app_context():
    db.create_all()


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
