from __future__ import annotations

from flask import jsonify, request


def wants_json_response() -> bool:
    if request.is_json:
        return True

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return True

    accept = request.accept_mimetypes
    return accept["application/json"] >= accept["text/html"]


def api_response(success: bool, message: str, data: dict | list | None = None, status_code: int = 200, **extra):
    payload = {"success": success, "message": message}
    if data is not None:
        payload["data"] = data
    payload.update(extra)
    return jsonify(payload), status_code
