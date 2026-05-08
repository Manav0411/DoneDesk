from __future__ import annotations

from flask import Flask, jsonify, redirect, request, url_for

from config import Config

from .extensions import cors, db, login_manager, migrate, socketio


def create_app(config_object: type[Config] | str = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cors.init_app(app)
    socketio.init_app(
        app,
        async_mode=app.config.get("SOCKETIO_ASYNC_MODE", "eventlet"),
        cors_allowed_origins=app.config.get("SOCKETIO_CORS_ALLOWED_ORIGINS", "*"),
    )

    login_manager.login_view = "auth.login_page"
    login_manager.login_message_category = "warning"

    from .models import User  # noqa: F401
    from .routes.analytics_routes import analytics_bp
    from .routes.auth_routes import auth_bp
    from .routes.task_routes import tasks_bp
    from . import sockets  # noqa: F401

    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(analytics_bp)

    @login_manager.unauthorized_handler
    def unauthorized_handler():
        if request.path.startswith(("/tasks", "/analytics")) or request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify({"success": False, "message": "Authentication required."}), 401
        return redirect(url_for("auth.login_page"))

    @app.errorhandler(404)
    def not_found(_error):
        if request.path.startswith(("/tasks", "/analytics")) or request.accept_mimetypes["application/json"] >= request.accept_mimetypes["text/html"]:
            return jsonify({"success": False, "message": "Resource not found."}), 404
        return redirect(url_for("auth.dashboard")) if request.path != "/" else redirect(url_for("auth.login_page"))

    @app.errorhandler(500)
    def internal_error(_error):
        if request.path.startswith(("/tasks", "/analytics")) or request.accept_mimetypes["application/json"] >= request.accept_mimetypes["text/html"]:
            return jsonify({"success": False, "message": "An unexpected error occurred."}), 500
        return jsonify({"success": False, "message": "An unexpected error occurred."}), 500

    return app
